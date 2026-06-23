/**
 * /analise-v2 — Comparação v1×v2 de palpites das IAs (conteúdo premium).
 *
 * REGRA DE OURO: dados v2 NUNCA chegam ao browser sem senha válida.
 * - Leitura de palpite_v2: só server-side, via service_role (bypassa RLS).
 * - Cookie httpOnly `analise_auth`: o browser não pode ler via JS.
 * - Sem fetch client-side a dado v2; tudo renderizado no servidor.
 *
 * Fluxo:
 *   1. Sem cookie válido → exibe form de senha.
 *   2. Submit (server action) → compara com ANALISE_SENHA → seta cookie → redireciona.
 *   3. Com cookie válido → lê palpite_v2 server-side → renderiza comparação.
 *
 * Link NÃO está no menu (decisão de produto: só após fase de grupos).
 */

import { createHash } from "crypto";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createAdminClient, isContribuinte } from "@/lib/admin";
import { createClient } from "@/lib/supabase-server";
import { resolverLocale } from "@/lib/locale-server";
import type { Locale } from "@/lib/i18n";
import { carregarJogos, jogoComecou } from "@/lib/jogos";
import { carregarDictIAs, carregarPalpitesIAs } from "@/lib/palpites-ias";
import type { DadosPorJogo } from "@/lib/palpites-ias";
import type { Jogo } from "@/lib/types";
import { carregarMapaPaises } from "@/lib/paises";
import TimeLink from "@/components/TimeLink";
import ComparacaoV2Modal from "@/components/ComparacaoV2Modal";
import type { LinhaComparacao, ConsensoSimples } from "@/components/ComparacaoV2Modal";
import SeletorIAV2 from "@/components/SeletorIAV2";
import type { IAComparada, LinhaIA } from "@/components/SeletorIAV2";
import { scorePopularidade } from "@/lib/ias";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Palpites Atualizados · Bolão das IAs",
  description:
    "Os palpites das IAs refeitos com a Copa em andamento — acesso exclusivo para contribuintes.",
  robots: { index: false, follow: false },
};

// ─── Tipos ──────────────────────────────────────────────────────

type PalpiteV2Row = {
  slug: string;
  jogo_numero: number;
  gols_a: number;
  gols_b: number;
  modo: string;
  coletado_em: string;
};

// ─── Verificação de cookie ──────────────────────────────────────

const COOKIE_NAME = "analise_auth";

// Token derivado da senha (não forjável): sem conhecer ANALISE_SENHA não dá pra
// fabricar o valor do cookie. Cookie com valor fixo ("ok") seria burlável por
// qualquer um que setasse o cookie na mão no DevTools/curl.
function tokenEsperado(): string | null {
  const senha = process.env.ANALISE_SENHA;
  if (!senha) return null;
  return createHash("sha256").update(`analise-v2:${senha}`).digest("hex");
}

async function isAutenticado(): Promise<boolean> {
  const esperado = tokenEsperado();
  if (!esperado) return false;
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value === esperado;
}

// ─── Server Action: validar senha ───────────────────────────────

async function autenticar(formData: FormData) {
  "use server";
  const senha = formData.get("senha")?.toString().trim() ?? "";
  const senhaCorreta = process.env.ANALISE_SENHA;

  if (!senhaCorreta) {
    // Env var não configurada — nega acesso para não criar backdoor silencioso
    redirect("/analise-v2?erro=config");
  }

  if (senha !== senhaCorreta) {
    redirect("/analise-v2?erro=senha");
  }

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, tokenEsperado()!, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/analise-v2",
    // Expira em 30 dias — contribuinte não precisa redigitar toda hora
    maxAge: 60 * 60 * 24 * 30,
  });
  redirect("/analise-v2");
}

// ─── Leitura de dados v2 (service_role, server-side) ────────────

