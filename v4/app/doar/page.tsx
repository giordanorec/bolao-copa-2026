import Link from "next/link";

export const metadata = {
  title: "Apoie · Bolão das IAs",
  description: "Doações cobrem a infra (Vercel, Supabase, APIs das IAs).",
};

export default function DoarPage() {
  return (
    <div style={{ marginTop: 40, maxWidth: 720, marginInline: "auto" }}>
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <h1 style={{ fontSize: "clamp(36px, 6vw, 64px)" }}>
          💛 Apoie o projeto
        </h1>
        <p className="lede" style={{ marginTop: 16 }}>
          Esse bolão é gratuito e <strong>sem ads / sem Bets</strong>. Doações
          voluntárias cobrem o custo de manter rodando.
        </p>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 28, marginBottom: 16 }}>O que isso paga?</h2>
        <ul style={{ paddingLeft: 24, color: "var(--fg-mid)", lineHeight: 1.9 }}>
          <li>
            <strong>API das IAs</strong> — pra coletar palpites de modelos
            pagos (Claude Opus, GPT-5 Pro, Gemini 2.5 Pro, Grok 4 Heavy).
            Cerca de US$ 30–50/rodada.
          </li>
          <li>
            <strong>Vercel + Supabase</strong> — hospedagem dos bolões dos
            humanos. Free tier dá pra ~10k usuários. Acima disso, ~US$ 25/mês.
          </li>
          <li>
            <strong>Tempo</strong> — manter rodando, coletar palpites manual
            das 10 IAs Série A, atualizar resultados, melhorias.
          </li>
        </ul>
      </div>

      <div
        className="card"
        style={{
          textAlign: "center",
          background:
            "linear-gradient(135deg, rgba(255,206,0,0.1), rgba(0,166,153,0.1))",
        }}
      >
        <h2 style={{ fontSize: 28, marginBottom: 16 }}>Como doar</h2>
        <p style={{ color: "var(--fg-mid)", marginBottom: 28 }}>
          Tá começando. Por enquanto:
        </p>

        <div
          style={{
            display: "flex",
            gap: 16,
            justifyContent: "center",
            flexWrap: "wrap",
            marginBottom: 24,
          }}
        >
          <div
            style={{
              padding: 24,
              borderRadius: 16,
              background: "white",
              border: "2px solid var(--line)",
              minWidth: 240,
            }}
          >
            <p
              style={{
                fontFamily: "var(--ff-mono)",
                fontSize: 11,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: "var(--fg-muted)",
                marginBottom: 12,
              }}
            >
              PIX
            </p>
            <code
              style={{
                fontFamily: "var(--ff-mono)",
                fontSize: 16,
                fontWeight: 700,
                color: "var(--fg)",
              }}
            >
              grec@cin.ufpe.br
            </code>
          </div>

          <div
            style={{
              padding: 24,
              borderRadius: 16,
              background: "white",
              border: "2px solid var(--line)",
              minWidth: 240,
            }}
          >
            <p
              style={{
                fontFamily: "var(--ff-mono)",
                fontSize: 11,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: "var(--fg-muted)",
                marginBottom: 12,
              }}
            >
              Stripe (em breve)
            </p>
            <button
              disabled
              className="btn"
              style={{ opacity: 0.5, cursor: "not-allowed" }}
            >
              💳 Doar com cartão
            </button>
          </div>
        </div>

        <p style={{ fontSize: 13, color: "var(--fg-muted)" }}>
          Qualquer valor ajuda. Obrigado! 🙏
        </p>
      </div>

      <div style={{ textAlign: "center", marginTop: 32 }}>
        <Link href="/" style={{ color: "var(--primary)", fontWeight: 600 }}>
          ← Voltar pra home
        </Link>
      </div>
    </div>
  );
}
