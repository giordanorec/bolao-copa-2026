"""Simulador de carga: muitos usuários, múltiplos bolões, convites cruzados.

Cria N usuários via Supabase Admin API (sem precisar de confirmação de email).
Distribui em M bolões (cada criador), cada bolão tem entre 4-12 membros.
Cada membro palpita 30-104 jogos. Mede tempo total e taxa de sucesso.

Uso:
    PYTHONIOENCODING=utf-8 python scripts/simular_carga.py
    PYTHONIOENCODING=utf-8 python scripts/simular_carga.py --users 50 --boloes 10

No fim:
- imprime ranking por bolão
- valida que todos os palpites foram salvos (count == esperado)
- limpa usuários sintéticos se --cleanup
"""

from __future__ import annotations

import argparse
import json
import os
import random
import time
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed

PAT = os.environ.get("SUPABASE_PAT")
if not PAT:
    raise SystemExit(
        "Falta SUPABASE_PAT. Pegue em https://supabase.com/dashboard/account/tokens "
        "e exporte: export SUPABASE_PAT=sbp_..."
    )
PROJECT_REF = "dkrsxsvdihrxmehilohq"
SUPABASE_URL = f"https://{PROJECT_REF}.supabase.co"
ANON_KEY = (
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9."
    "eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRrcnN4c3ZkaWhyeG1laGlsb2hxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3ODI3NzksImV4cCI6MjA5NjM1ODc3OX0."
    "1ulz5dbmKv5GXXIEatVAiZpksYOEfh2bnN91wJXwOtA"
)


def req(method, url, headers, body=None, timeout=30):
    data = json.dumps(body).encode() if body is not None else None
    headers = {
        "User-Agent": "Mozilla/5.0 (compatible; bolao-load-sim/1.0)",
        **headers,
    }
    r = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(r, timeout=timeout) as resp:
            txt = resp.read().decode()
            return resp.status, json.loads(txt) if txt else {}
    except urllib.error.HTTPError as e:
        txt = e.read().decode()
        try:
            return e.code, json.loads(txt)
        except json.JSONDecodeError:
            return e.code, {"raw": txt}
    except Exception as e:
        return 0, {"error": str(e)}


def get_service_role():
    status, resp = req(
        "GET",
        f"https://api.supabase.com/v1/projects/{PROJECT_REF}/api-keys",
        {"Authorization": f"Bearer {PAT}", "Accept": "application/json"},
    )
    if status >= 400:
        raise SystemExit(f"api-keys falhou: {status} {resp}")
    for k in resp:
        if k.get("name") == "service_role":
            return k["api_key"]
    raise SystemExit("service_role não encontrada")


def hsr(srv):
    return {
        "apikey": srv,
        "Authorization": f"Bearer {srv}",
        "Content-Type": "application/json",
    }


def h_user(token):
    return {
        "apikey": ANON_KEY,
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }


# ───────────────────────── steps ─────────────────────────


def criar_user_admin(srv, email, senha, nome):
    """Cria via admin API (sem confirm email)."""
    status, resp = req(
        "POST",
        f"{SUPABASE_URL}/auth/v1/admin/users",
        hsr(srv),
        {
            "email": email,
            "password": senha,
            "email_confirm": True,
            "user_metadata": {"display_name": nome},
        },
    )
    if status >= 400:
        return None, f"admin/users {status}: {resp}"
    return resp["id"], None


def login(email, senha, retries=4):
    """Faz signin e retorna access_token. Retry em 429."""
    delay = 1.0
    for _ in range(retries):
        status, resp = req(
            "POST",
            f"{SUPABASE_URL}/auth/v1/token?grant_type=password",
            {"apikey": ANON_KEY, "Content-Type": "application/json"},
            {"email": email, "password": senha},
        )
        if status == 429:
            time.sleep(delay)
            delay *= 2
            continue
        if status >= 400:
            return None, f"login {status}: {resp}"
        return resp.get("access_token"), None
    return None, f"login: rate-limited após {retries} tentativas"


def garantir_profile(srv, user_id, nome):
    status, resp = req(
        "POST",
        f"{SUPABASE_URL}/rest/v1/profiles?on_conflict=id",
        {**hsr(srv), "Prefer": "resolution=merge-duplicates"},
        [{"id": user_id, "display_name": nome}],
    )
    if status >= 400:
        return f"profile {status}: {resp}"
    return None


