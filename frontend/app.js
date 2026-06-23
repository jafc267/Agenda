/* ════════════════════════════════════════
   AGENDA — app.js
   Gerencia login, dashboard e CRUD
   ════════════════════════════════════════ */

const API = CONFIG.API_URL;
const IS_DASHBOARD = document.body.classList.contains("dashboard-page");
const IS_LOGIN     = document.body.classList.contains("login-page");

/* ── Token ───────────────────────────── */
const Auth = {
  getToken: () => localStorage.getItem("agenda_token"),
  getEmail: () => localStorage.getItem("agenda_email"),
  set: (token, email) => {
    localStorage.setItem("agenda_token", token);
    localStorage.setItem("agenda_email", email);
  },
  clear: () => {
    localStorage.removeItem("agenda_token");
    localStorage.removeItem("agenda_email");
  },
  isLogged: () => !!localStorage.getItem("agenda_token"),
};

/* ── Helpers ─────────────────────────── */
function headers() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${Auth.getToken()}`,
  };
}

function toast(msg, type = "success") {
  const el = document.getElementById("toast");
  if (!el) return;
  el.textContent = msg;
  el.className = `toast toast-${type}`;
  el.classList.remove("hidden");
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.add("hidden"), 3500);
}

function maskPhone(value) {
  return value
    .replace(/\D/g, "")
    .replace(/^(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{4,5})(\d{4})$/, "$1-$2")
    .slice(0, 15);
}

/* ══════════════════════════════════════
   LOGIN PAGE
   ══════════════════════════════════════ */
if (IS_LOGIN) {
  if (Auth.isLogged()) window.location.replace("dashboard.html");

  const form    = document.getElementById("loginForm");
  const errEl   = document.getElementById("loginError");
  const btnText = document.getElementById("loginBtnText");
  const spinner = document.getElementById("loginSpinner");
  const loginBtn= document.getElementById("loginBtn");
  const togglePwd = document.getElementById("togglePassword");
  const pwdInput  = document.getElementById("password");

  togglePwd.addEventListener("click", () => {
    const show = pwdInput.type === "password";
    pwdInput.type = show ? "text" : "password";
    togglePwd.textContent = show ? "🙈" : "👁";
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errEl.classList.add("hidden");
    btnText.textContent = "Entrando…";
    spinner.classList.remove("hidden");
    loginBtn.disabled = true;

    const email    = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    try {
      const res  = await fetch(`${API}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Erro ao fazer login");

      Auth.set(data.token, data.email);
      window.location.replace("dashboard.html");
    } catch (err) {
      errEl.textContent = err.message;
      errEl.classList.remove("hidden");
      btnText.textContent = "Entrar";
      spinner.classList.add("hidden");
      loginBtn.disabled = false;
    }
  });
}

/* ══════════════════════════════════════
   DASHBOARD PAGE
   ══════════════════════════════════════ */
