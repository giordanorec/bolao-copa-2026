import Link from "next/link";
import { carregarJogos } from "@/lib/jogos";
import { carregarPalpitesIAs } from "@/lib/palpites-ias";
import { resolverLocale } from "@/lib/locale-server";
import Bandeira from "@/components/Bandeira";
import DoacaoBanner from "@/components/DoacaoBanner";

const ISO: Record<string, string> = {
  Argentina: "ar", Brasil: "br", Canadá: "ca", México: "mx",
  "Estados Unidos": "us", França: "fr", Inglaterra: "gb-eng",
  Alemanha: "de", Espanha: "es", Portugal: "pt", Itália: "it",
  Holanda: "nl", Bélgica: "be", Suíça: "ch", Áustria: "at",
  Croácia: "hr", Polônia: "pl", "Sérvia": "rs", Dinamarca: "dk",
};

export const metadata = {
  title: "🔮 Bola de Cristal · Bolão das IAs",
  description: "O placar mais votado por todas as 122 IAs para cada jogo.",
};

export default async function CristalPage() {
  const [jogos, palpitesIAs, locale] = await Promise.all([
    carregarJogos(),
    carregarPalpitesIAs(),
    resolverLocale(),
  ]);

  const titulo =
    locale === "en" ? "🔮 Crystal Ball"
    : locale === "es" ? "🔮 Bola de Cristal"
    : locale === "fr" ? "🔮 Boule de Cristal"
    : "🔮 Bola de Cristal";
  const sub =
    locale === "en" ? "The score most voted by all 122 AIs."
    : locale === "es" ? "El marcador más votado por las 122 IAs."
    : locale === "fr" ? "Le score le plus voté par les 122 IA."
    : "O placar mais votado pelas 122 IAs.";
  const porFase: Record<string, typeof jogos> = {};
  for (const j of jogos) (porFase[j.fase] ??= []).push(j);

  return (
    <div style={{ marginTop: 32, marginBottom: 64 }}>
      <header style={{ textAlign: "center", marginBottom: 32 }}>
        <h1 style={{ fontSize: "clamp(28px, 5vw, 48px)" }}>{titulo}</h1>
        <p className="lede" style={{ marginTop: 8 }}>{sub}</p>
      </header>
      <DoacaoBanner variante="ranking" locale={locale} />
      {Object.entries(porFase).map(([fase, lista]) => (
        <section key={fase} style={{ marginBottom: 28 }}>
          <h2 className="fase-titulo">{fase}</h2>
          <div className="cristal-grid">
            {lista.map((j) => {
              const dados = palpitesIAs[String(j.numero)];
              const b = dados?.bola_de_cristal;
              const total = dados
                ? Object.keys(dados.palpites).length
                : 0;
              const pct = b && total
                ? Math.round((b.votos / total) * 100)
                : 0;
              return (
                <div key={j.numero} className="cristal-card">
                  <div className="cristal-card-head">#{j.numero} · {j.data}</div>
                  <div className="cristal-card-times">
                    <Bandeira iso={ISO[j.time_a]} nome={j.time_a} size={26} />
                    <span className="time-nome">{j.time_a}</span>
                    {b ? (
                      <span className="placar">{b.gols_a}×{b.gols_b}</span>
                    ) : (
                      <span className="placar" style={{ opacity: 0.3 }}>—</span>
                    )}
                    <span className="time-nome">{j.time_b}</span>
                    <Bandeira iso={ISO[j.time_b]} nome={j.time_b} size={26} />
                  </div>
                  {b && (
                    <div className="cristal-conf">
                      <div className="conf-bar">
                        <div
                          className="conf-fill"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <small>{b.votos}/{total} IAs ({pct}%)</small>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ))}
      <div className="card cta-box" style={{ marginTop: 40 }}>
        <h2 style={{ fontSize: 22, marginBottom: 8 }}>
          {locale === "en" ? "Bet smarter — see what AIs agree on"
            : locale === "es" ? "Apuesta más inteligente — ve qué acuerdan las IAs"
            : locale === "fr" ? "Pariez plus malin — voyez l'accord des IA"
            : "Aposte mais esperto — veja onde as IAs concordam"}
        </h2>
        <Link href="/signup" className="btn primary">
          {locale === "en" ? "Create my pool →"
            : locale === "es" ? "Crear mi polla →"
            : locale === "fr" ? "Créer ma cagnotte →"
            : "Criar meu bolão →"}
        </Link>
      </div>
    </div>
  );
}