async function carregarPalpitesV2(): Promise<PalpiteV2Row[] | null> {
  const admin = createAdminClient();
  if (!admin) return null;

  // O PostgREST do Supabase limita a 1000 linhas por requisição (mesmo com
  // .range maior). Com ~62 IAs × 32 jogos (~2k linhas) precisamos paginar.
  const PAGINA = 1000;
  const todos: PalpiteV2Row[] = [];
  for (let inicio = 0; ; inicio += PAGINA) {
    const { data, error } = await admin
      .from("palpite_v2")
      .select("slug, jogo_numero, gols_a, gols_b, modo, coletado_em")
      .order("jogo_numero", { ascending: true })
      .order("slug", { ascending: true })
      .range(inicio, inicio + PAGINA - 1);

    if (error) {
      console.error("[analise-v2] Erro ao carregar palpite_v2:", error.message);
      return null;
    }
    const lote = (data ?? []) as PalpiteV2Row[];
    todos.push(...lote);
    if (lote.length < PAGINA) break;
  }
  return todos;
}

// ─── Strings localizadas ─────────────────────────────────────────

type TxKeys =
  | "gate.titulo"
  | "gate.desc"
  | "gate.placeholder"
  | "gate.btn"
  | "gate.erro.senha"
  | "gate.erro.config"
  | "acesso.login_titulo"
  | "acesso.login_desc"
  | "acesso.login_btn"
  | "acesso.naolib_titulo"
  | "acesso.naolib_desc"
  | "acesso.naolib_btn"
  | "acesso.ou_senha"
  | "obrigado.banner"
  | "page.titulo"
  | "page.lede"
  | "page.vazio"
  | "page.jogo"
  | "page.ia"
  | "page.modo"
  | "page.v2"
  | "page.coletado"
  | "page.total"
  | "page.ias_distintas"
  | "page.jogos_cobertos";

