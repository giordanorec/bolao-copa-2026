import type { Locale } from "@/lib/i18n";

/**
 * ResumoExperimento — "O que foi o Bolão das IAs", em 2-3 frases + números
 * finais. Fica logo abaixo do HeroCampeoes, ainda no tom de arquivo/registro
 * (não de produto ativo). Números fechados no fim da Copa (19/07/2026).
 */

const TX: Record<
  Locale,
  { texto: string; stats: { num: string; lbl: string }[] }
> = {
  pt: {
    texto:
      "124 modelos de IA — ChatGPT, Claude, Gemini, Grok, DeepSeek e mais — palpitaram os 104 jogos da Copa do Mundo FIFA 2026, sob as mesmas regras clássicas de bolão, disputando o mesmo ranking que humanos de carne e osso. Tudo aberto, auditável e registrado do primeiro ao último apito.",
    stats: [
      { num: "124", lbl: "IAs no bolão" },
      { num: "104/104", lbl: "jogos apurados" },
      { num: "5.797", lbl: "palpites coletados" },
      { num: "11 jun – 19 jul", lbl: "duração da Copa 2026" },
    ],
  },
  en: {
    texto:
      "124 AI models — ChatGPT, Claude, Gemini, Grok, DeepSeek and more — predicted all 104 matches of the 2026 FIFA World Cup, under the same classic pool rules, competing on the same leaderboard as real humans. Everything open, auditable, and recorded from the first whistle to the last.",
    stats: [
      { num: "124", lbl: "AIs in the pool" },
      { num: "104/104", lbl: "matches scored" },
      { num: "5,797", lbl: "predictions collected" },
      { num: "Jun 11 – Jul 19", lbl: "2026 World Cup span" },
    ],
  },
  es: {
    texto:
      "124 modelos de IA — ChatGPT, Claude, Gemini, Grok, DeepSeek y más — pronosticaron los 104 partidos del Mundial FIFA 2026, bajo las mismas reglas clásicas de bolão, compitiendo en el mismo ranking que humanos de carne y hueso. Todo abierto, auditable y registrado del primer al último silbatazo.",
    stats: [
      { num: "124", lbl: "IAs en el bolão" },
      { num: "104/104", lbl: "partidos calculados" },
      { num: "5.797", lbl: "pronósticos recogidos" },
      { num: "11 jun – 19 jul", lbl: "duración del Mundial 2026" },
    ],
  },
  fr: {
    texto:
      "124 modèles d'IA — ChatGPT, Claude, Gemini, Grok, DeepSeek et bien d'autres — ont pronostiqué les 104 matches de la Coupe du Monde FIFA 2026, selon les mêmes règles classiques de cagnotte, sur le même classement que des humains bien réels. Tout est ouvert, vérifiable et archivé du premier au dernier coup de sifflet.",
    stats: [
      { num: "124", lbl: "IA dans la cagnotte" },
      { num: "104/104", lbl: "matches comptabilisés" },
      { num: "5 797", lbl: "pronostics collectés" },
      { num: "11 juin – 19 juil", lbl: "durée de la Coupe 2026" },
    ],
  },
};

export default function ResumoExperimento({ locale = "pt" }: { locale?: Locale }) {
  const tx = TX[locale] ?? TX.pt;

  return (
    <section className="section" style={{ paddingTop: 40, paddingBottom: 8 }}>
      <div className="container arquivo-resumo">
        <p>{tx.texto}</p>
        <div className="arquivo-stats">
          {tx.stats.map((s) => (
            <div key={s.lbl} className="arquivo-stat">
              <div className="arquivo-stat-num">{s.num}</div>
              <span className="arquivo-stat-lbl">{s.lbl}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
