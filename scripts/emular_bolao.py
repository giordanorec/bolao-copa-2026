"""Emula fluxo de bolão com 3 usuários: criar conta, criar bolão,
entrar pelo link, palpitar, ver ranking.

Uso:
    .venv/Scripts/python.exe scripts/emular_bolao.py
"""

from __future__ import annotations

import json
import time
import urllib.error
import urllib.parse
import urllib.request

SUPABASE_URL = "https://dkrsxsvdihrxmehilohq.supabase.co"
ANON_KEY = (
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9."
    "eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRrcnN4c3ZkaWhyeG1laGlsb2hxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3ODI3NzksImV4cCI6MjA5NjM1ODc3OX0."
    "1ulz5dbmKv5GXXIEatVAiZpksYOEfh2bnN91wJXwOtA"
)


def _req(
    method: str,
    path: str,
    body: dict | None = None,
    token: str | None = None,
    extra_headers: dict | None = None,
) -> tuple[int, dict]:
    """Requisição HTTP simples retornando (status, json)."""
    url = f"{SUPABASE_URL}{path}"
    headers = {
        "apikey": ANON_KEY,
        "Content-Type": "application/json",
        "Accept": "application/json",
    }
    if token:
        headers["Authorization"] = f"Bearer {token}"
    if extra_headers:
        headers.update(extra_headers)
    data = json.dumps(body).encode("utf-8") if body is not None else None
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            txt = resp.read().decode("utf-8")
            try:
                return resp.status, json.loads(txt) if txt else {}
            except json.JSONDecodeError:
                return resp.status, {"raw": txt}
    except urllib.error.HTTPError as e:
        txt = e.read().decode("utf-8")
        try:
            return e.code, json.loads(txt)
        except json.JSONDecodeError:
            return e.code, {"raw": txt}


def signup(email: str, senha: str, nome: str) -> str | None:
    """Cria conta e retorna access_token."""
    status, resp = _req(
        "POST",
        "/auth/v1/signup",
        {
            "email": email,
            "password": senha,
            "data": {"display_name": nome},
        },
    )
    if status >= 400:
        print(f"  ❌ signup falhou ({status}): {resp.get('msg') or resp}")
        return None
    token = resp.get("access_token")
    if not token:
        # signup pode retornar sem token se confirm email tá on
        print(f"  ⚠️  signup ok mas sem token: {resp.get('user', {}).get('id')}")
        return None
    print(f"  ✓ {nome} criado · token {token[:20]}…")
    return token


def login(email: str, senha: str) -> str | None:
    status, resp = _req(
        "POST",
        "/auth/v1/token?grant_type=password",
        {"email": email, "password": senha},
    )
    if status >= 400:
        print(f"  ❌ login falhou ({status}): {resp.get('error_description') or resp}")
        return None
    return resp.get("access_token")


def perfil_id(token: str) -> str | None:
    status, resp = _req("GET", "/auth/v1/user", token=token)
    if status >= 400:
        print(f"  ❌ get user falhou: {resp}")
        return None
    return resp.get("id")


def criar_bolao(token: str, user_id: str, slug: str, nome: str) -> bool:
    status, resp = _req(
        "POST",
        "/rest/v1/bolao",
        {
            "slug": slug,
            "nome": nome,
            "criador_id": user_id,
        },
        token=token,
        extra_headers={"Prefer": "return=representation"},
    )
    if status >= 400:
        print(f"  ❌ criar bolão falhou ({status}): {resp}")
        return False
    return True


def get_bolao(token: str, slug: str) -> dict | None:
    status, resp = _req("GET", f"/rest/v1/bolao?slug=eq.{slug}", token=token)
    if status >= 400 or not resp:
        return None
    if isinstance(resp, list) and resp:
        return resp[0]
    return None


def entrar_no_bolao(token: str, user_id: str, bolao_id: str) -> bool:
    status, resp = _req(
        "POST",
        "/rest/v1/bolao_membro",
        {"bolao_id": bolao_id, "user_id": user_id},
        token=token,
    )
    if status >= 400:
        print(f"  ❌ entrar bolão falhou ({status}): {resp}")
        return False
    return True


