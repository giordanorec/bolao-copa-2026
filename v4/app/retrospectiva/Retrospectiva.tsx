"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import type { Locale } from "@/lib/i18n";
import type { TodasFases } from "@/lib/corrida-frames";
import CorridaComSelector from "@/app/corrida-das-ias/CorridaComSelector";
import PageVisitTracker from "./PageVisitTracker";
import { tr } from "./dict";
import type { RetrospectivaData, Upset } from "./types";

const flag = (iso?: string) =>
  iso ? `https://hatscripts.github.io/circle-flags/flags/${iso}.svg` : undefined;

/* ───────────────────────── hooks ───────────────────────── */

function useCountUp(to: number, run: boolean, ms = 1400) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!run) return;
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / ms);
      const eased = 1 - Math.pow(1 - p, 3);
      setV(Math.round(to * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, run, ms]);
  return v;
}

function Num({ to, run, suffix = "" }: { to: number; run: boolean; suffix?: string }) {
  const v = useCountUp(to, run);
  return (
    <>
      {v.toLocaleString("pt-BR")}
      {suffix}
    </>
  );
}

function useReveal() {
  const ref = useRef<HTMLElement>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setSeen(true);
      },
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return { ref, seen };
}

/* ───────────────────────── componente raiz ───────────────────────── */

export default function Retrospectiva({
  locale,
  data,
  corrida,
}: {
  locale: Locale;
  data: RetrospectivaData;
  corrida: TodasFases;
}) {
  const T = tr(locale);
  const [progress, setProgress] = useState(0);
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.body.classList.add("retro-takeover");
    return () => document.body.classList.remove("retro-takeover");
  }, []);

  const onScroll = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const max = el.scrollHeight - el.clientHeight;
    setProgress(max > 0 ? el.scrollTop / max : 0);
  }, []);

  return (
    <div className="retro-root" ref={scrollerRef} onScroll={onScroll}>
      <PageVisitTracker />
      <div className="retro-bar" style={{ transform: `scaleX(${progress})` }} />

      <CenaCapa T={T} data={data} />
      <CenaExperimento T={T} />
      <CenaGrupos T={T} data={data} />
      <CenaZebras T={T} data={data} />
      <CenaCravadas T={T} data={data} />
      <CenaHumanos T={T} data={data} />
      <CenaCorrida T={T} corrida={corrida} />
      <CenaPodio T={T} data={data} />
      <CenaFinal T={T} data={data} />
      <CenaFim T={T} locale={locale} />

      <style>{CSS}</style>
    </div>
  );
}

/* ───────────────────────── 1. CAPA ───────────────────────── */

