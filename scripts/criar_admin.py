"""Cria o usuário admin do Bolão das IAs.

Email: admin@arenadasias.com.br
Senha: diiriiriid

Marca is_admin=true em raw_app_meta_data (não precisa alterar schema).
Usa Supabase Service Role obtida via Management API (PAT).

Uso:
    .venv/Scripts/python.exe scripts/criar_admin.py
"""

from __future__ import annotations

import json
import os
import urllib.error
import urllib.request

PAT = os.environ.get("SUPABASE_PAT")
if not PAT:
    raise SystemExit(
        "Falta SUPABASE_PAT. Pegue em https://supabase.com/dashboard/account/tokens "
        "e exporte: export SUPABASE_PAT=sbp_..."
    )
PROJECT_REF = "dkrsxsvdihrxmehilohq"
SUPABASE_URL = f"https://{PROJECT_REF}.supabase.co"
ADMIN_EMAIL = "admin@arenadasias.com.br"
ADMIN_SENHA = "diiriiriid"
ADMIN_NOME = "Admin"


def req(method, url, headers, body=None):
    data = json.dumps(body).encode() if body is not None else None
    headers = {
        "User-Agent": "Mozilla/5.0 (compatible; bolao-admin-script/1.0)",
        **headers,
    }
    r = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(r, timeout=30) as resp:
            txt = resp.read().decode()
            return resp.status, json.loads(txt) if txt else {}
    except urllib.error.HTTPError as e:
        txt = e.read().decode()
        try:
            return e.code, json.loads(txt)
        except json.JSONDecodeError:
            return e.code, {"raw": txt}


def get_service_role_key():
    status, resp = req(
        "GET",
        f"https://api.supabase.com/v1/projects/{PROJECT_REF}/api-keys",
        {"Authorization": f"Bearer {PAT}", "Accept": "application/json"},
    )
    if status >= 400:
        raise SystemExit(f"erro ao pegar api-keys: {status} {resp}")
    for k in resp:
        if k.get("name") == "service_role":
            return k["api_key"]
    raise SystemExit(f"service_role não encontrada em {resp}")


def main():
    print("📡 buscando service_role…")
    service_role = get_service_role_key()
    print(f"   ✓ obtida ({service_role[:20]}…)")

    headers = {
        "apikey": service_role,
        "Authorization": f"Bearer {service_role}",
        "Content-Type": "application/json",
    }

    # 1) criar admin user (idempotente: se já existe, pega o id)
    print(f"👤 criando admin {ADMIN_EMAIL}…")
    status, resp = req(
        "POST",
        f"{SUPABASE_URL}/auth/v1/admin/users",
        headers,
        {
            "email": ADMIN_EMAIL,
            "password": ADMIN_SENHA,
            "email_confirm": True,
            "user_metadata": {"display_name": ADMIN_NOME},
            "app_metadata": {"is_admin": True, "role": "admin"},
        },
    )
    if status == 422 and "already" in json.dumps(resp).lower():
        print("   ↻ já existe, atualizando senha+metadata…")
        # encontra pelo email
        status2, list_resp = req(
            "GET",
            f"{SUPABASE_URL}/auth/v1/admin/users?per_page=200",
            headers,
        )
        users = list_resp.get("users", [])
        admin = next((u for u in users if u.get("email") == ADMIN_EMAIL), None)
        if not admin:
            raise SystemExit("não achei admin existente")
        uid = admin["id"]
        status3, upd = req(
            "PUT",
            f"{SUPABASE_URL}/auth/v1/admin/users/{uid}",
            headers,
            {
                "password": ADMIN_SENHA,
                "email_confirm": True,
                "user_metadata": {"display_name": ADMIN_NOME},
                "app_metadata": {"is_admin": True, "role": "admin"},
            },
        )
        if status3 >= 400:
            raise SystemExit(f"update falhou: {status3} {upd}")
        print(f"   ✓ atualizado · id={uid}")
    elif status >= 400:
        raise SystemExit(f"criar admin falhou: {status} {resp}")
    else:
        uid = resp["id"]
        print(f"   ✓ criado · id={uid}")

    # 2) garantir profile (trigger pode criar; force upsert pra ter display_name)
    print("📝 upsert profile…")
    status, resp = req(
        "POST",
        f"{SUPABASE_URL}/rest/v1/profiles?on_conflict=id",
        {
            **headers,
            "Prefer": "resolution=merge-duplicates,return=representation",
        },
        [{"id": uid, "display_name": ADMIN_NOME}],
    )
    if status >= 400:
        print(f"   ⚠️  profile upsert: {status} {resp} (talvez RLS — tudo bem)")
    else:
        print("   ✓ profile ok")

    print()
    print("─" * 50)
    print("✅ Admin pronto:")
    print(f"   email: {ADMIN_EMAIL}")
    print(f"   senha: {ADMIN_SENHA}")
    print(f"   id:    {uid}")
    print("   flag:  app_metadata.is_admin=true")
    print("─" * 50)


if __name__ == "__main__":
    main()