if (IS_DASHBOARD) {
  if (!Auth.isLogged()) window.location.replace("index.html");

  // ── State
  let allContacts = [];
  let deleteTarget = null;

  // ── Elements
  const totalEl       = document.getElementById("totalContatos");
  const tbody         = document.getElementById("contatosBody");
  const table         = document.getElementById("contatosTable");
  const loadingEl     = document.getElementById("tableLoading");
  const emptyEl       = document.getElementById("tableEmpty");
  const searchInput   = document.getElementById("searchInput");
  const modal         = document.getElementById("modal");
  const confirmOverlay= document.getElementById("confirmOverlay");
  const sidebarEmail  = document.getElementById("sidebarEmail");
  const modalTitle    = document.getElementById("modalTitle");
  const contatoForm   = document.getElementById("contatoForm");
  const formError     = document.getElementById("formError");
  const saveBtnText   = document.getElementById("saveBtnText");
  const saveSpinner   = document.getElementById("saveSpinner");
  const saveBtn       = document.getElementById("saveBtn");

  sidebarEmail.textContent = Auth.getEmail() || "admin@admin.com";

  // ── Logout
  document.getElementById("logoutBtn").addEventListener("click", () => {
    Auth.clear();
    window.location.replace("index.html");
  });

  // ── Phone mask
  document.getElementById("telefone").addEventListener("input", (e) => {
    e.target.value = maskPhone(e.target.value);
  });

  // ── Search
  searchInput.addEventListener("input", () => renderTable(allContacts));

  // ── Open modal (new)
  const openModal = () => {
    modalTitle.textContent = "Novo Contato";
    document.getElementById("contatoId").value = "";
    document.getElementById("nome").value = "";
    document.getElementById("contatoEmail").value = "";
    document.getElementById("telefone").value = "";
    formError.classList.add("hidden");
    saveBtnText.textContent = "Salvar";
    modal.classList.remove("hidden");
    document.getElementById("nome").focus();
  };

  document.getElementById("openModalBtn").addEventListener("click", openModal);
  document.getElementById("emptyAddBtn").addEventListener("click", openModal);

  // ── Close modal
  const closeModal = () => modal.classList.add("hidden");
  document.getElementById("closeModalBtn").addEventListener("click", closeModal);
  document.getElementById("cancelModalBtn").addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });

  // ── Load contacts
  async function loadContacts() {
    loadingEl.classList.remove("hidden");
    table.classList.add("hidden");
    emptyEl.classList.add("hidden");

    try {
      const res  = await fetch(`${API}/api/contatos`, { headers: headers() });
      if (res.status === 401) { Auth.clear(); window.location.replace("index.html"); return; }
      const data = await res.json();

      allContacts = data.contatos || [];
      totalEl.textContent = allContacts.length;
      renderTable(allContacts);
    } catch {
      loadingEl.textContent = "Erro ao carregar contatos. Verifique a conexão.";
    }
  }

  function renderTable(contacts) {
    const q = searchInput.value.toLowerCase().trim();
    const filtered = q
      ? contacts.filter(
          (c) =>
            c.nome.toLowerCase().includes(q) ||
            c.email.toLowerCase().includes(q) ||
            c.telefone.includes(q)
        )
      : contacts;

    loadingEl.classList.add("hidden");

    if (filtered.length === 0) {
      table.classList.add("hidden");
      emptyEl.classList.remove("hidden");
      return;
    }

    emptyEl.classList.add("hidden");
    table.classList.remove("hidden");
    tbody.innerHTML = "";

    filtered.forEach((c, i) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td class="td-index">${i + 1}</td>
        <td class="contact-name">${escape(c.nome)}</td>
        <td class="contact-email">${escape(c.email)}</td>
        <td class="contact-phone">${escape(c.telefone)}</td>
        <td>
          <div class="actions-cell">
            <button class="btn-icon" title="Editar" onclick="editContact(${c.id})">✏️</button>
            <button class="btn-icon danger" title="Excluir" onclick="askDelete(${c.id})">🗑️</button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  function escape(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  // ── Edit
  window.editContact = (id) => {
    const c = allContacts.find((x) => x.id === id);
    if (!c) return;
    modalTitle.textContent = "Editar Contato";
    document.getElementById("contatoId").value = c.id;
    document.getElementById("nome").value = c.nome;
    document.getElementById("contatoEmail").value = c.email;
    document.getElementById("telefone").value = c.telefone;
    formError.classList.add("hidden");
    saveBtnText.textContent = "Atualizar";
    modal.classList.remove("hidden");
    document.getElementById("nome").focus();
  };

  // ── Save (create / update)
  contatoForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    formError.classList.add("hidden");
    saveBtn.disabled = true;
    saveSpinner.classList.remove("hidden");

    const id       = document.getElementById("contatoId").value;
    const nome     = document.getElementById("nome").value.trim();
    const email    = document.getElementById("contatoEmail").value.trim();
    const telefone = document.getElementById("telefone").value.trim();
    const method   = id ? "PUT" : "POST";
    const url      = id ? `${API}/api/contatos/${id}` : `${API}/api/contatos`;

    try {
      const res  = await fetch(url, {
        method,
        headers: headers(),
        body: JSON.stringify({ nome, email, telefone }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Erro ao salvar");

      closeModal();
      toast(id ? "Contato atualizado!" : "Contato cadastrado!");
      await loadContacts();
    } catch (err) {
      formError.textContent = err.message;
      formError.classList.remove("hidden");
    } finally {
      saveBtn.disabled = false;
      saveSpinner.classList.add("hidden");
    }
  });

  // ── Delete
  window.askDelete = (id) => {
    deleteTarget = id;
    confirmOverlay.classList.remove("hidden");
  };

  document.getElementById("cancelDeleteBtn").addEventListener("click", () => {
    confirmOverlay.classList.add("hidden");
    deleteTarget = null;
  });

  document.getElementById("confirmDeleteBtn").addEventListener("click", async () => {
    if (!deleteTarget) return;
    confirmOverlay.classList.add("hidden");

    try {
      const res = await fetch(`${API}/api/contatos/${deleteTarget}`, {
        method: "DELETE",
        headers: headers(),
      });
      if (!res.ok) throw new Error("Erro ao excluir");
      toast("Contato removido!", "success");
      await loadContacts();
    } catch {
      toast("Erro ao excluir o contato.", "error");
    } finally {
      deleteTarget = null;
    }
  });

  // ── Init
  loadContacts();
}