function CenaCapa({ T, data }: { T: ReturnType<typeof tr>; data: RetrospectivaData }) {
  const { ref, seen } = useReveal();
  const stats = [
    { n: data.overview.dias, label: T.statDias },
    { n: data.overview.totalJogos, label: T.statJogos },
    { n: data.overview.totalIas, label: T.statIas },
    { n: data.overview.totalPalpites, label: T.statPalpites },
  ];
  return (
    <section ref={ref} className={`cena capa ${seen ? "in" : ""}`}>
      <div className="cena-bg">
        <div className="capa-orb o1" />
        <div className="capa-orb o2" />
        <div className="capa-orb o3" />
        <div className="capa-grid" />
      </div>
      <div className="capa-inner">
        <span className="kicker">{T.capaKicker}</span>
        <h1 className="capa-titulo">
          {T.capaTitulo1}
          <br />
          <span className="grad">{T.capaTitulo2}</span>
        </h1>
        <div className="capa-stats">
          {stats.map((st, i) => (
            <div key={i} className="capa-stat" style={{ ["--d" as string]: `${0.5 + i * 0.12}s` }}>
              <span className="capa-stat-n">
                <Num to={st.n} run={seen} />
              </span>
              <span className="capa-stat-l">{st.label}</span>
            </div>
          ))}
        </div>
        <div className="scroll-hint">
          <span>{T.scrollHint}</span>
          <span className="chev">⌄</span>
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────── 2. O EXPERIMENTO ───────────────────────── */

function CenaExperimento({ T }: { T: ReturnType<typeof tr> }) {
  const { ref, seen } = useReveal();
  const cards = [
    { emoji: "🔌", t: T.expApiTitulo, d: T.expApiDesc },
    { emoji: "🌐", t: T.expWebTitulo, d: T.expWebDesc },
    { emoji: "🧑", t: T.expHumTitulo, d: T.expHumDesc },
  ];
  return (
    <section ref={ref} className={`cena experimento ${seen ? "in" : ""}`}>
      <span className="kicker">{T.expKicker}</span>
      <h2 className="cena-h2 tight">{T.expTitulo}</h2>
      <div className="exp-grid">
        {cards.map((c, i) => (
          <div key={i} className="exp-card" style={{ ["--d" as string]: `${i * 0.14}s` }}>
            <div className="exp-emoji">{c.emoji}</div>
            <h3>{c.t}</h3>
            <p>{c.d}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ───────────────────────── 3. FASE DE GRUPOS ───────────────────────── */

function MiniConfronto({ u, T }: { u: Upset; T: ReturnType<typeof tr> }) {
  return (
    <div className="mc">
      <div className="mc-times">
        <Time iso={u.isoA} nome={u.timeA} size={28} />
        <span className="mc-real">
          {u.golsA}×{u.golsB}
        </span>
        <Time iso={u.isoB} nome={u.timeB} size={28} flip />
      </div>
      <div className="mc-pred">
        {T.consensoAbrev}: {u.cristalA}×{u.cristalB} · {u.votos} {T.votos}
      </div>
    </div>
  );
}

function CenaGrupos({ T, data }: { T: ReturnType<typeof tr>; data: RetrospectivaData }) {
  const { ref, seen } = useReveal();
  const g = data.grupos;
  return (
    <section ref={ref} className={`cena grupos ${seen ? "in" : ""}`}>
      <span className="kicker">{T.gruposKicker}</span>
      <h2 className="cena-h2 tight">{T.gruposTitulo}</h2>
      <div className="escala-grid">
        <div className="escala-card">
          <div className="escala-num" style={{ color: "var(--primary-2)" }}>
            <Num to={g.totalJogos} run={seen} />
          </div>
          <div className="escala-label">{T.gruposJogos}</div>
        </div>
        <div className="escala-card">
          <div className="escala-num" style={{ color: "var(--accent)" }}>
            <Num to={g.totalGols} run={seen} />
          </div>
          <div className="escala-label">{T.gruposGols}</div>
        </div>
        <div className="escala-card">
          <div className="escala-num" style={{ color: "var(--extra)" }}>
            {g.mediaGolsJogo}
          </div>
          <div className="escala-label">{T.gruposMedia}</div>
        </div>
      </div>
      <p className="escala-foot">{T.gruposFoot}</p>
      <div className="grupos-duo">
        {g.jogoMaisPrevisivel && (
          <div className="grupos-card">
            <span className="grupos-card-label bom">✅ {T.gruposPrevisivelLabel}</span>
            <MiniConfronto u={g.jogoMaisPrevisivel} T={T} />
          </div>
        )}
        {g.zebraDestaque && (
          <div className="grupos-card">
            <span className="grupos-card-label ruim">🦓 {T.gruposZebraLabel}</span>
            <MiniConfronto u={g.zebraDestaque} T={T} />
          </div>
        )}
      </div>
    </section>
  );
}

/* ───────────────────────── 4. AS ZEBRAS ───────────────────────── */

function Time({
  iso,
  nome,
  size = 40,
  flip = false,
}: {
  iso?: string;
  nome: string;
  size?: number;
  flip?: boolean;
}) {
  const src = flag(iso);
  return (
    <div className={`time ${flip ? "flip" : ""}`}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={nome} width={size} height={size} className="time-flag" />
      ) : (
        <span className="time-flag ph" style={{ width: size, height: size }}>
          🏳️
        </span>
      )}
      <span className="time-nome">{nome}</span>
    </div>
  );
}

function CenaZebras({ T, data }: { T: ReturnType<typeof tr>; data: RetrospectivaData }) {
  const { ref, seen } = useReveal();
  const { ref: refBr, seen: seenBr } = useReveal();
  const { ref: refSemi, seen: seenSemi } = useReveal();
  const { ref: refTerc, seen: seenTerc } = useReveal();
  const { ref: refGrid, seen: seenGrid } = useReveal();
  const z = data.zebras;

  return (
    <>
      <section ref={ref} className={`cena zebras-intro ${seen ? "in" : ""}`}>
        <div className="zebra-emoji">🦓</div>
        <span className="kicker light">{T.zebrasKicker}</span>
        <h2 className="cena-h2 invert">{T.zebrasTitulo}</h2>
      </section>

      {z.brasil && (
        <section ref={refBr} className={`cena zebra-spot brasil ${seenBr ? "in" : ""}`}>
          <span className="kicker light">{T.brasilKicker}</span>
          <p className="zs-cristal">
            {T.brasilCristalDizia} <strong>{z.brasil.consensoCampeao} 🏆</strong>
          </p>
          <div className="zs-match">
            <Time iso={z.brasil.isoA} nome={z.brasil.timeA} size={72} />
            <div className="zs-placar sad">
              {z.brasil.golsA}
              <span className="zs-x">×</span>
              {z.brasil.golsB}
            </div>
            <Time iso={z.brasil.isoB} nome={z.brasil.timeB} size={72} flip />
          </div>
          <p className="zs-cap">{T.brasilTexto}</p>
        </section>
      )}

      {z.semifinalEspanha && (
        <section ref={refSemi} className={`cena zebra-spot espanha ${seenSemi ? "in" : ""}`}>
          <span className="kicker light">{T.semiKicker}</span>
          <h2 className="cena-h2 invert tight">{T.semiTitulo}</h2>
          <div className="zs-match">
            <Time iso={z.semifinalEspanha.isoA} nome={z.semifinalEspanha.timeA} size={72} />
            <div className="zs-placar">
              {z.semifinalEspanha.golsA}
              <span className="zs-x">×</span>
              {z.semifinalEspanha.golsB}
            </div>
            <Time iso={z.semifinalEspanha.isoB} nome={z.semifinalEspanha.timeB} size={72} flip />
          </div>
          <div className="zs-big">
            <Num to={z.semifinalEspanha.previramVitoriaB} run={seenSemi} />
            <span className="zs-big-sep">/</span>
            <Num to={z.semifinalEspanha.totalIas} run={seenSemi} />
          </div>
          <p className="zs-cap">{T.semiTexto(z.semifinalEspanha.previramVitoriaB, z.semifinalEspanha.totalIas)}</p>
        </section>
      )}

      {z.terceiroLugar && (
        <section ref={refTerc} className={`cena zebra-spot terceiro ${seenTerc ? "in" : ""}`}>
          <span className="kicker light">{T.terceiroKicker}</span>
          <h2 className="cena-h2 invert tight">{T.terceiroTitulo}</h2>
          <div className="zs-match">
            <Time iso={z.terceiroLugar.isoA} nome={z.terceiroLugar.timeA} size={72} />
            <div className="zs-placar gol">
              {z.terceiroLugar.golsA}
              <span className="zs-x">×</span>
              {z.terceiroLugar.golsB}
            </div>
            <Time iso={z.terceiroLugar.isoB} nome={z.terceiroLugar.timeB} size={72} flip />
          </div>
          <p className="zs-cap">
            {T.terceiroTexto(z.terceiroLugar.previramVitoriaB, z.terceiroLugar.totalIas, z.terceiroLugar.totalGols)}
          </p>
        </section>
      )}

      <section ref={refGrid} className={`cena zebras-grid-cena ${seenGrid ? "in" : ""}`}>
        <h2 className="cena-h2 tight">{T.maisZebrasTitulo}</h2>
        <div className="zebras-grid">
          {z.lista.slice(0, 6).map((u, i) => (
            <div key={u.numero} className="zebra-card" style={{ ["--d" as string]: `${i * 0.06}s` }}>
              <MiniConfronto u={u} T={T} />
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

/* ───────────────────────── 5. AS CRAVADAS ───────────────────────── */

function CenaCravadas({ T, data }: { T: ReturnType<typeof tr>; data: RetrospectivaData }) {
  const { ref, seen } = useReveal();
  const c = data.cravadas;
  return (
    <section ref={ref} className={`cena cravadas ${seen ? "in" : ""}`}>
      <span className="kicker">{T.cravadasKicker}</span>
      <h2 className="cena-h2 tight">{T.cravadasTitulo}</h2>
      <p className="cravadas-sub">{T.cravadasSub}</p>
      <div className="cravadas-list">
        {c.lideres.map((l, i) => (
          <div key={l.slug} className="cravada-row" style={{ ["--d" as string]: `${i * 0.08}s` }}>
            <span className="cr-rank">#{i + 1}</span>
            <span className="cr-nome">{l.nome}</span>
            <span className="cr-bar-wrap">
              <span
                className="cr-bar"
                style={{ width: `${Math.min(100, (l.exatos / (c.lideres[0]?.exatos || 1)) * 100)}%` }}
              />
            </span>
            <span className="cr-num">
              <Num to={l.exatos} run={seen} /> <small>{T.cravadasLabel}</small>
            </span>
          </div>
        ))}
      </div>
      {c.maisImpressionante && (
        <div className="impressionante">
          <span className="kicker light">{T.impressionanteKicker}</span>
          <div className="zs-match small">
            <Time iso={c.maisImpressionante.isoA} nome={c.maisImpressionante.timeA} size={44} />
            <div className="zs-placar small">
              {c.maisImpressionante.golsA}
              <span className="zs-x">×</span>
              {c.maisImpressionante.golsB}
            </div>
            <Time iso={c.maisImpressionante.isoB} nome={c.maisImpressionante.timeB} size={44} flip />
          </div>
          <p className="zs-cap small">
            {T.impressionanteTexto(c.maisImpressionante.quemCravou, data.overview.totalIas)}
          </p>
        </div>
      )}
    </section>
  );
}

/* ───────────────────────── 6. HUMANOS × MÁQUINAS ───────────────────────── */

function CenaHumanos({ T, data }: { T: ReturnType<typeof tr>; data: RetrospectivaData }) {
  const { ref, seen } = useReveal();
  const g = data.humanos.gabriel;
  const robos = Array.from({ length: 35 });
  const humanIndex = 17;
  return (
    <section ref={ref} className={`cena humanos ${seen ? "in" : ""}`}>
      <span className="kicker light">{T.humanosKicker}</span>
      <h2 className="cena-h2 invert tight">{T.humanosTitulo}</h2>
      <div className="hum-swarm">
        {robos.map((_, i) => (
          <span
            key={i}
            className={`hum-cell ${i === humanIndex ? "human" : ""}`}
            style={{ ["--i" as string]: i }}
          >
            {i === humanIndex ? "🧑" : "🤖"}
          </span>
        ))}
      </div>
      <div className="hum-name">{g.nome ?? T.humanosNome}</div>
      <div className="hum-stats">
        <div>
          <span className="hs-num">
            <Num to={g.pontos} run={seen} />
          </span>
          <span className="hs-lbl">{T.humanosPontos}</span>
        </div>
        <div>
          <span className="hs-num">
            <Num to={g.exatos} run={seen} />
          </span>
          <span className="hs-lbl">{T.humanosExatos}</span>
        </div>
        <div>
          <span className="hs-num accent">
            <Num to={g.iasAtras} run={seen} />
          </span>
          <span className="hs-lbl">IAs</span>
        </div>
      </div>
      <p className="hum-sub">{T.humanosSub(g.iasAtras, g.totalIas)}</p>
      <p className="hum-caption">{T.humanosCaption}</p>
    </section>
  );
}

/* ───────────────────────── 7. A CORRIDA ───────────────────────── */

function CenaCorrida({ T, corrida }: { T: ReturnType<typeof tr>; corrida: TodasFases }) {
  const { ref, seen } = useReveal();
  return (
    <section ref={ref} className={`cena corrida-cena ${seen ? "in" : ""}`}>
      <span className="kicker">{T.corridaKicker}</span>
      <h2 className="cena-h2 tight">{T.corridaTitulo}</h2>
      <p className="corrida-sub">{T.corridaSub}</p>
      <div className="corrida-embed">
        <CorridaComSelector grupos={corrida.grupos} matamata={corrida.matamata} geral={corrida.geral} faseInicial="geral" />
      </div>
    </section>
  );
}

/* ───────────────────────── 8. O PÓDIO FINAL ───────────────────────── */

function CenaPodio({ T, data }: { T: ReturnType<typeof tr>; data: RetrospectivaData }) {
  const { ref, seen } = useReveal();
  const co = data.campeoes;
  const geral = co.geralPodio.filter((p) => p.posicao === 1);
  const bronzeGeral = co.geralPodio.find((p) => p.posicao === 3);
  const serieA = co.serieA;
  const visualSerieA = serieA.length >= 3 ? [serieA[1], serieA[0], serieA[2]] : serieA;
  const alturasSerieA = [58, 96, 44];
  const medalsSerieA = ["🥈", "🥇", "🥉"];

  return (
    <section ref={ref} className={`cena podio-final ${seen ? "in" : ""}`}>
      {seen && (
        <div className="confetti-wrap" aria-hidden>
          {Array.from({ length: 26 }).map((_, i) => (
            <span key={i} className={`confetti c${i % 6}`} style={{ ["--i" as string]: i }} />
          ))}
        </div>
      )}
      <span className="kicker">{T.podioKicker}</span>
      <h2 className="cena-h2 tight">{T.podioTitulo}</h2>

      {/* Geral — empate no topo */}
      <div className="podio-bloco">
        <span className="podio-bloco-label">{T.podioGeralLabel}</span>
        <div className="empate-wrap">
          {geral.map((c) => (
            <div key={c.slug} className="empate-card">
              <div className="empate-coroa">👑</div>
              <div className="empate-nome">{c.nome}</div>
              <div className="empate-pts">
                <Num to={c.pontos} run={seen} /> <small>{T.pts}</small>
              </div>
              <div className="empate-exatos">
                {c.exatos} {T.exatosAbrev}
              </div>
            </div>
          ))}
        </div>
        <p className="podio-bloco-sub">{T.podioGeralSub}</p>
        {bronzeGeral && (
          <div className="terceiro-chip">
            🥉 {bronzeGeral.nome} — {bronzeGeral.pontos} {T.pts}
          </div>
        )}
      </div>

      {/* Série A — pódio clássico */}
      {visualSerieA.length >= 3 && (
        <div className="podio-bloco">
          <span className="podio-bloco-label">{T.podioSerieALabel}</span>
          <p className="podio-bloco-sub">{T.podioSerieASub}</p>
          <div className="podio-wrap">
            {visualSerieA.map((it, i) => {
              const is1 = it.posicao === 1;
              return (
                <div key={it.slug} className={`podio-col p${it.posicao}`} style={{ ["--d" as string]: `${i * 0.15}s` }}>
                  {is1 && <div className="podio-coroa">👑</div>}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    className="podio-masc"
                    src={`/mascots/${it.slug}.png`}
                    alt={it.nome}
                    width={is1 ? 130 : 92}
                    height={is1 ? 130 : 92}
                    loading="lazy"
                  />
                  <div className="podio-step" style={{ height: alturasSerieA[i] }}>
                    <span className="podio-medal">{medalsSerieA[i]}</span>
                    <span className="podio-nome">{it.nome}</span>
                    <span className="podio-pts">
                      <Num to={it.pontos} run={seen} /> <small>{T.pts}</small>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Humano */}
      <div className="podio-bloco">
        <span className="podio-bloco-label">{T.podioHumanoLabel}</span>
        <div className="humano-card">
          <div className="humano-emoji">🧑‍🚀</div>
          <div className="humano-nome">{co.humano.nome}</div>
          <div className="humano-pts">
            <Num to={co.humano.pontos} run={seen} /> {T.pts}
          </div>
        </div>
        <p className="podio-bloco-sub">{T.podioHumanoSub}</p>
      </div>
    </section>
  );
}

/* ───────────────────────── 9. A FINAL ───────────────────────── */

function CenaFinal({ T, data }: { T: ReturnType<typeof tr>; data: RetrospectivaData }) {
  const { ref, seen } = useReveal();
  const f = data.final;
  if (!f) return null;
  const outros = Math.max(0, f.cravaramTotal - f.destaques.length);
  return (
    <section ref={ref} className={`cena final-jogo ${seen ? "in" : ""}`}>
      <span className="kicker light">{T.finalKicker}</span>
      <h2 className="cena-h2 invert tight">{T.finalTitulo}</h2>
      <div className="zs-match">
        <Time iso={f.isoA} nome={f.timeA} size={80} />
        <div className="zs-placar">
          {f.golsA}
          <span className="zs-x">×</span>
          {f.golsB}
        </div>
        <Time iso={f.isoB} nome={f.timeB} size={80} flip />
      </div>
      <p className="zs-cap">{T.finalConsensoTexto}</p>
      <div className="final-cravaram">
        <h3>{T.finalCravaramTitulo(f.cravaramTotal)}</h3>
        <div className="final-chips">
          {f.destaques.map((d) => (
            <span key={d.slug} className="final-chip">
              {d.nome}
            </span>
          ))}
          {outros > 0 && <span className="final-chip ghost">{T.finalMaisOutras(outros)}</span>}
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────── 10. ENCERRAMENTO ───────────────────────── */

function CenaFim({ T, locale }: { T: ReturnType<typeof tr>; locale: Locale }) {
  const { ref, seen } = useReveal();
  const share = async () => {
    const url = "https://bolao.arenadasias.com.br/retrospectiva";
    const txt = `${T.capaTitulo1} ${T.capaTitulo2} — Bolão das IAs, Copa 2026 🤖⚽`;
    if (navigator.share) {
      try {
        await navigator.share({ title: T.capaTitulo1, text: txt, url });
        return;
      } catch {
        /* cancelado */
      }
    }
    try {
      await navigator.clipboard.writeText(`${txt} ${url}`);
      alert(T.shareCopied);
    } catch {
      /* noop */
    }
  };
  const hrefLang = locale === "pt" ? "" : `?lang=${locale}`;
  return (
    <section ref={ref} className={`cena fim ${seen ? "in" : ""}`}>
      <div className="cena-bg">
        <div className="capa-orb o1" />
        <div className="capa-orb o2" />
      </div>
      <div className="final-inner">
        <div className="final-emoji">🏆</div>
        <h2 className="final-titulo">
          {T.fimKicker} {T.fimTitulo1}
          <br />
          <span className="grad">{T.fimTitulo2}</span>
        </h2>
        <p className="final-sub">{T.fimSub}</p>
        <div className="final-cta">
          <Link href={`/ranking-ias${hrefLang}`} className="btn-retro primary">
            {T.ctaRanking}
          </Link>
          <Link href={`/jogos${hrefLang}`} className="btn-retro ghost">
            {T.ctaJogos}
          </Link>
          <Link href={`/analise${hrefLang}`} className="btn-retro ghost">
            {T.ctaAnalise}
          </Link>
        </div>
        <div className="final-links">
          <button onClick={share} className="linklike">
            ↗ {T.share}
          </button>
          <span>·</span>
          <a href="https://instagram.com/arena.das.ias" target="_blank" rel="noreferrer">
            {T.instagramLabel}
          </a>
          <span>·</span>
          <Link href="/">{T.voltarHome}</Link>
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────── CSS ───────────────────────── */

const CSS = `
body.retro-takeover { overflow: hidden; }
body.retro-takeover .site-header,
body.retro-takeover .site-footer,
body.retro-takeover .aviso-desc { display: none !important; }

.retro-root {
  height: 100dvh;
  overflow-y: auto;
  scroll-snap-type: y proximity;
  scroll-behavior: smooth;
  background: #05060d;
  color: #fff;
  font-family: var(--ff-sans);
  position: fixed;
  inset: 0;
  z-index: 100;
}
.retro-bar {
  position: fixed; top: 0; left: 0; right: 0; height: 4px; z-index: 110;
  background: linear-gradient(90deg, var(--primary), var(--accent), var(--extra));
  transform-origin: 0 50%;
}
.retro-root .cena {
  min-height: 100dvh;
  scroll-snap-align: start;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  text-align: center;
  padding: 64px 22px;
  position: relative;
  overflow: visible;
}
.cena-bg { position: absolute; inset: 0; overflow: hidden; z-index: 0; pointer-events: none; }
.kicker {
  text-transform: uppercase; letter-spacing: 0.22em;
  font-size: 12px; font-weight: 800; font-family: var(--ff-mono);
  color: var(--accent); margin-bottom: 18px;
  opacity: 0; transform: translateY(12px);
  transition: all .7s ease;
}
.kicker.light { color: rgba(255,255,255,.72); }
.cena.in .kicker { opacity: 1; transform: none; }
.grad {
  background: linear-gradient(100deg, var(--primary-2), var(--accent), var(--extra));
  -webkit-background-clip: text; background-clip: text; color: transparent;
}
.cena-h2 {
  font-family: var(--ff-display); font-weight: 900;
  font-size: clamp(28px, 6vw, 54px); line-height: 1.05;
  max-width: 15ch; margin: 0 0 26px;
  opacity: 0; transform: translateY(24px); transition: all .8s ease .1s;
}
.cena-h2.tight { max-width: 19ch; }
.cena-h2.invert { color: #fff; }
.cena.in .cena-h2 { opacity: 1; transform: none; }

/* ───── CAPA ───── */
.capa { background: radial-gradient(120% 90% at 50% 0%, #0b1437, #05060d 70%); }
.capa-inner { position: relative; z-index: 2; max-width: 820px; }
.capa-titulo {
  font-family: var(--ff-display); font-weight: 900;
  font-size: clamp(40px, 11vw, 108px); line-height: .98; margin: 0 0 30px;
  letter-spacing: -0.03em;
  opacity: 0; transform: translateY(30px) scale(.96); transition: all 1s cubic-bezier(.2,.7,.2,1) .15s;
}
.capa.in .capa-titulo { opacity: 1; transform: none; }
.capa-stats {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px;
  max-width: 640px; margin: 0 auto;
}
.capa-stat {
  display: flex; flex-direction: column; align-items: center; gap: 4px;
  opacity: 0; transform: translateY(18px); transition: all .8s cubic-bezier(.2,.7,.2,1) var(--d, 0s);
}
.capa.in .capa-stat { opacity: 1; transform: none; }
.capa-stat-n { font-family: var(--ff-display); font-weight: 900; font-size: clamp(24px, 5.4vw, 42px); color: #fff; line-height: 1; }
.capa-stat-l { font-size: clamp(9.5px, 1.7vw, 12px); color: rgba(255,255,255,.6); text-transform: uppercase; letter-spacing: .05em; line-height: 1.3; max-width: 12ch; }
.capa-orb {
  position: absolute; border-radius: 50%; filter: blur(72px); opacity: .5;
  animation: float 15s ease-in-out infinite;
}
.capa-orb.o1 { width: 440px; height: 440px; background: var(--primary); top: -90px; left: -70px; }
.capa-orb.o2 { width: 400px; height: 400px; background: var(--secondary-2); bottom: -110px; right: -50px; animation-delay: -4s; }
.capa-orb.o3 { width: 320px; height: 320px; background: var(--extra); top: 42%; left: 62%; animation-delay: -8s; opacity:.38; }
.capa-grid {
  position: absolute; inset: 0;
  background-image: linear-gradient(rgba(255,255,255,.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.035) 1px, transparent 1px);
  background-size: 46px 46px;
  mask-image: radial-gradient(70% 60% at 50% 30%, #000, transparent 85%);
}
@keyframes float { 0%,100%{transform:translate(0,0)} 50%{transform:translate(22px,-32px)} }
.scroll-hint {
  margin-top: 52px; display: flex; flex-direction: column; align-items: center;
  gap: 4px; color: rgba(255,255,255,.5); font-size: 12px; font-family: var(--ff-mono);
  text-transform: uppercase; letter-spacing: .15em;
  opacity: 0; transition: opacity 1s ease .95s;
}
.capa.in .scroll-hint { opacity: 1; }
.scroll-hint .chev { font-size: 26px; animation: bob 1.6s ease-in-out infinite; line-height: 1; }
@keyframes bob { 0%,100%{transform:translateY(0)} 50%{transform:translateY(8px)} }

/* ───── EXPERIMENTO ───── */
.experimento { background: linear-gradient(180deg, #05060d, #0a1230); }
.exp-grid { display: flex; flex-wrap: wrap; gap: 16px; justify-content: center; max-width: 900px; }
.exp-card {
  flex: 1; min-width: 220px; max-width: 280px;
  background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.09);
  border-radius: 22px; padding: 26px 20px; text-align: left;
  opacity: 0; transform: translateY(24px); transition: all .7s cubic-bezier(.2,.7,.2,1) var(--d, 0s);
}
.experimento.in .exp-card { opacity: 1; transform: none; }
.exp-emoji { font-size: 34px; margin-bottom: 10px; }
.exp-card h3 { font-family: var(--ff-display); font-weight: 800; font-size: 18px; margin: 0 0 8px; color: #fff; }
.exp-card p { color: rgba(255,255,255,.72); font-size: 13.5px; line-height: 1.55; margin: 0; }

/* ───── ESCALA (reuso pra grupos) ───── */
.grupos { background: linear-gradient(180deg, #05060d, #0e0a24); }
.escala-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; width: 100%; max-width: 560px; }
.escala-card {
  background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.09);
  border-radius: 20px; padding: 22px 12px;
  opacity: 0; transform: translateY(24px) scale(.97);
  transition: all .7s cubic-bezier(.2,.7,.2,1);
}
.grupos.in .escala-card { opacity: 1; transform: none; }
.escala-num { font-family: var(--ff-display); font-weight: 900; font-size: clamp(28px, 6.5vw, 44px); line-height: 1; }
.escala-label { margin-top: 6px; color: rgba(255,255,255,.7); font-size: 12px; font-weight: 600; }
.escala-foot {
  margin-top: 22px; color: rgba(255,255,255,.65); max-width: 50ch;
  font-size: 14px; line-height: 1.6;
  opacity: 0; transition: opacity .9s ease .3s;
}
.grupos.in .escala-foot { opacity: 1; }
.grupos-duo { display: flex; gap: 14px; flex-wrap: wrap; justify-content: center; margin-top: 30px; max-width: 640px; }
.grupos-card {
  background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.1); border-radius: 18px;
  padding: 16px 18px; flex: 1; min-width: 240px;
  opacity: 0; transform: translateY(20px); transition: all .8s ease .4s;
}
.grupos.in .grupos-card { opacity: 1; transform: none; }
.grupos-card-label { display: block; font-size: 11.5px; font-weight: 800; text-transform: uppercase; letter-spacing: .06em; margin-bottom: 10px; }
.grupos-card-label.bom { color: #4ade80; }
.grupos-card-label.ruim { color: #f97362; }

.mc-times { display: flex; align-items: center; justify-content: center; gap: 8px; }
.mc-real { font-family: var(--ff-display); font-weight: 900; font-size: 20px; color: #fff; }
.mc-pred { margin-top: 6px; font-size: 11px; color: rgba(255,255,255,.55); font-family: var(--ff-mono); }

/* ───── ZEBRAS ───── */
.zebras-intro { background: radial-gradient(120% 100% at 50% 40%, #1c1c22, #05060d 75%); }
.zebra-emoji { font-size: clamp(52px, 13vw, 110px); line-height: 1;
  opacity: 0; transform: scale(.6) rotate(8deg); transition: all .8s cubic-bezier(.2,1.3,.4,1) .1s; }
.zebras-intro.in .zebra-emoji { opacity: 1; transform: none; }

.zebra-spot.brasil { background: radial-gradient(120% 90% at 50% 20%, #1a0c0c, #05060d 72%); }
.zebra-spot.espanha { background: radial-gradient(120% 90% at 50% 20%, #1c0a1c, #05060d 72%); }
.zebra-spot.terceiro { background: radial-gradient(120% 90% at 50% 20%, #06210f, #05060d 72%); }
.zs-cristal { color: rgba(255,255,255,.65); font-size: 14px; margin-bottom: 14px;
  opacity: 0; transition: opacity .8s ease .15s; }
.zebra-spot.in .zs-cristal { opacity: 1; }
.zs-cristal strong { color: var(--accent); }
.zs-match { display: flex; align-items: center; justify-content: center; gap: clamp(14px, 5vw, 40px); margin: 8px 0 22px;
  opacity: 0; transform: translateY(24px); transition: all .8s ease .28s; }
.zs-match.small { gap: 18px; margin-bottom: 14px; }
.zebra-spot.in .zs-match, .final-jogo.in .zs-match, .cravadas.in .zs-match { opacity: 1; transform: none; }
.zs-placar { font-family: var(--ff-display); font-weight: 900; font-size: clamp(48px, 13vw, 104px); line-height: 1; }
.zs-placar.sad { color: rgba(255,255,255,.55); }
.zs-placar.gol { color: var(--primary-2); }
.zs-placar.small { font-size: 34px; }
.zs-x { color: var(--extra); margin: 0 6px; }
.zs-big { font-family: var(--ff-display); font-weight: 900; font-size: clamp(46px, 12vw, 88px);
  color: var(--extra); margin-bottom: 14px;
  opacity: 0; transform: scale(.85); transition: all .8s cubic-bezier(.2,1.3,.4,1) .35s; }
.zebra-spot.in .zs-big { opacity: 1; transform: none; }
.zs-big-sep { color: rgba(255,255,255,.4); margin: 0 4px; font-weight: 500; }
.zs-cap { color: rgba(255,255,255,.78); max-width: 52ch; line-height: 1.6; font-size: 15.5px;
  opacity: 0; transition: opacity .9s ease .5s; }
.zs-cap.small { font-size: 13.5px; max-width: 44ch; }
.zebra-spot.in .zs-cap, .final-jogo.in .zs-cap, .cravadas.in .zs-cap { opacity: 1; }
.zs-cap strong { color: #fff; }

.zebras-grid-cena { background: linear-gradient(180deg, #05060d, #0a1230); }
.zebras-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; width: 100%; max-width: 720px; margin-top: 8px; }
.zebra-card {
  background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.09);
  border-radius: 16px; padding: 14px 12px;
  opacity: 0; transform: translateY(20px) scale(.97); transition: all .6s ease var(--d, 0s);
}
.zebras-grid-cena.in .zebra-card { opacity: 1; transform: none; }

/* ───── CRAVADAS ───── */
.cravadas { background: linear-gradient(180deg, #05060d, #160a16); }
.cravadas-sub { color: rgba(255,255,255,.68); max-width: 54ch; font-size: 14.5px; line-height: 1.6; margin: 0 0 30px;
  opacity: 0; transition: opacity .8s ease .2s; }
.cravadas.in .cravadas-sub { opacity: 1; }
.cravadas-list { width: 100%; max-width: 520px; display: flex; flex-direction: column; gap: 10px; margin-bottom: 34px; }
.cravada-row {
  display: grid; grid-template-columns: 26px 1fr 90px; align-items: center; gap: 10px;
  opacity: 0; transform: translateX(-16px); transition: all .6s ease var(--d, 0s);
}
.cravadas.in .cravada-row { opacity: 1; transform: none; }
.cr-rank { font-family: var(--ff-mono); font-size: 11px; color: rgba(255,255,255,.45); text-align: left; }
.cr-nome { font-weight: 700; font-size: 13.5px; text-align: left; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.cr-bar-wrap { grid-column: 1 / -1; order: 3; height: 6px; background: rgba(255,255,255,.08); border-radius: 999px; overflow: hidden; }
.cr-bar { display: block; height: 100%; background: linear-gradient(90deg, var(--primary-2), var(--accent)); border-radius: 999px; transition: width 1.1s cubic-bezier(.2,.7,.2,1); }
.cr-num { font-family: var(--ff-display); font-weight: 800; font-size: 15px; text-align: right; color: var(--accent); }
.cr-num small { font-family: var(--ff-mono); font-weight: 500; font-size: 9.5px; color: rgba(255,255,255,.5); }
.impressionante { border-top: 1px solid rgba(255,255,255,.1); padding-top: 26px; width: 100%; max-width: 460px; }

/* ───── HUMANOS ───── */
.humanos { background: radial-gradient(130% 100% at 50% 10%, #0a1a12, #05060d 70%); }
.hum-swarm {
  display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px;
  max-width: 320px; margin: 0 auto 22px;
  opacity: 0; transition: opacity 1s ease .1s;
}
.humanos.in .hum-swarm { opacity: 1; }
.hum-cell {
  font-size: 15px; opacity: .35; display: flex; align-items: center; justify-content: center;
  transform: scale(.85);
  animation: swarmfloat 3.6s ease-in-out infinite; animation-delay: calc(var(--i) * 90ms);
}
.hum-cell.human { font-size: 26px; opacity: 1; filter: drop-shadow(0 0 14px rgba(255,223,0,.65)); animation: none; }
@keyframes swarmfloat { 0%,100%{ transform: translateY(0) scale(.85);} 50%{ transform: translateY(-4px) scale(.85);} }
.hum-name { font-family: var(--ff-display); font-weight: 900; font-size: clamp(24px, 6vw, 38px); color: var(--accent); margin-bottom: 14px;
  opacity: 0; transition: opacity .8s ease .3s; }
.humanos.in .hum-name { opacity: 1; }
.hum-stats { display: flex; gap: 34px; margin-bottom: 20px;
  opacity: 0; transform: translateY(14px); transition: all .8s ease .4s; }
.humanos.in .hum-stats { opacity: 1; transform: none; }
.hs-num { display: block; font-family: var(--ff-display); font-weight: 900; font-size: clamp(28px,7vw,44px); color: #fff; }
.hs-num.accent { color: var(--extra); }
.hs-lbl { font-size: 11px; color: rgba(255,255,255,.6); text-transform: uppercase; letter-spacing: .06em; font-family: var(--ff-mono); }
.hum-sub { color: rgba(255,255,255,.82); max-width: 50ch; font-size: 15.5px; line-height: 1.6; margin-bottom: 8px;
  opacity: 0; transition: opacity .9s ease .5s; }
.hum-caption { color: rgba(255,255,255,.55); max-width: 48ch; font-size: 12.5px; line-height: 1.5;
  opacity: 0; transition: opacity .9s ease .62s; }
.humanos.in .hum-sub, .humanos.in .hum-caption { opacity: 1; }

/* ───── CORRIDA (embed) ───── */
.corrida-cena { background: linear-gradient(180deg, #05060d, #0a1230); min-height: auto; padding-top: 72px; padding-bottom: 72px; }
.corrida-sub { color: rgba(255,255,255,.68); max-width: 56ch; font-size: 14px; line-height: 1.6; margin: 0 0 26px;
  opacity: 0; transition: opacity .8s ease .2s; }
.corrida-cena.in .corrida-sub { opacity: 1; }
.corrida-embed { width: 100%; max-width: 980px; text-align: left; color: #1a1a1a;
  opacity: 0; transform: translateY(20px); transition: all .9s ease .3s; }
.corrida-cena.in .corrida-embed { opacity: 1; transform: none; }

/* ───── PODIO FINAL ───── */
.podio-final { background: linear-gradient(180deg, #05060d, #1a1204); min-height: auto; padding-top: 70px; padding-bottom: 70px; gap: 8px; position: relative; }
.podio-bloco { width: 100%; max-width: 640px; margin-top: 42px; display: flex; flex-direction: column; align-items: center; }
.podio-bloco:first-of-type { margin-top: 10px; }
.podio-bloco-label { font-family: var(--ff-mono); text-transform: uppercase; letter-spacing: .1em; font-size: 11.5px; color: rgba(255,255,255,.55); margin-bottom: 12px; font-weight: 700; }
.podio-bloco-sub { color: rgba(255,255,255,.6); font-size: 13px; margin-top: 12px; max-width: 44ch; line-height: 1.5; }

.empate-wrap { display: flex; gap: 16px; flex-wrap: wrap; justify-content: center; }
.empate-card {
  background: linear-gradient(165deg, rgba(255,211,77,.22), rgba(224,161,0,.1));
  border: 1px solid rgba(255,211,77,.45); border-radius: 22px; padding: 22px 26px; min-width: 190px;
  opacity: 0; transform: translateY(24px) scale(.95); transition: all .8s cubic-bezier(.2,1.2,.4,1);
}
.podio-final.in .empate-card { opacity: 1; transform: none; }
.empate-coroa { font-size: 30px; margin-bottom: 6px; filter: drop-shadow(0 4px 14px rgba(255,211,77,.5)); }
.empate-nome { font-family: var(--ff-display); font-weight: 800; font-size: 17px; margin-bottom: 8px; }
.empate-pts { font-family: var(--ff-display); font-weight: 900; font-size: 30px; color: #FFD34D; }
.empate-pts small { font-family: var(--ff-mono); font-size: 11px; color: rgba(255,255,255,.6); font-weight: 500; }
.empate-exatos { margin-top: 4px; font-size: 11.5px; color: rgba(255,255,255,.6); }
.terceiro-chip { margin-top: 16px; background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.12); border-radius: 999px; padding: 8px 18px; font-size: 13px; font-weight: 700; }

.podio-wrap { display: flex; align-items: flex-end; justify-content: center; gap: 10px; width: 100%; max-width: 560px; margin-top: 14px; }
.podio-col { flex: 1; display: flex; flex-direction: column; align-items: center;
  opacity: 0; transform: translateY(40px); transition: all .8s cubic-bezier(.2,.7,.2,1) var(--d, 0s); }
.podio-final.in .podio-col { opacity: 1; transform: none; }
.podio-col.p1 { flex: 1.25; }
.podio-coroa { font-size: 28px; line-height: 1; margin-bottom: -2px; filter: drop-shadow(0 2px 10px rgba(255,211,77,.6)); }
.podio-masc { width: 84px; height: 84px; object-fit: contain; filter: drop-shadow(0 8px 22px rgba(0,0,0,.4)); margin-bottom: 10px; }
.podio-col.p1 .podio-masc { width: 108px; height: 108px; filter: drop-shadow(0 8px 28px rgba(255,211,77,.45)); }
.podio-step { width: 100%; border-radius: 14px 14px 0 0; display: flex; flex-direction: column; align-items: center; justify-content: flex-start; gap: 2px; padding: 10px 6px;
  background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.12); border-bottom: none; }
.podio-col.p1 .podio-step { background: linear-gradient(165deg, rgba(255,211,77,.28), rgba(224,161,0,.16)); border-color: rgba(255,211,77,.5); }
.podio-medal { font-size: 22px; line-height: 1; }
.podio-nome { font-weight: 800; font-size: 12px; line-height: 1.15; }
.podio-pts { font-family: var(--ff-display); font-weight: 900; font-size: 18px; color: var(--accent); }
.podio-pts small { font-size: 9.5px; font-family: var(--ff-mono); opacity: .7; }

.humano-card { display: flex; flex-direction: column; align-items: center; gap: 6px;
  opacity: 0; transform: translateY(20px); transition: all .8s ease; }
.podio-final.in .humano-card { opacity: 1; transform: none; }
.humano-emoji { font-size: 54px; filter: drop-shadow(0 8px 24px rgba(0,156,59,.4)); }
.humano-nome { font-family: var(--ff-display); font-weight: 900; font-size: 24px; }
.humano-pts { font-family: var(--ff-display); font-weight: 800; font-size: 18px; color: var(--primary-2); }

.confetti-wrap { position: absolute; inset: 0; overflow: hidden; pointer-events: none; z-index: 1; }
.confetti { position: absolute; top: -20px; left: calc(var(--i) * 4%); width: 7px; height: 12px; opacity: .85;
  animation: confettifall linear infinite; animation-duration: calc(3.6s + (var(--i) * 0.11s)); animation-delay: calc(var(--i) * 0.09s); }
.confetti.c0 { background: var(--primary); } .confetti.c1 { background: var(--accent); }
.confetti.c2 { background: var(--extra); } .confetti.c3 { background: var(--secondary-2); }
.confetti.c4 { background: #FFD34D; } .confetti.c5 { background: #fff; }
@keyframes confettifall {
  0% { transform: translateY(-10vh) rotate(0deg); opacity: 0; }
  8% { opacity: .9; }
  100% { transform: translateY(110vh) rotate(540deg); opacity: 0; }
}

/* ───── FINAL DO JOGO (Espanha x Argentina) ───── */
.final-jogo { background: radial-gradient(120% 90% at 50% 20%, #0b1437, #05060d 72%); }
.final-cravaram { margin-top: 30px; width: 100%; max-width: 560px;
  opacity: 0; transition: opacity .9s ease .65s; }
.final-jogo.in .final-cravaram { opacity: 1; }
.final-cravaram h3 { font-family: var(--ff-display); font-weight: 800; font-size: 17px; margin: 0 0 14px; color: #fff; }
.final-chips { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; }
.final-chip { background: rgba(255,211,77,.14); border: 1px solid rgba(255,211,77,.4); color: #FFD34D;
  border-radius: 999px; padding: 7px 14px; font-size: 12.5px; font-weight: 700; }
.final-chip.ghost { background: rgba(255,255,255,.06); border-color: rgba(255,255,255,.16); color: rgba(255,255,255,.65); }

/* ───── ENCERRAMENTO ───── */
.fim { background: radial-gradient(120% 100% at 50% 100%, #0b1437, #05060d 72%); }
.final-inner { position: relative; z-index: 2; max-width: 720px; }
.final-emoji { font-size: clamp(56px, 14vw, 110px); line-height: 1; margin-bottom: 12px;
  filter: drop-shadow(0 10px 36px rgba(255,211,77,.5));
  opacity: 0; transform: scale(.6); transition: all .9s cubic-bezier(.2,1.3,.4,1) .1s; }
.fim.in .final-emoji { opacity: 1; transform: none; }
.final-titulo { font-family: var(--ff-display); font-weight: 900; font-size: clamp(32px, 7.5vw, 66px);
  line-height: 1.05; margin: 0 0 18px; letter-spacing: -.02em;
  opacity: 0; transform: translateY(24px); transition: all .9s ease .25s; }
.fim.in .final-titulo { opacity: 1; transform: none; }
.final-sub { color: rgba(255,255,255,.78); font-size: clamp(14px,2.2vw,17px); line-height: 1.6; max-width: 52ch; margin: 0 auto;
  opacity: 0; transition: opacity .9s ease .45s; }
.fim.in .final-sub { opacity: 1; }
.final-cta { display: flex; gap: 12px; flex-wrap: wrap; justify-content: center; margin-top: 32px;
  opacity: 0; transform: translateY(18px); transition: all .8s ease .55s; }
.fim.in .final-cta { opacity: 1; transform: none; }
.btn-retro { border-radius: 999px; padding: 13px 24px; font-weight: 800; font-size: 14px; cursor: pointer;
  border: 2px solid transparent; text-decoration: none; transition: transform .15s ease, box-shadow .15s ease; display: inline-flex; align-items: center; }
.btn-retro.primary { background: linear-gradient(100deg, var(--primary), var(--primary-2)); color: #fff; box-shadow: 0 10px 30px -8px rgba(0,156,59,.6); }
.btn-retro.ghost { background: rgba(255,255,255,.08); color: #fff; border-color: rgba(255,255,255,.25); }
.btn-retro:hover { transform: translateY(-2px); }
.final-links { margin-top: 26px; display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; align-items: center;
  font-size: 13px; color: rgba(255,255,255,.5);
  opacity: 0; transition: opacity 1s ease .75s; }
.fim.in .final-links { opacity: 1; }
.final-links a, .final-links .linklike { color: rgba(255,255,255,.7); text-decoration: none; border-bottom: 1px solid rgba(255,255,255,.25);
  background: none; border-top: none; border-left: none; border-right: none; font: inherit; cursor: pointer; padding: 0; }
.final-links a:hover, .final-links .linklike:hover { color: #fff; }

/* TIME (bandeira + nome) */
.time { display: flex; flex-direction: column; align-items: center; gap: 8px; max-width: 140px; }
.time-flag { border-radius: 50%; object-fit: cover; box-shadow: 0 4px 14px rgba(0,0,0,.35); display: inline-flex; align-items: center; justify-content: center; background: rgba(255,255,255,.1); }
.time-nome { font-weight: 700; font-size: clamp(11.5px, 2.4vw, 15px); line-height: 1.15; }

@media (max-width: 560px) {
  .capa-stats { grid-template-columns: repeat(2, 1fr); gap: 18px 10px; }
  .escala-grid { gap: 10px; }
  .exp-grid { flex-direction: column; align-items: stretch; }
  .exp-card { max-width: none; }
  .zebras-grid { gap: 10px; }
  .empate-wrap { gap: 12px; }
  .empate-card { padding: 18px 20px; min-width: 150px; }
}
@media (max-width: 380px) {
  .retro-root .cena { padding: 52px 16px; }
  .cravada-row { grid-template-columns: 22px 1fr 74px; }
}

/* Telas baixas / paisagem: relaxa alturas gigantes */
@media (max-height: 640px) {
  .retro-root .cena { min-height: auto; padding: 44px 22px; }
  .capa, .fim, .zebras-intro, .zebra-spot, .final-jogo { min-height: 100dvh; justify-content: center; }
  .cena-h2 { font-size: clamp(22px, 5vw, 38px); margin-bottom: 16px; }
  .capa-titulo { font-size: clamp(30px, 8vw, 58px); margin-bottom: 18px; }
  .zs-placar { font-size: clamp(38px, 9vh, 76px); }
  .zebra-emoji, .final-emoji { font-size: clamp(40px, 8vh, 80px); }
}
@media (prefers-reduced-motion: reduce) {
  .retro-root { scroll-snap-type: none; }
  .cena * { transition: none !important; animation: none !important; }
  .kicker, .cena-h2, .capa-titulo, .capa-stat, .scroll-hint, .escala-card, .escala-foot,
  .exp-card, .grupos-card, .zebra-emoji, .zs-cristal, .zs-match, .zs-big, .zs-cap,
  .zebra-card, .cravada-row, .cravadas-sub, .hum-swarm, .hum-name, .hum-stats, .hum-sub, .hum-caption,
  .corrida-sub, .corrida-embed, .empate-card, .podio-col, .humano-card,
  .final-cravaram, .final-titulo, .final-sub, .final-cta, .final-links { opacity: 1 !important; transform: none !important; }
}
`;
