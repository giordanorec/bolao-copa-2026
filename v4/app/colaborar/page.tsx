import Link from "next/link";
import { promises as fs } from "fs";
import path from "path";
import { resolverLocale } from "@/lib/locale-server";
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
    "Colabore via Stripe ou PIX. Ajuda a manter as IAs rodando e refazer palpites a cada notícia.",
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

export default async function DoarPage() {
  const [locale, pixPayload] = await Promise.all([
    resolverLocale(),
    carregarPixPayload(),
  ]);
  return (
    <div className="colaborar-page">
      <section className="colaborar-hero">
        <div className="colaborar-hero-emoji">💛</div>
        <p className="colaborar-hero-kicker">Apoie o projeto</p>
        <h1>Mantém o Bolão das IAs no ar.</h1>
        <p className="colaborar-hero-lede">
          <strong>sem ads, sem casa de aposta</strong>.
          Sua colaboração cobre as APIs das IAs e libera experimentos mais avançados.
          Em troca, você ganha <strong>recompensas tangíveis</strong>.
        </p>
      </section>

      <section className="colaborar-recompensas">
        <h2>O que você ganha</h2>
        <div className="colaborar-recompensas-grid">
          {RECOMPENSAS.map((r) => (
            <div
              key={r.valor}
              className={`colaborar-tier ${r.destaque ? "colaborar-tier-destaque" : ""}`}
            >
              {r.destaque && (
                <div className="colaborar-tier-badge">★ mais escolhido</div>
              )}
              <div className="colaborar-tier-emoji">{r.emoji}</div>
              <div className="colaborar-tier-nome">{r.nome}</div>
              <div className="colaborar-tier-valor">{r.valor}</div>
              <ul>
                {r.perks.map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
              <a
                href="#pix"
                className={`btn ${r.destaque ? "primary" : ""} block`}
              >
                💸 Colaborar {r.valor} via PIX →
              </a>
            </div>
          ))}
        </div>
        <p className="colaborar-recompensas-nota">
          🎯 Quer colaborar outro valor? Escolhe livremente no PIX abaixo.
        </p>
      </section>

      {/* PIX — método principal */}
      <section id="pix" className="colaborar-pix-principal">
        <div className="colaborar-pix-header">
          <h2>💸 Colaborar via PIX</h2>
          <p>
            Sem taxa, instantâneo, brasileiro. Escolhe o valor no app do banco.
          </p>
        </div>
        <PixCard payload={pixPayload} chave={PIX_CHAVE} />
      </section>

      <section className="colaborar-onde">
        <h2>Pra onde vai cada real</h2>
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

      {STRIPE_LINK &&
        !STRIPE_LINK.includes("test_placeholder") && (
          <section className="colaborar-cartao">
            <h3>💳 De fora do Brasil ou prefere cartão?</h3>
            <p>
              Aceita cartão internacional via Stripe. Taxa de processamento ~4%
              fica com o Stripe, mas se for sua melhor opção, vale.
            </p>
            <a
              href={STRIPE_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="btn"
            >
              Colaborar com cartão (Stripe) →
            </a>
          </section>
        )}

      <div style={{ textAlign: "center", marginTop: 40 }}>
        <Link href="/" style={{ color: "var(--primary)", fontWeight: 700 }}>
          ← Voltar pra home
        </Link>
      </div>
    </div>
  );
}
