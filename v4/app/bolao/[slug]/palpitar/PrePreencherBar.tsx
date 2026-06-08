"use client";

import { useState, useMemo } from "react";
import SelectIA, { type OpcaoIA } from "@/components/SelectIA";

type IA = { slug: string; nome: string; jogos: number };

export default function PrePreencherBar({
  ias,
  totalJogos,
  onAplicar,
}: {
  ias: IA[];
  totalJogos: number;
  onAplicar: (slug: string, modo: "todos" | "vazios") => void;
}) {
  const [escolhido, setEscolhido] = useState<string>("bola-de-cristal");
  const [aberto, setAberto] = useState(false);

  const iasOrdenadas = useMemo(
    () =>
      [...ias].sort((a, b) => {
        // Bola de Cristal sempre primeiro
        if (a.slug === "bola-de-cristal") return -1;
        if (b.slug === "bola-de-cristal") return 1;
        // Depois IAs com mais palpites
        return b.jogos - a.jogos;
      }),
    [ias],
  );

  const escolhida = iasOrdenadas.find((i) => i.slug === escolhido);

  return (
    <div
      className="card"
      style={{
        marginBottom: 24,
        background:
          "linear-gradient(135deg, rgba(255,206,0,0.10), rgba(0,166,153,0.10))",
        border: "2px dashed var(--line-strong)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
          marginBottom: aberto ? 16 : 0,
        }}
      >
        <span style={{ fontSize: 22 }}>🤖</span>
        <div style={{ flex: 1, minWidth: 200 }}>
          <strong>Aproveitar palpites das IAs</strong>
          <p
            style={{
              fontSize: 13,
              color: "var(--fg-muted)",
              marginTop: 2,
            }}
          >
            Copia em lote os palpites de uma IA ou da Bola de Cristal.
          </p>
        </div>
        <button
          onClick={() => setAberto((a) => !a)}
          className="btn small"
        >
          {aberto ? "Fechar" : "🤖 Palpites das IAs"}
        </button>
      </div>

      {aberto && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
            paddingTop: 16,
            borderTop: "1px solid var(--line)",
          }}
        >
          <label className="label">De quem importar:</label>
          <SelectIA
            opcoes={iasOrdenadas.map(
              (i): OpcaoIA => ({
                slug: i.slug,
                nome: i.nome,
                extra: `${i.jogos}/${totalJogos}`,
              }),
            )}
            valor={escolhido}
            onChange={(v) => setEscolhido(v)}
          />

          <div
            style={{
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
              marginTop: 4,
            }}
          >
            <button
              onClick={() => {
                if (
                  confirm(
                    `Substituir TODOS os ${totalJogos} palpites pelos de ${escolhida?.nome}?`,
                  )
                ) {
                  onAplicar(escolhido, "todos");
                  setAberto(false);
                }
              }}
              className="btn primary small"
              style={{ flex: 1 }}
            >
              ⚡ Substituir todos
            </button>
            <button
              onClick={() => {
                onAplicar(escolhido, "vazios");
                setAberto(false);
              }}
              className="btn small"
              style={{ flex: 1 }}
            >
              🎯 Preencher só vazios
            </button>
          </div>
          <p
            style={{
              fontSize: 12,
              color: "var(--fg-muted)",
              textAlign: "center",
              marginTop: 4,
            }}
          >
            Você pode editar manualmente depois de importar.
          </p>
        </div>
      )}
    </div>
  );
}
