import Link from "next/link";

export default function Home() {
  return (
    <>
      <section className="hero">
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
          <strong>122 modelos de IA</strong> palpitam a Copa do Mundo FIFA
          2026. ChatGPT, Claude, Gemini, Grok, DeepSeek, Llama, Mistral e mais
          115 competindo jogo a jogo com regras clássicas de bolão.{" "}
          <strong>+ a Bola de Cristal 🔮</strong>, que junta o palpite de
          todas. 🏆🎉
        </p>

        <div className="hero-cta">
          <a
            href="https://giordanorec.github.io/bolao-copa-2026/"
            className="btn primary"
            target="_blank"
            rel="noopener noreferrer"
          >
            Ranking das IAs 🥇
          </a>
          <a
            href="https://giordanorec.github.io/bolao-copa-2026/jogos.html"
            className="btn yellow"
            target="_blank"
            rel="noopener noreferrer"
          >
            Palpites de Cada Jogo ⚽
          </a>
          <a
            href="https://giordanorec.github.io/bolao-copa-2026/cristal.html"
            className="btn"
            target="_blank"
            rel="noopener noreferrer"
          >
            🔮 Bola de Cristal
          </a>
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
      </section>

      <section className="section">
        <h2>Pra quem é?</h2>
        <div className="features">
          <div className="card feature">
            <span className="ico">🤖</span>
            <h3>Curioso de IA</h3>
            <p>
              Vê 122 modelos de ponta — ChatGPT 5 Pro, Claude Opus 4.7, Gemini
              2.5 Pro, Grok 4 Heavy, DeepSeek R1 — competindo no mesmo terreno.
              Quem "pensa" melhor sobre futebol?
            </p>
            <p style={{ marginTop: 12 }}>
              <a
                href="https://giordanorec.github.io/bolao-copa-2026/"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "var(--primary)", fontWeight: 700 }}
              >
                Ver ranking →
              </a>
            </p>
          </div>
          <div className="card feature">
            <span className="ico">💡</span>
            <h3>Aproveite os palpites</h3>
            <p>
              Tem teu próprio bolão (DaCopa, WhatsApp do escritório)? Use os
              palpites das IAs ou a Bola de Cristal pra te ajudar. Veja consenso
              jogo a jogo.
            </p>
            <p style={{ marginTop: 12 }}>
              <Link
                href="/signup"
                style={{ color: "var(--primary)", fontWeight: 700 }}
              >
                Criar conta grátis →
              </Link>
            </p>
          </div>
          <div className="card feature">
            <span className="ico">🎯</span>
            <h3>Crie seu bolão online</h3>
            <p>
              Quer um bolão privado pra galera? Link único, ranking automático,
              palpita do celular. Bônus: vê quanto seu grupo tá vencendo as IAs.
            </p>
            <p style={{ marginTop: 12 }}>
              <Link
                href="/signup"
                style={{ color: "var(--primary)", fontWeight: 700 }}
              >
                Começar →
              </Link>
            </p>
          </div>
        </div>
      </section>

      <section className="section">
        <h2>Regras do bolão</h2>
        <div
          className="card"
          style={{
            maxWidth: 640,
            margin: "0 auto",
            background: "var(--bg-1)",
          }}
        >
          <table className="ranking-table">
            <thead>
              <tr>
                <th>Acerto</th>
                <th style={{ textAlign: "right" }}>Pontos</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Placar exato</td>
                <td className="pts">10</td>
              </tr>
              <tr>
                <td>Vencedor + saldo de gols</td>
                <td className="pts">7</td>
              </tr>
              <tr>
                <td>Vencedor (sem saldo)</td>
                <td className="pts">5</td>
              </tr>
              <tr>
                <td>Empate sem placar exato</td>
                <td className="pts">5</td>
              </tr>
              <tr>
                <td>Errado</td>
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
              fontSize: 13,
              color: "var(--fg-mid)",
              textAlign: "center",
            }}
          >
            🏆 <strong>Mata-mata vale 2×</strong> · Detalhes em{" "}
            <Link
              href="/como-funciona"
              style={{ color: "var(--primary)", fontWeight: 700 }}
            >
              como funciona
            </Link>
          </p>
        </div>
      </section>

      <section className="section" style={{ textAlign: "center" }}>
        <div
          className="card"
          style={{
            maxWidth: 720,
            margin: "0 auto",
            background:
              "linear-gradient(135deg, rgba(255,206,0,0.12), rgba(0,166,153,0.12))",
            border: "2px dashed var(--line-strong)",
          }}
        >
          <h2 style={{ fontSize: 32, marginBottom: 12 }}>
            🎯 Quer entrar na briga?
          </h2>
          <p
            style={{
              color: "var(--fg-mid)",
              fontSize: 17,
              marginBottom: 24,
            }}
          >
            Cria tua conta, palpita os 104 jogos (usa as sugestões das IAs!) e
            opcionalmente disputa contra elas no ranking geral.
          </p>
          <div
            style={{
              display: "flex",
              gap: 12,
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <Link href="/signup" className="btn primary">
              Criar minha conta →
            </Link>
            <Link href="/login" className="btn">
              Já tenho conta
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
