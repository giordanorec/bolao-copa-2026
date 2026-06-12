import { promises as fs } from "fs";
import path from "path";
import Link from "next/link";
import Bandeira from "@/components/Bandeira";
import { carregarJogos } from "@/lib/jogos";
import { carregarPalpitesIAs } from "@/lib/palpites-ias";
import { carregarMapaPaises } from "@/lib/paises";
import type { Locale } from "@/lib/i18n";

type Resultado = { jogo_numero: number; gols_a: number; gols_b: number };

async function ultimoCristalAcertou(): Promise<{
  jogoNum: number;
  timeA: string;
  timeB: string;
  isoA?: string;
  isoB?: string;
  gols_a: number;
  gols_b: number;
  votosCristal: number;
  totalIAs: number;
  acertaram: number;
  cristalAcertos: number;
  cristalTotal: number;
  estreak: number;
} | null> {
  const fp = path.join(process.cwd(), "public", "resultados.json");
  try {
    const raw = await fs.readFile(fp, "utf-8");
    const resultados = JSON.parse(raw) as Resultado[];
    if (!resultados.length) return null;

    const [jogos, palpites, mapaPaises] = await Promise.all([
      carregarJogos(),
      carregarPalpitesIAs(),
      carregarMapaPaises(),
    ]);

    // Calcula histórico geral do Cristal
    let cristalAcertos = 0;
    let cristalTotal = 0;
    const acertosBool: boolean[] = [];
    for (const r of resultados) {
      const dados = palpites[String(r.jogo_numero)];
      if (!dados?.bola_de_cristal) continue;
      cristalTotal++;
      const c = dados.bola_de_cristal;
      const acertou = c.gols_a === r.gols_a && c.gols_b === r.gols_b;
      acertosBool.push(acertou);
      if (acertou) cristalAcertos++;
    }
    // streak = quantos acertos consecutivos no FIM da lista
    let estreak = 0;
    for (let i = acertosBool.length - 1; i >= 0; i--) {
      if (acertosBool[i]) estreak++;
      else break;
    }

    // Procura o resultado mais recente onde o Cristal acertou o placar exato
    const ordenados = [...resultados].reverse();
    for (const r of ordenados) {
      const jogo = jogos.find((j) => j.numero === r.jogo_numero);
      if (!jogo) continue;
      const dados = palpites[String(r.jogo_numero)];
      if (!dados?.bola_de_cristal) continue;
      const c = dados.bola_de_cristal;
      if (c.gols_a !== r.gols_a || c.gols_b !== r.gols_b) continue;

      const total = Object.keys(dados.palpites).length;
      const acertaram = Object.values(dados.palpites).filter(
        (p) => p.gols_a === r.gols_a && p.gols_b === r.gols_b,
      ).length;

      return {
        jogoNum: r.jogo_numero,
        timeA: jogo.time_a,
        timeB: jogo.time_b,
        isoA: mapaPaises[jogo.time_a],
        isoB: mapaPaises[jogo.time_b],
        gols_a: r.gols_a,
        gols_b: r.gols_b,
        votosCristal: c.votos,
        totalIAs: total,
        acertaram,
        cristalAcertos,
        cristalTotal,
        estreak,
      };
    }
    return null;
  } catch {
    return null;
  }
}

function ordinalPT(n: number): string {
  const tabela: Record<number, string> = {
    2: "segunda",
    3: "terceira",
    4: "quarta",
    5: "quinta",
    6: "sexta",
    7: "sétima",
    8: "oitava",
    9: "nona",
    10: "décima",
  };
  return tabela[n] ?? `${n}ª`;
}
function ordinalEN(n: number): string {
  const tabela: Record<number, string> = {
    2: "second",
    3: "third",
    4: "fourth",
    5: "fifth",
    6: "sixth",
    7: "seventh",
    8: "eighth",
    9: "ninth",
    10: "tenth",
  };
  return tabela[n] ?? `${n}th`;
}
function ordinalES(n: number): string {
  const tabela: Record<number, string> = {
    2: "segunda",
    3: "tercera",
    4: "cuarta",
    5: "quinta",
    6: "sexta",
    7: "séptima",
    8: "octava",
    9: "novena",
    10: "décima",
  };
  return tabela[n] ?? `${n}ª`;
}
function ordinalFR(n: number): string {
  const tabela: Record<number, string> = {
    2: "deuxième",
    3: "troisième",
    4: "quatrième",
    5: "cinquième",
    6: "sixième",
    7: "septième",
    8: "huitième",
    9: "neuvième",
    10: "dixième",
  };
  return tabela[n] ?? `${n}ème`;
}

