import Link from "next/link";
import { carregarJogos } from "@/lib/jogos";
import {
  carregarPalpitesIAs,
  carregarDictIAs,
} from "@/lib/palpites-ias";
import { carregarMapaPaises } from "@/lib/paises";
import { resolverLocale } from "@/lib/locale-server";
import { t } from "@/lib/i18n";
import Bandeira from "@/components/Bandeira";
import IconeIA from "@/components/IconeIA";
import DoacaoBanner from "@/components/DoacaoBanner";
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

  // agrupa por fase
  const porFase: Record<string, typeof jogos> = {};
  for (const j of jogos) {
    (porFase[j.fase] ??= []).push(j);
  }

  return (
    <div style={{ marginTop: 32, marginBottom: 64 }}>
      <header style={{ textAlign: "center", marginBottom: 32 }}>
        <h1 style={{ fontSize: "clamp(28px, 5vw, 48px)" }}>⚽ {titulo}</h1>
        <p className="lede" style={{ marginTop: 8 }}>{sub}</p>
      </header>

      <DoacaoBanner variante="ias" locale={locale} />

      {Object.entries(porFase).map(([fase, lista]) => (
        <section key={fase} style={{ marginBottom: 32 }}>
          <h2 className="fase-titulo">{fase}</h2>
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
              return (
                <div key={j.numero} className="jogo-card">
                  <div className="jogo-card-head">
                    <span className="jogo-num">#{j.numero}</span>
                    <span className="jogo-data">{j.data} · {j.hora}</span>
                  </div>
                  <div className="jogo-card-times">
                    <div className="time-bloco">
                      <Bandeira iso={mapaPaises[j.time_a]} nome={j.time_a} size={32} />
                      <span>{j.time_a}</span>
                    </div>
                    <div className="jogo-card-vs">
                      {bola ? (
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
                      {totalVotos > 3 && (
                        <span className="mais-ias">+{totalVotos - 3}</span>
                      )}
                    </div>
                  )}
                  {j.local && (
                    <div className="jogo-card-local">📍 {j.local}</div>
                  )}
                </div>
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