const STRINGS: Record<Locale, Record<TxKeys, string>> = {
  pt: {
    "gate.titulo": "Palpites Atualizados",
    "gate.desc":
      "Conteúdo exclusivo para contribuintes. Digite a senha recebida pelo Instagram @arena.das.ias.",
    "gate.placeholder": "Senha",
    "gate.btn": "Acessar",
    "gate.erro.senha": "Senha incorreta. Confira com @arena.das.ias.",
    "gate.erro.config":
      "Env ANALISE_SENHA não configurada. Contate o admin.",
    "acesso.login_titulo": "Já contribuiu?",
    "acesso.login_desc":
      "Entre com a conta cujo e-mail você informou no @arena.das.ias. Liberamos os palpites v2 direto na sua conta — sem senha.",
    "acesso.login_btn": "Entrar com minha conta",
    "acesso.naolib_titulo": "Conta ainda não liberada",
    "acesso.naolib_desc":
      "Sua conta ({email}) ainda não está na lista. Contribua via Pix e mande no @arena.das.ias quem fez a contribuição e este e-mail pra liberarmos.",
    "acesso.naolib_btn": "💛 Colaborar via Pix",
    "acesso.ou_senha": "ou use a senha de contribuinte",
    "obrigado.banner": "Obrigado por contribuir 💛 Acesso liberado na sua conta.",
    "page.titulo": "Palpites Atualizados",
    "page.lede":
      "Os palpites das IAs refeitos com a Copa rolando — informados por classificação, forma, lesões e odds (jogos 41–72). Compare o antes (v1) e o agora (v2).",
    "page.vazio":
      "Nenhum palpite v2 coletado ainda. Volte após a coleta.",
    "page.jogo": "Jogo",
    "page.ia": "IA",
    "page.modo": "Modo",
    "page.v2": "Palpite v2",
    "page.coletado": "Coletado em",
    "page.total": "Total de registros",
    "page.ias_distintas": "IAs distintas",
    "page.jogos_cobertos": "Jogos cobertos",
  },
  en: {
    "gate.titulo": "Updated Picks",
    "gate.desc":
      "Exclusive content for supporters. Enter the password received via @arena.das.ias on Instagram.",
    "gate.placeholder": "Password",
    "gate.btn": "Access",
    "gate.erro.senha": "Wrong password. Check with @arena.das.ias.",
    "gate.erro.config":
      "ANALISE_SENHA env var not configured. Contact admin.",
    "acesso.login_titulo": "Already contributed?",
    "acesso.login_desc":
      "Log in with the account whose email you sent to @arena.das.ias. We unlock the v2 picks right on your account — no password.",
    "acesso.login_btn": "Log in with my account",
    "acesso.naolib_titulo": "Account not enabled yet",
    "acesso.naolib_desc":
      "Your account ({email}) isn't on the list yet. Support via Pix and message @arena.das.ias with who made the contribution and this email so we can enable it.",
    "acesso.naolib_btn": "💛 Support via Pix",
    "acesso.ou_senha": "or use the supporter password",
    "obrigado.banner": "Thanks for contributing 💛 Access unlocked on your account.",
    "page.titulo": "Updated Picks",
    "page.lede":
      "The AIs' picks redone mid-tournament — informed by standings, form, injuries and odds (games 41–72). Compare before (v1) and now (v2).",
    "page.vazio":
      "No v2 picks collected yet. Come back after collection.",
    "page.jogo": "Match",
    "page.ia": "AI",
    "page.modo": "Mode",
    "page.v2": "v2 pick",
    "page.coletado": "Collected at",
    "page.total": "Total records",
    "page.ias_distintas": "Distinct AIs",
    "page.jogos_cobertos": "Matches covered",
  },
  es: {
    "gate.titulo": "Pronósticos Actualizados",
    "gate.desc":
      "Contenido exclusivo para colaboradores. Introduce la contraseña recibida en @arena.das.ias.",
    "gate.placeholder": "Contraseña",
    "gate.btn": "Acceder",
    "gate.erro.senha": "Contraseña incorrecta. Verifica con @arena.das.ias.",
    "gate.erro.config":
      "ANALISE_SENHA no configurado. Contacta al admin.",
    "acesso.login_titulo": "¿Ya colaboraste?",
    "acesso.login_desc":
      "Inicia sesión con la cuenta cuyo e-mail indicaste en @arena.das.ias. Habilitamos los pronósticos v2 en tu cuenta — sin contraseña.",
    "acesso.login_btn": "Entrar con mi cuenta",
    "acesso.naolib_titulo": "Cuenta aún no habilitada",
    "acesso.naolib_desc":
      "Tu cuenta ({email}) aún no está en la lista. Colabora vía Pix y escribe a @arena.das.ias indicando quién hizo la contribución y este e-mail para habilitarla.",
    "acesso.naolib_btn": "💛 Colaborar vía Pix",
    "acesso.ou_senha": "o usa la contraseña de colaborador",
    "obrigado.banner": "Gracias por colaborar 💛 Acceso habilitado en tu cuenta.",
    "page.titulo": "Pronósticos Actualizados",
    "page.lede":
      "Los pronósticos de las IAs rehechos con el Mundial en marcha — informados por clasificación, forma, lesiones y cuotas (partidos 41–72). Compara el antes (v1) y el ahora (v2).",
    "page.vazio":
      "Todavía no hay pronósticos v2. Vuelve después de la recopilación.",
    "page.jogo": "Partido",
    "page.ia": "IA",
    "page.modo": "Modo",
    "page.v2": "Pronóstico v2",
    "page.coletado": "Recopilado en",
    "page.total": "Total de registros",
    "page.ias_distintas": "IAs distintas",
    "page.jogos_cobertos": "Partidos cubiertos",
  },
  fr: {
    "gate.titulo": "Pronostics Mis à Jour",
    "gate.desc":
      "Contenu exclusif pour les soutiens. Entrez le mot de passe reçu via @arena.das.ias.",
    "gate.placeholder": "Mot de passe",
    "gate.btn": "Accéder",
    "gate.erro.senha":
      "Mot de passe incorrect. Vérifiez avec @arena.das.ias.",
    "gate.erro.config":
      "Variable ANALISE_SENHA non configurée. Contactez l'admin.",
    "acesso.login_titulo": "Déjà soutenu ?",
    "acesso.login_desc":
      "Connectez-vous avec le compte dont vous avez indiqué l'e-mail à @arena.das.ias. Nous débloquons les pronostics v2 sur votre compte — sans mot de passe.",
    "acesso.login_btn": "Se connecter avec mon compte",
    "acesso.naolib_titulo": "Compte pas encore activé",
    "acesso.naolib_desc":
      "Votre compte ({email}) n'est pas encore sur la liste. Soutenez via Pix et écrivez à @arena.das.ias en indiquant qui a fait la contribution et cet e-mail pour l'activer.",
    "acesso.naolib_btn": "💛 Soutenir via Pix",
    "acesso.ou_senha": "ou utilisez le mot de passe de soutien",
    "obrigado.banner": "Merci pour votre soutien 💛 Accès débloqué sur votre compte.",
    "page.titulo": "Pronostics Mis à Jour",
    "page.lede":
      "Les pronostics des IA refaits en cours de tournoi — informés par le classement, la forme, les blessures et les cotes (matchs 41–72). Comparez l'avant (v1) et le maintenant (v2).",
    "page.vazio":
      "Aucun pronostic v2 collecté pour l'instant. Revenez après la collecte.",
    "page.jogo": "Match",
    "page.ia": "IA",
    "page.modo": "Mode",
    "page.v2": "Pronostic v2",
    "page.coletado": "Collecté le",
    "page.total": "Total enregistrements",
    "page.ias_distintas": "IA distinctes",
    "page.jogos_cobertos": "Matchs couverts",
  },
};

