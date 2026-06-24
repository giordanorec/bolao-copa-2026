import Link from "next/link";
import { promises as fs } from "fs";
import path from "path";
import { resolverLocale, paisDetectado } from "@/lib/locale-server";
import PixCard from "@/components/PixCard";

const PIX_CHAVE = "grec@cin.ufpe.br";

async function carregarPixPayload(): Promise<string> {
  try {
    const fp = path.join(process.cwd(), "public", "pix-payload.txt");
    return (await fs.readFile(fp, "utf-8")).trim();
  } catch {
    return "";
  }
}

export const metadata = {
  title: "Apoie · Bolão das IAs",
  description:
    "Colabore via PIX (Brasil) ou cartão (Stripe). Ajuda a manter as IAs rodando e refazer palpites a cada notícia.",
};

const STRIPE_LINK =
  process.env.NEXT_PUBLIC_STRIPE_DONATE_URL ||
  "https://donate.stripe.com/test_placeholder";

// Quem contribui (qualquer valor) libera os mesmos recursos: palpites v2 +
// sugestões. Os níveis abaixo NÃO mudam funcionalidade — mudam só o selo de
// reconhecimento. Simplifica a gestão e evita virar produto comercial.
const RECOMPENSAS = [
  {
    valor: { br: "R$ 10", intl: "US$ 2" },
    nome: "Apoiador",
    emoji: "💛",
    perks: ["Selo 💛 Apoiador ao lado do seu nome no ranking"],
  },
  {
    valor: { br: "R$ 25", intl: "US$ 5" },
    nome: "Mantenedor",
    emoji: "🛟",
    destaque: true,
    perks: ["Selo 🛟 Mantenedor (cor de destaque, +chamativa)"],
  },
  {
    valor: { br: "R$ 50", intl: "US$ 10" },
    nome: "Padrinho",
    emoji: "👑",
    perks: ["Selo 👑 Padrinho (dourado), o nível de honra do projeto"],
  },
];

const ONDE_VAI = [
  {
    emoji: "🤖",
    titulo: "API das IAs Premium",
    desc: "Coletar palpites dos modelos pagos (Claude Opus, GPT-5 Pro, Gemini 2.5 Pro, Grok 4 Heavy) custa US$ 30-50 por rodada. Quanto mais colaborações, mais rodadas — e mais frescas as previsões durante a Copa.",
  },
  {
    emoji: "☁️",
    titulo: "Vercel + Supabase",
    desc: "Cada novo grupo de amigos = mais carga. Acima do free tier, ~US$ 25/mês escalando conforme cresce.",
  },
  {
    emoji: "🔁",
    titulo: "Refazer palpites a cada notícia",
    desc: "É aqui que faz mais diferença: rodar as IAs DE NOVO toda vez que cair uma notícia importante (lesão, escalação, virada na fase de grupos). Hoje rodamos 1×; com colaborações, vira contínuo.",
  },
];

