import Link from "next/link";
import { promises as fs } from "fs";
import path from "path";
import Bandeira from "@/components/Bandeira";
import IconeIA from "@/components/IconeIA";
import { carregarJogos } from "@/lib/jogos";
import {
  carregarPalpitesIAs,
  carregarDictIAs,
} from "@/lib/palpites-ias";
import { carregarMapaPaises } from "@/lib/paises";
import type { Locale } from "@/lib/i18n";

type Resultado = { jogo_numero: number; gols_a: number; gols_b: number };

const BRASIL = "Brasil";

type Dados = {
  jogoNum: number;
  timeA: string;
  timeB: string;
  isoA?: string;
  isoB?: string;
  golsA: number;
  golsB: number;
  brasilEh: "A" | "B";
  empate: boolean;
  totalPalpitaram: number;
  apostaramBrasil: number;
  cravaram: { slug: string; nome: string }[];
};

async function ultimaSecada(): Promise<Dados | null> {
  const fp = path.join(process.cwd(), "public", "resultados.json");
  try {
    const raw = await fs.readFile(fp, "utf-8");
    const resultados = JSON.parse(raw) as Resultado[];
    if (!resultados.length) return null;

    const [jogos, palpites, dict, mapaPaises] = await Promise.all([
      carregarJogos(),
      carregarPalpitesIAs(),
      carregarDictIAs(),
      carregarMapaPaises(),
    ]);

    // do mais recente pro mais antigo: acha jogo do Brasil que NÃO foi vitória dele
    for (const r of [...resultados].reverse()) {
      const jogo = jogos.find((j) => j.numero === r.jogo_numero);
      if (!jogo) continue;
      const brasilEh =
        jogo.time_a === BRASIL ? "A" : jogo.time_b === BRASIL ? "B" : null;
      if (!brasilEh) continue;

      const golsBrasil = brasilEh === "A" ? r.gols_a : r.gols_b;
      const golsAdv = brasilEh === "A" ? r.gols_b : r.gols_a;
      const brasilVenceu = golsBrasil > golsAdv;
      if (brasilVenceu) continue; // só interessa quando o Brasil tropeçou

      const dados = palpites[String(r.jogo_numero)];
      if (!dados) continue;
      const entries = Object.entries(dados.palpites);

      const cravaram = entries
        .filter(([, p]) => p.gols_a === r.gols_a && p.gols_b === r.gols_b)
        .map(([slug]) => ({ slug, nome: dict[slug] ?? slug }));
      if (cravaram.length === 0) continue;

      const apostaramBrasil = entries.filter(([, p]) => {
        const pb = brasilEh === "A" ? p.gols_a : p.gols_b;
        const pa = brasilEh === "A" ? p.gols_b : p.gols_a;
        return pb > pa;
      }).length;

      return {
        jogoNum: r.jogo_numero,
        timeA: jogo.time_a,
        timeB: jogo.time_b,
        isoA: mapaPaises[jogo.time_a],
        isoB: mapaPaises[jogo.time_b],
        golsA: r.gols_a,
        golsB: r.gols_b,
        brasilEh,
        empate: r.gols_a === r.gols_b,
        totalPalpitaram: entries.length,
        apostaramBrasil,
        cravaram: cravaram.sort((a, b) => a.nome.localeCompare(b.nome)),
      };
    }
    return null;
  } catch {
    return null;
  }
}

const TX: Record<
  Locale,
  {
    badge: string;
    titulo: (n: number) => string;
    sub: (apostaram: number, total: number) => string;
    resultado: string;
    rebeldes: (n: number) => string;
    cta: string;
  }
> = {
  pt: {
    badge: "😈 SECARAM A SELEÇÃO",
    titulo: (n) =>
      n === 1
        ? "1 IA não acreditou no Brasil — e cravou."
        : `${n} IAs secaram o Brasil — e cravaram o placar.`,
    sub: (apostaram, total) =>
      `${apostaram} de ${total} IAs apostaram na vitória da seleção. Essas aqui foram do contra… e acertaram em cheio.`,
    resultado: "DEU ISSO",
    rebeldes: (n) => `As ${n} rebeldes`,
    cta: "Ver todos os palpites desse jogo →",
  },
  en: {
    badge: "😈 THEY JINXED BRAZIL",
    titulo: (n) =>
      n === 1
        ? "1 AI didn't believe in Brazil — and nailed it."
        : `${n} AIs bet against Brazil — and nailed the score.`,
    sub: (apostaram, total) =>
      `${apostaram} of ${total} AIs picked a Brazil win. These ones went against the grain… and got it spot on.`,
    resultado: "FINAL SCORE",
    rebeldes: (n) => `The ${n} rebels`,
    cta: "See all picks for this match →",
  },
  es: {
    badge: "😈 LE HICIERON LA SECA A BRASIL",
    titulo: (n) =>
      n === 1
        ? "1 IA no creyó en Brasil — y clavó el marcador."
        : `${n} IAs apostaron contra Brasil — y clavaron el marcador.`,
    sub: (apostaram, total) =>
      `${apostaram} de ${total} IAs apostaron por la victoria de Brasil. Estas fueron a contracorriente… y acertaron.`,
    resultado: "RESULTADO",
    rebeldes: (n) => `Las ${n} rebeldes`,
    cta: "Ver todos los pronósticos de este partido →",
  },
  fr: {
    badge: "😈 ELLES ONT PORTÉ POISSE AU BRÉSIL",
    titulo: (n) =>
      n === 1
        ? "1 IA n'a pas cru au Brésil — et a vu juste."
        : `${n} IA ont parié contre le Brésil — et ont vu juste.`,
    sub: (apostaram, total) =>
      `${apostaram} sur ${total} IA ont misé sur une victoire du Brésil. Celles-ci ont pris le contre-pied… et ont vu juste.`,
    resultado: "SCORE FINAL",
    rebeldes: (n) => `Les ${n} rebelles`,
    cta: "Voir tous les pronostics de ce match →",
  },
};

