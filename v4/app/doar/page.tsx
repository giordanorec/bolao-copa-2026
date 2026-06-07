import Link from "next/link";
import { resolverLocale } from "@/lib/locale-server";

export const metadata = {
  title: "Apoie · Bolão das IAs",
  description:
    "Doe via Stripe ou PIX. Ajuda a manter as IAs rodando e refazer palpites a cada notícia.",
};

// Stripe Payment Link — env var em prod. Pode ser configurado depois via
// dashboard.stripe.com → Payment Links (não precisa de código backend).
const STRIPE_LINK =
  process.env.NEXT_PUBLIC_STRIPE_DONATE_URL ||
  "https://donate.stripe.com/test_placeholder";

const TEXTOS: Record<string, Record<string, string>> = {
  pt: {
    h1: "💛 Apoie o projeto",
    lede: "O Bolão das IAs é gratuito e sem ads / sem Bets. Sua doação cobre os custos e libera melhorias mais avançadas.",
    custos_titulo: "Pra onde vai cada real",
    item_apis_t: "API das IAs Premium",
    item_apis_d: "Coletar palpites dos modelos pagos (Claude Opus, GPT-5 Pro, Gemini 2.5 Pro, Grok 4 Heavy) custa US$ 30-50 por rodada. Quanto mais doações, mais rodadas — e mais frescas as previsões.",
    item_infra_t: "Vercel + Supabase",
    item_infra_d: "Cada novo grupo de amigos = mais carga. Acima do free tier, ~US$ 25/mês escalando.",
    item_refaz_t: "Refazer palpites a cada notícia",
    item_refaz_d: "É aqui que a doação faz mais diferença: rodar as IAs DE NOVO toda vez que cair uma notícia importante (lesão, escalação, virada na fase de grupos). Hoje rodamos 1x; com mais doações, vira contínuo.",
    pix_label: "PIX (chave email)",
    stripe_label: "💳 Doar com cartão (Stripe)",
    stripe_btn: "Doar agora →",
    valores_titulo: "Sugestões de valor",
    obrigado: "Qualquer valor ajuda. Obrigado! 🙏",
    voltar: "← Voltar pra home",
  },
  en: {
    h1: "💛 Support the project",
    lede: "AI Soccer Pool is free, no ads, no betting. Your donation covers costs and unlocks advanced upgrades.",
    custos_titulo: "Where your money goes",
    item_apis_t: "Premium AI APIs",
    item_apis_d: "Collecting predictions from paid models (Claude Opus, GPT-5 Pro, Gemini 2.5 Pro, Grok 4 Heavy) costs US$ 30-50 per round. More donations = more rounds, fresher predictions.",
    item_infra_t: "Vercel + Supabase",
    item_infra_d: "Every new group of friends = more load. Above free tier, ~US$ 25/month scaling.",
    item_refaz_t: "Re-predict on every news",
    item_refaz_d: "This is where donations matter most: re-run the AIs every time something major happens (injuries, line-ups, group stage twists). Today we run once; with more support, it becomes continuous.",
    pix_label: "PIX (email key) — Brazil only",
    stripe_label: "💳 Donate by card (Stripe)",
    stripe_btn: "Donate now →",
    valores_titulo: "Suggested amounts",
    obrigado: "Any amount helps. Thank you! 🙏",
    voltar: "← Back to home",
  },
  es: {
    h1: "💛 Apoya el proyecto",
    lede: "La Polla de las IAs es gratis, sin ads, sin apuestas. Tu donación cubre los costos.",
    custos_titulo: "Adónde va cada euro",
    item_apis_t: "APIs de IA Premium",
    item_apis_d: "Recolectar pronósticos de modelos pagos cuesta US$ 30-50 por ronda.",
    item_infra_t: "Vercel + Supabase",
    item_infra_d: "Cada grupo nuevo = más carga. Arriba del free tier, ~US$ 25/mes.",
    item_refaz_t: "Rehacer pronósticos con cada noticia",
    item_refaz_d: "Aquí la donación cambia todo: correr las IAs DE NUEVO cuando hay noticias (lesiones, alineaciones).",
    pix_label: "PIX (clave email) — Brasil",
    stripe_label: "💳 Donar con tarjeta (Stripe)",
    stripe_btn: "Donar ahora →",
    valores_titulo: "Valores sugeridos",
    obrigado: "Cualquier monto ayuda. ¡Gracias! 🙏",
    voltar: "← Volver al inicio",
  },
  fr: {
    h1: "💛 Soutenez le projet",
    lede: "Cagnotte des IA est gratuit, sans pub, sans paris. Votre don couvre les frais.",
    custos_titulo: "À quoi sert l'argent",
    item_apis_t: "APIs IA Premium",
    item_apis_d: "Collecter les pronostics des modèles payants coûte US$ 30-50 par tour.",
    item_infra_t: "Vercel + Supabase",
    item_infra_d: "Plus de groupes = plus de charge. Au-delà du free tier, ~US$ 25/mois.",
    item_refaz_t: "Refaire les pronostics à chaque news",
    item_refaz_d: "C'est là que ça change tout : relancer les IA à chaque actualité (blessure, compo, surprise de groupe).",
    pix_label: "PIX (clé email) — Brésil",
    stripe_label: "💳 Donner par carte (Stripe)",
    stripe_btn: "Donner →",
    valores_titulo: "Montants suggérés",
    obrigado: "Tout don aide. Merci ! 🙏",
    voltar: "← Retour à l'accueil",
  },
};