const TX: Record<Locale, {
  badgeStreak: string;
  badgePrimeiro: string;
  titulo: (acertos: number, streak: number) => string;
  resultado: string;
  votos: (n: number, total: number) => string;
  acertaram: (n: number, total: number) => string;
  placar: (acertos: number, total: number) => string;
  cta: string;
}> = {
  pt: {
    badgeStreak: "🔥 CRAVOU DE NOVO",
    badgePrimeiro: "🔮 BOLA DE CRISTAL CRAVOU",
    titulo: (acertos, streak) => {
      if (acertos === 1) return "O placar previsto pelas IAs aconteceu.";
      if (streak >= 3) return `${streak} jogos seguidos. As IAs estão prevendo a Copa.`;
      return `Pela ${ordinalPT(acertos)} vez, o placar previsto pelas IAs aconteceu.`;
    },
    resultado: "RESULTADO FINAL",
    votos: (n, total) => `${n} de ${total} IAs apostaram exatamente nesse placar.`,
    acertaram: (n, total) => `${n}/${total} cravaram. E você?`,
    placar: (a, t) => `Placar do Cristal: ${a} de ${t} jogos cravados`,
    cta: "Ver o palpite das IAs no próximo jogo →",
  },
  en: {
    badgeStreak: "🔥 NAILED IT AGAIN",
    badgePrimeiro: "🔮 CRYSTAL BALL NAILED IT",
    titulo: (acertos, streak) => {
      if (acertos === 1) return "The score the AIs predicted… happened.";
      if (streak >= 3) return `${streak} matches in a row. The AIs are predicting the Cup.`;
      return `For the ${ordinalEN(acertos)} time, the score the AIs predicted happened.`;
    },
    resultado: "FINAL SCORE",
    votos: (n, total) => `${n} of ${total} AIs bet on this exact score.`,
    acertaram: (n, total) => `${n}/${total} nailed it. And you?`,
    placar: (a, t) => `Crystal Ball record: ${a} of ${t} matches nailed`,
    cta: "See AI picks for the next match →",
  },
  es: {
    badgeStreak: "🔥 ACERTÓ DE NUEVO",
    badgePrimeiro: "🔮 BOLA DE CRISTAL ACERTÓ",
    titulo: (acertos, streak) => {
      if (acertos === 1) return "El marcador que las IAs predijeron… pasó.";
      if (streak >= 3) return `${streak} partidos seguidos. Las IAs predicen el Mundial.`;
      return `Por ${ordinalES(acertos)} vez, el marcador que las IAs predijeron pasó.`;
    },
    resultado: "RESULTADO FINAL",
    votos: (n, total) => `${n} de ${total} IAs apostaron por ese marcador.`,
    acertaram: (n, total) => `${n}/${total} clavaron. ¿Y tú?`,
    placar: (a, t) => `Récord de Bola de Cristal: ${a} de ${t} clavados`,
    cta: "Ver el pronóstico de las IAs para el próximo partido →",
  },
  fr: {
    badgeStreak: "🔥 ENCORE VU JUSTE",
    badgePrimeiro: "🔮 LA BOULE DE CRISTAL A VU JUSTE",
    titulo: (acertos, streak) => {
      if (acertos === 1) return "Le score prédit par les IA… est arrivé.";
      if (streak >= 3) return `${streak} matches d'affilée. Les IA prédisent la Coupe.`;
      return `Pour la ${ordinalFR(acertos)} fois, le score prédit par les IA est arrivé.`;
    },
    resultado: "SCORE FINAL",
    votos: (n, total) => `${n} sur ${total} IA ont parié sur ce score exact.`,
    acertaram: (n, total) => `${n}/${total} ont vu juste. Et vous ?`,
    placar: (a, t) => `Bilan Boule de Cristal: ${a} sur ${t} matchs vus juste`,
    cta: "Voir les pronostics IA pour le prochain match →",
  },
};

