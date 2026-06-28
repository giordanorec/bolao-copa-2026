import { promises as fs } from "fs";
import path from "path";
import Link from "next/link";
import { carregarJogos, jogoComecou } from "@/lib/jogos";
import {
  carregarPalpitesIAs,
  carregarDictIAs,
  type DadosPorJogo,
} from "@/lib/palpites-ias";
import { carregarMapaPaises } from "@/lib/paises";
import { resolverLocale } from "@/lib/locale-server";
import { t, type Locale } from "@/lib/i18n";
import IconeIA from "@/components/IconeIA";
import ColaboracaoBanner from "@/components/ColaboracaoBanner";
import SeguirInstagram from "@/components/SeguirInstagram";
import CaixaDeSugestao from "@/components/CaixaDeSugestao";
import JogoModal from "@/components/JogoModal";
import ScrollProximoJogo from "@/components/ScrollProximoJogo";
import TimeLink from "@/components/TimeLink";
import { scorePopularidade, marcaDe } from "@/lib/ias";
import V2Revelado from "@/components/V2Revelado";
import { carregarV2PorJogo, consensoV2 } from "@/lib/palpites-v2";

export const metadata = {
  title: "104 Jogos · Bolão das IAs",
  description: "Cada jogo da Copa 2026 com os palpites das 122 IAs.",
};

// R32 (jogos 73-88): os confrontos reais vêm da projeção Monte Carlo;
// o fixtures.json ainda traz só os slots ("2º Grupo A").
type ProjMatch = {
  time_a: string;
  time_b: string;
};
async function carregarProjR32(): Promise<Map<number, ProjMatch>> {
  const map = new Map<number, ProjMatch>();
  try {
    const fp = path.join(process.cwd(), "public", "r32-projecao.json");
    const raw = await fs.readFile(fp, "utf-8");
    const d = JSON.parse(raw) as {
      jogos?: {
        numero: number;
        time_a: string;
        time_b: string;
      }[];
    };
    for (const j of d.jogos ?? []) {
      map.set(j.numero, {
        time_a: j.time_a,
        time_b: j.time_b,
      });
    }
  } catch {
    // sem projeção: cards R32 caem nos slots do fixtures
  }
  return map;
}

// Monta um DadosPorJogo a partir dos palpites mata-mata (palpite_v2
// versao='mata-mata'), pra reusar exatamente o card + modal dos jogos de grupo.
function construirDadosR32(
  mm: Record<string, { gols_a: number; gols_b: number }>,
): DadosPorJogo {
  const c = consensoV2(mm);
  return {
    palpites: mm,
    consenso: [],
    bola_de_cristal: c
      ? { gols_a: c.gols_a, gols_b: c.gols_b, votos: c.votos, fonte_ias: [] }
      : null,
  };
}