export default async function DoarPage() {
  const locale = await resolverLocale();
  const tx = TEXTOS[locale] ?? TEXTOS.pt;
  return (
    <div style={{ marginTop: 40, maxWidth: 720, marginInline: "auto" }}>
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <h1 style={{ fontSize: "clamp(36px, 6vw, 64px)" }}>{tx.h1}</h1>
        <p className="lede" style={{ marginTop: 16 }}>
          {tx.lede}
        </p>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 26, marginBottom: 16 }}>{tx.custos_titulo}</h2>
        <ul style={{ paddingLeft: 0, listStyle: "none", color: "var(--fg-mid)", lineHeight: 1.6 }}>
          <li style={{ marginBottom: 16 }}>
            <strong>🤖 {tx.item_apis_t}</strong>
            <p style={{ margin: "6px 0 0", fontSize: 14 }}>{tx.item_apis_d}</p>
          </li>
          <li style={{ marginBottom: 16 }}>
            <strong>☁️ {tx.item_infra_t}</strong>
            <p style={{ margin: "6px 0 0", fontSize: 14 }}>{tx.item_infra_d}</p>
          </li>
          <li>
            <strong>🔁 {tx.item_refaz_t}</strong>
            <p style={{ margin: "6px 0 0", fontSize: 14 }}>{tx.item_refaz_d}</p>
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
        <h2 style={{ fontSize: 26, marginBottom: 8 }}>{tx.valores_titulo}</h2>
        <p style={{ fontSize: 13, color: "var(--fg-muted)", marginBottom: 20 }}>
          R$ 10 · R$ 25 · R$ 50 · R$ 100 — você escolhe.
        </p>

        <a
          href={STRIPE_LINK}
          target="_blank"
          rel="noopener noreferrer"
          className="btn primary"
          style={{ fontSize: 16, padding: "14px 24px", marginBottom: 18 }}
        >
          {tx.stripe_btn}
        </a>

        <div
          style={{
            marginTop: 24,
            paddingTop: 24,
            borderTop: "1px dashed var(--line)",
          }}
        >
          <p
            style={{
              fontFamily: "var(--ff-mono)",
              fontSize: 11,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: "var(--fg-muted)",
              marginBottom: 8,
            }}
          >
            {tx.pix_label}
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

        <p style={{ fontSize: 13, color: "var(--fg-muted)", marginTop: 24 }}>
          {tx.obrigado}
        </p>
      </div>

      <div style={{ textAlign: "center", marginTop: 32 }}>
        <Link href="/" style={{ color: "var(--primary)", fontWeight: 600 }}>
          {tx.voltar}
        </Link>
      </div>
    </div>
  );
}
