"use client";

import { useState, useRef, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase-browser";
import type { Jogo } from "@/lib/types";
import type { DadosPorJogo, PalpiteIA, PaisIA } from "@/lib/palpites-ias";
import PrePreencherBar from "./PrePreencherBar";
import SugestaoIA from "./SugestaoIA";

type Estado = Record<number, { gols_a: number; gols_b: number }>;

export default function PalpitarForm({
  bolaoNome,
  bolaoSlug,
  jogos,
  palpitesIniciais,
  palpitesIAs,
  iasDict,
  paises,
}: {
  bolaoNome: string;
  bolaoSlug: string;
  jogos: Jogo[];
  palpitesIniciais: Estado;
  palpitesIAs: Record<string, DadosPorJogo>;
  iasDict: Record<string, string>;
  paises: Record<string, PaisIA>;
}) {
  const [palpites, setPalpites] = useState<Estado>(palpitesIniciais);
  const [salvando, setSalvando] = useState<Set<number>>(new Set());
  const timers = useRef<Record<number, NodeJS.Timeout>>({});

  const total = jogos.length;
  const preenchidos = Object.keys(palpites).length;
  const pct = Math.round((preenchidos / total) * 100);
  const algumSalvando = salvando.size > 0;

  const iasInfo = useMemo(() => {
    const contagem: Record<string, number> = {};
    Object.values(palpitesIAs).forEach((d) => {
      if (d.bola_de_cristal) {
        contagem["bola-de-cristal"] = (contagem["bola-de-cristal"] ?? 0) + 1;
      }
      Object.keys(d.palpites).forEach((slug) => {
        contagem[slug] = (contagem[slug] ?? 0) + 1;
      });
    });
    return Object.entries(contagem)
      .map(([slug, j]) => ({
        slug,
        nome:
          slug === "bola-de-cristal"
            ? "Bola de Cristal"
            : iasDict[slug] ?? slug,
        jogos: j,
      }))
      .filter((i) => i.jogos > 0);
  }, [palpitesIAs, iasDict]);

  function getPalpiteIA(
    slugIA: string,
    jogoNum: number,
  ): PalpiteIA | null {
    const dados = palpitesIAs[String(jogoNum)];
    if (!dados) return null;
    if (slugIA === "bola-de-cristal") {
      if (dados.bola_de_cristal) {
        return {
          gols_a: dados.bola_de_cristal.gols_a,
          gols_b: dados.bola_de_cristal.gols_b,
        };
      }
      return null;
    }
    return dados.palpites[slugIA] ?? null;
  }

  async function aplicarLote(slug: string, modo: "todos" | "vazios") {
    const novos: Estado = { ...palpites };
    const jogoNumeros: number[] = [];
    for (const j of jogos) {
      const ja = palpites[j.numero];
      if (modo === "vazios" && ja) continue;
      const p = getPalpiteIA(slug, j.numero);
      if (!p) continue;
      novos[j.numero] = { gols_a: p.gols_a, gols_b: p.gols_b };
      jogoNumeros.push(j.numero);
    }
    setPalpites(novos);
    setSalvando((s) => {
      const n = new Set(s);
      jogoNumeros.forEach((num) => n.add(num));
      return n;
    });
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const rows = jogoNumeros.map((num) => ({
      user_id: user.id,
      jogo_numero: num,
      gols_a: novos[num].gols_a,
      gols_b: novos[num].gols_b,
      atualizado_em: new Date().toISOString(),
    }));
    if (rows.length > 0) await supabase.from("palpite").upsert(rows);
    setSalvando((s) => {
      const n = new Set(s);
      jogoNumeros.forEach((num) => n.delete(num));
      return n;
    });
  }

  function aplicarSugestao(numero: number, gols_a: number, gols_b: number) {
    const novo = { gols_a, gols_b };
    setPalpites((p) => ({ ...p, [numero]: novo }));
    salvar(numero, novo);
  }

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
  }

  const porFase = jogos.reduce<Record<string, Jogo[]>>((acc, j) => {
    (acc[j.fase] ??= []).push(j);
    return acc;
  }, {});

  return (
    <div>
      {/* ── TOOLBAR sticky com Voltar + progresso + status salvo ── */}
      <div className="palp-toolbar">
        <div className="palp-toolbar-inner">
          <Link href={`/bolao/${bolaoSlug}`} className="palp-back">
            ← Bolão
          </Link>
          <div className="palp-info">
            <div className="bolao-nome">{bolaoNome}</div>
            <h1>🎯 Seus palpites</h1>
          </div>
          <span
            className={`palp-save-chip ${algumSalvando ? "salvando" : ""}`}
          >
            {algumSalvando ? "💾 salvando…" : "✓ tudo salvo"}
          </span>
        </div>
        <div className="palp-progress">
          <div className="palp-progress-bar">
            <div
              className="palp-progress-fill"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="palp-progress-text">
            {preenchidos}/{total} ({pct}%)
          </span>
        </div>
      </div>

      <p
        style={{
          color: "var(--fg-muted)",
          fontSize: 14,
          marginBottom: 20,
          textAlign: "center",
        }}
      >
        💡 Salva sozinho ao mudar. Use o botão de sugestão pra ver palpites
        das IAs em cada jogo.
      </p>

      <PrePreencherBar
        ias={iasInfo}
        totalJogos={jogos.length}
        onAplicar={aplicarLote}
      />

      {Object.entries(porFase).map(([fase, lista]) => (
        <div key={fase} className="fase-bloco">
          <h2 className="fase-titulo">{fase}</h2>
          {lista.map((j) => {
            const palp = palpites[j.numero];
            const dados = palpitesIAs[String(j.numero)] ?? null;
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
                <SugestaoIA
                  jogoNumero={j.numero}
                  timeA={j.time_a}
                  timeB={j.time_b}
                  dados={dados}
                  iasDict={iasDict}
                  paises={paises}
                  onPick={(a, b) => aplicarSugestao(j.numero, a, b)}
                />
              </div>
            );
          })}
        </div>
      ))}

      {/* ── FOOTER: resumo + ações ── */}
      <div className="palp-footer">
        <div className="resumo">
          {preenchidos === total ? (
            <>
              🏆 <strong>Tudo palpitado!</strong> Bora ver como você se sai.
            </>
          ) : (
            <>
              Falta palpitar{" "}
              <strong>
                {total - preenchidos}{" "}
                {total - preenchidos === 1 ? "jogo" : "jogos"}
              </strong>
              . Auto-salvo, pode fechar a aba quando quiser.
            </>
          )}
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link href={`/bolao/${bolaoSlug}`} className="btn">
            ← Voltar pro bolão
          </Link>
          <Link href={`/bolao/${bolaoSlug}#ranking`} className="btn primary">
            🏆 Ver ranking →
          </Link>
        </div>
      </div>
    </div>
  );
}
