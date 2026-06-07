import Link from "next/link";

const destinos = [
  {
    href: "https://giordanorec.github.io/bolao-copa-2026/serie-a.html",
    external: true,
    emoji: "🏆",
    titulo: "Série A das IAs",
    sub: "Os 10 cabeças de chave",
    desc: "ChatGPT 5 Pro, Claude Opus 4.7, Gemini 2.5 Pro, Grok 4 Heavy, DeepSeek R1, Perplexity, Copilot, Le Chat, Meta AI e Qwen 3 Max — coletados via interface web com search.",
    cta: "Ver os 10 →",
  },
  {
    href: "https://giordanorec.github.io/bolao-copa-2026/jogos.html",
    external: true,
    emoji: "⚽",
    titulo: "Palpites Jogo a Jogo",
    sub: "Pra usar no seu bolão",
    desc: "Pros 104 jogos: qual placar cada IA chutou, quantas concordam, o consenso. Sem precisar criar conta — copia pro seu bolão de WhatsApp.",
    cta: "Espiar →",
  },
  {
    href: "/signup",
    external: false,
    emoji: "🎯",
    titulo: "Crie Seu Bolão",
    sub: "Privado, pra galera",
    desc: "Link único pra convidar amigos. Palpita do celular (ou copia de qualquer IA num clique). Ranking automático. Tudo grátis.",
    cta: "Criar conta →",
  },
  {
    href: "https://giordanorec.github.io/bolao-copa-2026/ias.html",
    external: true,
    emoji: "🤖",
    titulo: "Ranking das 122",
    sub: "Todas as IAs lado a lado",
    desc: "Ranking completo: chute mais épico, IAs que mais erram, quem chuta zero a zero (a medrosa), quem sempre crava 3×2.",
    cta: "Ranking completo →",
  },
  {
    href: "/ranking-geral",
    external: false,
    emoji: "🌍",
    titulo: "Hall da Fama",
    sub: "Humanos + IAs juntos",
    desc: "Humanos opt-in disputando contra as 122 IAs + Bola de Cristal. O ranking onde todo mundo briga no mesmo placar.",
    cta: "Entrar no Hall →",
  },
  {
    href: "https://giordanorec.github.io/bolao-copa-2026/cristal.html",
    external: true,
    emoji: "🔮",
    titulo: "Bola de Cristal",
    sub: "O palpite consenso",
    desc: "Pra cada jogo, juntamos o placar mais votado entre TODAS as 122 IAs. Sabedoria das massas aplicada a futebol.",
    cta: "Olhar a Cristal →",
  },
];

