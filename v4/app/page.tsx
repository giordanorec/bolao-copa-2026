import Link from "next/link";

export default function Home() {
  return (
    <>
      <section className="hero">
        <div className="hero-emojis">
          <span>🇧🇷</span>
          <span>⚽</span>
          <span>🎯</span>
        </div>
        <h1>
          Crie o seu bolão.
          <br />
          <span className="accent">Dispute contra as IAs.</span>
        </h1>
        <p className="lede">
          <strong>Bolão gratuito da Copa do Mundo 2026.</strong> Convide amigos,
          palpite os 104 jogos e dispute contra <strong>121 IAs</strong> em
          paralelo. Sem ads, sem casa de aposta. 🏆🎉
        </p>

        <div className="hero-cta">
          <Link href="/signup" className="btn primary">
            Criar meu bolão →
          </Link>
          <Link href="/login" className="btn">
            Entrar
          </Link>
          <a
            href="https://giordanorec.github.io/bolao-copa-2026/"
            className="btn yellow"
          >
            Ranking das IAs 🥇
          </a>
        </div>

        <div className="stats">
          <div className="stat">
            <div className="stat-num">104</div>
            <span className="stat-lbl">Jogos da Copa</span>
          </div>
          <div className="stat">
            <div className="stat-num">121</div>
            <span className="stat-lbl">IAs no bolão</span>
          </div>
          <div className="stat">
            <div className="stat-num">∞</div>
            <span className="stat-lbl">Bolões privados</span>
          </div>
        </div>
      </section>

      <section className="section">
        <h2>Como é?</h2>
        <div className="features">
          <div className="card feature">
            <span className="ico">💸</span>
            <h3>100% gratuito</h3>
            <p>
              Sem ads, sem cobrança, sem casa de aposta envolvida. Doações
              voluntárias cobrem a infra.
            </p>
          </div>
          <div className="card feature">
            <span className="ico">🔒</span>
            <h3>Privado por padrão</h3>
            <p>
              Cada bolão vira um link só seu. Compartilha por WhatsApp, só entra
              quem você convida.
            </p>
          </div>
          <div className="card feature">
            <span className="ico">🤖</span>
            <h3>Contra as IAs</h3>
            <p>
              Opcionalmente entre no ranking geral e veja se vence ChatGPT,
              Claude, Gemini, Grok…
            </p>
          </div>
        </div>
      </section>

      <section className="section">
        <h2>Como funciona</h2>
        <div className="steps">
          <div className="step">
            <span className="step-num">1</span>
            <span className="step-text">Cria conta (email + senha)</span>
          </div>
          <div className="step">
            <span className="step-num">2</span>
            <span className="step-text">Cria um bolão, dá um nome</span>
          </div>
          <div className="step">
            <span className="step-num">3</span>
            <span className="step-text">Compartilha o link com a galera</span>
          </div>
          <div className="step">
            <span className="step-num">4</span>
            <span className="step-text">
              Cada um palpita os 104 jogos da Copa
            </span>
          </div>
          <div className="step">
            <span className="step-num">5</span>
            <span className="step-text">
              Ranking interno do grupo + geral (opcional)
            </span>
          </div>
        </div>
      </section>
    </>
  );
}
