import Link from "next/link";
import { notFound } from "next/navigation";
import { carregarJogos } from "@/lib/jogos";
import { carregarPalpitesIAs, carregarDictIAs } from "@/lib/palpites-ias";
import { carregarMapaPaises } from "@/lib/paises";
import { resolverLocale } from "@/lib/locale-server";
import Bandeira from "@/components/Bandeira";
import IconeIA from "@/components/IconeIA";
import ShareButtons from "@/components/ShareButtons";
import { scorePopularidade } from "@/lib/ias";

const SITE_URL = "https://bolao.arenadasias.com.br";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ numero: string }>;
}) {
  const { numero } = await params;
  const jogos = await carregarJogos();
  const jogo = jogos.find((j) => String(j.numero) === numero);
  if (!jogo) return { title: "Jogo não encontrado" };
  return {
    title: `${jogo.time_a} × ${jogo.time_b} — Palpites das IAs · Copa 2026`,
    description: `Veja o palpite das 122 IAs pro jogo ${jogo.time_a} × ${jogo.time_b}.`,
    openGraph: {
      title: `${jogo.time_a} × ${jogo.time_b} — Palpite das IAs`,
      description: `Bola de Cristal, top consenso e os 122 palpites pro jogo da Copa 2026.`,
    },
  };
}

