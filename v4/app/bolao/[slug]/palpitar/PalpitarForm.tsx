"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase-browser";
import type { Jogo } from "@/lib/types";
import type { DadosPorJogo, PalpiteIA, PaisIA } from "@/lib/palpites-ias";
import PrePreencherBar from "./PrePreencherBar";
import SugestaoIA from "./SugestaoIA";
import Bandeira from "@/components/Bandeira";

type Estado = Record<number, { gols_a: number; gols_b: number }>;

export default function PalpitarForm({
  bolaoNome,
  bolaoSlug,
  jogos,
  palpitesIniciais,
  palpitesIAs,
  iasDict,
  paises,
  mapaPaises,
}: {
  bolaoNome: string;
  bolaoSlug: string;
  jogos: Jogo[];
  palpitesIniciais: Estado;
  palpitesIAs: Record<string, DadosPorJogo>;
  iasDict: Record<string, string>;
  paises: Record<string, PaisIA>;
  mapaPaises: Record<string, string>;
}) {
  const [palpites, setPalpites] = useState<Estado>(palpitesIniciais);
  const [salvando, setSalvando] = useState<Set<number>>(new Set());
  const [erroSalvar, setErroSalvar] = useState<string | null>(null);
  const timers = useRef<Record<number, NodeJS.Timeout>>({});
  const palpitesRef = useRef<Estado>(palpitesIniciais);
  useEffect(() => {
    palpitesRef.current = palpites;
  }, [palpites]);

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
    const novos: Estado = { ...palpitesRef.current };
    const jogoNumeros: number[] = [];
    for (const j of jogos) {
      const ja = palpitesRef.current[j.numero];
      if (modo === "vazios" && ja) continue;
      const p = getPalpiteIA(slug, j.numero);
      if (!p) continue;
      novos[j.numero] = { gols_a: p.gols_a, gols_b: p.gols_b };
      jogoNumeros.push(j.numero);
    }
    palpitesRef.current = novos;
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
    palpitesRef.current = { ...palpitesRef.current, [numero]: novo };
    setPalpites(palpitesRef.current);
    if (timers.current[numero]) clearTimeout(timers.current[numero]);
    salvar(numero, novo);
  }

  function atualizar(
    numero: number,
    campo: "gols_a" | "gols_b",
    valor: number,
  ) {
    const atual = palpitesRef.current[numero] ?? { gols_a: 0, gols_b: 0 };
    const novo = { ...atual, [campo]: valor };
    palpitesRef.current = { ...palpitesRef.current, [numero]: novo };
    setPalpites(palpitesRef.current);
    if (timers.current[numero]) clearTimeout(timers.current[numero]);
    timers.current[numero] = setTimeout(() => {
      const final = palpitesRef.current[numero] ?? novo;
      salvar(numero, final);
    }, 600);
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
    if (!user) {
      setErroSalvar("Você precisa estar logado.");
      setSalvando((s) => {
        const n = new Set(s);
        n.delete(numero);
        return n;
      });
      return;
    }
    const { error } = await supabase.from("palpite").upsert(
      {
        user_id: user.id,
        jogo_numero: numero,
        gols_a: valor.gols_a,
        gols_b: valor.gols_b,
        atualizado_em: new Date().toISOString(),
      },
      { onConflict: "user_id,jogo_numero" },
    );
    if (error) {
      console.error("[palpite upsert]", error);
      setErroSalvar(`Erro ao salvar jogo #${numero}: ${error.message}`);
    } else {
      setErroSalvar(null);
    }
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
            className={`palp-save-chip ${algumSalvando ? "salvando" : ""} ${erroSalvar ? "erro" : ""}`}
            title={erroSalvar ?? undefined}
          >
            {erroSalvar
              ? "⚠ erro"
              : algumSalvando
                ? "💾 salvando…"
                : "✓ tudo salvo"}
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
        {erroSalvar && (
          <div className="palp-erro-banner" role="alert">
            ⚠ {erroSalvar}
            <button
              onClick={() => setErroSalvar(null)}
              style={{
                marginLeft: 12,
                background: "transparent",
                border: "none",
                color: "inherit",
                cursor: "pointer",
                fontSize: 16,
              }}
              aria-label="Fechar"
            >
              ✕
            </button>
          </div>
        )}
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
            const isoA = mapaPaises[j.time_a];
            const isoB = mapaPaises[j.time_b];
            return (
              <div key={j.numero} className="jogo-linha">
                <div className="jogo-meta">
                  <span className="jogo-num">#{j.numero}</span>
                  <span className="jogo-data">
                    {j.data} {j.hora}
                  </span>
                  {j.local && (
                    <span className="jogo-local" title={j.local}>
                      📍 {j.local}
                    </span>
                  )}
                </div>
                <div className="jogo-linha-times">
                  <div className="jogo-time-bloco esq">
                    <Bandeira iso={isoA} nome={j.time_a} size={28} />
                    <span className="jogo-time esq">{j.time_a}</span>
                  </div>
                  <div className="jogo-placar">
                    <InputGol
                      valor={palp?.gols_a}
                      onChange={(v) => atualizar(j.numero, "gols_a", v)}
                    />
                    <span className="jogo-x">×</span>
                    <InputGol
                      valor={palp?.gols_b}
                      onChange={(v) => atualizar(j.numero, "gols_b", v)}
                    />
                  </div>
                  <div className="jogo-time-bloco dir">
                    <span className="jogo-time dir">{j.time_b}</span>
                    <Bandeira iso={isoB} nome={j.time_b} size={28} />
                  </div>
                </div>
                <SugestaoIA
                  jogoNumero={j.numero}
                  timeA={j.time_a}
                  timeB={j.time_b}
                  isoA={isoA}
                  isoB={isoB}
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

/* Input de gol que evita leading zero ("01" -> "1") e aceita só inteiros 0-20 */
function InputGol({
  valor,
  onChange,
}: {
  valor: number | undefined;
  onChange: (v: number) => void;
}) {
  const display = valor !== undefined && valor !== null ? String(valor) : "";
  return (
    <input
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      maxLength={2}
      className="jogo-input"
      value={display}
      placeholder="-"
      onChange={(e) => {
        const raw = e.target.value.replace(/\D/g, "");
        if (raw === "") {
          onChange(0);
          return;
        }
        const n = parseInt(raw, 10);
        if (isNaN(n)) return;
        if (n > 20) return;
        onChange(n);
      }}
      onFocus={(e) => e.target.select()}
    />
  );
}