export default async function ColaborarPage() {
  const [locale, pixPayload, pais] = await Promise.all([
    resolverLocale(),
    carregarPixPayload(),
    paisDetectado(),
  ]);
  const isBR = !pais || pais.toUpperCase() === "BR";
  const stripeAtivo =
    STRIPE_LINK && !STRIPE_LINK.includes("test_placeholder");

  // Conteúdo dos blocos PIX e Stripe — renderizo em ordem diferente conforme país
  const blocoPix = (
    <section id="pix" className="colaborar-pix-principal" key="pix">
      <div className="colaborar-pix-header">
        <h2>
          {isBR ? "💸 Colaborar via PIX" : "💸 PIX (Brazil only)"}
        </h2>
        <p>
          {isBR
            ? "Sem taxa, instantâneo, brasileiro. Escolhe o valor no app do banco."
            : "Free of fees, instant, Brazil-only. Use this if you have a Brazilian bank account."}
        </p>
      </div>
      <PixCard payload={pixPayload} chave={PIX_CHAVE} />
    </section>
  );

  const blocoStripe = stripeAtivo ? (
    <section id="stripe" className="colaborar-stripe-principal" key="stripe">
      <div className="colaborar-pix-header">
        <h2>
          {isBR ? "💳 Colaborar com cartão (Stripe)" : "💳 Support with card (Stripe)"}
        </h2>
        <p>
          {isBR
            ? "Aceita cartão internacional. Taxa do Stripe ~4% fica retida no processamento."
            : "International cards accepted. ~4% processing fee goes to Stripe."}
        </p>
      </div>
      <div className="colaborar-stripe-card">
        <p className="colaborar-stripe-titulo">
          {isBR
            ? "Você escolhe o valor no checkout do Stripe."
            : "You choose the amount on Stripe's checkout."}
        </p>
        <a
          href={STRIPE_LINK}
          target="_blank"
          rel="noopener noreferrer"
          className="btn primary block"
          style={{ fontSize: 16, padding: "14px 28px" }}
        >
          {isBR
            ? "💳 Colaborar via cartão / Stripe →"
            : "💳 Donate with card →"}
        </a>
        <small className="colaborar-stripe-nota">
          {isBR
            ? "Após pagar, manda print no Instagram @arena.das.ias pra liberar as recompensas."
            : "After paying, DM us on Instagram @arena.das.ias to unlock rewards."}
        </small>
      </div>
    </section>
  ) : null;

  // Pra BR: PIX principal, Stripe secundário | Pra exterior: Stripe principal, PIX secundário
  const ordemPagamento = isBR
    ? [blocoPix, blocoStripe]
    : [blocoStripe, blocoPix];

  // CTA href dos tiers
  const ctaHref = isBR ? "#pix" : stripeAtivo ? STRIPE_LINK : "#pix";
  const ctaTarget = !isBR && stripeAtivo ? "_blank" : undefined;
  const ctaMetodo = isBR ? "PIX" : stripeAtivo ? "Stripe" : "PIX";

  return (
    <div className="colaborar-page">
      <section className="colaborar-hero">
        <div className="colaborar-hero-emoji">💛</div>
        <p className="colaborar-hero-kicker">
          {isBR ? "Apoie o projeto" : "Support the project"}
        </p>
        <h1>
          {isBR
            ? "Mantém o Bolão das IAs no ar."
            : "Keep the AI Soccer Pool running."}
        </h1>
        <p className="colaborar-hero-lede">
          <strong>
            {isBR
              ? "Sem ads, sem casa de aposta."
              : "No ads, no betting."}
          </strong>{" "}
          {isBR
            ? "Qualquer colaboração libera os palpites v2 e cobre as APIs das IAs. Os níveis abaixo mudam só o "
            : "Any contribution unlocks the v2 picks and covers the AI APIs. The tiers below only change your "}
          <strong>
            {isBR ? "selo de reconhecimento" : "recognition badge"}
          </strong>
          {isBR ? ", nunca o acesso." : ", never the access."}
        </p>
      </section>

      <section className="colaborar-recompensas">
        <h2>{isBR ? "O que você ganha" : "What you get"}</h2>
        <div className="colaborar-recompensas-grid">
          {RECOMPENSAS.map((r) => {
            const v = isBR ? r.valor.br : r.valor.intl;
            return (
              <div
                key={v}
                className={`colaborar-tier ${r.destaque ? "colaborar-tier-destaque" : ""}`}
              >
                {r.destaque && (
                  <div className="colaborar-tier-badge">
                    {isBR ? "★ mais escolhido" : "★ most popular"}
                  </div>
                )}
                <div className="colaborar-tier-emoji">{r.emoji}</div>
                <div className="colaborar-tier-nome">{r.nome}</div>
                <div className="colaborar-tier-valor">{v}</div>
                <ul>
                  {r.perks.map((p, i) => (
                    <li key={i}>{p}</li>
                  ))}
                </ul>
                <a
                  href={ctaHref}
                  target={ctaTarget}
                  rel={ctaTarget ? "noopener noreferrer" : undefined}
                  className={`btn ${r.destaque ? "primary" : ""} block`}
                >
                  {isBR ? `💸 Colaborar ${v}` : `💳 Donate ${v}`} via {ctaMetodo} →
                </a>
              </div>
            );
          })}
        </div>
        <p className="colaborar-recompensas-nota">
          🎯{" "}
          {isBR
            ? "Todos os níveis liberam o mesmo acesso (palpites v2 + sugestões) — a diferença é só o selo. Quer colaborar outro valor? Escolhe livremente no formulário abaixo."
            : "Every tier unlocks the same access (v2 picks + suggestions) — only the badge differs. Want to give a different amount? Choose freely below."}
        </p>
      </section>

      {/* Bloco principal de pagamento (ordem depende do país) */}
      {ordemPagamento}

      {/* Passo pra liberar os palpites v2 — feito pelo Instagram de propósito,
          pra que quem contribui passe a seguir a conta e a gente continue
          se comunicando por lá. */}
      <section className="colaborar-v2unlock">
        <div className="colaborar-v2unlock-card">
          <div className="colaborar-v2unlock-emoji">📲</div>
          <h2>
            {isBR
              ? "Último passo: libere os palpites v2"
              : "Last step: unlock the v2 picks"}
          </h2>
          <p>
            {isBR
              ? "Depois de contribuir, manda uma mensagem no nosso Instagram com duas coisas:"
              : "After contributing, send us a DM on Instagram with two things:"}
          </p>
          <ol className="colaborar-v2unlock-passos">
            <li>
              {isBR
                ? "Quem fez a contribuição (pra gente conferir o Pix/cartão);"
                : "Who made the contribution (so we can match the Pix/card);"}
            </li>
            <li>
              <strong>
                {isBR
                  ? "O e-mail da sua conta aqui no site."
                  : "The email of your account here on the site."}
              </strong>{" "}
              {isBR
                ? "É nele que a gente libera os palpites v2 atualizados — sem senha, direto na sua conta."
                : "That's where we unlock the updated v2 picks — no password, straight on your account."}
            </li>
          </ol>
          <a
            href="https://instagram.com/arena.das.ias"
            target="_blank"
            rel="noopener noreferrer"
            className="btn primary block"
            style={{ fontSize: 16, padding: "14px 28px", marginTop: 8 }}
          >
            {isBR
              ? "📲 Falar com @arena.das.ias no Instagram →"
              : "📲 Message @arena.das.ias on Instagram →"}
          </a>
          <small className="colaborar-v2unlock-nota">
            {isBR
              ? "Aproveita e segue a conta: é por lá que avisamos cada nova rodada de palpites. 💛"
              : "While you're there, follow us: that's where we announce every new round of picks. 💛"}
          </small>
        </div>
      </section>

      <section className="colaborar-onde">
        <h2>{isBR ? "Pra onde vai cada real" : "Where every cent goes"}</h2>
        <div className="colaborar-onde-grid">
          {ONDE_VAI.map((o) => (
            <div key={o.titulo} className="colaborar-onde-card">
              <div className="colaborar-onde-emoji">{o.emoji}</div>
              <strong>{o.titulo}</strong>
              <p>{o.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <div style={{ textAlign: "center", marginTop: 40 }}>
        <Link href="/" style={{ color: "var(--primary)", fontWeight: 700 }}>
          ← {isBR ? "Voltar pra home" : "Back home"}
        </Link>
      </div>
    </div>
  );
}
