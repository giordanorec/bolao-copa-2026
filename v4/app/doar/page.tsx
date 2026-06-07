import Link from "next/link";
import { resolverLocale } from "@/lib/locale-server";

export const metadata = {
  title: "Apoie · Bolão das IAs",
  description:
    "Doe via Stripe ou PIX. Ajuda a manter as IAs rodando e refazer palpites a cada notícia.",
};

const STRIPE_LINK =
  process.env.NEXT_PUBLIC_STRIPE_DONATE_URL ||
  "https://donate.stripe.com/test_placeholder";

const RECOMPENSAS = [
  {
    valor: "R$ 10",
    nome: "Apoiador",
    emoji: "💛",
    perks: [
      "Badge 💛 Apoiador no seu perfil + ao lado do nome no ranking",
      "Acesso ao grupo privado de WhatsApp do projeto",
      "Voto na sugestão de IAs novas pra adicionar",
    ],
  },
  {
    valor: "R$ 25",
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
    valor: "R$ 100",
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
    desc: "Coletar palpites dos modelos pagos (Claude Opus, GPT-5 Pro, Gemini 2.5 Pro, Grok 4 Heavy) custa US$ 30-50 por rodada. Quanto mais doações, mais rodadas — e mais frescas as previsões durante a Copa.",
  },
  {
    emoji: "☁️",
    titulo: "Vercel + Supabase",
    desc: "Cada novo grupo de amigos = mais carga. Acima do free tier, ~US$ 25/mês escalando conforme cresce.",
  },
  {
    emoji: "🔁",
    titulo: "Refazer palpites a cada notícia",
    desc: "É aqui que faz mais diferença: rodar as IAs DE NOVO toda vez que cair uma notícia importante (lesão, escalação, virada na fase de grupos). Hoje rodamos 1×; com doações, vira contínuo.",
  },
];

export default async function DoarPage() {
  const locale = await resolverLocale();
  return (
    <div className="doar-page">
      <section className="doar-hero">
        <div className="doar-hero-emoji">💛</div>
        <p className="doar-hero-kicker">Apoie o projeto</p>
        <h1>Mantém o Bolão das IAs no ar.</h1>
        <p className="doar-hero-lede">
          Tudo gratuito e <strong>sem ads, sem casa de aposta</strong>.
          Sua doação cobre as APIs das IAs e libera experimentos mais avançados.
          Em troca, você ganha <strong>recompensas tangíveis</strong>.
        </p>
      </section>

      <section className="doar-recompensas">
        <h2>O que você ganha</h2>
        <div className="doar-recompensas-grid">
          {RECOMPENSAS.map((r) => (
            <div
              key={r.valor}
              className={`doar-tier ${r.destaque ? "doar-tier-destaque" : ""}`}
            >
              {r.destaque && (
                <div className="doar-tier-badge">★ mais escolhido</div>
              )}
              <div className="doar-tier-emoji">{r.emoji}</div>
              <div className="doar-tier-nome">{r.nome}</div>
              <div className="doar-tier-valor">{r.valor}</div>
              <ul>
                {r.perks.map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
              <a
                href={STRIPE_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className={`btn ${r.destaque ? "primary" : ""} block`}
              >
                {locale === "en"
                  ? "Donate"
                  : locale === "es"
                    ? "Donar"
                    : locale === "fr"
                      ? "Donner"
                      : "Doar"}{" "}
                {r.valor} →
              </a>
            </div>
          ))}
        </div>
        <p className="doar-recompensas-nota">
          🎯 Quer doar outro valor?{" "}
          <a href={STRIPE_LINK} target="_blank" rel="noopener noreferrer">
            Clique aqui
          </a>{" "}
          — você escolhe quanto.
        </p>
      </section>

      <section className="doar-onde">
        <h2>Pra onde vai cada real</h2>
        <div className="doar-onde-grid">
          {ONDE_VAI.map((o) => (
            <div key={o.titulo} className="doar-onde-card">
              <div className="doar-onde-emoji">{o.emoji}</div>
              <strong>{o.titulo}</strong>
              <p>{o.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="doar-pix">
        <h2>Prefere PIX?</h2>
        <p>
          Mesma coisa — você ganha as recompensas do tier proporcional ao valor.
        </p>
        <div className="doar-pix-card">
          <span className="doar-pix-label">CHAVE PIX (email)</span>
          <code className="doar-pix-code">grec@cin.ufpe.br</code>
          <small>
            Manda o comprovante no Instagram{" "}
            <a
              href="https://instagram.com/arena.das.ias"
              target="_blank"
              rel="noopener noreferrer"
            >
              @arena.das.ias
            </a>{" "}
            pra liberar as recompensas
          </small>
        </div>
      </section>

      <div style={{ textAlign: "center", marginTop: 40 }}>
        <Link href="/" style={{ color: "var(--primary)", fontWeight: 700 }}>
          ← Voltar pra home
        </Link>
      </div>
    </div>
  );
}
