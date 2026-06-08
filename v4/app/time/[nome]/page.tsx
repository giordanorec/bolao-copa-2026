import Link from "next/link";
import { notFound } from "next/navigation";
import { carregarJogos } from "@/lib/jogos";
import {
  carregarPalpitesIAs,
  carregarDictIAs,
} from "@/lib/palpites-ias";
import { carregarMapaPaises } from "@/lib/paises";
import { resolverLocale } from "@/lib/locale-server";
import Bandeira from "@/components/Bandeira";
import IconeIA from "@/components/IconeIA";
import JogoModal from "@/components/JogoModal";
import ColaboracaoBanner from "@/components/ColaboracaoBanner";
import { scorePopularidade } from "@/lib/ias";

export default async function TimePage({
  params,
}: {
  params: Promise<{ nome: string }>;
}) {
  const { nome: nomeUrl } = await params;
  const nomeTime = decodeURIComponent(nomeUrl);

  const [jogos, palpitesIAs, iasDict, mapaPaises, locale] = await Promise.all([
    carregarJogos(),
    carregarPalpitesIAs(),
    carregarDictIAs(),
    carregarMapaPaises(),
    resolverLocale(),
  ]);

  // filtra jogos onde o time aparece (case-insensitive, tolera acentos diferentes)
  const norm = (s: string) =>
    s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const alvo = norm(nomeTime);
  const meusJogos = jogos.filter(
    (j) => norm(j.time_a) === alvo || norm(j.time_b) === alvo,
  );
  if (meusJogos.length === 0) notFound();

  // pega nome canônico
  const canon =
    meusJogos[0].time_a && norm(meusJogos[0].time_a) === alvo
      ? meusJogos[0].time_a
      : meusJogos[0].time_b;
  const iso = mapaPaises[canon];

  // Resumo agregado: pra cada placar consenso do time, quantas vitórias/empates/derrotas predizem
  let prevVit = 0, prevEmp = 0, prevDer = 0, prevGols = 0, prevSofridos = 0, prevCom = 0;
  for (const j of meusJogos) {
    const dados = palpitesIAs[String(j.numero)];
    const b = dados?.bola_de_cristal;
    if (!b) continue;
    prevCom++;
    const ehTimeA = j.time_a === canon;
    const meusGols = ehTimeA ? b.gols_a : b.gols_b;
    const golsAdv = ehTimeA ? b.gols_b : b.gols_a;
    prevGols += meusGols;
    prevSofridos += golsAdv;
    if (meusGols > golsAdv) prevVit++;
    else if (meusGols === golsAdv) prevEmp++;
    else prevDer++;
  }

  const tx = {
    titulo:
      locale === "en" ? `Predictions for ${canon}`
      : locale === "es" ? `Pronósticos para ${canon}`
      : locale === "fr" ? `Pronostics pour ${canon}`
      : `Palpites para ${canon}`,
    sub:
      locale === "en" ? `What the 122 AIs predict for ${canon} at the 2026 World Cup.`
      : locale === "es" ? `Lo que las 122 IAs pronostican para ${canon} en el Mundial 2026.`
      : locale === "fr" ? `Ce que les 122 IA prédisent pour ${canon} à la Coupe 2026.`
      : `O que as 122 IAs preveem pra ${canon} na Copa 2026.`,
    resumoCristal:
      locale === "en" ? "Crystal Ball summary"
      : locale === "es" ? "Resumen Bola de Cristal"
      : locale === "fr" ? "Résumé Boule de Cristal"
      : "Resumo da Bola de Cristal",
    vitorias: locale === "en" ? "wins" : locale === "es" ? "victorias" : locale === "fr" ? "victoires" : "vitórias",
    empates: locale === "en" ? "draws" : locale === "es" ? "empates" : locale === "fr" ? "nuls" : "empates",
    derrotas: locale === "en" ? "losses" : locale === "es" ? "derrotas" : locale === "fr" ? "défaites" : "derrotas",
    saldo: locale === "en" ? "goal balance" : locale === "es" ? "saldo" : locale === "fr" ? "diff." : "saldo",
    jogosTit: locale === "en" ? "Match by match" : locale === "es" ? "Partido por partido" : locale === "fr" ? "Match par match" : "Jogo a jogo",
    cliquePraVer: locale === "en" ? "Click any match for full picks" : locale === "es" ? "Clic en un partido para ver todo" : locale === "fr" ? "Cliquez pour les détails" : "Clique no jogo pra ver tudo",
  };

  const saldo = prevGols - prevSofridos;
  const saldoStr = saldo > 0 ? `+${saldo}` : String(saldo);

  return (
    <div style={{ marginTop: 32, marginBottom: 64 }}>
      <Link
        href="/jogos"
        style={{
          fontSize: 13,
          color: "var(--fg-muted)",
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          marginBottom: 12,
        }}
      >
        ← /jogos
      </Link>

      <header
        style={{
          display: "flex",
          alignItems: "center",
          gap: 18,
          marginBottom: 24,
          flexWrap: "wrap",
        }}
      >
        <Bandeira iso={iso} nome={canon} size={72} />
        <div>
          <h1 style={{ fontSize: "clamp(28px, 5vw, 44px)", margin: 0 }}>
            {tx.titulo}
          </h1>
          <p
            className="lede"
            style={{ marginTop: 6, fontSize: 16 }}
          >
            {tx.sub}
          </p>
        </div>
      </header>

      {prevCom > 0 && (
        <div className="time-resumo">
          <h2>{tx.resumoCristal}</h2>
          <div className="time-resumo-grid">
            <div>
              <strong>{prevVit}</strong>
              <small>{tx.vitorias}</small>
            </div>
            <div>
              <strong>{prevEmp}</strong>
              <small>{tx.empates}</small>
            </div>
            <div>
              <strong>{prevDer}</strong>
              <small>{tx.derrotas}</small>
            </div>
            <div>
              <strong>{prevGols}-{prevSofridos}</strong>
              <small>gols ({saldoStr})</small>
            </div>
          </div>
        </div>
      )}

      <ColaboracaoBanner variante="ranking" locale={locale} />

      <section style={{ marginTop: 32 }}>
        <h2 className="fase-titulo">{tx.jogosTit}</h2>
        <p
          style={{
            fontSize: 13,
            color: "var(--fg-muted)",
            marginBottom: 16,
          }}
        >
          {tx.cliquePraVer}
        </p>
        <div className="jogos-lista-grid">
          {meusJogos.map((j) => {
            const dados = palpitesIAs[String(j.numero)];
            const b = dados?.bola_de_cristal;
            const total = dados ? Object.keys(dados.palpites).length : 0;
            const topIas = dados
              ? Object.keys(dados.palpites)
                  .sort((a, b) => scorePopularidade(a) - scorePopularidade(b))
                  .slice(0, 3)
              : [];
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
                trigger={
                  <div className="jogo-card">
                    <div className="jogo-card-head">
                      <span className="jogo-num">#{j.numero}</span>
                      <span className="jogo-data">{j.data}</span>
                    </div>
                    <div className="jogo-card-times">
                      <div className="time-bloco">
                        <Bandeira iso={mapaPaises[j.time_a]} nome={j.time_a} size={32} />
                        <span>{j.time_a}</span>
                      </div>
                      <div className="jogo-card-vs">
                        {b ? (
                          <>
                            <div className="placar-consenso">{b.gols_a}×{b.gols_b}</div>
                            <small>🔮 {b.votos}/{total}</small>
                          </>
                        ) : <span style={{ opacity: 0.4 }}>—</span>}
                      </div>
                      <div className="time-bloco">
                        <Bandeira iso={mapaPaises[j.time_b]} nome={j.time_b} size={32} />
                        <span>{j.time_b}</span>
                      </div>
                    </div>
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
                      </div>
                    )}
                  </div>
                }
              />
            );
          })}
        </div>
      </section>
    </div>
  );
}
