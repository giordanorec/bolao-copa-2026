import Link from "next/link";
import { type Locale } from "@/lib/i18n";

const VARIANTES = {
  pos_palpitar: {
    pt: {
      titulo: "🎯 Palpites salvos! Ajuda a manter o sistema rodando?",
      desc: "Cada rodada de palpites das IAs premium custa US$ 30-50. Colabore pra rodarmos mais frequente e refazer a cada notícia importante.",
    },
    en: {
      titulo: "🎯 Predictions saved! Help keep the system running?",
      desc: "Each round of premium AI predictions costs US$ 30-50. Support to run more often and re-predict on every breaking news.",
    },
    es: {
      titulo: "🎯 ¡Pronósticos guardados! ¿Ayudas a mantener el sistema?",
      desc: "Cada ronda cuesta US$ 30-50. Dona para rehacer pronósticos con cada noticia.",
    },
    fr: {
      titulo: "🎯 Pronostics enregistrés ! Aidez-nous à continuer ?",
      desc: "Chaque tour coûte US$ 30-50. Donnez pour relancer à chaque actualité.",
    },
  },
  ranking: {
    pt: {
      titulo: "🏆 Quer que as IAs se atualizem entre os jogos?",
      desc: "Com mais colaborações, refazemos os palpites assim que sair notícia de lesão, escalação ou virada na fase de grupos.",
    },
    en: {
      titulo: "🏆 Want the AIs to update mid-tournament?",
      desc: "With more donations, we re-run predictions whenever there's an injury, lineup, or group-stage twist.",
    },
    es: {
      titulo: "🏆 ¿Quieres que las IAs se actualicen entre partidos?",
      desc: "Con más donaciones, rehacemos pronósticos cuando hay lesiones o cambios.",
    },
    fr: {
      titulo: "🏆 Voulez-vous que les IA se mettent à jour ?",
      desc: "Avec plus de dons, on relance les pronostics à chaque blessure ou compo.",
    },
  },
  ias: {
    pt: {
      titulo: "🤖 Quer ver mais IAs (paid tier) palpitando?",
      desc: "Modelos top (Claude Opus, GPT-5 Pro) custam dinheiro real de API. Ajude a manter o ranking premium ativo.",
    },
    en: {
      titulo: "🤖 Want more paid-tier AIs in the ranking?",
      desc: "Top models (Claude Opus, GPT-5 Pro) cost real API dollars. Help keep the premium ranking active.",
    },
    es: {
      titulo: "🤖 ¿Quieres más IAs premium en el ranking?",
      desc: "Modelos top cuestan dinero real. Ayuda a mantener el ranking premium activo.",
    },
    fr: {
      titulo: "🤖 Plus d'IA premium dans le classement ?",
      desc: "Les modèles top coûtent réel. Aidez à maintenir le classement premium.",
    },
  },
};

export default function ColaboracaoBanner({
  variante,
  locale = "pt",
}: {
  variante: keyof typeof VARIANTES;
  locale?: Locale;
}) {
  const tx =
    VARIANTES[variante][locale] ?? VARIANTES[variante].pt;
  const cta =
    locale === "en"
      ? "💛 Support"
      : locale === "es"
        ? "💛 Colaborar"
        : locale === "fr"
          ? "💛 Soutenir"
          : "💛 Colaborar";
  return (
    <aside className="colaboracao-banner">
      <div className="colaboracao-icon">💛</div>
      <div className="colaboracao-body">
        <strong>{tx.titulo}</strong>
        <p>{tx.desc}</p>
      </div>
      <Link href="/colaborar" className="btn primary small">
        {cta}
      </Link>
    </aside>
  );
}
