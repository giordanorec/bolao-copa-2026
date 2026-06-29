"use client";

import { useState } from "react";
import IconeIA from "@/components/IconeIA";
import { marcaDe } from "@/lib/ias";

type Fase = "grupos" | "matamata" | "geral";

export type IAVitrine = {
  slug: string;
  nome: string;
  modelo: string;
  pontos: number;
  placares_exatos: number;
  jogos_palpitados: number;
  rank: number;
  ehFable: boolean;
};

export type SerieAVitrineLabels = {
  titulos: Record<Fase, string>;
  subs: Record<Fase, string>;
  chips: Record<Fase, string>;
  sufixoJogos: string;
  sufixoExatos: string;
};

export type SerieAVitrineProps = {
  variante: "compact" | "destaque";
  defaultFase: Fase;
  mostrarSeletor: boolean;
  iasPorFase: Record<Fase, IAVitrine[]>;
  labels: SerieAVitrineLabels;
};

export default function SerieAVitrine({
  variante,
  defaultFase,
  mostrarSeletor,
  iasPorFase,
  labels,
}: SerieAVitrineProps) {
  const [fase, setFase] = useState<Fase>(defaultFase);

  const ias = iasPorFase[fase];
  const titulo = labels.titulos[fase];
  const sub = labels.subs[fase];
  const wrapCls = variante === "destaque" ? "serie-a-grid destaque" : "serie-a-grid";
  const dim = variante === "destaque" ? 200 : 120;

  return (
    <section className="section serie-a-vitrine">
      <div className="container">
        <h2 style={{ textAlign: "center", marginBottom: 8 }}>{titulo}</h2>
        <p
          style={{
            textAlign: "center",
            color: "var(--fg-mid)",
            fontSize: 16,
            marginBottom: mostrarSeletor ? 20 : 36,
          }}
        >
          {sub}
        </p>

        {mostrarSeletor && (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: 8,
              marginBottom: 32,
            }}
          >
            {(["grupos", "matamata", "geral"] as Fase[]).map((f) => {
              const ativo = fase === f;
              return (
                <button
                  key={f}
                  onClick={() => setFase(f)}
                  style={{
                    padding: "6px 18px",
                    borderRadius: 9999,
                    border: ativo
                      ? "2px solid var(--primary)"
                      : "2px solid var(--line)",
                    background: ativo ? "var(--primary)" : "transparent",
                    color: ativo ? "#fff" : "var(--fg-mid)",
                    fontFamily: "var(--ff-mono)",
                    fontSize: 13,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    minWidth: 90,
                  }}
                >
                  {labels.chips[f]}
                </button>
              );
            })}
          </div>
        )}

        <div className={wrapCls}>
          {ias.map((ia) => {
            const marca = marcaDe(ia.slug);

            return (
              <a
                key={ia.slug}
                href={`/ia/${encodeURIComponent(ia.slug)}`}
                className={`ia-card${ia.ehFable ? " ia-card-fable" : ""}`}
              >
                <div className="ia-rank">{ia.rank}º</div>
                <div className="ia-mascote-wrap">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/mascots/${ia.slug}.png`}
                    alt={`Mascote ${ia.nome}`}
                    width={dim}
                    height={dim}
                    loading="lazy"
                  />
                  <div className="ia-marca-badge" title={marca.nome}>
                    <IconeIA slug={ia.slug} size={variante === "destaque" ? 40 : 28} />
                  </div>
                </div>
                <div className="ia-card-body">
                  <h3>{ia.nome}</h3>
                  {ia.modelo && (
                    <p className="ia-modelo">
                      <span
                        style={{
                          color: marca.cor,
                          fontWeight: 800,
                        }}
                      >
                        {marca.nome}
                      </span>
                      <span style={{ opacity: 0.5 }}> · </span>
                      {ia.modelo
                        .replace(`${marca.nome} `, "")
                        .replace(`${marca.nome}, `, "")}
                    </p>
                  )}
                  <div className="ia-pontos">
                    <strong>{ia.pontos}</strong>
                    <span>pts</span>
                  </div>
                  <small>
                    {ia.jogos_palpitados} {labels.sufixoJogos} ·{" "}
                    {ia.placares_exatos} {labels.sufixoExatos}
                  </small>
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