export default async function JogoDetalhePage({
  params,
}: {
  params: Promise<{ numero: string }>;
}) {
  const { numero } = await params;
  const [jogos, palpitesIAs, iasDict, mapaPaises, locale] = await Promise.all([
    carregarJogos(),
    carregarPalpitesIAs(),
    carregarDictIAs(),
    carregarMapaPaises(),
    resolverLocale(),
  ]);

  const jogo = jogos.find((j) => String(j.numero) === numero);
  if (!jogo) notFound();

  const dados = palpitesIAs[numero];
  const total = dados ? Object.keys(dados.palpites).length : 0;
  const cristal = dados?.bola_de_cristal;

  const en = locale === "en";
  const es = locale === "es";
  const fr = locale === "fr";

  const tx = {
    voltar: en ? "← All matches" : es ? "← Todos los partidos" : fr ? "← Tous les matches" : "← Todos os jogos",
    teaser: en
      ? `AI predictions · Match #${jogo.numero}`
      : es
        ? `Pronósticos IA · Partido #${jogo.numero}`
        : fr
          ? `Pronostics IA · Match #${jogo.numero}`
          : `Palpite das IAs · Jogo #${jogo.numero}`,
    cristal: en ? "🔮 Crystal Ball (consensus)" : es ? "🔮 Bola de Cristal" : fr ? "🔮 Boule de Cristal" : "🔮 Bola de Cristal",
    cristalLegenda: en
      ? "The most-voted score among all 122 AIs."
      : es
        ? "El marcador más votado por las 122 IAs."
        : fr
          ? "Le score le plus voté par les 122 IA."
          : "O placar mais votado entre as 122 IAs.",
    topConsenso: en ? "Top scores" : es ? "Marcadores top" : fr ? "Top scores" : "Placares mais votados",
    todasIAs: en ? "All 122 AI picks" : es ? "Los 122 pronósticos" : fr ? "Les 122 pronostics" : "Os 122 palpites",
    iasLabel: en ? "AIs" : es ? "IAs" : fr ? "IA" : "IAs",
    desafiar: en ? "Beat the AIs — create your free pool" : es ? "Supera a las IAs — crea tu polla gratis" : fr ? "Battez les IA — créez votre cagnotte" : "Bata as IAs — crie seu bolão grátis",
    botaoCriar: en ? "Start free pool →" : es ? "Crear gratis →" : fr ? "Créer gratuit →" : "Criar grátis →",
    shareTexto: en
      ? `🤖⚽ ${total} AIs predicted ${jogo.time_a} × ${jogo.time_b}`
      : es
        ? `🤖⚽ ${total} IAs pronosticaron ${jogo.time_a} × ${jogo.time_b}`
        : fr
          ? `🤖⚽ ${total} IA ont pronostiqué ${jogo.time_a} × ${jogo.time_b}`
          : `🤖⚽ ${total} IAs palpitaram ${jogo.time_a} × ${jogo.time_b}`,
  };

  const isoA = mapaPaises[jogo.time_a];
  const isoB = mapaPaises[jogo.time_b];

  // Ranking de IAs por popularidade (pra mostrar primeiro as mais conhecidas)
  const slugs = dados
    ? Object.keys(dados.palpites).sort(
        (a, b) => scorePopularidade(a) - scorePopularidade(b),
      )
    : [];

  return (
    <div style={{ marginTop: 24, marginBottom: 64 }}>
      <div style={{ marginBottom: 16 }}>
        <Link
          href="/jogos"
          style={{ color: "var(--fg-mid)", fontSize: 14, fontWeight: 600 }}
        >
          {tx.voltar}
        </Link>
      </div>

      <header
        className="card"
        style={{ padding: 24, marginBottom: 24, textAlign: "center" }}
      >
        <p
          style={{
            fontFamily: "var(--ff-mono)",
            fontSize: 12,
            color: "var(--fg-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            margin: "0 0 12px",
          }}
        >
          {tx.teaser} · {jogo.fase} · {jogo.data.split("-").reverse().join("/")} {jogo.hora}
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr auto 1fr",
            alignItems: "center",
            gap: 16,
            maxWidth: 540,
            marginInline: "auto",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <Bandeira iso={isoA} nome={jogo.time_a} size={64} />
            <strong style={{ fontSize: "clamp(16px, 3vw, 22px)", textAlign: "center" }}>
              {jogo.time_a}
            </strong>
          </div>
          <span style={{ fontFamily: "var(--ff-display)", fontSize: 36, color: "var(--fg-muted)" }}>×</span>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <Bandeira iso={isoB} nome={jogo.time_b} size={64} />
            <strong style={{ fontSize: "clamp(16px, 3vw, 22px)", textAlign: "center" }}>
              {jogo.time_b}
            </strong>
          </div>
        </div>
      </header>

      {cristal && (
        <section
          className="card"
          style={{
            padding: 24,
            marginBottom: 24,
            textAlign: "center",
            background: "color-mix(in srgb, var(--primary) 8%, var(--bg-1))",
            borderColor: "color-mix(in srgb, var(--primary) 30%, transparent)",
          }}
        >
          <p
            style={{
              fontFamily: "var(--ff-mono)",
              fontSize: 12,
              color: "var(--fg-mid)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              margin: "0 0 8px",
              fontWeight: 700,
            }}
          >
            {tx.cristal}
          </p>
          <div
            style={{
              fontFamily: "var(--ff-display)",
              fontSize: "clamp(40px, 8vw, 64px)",
              fontWeight: 900,
              color: "var(--primary)",
              lineHeight: 1,
              margin: "8px 0",
            }}
          >
            {cristal.gols_a} <span style={{ opacity: 0.4, fontSize: "0.6em" }}>×</span> {cristal.gols_b}
          </div>
          <p style={{ color: "var(--fg-mid)", fontSize: 14, margin: 0 }}>
            {cristalLegendaComVotos(cristal.votos, total, tx.cristalLegenda)}
          </p>
        </section>
      )}

      <section style={{ marginBottom: 28 }}>
        <h2 style={{ marginBottom: 8 }}>📊 {tx.topConsenso}</h2>
        <div className="placares-grid">
          {(dados?.consenso ?? []).slice(0, 8).map((c, i) => {
            const pct = total > 0 ? Math.round((c.votos / total) * 100) : 0;
            return (
              <div key={i} className="placar-linha">
                <span className="placar-num">{c.gols_a}×{c.gols_b}</span>
                <div className="placar-bar-wrap">
                  <div className="placar-bar" style={{ width: `${pct}%` }} />
                </div>
                <span className="placar-votos">
                  <strong>{c.votos}</strong> {tx.iasLabel}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      <section style={{ marginBottom: 28 }}>
        <h2 style={{ marginBottom: 12 }}>🤖 {tx.todasIAs}</h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: 8,
          }}
        >
          {slugs.map((slug) => {
            const p = dados!.palpites[slug];
            const nome = iasDict[slug] ?? slug;
            return (
              <Link
                key={slug}
                href={`/ia/${encodeURIComponent(slug)}`}
                className="ia-palpite-mini"
              >
                <IconeIA slug={slug} size={28} />
                <span className="ia-palpite-nome">{nome}</span>
                <span className="ia-palpite-placar">
                  <strong>{p.gols_a}</strong>×<strong>{p.gols_b}</strong>
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <section
        className="card"
        style={{ padding: 24, marginBottom: 24, textAlign: "center" }}
      >
        <h3 style={{ fontSize: 18, marginBottom: 12 }}>📤 {tx.shareTexto.split(" ").slice(0, 3).join(" ")}</h3>
        <ShareButtons
          url={`/jogo/${jogo.numero}`}
          texto={tx.shareTexto}
          locale={locale}
        />
      </section>

      <div className="card cta-box" style={{ padding: 28, textAlign: "center" }}>
        <h3 style={{ fontSize: 20, marginBottom: 14 }}>🎯 {tx.desafiar}</h3>
        <Link href="/signup" className="btn primary">
          {tx.botaoCriar}
        </Link>
      </div>

      <style>{`
        .placares-grid { display: flex; flex-direction: column; gap: 6px; }
        .placar-linha {
          display: grid;
          grid-template-columns: 56px 1fr 80px;
          align-items: center;
          gap: 12px;
          padding: 8px 14px;
          background: var(--bg-1);
          border: 1px solid var(--line);
          border-radius: var(--r-m);
        }
        .placar-num {
          font-family: var(--ff-display);
          font-size: 18px;
          font-weight: 800;
          color: var(--secondary);
        }
        .placar-bar-wrap {
          height: 8px;
          background: var(--bg-soft);
          border-radius: 4px;
          overflow: hidden;
        }
        .placar-bar {
          height: 100%;
          background: linear-gradient(90deg, var(--primary), color-mix(in srgb, var(--primary) 70%, var(--secondary)));
          border-radius: 4px;
          transition: width 0.4s ease;
        }
        .placar-votos {
          font-family: var(--ff-mono);
          font-size: 12px;
          color: var(--fg-mid);
          text-align: right;
        }
        .ia-palpite-mini {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          background: var(--bg-1);
          border: 1px solid var(--line);
          border-radius: var(--r-m);
          color: var(--fg);
          transition: border-color 0.15s ease, background 0.15s ease;
        }
        .ia-palpite-mini:hover {
          border-color: var(--primary);
          background: var(--bg-soft);
        }
        .ia-palpite-nome {
          flex: 1;
          min-width: 0;
          font-size: 13px;
          font-weight: 600;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .ia-palpite-placar {
          font-family: var(--ff-display);
          font-size: 16px;
          font-weight: 800;
          color: var(--secondary);
          white-space: nowrap;
        }
        .ia-palpite-placar strong { font-weight: 900; }
      `}</style>
    </div>
  );
}

function cristalLegendaComVotos(votos: number, total: number, base: string): string {
  if (total === 0) return base;
  const pct = Math.round((votos / total) * 100);
  return `${base} (${votos}/${total} · ${pct}%)`;
}