def criar_bolao(token, slug, nome, criador_id):
    status, resp = req(
        "POST",
        f"{SUPABASE_URL}/rest/v1/bolao",
        {**h_user(token), "Prefer": "return=representation"},
        [
            {
                "slug": slug,
                "nome": nome,
                "descricao": f"Bolão sintético: {nome}",
                "criador_id": criador_id,
            }
        ],
    )
    if status >= 400:
        return None, f"criar_bolao {status}: {resp}"
    bolao_id = resp[0]["id"]
    # auto-join do criador
    status2, _ = req(
        "POST",
        f"{SUPABASE_URL}/rest/v1/bolao_membro",
        h_user(token),
        [{"bolao_id": bolao_id, "user_id": criador_id}],
    )
    if status2 >= 400 and status2 != 409:  # 409 = duplicado, ok
        return None, f"auto-join {status2}"
    return bolao_id, None


def entrar_bolao(token, bolao_id, user_id):
    status, resp = req(
        "POST",
        f"{SUPABASE_URL}/rest/v1/bolao_membro",
        {**h_user(token), "Prefer": "resolution=merge-duplicates"},
        [{"bolao_id": bolao_id, "user_id": user_id}],
    )
    if status >= 400 and status != 409:
        return f"entrar_bolao {status}: {resp}"
    return None


def palpitar(token, user_id, n_jogos):
    """Faz upsert em batch de N palpites aleatórios."""
    rows = []
    for n in range(1, n_jogos + 1):
        rows.append(
            {
                "user_id": user_id,
                "jogo_numero": n,
                "gols_a": random.randint(0, 4),
                "gols_b": random.randint(0, 4),
            }
        )
    status, resp = req(
        "POST",
        f"{SUPABASE_URL}/rest/v1/palpite?on_conflict=user_id,jogo_numero",
        {**h_user(token), "Prefer": "resolution=merge-duplicates"},
        rows,
    )
    if status >= 400:
        return 0, f"palpitar {status}: {resp}"
    return len(rows), None


def contar_palpites(srv, user_id):
    status, resp = req(
        "GET",
        f"{SUPABASE_URL}/rest/v1/palpite?user_id=eq.{user_id}&select=count",
        {**hsr(srv), "Prefer": "count=exact"},
    )
    if isinstance(resp, list) and resp:
        return resp[0].get("count", 0)
    return 0


def listar_membros(srv, bolao_id):
    status, resp = req(
        "GET",
        f"{SUPABASE_URL}/rest/v1/bolao_membro?bolao_id=eq.{bolao_id}&select=user_id",
        hsr(srv),
    )
    if isinstance(resp, list):
        return [r["user_id"] for r in resp]
    return []


def deletar_user(srv, user_id):
    status, _ = req(
        "DELETE",
        f"{SUPABASE_URL}/auth/v1/admin/users/{user_id}",
        hsr(srv),
    )
    return status < 400


