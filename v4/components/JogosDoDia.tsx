import { promises as fs } from "fs";
import path from "path";
import { carregarJogos } from "@/lib/jogos";
import { carregarPalpitesIAs, carregarDictIAs } from "@/lib/palpites-ias";
import { carregarMapaPaises } from "@/lib/paises";
import Bandeira from "@/components/Bandeira";
import JogoShareCard from "@/components/JogoShareCard";
import type { Locale } from "@/lib/i18n";

const SITE_URL = "https://bolao.arenadasias.com.br";

function hojeBRT(): string {
  const fmt = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return fmt.format(new Date());
}

const TX: Record<Locale, {
  titulo: string;
  sub: string;
  teaser: (n: number) => string;
  cristalLabel: string;
  consensoLabel: string;
  iasLabel: string;
  shareLabel: string;
  verMaisLabel: string;
  whatsTitulo: string;
  whatsCristal: string;
  whatsConsenso: (votos: number, total: number) => string;
  whatsCTA: string;
}> = {
  pt: {
    titulo: "🤖 Em breve: a abertura da Copa",
    sub: "As 122 IAs já palpitaram. Veja em quem elas apostam — e desafie seu chute.",
    teaser: (n) => `Palpite das IAs pro Jogo ${n}`,
    cristalLabel: "🔮 Bola de Cristal",
    consensoLabel: "Mais votado",
    iasLabel: "IAs apostaram",
    shareLabel: "Mandar no zap",
    verMaisLabel: "Ver os 122 palpites →",
    whatsTitulo: "🤖⚽ As 122 IAs palpitaram!",
    whatsCristal: "🔮 Bola de Cristal:",
    whatsConsenso: (votos, total) => `Mais votado por ${votos} de ${total} IAs:`,
    whatsCTA: "Veja os 122 palpites e crie seu bolão grátis 👇",
  },
  en: {
    titulo: "🤖 Coming up: World Cup opening",
    sub: "All 122 AIs have placed their bets. See who they pick — then challenge it.",
    teaser: (n) => `AI predictions for Match ${n}`,
    cristalLabel: "🔮 Crystal Ball",
    consensoLabel: "Most picked",
    iasLabel: "AIs predicted",
    shareLabel: "Share on WhatsApp",
    verMaisLabel: "See all 122 picks →",
    whatsTitulo: "🤖⚽ All 122 AIs have predicted!",
    whatsCristal: "🔮 Crystal Ball:",
    whatsConsenso: (votos, total) => `Most picked by ${votos} of ${total} AIs:`,
    whatsCTA: "See all 122 predictions and start your free pool 👇",
  },
  es: {
    titulo: "🤖 Pronto: la apertura del Mundial",
    sub: "Las 122 IAs ya pronosticaron. Mira por quién apuestan — y desafía.",
    teaser: (n) => `Pronóstico de las IAs · Partido ${n}`,
    cristalLabel: "🔮 Bola de Cristal",
    consensoLabel: "Más votado",
    iasLabel: "IAs pronosticaron",
    shareLabel: "Mandar por WhatsApp",
    verMaisLabel: "Ver los 122 pronósticos →",
    whatsTitulo: "🤖⚽ ¡Las 122 IAs ya pronosticaron!",
    whatsCristal: "🔮 Bola de Cristal:",
    whatsConsenso: (votos, total) => `Más votado por ${votos} de ${total} IAs:`,
    whatsCTA: "Mira los 122 pronósticos y crea tu polla gratis 👇",
  },
  fr: {
    titulo: "🤖 À venir : ouverture de la Coupe",
    sub: "Les 122 IA ont pronostiqué. Voyez sur qui elles parient — et défiez.",
    teaser: (n) => `Pronostic des IA · Match ${n}`,
    cristalLabel: "🔮 Boule de Cristal",
    consensoLabel: "Le plus voté",
    iasLabel: "IA ont pronostiqué",
    shareLabel: "Partager sur WhatsApp",
    verMaisLabel: "Voir les 122 pronostics →",
    whatsTitulo: "🤖⚽ Les 122 IA ont pronostiqué !",
    whatsCristal: "🔮 Boule de Cristal :",
    whatsConsenso: (votos, total) => `Le plus voté par ${votos} sur ${total} IA :`,
    whatsCTA: "Voyez les 122 pronostics et créez votre cagnotte 👇",
  },
};