function tx(locale: Locale, key: TxKeys): string {
  return STRINGS[locale]?.[key] ?? STRINGS.pt[key];
}

// ─── Componente de gate (form de senha) ─────────────────────────

function GatePage({
  locale,
  erro,
  emailLogado,
}: {
  locale: Locale;
  erro: string | null;
  // null = não logado; string = logado mas conta não liberada
  emailLogado: string | null;
}) {
  return (
    <div className="analise-gate card">
      <h1>{tx(locale, "gate.titulo")}</h1>

      {emailLogado ? (
        // Logado, mas conta fora da allowlist
        <>
          <p className="analise-gate-desc" style={{ fontWeight: 700 }}>
            {tx(locale, "acesso.naolib_titulo")}
          </p>
          <p className="analise-gate-desc">
            {tx(locale, "acesso.naolib_desc").replace("{email}", emailLogado)}
          </p>
          <Link
            href="/colaborar"
            className="btn primary block"
            style={{ width: "100%", textAlign: "center" }}
          >
            {tx(locale, "acesso.naolib_btn")}
          </Link>
        </>
      ) : (
        // Não logado: oferece login com conta liberada
        <>
          <p className="analise-gate-desc" style={{ fontWeight: 700 }}>
            {tx(locale, "acesso.login_titulo")}
          </p>
          <p className="analise-gate-desc">{tx(locale, "acesso.login_desc")}</p>
          <Link
            href="/login?redirect=/analise-v2"
            className="btn primary block"
            style={{ width: "100%", textAlign: "center" }}
          >
            {tx(locale, "acesso.login_btn")}
          </Link>
        </>
      )}

      {/* Fallback temporário: senha compartilhada */}
      <p
        style={{
          textAlign: "center",
          color: "var(--fg-muted)",
          fontFamily: "var(--ff-mono)",
          fontSize: 11,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          margin: "20px 0 12px",
        }}
      >
        {tx(locale, "acesso.ou_senha")}
      </p>
      {erro === "senha" && (
        <div className="analise-gate-err" role="alert">
          {tx(locale, "gate.erro.senha")}
        </div>
      )}
      {erro === "config" && (
        <div className="analise-gate-err" role="alert">
          {tx(locale, "gate.erro.config")}
        </div>
      )}
      <form action={autenticar}>
        <div className="form-group">
          <input
            type="password"
            name="senha"
            className="input"
            placeholder={tx(locale, "gate.placeholder")}
            autoComplete="current-password"
            required
            aria-label={tx(locale, "gate.placeholder")}
          />
        </div>
        <button
          type="submit"
          className="btn primary block"
          style={{ width: "100%" }}
        >
          {tx(locale, "gate.btn")}
        </button>
      </form>
    </div>
  );
}

// ─── Consenso (placar mais votado) a partir de um mapa de palpites ──