export default async function SecaramBrasil({
  locale = "pt",
}: {
  locale?: Locale;
}) {
  const d = await ultimaSecada();
  if (!d) return null;
  const tx = TX[locale];

  return (
    <section className="section secou">
      <div className="container">
        <div className="secou-card">
          <div className="secou-badge">{tx.badge}</div>
          <h2 className="secou-titulo">{tx.titulo(d.cravaram.length)}</h2>
          <p className="secou-sub">{tx.sub(d.apostaramBrasil, d.totalPalpitaram)}</p>

          <div className="secou-jogo">
            <div className="secou-time">
              <Bandeira iso={d.isoA} nome={d.timeA} size={44} />
              <strong>{d.timeA}</strong>
            </div>
            <div className="secou-placar">
              <span className="secou-lbl">{tx.resultado}</span>
              <div className="secou-nums">
                <span>{d.golsA}</span>
                <span className="x">×</span>
                <span>{d.golsB}</span>
              </div>
            </div>
            <div className="secou-time">
              <Bandeira iso={d.isoB} nome={d.timeB} size={44} />
              <strong>{d.timeB}</strong>
            </div>
          </div>

          <div className="secou-rebeldes-lbl">{tx.rebeldes(d.cravaram.length)}</div>
          <div className="secou-grid">
            {d.cravaram.map((ia) => (
              <Link
                key={ia.slug}
                href={`/ia/${encodeURIComponent(ia.slug)}`}
                className="secou-chip"
              >
                <IconeIA slug={ia.slug} size={26} />
                <span>{ia.nome}</span>
              </Link>
            ))}
          </div>

          <Link href={`/jogo/${d.jogoNum}`} className="secou-cta">
            {tx.cta}
          </Link>
        </div>
      </div>

      <style>{`
        .secou { padding: 16px 0 12px; }
        .secou-card {
          position: relative;
          background:
            radial-gradient(ellipse at top right, rgba(245, 158, 11, 0.20), transparent 60%),
            linear-gradient(135deg, #18230f 0%, #0e1208 100%);
          border: 2px solid rgba(250, 204, 21, 0.45);
          border-radius: 24px;
          padding: 30px 26px 26px;
          color: #fff;
          max-width: 880px;
          margin: 0 auto;
          overflow: hidden;
          box-shadow: 0 18px 50px rgba(250, 204, 21, 0.14), 0 6px 20px rgba(0,0,0,0.3);
        }
        .secou-badge {
          display: inline-block;
          background: linear-gradient(90deg, #facc15, #f59e0b);
          color: #1a1300;
          padding: 7px 16px;
          border-radius: 999px;
          font-family: var(--ff-mono);
          font-weight: 900;
          font-size: 13px;
          letter-spacing: 0.06em;
          margin-bottom: 14px;
        }
        .secou-titulo {
          font-family: var(--ff-display);
          font-size: clamp(24px, 4vw, 38px);
          font-weight: 900;
          line-height: 1.12;
          margin: 0 0 10px;
          color: #fff;
          letter-spacing: -0.02em;
        }
        .secou-sub {
          color: #d9e6c4;
          font-size: 15px;
          line-height: 1.5;
          margin: 0 0 22px;
          max-width: 620px;
        }
        .secou-jogo {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          gap: 14px;
          align-items: center;
          padding: 18px 12px;
          background: rgba(255,255,255,0.04);
          border-radius: 16px;
          border: 1px solid rgba(250, 204, 21, 0.22);
          margin-bottom: 22px;
        }
        .secou-time {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
        }
        .secou-time strong {
          font-size: clamp(13px, 2.2vw, 16px);
          text-align: center;
          color: #fff;
        }
        .secou-placar {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
        }
        .secou-lbl {
          font-family: var(--ff-mono);
          font-size: 9px;
          color: #fde68a;
          letter-spacing: 0.12em;
          font-weight: 800;
        }
        .secou-nums {
          display: flex;
          align-items: baseline;
          gap: 6px;
          font-family: var(--ff-display);
          font-weight: 900;
          font-size: clamp(40px, 7vw, 64px);
          color: #fde047;
          line-height: 1;
        }
        .secou-nums .x {
          font-size: clamp(22px, 4vw, 34px);
          color: #fde68a;
          opacity: 0.65;
        }
        .secou-rebeldes-lbl {
          font-family: var(--ff-mono);
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #fde68a;
          margin-bottom: 12px;
        }
        .secou-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-bottom: 22px;
        }
        .secou-chip {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 7px 12px 7px 8px;
          background: rgba(250, 204, 21, 0.10);
          border: 1px solid rgba(250, 204, 21, 0.32);
          border-radius: 999px;
          color: #fef9c3;
          font-size: 13px;
          font-weight: 700;
          text-decoration: none;
          transition: background 0.15s ease, transform 0.15s ease;
        }
        .secou-chip:hover {
          background: rgba(250, 204, 21, 0.20);
          transform: translateY(-1px);
        }
        .secou-cta {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 13px 24px;
          background: linear-gradient(135deg, #facc15, #f59e0b);
          color: #1a1300;
          border-radius: 12px;
          font-weight: 800;
          font-size: 15px;
          text-decoration: none;
          box-shadow: 0 6px 18px rgba(245, 158, 11, 0.4);
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .secou-cta:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 26px rgba(245, 158, 11, 0.55);
        }
        @media (max-width: 600px) {
          .secou-jogo { gap: 6px; padding: 14px 6px; }
        }
      `}</style>
    </section>
  );
}
