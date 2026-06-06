"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase-browser";
import { Check, Loader2 } from "lucide-react";
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

  function atualizar(numero: number, campo: "gols_a" | "gols_b", valor: number) {
    const atual = palpites[numero] ?? { gols_a: 0, gols_b: 0 };
    const novo = { ...atual, [campo]: valor };
    setPalpites((p) => ({ ...p, [numero]: novo }));

    if (timers.current[numero]) clearTimeout(timers.current[numero]);
    timers.current[numero] = setTimeout(() => salvar(numero, novo), 600);
  }

  async function salvar(numero: number, valor: { gols_a: number; gols_b: number }) {
    setSalvando((s) => new Set(s).add(numero));
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("palpite").upsert({
      user_id: user.id,
      jogo_numero: numero,
      gols_a: valor.gols_a,
      gols_b: valor.gols_b,
      atualizado_em: new Date().toISOString(),
    });
    setSalvando((s) => {
      const n = new Set(s); n.delete(numero); return n;
    });
    setSalvos((s) => new Set(s).add(numero));
    setTimeout(() => {
      setSalvos((s) => { const n = new Set(s); n.delete(numero); return n; });
    }, 1500);
  }

  const porFase = jogos.reduce<Record<string, Jogo[]>>((acc, j) => {
    (acc[j.fase] ??= []).push(j);
    return acc;
  }, {});

  return (
    <div className="space-y-8">
      {Object.entries(porFase).map(([fase, lista]) => (
        <div key={fase}>
          <h2 className="text-xl mb-3 font-mono text-[--color-muted] uppercase tracking-wider text-sm">
            {fase}
          </h2>
          <div className="grid gap-2">
            {lista.map((j) => {
              const palp = palpites[j.numero];
              return (
                <div key={j.numero}
                  className="card flex items-center gap-3 py-3 px-4 flex-wrap">
                  <span className="font-mono text-xs text-[--color-muted] w-8">#{j.numero}</span>
                  <span className="text-xs text-[--color-muted] w-24 hidden md:inline">{j.data} {j.hora}</span>
                  <span className="flex-1 text-right font-semibold truncate">{j.time_a}</span>
                  <input type="number" min={0} max={20}
                    className="input w-16 text-center px-2 py-2"
                    value={palp?.gols_a ?? ""}
                    placeholder="-"
                    onChange={(e) => atualizar(j.numero, "gols_a", Number(e.target.value))} />
                  <span className="text-[--color-muted]">×</span>
                  <input type="number" min={0} max={20}
                    className="input w-16 text-center px-2 py-2"
                    value={palp?.gols_b ?? ""}
                    placeholder="-"
                    onChange={(e) => atualizar(j.numero, "gols_b", Number(e.target.value))} />
                  <span className="flex-1 font-semibold truncate">{j.time_b}</span>
                  <span className="w-6 grid place-items-center">
                    {salvando.has(j.numero) && <Loader2 size={16} className="animate-spin text-[--color-muted]" />}
                    {salvos.has(j.numero) && <Check size={16} className="text-[--color-primary]" />}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
