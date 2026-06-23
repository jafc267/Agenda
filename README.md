# 📋 Agenda — Guia de Deploy

Stack: **Python/Flask** (Render) + **HTML/CSS/JS** (Vercel) + **Supabase**

---

## 1. Configurar o Supabase

1. Acesse [supabase.com](https://supabase.com) e crie um projeto
2. No painel, vá em **SQL Editor** e execute o conteúdo de `supabase_setup.sql`
3. Copie as credenciais em **Project Settings → API**:
   - `Project URL` → `SUPABASE_URL`
   - `anon public` key → `SUPABASE_KEY`

---

## 2. Deploy do Backend no Render

1. Suba a pasta `backend/` para um repositório GitHub
2. Acesse [render.com](https://render.com) → **New Web Service**
3. Conecte o repositório e configure:
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `gunicorn app:app`
4. Em **Environment Variables**, adicione:
   ```
   SUPABASE_URL = https://xxxx.supabase.co
   SUPABASE_KEY = sua_chave_anon
   SECRET_KEY   = qualquer_string_segura_aqui
   ```
5. Copie a URL gerada (ex: `https://agenda-backend.onrender.com`)

---

## 3. Configurar o Frontend

Edite `frontend/config.js` e substitua a URL:

```js
const CONFIG = {
  API_URL: "https://agenda-backend.onrender.com", // ← sua URL do Render
};
```

---

## 4. Deploy do Frontend no Vercel

1. Suba a pasta `frontend/` para um repositório GitHub
2. Acesse [vercel.com](https://vercel.com) → **New Project**
3. Importe o repositório → clique em **Deploy**
4. Pronto! O Vercel detecta automaticamente o `vercel.json`

---

## 5. Login

| Campo | Valor          |
|-------|----------------|
| Email | admin@admin.com |
| Senha | admin123       |

---

## Estrutura do Projeto

```
agenda/
├── backend/
│   ├── app.py           # API Flask
│   ├── requirements.txt
│   ├── render.yaml      # Config do Render
│   └── .env.example
├── frontend/
│   ├── index.html       # Tela de Login
│   ├── dashboard.html   # Dashboard
│   ├── style.css
│   ├── app.js
│   ├── config.js        # ← edite a URL da API aqui
│   └── vercel.json
└── supabase_setup.sql   # Execute no Supabase
```

## Endpoints da API

| Método | Rota                    | Descrição              |
|--------|-------------------------|------------------------|
| POST   | `/api/login`            | Autenticar             |
| GET    | `/api/contatos`         | Listar (alfabético)    |
| POST   | `/api/contatos`         | Criar contato          |
| PUT    | `/api/contatos/:id`     | Atualizar contato      |
| DELETE | `/api/contatos/:id`     | Remover contato        |