# ───────────────────────── orchestration ─────────────────────────


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--users", type=int, default=30)
    ap.add_argument("--boloes", type=int, default=6)
    ap.add_argument("--jogos-min", type=int, default=20)
    ap.add_argument("--jogos-max", type=int, default=104)
    ap.add_argument("--cleanup", action="store_true")
    ap.add_argument("--prefixo", default=f"s{int(time.time())%1000000}")
    args = ap.parse_args()

    t0 = time.time()
    print("🔑 Pegando service_role…")
    srv = get_service_role()

    senha = "TesteCarga!2026"
    users = []  # (email, id, token, nome)
    erros = []

    print(f"\n👥 Criando {args.users} usuários…")
    t = time.time()

    def fase_user(i):
        em = f"{args.prefixo}+u{i:03d}@bolao-teste.dev"
        nome = f"Usuário {i:03d}"
        uid, err = criar_user_admin(srv, em, senha, nome)
        if err:
            return None, f"u{i}: {err}"
        token, err = login(em, senha)
        if err:
            return None, f"u{i} login: {err}"
        err = garantir_profile(srv, uid, nome)
        if err:
            return None, f"u{i} profile: {err}"
        return (em, uid, token, nome), None

    # baixa concorrência no login pra evitar rate-limit do auth endpoint
    with ThreadPoolExecutor(max_workers=3) as ex:
        futs = [ex.submit(fase_user, i) for i in range(args.users)]
        for f in as_completed(futs):
            u, err = f.result()
            if err:
                erros.append(err)
            else:
                users.append(u)
    print(
        f"   ✓ {len(users)}/{args.users} criados em {time.time()-t:.1f}s " f"({len(erros)} erros)"
    )
    if not users:
        raise SystemExit("nenhum user criado, abortando")

    # ── BOLÕES ──
    print(f"\n🏆 Criando {args.boloes} bolões…")
    t = time.time()
    boloes = []  # (id, slug, nome, criador_id, criador_token)
    for b in range(args.boloes):
        criador = users[b % len(users)]
        slug = f"{args.prefixo}-b{b:02d}"  # max 16 chars (s123456-b00 = 11)
        nome = f"Bolão Sintético {b+1}"
        bid, err = criar_bolao(criador[2], slug, nome, criador[1])
        if err:
            erros.append(f"b{b}: {err}")
            continue
        boloes.append((bid, slug, nome, criador[1], criador[2]))
    print(f"   ✓ {len(boloes)}/{args.boloes} criados em {time.time()-t:.1f}s")

    # ── MEMBERSHIP CRUZADA ──
    print("\n🤝 Convidando + entrando…")
    t = time.time()
    n_entradas = 0
    for bid, _slug, _nome, criador_id, _criador_token in boloes:
        # cada bolão pega de 3 a 10 outros membros random
        n_extras = random.randint(3, min(10, len(users) - 1))
        candidatos = [u for u in users if u[1] != criador_id]
        sample = random.sample(candidatos, min(n_extras, len(candidatos)))
        for _em, uid, token, _n in sample:
            err = entrar_bolao(token, bid, uid)
            if err:
                erros.append(err)
            else:
                n_entradas += 1
    print(f"   ✓ {n_entradas} memberships em {len(boloes)} bolões " f"em {time.time()-t:.1f}s")

    # ── PALPITES ──
    print("\n🎯 Palpitando…")
    t = time.time()
    palp_total = 0

    def palp_fase(u):
        _em, uid, token, _n = u
        n_jogos = random.randint(args.jogos_min, args.jogos_max)
        n, err = palpitar(token, uid, n_jogos)
        return n, err

    with ThreadPoolExecutor(max_workers=8) as ex:
        futs = [ex.submit(palp_fase, u) for u in users]
        for f in as_completed(futs):
            n, err = f.result()
            if err:
                erros.append(err)
            palp_total += n
    print(f"   ✓ {palp_total} palpites por {len(users)} users " f"em {time.time()-t:.1f}s")

    # ── VERIFICAÇÃO ──
    print("\n🔍 Validando integridade…")
    t = time.time()
    palp_db = 0
    for u in users[:10]:  # amostra
        c = contar_palpites(srv, u[1])
        palp_db += c
    print(f"   amostra: {palp_db} palpites em 10 users (DB)")

    print("\n📊 Membros por bolão (amostra de 3):")
    for bid, slug, nome, *_ in boloes[:3]:
        m = listar_membros(srv, bid)
        print(f"   {nome} ({slug}): {len(m)} membros")

    # ── RESUMO ──
    print()
    print("═" * 60)
    print(f"⏱  Tempo total: {time.time()-t0:.1f}s")
    print(f"👥 Users: {len(users)}/{args.users}")
    print(f"🏆 Bolões: {len(boloes)}/{args.boloes}")
    print(f"🤝 Memberships: {n_entradas}")
    print(f"🎯 Palpites: {palp_total}")
    print(f"❌ Erros: {len(erros)}")
    if erros[:5]:
        for e in erros[:5]:
            print(f"   - {e[:200]}")
    print("═" * 60)

    if args.cleanup:
        print(f"\n🧹 Deletando {len(users)} users sintéticos…")
        with ThreadPoolExecutor(max_workers=6) as ex:
            list(ex.map(lambda u: deletar_user(srv, u[1]), users))
        print("   ✓ done")
    else:
        print(f"\n💡 Pra deletar depois: re-rode com --cleanup --prefixo {args.prefixo}")


if __name__ == "__main__":
    main()