def palpitar(token: str, user_id: str, jogo_numero: int, gols_a: int, gols_b: int) -> bool:
    status, resp = _req(
        "POST",
        "/rest/v1/palpite",
        {
            "user_id": user_id,
            "jogo_numero": jogo_numero,
            "gols_a": gols_a,
            "gols_b": gols_b,
        },
        token=token,
        extra_headers={
            "Prefer": "resolution=merge-duplicates",
        },
    )
    if status >= 400:
        print(f"  ❌ palpitar jogo {jogo_numero} falhou ({status}): {resp}")
        return False
    return True


def listar_membros(token: str, bolao_id: str) -> list:
    status, resp = _req(
        "GET",
        f"/rest/v1/bolao_membro?bolao_id=eq.{bolao_id}&select=user_id,profiles(display_name)",
        token=token,
    )
    if status >= 400:
        return []
    return resp if isinstance(resp, list) else []


def listar_palpites(token: str, user_id: str) -> list:
    status, resp = _req(
        "GET",
        f"/rest/v1/palpite?user_id=eq.{user_id}",
        token=token,
    )
    if status >= 400:
        return []
    return resp if isinstance(resp, list) else []


def main() -> None:
    ts = int(time.time())
    print(f"\n=== EMULAÇÃO FLUXO BOLÃO (timestamp {ts}) ===\n")

    usuarios = [
        ("alice", f"alice-{ts}@gmail.com", "senha123"),
        ("bob", f"bob-{ts}@gmail.com", "senha123"),
        ("carol", f"carol-{ts}@gmail.com", "senha123"),
    ]

    print("[1] Criando 3 contas")
    tokens: dict[str, str] = {}
    user_ids: dict[str, str] = {}
    for nome, email, senha in usuarios:
        token = signup(email, senha, nome)
        if not token:
            token = login(email, senha)  # se já tinha, loga
        if not token:
            print(f"  💥 ABORTANDO — {nome} sem token")
            return
        tokens[nome] = token
        uid = perfil_id(token)
        if not uid:
            print(f"  💥 ABORTANDO — {nome} sem user_id")
            return
        user_ids[nome] = uid

    print("\n[2] Alice cria bolão")
    slug = f"teste-{ts}"
    if not criar_bolao(tokens["alice"], user_ids["alice"], slug, f"Bolão Teste {ts}"):
        return
    bolao = get_bolao(tokens["alice"], slug)
    if not bolao:
        print("  💥 não consegui ler o bolão criado")
        return
    bolao_id = bolao["id"]
    print(f"  ✓ bolão {slug} criado · id {bolao_id[:8]}…")

    print("\n[3] Alice entra como membro do próprio bolão")
    entrar_no_bolao(tokens["alice"], user_ids["alice"], bolao_id)

    print("\n[4] Bob e Carol entram pelo link")
    for nome in ["bob", "carol"]:
        # Acessam o bolão (deveria ser público pra ver)
        b = get_bolao(tokens[nome], slug)
        if not b:
            print(f"  ❌ {nome} não consegue ver o bolão!")
            continue
        print(f"  ✓ {nome} vê o bolão")
        if not entrar_no_bolao(tokens[nome], user_ids[nome], bolao_id):
            print(f"  💥 {nome} não conseguiu entrar")

    print("\n[5] Cada um palpita 5 jogos")
    for nome in ["alice", "bob", "carol"]:
        for jn in range(1, 6):
            a, b = (jn % 4, (jn + 1) % 3)
            palpitar(tokens[nome], user_ids[nome], jn, a, b)
        print(f"  ✓ {nome} palpitou 5 jogos")

    print("\n[6] Verificando ranking")
    membros = listar_membros(tokens["alice"], bolao_id)
    print(f"  Membros do bolão: {len(membros)}")
    for m in membros:
        prof = m.get("profiles", {})
        nome_disp = prof.get("display_name", "?") if isinstance(prof, dict) else "?"
        palps = listar_palpites(tokens["alice"], m["user_id"])
        print(f"    · {nome_disp}: {len(palps)} palpites")

    print("\n=== URL do bolão pra testar no browser ===")
    print(f"https://arena-de-ias.vercel.app/bolao/{slug}")
    print("\nCredenciais:")
    for nome, email, senha in usuarios:
        print(f"  {nome}: {email} / {senha}")


if __name__ == "__main__":
    main()