export default async function JogosPage() {
  // Palpites das IAs são gratuitos pra todo mundo: v1 (JSON público), v2 dos
  // jogos 41–72 e mata-mata (73–88) ficam todos visíveis, sem cadeado.
  const [jogos, palpitesIAs, iasDict, mapaPaises, locale, v2PorJogo] =
    await Promise.all([
      carregarJogos(),
      carregarPalpitesIAs(),
      carregarDictIAs(),
      carregarMapaPaises(),
      resolverLocale(),
      carregarV2PorJogo(),
    ]);

  // Confrontos R32 (reais/projetados) pra exibir os times certos nos jogos 73-88
  const projR32 = await carregarProjR32();

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

  // Dia do próximo jogo — usado pra injetar o card "Se mantenha antenado"
  // exatamente na seção pra onde o ScrollProximoJogo vai rolar a página.
  // Mesma regra do componente: kickoff + 2h30 ≥ agora. Se a Copa acabou,
  // usa o último jogo.
  const agora = Date.now();
  const GRACE_MS = 2.5 * 60 * 60 * 1000;
  let dataProximoJogo: string | null = null;
  for (const j of jogosOrdenados) {
    const ts = Date.parse(`${j.data}T${j.hora}:00-03:00`);
    if (Number.isFinite(ts) && ts + GRACE_MS >= agora) {
      dataProximoJogo = j.data;
      break;
    }
  }
  if (!dataProximoJogo && jogosOrdenados.length > 0) {
    dataProximoJogo = jogosOrdenados[jogosOrdenados.length - 1].data;
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

      <CaixaDeSugestao locale={locale} variante="jogos" />

      <ColaboracaoBanner variante="ias" locale={locale} />

      <ScrollProximoJogo />

      {Object.entries(porData).map(([data, lista]) => (
        <section key={data} style={{ marginBottom: 32 }}>
          <h2 className="fase-titulo">{formataDia(data)}</h2>
          <div className="jogos-lista-grid">
            {lista.map((j) => {
              // R32 (73-88): times reais/projetados + palpites mata-mata gated.
              const ehR32 = j.numero >= 73 && j.numero <= 88;
              const proj = ehR32 ? projR32.get(j.numero) : undefined;
              const timeA = proj?.time_a ?? j.time_a;
              const timeB = proj?.time_b ?? j.time_b;
              const isoA = mapaPaises[timeA];
              const isoB = mapaPaises[timeB];
              let dados: DadosPorJogo | null =
                palpitesIAs[String(j.numero)] ?? null;
              if (ehR32) {
                const mm = v2PorJogo.get(j.numero);
                dados = mm ? construirDadosR32(mm) : null;
              }
              const bola = dados?.bola_de_cristal;
              const totalVotos = dados
                ? Object.keys(dados.palpites).length
                : 0;
              // Top 3 IAs populares que palpitaram, com **1 por família de
              // marca** — antes a OpenAI dominava o top e o card mostrava 3
              // ícones idênticos de ChatGPT (GPT-4o, GPT-4.1, ChatGPT 5).
              const topIas = dados
                ? (() => {
                    const ordered = Object.keys(dados.palpites).sort(
                      (a, b) => scorePopularidade(a) - scorePopularidade(b),
                    );
                    const seen = new Set<string>();
                    const out: string[] = [];
                    for (const s of ordered) {
                      const brand = marcaDe(s).nome;
                      if (seen.has(brand)) continue;
                      seen.add(brand);
                      out.push(s);
                      if (out.length === 3) break;
                    }
                    return out;
                  })()
                : [];
              // jogo encerrado? quebra dos acertos por categoria
              const encerrado = j.gols_a != null && j.gols_b != null;
              let cravadas = 0, saldoOk = 0, venceuOk = 0, empateOk = 0, errou = 0;
              if (encerrado && dados) {
                const ra = j.gols_a as number, rb = j.gols_b as number;
                for (const p of Object.values(dados.palpites)) {
                  if (p.gols_a === ra && p.gols_b === rb) cravadas++;
                  else if (p.gols_a === p.gols_b && ra === rb) empateOk++;
                  else if (
                    Math.sign(p.gols_a - p.gols_b) === Math.sign(ra - rb) &&
                    p.gols_a !== p.gols_b &&
                    p.gols_a - p.gols_b === ra - rb
                  ) saldoOk++;
                  else if (
                    Math.sign(p.gols_a - p.gols_b) === Math.sign(ra - rb) &&
                    p.gols_a !== p.gols_b
                  ) venceuOk++;
                  else errou++;
                }
              }
              const cristalCravou = encerrado && bola
                ? bola.gols_a === j.gols_a && bola.gols_b === j.gols_b
                : false;
              const ftLbl = locale === "en" ? "FT"
                : locale === "es" ? "FIN"
                : locale === "fr" ? "FIN"
                : "FIM";
              const lbl = locale === "en"
                ? { exato: "exact", saldo: "diff", venc: "winner", emp: "draw", err: "wrong" }
                : locale === "es"
                  ? { exato: "exacto", saldo: "saldo", venc: "ganador", emp: "empate", err: "fallo" }
                  : locale === "fr"
                    ? { exato: "exact", saldo: "écart", venc: "vainq.", emp: "nul", err: "faux" }
                    : { exato: "exato", saldo: "saldo", venc: "vencedor", emp: "empate", err: "errou" };
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
                  timeA={timeA}
                  timeB={timeB}
                  isoA={isoA}
                  isoB={isoB}
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
                        <TimeLink nome={timeA} iso={isoA} size={32} />
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
                        <TimeLink nome={timeB} iso={isoB} size={32} />
                      </div>
                      {encerrado && (
                        <div className="breakdown-strip">
                          <div className="breakdown-pills">
                            <span className="bd-pill bd-exato" title={`${cravadas} ${lbl.exato} (10 pts)`}>
                              🎯 <strong>{cravadas}</strong> <span>{lbl.exato}</span>
                            </span>
                            <span className="bd-pill bd-saldo" title={`${saldoOk} ${lbl.saldo} (7 pts)`}>
                              📊 <strong>{saldoOk}</strong> <span>{lbl.saldo}</span>
                            </span>
                            <span className="bd-pill bd-venc" title={`${venceuOk} ${lbl.venc} (5 pts)`}>
                              ✅ <strong>{venceuOk}</strong> <span>{lbl.venc}</span>
                            </span>
                            {empateOk > 0 && (
                              <span className="bd-pill bd-emp" title={`${empateOk} ${lbl.emp} (5 pts)`}>
                                🤝 <strong>{empateOk}</strong> <span>{lbl.emp}</span>
                              </span>
                            )}
                            <span className="bd-pill bd-err" title={`${errou} ${lbl.err} (0 pts)`}>
                              ❌ <strong>{errou}</strong> <span>{lbl.err}</span>
                            </span>
                          </div>
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
                      {j.numero >= 41 && j.numero <= 72 && !jogoComecou(j) && (() => {
                        const v2map = v2PorJogo.get(j.numero);
                        const c = v2map ? consensoV2(v2map) : null;
                        return c ? (
                          <V2Revelado
                            locale={locale}
                            jogoNumero={j.numero}
                            golsA={c.gols_a}
                            golsB={c.gols_b}
                            votos={c.votos}
                            total={c.total}
                          />
                        ) : null;
                      })()}
                    </div>
                  }
                />
              );
            })}
            {data === dataProximoJogo && (
              <SeguirInstagram locale={locale} compact />
            )}
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
