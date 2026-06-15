import Link from "next/link";
import { carregarJogos } from "@/lib/jogos";
import {
  carregarPalpitesIAs,
  carregarDictIAs,
} from "@/lib/palpites-ias";
import { carregarMapaPaises } from "@/lib/paises";
import { resolverLocale } from "@/lib/locale-server";
import { t } from "@/lib/i18n";
import IconeIA from "@/components/IconeIA";
import ColaboracaoBanner from "@/components/ColaboracaoBanner";
import JogoModal from "@/components/JogoModal";
import ScrollProximoJogo from "@/components/ScrollProximoJogo";
import TimeLink from "@/components/TimeLink";
import { scorePopularidade } from "@/lib/ias";

export const metadata = {
  title: "104 Jogos · Bolão das IAs",
  description: "Cada jogo da Copa 2026 com os palpites das 122 IAs.",
};

export default async function JogosPage() {
  const [jogos, palpitesIAs, iasDict, mapaPaises, locale] = await Promise.all([
    carregarJogos(),
    carregarPalpitesIAs(),
    carregarDictIAs(),
    carregarMapaPaises(),
    resolverLocale(),
  ]);

  const titulo =
    locale === "en" ? "All 104 matches"
    : locale === "es" ? "Los 104 partidos"
    : locale === "fr" ? "Les 104 matches"
    : "Os 104 jogos da Copa";
  const sub =
    locale === "en" ? "Each match with consensus from 122 AIs."
    : locale === "es" ? "Cada partido con el consenso de 122 IAs."
    : locale === "fr" ? "Chaque match avec le consensus de 122 IA."
    : "Cada jogo com o consenso das 122 IAs.";

  // ordena por data + hora e agrupa por data
  const jogosOrdenados = [...jogos].sort((a, b) => {
    if (a.data !== b.data) return a.data.localeCompare(b.data);
    return a.hora.localeCompare(b.hora);
  });
  const porData: Record<string, typeof jogos> = {};
  for (const j of jogosOrdenados) {
    (porData[j.data] ??= []).push(j);
  }

  // formata "2026-06-11" -> "Qui, 11/06" (PT) etc.
  function formataDia(data: string): string {
    const [, mes, dia] = data.split("-");
    const dt = new Date(`${data}T12:00:00Z`);
    const diasSemana: Record<string, Record<number, string>> = {
      pt: { 0: "Dom", 1: "Seg", 2: "Ter", 3: "Qua", 4: "Qui", 5: "Sex", 6: "Sáb" },
      en: { 0: "Sun", 1: "Mon", 2: "Tue", 3: "Wed", 4: "Thu", 5: "Fri", 6: "Sat" },
      es: { 0: "Dom", 1: "Lun", 2: "Mar", 3: "Mié", 4: "Jue", 5: "Vie", 6: "Sáb" },
      fr: { 0: "Dim", 1: "Lun", 2: "Mar", 3: "Mer", 4: "Jeu", 5: "Ven", 6: "Sam" },
    };
    const dia_semana = diasSemana[locale]?.[dt.getUTCDay()] ?? "";
    return `${dia_semana}, ${dia}/${mes}`;
  }

  return (
    <div style={{ marginTop: 32, marginBottom: 64 }}>
      <header style={{ textAlign: "center", marginBottom: 32 }}>
        <h1 style={{ fontSize: "clamp(28px, 5vw, 48px)" }}>⚽ {titulo}</h1>
        <p className="lede" style={{ marginTop: 8 }}>{sub}</p>
      </header>

      <ColaboracaoBanner variante="ias" locale={locale} />

      <ScrollProximoJogo />

      {Object.entries(porData).map(([data, lista]) => (
        <section key={data} style={{ marginBottom: 32 }}>
          <h2 className="fase-titulo">{formataDia(data)}</h2>
          <div className="jogos-lista-grid">
            {lista.map((j) => {
              const dados = palpitesIAs[String(j.numero)];
              const bola = dados?.bola_de_cristal;
              const totalVotos = dados
                ? Object.keys(dados.palpites).length
                : 0;
              // top 3 IAs populares que palpitaram
              const topIas = dados
                ? Object.keys(dados.palpites)
                    .sort(
                      (a, b) => scorePopularidade(a) - scorePopularidade(b),
                    )
                    .slice(0, 3)
                : [];
              // jogo encerrado? quantos cravaram o placar exato?
              const encerrado = j.gols_a != null && j.gols_b != null;
              const cravadas = encerrado && dados
                ? Object.values(dados.palpites).filter(
                    (p) => p.gols_a === j.gols_a && p.gols_b === j.gols_b,
                  ).length
                : 0;
              const cristalCravou = encerrado && bola
                ? bola.gols_a === j.gols_a && bola.gols_b === j.gols_b
                : false;
              const ftLbl = locale === "en" ? "FT"
                : locale === "es" ? "FIN"
                : locale === "fr" ? "FIN"
                : "FIM";
              const cravLbl = locale === "en" ? "AIs nailed the score"
                : locale === "es" ? "IAs cravaron el marcador"
                : locale === "fr" ? "IA ont visé juste"
                : "IAs cravaram o placar";
              // grau de confianca = % de IAs que apostaram no placar mais votado
              const confiancaPct = bola && totalVotos
                ? Math.round((bola.votos / totalVotos) * 100)
                : 0;
              const confiancaTier = confiancaPct >= 40 ? "forte"
                : confiancaPct >= 20 ? "medio"
                : "fraco";
              const confiancaLbl = locale === "en" ? "Confidence"
                : locale === "es" ? "Confianza"
                : locale === "fr" ? "Confiance"
                : "Confiança";
              return (
                <JogoModal
                  key={j.numero}
                  jogoNumero={j.numero}
                  timeA={j.time_a}
                  timeB={j.time_b}
                  isoA={mapaPaises[j.time_a]}
                  isoB={mapaPaises[j.time_b]}
                  data={j.data}
                  hora={j.hora}
                  local={j.local}
                  dados={dados}
                  iasDict={iasDict}
                  locale={locale}
                  domId={String(j.numero)}
                  kickoff={`${j.data}T${j.hora}:00-03:00`}
                  trigger={
                    <div className={`jogo-card${encerrado ? " encerrado" : ""}`}>
                      <div className="jogo-card-head">
                        <span className="jogo-num">#{j.numero}</span>
                        <span className="jogo-data">{j.data} · {j.hora}</span>
                        {encerrado && <span className="jogo-ft">✓ {ftLbl}</span>}
                      </div>
                      <div className="jogo-card-times">
                        <TimeLink nome={j.time_a} iso={mapaPaises[j.time_a]} size={32} />
                        <div className="jogo-card-vs">
                          {encerrado ? (
                            <>
                              <div className="placar-real">
                                {j.gols_a}×{j.gols_b}
                              </div>
                              <small className="placar-real-lbl">{ftLbl}</small>
                            </>
                          ) : bola ? (
                            <>
                              <div className="placar-consenso">
                                {bola.gols_a}×{bola.gols_b}
                              </div>
                              <small>🔮 consenso · {bola.votos}/{totalVotos}</small>
                            </>
                          ) : (
                            <span style={{ opacity: 0.4 }}>—</span>
                          )}
                        </div>
                        <TimeLink nome={j.time_b} iso={mapaPaises[j.time_b]} size={32} />
                      </div>
                      {encerrado && (
                        <div className="cravadas-strip">
                          <strong>{cravadas}</strong>
                          <span>/{totalVotos} {cravLbl}</span>
                          {bola && (
                            <span
                              className="cristal-mini"
                              data-cravou={cristalCravou ? "1" : "0"}
                              title={`Bola de Cristal: ${bola.gols_a}×${bola.gols_b}`}
                            >
                              🔮 {bola.gols_a}×{bola.gols_b}
                            </span>
                          )}
                        </div>
                      )}
                      {topIas.length > 0 && (
                        <div className="jogo-card-ias">
                          {topIas.map((s) => {
                            const p = dados!.palpites[s];
                            return (
                              <div key={s} className="ia-palpite-mini">
                                <IconeIA slug={s} size={18} title={iasDict[s] ?? s} />
                                <span>{p.gols_a}×{p.gols_b}</span>
                              </div>
                            );
                          })}
                          {totalVotos > 3 && (
                            <span className="mais-ias">+{totalVotos - 3}</span>
                          )}
                        </div>
                      )}
                      {bola && (
                        <div className={`confianca-meter ${confiancaTier}`}>
                          <span className="label">🔮 {confiancaLbl}</span>
                          <div className="bar">
                            <div className="fill" style={{ width: `${confiancaPct}%` }} />
                          </div>
                          <span className="pct">{confiancaPct}%</span>
                        </div>
                      )}
                      <div className="jogo-card-acao">
                        🔍 {locale === "en" ? "Click to see all picks"
                          : locale === "es" ? "Clic para ver todas las apuestas"
                          : locale === "fr" ? "Cliquez pour voir tous les pronostics"
                          : "Clique pra ver todos os palpites"}
                      </div>
                    </div>
                  }
                />
              );
            })}
          </div>
        </section>
      ))}

      <div className="card cta-box" style={{ marginTop: 40 }}>
        <h2 style={{ fontSize: 24, marginBottom: 8 }}>
          {locale === "en" ? "Want to bet against the AIs?"
            : locale === "es" ? "¿Quieres apostar contra las IAs?"
            : locale === "fr" ? "Envie de parier contre les IA ?"
            : "Quer disputar contra as IAs?"}
        </h2>
        <p style={{ marginBottom: 18 }}>
          {t(locale, "home.hero.lede.gratis")}
        </p>
        <Link href="/signup" className="btn primary">
          {t(locale, "login.criar")} →
        </Link>
      </div>
    </div>
  );
}