export default async function CelebracaoCristal({
  locale = "pt",
}: {
  locale?: Locale;
}) {
  const dados = await ultimoCristalAcertou();
  if (!dados) return null;
  const tx = TX[locale];

  return (
    <section className="section cristal-celebra">
      <div className="container">
        <div className="cristal-celebra-card">
          <div className="cristal-confetes" aria-hidden>
            <span style={{ top: "10%", left: "8%" }}>✨</span>
            <span style={{ top: "18%", right: "12%" }}>🎉</span>
            <span style={{ top: "62%", left: "6%" }}>⭐</span>
            <span style={{ top: "72%", right: "8%" }}>✨</span>
            <span style={{ top: "30%", left: "92%" }}>🎊</span>
            <span style={{ top: "85%", left: "48%" }}>⚽</span>
          </div>

          <div className="cristal-badges-row">
            <div
              className={`cristal-badge-topo ${
                dados.cristalAcertos >= 2 ? "cristal-badge-streak" : ""
              }`}
            >
              {dados.cristalAcertos >= 2 ? tx.badgeStreak : tx.badgePrimeiro}
            </div>
            <div className="cristal-placar-streak" title={tx.placar(dados.cristalAcertos, dados.cristalTotal)}>
              <span className="streak-num">{dados.cristalAcertos}</span>
              <span className="streak-sep">/</span>
              <span className="streak-total">{dados.cristalTotal}</span>
            </div>
          </div>
          <h2 className="cristal-titulo">{tx.titulo(dados.cristalAcertos, dados.estreak)}</h2>

          <div className="cristal-jogo-wrap">
            <div className="cristal-time">
              <Bandeira iso={dados.isoA} nome={dados.timeA} size={56} />
              <strong>{dados.timeA}</strong>
            </div>

            <div className="cristal-placar">
              <span className="placar-resultado-lbl">{tx.resultado}</span>
              <div className="placar-numeros">
                <span className="num">{dados.gols_a}</span>
                <span className="x">×</span>
                <span className="num">{dados.gols_b}</span>
              </div>
            </div>

            <div className="cristal-time">
              <Bandeira iso={dados.isoB} nome={dados.timeB} size={56} />
              <strong>{dados.timeB}</strong>
            </div>
          </div>

          <div className="cristal-stats">
            <div className="cristal-stat">
              <span className="num-grande">{dados.acertaram}</span>
              <span className="lbl">/ {dados.totalIAs} IAs</span>
            </div>
            <div className="cristal-stat-texto">
              {tx.acertaram(dados.acertaram, dados.totalIAs)}
            </div>
          </div>

          <Link href={`/jogo/${dados.jogoNum + 1}`} className="cristal-cta">
            {tx.cta}
          </Link>
        </div>
      </div>

      <style>{`
        .cristal-celebra { padding: 28px 0 12px; }
        .cristal-celebra-card {
          position: relative;
          background:
            radial-gradient(ellipse at top left, rgba(168, 85, 247, 0.22), transparent 60%),
            radial-gradient(ellipse at bottom right, rgba(16, 185, 129, 0.18), transparent 60%),
            linear-gradient(135deg, #1a1238 0%, #0f0a26 100%);
          border: 2px solid rgba(168, 85, 247, 0.5);
          border-radius: 26px;
          padding: 36px 28px 28px;
          color: #fff;
          max-width: 880px;
          margin: 0 auto;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(168, 85, 247, 0.25), 0 8px 24px rgba(0,0,0,0.3);
        }
        .cristal-confetes {
          position: absolute; inset: 0;
          pointer-events: none;
        }
        .cristal-confetes span {
          position: absolute;
          font-size: 28px;
          opacity: 0.5;
        }
        .cristal-badges-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 14px;
          flex-wrap: wrap;
          position: relative; z-index: 2;
        }
        .cristal-badge-topo {
          display: inline-block;
          background: linear-gradient(90deg, #a855f7, #ec4899);
          color: #fff;
          padding: 8px 18px;
          border-radius: 999px;
          font-family: var(--ff-mono);
          font-weight: 900;
          font-size: 14px;
          letter-spacing: 0.08em;
        }
        .cristal-badge-streak {
          background: linear-gradient(90deg, #f59e0b, #ef4444, #ec4899);
          background-size: 200% 100%;
          animation: streakPulse 2.5s ease-in-out infinite;
          box-shadow: 0 0 24px rgba(239, 68, 68, 0.5);
        }
        @keyframes streakPulse {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .cristal-placar-streak {
          display: inline-flex;
          align-items: baseline;
          gap: 4px;
          padding: 6px 16px;
          background: rgba(16, 185, 129, 0.15);
          border: 1px solid rgba(16, 185, 129, 0.4);
          border-radius: 999px;
          font-family: var(--ff-display);
          color: #a7f3d0;
        }
        .cristal-placar-streak .streak-num {
          font-size: 22px;
          font-weight: 900;
          color: #10b981;
        }
        .cristal-placar-streak .streak-sep {
          font-size: 18px;
          opacity: 0.5;
        }
        .cristal-placar-streak .streak-total {
          font-size: 18px;
          font-weight: 700;
          opacity: 0.85;
        }
        .cristal-titulo {
          font-family: var(--ff-display);
          font-size: clamp(28px, 4.5vw, 44px);
          font-weight: 900;
          line-height: 1.1;
          margin: 0 0 28px;
          color: #fff;
          letter-spacing: -0.02em;
          position: relative; z-index: 2;
        }
        .cristal-jogo-wrap {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          gap: 18px;
          align-items: center;
          padding: 24px 12px;
          background: rgba(255,255,255,0.04);
          border-radius: 18px;
          border: 1px solid rgba(168, 85, 247, 0.25);
          position: relative; z-index: 2;
          margin-bottom: 22px;
        }
        .cristal-time {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }
        .cristal-time strong {
          font-size: clamp(14px, 2.4vw, 18px);
          text-align: center;
          color: #fff;
          font-weight: 700;
        }
        .cristal-placar {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }
        .placar-resultado-lbl {
          font-family: var(--ff-mono);
          font-size: 10px;
          color: #c4b5fd;
          letter-spacing: 0.1em;
          font-weight: 800;
        }
        .placar-numeros {
          display: flex;
          align-items: baseline;
          gap: 6px;
        }
        .placar-numeros .num {
          font-family: var(--ff-display);
          font-size: clamp(50px, 9vw, 80px);
          font-weight: 900;
          background: linear-gradient(180deg, #fff, #c4b5fd);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          line-height: 1;
          text-shadow: 0 0 40px rgba(168, 85, 247, 0.4);
        }
        .placar-numeros .x {
          font-size: clamp(28px, 5vw, 44px);
          color: #c4b5fd;
          opacity: 0.7;
        }
        .cristal-stats {
          display: flex;
          align-items: center;
          gap: 18px;
          padding: 16px 20px;
          background: rgba(16, 185, 129, 0.12);
          border: 1px solid rgba(16, 185, 129, 0.35);
          border-radius: 14px;
          margin-bottom: 18px;
          position: relative; z-index: 2;
          flex-wrap: wrap;
        }
        .cristal-stat {
          display: flex;
          align-items: baseline;
          gap: 4px;
          font-family: var(--ff-display);
        }
        .cristal-stat .num-grande {
          font-size: 38px;
          font-weight: 900;
          color: #10b981;
          line-height: 1;
        }
        .cristal-stat .lbl {
          font-size: 14px;
          color: #a7f3d0;
          font-weight: 700;
        }
        .cristal-stat-texto {
          flex: 1;
          font-size: 16px;
          color: #e0e7ff;
          font-weight: 600;
        }
        .cristal-cta {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 14px 26px;
          background: linear-gradient(135deg, #a855f7, #ec4899);
          color: #fff;
          border-radius: 12px;
          font-weight: 800;
          font-size: 16px;
          text-decoration: none;
          box-shadow: 0 6px 20px rgba(168, 85, 247, 0.45);
          position: relative; z-index: 2;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .cristal-cta:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(168, 85, 247, 0.6);
        }
        @media (max-width: 600px) {
          .cristal-jogo-wrap { gap: 8px; padding: 16px 6px; }
          .cristal-stats { padding: 12px 14px; }
        }
      `}</style>
    </section>
  );
}
