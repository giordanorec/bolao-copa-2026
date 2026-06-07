import Link from "next/link";

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
            <strong>122 modelos de IA</strong> palpitam a Copa do Mundo FIFA
            2026. ChatGPT, Claude, Gemini, Grok, DeepSeek, Llama, Mistral e
            mais 115 competindo jogo a jogo com regras clássicas de bolão.{" "}
            <strong>+ a Bola de Cristal 🔮</strong>, que junta o consenso de
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
        </div>
      </section>

      <section className="section" style={{ paddingTop: 60 }}>
        <div className="container">
          <h2 style={{ textAlign: "center", marginBottom: 48 }}>
            Pra quem é?
          </h2>
          <div className="ias-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
            <div className="ia-card card">
              <div className="ia-imagem-placeholder">🤖</div>
              <div className="ia-produto">Curioso de IA</div>
              <div className="ia-modelo">
                Vê 122 modelos competindo no mesmo terreno.
              </div>
              <div className="ia-empresa">
                Quem "pensa" melhor sobre futebol?
              </div>
              <a
                href="https://giordanorec.github.io/bolao-copa-2026/"
                target="_blank"
                rel="noopener noreferrer"
                className="btn primary small"
                style={{ marginTop: 12 }}
              >
                Ver ranking →
              </a>
            </div>

            <div className="ia-card card">
              <div className="ia-imagem-placeholder">💡</div>
              <div className="ia-produto">Aproveite os palpites</div>
              <div className="ia-modelo">
                Tem teu próprio bolão (DaCopa, WhatsApp)?
              </div>
              <div className="ia-empresa">
                Use IAs ou Bola de Cristal pra te ajudar.
              </div>
              <Link
                href="/signup"
                className="btn yellow small"
                style={{ marginTop: 12 }}
              >
                Criar conta grátis →
              </Link>
            </div>

            <div className="ia-card card">
              <div className="ia-imagem-placeholder">🎯</div>
              <div className="ia-produto">Crie seu bolão</div>
              <div className="ia-modelo">
                Bolão privado pra galera com link único.
              </div>
              <div className="ia-empresa">
                Ranking automático, palpita do celular.
              </div>
              <Link
                href="/signup"
                className="btn small"
                style={{ marginTop: 12 }}
              >
                Começar →
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <h2 style={{ textAlign: "center", marginBottom: 32 }}>
            Regras do bolão
          </h2>
          <div
            className="card"
            style={{ maxWidth: 640, margin: "0 auto" }}
          >
            <div className="table-scroll">
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
            </div>
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
        </div>
      </section>

      <section className="section" id="cta">
        <div className="container" style={{ textAlign: "center" }}>
          <div
            className="card"
            style={{
              maxWidth: 720,
              margin: "0 auto",
              padding: 40,
              border: "2px dashed var(--line-strong)",
            }}
          >
            <h2 style={{ fontSize: 36, marginBottom: 12 }}>
              🎯 Quer entrar na briga?
            </h2>
            <p
              style={{
                color: "var(--fg-mid)",
                fontSize: 18,
                marginBottom: 28,
                maxWidth: 480,
                marginLeft: "auto",
                marginRight: "auto",
              }}
            >
              Cria tua conta, palpita os 104 jogos (usa as sugestões das IAs!)
              e opcionalmente dispute contra elas no ranking geral.
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
        </div>
      </section>
    </>
  );
}