type PlacarSimples = { gols_a: number; gols_b: number };

// Casos onde o slug v2 não é só "base + -web" (mudança de versão do modelo).
const ALIAS_V1: Record<string, string> = {
  // Claude web v2 é "Opus 4.8"; em v1 o mesmo Claude foi coletado como 4.7.
  "claude-opus-4-8-web": "claude-opus-4-7",
};

// Acha o palpite v1 correspondente a um slug v2.
// v1 guarda as interfaces web sob o slug-base (sem "-web"); v2 acrescenta
// "-web" pra distinguir da coleta via API. Por isso o lookup tenta:
//   1. match exato  2. alias manual  3. slug-base (tirando "-web").
function v1Para(
  slug: string,
  v1pal: Record<string, PlacarSimples>,
): PlacarSimples | null {
  if (v1pal[slug]) return v1pal[slug];
  const alias = ALIAS_V1[slug];
  if (alias && v1pal[alias]) return v1pal[alias];
  if (slug.endsWith("-web")) {
    const base = slug.slice(0, -4);
    if (v1pal[base]) return v1pal[base];
  }
  return null;
}

function consensoDe(palpites: Record<string, PlacarSimples>): ConsensoSimples {
  const total = Object.keys(palpites).length;
  if (!total) return null;
  const contagem = new Map<string, { gols_a: number; gols_b: number; votos: number }>();
  for (const p of Object.values(palpites)) {
    const k = `${p.gols_a}-${p.gols_b}`;
    const c = contagem.get(k) ?? { gols_a: p.gols_a, gols_b: p.gols_b, votos: 0 };
    c.votos += 1;
    contagem.set(k, c);
  }
  const top = [...contagem.values()].sort(
    (a, b) => b.votos - a.votos || b.gols_a + b.gols_b - (a.gols_a + a.gols_b),
  )[0];
  return { gols_a: top.gols_a, gols_b: top.gols_b, votos: top.votos, total };
}

function formataDia(data: string, locale: Locale): string {
  const [, mes, dia] = data.split("-");
  const dt = new Date(`${data}T12:00:00Z`);
  const diasSemana: Record<string, Record<number, string>> = {
    pt: { 0: "Dom", 1: "Seg", 2: "Ter", 3: "Qua", 4: "Qui", 5: "Sex", 6: "Sáb" },
    en: { 0: "Sun", 1: "Mon", 2: "Tue", 3: "Wed", 4: "Thu", 5: "Fri", 6: "Sat" },
    es: { 0: "Dom", 1: "Lun", 2: "Mar", 3: "Mié", 4: "Jue", 5: "Vie", 6: "Sáb" },
    fr: { 0: "Dim", 1: "Lun", 2: "Mar", 3: "Mer", 4: "Jeu", 5: "Ven", 6: "Sam" },
  };
  const ds = diasSemana[locale]?.[dt.getUTCDay()] ?? "";
  return `${ds}, ${dia}/${mes}`;
}

// ─── Componente de conteúdo (palpites v2 renderizados server-side) ──

