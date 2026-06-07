"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase-browser";
import type { Jogo } from "@/lib/types";

type Estado = Record<number, { gols_a: number; gols_b: number }>;

export default function PalpitarForm({
  jogos,
  palpitesIniciais,
}: {
  jogos: Jogo[];
  palpitesIniciais: Estado;
}) {
  const [palpites, setPalpites] = useState<Estado>(palpitesIniciais);
  const [salvando, setSalvando] = useState<Set<number>>(new Set());
  const [salvos, setSalvos] = useState<Set<number>>(new Set());
  const timers = useRef<Record<number, NodeJS.Timeout>>({});

  function atualizar(
    numero: number,
    campo: "gols_a" | "gols_b",
    valor: number,
  ) {
    const atual = palpites[numero] ?? { gols_a: 0, gols_b: 0 };
    const novo = { ...atual, [campo]: valor };
    setPalpites((p) => ({ ...p, [numero]: novo }));

    if (timers.current[numero]) clearTimeout(timers.current[numero]);
    timers.current[numero] = setTimeout(() => salvar(numero, novo), 600);
  }

  async function salvar(
    numero: number,
    valor: { gols_a: number; gols_b: number },
  ) {
    setSalvando((s) => new Set(s).add(numero));
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("palpite").upsert({
      user_id: user.id,
      jogo_numero: numero,
      gols_a: valor.gols_a,
      gols_b: valor.gols_b,
      atualizado_em: new Date().toISOString(),
    });
    setSalvando((s) => {
      const n = new Set(s);
      n.delete(numero);
      return n;
    });
    setSalvos((s) => new Set(s).add(numero));
    setTimeout(() => {
      setSalvos((s) => {
        const n = new Set(s);
        n.delete(numero);
        return n;
      });
    }, 1500);
  }

  const porFase = jogos.reduce<Record<string, Jogo[]>>((acc, j) => {
    (acc[j.fase] ??= []).push(j);
    return acc;
  }, {});

  return (
    <div>
      {Object.entries(porFase).map(([fase, lista]) => (
        <div key={fase} className="fase-bloco">
          <h2 className="fase-titulo">{fase}</h2>
          {lista.map((j) => {
            const palp = palpites[j.numero];
            return (
              <div key={j.numero} className="jogo-linha">
                <span className="jogo-num">#{j.numero}</span>
                <span className="jogo-data">
                  {j.data} {j.hora}
                </span>
                <span className="jogo-time esq">{j.time_a}</span>
                <input
                  type="number"
                  min={0}
                  max={20}
                  className="jogo-input"
                  value={palp?.gols_a ?? ""}
                  placeholder="-"
                  onChange={(e) =>
                    atualizar(j.numero, "gols_a", Number(e.target.value))
                  }
                />
                <span className="jogo-x">×</span>
                <input
                  type="number"
                  min={0}
                  max={20}
                  className="jogo-input"
                  value={palp?.gols_b ?? ""}
                  placeholder="-"
                  onChange={(e) =>
                    atualizar(j.numero, "gols_b", Number(e.target.value))
                  }
                />
                <span className="jogo-time dir">{j.time_b}</span>
                <span className="jogo-status">
                  {salvando.has(j.numero) && "…"}
                  {salvos.has(j.numero) && "✓"}
                </span>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
