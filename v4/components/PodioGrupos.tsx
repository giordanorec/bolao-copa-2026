import { promises as fs } from "fs";
import path from "path";
import Link from "next/link";
import type { Locale } from "@/lib/i18n";
import { marcaDe } from "@/lib/ias";
import {
  SLUGS_SERIE_A,
  APELIDOS_SERIE_A as APELIDOS,
  FALLBACK_NAO_WEB,
} from "@/lib/serie-a";
import IconeIA from "@/components/IconeIA";

type FaseStats = {
  pontos: number;
  placares_exatos: number;
  vencedores_acertados: number;
  jogos_palpitados: number;
};

type IARaw = {
  slug: string;
  nome_display: string;
  pontos: number;
  placares_exatos: number;
  jogos_palpitados: number;
  grupos?: FaseStats;
  matamata?: FaseStats;
  geral?: FaseStats;
};

type PodioItem = {
  slug: string;
  nome: string;
  marca: ReturnType<typeof marcaDe>;
  pontos: number;
  posicao: 1 | 2 | 3;
  medal: string;
};

async function carregarPodio(): Promise<PodioItem[]> {
  try {
    const arquivo = path.join(process.cwd(), "public", "ranking-ias.json");
    const raw = await fs.readFile(arquivo, "utf-8");
    const dados = JSON.parse(raw) as { ias: IARaw[] };
    const porSlug = new Map<string, IARaw>();
    for (const ia of dados.ias) porSlug.set(ia.slug, ia);

    // Coleta pontos de grupos para cada membro da Série A (usando fallback não-web)
    const candidatos: { slug: string; nome: string; pontos: number }[] = [];
    for (const slug of SLUGS_SERIE_A) {
      const oficial = porSlug.get(slug);
      const sibling = FALLBACK_NAO_WEB[slug]
        ? porSlug.get(FALLBACK_NAO_WEB[slug])
        : undefined;
      // Os palpites reais estão no irmão não-web
      const fonte = sibling ?? oficial;
      if (!fonte) continue;
      const pontosGrupos = fonte.grupos?.pontos ?? 0;
      const ap = APELIDOS[slug];
      candidatos.push({
        slug,
        nome: ap?.nome ?? oficial?.nome_display ?? slug,
        pontos: pontosGrupos,
      });
    }

    // Ordena por pontos de grupos (desc)
    candidatos.sort((a, b) => b.pontos - a.pontos);

    const top3 = candidatos.slice(0, 3);
    const medals = ["🥇", "🥈", "🥉"] as const;
    const posicoes = [1, 2, 3] as const;

    return top3.map((c, i) => ({
      slug: c.slug,
      nome: c.nome,
      marca: marcaDe(c.slug),
      pontos: c.pontos,
      posicao: posicoes[i],
      medal: medals[i],
    }));
  } catch {
    return [];
  }
}

const TITULOS: Record<Locale, string> = {
  pt: "Campeões da fase de grupos",
  en: "Group stage champions",
  es: "Campeones de la fase de grupos",
  fr: "Champions de la phase de groupes",
};

const SUBS: Record<Locale, string> = {
  pt: "Top 3 da Série A na 1ª fase — com o mata-mata, tudo pode mudar.",
  en: "Top 3 of the Premier League in the group stage — knockout changes everything.",
  es: "Top 3 de La Liga en la fase de grupos — la eliminatoria lo cambia todo.",
  fr: "Top 3 de la Ligue en phase de groupes — l'élimination change tout.",
};

const CTA_RETRO: Record<Locale, string> = {
  pt: "✨ Ver a retrospectiva completa da fase de grupos →",
  en: "✨ See the full group stage retrospective →",
  es: "✨ Ver la retrospectiva completa de la fase de grupos →",
  fr: "✨ Voir la rétrospective complète de la phase de groupes →",
};

