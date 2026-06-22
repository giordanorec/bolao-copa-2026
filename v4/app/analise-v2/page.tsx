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
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/admin";
import { resolverLocale } from "@/lib/locale-server";
import type { Locale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Palpites v2 · Análise Premium · Bolão das IAs",
  description:
    "Comparação dos palpites v1 × v2 das IAs — acesso exclusivo para contribuintes.",
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

  const { data, error } = await admin
    .from("palpite_v2")
    .select("slug, jogo_numero, gols_a, gols_b, modo, coletado_em")
    .order("jogo_numero", { ascending: true })
    .order("slug", { ascending: true });

  if (error) {
    console.error("[analise-v2] Erro ao carregar palpite_v2:", error.message);
    return null;
  }
  return data as PalpiteV2Row[];
}

// ─── Strings localizadas ─────────────────────────────────────────

type TxKeys =
  | "gate.titulo"
  | "gate.desc"
  | "gate.placeholder"
  | "gate.btn"
  | "gate.erro.senha"
  | "gate.erro.config"
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
    "gate.titulo": "Análise v2",
    "gate.desc":
      "Conteúdo exclusivo para contribuintes. Digite a senha recebida pelo Instagram @arena.das.ias.",
    "gate.placeholder": "Senha",
    "gate.btn": "Acessar",
    "gate.erro.senha": "Senha incorreta. Confira com @arena.das.ias.",
    "gate.erro.config":
      "Env ANALISE_SENHA não configurada. Contate o admin.",
    "page.titulo": "Análise v2 · Palpites Atualizados",
    "page.lede":
      "Comparação v1 (pré-Copa) × v2 (informado, jogos 41–72). Dados lidos server-side; não aparecem no HTML sem a senha.",
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
    "gate.titulo": "Analysis v2",
    "gate.desc":
      "Exclusive content for supporters. Enter the password received via @arena.das.ias on Instagram.",
    "gate.placeholder": "Password",
    "gate.btn": "Access",
    "gate.erro.senha": "Wrong password. Check with @arena.das.ias.",
    "gate.erro.config":
      "ANALISE_SENHA env var not configured. Contact admin.",
    "page.titulo": "v2 Analysis · Updated Picks",
    "page.lede":
      "v1 (pre-tournament) × v2 (informed, games 41–72). Data is server-rendered; it doesn't appear in HTML without the password.",
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
    "gate.titulo": "Análisis v2",
    "gate.desc":
      "Contenido exclusivo para colaboradores. Introduce la contraseña recibida en @arena.das.ias.",
    "gate.placeholder": "Contraseña",
    "gate.btn": "Acceder",
    "gate.erro.senha": "Contraseña incorrecta. Verifica con @arena.das.ias.",
    "gate.erro.config":
      "ANALISE_SENHA no configurado. Contacta al admin.",
    "page.titulo": "Análisis v2 · Pronósticos actualizados",
    "page.lede":
      "v1 (antes del torneo) × v2 (informados, partidos 41–72). Datos renderizados en el servidor; no aparecen en el HTML sin la contraseña.",
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
    "gate.titulo": "Analyse v2",
    "gate.desc":
      "Contenu exclusif pour les soutiens. Entrez le mot de passe reçu via @arena.das.ias.",
    "gate.placeholder": "Mot de passe",
    "gate.btn": "Accéder",
    "gate.erro.senha":
      "Mot de passe incorrect. Vérifiez avec @arena.das.ias.",
    "gate.erro.config":
      "Variable ANALISE_SENHA non configurée. Contactez l'admin.",
    "page.titulo": "Analyse v2 · Pronostics mis à jour",
    "page.lede":
      "v1 (avant le tournoi) × v2 (informés, matchs 41–72). Données rendues côté serveur ; elles n'apparaissent pas dans le HTML sans mot de passe.",
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
}: {
  locale: Locale;
  erro: string | null;
}) {
  return (
    <div className="analise-gate card">
      <h1>{tx(locale, "gate.titulo")}</h1>
      <p className="analise-gate-desc">{tx(locale, "gate.desc")}</p>
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

// ─── Componente de conteúdo (palpites v2 renderizados server-side) ──

function ConteudoPage({
  locale,
  palpites,
  serviceKeyAusente,
}: {
  locale: Locale;
  palpites: PalpiteV2Row[] | null;
  serviceKeyAusente: boolean;
}) {
  if (serviceKeyAusente) {
    return (
      <div className="analise-page">
        <h1>{tx(locale, "page.titulo")}</h1>
        <p
          className="analise-lede"
          style={{ color: "var(--primary)" }}
        >
          SUPABASE_SERVICE_ROLE_KEY não configurada. Configure a env var na
          Vercel.
        </p>
      </div>
    );
  }

  if (!palpites || palpites.length === 0) {
    return (
      <div className="analise-page">
        <h1>{tx(locale, "page.titulo")}</h1>
        <p className="analise-lede">{tx(locale, "page.lede")}</p>
        <div className="analise-empty">
          <p>📭 {tx(locale, "page.vazio")}</p>
        </div>
      </div>
    );
  }

  // Estatísticas rápidas
  const totalRegistros = palpites.length;
  const iaDistintas = new Set(palpites.map((p) => p.slug)).size;
  const jogosCobertos = new Set(palpites.map((p) => p.jogo_numero)).size;

  // Agrupar por jogo
  const porJogo = new Map<number, PalpiteV2Row[]>();
  for (const p of palpites) {
    const arr = porJogo.get(p.jogo_numero) ?? [];
    arr.push(p);
    porJogo.set(p.jogo_numero, arr);
  }
  const jogosOrdenados = [...porJogo.keys()].sort((a, b) => a - b);

  return (
    <div className="analise-page">
      <h1>{tx(locale, "page.titulo")}</h1>
      <p className="analise-lede">{tx(locale, "page.lede")}</p>

      {/* Resumo estatístico */}
      <div
        style={{
          display: "flex",
          gap: 24,
          flexWrap: "wrap",
          marginBottom: 32,
        }}
      >
        {[
          {
            label: tx(locale, "page.total"),
            valor: totalRegistros,
          },
          {
            label: tx(locale, "page.ias_distintas"),
            valor: iaDistintas,
          },
          {
            label: tx(locale, "page.jogos_cobertos"),
            valor: jogosCobertos,
          },
        ].map((s) => (
          <div
            key={s.label}
            className="card"
            style={{
              padding: "16px 24px",
              minWidth: 140,
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: 32,
                fontWeight: 900,
                fontFamily: "var(--ff-display)",
                color: "var(--secondary)",
              }}
            >
              {s.valor}
            </div>
            <div
              style={{
                fontSize: 12,
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

      {/* Tabela por jogo */}
      {jogosOrdenados.map((numJogo) => {
        const rows = porJogo.get(numJogo)!;
        return (
          <section key={numJogo} style={{ marginBottom: 40 }}>
            <h2
              style={{
                fontSize: 18,
                fontWeight: 700,
                marginBottom: 8,
                fontFamily: "var(--ff-sans)",
              }}
            >
              {tx(locale, "page.jogo")} #{numJogo}{" "}
              <span
                style={{
                  fontSize: 12,
                  color: "var(--fg-muted)",
                  fontFamily: "var(--ff-mono)",
                  fontWeight: 400,
                }}
              >
                ({rows.length} IAs)
              </span>
            </h2>
            <div style={{ overflowX: "auto" }}>
              <table className="analise-jogo-table">
                <thead>
                  <tr>
                    <th>{tx(locale, "page.ia")}</th>
                    <th>{tx(locale, "page.modo")}</th>
                    <th>{tx(locale, "page.v2")}</th>
                    <th>{tx(locale, "page.coletado")}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((p) => (
                    <tr key={`${p.slug}-${p.jogo_numero}`}>
                      <td
                        style={{
                          fontFamily: "var(--ff-mono)",
                          fontSize: 12,
                          color: "var(--fg)",
                        }}
                      >
                        {p.slug}
                      </td>
                      <td
                        style={{
                          fontSize: 11,
                          color: "var(--fg-muted)",
                          fontFamily: "var(--ff-mono)",
                        }}
                      >
                        {p.modo}
                      </td>
                      <td>
                        <strong style={{ fontSize: 14 }}>
                          {p.gols_a}×{p.gols_b}
                        </strong>
                      </td>
                      <td
                        style={{
                          fontSize: 11,
                          color: "var(--fg-muted)",
                          fontFamily: "var(--ff-mono)",
                        }}
                      >
                        {new Date(p.coletado_em).toLocaleString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}
    </div>
  );
}

// ─── Página principal ────────────────────────────────────────────

export default async function AnaliseV2Page({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const [params, locale] = await Promise.all([
    searchParams,
    resolverLocale(),
  ]);

  // 1. Não autenticado → form de senha
  const autenticado = await isAutenticado();
  if (!autenticado) {
    const erro = params.erro ?? null;
    return <GatePage locale={locale} erro={erro} />;
  }

  // 2. Autenticado → lê dados v2 server-side via service_role
  //    (o dado v2 NUNCA passa pelo browser antes desta verificação)
  const serviceKeyAusente = !process.env.SUPABASE_SERVICE_ROLE_KEY;
  const palpites = serviceKeyAusente ? null : await carregarPalpitesV2();

  return (
    <ConteudoPage
      locale={locale}
      palpites={palpites}
      serviceKeyAusente={serviceKeyAusente}
    />
  );
}
