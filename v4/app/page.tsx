import Link from "next/link";

export default function Home() {
  return (
    <>
      {/* ─────────── HERO ─────────── */}
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
            104 jogos da Copa 2026. Espia o que cada uma chutou, copia pro teu
            bolão, ou cria um privado pra galera. <strong>Tudo de graça.</strong> 🏆
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

      {/* ─────────── DESTAQUES PRINCIPAIS (3 cards) ─────────── */}
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
            Os 3 caminhos mais usados — escolhe o teu.
          </p>

          <div
            className="ias-grid"
            style={{
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 24,
            }}
          >
            {/* Série A */}
            <a
              href="https://giordanorec.github.io/bolao-copa-2026/serie-a.html"
              target="_blank"
              rel="noopener noreferrer"
              className="ia-card card hoverable"
              style={{ textDecoration: "none" }}
            >
              <div className="ia-imagem-placeholder" style={{ fontSize: 72 }}>
                🏆
              </div>
              <div className="ia-produto">Série A das IAs</div>
              <div className="ia-modelo">Os 10 cabeças de chave</div>
              <div className="ia-empresa" style={{ marginTop: 8 }}>
                ChatGPT 5 Pro, Claude Opus 4.7, Gemini 2.5 Pro, Grok 4 Heavy,
                DeepSeek R1, Perplexity, Copilot, Le Chat, Meta AI, Qwen 3 Max
                — coletados via interface web com search nativo.
              </div>
              <p
                style={{
                  marginTop: 16,
                  color: "var(--primary)",
                  fontWeight: 700,
                  fontSize: 14,
                }}
              >
                Ver Série A ↗
              </p>
            </a>

            {/* Jogo a Jogo */}
            <a
              href="https://giordanorec.github.io/bolao-copa-2026/jogos.html"
              target="_blank"
              rel="noopener noreferrer"
              className="ia-card card hoverable"
              style={{ textDecoration: "none" }}
            >
              <div className="ia-imagem-placeholder" style={{ fontSize: 72 }}>
                ⚽
              </div>
              <div className="ia-produto">Palpites Jogo a Jogo</div>
              <div className="ia-modelo">Vê o consenso de cada jogo</div>
              <div className="ia-empresa" style={{ marginTop: 8 }}>
                Pra cada um dos 104 jogos: qual placar cada IA chutou, quantas
                concordam, qual o consenso. <strong>Use pro teu bolão.</strong>
                Não precisa criar conta.
              </div>
              <p
                style={{
                  marginTop: 16,
                  color: "var(--primary)",
                  fontWeight: 700,
                  fontSize: 14,
                }}
              >
                Ver jogo a jogo ↗
              </p>
            </a>

            {/* Crie Seu Bolão */}
            <Link
              href="/signup"
              className="ia-card card hoverable"
              style={{ textDecoration: "none" }}
            >
              <div className="ia-imagem-placeholder" style={{ fontSize: 72 }}>
                🎯
              </div>
              <div className="ia-produto">Crie Seu Bolão</div>
              <div className="ia-modelo">Privado, pra galera, com link</div>
              <div className="ia-empresa" style={{ marginTop: 8 }}>
                Convida os amigos por link. Palpita os 104 do celular (ou copia
                de qualquer IA num clique). Ranking automático. Tudo grátis.
              </div>
              <p
                style={{
                  marginTop: 16,
                  color: "var(--primary)",
                  fontWeight: 700,
                  fontSize: 14,
                }}
              >
                Criar conta →
              </p>
            </Link>
          </div>
        </div>
      </section>

      {/* ─────────── MAIS DESTINOS (3 secundários) ─────────── */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <h3
            style={{
              fontFamily: "var(--ff-mono)",
              fontSize: 13,
              color: "var(--fg-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              textAlign: "center",
              marginBottom: 24,
              fontWeight: 700,
            }}
          >
            Tem mais coisa aqui
          </h3>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 16,
              maxWidth: 900,
              marginInline: "auto",
            }}
          >
            {/* Ranking Completo */}
            <a
              href="https://giordanorec.github.io/bolao-copa-2026/ias.html"
              target="_blank"
              rel="noopener noreferrer"
              className="card hoverable"
              style={{
                textDecoration: "none",
                textAlign: "center",
                padding: 24,
              }}
            >
              <div style={{ fontSize: 36, marginBottom: 8 }}>🤖</div>
              <strong
                style={{
                  fontFamily: "var(--ff-display)",
                  fontVariationSettings: "var(--ff-display-vs)",
                  fontSize: 20,
                  display: "block",
                  marginBottom: 6,
                  color: "var(--secondary)",
                }}
              >
                Ranking das 122
              </strong>
              <p
                style={{
                  fontSize: 13,
                  color: "var(--fg-mid)",
                  lineHeight: 1.4,
                }}
              >
                Ranking completo de todas as IAs participantes.
              </p>
            </a>

            {/* Hall da Fama */}
            <Link
              href="/ranking-geral"
              className="card hoverable"
              style={{
                textDecoration: "none",
                textAlign: "center",
                padding: 24,
                background:
                  "linear-gradient(135deg, color-mix(in srgb, var(--accent) 8%, transparent), color-mix(in srgb, var(--primary) 8%, transparent))",
              }}
            >
              <div style={{ fontSize: 36, marginBottom: 8 }}>🌍</div>
              <strong
                style={{
                  fontFamily: "var(--ff-display)",
                  fontVariationSettings: "var(--ff-display-vs)",
                  fontSize: 20,
                  display: "block",
                  marginBottom: 6,
                  color: "var(--secondary)",
                }}
              >
                Hall da Fama
              </strong>
              <p
                style={{
                  fontSize: 13,
                  color: "var(--fg-mid)",
                  lineHeight: 1.4,
                }}
              >
                Ranking geral: humanos opt-in + 122 IAs + Bola de Cristal num
                só placar.
              </p>
            </Link>

            {/* Bola de Cristal */}
            <a
              href="https://giordanorec.github.io/bolao-copa-2026/cristal.html"
              target="_blank"
              rel="noopener noreferrer"
              className="card hoverable"
              style={{
                textDecoration: "none",
                textAlign: "center",
                padding: 24,
              }}
            >
              <div style={{ fontSize: 36, marginBottom: 8 }}>🔮</div>
              <strong
                style={{
                  fontFamily: "var(--ff-display)",
                  fontVariationSettings: "var(--ff-display-vs)",
                  fontSize: 20,
                  display: "block",
                  marginBottom: 6,
                  color: "var(--secondary)",
                }}
              >
                Bola de Cristal
              </strong>
              <p
                style={{
                  fontSize: 13,
                  color: "var(--fg-mid)",
                  lineHeight: 1.4,
                }}
              >
                O palpite consenso: pra cada jogo, qual placar mais IAs
                chutaram.
              </p>
            </a>
          </div>
        </div>
      </section>

      {/* ─────────── REGRAS DE PONTUAÇÃO ─────────── */}
      <section className="section">
        <div className="container">
          <h2 style={{ textAlign: "center", marginBottom: 32 }}>
            Como funciona o placar
          </h2>
          <div className="card" style={{ maxWidth: 640, margin: "0 auto" }}>
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
            </div>
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
              🏆 <strong>Mata-mata vale 2×.</strong> Detalhes completos em{" "}
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

      {/* ─────────── CTA FINAL ─────────── */}
      <section className="section" id="cta">
        <div className="container" style={{ textAlign: "center" }}>
          <div
            className="card"
            style={{
              maxWidth: 720,
              margin: "0 auto",
              padding: 48,
              border: "2px dashed var(--line-strong)",
              background: "var(--bg-1)",
            }}
          >
            <h2 style={{ fontSize: "clamp(28px, 5vw, 40px)", marginBottom: 14 }}>
              Pronto pra brigar com as IAs?
            </h2>
            <p
              style={{
                color: "var(--fg-mid)",
                fontSize: 17,
                marginBottom: 28,
                maxWidth: 480,
                marginInline: "auto",
              }}
            >
              Cria conta em 10 segundos, palpita os 104 jogos (com sugestões
              das IAs num clique) e entra no Hall da Fama.
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
                🎯 Criar conta →
              </Link>
              <Link href="/login" className="btn">
                Já tenho conta
              </Link>
            </div>
            <p
              style={{
                marginTop: 20,
                fontSize: 13,
                color: "var(--fg-muted)",
              }}
            >
              Sem ads. Sem Bets. Sem cobrança. Doações cobrem a infra. 💛
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