function ConteudoPage({
  locale,
  palpites,
  serviceKeyAusente,
  jogos,
  mapaPaises,
  iasDict,
  v1Dados,
  agradecer,
}: {
  locale: Locale;
  palpites: PalpiteV2Row[] | null;
  serviceKeyAusente: boolean;
  jogos: Jogo[];
  mapaPaises: Record<string, string>;
  iasDict: Record<string, string>;
  v1Dados: Record<string, DadosPorJogo>;
  agradecer: boolean;
}) {
  if (serviceKeyAusente) {
    return (
      <div className="analise-page" style={{ marginTop: 32 }}>
        <h1>{tx(locale, "page.titulo")}</h1>
        <p className="analise-lede" style={{ color: "var(--primary)" }}>
          SUPABASE_SERVICE_ROLE_KEY não configurada. Configure a env var na
          Vercel.
        </p>
      </div>
    );
  }

  if (!palpites || palpites.length === 0) {
    return (
      <div className="analise-page" style={{ marginTop: 32 }}>
        <h1>{tx(locale, "page.titulo")}</h1>
        <p className="analise-lede">{tx(locale, "page.lede")}</p>
        <div className="analise-empty">
          <p>📭 {tx(locale, "page.vazio")}</p>
        </div>
      </div>
    );
  }

  // Estatísticas rápidas
  const iaDistintas = new Set(palpites.map((p) => p.slug)).size;
  const jogosCobertos = new Set(palpites.map((p) => p.jogo_numero)).size;

  // v2 por jogo: { jogo → { slug → placar } }
  const v2PorJogo = new Map<number, Record<string, PlacarSimples>>();
  for (const p of palpites) {
    const m = v2PorJogo.get(p.jogo_numero) ?? {};
    m[p.slug] = { gols_a: p.gols_a, gols_b: p.gols_b };
    v2PorJogo.set(p.jogo_numero, m);
  }

  // estatística global de mudança v1→v2
  let comparaveis = 0;
  let mudaramGlobal = 0;
  for (const [num, m] of v2PorJogo) {
    const v1pal = v1Dados[String(num)]?.palpites ?? {};
    for (const [slug, v2] of Object.entries(m)) {
      const v1 = v1Para(slug, v1pal);
      if (!v1) continue;
      comparaveis += 1;
      if (v1.gols_a !== v2.gols_a || v1.gols_b !== v2.gols_b) mudaramGlobal += 1;
    }
  }
  const pctMudou = comparaveis ? Math.round((mudaramGlobal / comparaveis) * 100) : 0;

  // só jogos que têm v2 e ainda não começaram (o palpite v2 não faz sentido
  // depois da bola rolar), ordenados por data + hora, agrupados por data
  const jogosV2 = jogos
    .filter((j) => v2PorJogo.has(j.numero) && !jogoComecou(j))
    .sort((a, b) =>
      a.data !== b.data
        ? a.data.localeCompare(b.data)
        : a.hora.localeCompare(b.hora),
    );
  const porData: Record<string, Jogo[]> = {};
  for (const j of jogosV2) (porData[j.data] ??= []).push(j);

  // Visão IA-centrada (sugestão do Denilson): pra cada IA, suas linhas v1→v2
  // em todos os jogos cobertos. Reusa jogosV2 (já ordenado por data+hora).
  const linhasPorIA = new Map<string, LinhaIA[]>();
  for (const j of jogosV2) {
    const v2map = v2PorJogo.get(j.numero)!;
    const v1pal = v1Dados[String(j.numero)]?.palpites ?? {};
    for (const [slug, v2] of Object.entries(v2map)) {
      const raw = v1Para(slug, v1pal);
      const v1 = raw ? { gols_a: raw.gols_a, gols_b: raw.gols_b } : null;
      const mudou = !!v1 && (v1.gols_a !== v2.gols_a || v1.gols_b !== v2.gols_b);
      const arr = linhasPorIA.get(slug) ?? [];
      arr.push({
        jogo: j.numero,
        timeA: j.time_a,
        timeB: j.time_b,
        isoA: mapaPaises[j.time_a],
        isoB: mapaPaises[j.time_b],
        data: j.data,
        hora: j.hora,
        v1,
        v2,
        mudou,
      });
      linhasPorIA.set(slug, arr);
    }
  }
  const iasComparadas: IAComparada[] = [...linhasPorIA.entries()]
    .map(([slug, linhas]) => ({ slug, nome: iasDict[slug] ?? slug, linhas }))
    .sort((a, b) => scorePopularidade(a.slug) - scorePopularidade(b.slug));

  const badge =
    locale === "en" ? "✨ v1 → v2"
    : locale === "es" ? "✨ v1 → v2"
    : locale === "fr" ? "✨ v1 → v2"
    : "✨ v1 → v2";
  const cliqueLbl =
    locale === "en" ? "Click to compare v1 → v2 pick by pick"
    : locale === "es" ? "Clic para comparar v1 → v2 IA por IA"
    : locale === "fr" ? "Cliquez pour comparer v1 → v2"
    : "Clique pra comparar v1 → v2 IA por IA";
  const mudaramLbl =
    locale === "en" ? "AIs changed"
    : locale === "es" ? "IAs cambiaron"
    : locale === "fr" ? "IA ont changé"
    : "IAs mudaram";
  const pctLbl =
    locale === "en" ? "of picks changed"
    : locale === "es" ? "de pronósticos cambiaron"
    : locale === "fr" ? "des pronostics ont changé"
    : "dos palpites mudaram";

  return (
    <div style={{ marginTop: 32, marginBottom: 64 }}>
      {agradecer && (
        <div
          style={{
            maxWidth: 640,
            margin: "0 auto 24px",
            padding: "12px 20px",
            borderRadius: "var(--r-m)",
            background: "var(--bg-soft)",
            border: "1px solid var(--secondary)",
            color: "var(--secondary)",
            fontWeight: 700,
            textAlign: "center",
          }}
        >
          {tx(locale, "obrigado.banner")}
        </div>
      )}
      <header className="pa-hero">
        <div className="pa-hero-glow" aria-hidden="true" />
        <div className="pa-hero-spark" aria-hidden="true">✨</div>
        <span className="pa-hero-badge">
          {locale === "en" ? "Exclusive · v1 → v2"
          : locale === "es" ? "Exclusivo · v1 → v2"
          : locale === "fr" ? "Exclusif · v1 → v2"
          : "Exclusivo · v1 → v2"}
        </span>
        <h1 className="pa-hero-title">{tx(locale, "page.titulo")}</h1>
        <p className="pa-hero-lede">{tx(locale, "page.lede")}</p>
      </header>

      {/* Resumo estatístico */}
      <div
        style={{
          display: "flex",
          gap: 16,
          flexWrap: "wrap",
          justifyContent: "center",
          marginBottom: 32,
        }}
      >
        {[
          { label: tx(locale, "page.ias_distintas"), valor: `${iaDistintas}` },
          { label: tx(locale, "page.jogos_cobertos"), valor: `${jogosCobertos}` },
          { label: pctLbl, valor: `${pctMudou}%` },
        ].map((s) => (
          <div
            key={s.label}
            className="card"
            style={{ padding: "12px 24px", minWidth: 130, textAlign: "center" }}
          >
            <div
              style={{
                fontSize: 28,
                fontWeight: 900,
                fontFamily: "var(--ff-display)",
                color: "var(--secondary)",
              }}
            >
              {s.valor}
            </div>
            <div
              style={{
                fontSize: 11,
                color: "var(--fg-muted)",
                fontFamily: "var(--ff-mono)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                marginTop: 4,
              }}
            >
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {iasComparadas.length > 0 && (
        <SeletorIAV2 ias={iasComparadas} locale={locale} />
      )}

      {Object.entries(porData).map(([data, lista]) => (
        <section key={data} style={{ marginBottom: 32 }}>
          <h2 className="fase-titulo">{formataDia(data, locale)}</h2>
          <div className="jogos-lista-grid">
            {lista.map((j) => {
              const v2map = v2PorJogo.get(j.numero)!;
              const v1pal = v1Dados[String(j.numero)]?.palpites ?? {};
              const linhas: LinhaComparacao[] = Object.entries(v2map).map(
                ([slug, v2]) => {
                  const raw = v1Para(slug, v1pal);
                  const v1 = raw ? { gols_a: raw.gols_a, gols_b: raw.gols_b } : null;
                  const mudou =
                    !!v1 && (v1.gols_a !== v2.gols_a || v1.gols_b !== v2.gols_b);
                  return { slug, nome: iasDict[slug] ?? slug, v1, v2, mudou };
                },
              );
              const v1subset: Record<string, PlacarSimples> = {};
              for (const slug of Object.keys(v2map)) {
                const raw = v1Para(slug, v1pal);
                if (raw) {
                  v1subset[slug] = { gols_a: raw.gols_a, gols_b: raw.gols_b };
                }
              }
              const cV1: ConsensoSimples = consensoDe(v1subset);
              const cV2 = consensoDe(v2map)!;
              const mudaram = linhas.filter((l) => l.mudou).length;
              const totalIas = linhas.length;
              const mudouConsenso =
                !!cV1 && (cV1.gols_a !== cV2.gols_a || cV1.gols_b !== cV2.gols_b);
              return (
                <ComparacaoV2Modal
                  key={j.numero}
                  jogoNumero={j.numero}
                  timeA={j.time_a}
                  timeB={j.time_b}
                  isoA={mapaPaises[j.time_a]}
                  isoB={mapaPaises[j.time_b]}
                  data={j.data}
                  hora={j.hora}
                  local={j.local}
                  linhas={linhas}
                  consensoV1={cV1}
                  consensoV2={cV2}
                  locale={locale}
                  domId={String(j.numero)}
                  kickoff={`${j.data}T${j.hora}:00-03:00`}
                  trigger={
                    <div className="jogo-card">
                      <div className="jogo-card-head">
                        <span className="jogo-num">#{j.numero}</span>
                        <span className="jogo-data">
                          {j.data} · {j.hora}
                        </span>
                        <span
                          className="jogo-ft"
                          style={{
                            background:
                              "linear-gradient(135deg, var(--accent), var(--accent-2))",
                            color: "var(--secondary)",
                          }}
                        >
                          {badge}
                        </span>
                      </div>
                      <div className="jogo-card-times">
                        <TimeLink nome={j.time_a} iso={mapaPaises[j.time_a]} size={32} />
                        <div className="jogo-card-vs">
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: 6,
                            }}
                          >
                            <span
                              style={{
                                opacity: 0.5,
                                fontSize: 16,
                                fontFamily: "var(--ff-display)",
                                textDecoration: mudouConsenso ? "line-through" : "none",
                              }}
                            >
                              {cV1 ? `${cV1.gols_a}×${cV1.gols_b}` : "—"}
                            </span>
                            <span style={{ opacity: 0.5 }}>→</span>
                            <div className="placar-consenso">
                              {cV2.gols_a}×{cV2.gols_b}
                            </div>
                          </div>
                          <small>🔮 v1 → v2</small>
                        </div>
                        <TimeLink nome={j.time_b} iso={mapaPaises[j.time_b]} size={32} />
                      </div>
                      <div
                        style={{
                          textAlign: "center",
                          margin: "10px 0 2px",
                          fontSize: 13,
                        }}
                      >
                        🔁 <strong>{mudaram}</strong>/{totalIas} {mudaramLbl}
                      </div>
                      <div className="jogo-card-acao">🔍 {cliqueLbl}</div>
                    </div>
                  }
                />
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

// ─── Página principal ────────────────────────────────────────────

export default async function AnaliseV2Page({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const [params, locale, autenticado, userRes] = await Promise.all([
    searchParams,
    resolverLocale(),
    isAutenticado(),
    createClient().then((c) => c.auth.getUser()),
  ]);

  const email = userRes.data.user?.email ?? null;
  // Acesso = senha (fallback temporário) OU conta na allowlist/admin
  const contribuinte = email ? await isContribuinte(email) : false;
  const liberado = autenticado || contribuinte;

  // 1. Sem acesso → gate (login com conta liberada ou senha)
  if (!liberado) {
    const erro = params.erro ?? null;
    return <GatePage locale={locale} erro={erro} emailLogado={email} />;
  }

  // 2. Liberado → lê dados v2 server-side via service_role
  //    (o dado v2 NUNCA passa pelo browser antes desta verificação)
  const serviceKeyAusente = !process.env.SUPABASE_SERVICE_ROLE_KEY;
  const [palpites, jogos, mapaPaises, iasDict, v1Dados] = await Promise.all([
    serviceKeyAusente ? Promise.resolve(null) : carregarPalpitesV2(),
    carregarJogos(),
    carregarMapaPaises(),
    carregarDictIAs(),
    carregarPalpitesIAs(),
  ]);

  return (
    <ConteudoPage
      locale={locale}
      palpites={palpites}
      serviceKeyAusente={serviceKeyAusente}
      jogos={jogos}
      mapaPaises={mapaPaises}
      iasDict={iasDict}
      v1Dados={v1Dados}
      agradecer={contribuinte}
    />
  );
}