export default function Home() {
  return (
    <>
      <section className="hero">
        <div className="container">
          <div className="hero-emojis">
            <span>🇧🇷</span>
            <span>⚽</span>
            <span>🔮</span>
          </div>
          <h1>
            Quem chuta melhor?
            <br />
            <span className="accent">As IAs palpitam.</span>
          </h1>
          <p className="lede">
            <strong>122 modelos de IA</strong> + Bola de Cristal palpitam os
            104 jogos da Copa 2026. Espie o que cada uma chutou, copie pro seu
            bolão, ou crie um privado pra galera. <strong>Tudo de graça.</strong> 🏆
          </p>

          <div className="hero-cta">
            <a
              href="https://giordanorec.github.io/bolao-copa-2026/serie-a.html"
              className="btn primary"
              target="_blank"
              rel="noopener noreferrer"
            >
              🏆 Série A das IAs
            </a>
            <a
              href="https://giordanorec.github.io/bolao-copa-2026/jogos.html"
              className="btn yellow"
              target="_blank"
              rel="noopener noreferrer"
            >
              ⚽ Palpites Jogo a Jogo
            </a>
            <Link href="/signup" className="btn">
              🎯 Crie Seu Bolão
            </Link>
          </div>

          <div className="stats">
            <div className="stat">
              <div className="stat-num">122</div>
              <span className="stat-lbl">IAs no bolão</span>
            </div>
            <div className="stat">
              <div className="stat-num">104</div>
              <span className="stat-lbl">Jogos da Copa</span>
            </div>
            <div className="stat">
              <div className="stat-num">8.6k+</div>
              <span className="stat-lbl">Palpites coletados</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────── 6 DESTINOS ─────────── */}
      <section className="section">
        <div className="container">
          <h2 style={{ textAlign: "center", marginBottom: 12 }}>
            Por onde começar
          </h2>
          <p
            style={{
              textAlign: "center",
              color: "var(--fg-mid)",
              fontSize: 17,
              marginBottom: 48,
              maxWidth: 600,
              marginInline: "auto",
            }}
          >
            Seis caminhos, mesma porta de entrada.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: 22,
            }}
          >
            {destinos.map((d) =>
              d.external ? (
                <a
                  key={d.href}
                  href={d.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="card hoverable destino-card"
                >
                  <CardConteudo {...d} />
                </a>
              ) : (
                <Link
                  key={d.href}
                  href={d.href}
                  className="card hoverable destino-card"
                >
                  <CardConteudo {...d} />
                </Link>
              ),
            )}
          </div>
        </div>
      </section>

      {/* ─────────── REGRAS ─────────── */}
      <section className="section">
        <div className="container">
          <h2 style={{ textAlign: "center", marginBottom: 32 }}>
            Como funciona o placar
          </h2>
          <div className="card" style={{ maxWidth: 640, margin: "0 auto" }}>
            <table className="regras-table">
              <thead>
                <tr>
                  <th>Acerto</th>
                  <th style={{ textAlign: "right" }}>Pts</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>🎯 Placar exato</td>
                  <td className="pts">10</td>
                </tr>
                <tr>
                  <td>📏 Vencedor + saldo de gols</td>
                  <td className="pts">7</td>
                </tr>
                <tr>
                  <td>✅ Vencedor (sem saldo)</td>
                  <td className="pts">5</td>
                </tr>
                <tr>
                  <td>🤝 Empate (sem placar exato)</td>
                  <td className="pts">5</td>
                </tr>
                <tr>
                  <td>❌ Errado</td>
                  <td className="pts" style={{ color: "var(--fg-muted)" }}>
                    0
                  </td>
                </tr>
              </tbody>
            </table>
            <p
              style={{
                marginTop: 20,
                padding: 14,
                background: "var(--bg-soft)",
                borderRadius: "var(--r-m)",
                fontSize: 14,
                color: "var(--fg-mid)",
                textAlign: "center",
              }}
            >
              🏆 <strong>Mata-mata vale 2×.</strong> Detalhes em{" "}
              <Link
                href="/como-funciona"
                style={{ color: "var(--primary)", fontWeight: 700 }}
              >
                como funciona
              </Link>
              .
            </p>
          </div>
        </div>
      </section>
    </>
  );
}

function CardConteudo({
  emoji,
  titulo,
  sub,
  desc,
  cta,
}: {
  emoji: string;
  titulo: string;
  sub: string;
  desc: string;
  cta: string;
}) {
  return (
    <>
      <div
        style={{
          fontSize: 56,
          marginBottom: 12,
          lineHeight: 1,
        }}
      >
        {emoji}
      </div>
      <h3
        style={{
          fontFamily: "var(--ff-display)",
          fontVariationSettings: "var(--ff-display-vs)",
          fontStyle: "var(--ff-display-style)",
          fontWeight: "var(--ff-display-weight)",
          fontSize: 28,
          color: "var(--secondary)",
          marginBottom: 4,
          letterSpacing: "var(--letterspacing-display)",
          lineHeight: 1.05,
        }}
      >
        {titulo}
      </h3>
      <p
        style={{
          fontFamily: "var(--ff-mono)",
          fontSize: 12,
          color: "var(--fg-muted)",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          marginBottom: 14,
          fontWeight: 700,
        }}
      >
        {sub}
      </p>
      <p
        style={{
          color: "var(--fg-mid)",
          fontSize: 14,
          lineHeight: 1.5,
          marginBottom: 18,
          flexGrow: 1,
        }}
      >
        {desc}
      </p>
      <p
        style={{
          color: "var(--primary)",
          fontWeight: 700,
          fontSize: 15,
          margin: 0,
        }}
      >
        {cta}
      </p>
    </>
  );
}
