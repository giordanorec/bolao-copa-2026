import Link from "next/link";

export const metadata = {
  title: "Como funciona · Bolão das IAs",
  description:
    "Regras de pontuação, FAQ e tudo que você precisa saber sobre o bolão.",
};

export default function ComoFunciona() {
  return (
    <div style={{ marginTop: 40, maxWidth: 880, marginInline: "auto" }}>
      <div style={{ textAlign: "center", marginBottom: 48 }}>
        <h1 style={{ fontSize: "clamp(36px, 6vw, 64px)", color: "var(--fg)" }}>
          📖 Como funciona
        </h1>
        <p
          className="lede"
          style={{ marginTop: 16 }}
        >
          Tudo que você precisa saber em 5 minutos.
        </p>
      </div>

      <section className="card" style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 32, marginBottom: 20 }}>🎯 Pontuação</h2>
        <p style={{ marginBottom: 20, color: "var(--fg-mid)" }}>
          Vale a regra clássica do bolão brasileiro:
        </p>
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
              <td>Placar exato (ex.: você 2×1, deu 2×1)</td>
              <td className="pts">10</td>
            </tr>
            <tr>
              <td>Vencedor + saldo de gols (ex.: 2×1, deu 3×2)</td>
              <td className="pts">7</td>
            </tr>
            <tr>
              <td>Vencedor (sem saldo certo)</td>
              <td className="pts">5</td>
            </tr>
            <tr>
              <td>Empate (sem placar exato)</td>
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
            padding: 16,
            background: "var(--bg-soft)",
            borderRadius: "var(--r-m)",
            fontSize: 14,
            color: "var(--fg-mid)",
          }}
        >
          🏆 <strong>Mata-mata vale 2×!</strong> Tudo que acertar nas oitavas,
          quartas, semis e final dobra de valor.
        </p>
      </section>

      <section className="card" style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 32, marginBottom: 20 }}>❓ FAQ</h2>

        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 20, marginBottom: 8 }}>
            Como funciona o link compartilhável?
          </h3>
          <p style={{ color: "var(--fg-mid)" }}>
            Cada bolão vira uma URL única tipo{" "}
            <code
              style={{
                background: "var(--bg-soft)",
                padding: "2px 8px",
                borderRadius: 4,
                fontFamily: "var(--ff-mono)",
                fontSize: 14,
              }}
            >
              /bolao/abc12345
            </code>
            . Quem tem o link, vê e pode entrar (precisa criar conta).
          </p>
        </div>

        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 20, marginBottom: 8 }}>
            Meus palpites valem pra todos os bolões em que estou?
          </h3>
          <p style={{ color: "var(--fg-mid)" }}>
            Sim. Você palpita 1 vez. Se entrar em 5 bolões, o mesmo palpite
            conta em todos. Bate com como bolões reais funcionam.
          </p>
        </div>

        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 20, marginBottom: 8 }}>
            Quem são as IAs?
          </h3>
          <p style={{ color: "var(--fg-mid)" }}>
            121 modelos de IA: ChatGPT 5 Pro, Claude Opus 4.7, Gemini 2.5 Pro,
            Grok 4 Heavy, DeepSeek R1, Llama 4, Mistral, Qwen e mais. Cada uma
            recebe o mesmo prompt e palpita os 104 jogos. Ver lista completa em{" "}
            <Link href="/ias" style={{ color: "var(--primary)" }}>
              /ias
            </Link>
            .
          </p>
        </div>

        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 20, marginBottom: 8 }}>
            E a Bola de Cristal?
          </h3>
          <p style={{ color: "var(--fg-mid)" }}>
            É o palpite "consenso" — pra cada jogo, qual placar foi mais votado
            entre TODAS as 121 IAs. Sabedoria das massas aplicada a futebol.
          </p>
        </div>

        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 20, marginBottom: 8 }}>É de graça mesmo?</h3>
          <p style={{ color: "var(--fg-mid)" }}>
            Sim. Sem ads, sem cobrança, sem casa de aposta envolvida. Doações
            voluntárias cobrem custo de API. Quem quiser ajudar, manda PIX pra{" "}
            <code style={{ fontFamily: "var(--ff-mono)", fontSize: 14 }}>
              grec@cin.ufpe.br
            </code>
            .
          </p>
        </div>

        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 20, marginBottom: 8 }}>
            Vou poder editar meus palpites?
          </h3>
          <p style={{ color: "var(--fg-mid)" }}>
            Sim, até o início de cada jogo. Depois trava (em desenvolvimento).
          </p>
        </div>

        <div>
          <h3 style={{ fontSize: 20, marginBottom: 8 }}>
            Os dados são seguros?
          </h3>
          <p style={{ color: "var(--fg-mid)" }}>
            Email e senha guardados via Supabase Auth (criptografia padrão).
            Não compartilhamos nada. Você pode deletar tua conta a qualquer
            momento (entre em contato).
          </p>
        </div>
      </section>

      <section
        className="card"
        style={{
          marginBottom: 32,
          background:
            "linear-gradient(135deg, rgba(255,206,0,0.08), rgba(0,166,153,0.08))",
        }}
      >
        <h2 style={{ fontSize: 28, marginBottom: 16 }}>⚠️ Disclaimers</h2>
        <ul
          style={{
            paddingLeft: 24,
            color: "var(--fg-mid)",
            lineHeight: 1.8,
          }}
        >
          <li>
            <strong>Não somos casa de aposta.</strong> Não pegamos informação
            de odds. Não somos patrocinados por Bets.
          </li>
          <li>
            <strong>Não é uma plataforma de aposta.</strong> É um bolão entre
            amigos. Vencer não dá prêmio nenhum (só zoeira).
          </li>
          <li>
            <strong>Projeto em andamento.</strong> Pode dar erro. Faça backup
            dos teus palpites mais importantes.
          </li>
          <li>
            <strong>Atualizamos só em momentos-chave</strong> (entre rodadas).
            Não é dashboard ao vivo.
          </li>
        </ul>
      </section>

      <div style={{ textAlign: "center", marginTop: 48 }}>
        <Link href="/signup" className="btn primary">
          Criar minha conta agora →
        </Link>
      </div>
    </div>
  );
}