export default async function PodioGrupos({ locale = "pt" }: { locale?: Locale }) {
  const podio = await carregarPodio();
  if (podio.length < 3) return null;

  const titulo = TITULOS[locale];
  const sub = SUBS[locale];

  // Ordem visual: 2º (esq), 1º (centro/maior), 3º (dir)
  const visual: [PodioItem, PodioItem, PodioItem] = [podio[1], podio[0], podio[2]];
  const alturas = [180, 280, 140]; // altura do degrau em px (visual: 2, 1, 3)
  const tamanhosMascote = [108, 178, 92]; // img do mascote (só ele em cima)

  // Tinta do degrau por colocação (ouro / prata / bronze)
  const TINTA: Record<1 | 2 | 3, { grad: string; cor: string; borda: string }> = {
    1: {
      grad: "linear-gradient(165deg, #FFD34D 0%, #E0A100 60%, #B97E00 100%)",
      cor: "#3a2a00",
      borda: "#FFD34D",
    },
    2: {
      grad: "linear-gradient(165deg, #E8ECF2 0%, #B9C0CC 60%, #969DAA 100%)",
      cor: "#2a2f38",
      borda: "#C9D0DA",
    },
    3: {
      grad: "linear-gradient(165deg, #E6A86B 0%, #C07B3C 60%, #9A5E28 100%)",
      cor: "#3a2208",
      borda: "#E6A86B",
    },
  };

  return (
    <section className="section" style={{ paddingBottom: 0 }}>
      <div className="container">
        <h2 style={{ textAlign: "center", marginBottom: 6, fontSize: "clamp(22px, 4vw, 34px)" }}>
          {titulo}
        </h2>
        <p
          style={{
            textAlign: "center",
            color: "var(--fg-mid)",
            fontSize: 15,
            marginBottom: 44,
            maxWidth: 560,
            marginInline: "auto",
          }}
        >
          {sub}
        </p>

        {/* Pódio — clica e vai pra retrospectiva da fase de grupos */}
        <Link
          href="/retrospectiva-grupos"
          aria-label={CTA_RETRO[locale]}
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            gap: 8,
            maxWidth: 720,
            marginInline: "auto",
            textDecoration: "none",
            color: "inherit",
          }}
        >
          {visual.map((item) => {
            const is1st = item.posicao === 1;
            const tinta = TINTA[item.posicao];
            const alturaBloco = alturas[is1st ? 1 : item.posicao === 2 ? 0 : 2];
            const tamMascote = tamanhosMascote[is1st ? 1 : item.posicao === 2 ? 0 : 2];

            return (
              <div
                key={item.slug}
                style={{
                  flex: is1st ? 1.3 : 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textDecoration: "none",
                  color: "inherit",
                }}
              >
                {/* Coroa só no 1º lugar */}
                {is1st && (
                  <div
                    style={{
                      fontSize: 40,
                      lineHeight: 1,
                      marginBottom: -8,
                      filter: "drop-shadow(0 2px 8px rgba(255,211,77,.6))",
                    }}
                    aria-hidden
                  >
                    👑
                  </div>
                )}

                {/* SÓ o mascote em cima do degrau */}
                <div
                  style={{
                    position: "relative",
                    display: "inline-block",
                    marginBottom: 6,
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/mascots/${item.slug}.png`}
                    alt={`Mascote ${item.nome}`}
                    width={tamMascote}
                    height={tamMascote}
                    loading="lazy"
                    style={{
                      width: tamMascote,
                      height: tamMascote,
                      objectFit: "contain",
                      display: "block",
                      filter: is1st
                        ? "drop-shadow(0 6px 22px rgba(255,211,77,.55))"
                        : "drop-shadow(0 4px 12px rgba(0,0,0,.25))",
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      bottom: -2,
                      right: -2,
                      background: "var(--bg)",
                      borderRadius: "50%",
                      padding: 3,
                      border: "1px solid var(--line)",
                      lineHeight: 0,
                    }}
                  >
                    <IconeIA slug={item.slug} size={is1st ? 24 : 16} />
                  </div>
                </div>

                {/* Degrau com legendas SOBREPOSTAS */}
                <div
                  style={{
                    width: "100%",
                    height: alturaBloco,
                    background: tinta.grad,
                    border: `1px solid ${tinta.borda}`,
                    borderBottom: "none",
                    borderRadius: "var(--r-m) var(--r-m) 0 0",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "flex-start",
                    paddingTop: is1st ? 16 : 12,
                    gap: 3,
                    position: "relative",
                    overflow: "hidden",
                    boxShadow: is1st
                      ? "0 -6px 28px rgba(255,211,77,.30)"
                      : "0 -2px 12px rgba(0,0,0,.12)",
                  }}
                >
                  {/* nº gigante de marca d'água no fundo */}
                  <span
                    style={{
                      position: "absolute",
                      bottom: -8,
                      fontFamily: "var(--ff-display)",
                      fontWeight: 900,
                      fontSize: is1st ? 130 : 90,
                      color: tinta.cor,
                      opacity: 0.14,
                      lineHeight: 1,
                      pointerEvents: "none",
                    }}
                  >
                    {item.posicao}
                  </span>

                  <div style={{ fontSize: is1st ? 38 : 26, lineHeight: 1, position: "relative" }}>
                    {item.medal}
                  </div>
                  <div
                    style={{
                      fontWeight: 800,
                      fontSize: is1st ? 17 : 13,
                      color: tinta.cor,
                      lineHeight: 1.15,
                      textAlign: "center",
                      padding: "0 8px",
                      position: "relative",
                    }}
                  >
                    {item.nome}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--ff-display)",
                      fontSize: is1st ? 34 : 22,
                      fontWeight: 900,
                      color: tinta.cor,
                      lineHeight: 1,
                      position: "relative",
                    }}
                  >
                    {item.pontos}
                    <span
                      style={{
                        fontSize: 11,
                        fontFamily: "var(--ff-mono)",
                        fontWeight: 700,
                        marginLeft: 3,
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        opacity: 0.7,
                      }}
                    >
                      pts
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </Link>

        {/* Base do pódio */}
        <div
          style={{
            maxWidth: 720,
            marginInline: "auto",
            height: 7,
            background: "var(--line)",
            borderRadius: "0 0 var(--r-m) var(--r-m)",
          }}
        />

        {/* CTA pra retrospectiva */}
        <div style={{ textAlign: "center", marginTop: 22 }}>
          <Link
            href="/retrospectiva-grupos"
            style={{
              display: "inline-block",
              padding: "12px 24px",
              borderRadius: 999,
              background:
                "linear-gradient(100deg, var(--secondary), var(--secondary-2))",
              color: "#fff",
              fontWeight: 800,
              fontSize: 15,
              textDecoration: "none",
              boxShadow: "var(--shadow-pop)",
            }}
          >
            {CTA_RETRO[locale]}
          </Link>
        </div>
      </div>
    </section>
  );
}
