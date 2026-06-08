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

const RECOMPENSAS = [
  {
    valor: { br: "R$ 10", intl: "US$ 2" },
    nome: "Apoiador",
    emoji: "💛",
    perks: [
      "Badge 💛 Apoiador no seu perfil + ao lado do nome no ranking",
      "Acesso ao grupo privado de WhatsApp do projeto",
      "Voto na sugestão de IAs novas pra adicionar",
    ],
  },
  {
    valor: { br: "R$ 25", intl: "US$ 5" },
    nome: "Mantenedor",
    emoji: "🛟",
    destaque: true,
    perks: [
      "Tudo do Apoiador",
      "Badge 🛟 Mantenedor (cor diferente, +chamativa)",
      "Acesso antecipado a experimentos novos da Arena das IAs",
      "Voz ativa: 1 voto no próximo experimento (Bola de Cristal pra Oscar? Eleição? Você decide)",
    ],
  },
  {
    valor: { br: "R$ 100", intl: "US$ 20" },
    nome: "Padrinho",
    emoji: "👑",
    perks: [
      "Tudo do Mantenedor",
      "Badge 👑 Padrinho (dourado)",
      "Seu nome (ou da sua empresa) no rodapé do site, em todas as páginas",
      "Direito a sugerir 1 IA pra adicionar manualmente no bolão (sua escolha)",
    ],
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
            ? "Sua colaboração cobre as APIs das IAs e libera experimentos mais avançados. Em troca, você ganha "
            : "Your contribution covers AI APIs and unlocks new experiments. In return, you get "}
          <strong>
            {isBR ? "recompensas tangíveis" : "tangible rewards"}
          </strong>
          .
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
            ? "Quer colaborar outro valor? Escolhe livremente no formulário abaixo."
            : "Want to give a different amount? Choose freely below."}
        </p>
      </section>

      {/* Bloco principal de pagamento (ordem depende do país) */}
      {ordemPagamento}

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
