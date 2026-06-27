/**
 * /analise-r32 — Prévia dos palpites das IAs para os 16-avos de final (R32, jogos 73–88).
 *
 * REGRA DE OURO: placares palpitados são premium — NUNCA chegam ao browser sem acesso.
 * - Confrontos + probabilidades: PÚBLICOS (todo mundo vê).
 * - Placares das IAs: SÓ server-side, via service_role, SÓ se liberado === true.
 * - Leitura de palpite_v2 (versao='mata-mata'): mesmo padrão de /analise-v2.
 *
 * Estrutura:
 *   1. Sem acesso → mostra confrontos públicos + gate (login ou senha).
 *   2. Com acesso → confrontos + grade de palpites (placar de cada IA por jogo).
 */

import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/admin";
import {
  ANALISE_COOKIE,
  tokenEsperado,
  analiseLiberado,
} from "@/lib/analise-auth";
import { resolverLocale } from "@/lib/locale-server";
import type { Locale } from "@/lib/i18n";
import { carregarDictIAs } from "@/lib/palpites-ias";
import { carregarMapaPaises } from "@/lib/paises";
import { scorePopularidade, marcaDe } from "@/lib/ias";
import Bandeira from "@/components/Bandeira";
import IconeIA from "@/components/IconeIA";
import { promises as fs } from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Palpites para os 16-avos · Bolão das IAs",
  description:
    "Prévia dos palpites das IAs para os 16-avos de final da Copa 2026 — acesso exclusivo para contribuintes.",
  robots: { index: false, follow: false },
};

// ─── Tipos ──────────────────────────────────────────────────────────────────

type JogoR32 = {
  numero: number;
  time_a: string;
  prob_a: number;
  definido_a: boolean;
  time_b: string;
  prob_b: number;
  definido_b: boolean;
  definido: boolean;
};

type ProjecaoR32 = {
  fase: string;
  n_simulacoes: number;
  cenario_conjunto_pct: number;
  jogos: JogoR32[];
};

type PalpiteRow = {
  slug: string;
  jogo_numero: number;
  gols_a: number;
  gols_b: number;
  modo: string;
  versao: string;
};

// ─── Server Action: validar senha ────────────────────────────────────────────

