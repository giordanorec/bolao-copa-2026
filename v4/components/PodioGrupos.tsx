import { promises as fs } from "fs";
import path from "path";
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

export default async function PodioGrupos({ locale = "pt" }: { locale?: Locale }) {
  const podio = await carregarPodio();
  if (podio.length < 3) return null;

  const titulo = TITULOS[locale];
  const sub = SUBS[locale];

  // Ordem visual: 2º (esq), 1º (centro/maior), 3º (dir)
  const visual: [PodioItem, PodioItem, PodioItem] = [podio[1], podio[0], podio[2]];
  const alturas = [160, 210, 130]; // altura do degrau em px (visual: 2, 1, 3)
  const tamanhosMascote = [100, 140, 88]; // img do mascote

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
            marginBottom: 40,
            maxWidth: 560,
            marginInline: "auto",
          }}
        >
          {sub}
        </p>

        {/* Pódio */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            gap: 0,
            maxWidth: 680,
            marginInline: "auto",
          }}
        >
          {visual.map((item, vi) => {
            const alturaBloco = alturas[vi];
            const tamMascote = tamanhosMascote[vi];
            const is1st = item.posicao === 1;

            return (
              <a
                key={item.slug}
                href={`/ia/${encodeURIComponent(item.slug)}`}
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textDecoration: "none",
                  color: "inherit",
                }}
              >
                {/* Mascote + medalha acima do degrau */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    paddingBottom: 8,
                    gap: 6,
                  }}
                >
                  <div style={{ position: "relative", display: "inline-block" }}>
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
                          ? "drop-shadow(0 4px 16px color-mix(in srgb, var(--secondary) 40%, transparent))"
                          : "none",
                      }}
                    />
                    {/* Badge do ícone de marca */}
                    <div
                      style={{
                        position: "absolute",
                        bottom: -4,
                        right: -4,
                        background: "var(--bg)",
                        borderRadius: "50%",
                        padding: 3,
                        border: "1px solid var(--line)",
                        lineHeight: 0,
                      }}
                    >
                      <IconeIA slug={item.slug} size={is1st ? 22 : 16} />
                    </div>
                  </div>

                  {/* Medalha + nome + pontos */}
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: is1st ? 28 : 22, lineHeight: 1 }}>
                      {item.medal}
                    </div>
                    <div
                      style={{
                        fontWeight: 800,
                        fontSize: is1st ? 14 : 12,
                        color: "var(--fg)",
                        marginTop: 2,
                        lineHeight: 1.2,
                        maxWidth: 120,
                      }}
                    >
                      {item.nome}
                    </div>
                    <div
                      style={{
                        fontFamily: "var(--ff-display)",
                        fontSize: is1st ? 22 : 17,
                        fontWeight: 900,
                        color: is1st ? "var(--secondary)" : "var(--fg-mid)",
                        marginTop: 2,
                        lineHeight: 1,
                      }}
                    >
                      {item.pontos}
                      <span
                        style={{
                          fontSize: 11,
                          fontFamily: "var(--ff-mono)",
                          fontWeight: 700,
                          color: "var(--fg-muted)",
                          marginLeft: 3,
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                        }}
                      >
                        pts
                      </span>
                    </div>
                  </div>
                </div>

                {/* Degrau */}
                <div
                  style={{
                    width: "100%",
                    height: alturaBloco,
                    background: is1st
                      ? "linear-gradient(160deg, color-mix(in srgb, var(--secondary) 30%, var(--bg-1)), color-mix(in srgb, var(--accent) 18%, var(--bg-1)))"
                      : "var(--bg-1)",
                    border: "1px solid var(--line)",
                    borderBottom: "none",
                    borderRadius: "var(--r-m) var(--r-m) 0 0",
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "center",
                    paddingTop: 12,
                    boxShadow: is1st
                      ? "0 -4px 20px color-mix(in srgb, var(--secondary) 14%, transparent)"
                      : "none",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--ff-mono)",
                      fontWeight: 900,
                      fontSize: is1st ? 28 : 20,
                      color: is1st ? "var(--secondary)" : "var(--fg-muted)",
                      opacity: 0.6,
                    }}
                  >
                    {item.posicao}
                  </span>
                </div>
              </a>
            );
          })}
        </div>

        {/* Base do pódio */}
        <div
          style={{
            maxWidth: 680,
            marginInline: "auto",
            height: 6,
            background: "var(--line)",
            borderRadius: "0 0 var(--r-m) var(--r-m)",
          }}
        />
      </div>
    </section>
  );
}
