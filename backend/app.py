from flask import Flask, request, jsonify
from flask_cors import CORS
from supabase import create_client, Client
import os
from dotenv import load_dotenv
import jwt
import datetime
from functools import wraps

load_dotenv(override=False)

app = Flask(__name__)
CORS(app,
     origins=["*"],
     allow_headers=["Content-Type", "Authorization"],
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
     supports_credentials=False)

@app.after_request
def add_cors_headers(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
    return response

SUPABASE_URL = os.environ.get("SUPABASE_URL", "").strip()
SUPABASE_KEY = os.environ.get("SUPABASE_KEY", "").strip()
SECRET_KEY = os.environ.get("SECRET_KEY", "agenda-secret-key-2024").strip()

if not SUPABASE_URL or not SUPABASE_KEY:
    raise RuntimeError(f"Variáveis ausentes: URL={'OK' if SUPABASE_URL else 'FALTANDO'} KEY={'OK' if SUPABASE_KEY else 'FALTANDO'}")

print(f"[INFO] SUPABASE_URL = {SUPABASE_URL}")
print(f"[INFO] SUPABASE_KEY = {SUPABASE_KEY[:20]}...")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

ADMIN_EMAIL = "admin@admin.com"
ADMIN_PASSWORD = "admin123"


def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get("Authorization", "").replace("Bearer ", "")
        if not token:
            return jsonify({"error": "Token ausente"}), 401
        try:
            jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token expirado"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Token inválido"}), 401
        return f(*args, **kwargs)
    return decorated


@app.route("/", methods=["GET"])
def health():
    return jsonify({"status": "ok", "message": "Agenda API rodando!"})


@app.route("/api/login", methods=["POST", "OPTIONS"])
def login():
    if request.method == "OPTIONS":
        return jsonify({}), 200
    data = request.get_json()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if email != ADMIN_EMAIL or password != ADMIN_PASSWORD:
        return jsonify({"error": "Credenciais inválidas"}), 401

    token = jwt.encode(
        {
            "email": email,
            "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=8),
        },
        SECRET_KEY,
        algorithm="HS256",
    )
    return jsonify({"token": token, "email": email})


@app.route("/api/contatos", methods=["GET", "OPTIONS"])
@token_required
def listar_contatos():
    if request.method == "OPTIONS":
        return jsonify({}), 200
    response = (
        supabase.table("contatos")
        .select("*")
        .order("nome", desc=False)
        .execute()
    )
    return jsonify({"contatos": response.data, "total": len(response.data)})


@app.route("/api/contatos", methods=["POST", "OPTIONS"])
@token_required
def criar_contato():
    if request.method == "OPTIONS":
        return jsonify({}), 200
    data = request.get_json()
    nome = data.get("nome", "").strip()
    email = data.get("email", "").strip().lower()
    telefone = data.get("telefone", "").strip()

    if not nome or not email or not telefone:
        return jsonify({"error": "Nome, email e telefone são obrigatórios"}), 400

    existing = supabase.table("contatos").select("id").eq("email", email).execute()
    if existing.data:
        return jsonify({"error": "E-mail já cadastrado"}), 409

    response = (
        supabase.table("contatos")
        .insert({"nome": nome, "email": email, "telefone": telefone})
        .execute()
    )
    return jsonify({"contato": response.data[0]}), 201


@app.route("/api/contatos/<int:contato_id>", methods=["PUT", "OPTIONS"])
@token_required
def atualizar_contato(contato_id):
    if request.method == "OPTIONS":
        return jsonify({}), 200
    data = request.get_json()
    nome = data.get("nome", "").strip()
    email = data.get("email", "").strip().lower()
    telefone = data.get("telefone", "").strip()

    if not nome or not email or not telefone:
        return jsonify({"error": "Nome, email e telefone são obrigatórios"}), 400

    existing = (
        supabase.table("contatos")
        .select("id")
        .eq("email", email)
        .neq("id", contato_id)
        .execute()
    )
    if existing.data:
        return jsonify({"error": "E-mail já usado por outro contato"}), 409

    response = (
        supabase.table("contatos")
        .update({"nome": nome, "email": email, "telefone": telefone})
        .eq("id", contato_id)
        .execute()
    )
    if not response.data:
        return jsonify({"error": "Contato não encontrado"}), 404
    return jsonify({"contato": response.data[0]})


@app.route("/api/contatos/<int:contato_id>", methods=["DELETE", "OPTIONS"])
@token_required
def deletar_contato(contato_id):
    if request.method == "OPTIONS":
        return jsonify({}), 200
    response = (
        supabase.table("contatos").delete().eq("id", contato_id).execute()
    )
    if not response.data:
        return jsonify({"error": "Contato não encontrado"}), 404
    return jsonify({"message": "Contato removido com sucesso"})


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)