async function carregarResultadosSet(): Promise<Set<number>> {
  const fp = path.join(process.cwd(), "public", "resultados.json");
  try {
    const raw = await fs.readFile(fp, "utf-8");
    const arr = JSON.parse(raw) as Array<{ jogo_numero: number }>;
    return new Set(arr.map((r) => r.jogo_numero));
  } catch {
    return new Set();
  }
}

export default async function JogosDoDia({
  locale = "pt",
  max = 2,
}: {
  locale?: Locale;
  max?: number;
}) {
  const [jogos, palpitesIAs, iasDict, mapaPaises, encerrados] = await Promise.all([
    carregarJogos(),
    carregarPalpitesIAs(),
    carregarDictIAs(),
    carregarMapaPaises(),
    carregarResultadosSet(),
  ]);

  const hoje = hojeBRT();
  // pendentes = data >= hoje E sem resultado ainda
  const pendentes = jogos
    .filter((j) => j.data >= hoje && !encerrados.has(j.numero))
    .sort((a, b) => (a.data + a.hora).localeCompare(b.data + b.hora));
  if (!pendentes.length) return null;

  const primeiraData = pendentes[0].data;
  const jogosDia = pendentes.filter((j) => j.data === primeiraData).slice(0, max);
  if (!jogosDia.length) return null;

  const tx = TX[locale];

  return (
    <section className="section jogos-do-dia">
      <div className="container">
        <h2 style={{ textAlign: "center", marginBottom: 8 }}>{tx.titulo}</h2>
        <p
          style={{
            textAlign: "center",
            color: "var(--fg-mid)",
            fontSize: 16,
            marginBottom: 28,
            maxWidth: 620,
            marginInline: "auto",
          }}
        >
          {tx.sub}
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(auto-fit, minmax(${jogosDia.length === 1 ? "320px" : "300px"}, 1fr))`,
            gap: 18,
            maxWidth: 880,
            marginInline: "auto",
          }}
        >
          {jogosDia.map((jogo) => {
            const dados = palpitesIAs[String(jogo.numero)];
            const total = dados ? Object.keys(dados.palpites).length : 0;
            const cristal = dados?.bola_de_cristal;
            const topConsenso = dados?.consenso?.[0];
            const isoA = mapaPaises[jogo.time_a];
            const isoB = mapaPaises[jogo.time_b];

            const whatsLinhas = [
              `*${tx.whatsTitulo}*`,
              "",
              `⚽ *${jogo.time_a} × ${jogo.time_b}*`,
              `📅 ${jogo.data.split("-").reverse().join("/")} · ${jogo.hora}`,
              "",
            ];
            if (cristal) {
              whatsLinhas.push(
                `${tx.whatsCristal} *${cristal.gols_a} × ${cristal.gols_b}*`,
              );
            }
            const ehMesmoCristal =
              topConsenso &&
              cristal &&
              topConsenso.gols_a === cristal.gols_a &&
              topConsenso.gols_b === cristal.gols_b;
            if (topConsenso && !ehMesmoCristal) {
              whatsLinhas.push(
                `${tx.whatsConsenso(topConsenso.votos, total)}`,
                `   *${topConsenso.gols_a} × ${topConsenso.gols_b}*`,
              );
            }
            whatsLinhas.push("", tx.whatsCTA, "", `${SITE_URL}/jogo/${jogo.numero}`);
            const whatsMsg = whatsLinhas.join("\n");

            return (
              <article key={jogo.numero} className="jogo-share-card">
                <header className="jogo-share-head">
                  <span className="jogo-share-teaser">{tx.teaser(jogo.numero)}</span>
                  <span className="jogo-share-data">
                    {jogo.data.split("-").reverse().slice(0, 2).join("/")} · {jogo.hora}
                  </span>
                </header>

                <div className="jogo-share-times">
                  <div className="jogo-share-time">
                    <Bandeira iso={isoA} nome={jogo.time_a} size={48} />
                    <strong>{jogo.time_a}</strong>
                  </div>
                  <div className="jogo-share-vs">×</div>
                  <div className="jogo-share-time">
                    <Bandeira iso={isoB} nome={jogo.time_b} size={48} />
                    <strong>{jogo.time_b}</strong>
                  </div>
                </div>

                {cristal && (
                  <div className="jogo-share-cristal">
                    <span className="cristal-label">{tx.cristalLabel}</span>
                    <span className="cristal-placar">
                      {cristal.gols_a}
                      <em>×</em>
                      {cristal.gols_b}
                    </span>
                  </div>
                )}

                {dados?.consenso && dados.consenso.length > 0 && (
                  <ul className="jogo-share-top">
                    {dados.consenso.slice(0, 3).map((c, idx) => {
                      const ehCristal =
                        cristal &&
                        c.gols_a === cristal.gols_a &&
                        c.gols_b === cristal.gols_b;
                      return (
                        <li key={idx} data-cristal={ehCristal ? "1" : "0"}>
                          <span className="top-placar">
                            {c.gols_a}×{c.gols_b}
                          </span>
                          <span className="top-votos">
                            {c.votos} {tx.iasLabel}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                )}

                <JogoShareCard
                  jogoNumero={jogo.numero}
                  whatsMsg={whatsMsg}
                  shareLabel={tx.shareLabel}
                  verMaisLabel={tx.verMaisLabel}
                  url={`${SITE_URL}/jogo/${jogo.numero}`}
                />

                {/* prefere dict do display name pra fallback de IAs */}
                <span style={{ display: "none" }}>{Object.keys(iasDict).length}</span>
              </article>
            );
          })}
        </div>
      </div>

      <style>{`
        .jogos-do-dia { padding-top: 24px; padding-bottom: 24px; }
        .jogo-share-card {
          background: linear-gradient(135deg, var(--bg-2) 0%, var(--bg-1) 100%);
          border: 2px solid var(--line);
          border-radius: var(--r-l);
          padding: 22px 20px 18px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          position: relative;
          overflow: hidden;
        }
        .jogo-share-card::before {
          content: "";
          position: absolute;
          top: 0; right: 0;
          width: 120px; height: 120px;
          background: radial-gradient(circle, rgba(168,85,247,0.18), transparent 70%);
          pointer-events: none;
        }
        .jogo-share-head {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          gap: 8px;
        }
        .jogo-share-teaser {
          font-family: var(--ff-display);
          font-size: 17px;
          font-weight: 800;
          color: var(--secondary);
          line-height: 1.15;
        }
        .jogo-share-data {
          font-family: var(--ff-mono);
          font-size: 11px;
          color: var(--fg-muted);
          text-transform: uppercase;
          letter-spacing: 0.06em;
          white-space: nowrap;
        }
        .jogo-share-times {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: center;
          gap: 10px;
          padding: 6px 0;
        }
        .jogo-share-time {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          text-align: center;
        }
        .jogo-share-time strong {
          font-size: 14px;
          line-height: 1.2;
        }
        .jogo-share-vs {
          font-family: var(--ff-display);
          font-size: 26px;
          color: var(--fg-muted);
          opacity: 0.6;
        }
        .jogo-share-cristal {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 14px;
          background: color-mix(in srgb, var(--primary) 8%, transparent);
          border: 1px solid color-mix(in srgb, var(--primary) 25%, transparent);
          border-radius: var(--r-m);
        }
        .cristal-label {
          font-family: var(--ff-mono);
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--fg-mid);
        }
        .cristal-placar {
          font-family: var(--ff-display);
          font-size: 26px;
          font-weight: 900;
          color: var(--primary);
          display: inline-flex;
          align-items: baseline;
          gap: 4px;
        }
        .cristal-placar em {
          font-style: normal;
          font-size: 18px;
          opacity: 0.5;
          margin: 0 4px;
        }
        .jogo-share-top {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .jogo-share-top li {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          font-size: 13px;
          padding: 4px 10px;
          border-radius: var(--r-s);
        }
        .jogo-share-top li[data-cristal="1"] { background: color-mix(in srgb, var(--primary) 6%, transparent); }
        .top-placar {
          font-family: var(--ff-display);
          font-weight: 800;
          color: var(--secondary);
          font-size: 16px;
        }
        .top-votos {
          font-family: var(--ff-mono);
          font-size: 11px;
          color: var(--fg-muted);
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
      `}</style>
    </section>
  );
}