async function autenticar(formData: FormData) {
  "use server";
  const senha = formData.get("senha")?.toString().trim() ?? "";
  const senhaCorreta = process.env.ANALISE_SENHA;
  if (!senhaCorreta) redirect("/analise-r32?erro=config");
  if (senha !== senhaCorreta) redirect("/analise-r32?erro=senha");

  const cookieStore = await cookies();
  cookieStore.set(ANALISE_COOKIE, tokenEsperado()!, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  redirect("/analise-r32");
}

// ─── Leitura de dados (server-side, service_role) ────────────────────────────

async function carregarProjecaoR32(): Promise<ProjecaoR32 | null> {
  try {
    const fp = path.join(process.cwd(), "public", "r32-projecao.json");
    const raw = await fs.readFile(fp, "utf-8");
    return JSON.parse(raw) as ProjecaoR32;
  } catch {
    return null;
  }
}

async function carregarPalpitesR32(): Promise<PalpiteRow[] | null> {
  const admin = createAdminClient();
  if (!admin) return null;

  const PAGINA = 1000;
  const todos: PalpiteRow[] = [];
  for (let inicio = 0; ; inicio += PAGINA) {
    const { data, error } = await admin
      .from("palpite_v2")
      .select("slug, jogo_numero, gols_a, gols_b, modo, versao")
      .eq("versao", "mata-mata")
      .gte("jogo_numero", 73)
      .lte("jogo_numero", 88)
      .order("jogo_numero", { ascending: true })
      .order("slug", { ascending: true })
      .range(inicio, inicio + PAGINA - 1);

    if (error) {
      console.error("[analise-r32] Erro ao carregar palpites R32:", error.message);
      return null;
    }
    const lote = (data ?? []) as PalpiteRow[];
    todos.push(...lote);
    if (lote.length < PAGINA) break;
  }
  return todos;
}

// ─── Strings localizadas ─────────────────────────────────────────────────────

type TxKey =
  | "page.titulo"
  | "page.sub"
  | "page.contexto"
  | "page.confrontos_titulo"
  | "page.definido"
  | "page.palpites_titulo"
  | "page.palpites_desc"
  | "page.vazio"
  | "page.ias"
  | "page.jogos_cobertos"
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
  | "obrigado.banner";

const STRINGS: Record<Locale, Record<TxKey, string>> = {
  pt: {
    "page.titulo": "16-avos de Final · Palpites das IAs",
    "page.sub": "Prévia coletada com os grupos J, K e L ainda em aberto",
    "page.contexto":
      'Coletamos os palpites das IAs para os 16-avos de final com as fases de grupos quase encerradas — grupos J, K e L ainda decidindo. Confrontos marcados como "Definido" estão travados pelos resultados reais. Os demais mostram o adversário mais provável segundo 50.000 simulações Monte Carlo; ainda podem mudar.',
    "page.confrontos_titulo": "Os 16 confrontos",
    "page.definido": "Definido",
    "page.palpites_titulo": "Palpites das IAs por jogo",
    "page.palpites_desc":
      "Placar que cada IA cravou para cada um dos 16 jogos. Sem pontuação — é prévia, os jogos ainda não aconteceram.",
    "page.vazio": "Nenhum palpite mata-mata coletado ainda. Volte em breve.",
    "page.ias": "IAs",
    "page.jogos_cobertos": "Jogos cobertos",
    "gate.titulo": "Palpites para os 16-avos",
    "gate.desc":
      "Conteúdo exclusivo para contribuintes. Digite a senha recebida pelo Instagram @arena.das.ias.",
    "gate.placeholder": "Senha",
    "gate.btn": "Acessar",
    "gate.erro.senha": "Senha incorreta. Confira com @arena.das.ias.",
    "gate.erro.config": "Env ANALISE_SENHA não configurada. Contate o admin.",
    "acesso.login_titulo": "Já contribuiu?",
    "acesso.login_desc":
      "Entre com a conta cujo e-mail você informou no @arena.das.ias. Liberamos os palpites direto na sua conta — sem senha.",
    "acesso.login_btn": "Entrar com minha conta",
    "acesso.naolib_titulo": "Conta ainda não liberada",
    "acesso.naolib_desc":
      "Sua conta ({email}) ainda não está na lista. Contribua via Pix e mande no @arena.das.ias quem fez a contribuição e este e-mail pra liberarmos.",
    "acesso.naolib_btn": "💛 Colaborar via Pix",
    "acesso.ou_senha": "ou use a senha de contribuinte",
    "obrigado.banner": "Obrigado por contribuir 💛 Acesso liberado na sua conta.",
  },
  en: {
    "page.titulo": "Round of 16 · AI Predictions",
    "page.sub": "Preview collected while Groups J, K and L were still open",
    "page.contexto":
      'We gathered the AIs\' predictions for the Round of 16 with the group stages nearly over — Groups J, K and L still deciding. Matchups labelled "Confirmed" are locked by real results. The rest show the most likely opponent according to 50,000 Monte Carlo simulations; they may still change.',
    "page.confrontos_titulo": "The 16 matchups",
    "page.definido": "Confirmed",
    "page.palpites_titulo": "AI predictions per match",
    "page.palpites_desc":
      "The score each AI picked for each of the 16 matches. No scoring yet — this is a preview; the matches haven't been played.",
    "page.vazio": "No knockout picks collected yet. Check back soon.",
    "page.ias": "AIs",
    "page.jogos_cobertos": "Matches covered",
    "gate.titulo": "Round of 16 Predictions",
    "gate.desc":
      "Exclusive content for supporters. Enter the password received via @arena.das.ias on Instagram.",
    "gate.placeholder": "Password",
    "gate.btn": "Access",
    "gate.erro.senha": "Wrong password. Check with @arena.das.ias.",
    "gate.erro.config": "ANALISE_SENHA env var not configured. Contact admin.",
    "acesso.login_titulo": "Already contributed?",
    "acesso.login_desc":
      "Log in with the account whose email you sent to @arena.das.ias. We unlock the picks right on your account — no password.",
    "acesso.login_btn": "Log in with my account",
    "acesso.naolib_titulo": "Account not enabled yet",
    "acesso.naolib_desc":
      "Your account ({email}) isn't on the list yet. Support via Pix and message @arena.das.ias with who made the contribution and this email.",
    "acesso.naolib_btn": "💛 Support via Pix",
    "acesso.ou_senha": "or use the supporter password",
    "obrigado.banner": "Thanks for contributing 💛 Access unlocked on your account.",
  },
  es: {
    "page.titulo": "Octavos de Final · Pronósticos de las IAs",
    "page.sub": "Previsión recopilada con los grupos J, K y L aún abiertos",
    "page.contexto":
      'Recopilamos los pronósticos de las IAs para los octavos de final con las fases de grupos casi cerradas — grupos J, K y L todavía decidiendo. Los cruces marcados como "Definido" están fijados por los resultados reales. Los demás muestran el rival más probable según 50.000 simulaciones Monte Carlo; aún pueden cambiar.',
    "page.confrontos_titulo": "Los 16 cruces",
    "page.definido": "Definido",
    "page.palpites_titulo": "Pronósticos de las IAs por partido",
    "page.palpites_desc":
      "El marcador que cada IA eligió para cada uno de los 16 partidos. Sin puntuación — es una previsión, los partidos aún no se han jugado.",
    "page.vazio": "Todavía no hay pronósticos de eliminatoria. Vuelve pronto.",
    "page.ias": "IAs",
    "page.jogos_cobertos": "Partidos cubiertos",
    "gate.titulo": "Pronósticos para los Octavos",
    "gate.desc":
      "Contenido exclusivo para colaboradores. Introduce la contraseña recibida en @arena.das.ias.",
    "gate.placeholder": "Contraseña",
    "gate.btn": "Acceder",
    "gate.erro.senha": "Contraseña incorrecta. Verifica con @arena.das.ias.",
    "gate.erro.config": "ANALISE_SENHA no configurado. Contacta al admin.",
    "acesso.login_titulo": "¿Ya colaboraste?",
    "acesso.login_desc":
      "Inicia sesión con la cuenta cuyo e-mail indicaste en @arena.das.ias. Habilitamos los pronósticos en tu cuenta — sin contraseña.",
    "acesso.login_btn": "Entrar con mi cuenta",
    "acesso.naolib_titulo": "Cuenta aún no habilitada",
    "acesso.naolib_desc":
      "Tu cuenta ({email}) aún no está en la lista. Colabora vía Pix y escribe a @arena.das.ias indicando quién hizo la contribución y este e-mail.",
    "acesso.naolib_btn": "💛 Colaborar vía Pix",
    "acesso.ou_senha": "o usa la contraseña de colaborador",
    "obrigado.banner": "Gracias por colaborar 💛 Acceso habilitado en tu cuenta.",
  },
  fr: {
    "page.titulo": "Huitièmes de Finale · Pronostics des IA",
    "page.sub": "Aperçu collecté avec les groupes J, K et L encore ouverts",
    "page.contexto":
      "Nous avons recueilli les pronostics des IA pour les huitièmes de finale alors que les phases de groupes étaient presque terminées — groupes J, K et L encore en jeu. Les confrontations marquées « Confirmé » sont verrouillées par les vrais résultats. Les autres indiquent l'adversaire le plus probable selon 50 000 simulations Monte Carlo ; elles peuvent encore changer.",
    "page.confrontos_titulo": "Les 16 confrontations",
    "page.definido": "Confirmé",
    "page.palpites_titulo": "Pronostics des IA par match",
    "page.palpites_desc":
      "Le score que chaque IA a prédit pour chacun des 16 matches. Pas de score — c'est un aperçu, les matches n'ont pas encore eu lieu.",
    "page.vazio": "Aucun pronostic de phase éliminatoire collecté. Revenez bientôt.",
    "page.ias": "IA",
    "page.jogos_cobertos": "Matchs couverts",
    "gate.titulo": "Pronostics Huitièmes de Finale",
    "gate.desc":
      "Contenu exclusif pour les soutiens. Entrez le mot de passe reçu via @arena.das.ias.",
    "gate.placeholder": "Mot de passe",
    "gate.btn": "Accéder",
    "gate.erro.senha": "Mot de passe incorrect. Vérifiez avec @arena.das.ias.",
    "gate.erro.config": "Variable ANALISE_SENHA non configurée. Contactez l'admin.",
    "acesso.login_titulo": "Déjà soutenu ?",
    "acesso.login_desc":
      "Connectez-vous avec le compte dont vous avez indiqué l'e-mail à @arena.das.ias. Nous débloquons les pronostics sur votre compte — sans mot de passe.",
    "acesso.login_btn": "Se connecter avec mon compte",
    "acesso.naolib_titulo": "Compte pas encore activé",
    "acesso.naolib_desc":
      "Votre compte ({email}) n'est pas encore sur la liste. Soutenez via Pix et écrivez à @arena.das.ias en indiquant qui a fait la contribution et cet e-mail.",
    "acesso.naolib_btn": "💛 Soutenir via Pix",
    "acesso.ou_senha": "ou utilisez le mot de passe de soutien",
    "obrigado.banner": "Merci pour votre soutien 💛 Accès débloqué sur votre compte.",
  },
};

function tx(locale: Locale, key: TxKey): string {
  return STRINGS[locale]?.[key] ?? STRINGS.pt[key];
}

// ─── Seção pública: lista de confrontos ──────────────────────────────────────

function ConfrontosPublicos({
  jogos,
  mapaPaises,
  locale,
}: {
  jogos: JogoR32[];
  mapaPaises: Record<string, string>;
  locale: Locale;
}) {
  return (
    <section style={{ marginBottom: 40 }}>
      <h2
        style={{
          textAlign: "center",
          marginBottom: 8,
          fontSize: 20,
          fontFamily: "var(--ff-display)",
        }}
      >
        {tx(locale, "page.confrontos_titulo")}
      </h2>
      <p
        style={{
          textAlign: "center",
          color: "var(--fg-muted)",
          fontSize: 13,
          marginBottom: 24,
          fontFamily: "var(--ff-mono)",
        }}
      >
        {locale === "pt"
          ? "Monte Carlo · 50.000 simulações"
          : locale === "en"
            ? "Monte Carlo · 50,000 simulations"
            : locale === "es"
              ? "Monte Carlo · 50.000 simulaciones"
              : "Monte Carlo · 50 000 simulations"}
      </p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: 14,
        }}
      >
        {jogos.map((j) => (
          <div
            key={j.numero}
            className="card"
            style={{ padding: "16px 20px" }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 12,
              }}
            >
              <span
                style={{
                  fontFamily: "var(--ff-mono)",
                  fontSize: 11,
                  color: "var(--fg-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                #{j.numero}
              </span>
              {j.definido ? (
                <span
                  style={{
                    background: "var(--ok, #16a34a)",
                    color: "#fff",
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "2px 10px",
                    borderRadius: 999,
                    fontFamily: "var(--ff-mono)",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  {tx(locale, "page.definido")}
                </span>
              ) : (
                <span
                  style={{
                    background: "color-mix(in srgb, var(--accent) 20%, transparent)",
                    color: "var(--accent)",
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "2px 10px",
                    borderRadius: 999,
                    fontFamily: "var(--ff-mono)",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    border: "1px solid color-mix(in srgb, var(--accent) 40%, transparent)",
                  }}
                >
                  {locale === "pt"
                    ? "Projeção"
                    : locale === "en"
                      ? "Projection"
                      : locale === "es"
                        ? "Proyección"
                        : "Projection"}
                </span>
              )}
            </div>

            {/* Times */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr auto 1fr",
                alignItems: "center",
                gap: 8,
              }}
            >
              {/* Time A */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 4 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  {mapaPaises[j.time_a] && (
                    <Bandeira iso={mapaPaises[j.time_a]} nome={j.time_a} size={20} />
                  )}
                  <span style={{ fontSize: 14, fontWeight: 600 }}>{j.time_a}</span>
                </div>
                {!j.definido_a && (
                  <span
                    style={{
                      fontSize: 12,
                      color: "var(--fg-muted)",
                      fontFamily: "var(--ff-mono)",
                    }}
                  >
                    {j.prob_a}%{" "}
                    {locale === "pt"
                      ? "provável"
                      : locale === "en"
                        ? "likely"
                        : locale === "es"
                          ? "probable"
                          : "probable"}
                  </span>
                )}
              </div>

              {/* VS */}
              <span
                style={{
                  fontSize: 13,
                  color: "var(--fg-muted)",
                  fontFamily: "var(--ff-mono)",
                  fontWeight: 700,
                }}
              >
                ×
              </span>

              {/* Time B */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>{j.time_b}</span>
                  {mapaPaises[j.time_b] && (
                    <Bandeira iso={mapaPaises[j.time_b]} nome={j.time_b} size={20} />
                  )}
                </div>
                {!j.definido_b && (
                  <span
                    style={{
                      fontSize: 12,
                      color: "var(--fg-muted)",
                      fontFamily: "var(--ff-mono)",
                    }}
                  >
                    {j.prob_b}%{" "}
                    {locale === "pt"
                      ? "provável"
                      : locale === "en"
                        ? "likely"
                        : locale === "es"
                          ? "probable"
                          : "probable"}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Gate (não liberado) ──────────────────────────────────────────────────────

function GateSection({
  locale,
  erro,
  emailLogado,
}: {
  locale: Locale;
  erro: string | null;
  emailLogado: string | null;
}) {
  return (
    <div className="analise-gate card" style={{ marginTop: 32 }}>
      <h2 style={{ marginBottom: 8 }}>{tx(locale, "gate.titulo")}</h2>

      {emailLogado ? (
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
        <>
          <p className="analise-gate-desc" style={{ fontWeight: 700 }}>
            {tx(locale, "acesso.login_titulo")}
          </p>
          <p className="analise-gate-desc">{tx(locale, "acesso.login_desc")}</p>
          <Link
            href="/login?redirect=/analise-r32"
            className="btn primary block"
            style={{ width: "100%", textAlign: "center" }}
          >
            {tx(locale, "acesso.login_btn")}
          </Link>
        </>
      )}

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

// ─── Grade premium de palpites ────────────────────────────────────────────────

type PlacarSimples = { gols_a: number; gols_b: number };

function consensoDe(
  palpites: Record<string, PlacarSimples>,
): { gols_a: number; gols_b: number; votos: number; total: number } | null {
  const entries = Object.values(palpites);
  if (!entries.length) return null;
  const contagem = new Map<string, { gols_a: number; gols_b: number; votos: number }>();
  for (const p of entries) {
    const k = `${p.gols_a}-${p.gols_b}`;
    const c = contagem.get(k) ?? { gols_a: p.gols_a, gols_b: p.gols_b, votos: 0 };
    c.votos += 1;
    contagem.set(k, c);
  }
  const top = [...contagem.values()].sort(
    (a, b) => b.votos - a.votos || b.gols_a + b.gols_b - (a.gols_a + a.gols_b),
  )[0];
  return { gols_a: top.gols_a, gols_b: top.gols_b, votos: top.votos, total: entries.length };
}

function GradePremium({
  locale,
  palpites,
  jogos,
  mapaPaises,
  iasDict,
  agradecer,
}: {
  locale: Locale;
  palpites: PalpiteRow[];
  jogos: JogoR32[];
  mapaPaises: Record<string, string>;
  iasDict: Record<string, string>;
  agradecer: boolean;
}) {
  if (palpites.length === 0) {
    return (
      <div className="analise-empty" style={{ marginTop: 24 }}>
        <p>{tx(locale, "page.vazio")}</p>
      </div>
    );
  }

  // Organiza: { jogo_numero → { slug → PlacarSimples } }
  const porJogo = new Map<number, Record<string, PlacarSimples>>();
  for (const p of palpites) {
    const m = porJogo.get(p.jogo_numero) ?? {};
    m[p.slug] = { gols_a: p.gols_a, gols_b: p.gols_b };
    porJogo.set(p.jogo_numero, m);
  }

  // Lista de slugs únicos ordenados por popularidade
  const slugsSet = new Set(palpites.map((p) => p.slug));
  const slugs = [...slugsSet].sort(
    (a, b) => scorePopularidade(a) - scorePopularidade(b),
  );

  const iaDistintas = slugs.length;
  const jogosCobertos = porJogo.size;

  return (
    <section style={{ marginTop: 40, marginBottom: 64 }}>
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

      <header className="pa-hero" style={{ marginBottom: 32 }}>
        <div className="pa-hero-glow" aria-hidden="true" />
        <div className="pa-hero-spark" aria-hidden="true">🏆</div>
        <span className="pa-hero-badge">
          {locale === "en"
            ? "Exclusive · R32 picks"
            : locale === "es"
              ? "Exclusivo · pronósticos R32"
              : locale === "fr"
                ? "Exclusif · pronostics R32"
                : "Exclusivo · palpites R32"}
        </span>
        <h2 className="pa-hero-title" style={{ fontSize: 24 }}>
          {tx(locale, "page.palpites_titulo")}
        </h2>
        <p className="pa-hero-lede">{tx(locale, "page.palpites_desc")}</p>
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
          { label: tx(locale, "page.ias"), valor: `${iaDistintas}` },
          { label: tx(locale, "page.jogos_cobertos"), valor: `${jogosCobertos}` },
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

      {/* Por jogo: card com a grade de palpites */}
      <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
        {jogos.map((j) => {
          const mapaJogo = porJogo.get(j.numero);
          if (!mapaJogo || Object.keys(mapaJogo).length === 0) return null;

          const consenso = consensoDe(mapaJogo);
          const slugsJogo = Object.keys(mapaJogo).sort(
            (a, b) => scorePopularidade(a) - scorePopularidade(b),
          );

          return (
            <div key={j.numero} className="card" style={{ padding: "20px 24px" }}>
              {/* Cabeçalho do jogo */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: 8,
                  marginBottom: 16,
                  paddingBottom: 14,
                  borderBottom: "1px solid var(--border)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span
                    style={{
                      fontFamily: "var(--ff-mono)",
                      fontSize: 11,
                      color: "var(--fg-muted)",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                    }}
                  >
                    #{j.numero}
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {mapaPaises[j.time_a] && (
                      <Bandeira iso={mapaPaises[j.time_a]} nome={j.time_a} size={22} />
                    )}
                    <span style={{ fontWeight: 700, fontSize: 15 }}>{j.time_a}</span>
                    <span style={{ color: "var(--fg-muted)", fontSize: 13 }}>×</span>
                    <span style={{ fontWeight: 700, fontSize: 15 }}>{j.time_b}</span>
                    {mapaPaises[j.time_b] && (
                      <Bandeira iso={mapaPaises[j.time_b]} nome={j.time_b} size={22} />
                    )}
                  </div>
                </div>

                {/* Consenso */}
                {consenso && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span
                      style={{
                        fontFamily: "var(--ff-mono)",
                        fontSize: 11,
                        color: "var(--fg-muted)",
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                      }}
                    >
                      {locale === "pt"
                        ? "Consenso"
                        : locale === "en"
                          ? "Consensus"
                          : locale === "es"
                            ? "Consenso"
                            : "Consensus"}
                    </span>
                    <div className="placar-consenso" style={{ fontSize: 18 }}>
                      {consenso.gols_a}×{consenso.gols_b}
                    </div>
                    <span
                      style={{
                        fontFamily: "var(--ff-mono)",
                        fontSize: 11,
                        color: "var(--fg-muted)",
                      }}
                    >
                      ({consenso.votos}/{consenso.total})
                    </span>
                  </div>
                )}
              </div>

              {/* Grade de palpites: IA → placar */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
                  gap: 10,
                }}
              >
                {slugsJogo.map((slug) => {
                  const p = mapaJogo[slug];
                  const nome = iasDict[slug] ?? slug;
                  const marca = marcaDe(slug);
                  const isConsenso =
                    consenso &&
                    p.gols_a === consenso.gols_a &&
                    p.gols_b === consenso.gols_b;

                  return (
                    <div
                      key={slug}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "8px 10px",
                        borderRadius: "var(--r-s, 8px)",
                        background: isConsenso
                          ? "color-mix(in srgb, var(--secondary) 12%, transparent)"
                          : "var(--bg-soft)",
                        border: isConsenso
                          ? "1px solid color-mix(in srgb, var(--secondary) 30%, transparent)"
                          : "1px solid transparent",
                      }}
                    >
                      <IconeIA slug={slug} size={20} title={nome} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 12,
                            color: "var(--fg-mid)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            lineHeight: 1.2,
                          }}
                          title={nome}
                        >
                          {nome}
                        </div>
                      </div>
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 800,
                          fontFamily: "var(--ff-display)",
                          color: isConsenso ? "var(--secondary)" : "var(--fg)",
                          whiteSpace: "nowrap",
                          flexShrink: 0,
                        }}
                      >
                        {p.gols_a}×{p.gols_b}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default async function AnaliseR32Page({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const [params, locale, acesso, projecao, mapaPaises] = await Promise.all([
    searchParams,
    resolverLocale(),
    analiseLiberado(),
    carregarProjecaoR32(),
    carregarMapaPaises(),
  ]);

  const { liberado, email, contribuinte } = acesso;
  const jogos = projecao?.jogos ?? [];

  return (
    <div style={{ marginTop: 32, marginBottom: 64 }}>
      {/* Cabeçalho da página — sempre visível */}
      <div style={{ textAlign: "center", marginBottom: 32, maxWidth: 700, marginInline: "auto" }}>
        <p
          style={{
            fontFamily: "var(--ff-mono)",
            fontSize: 12,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: "var(--secondary)",
            marginBottom: 8,
          }}
        >
          {locale === "pt"
            ? "Arena de IAs · Copa 2026"
            : locale === "en"
              ? "Arena de IAs · World Cup 2026"
              : locale === "es"
                ? "Arena de IAs · Copa 2026"
                : "Arena de IAs · Coupe 2026"}
        </p>
        <h1
          style={{
            fontSize: "clamp(24px, 5vw, 38px)",
            lineHeight: 1.15,
            marginBottom: 12,
          }}
        >
          {tx(locale, "page.titulo")}
        </h1>
        <p
          style={{
            color: "var(--fg-muted)",
            fontSize: 14,
            fontFamily: "var(--ff-mono)",
            marginBottom: 16,
          }}
        >
          {tx(locale, "page.sub")}
        </p>
        <p
          style={{
            color: "var(--fg-mid)",
            fontSize: 14,
            lineHeight: 1.6,
            maxWidth: 620,
            marginInline: "auto",
          }}
        >
          {tx(locale, "page.contexto")}
        </p>
      </div>

      {/* Seção PÚBLICA: confrontos */}
      {jogos.length > 0 && (
        <ConfrontosPublicos
          jogos={jogos}
          mapaPaises={mapaPaises}
          locale={locale}
        />
      )}

      {/* Seção PREMIUM: gated */}
      {liberado ? (
        <PremiumLiberado
          locale={locale}
          jogos={jogos}
          mapaPaises={mapaPaises}
          contribuinte={contribuinte}
        />
      ) : (
        <GateSection
          locale={locale}
          erro={params.erro ?? null}
          emailLogado={email}
        />
      )}
    </div>
  );
}

// Componente auxiliar async pra carregar dados premium (só chega aqui se liberado)
async function PremiumLiberado({
  locale,
  jogos,
  mapaPaises,
  contribuinte,
}: {
  locale: Locale;
  jogos: JogoR32[];
  mapaPaises: Record<string, string>;
  contribuinte: boolean;
}) {
  const serviceKeyAusente = !process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (serviceKeyAusente) {
    return (
      <div style={{ marginTop: 24, textAlign: "center", color: "var(--primary)" }}>
        SUPABASE_SERVICE_ROLE_KEY não configurada.
      </div>
    );
  }

  const [palpites, iasDict] = await Promise.all([
    carregarPalpitesR32(),
    carregarDictIAs(),
  ]);

  return (
    <GradePremium
      locale={locale}
      palpites={palpites ?? []}
      jogos={jogos}
      mapaPaises={mapaPaises}
      iasDict={iasDict}
      agradecer={contribuinte}
    />
  );
}
