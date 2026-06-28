"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import type { RetroData } from "@/lib/retrospectiva-grupos";

const flag = (iso?: string) =>
  iso ? `https://hatscripts.github.io/circle-flags/flags/${iso}.svg` : undefined;

/* Conta de 0 até `to` quando `run` vira true. */
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

/* Marca uma cena como visível quando entra no viewport. */
function useReveal() {
  const ref = useRef<HTMLElement>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setSeen(true);
        }
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return { ref, seen };
}

export default function Retro({ data }: { data: RetroData }) {
  const [progress, setProgress] = useState(0);
  const scrollerRef = useRef<HTMLDivElement>(null);

  // Takeover de tela cheia: esconde header/footer/avisos globais enquanto a
  // retrospectiva está montada (senão eles vazam por cima/atrás do overlay).
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

  const zd = data.zebraDestaque;
  const gd = data.goleadaDestaque;

  return (
    <div className="retro-root" ref={scrollerRef} onScroll={onScroll}>
      {/* barra de progresso topo */}
      <div className="retro-bar" style={{ transform: `scaleX(${progress})` }} />

      <CenaCapa data={data} />
      <CenaEscala data={data} />
      <CenaCampea data={data} />
      <CenaPodio data={data} />
      <CenaParadoxo data={data} />
      {zd && <CenaZebraDestaque z={zd} />}
      <CenaZebras data={data} />
      {gd && <CenaGoleada g={gd} data={data} />}
      <CenaLicoes data={data} />
      <CenaFinal data={data} />

      <style>{CSS}</style>
    </div>
  );
}

/* ───────────────────────── CENAS ───────────────────────── */

function CenaCapa({ data }: { data: RetroData }) {
  const { ref, seen } = useReveal();
  return (
    <section ref={ref} className={`cena capa ${seen ? "in" : ""}`}>
      <div className="capa-orb o1" />
      <div className="capa-orb o2" />
      <div className="capa-orb o3" />
      <div className="capa-inner">
        <span className="kicker">Copa do Mundo 2026 · Bolão das IAs</span>
        <h1 className="capa-titulo">
          A retrospectiva
          <br />
          <span className="grad">da fase de grupos</span>
        </h1>
        <p className="capa-sub">
          {data.totalIas} inteligências artificiais. {data.totalJogos} jogos.
          Milhares de palpites. Esta é a história do que as máquinas viram — e do
          que nem elas previram.
        </p>
        <div className="scroll-hint">
          <span>role pra começar</span>
          <span className="chev">⌄</span>
        </div>
      </div>
    </section>
  );
}

function CenaEscala({ data }: { data: RetroData }) {
  const { ref, seen } = useReveal();
  const stats = [
    { n: data.totalJogos, s: "", label: "jogos disputados", cor: "var(--primary)" },
    { n: data.totalIas, s: "", label: "IAs no torneio", cor: "var(--secondary)" },
    { n: data.totalPalpites, s: "", label: "palpites registrados", cor: "var(--extra)" },
    { n: data.totalGols, s: "", label: "gols nas redes", cor: "var(--accent-3)" },
  ];
  return (
    <section ref={ref} className={`cena escala ${seen ? "in" : ""}`}>
      <h2 className="cena-h2">A fase de grupos em números</h2>
      <div className="escala-grid">
        {stats.map((st, i) => (
          <div key={i} className="escala-card" style={{ ["--d" as string]: `${i * 0.12}s` }}>
            <div className="escala-num" style={{ color: st.cor }}>
              <Num to={st.n} run={seen} suffix={st.s} />
            </div>
            <div className="escala-label">{st.label}</div>
          </div>
        ))}
      </div>
      <p className="escala-foot">
        Média de <strong>{data.mediaGolsJogo} gols</strong> por jogo. Uma fase de
        grupos movimentada — e as IAs tentaram cravar cada placar.
      </p>
    </section>
  );
}

function CenaCampea({ data }: { data: RetroData }) {
  const { ref, seen } = useReveal();
  const c = data.campeaGeral;
  return (
    <section ref={ref} className={`cena campea ${seen ? "in" : ""}`}>
      <span className="kicker light">A melhor de todas</span>
      <div className="campea-trofeu">🏆</div>
      <h2 className="campea-nome">{c.nome}</h2>
      <p className="campea-desc">
        Entre {data.totalIas} modelos, foi quem mais pontuou na fase de grupos.
      </p>
      <div className="campea-stats">
        <div>
          <span className="cs-num">
            <Num to={c.pontos} run={seen} />
          </span>
          <span className="cs-lbl">pontos</span>
        </div>
        <div>
          <span className="cs-num">
            <Num to={c.exatos} run={seen} />
          </span>
          <span className="cs-lbl">placares exatos</span>
        </div>
      </div>
    </section>
  );
}

function CenaPodio({ data }: { data: RetroData }) {
  const { ref, seen } = useReveal();
  const p = data.podioSerieA;
  if (p.length < 3) return null;
  const visual = [p[1], p[0], p[2]];
  const alturas = [62, 100, 46];
  const medals = ["🥈", "🥇", "🥉"];
  return (
    <section ref={ref} className={`cena podio ${seen ? "in" : ""}`}>
      <span className="kicker">O pódio da Série A</span>
      <h2 className="cena-h2 tight">As estrelas que jogam de paletó</h2>
      <p className="podio-sub">
        As 12 IAs de interface (as que você usa no dia a dia) têm um campeonato à
        parte. Este foi o pódio da fase de grupos.
      </p>
      <div className="podio-wrap">
        {visual.map((it, i) => {
          const is1 = it.posicao === 1;
          return (
            <div key={it.slug} className={`podio-col p${it.posicao}`} style={{ ["--d" as string]: `${i * 0.15}s` }}>
              {is1 && <div className="podio-coroa">👑</div>}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className="podio-masc"
                src={`/mascots/${it.slug}.png`}
                alt={it.nome}
                width={is1 ? 150 : 104}
                height={is1 ? 150 : 104}
                loading="lazy"
              />
              <div className="podio-step" style={{ height: alturas[i] }}>
                <span className="podio-medal">{medals[i]}</span>
                <span className="podio-nome">{it.nome}</span>
                <span className="podio-pts">
                  <Num to={it.pontos} run={seen} /> <small>pts</small>
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function CenaParadoxo({ data }: { data: RetroData }) {
  const { ref, seen } = useReveal();
  return (
    <section ref={ref} className={`cena paradoxo ${seen ? "in" : ""}`}>
      <span className="kicker light">O paradoxo da precisão</span>
      <h2 className="cena-h2 invert">As máquinas sabem quem ganha.<br />O placar exato é outra história.</h2>
      <div className="par-split">
        <div className="par-half hit">
          <div className="par-ring" style={{ ["--p" as string]: `${data.cristalPctVencedor}` }}>
            <span className="par-pct">
              <Num to={data.cristalPctVencedor} run={seen} suffix="%" />
            </span>
          </div>
          <p className="par-cap">
            das vezes a <strong>Bola de Cristal</strong> (o consenso das IAs)
            cravou o vencedor certo
          </p>
        </div>
        <div className="par-half miss">
          <div className="par-ring small" style={{ ["--p" as string]: `${data.cristalPctExatos}` }}>
            <span className="par-pct">
              <Num to={data.cristalPctExatos} run={seen} suffix="%" />
            </span>
          </div>
          <p className="par-cap">
            mas só esse tanto acertou o <strong>placar exato</strong>. Prever
            gols é mais arte do que ciência.
          </p>
        </div>
      </div>
    </section>
  );
}

function CenaZebraDestaque({ z }: { z: NonNullable<RetroData["zebraDestaque"]> }) {
  const { ref, seen } = useReveal();
  return (
    <section ref={ref} className={`cena zebrad ${seen ? "in" : ""}`}>
      <div className="zebra-emoji">🦓</div>
      <span className="kicker light">A maior zebra</span>
      <div className="zd-match">
        <Time iso={z.isoA} nome={z.timeA} />
        <div className="zd-placar">
          {z.golsA}<span className="zd-x">×</span>{z.golsB}
        </div>
        <Time iso={z.isoB} nome={z.timeB} />
      </div>
      <p className="zd-cap">
        {z.votos} IAs estavam tão certas que cravaram{" "}
        <strong>
          {z.cristalA}×{z.cristalB}
        </strong>
        . O jogo decidiu o contrário. Futebol 1, algoritmos 0.
      </p>
    </section>
  );
}

function CenaZebras({ data }: { data: RetroData }) {
  const { ref, seen } = useReveal();
  const lista = data.zebras.slice(0, 8);
  return (
    <section ref={ref} className={`cena zebras ${seen ? "in" : ""}`}>
      <span className="kicker">Quando o roteiro virou</span>
      <h2 className="cena-h2 tight">
        {data.zebras.length} zebras pegaram o consenso no contrapé
      </h2>
      <div className="zebras-grid">
        {lista.map((z, i) => (
          <div key={z.numero} className="zebra-card" style={{ ["--d" as string]: `${i * 0.06}s` }}>
            <div className="zc-times">
              <Time iso={z.isoA} nome={z.timeA} size={26} />
              <span className="zc-real">
                {z.golsA}×{z.golsB}
              </span>
              <Time iso={z.isoB} nome={z.timeB} size={26} flip />
            </div>
            <div className="zc-pred">
              IAs: {z.cristalA}×{z.cristalB} · {z.votos} votos
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function CenaGoleada({
  g,
  data,
}: {
  g: NonNullable<RetroData["goleadaDestaque"]>;
  data: RetroData;
}) {
  const { ref, seen } = useReveal();
  return (
    <section ref={ref} className={`cena goleada ${seen ? "in" : ""}`}>
      <span className="kicker light">Festival de gols</span>
      <h2 className="cena-h2 invert">A maior goleada da fase</h2>
      <div className="gol-hero">
        <Time iso={g.isoA} nome={g.timeA} size={64} />
        <div className="gol-placar">
          {g.golsA}<span className="gol-x">×</span>{g.golsB}
        </div>
        <Time iso={g.isoB} nome={g.timeB} size={64} />
      </div>
      <div className="gol-resto">
        {data.goleadas.slice(1, 5).map((x) => (
          <div key={x.numero} className="gol-mini">
            <Time iso={x.isoA} nome={x.timeA} size={20} />
            <span>
              {x.golsA}×{x.golsB}
            </span>
            <Time iso={x.isoB} nome={x.timeB} size={20} flip />
          </div>
        ))}
      </div>
    </section>
  );
}

function CenaLicoes({ data }: { data: RetroData }) {
  const { ref, seen } = useReveal();
  const licoes = [
    {
      emoji: "🎯",
      t: "Consenso vence no atacado",
      d: `Acertar o vencedor ${data.cristalPctVencedor}% das vezes é melhor que a maioria dos humanos. A sabedoria das máquinas funciona — na média.`,
    },
    {
      emoji: "🎲",
      t: "Gol exato é loteria",
      d: `Só ${data.cristalPctExatos}% de placares cravados. Nem ${data.totalIas} cérebros de silício domam o caos de uma bola na trave.`,
    },
    {
      emoji: "🦓",
      t: "A zebra é eterna",
      d: `${data.zebras.length} jogos contrariaram o favorito das IAs. É por isso que a gente assiste — e palpita.`,
    },
  ];
  return (
    <section ref={ref} className={`cena licoes ${seen ? "in" : ""}`}>
      <span className="kicker">O que aprendemos</span>
      <h2 className="cena-h2 tight">Três lições da fase de grupos</h2>
      <div className="licoes-list">
        {licoes.map((l, i) => (
          <div key={i} className="licao" style={{ ["--d" as string]: `${i * 0.12}s` }}>
            <div className="licao-emoji">{l.emoji}</div>
            <div>
              <h3>{l.t}</h3>
              <p>{l.d}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function CenaFinal({ data }: { data: RetroData }) {
  const { ref, seen } = useReveal();
  const share = async () => {
    const url = "https://bolao.arenadasias.com.br/retrospectiva-grupos";
    const txt = `A retrospectiva da fase de grupos da Copa 2026 segundo ${data.totalIas} IAs 🤖⚽`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Retrospectiva da Fase de Grupos", text: txt, url });
        return;
      } catch {
        /* cancelado */
      }
    }
    try {
      await navigator.clipboard.writeText(`${txt} ${url}`);
      alert("Link copiado!");
    } catch {
      /* noop */
    }
  };
  return (
    <section ref={ref} className={`cena final ${seen ? "in" : ""}`}>
      <div className="capa-orb o1" />
      <div className="capa-orb o2" />
      <div className="final-inner">
        <div className="final-emoji">🔮</div>
        <h2 className="final-titulo">
          A fase de grupos acabou.
          <br />
          <span className="grad">O mata-mata é agora.</span>
        </h2>
        <p className="final-sub">
          As IAs já cravaram os palpites do mata-mata — e você? Entre no bolão e
          dispute contra as máquinas a partir das oitavas.
        </p>
        <div className="final-cta">
          <Link href="/bolao/humanos-vs-ias" className="btn-retro primary">
            🏆 Entrar no bolão do mata-mata
          </Link>
          <button onClick={share} className="btn-retro ghost">
            ↗ Compartilhar
          </button>
        </div>
        <div className="final-links">
          <Link href="/ranking-ias">Ranking completo das IAs</Link>
          <span>·</span>
          <Link href="/cristal">Bola de Cristal</Link>
          <span>·</span>
          <Link href="/">Voltar à home</Link>
        </div>
      </div>
    </section>
  );
}

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
        /* eslint-disable-next-line @next/next/no-img-element */
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

/* ───────────────────────── CSS ───────────────────────── */

const CSS = `
/* Enquanto a retrospectiva está aberta, ela toma a tela inteira: esconde o
   chrome global (header sticky z-index 50, footer e avisos) que senão aparece
   por cima/atrás do overlay. */
body.retro-takeover { overflow: hidden; }
body.retro-takeover .site-header,
body.retro-takeover .site-footer,
body.retro-takeover .aviso-desc { display: none !important; }

.retro-root {
  height: 100dvh;
  overflow-y: auto;
  scroll-snap-type: y mandatory;
  scroll-behavior: smooth;
  background: #06070f;
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
  padding: 56px 24px;
  position: relative;
  overflow: hidden;
}
.kicker {
  text-transform: uppercase; letter-spacing: 0.22em;
  font-size: 12px; font-weight: 800; font-family: var(--ff-mono);
  color: var(--accent); margin-bottom: 18px;
  opacity: 0; transform: translateY(12px);
  transition: all .7s ease;
}
.kicker.light { color: rgba(255,255,255,.7); }
.cena.in .kicker { opacity: 1; transform: none; }
.grad {
  background: linear-gradient(100deg, var(--primary-2), var(--accent), var(--extra));
  -webkit-background-clip: text; background-clip: text; color: transparent;
}
.cena-h2 {
  font-family: var(--ff-display); font-weight: 900;
  font-size: clamp(28px, 6vw, 56px); line-height: 1.05;
  max-width: 14ch; margin: 0 0 28px;
  opacity: 0; transform: translateY(24px); transition: all .8s ease .1s;
}
.cena-h2.tight { max-width: 18ch; }
.cena.in .cena-h2 { opacity: 1; transform: none; }

/* CAPA */
.capa { background: radial-gradient(120% 90% at 50% 0%, #0b1437, #06070f 70%); }
.capa-inner { position: relative; z-index: 2; max-width: 780px; }
.capa-titulo {
  font-family: var(--ff-display); font-weight: 900;
  font-size: clamp(40px, 11vw, 104px); line-height: .98; margin: 0 0 24px;
  letter-spacing: -0.03em;
  opacity: 0; transform: translateY(30px) scale(.96); transition: all 1s cubic-bezier(.2,.7,.2,1) .15s;
}
.capa.in .capa-titulo { opacity: 1; transform: none; }
.capa-sub {
  font-size: clamp(15px, 2.3vw, 20px); color: rgba(255,255,255,.78);
  max-width: 58ch; margin: 0 auto; line-height: 1.6;
  opacity: 0; transform: translateY(20px); transition: all .9s ease .4s;
}
.capa.in .capa-sub { opacity: 1; transform: none; }
.capa-orb {
  position: absolute; border-radius: 50%; filter: blur(70px); opacity: .55;
  animation: float 14s ease-in-out infinite;
}
.capa-orb.o1 { width: 420px; height: 420px; background: var(--primary); top: -80px; left: -60px; }
.capa-orb.o2 { width: 380px; height: 380px; background: var(--secondary-2); bottom: -100px; right: -40px; animation-delay: -4s; }
.capa-orb.o3 { width: 300px; height: 300px; background: var(--extra); top: 40%; left: 60%; animation-delay: -8s; opacity:.4; }
@keyframes float { 0%,100%{transform:translate(0,0)} 50%{transform:translate(20px,-30px)} }
.scroll-hint {
  margin-top: 56px; display: flex; flex-direction: column; align-items: center;
  gap: 4px; color: rgba(255,255,255,.5); font-size: 12px; font-family: var(--ff-mono);
  text-transform: uppercase; letter-spacing: .15em;
  opacity: 0; transition: opacity 1s ease .8s;
}
.capa.in .scroll-hint { opacity: 1; }
.scroll-hint .chev { font-size: 28px; animation: bob 1.6s ease-in-out infinite; line-height: 1; }
@keyframes bob { 0%,100%{transform:translateY(0)} 50%{transform:translateY(8px)} }

/* ESCALA */
.escala { background: linear-gradient(180deg, #06070f, #0a1230); }
.escala-grid {
  display: grid; grid-template-columns: repeat(2, 1fr); gap: 18px;
  width: 100%; max-width: 760px;
}
.escala-card {
  background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.09);
  border-radius: 22px; padding: 28px 18px;
  opacity: 0; transform: translateY(28px) scale(.97);
  transition: all .7s cubic-bezier(.2,.7,.2,1) var(--d, 0s);
}
.escala.in .escala-card { opacity: 1; transform: none; }
.escala-num {
  font-family: var(--ff-display); font-weight: 900;
  font-size: clamp(40px, 9vw, 76px); line-height: 1;
}
.escala-label {
  margin-top: 8px; color: rgba(255,255,255,.7); font-size: 14px;
  font-weight: 600;
}
.escala-foot {
  margin-top: 34px; color: rgba(255,255,255,.65); max-width: 50ch;
  font-size: 15px; line-height: 1.6;
  opacity: 0; transition: opacity .9s ease .6s;
}
.escala.in .escala-foot { opacity: 1; }
.escala-foot strong { color: var(--accent); }

/* CAMPEA */
.campea { background: radial-gradient(120% 90% at 50% 30%, #1a1405, #06070f 72%); }
.campea-trofeu {
  font-size: clamp(64px, 16vw, 140px); line-height: 1;
  filter: drop-shadow(0 12px 40px rgba(255,199,0,.5));
  opacity: 0; transform: scale(.5) rotate(-12deg);
  transition: all .9s cubic-bezier(.2,1.3,.4,1) .1s;
}
.campea.in .campea-trofeu { opacity: 1; transform: none; }
.campea-nome {
  font-family: var(--ff-display); font-weight: 900;
  font-size: clamp(32px, 8vw, 68px); margin: 10px 0 6px;
  background: linear-gradient(100deg, #FFD34D, #FFA31C);
  -webkit-background-clip: text; background-clip: text; color: transparent;
  opacity: 0; transform: translateY(20px); transition: all .8s ease .3s;
}
.campea.in .campea-nome { opacity: 1; transform: none; }
.campea-desc {
  color: rgba(255,255,255,.7); max-width: 44ch; line-height: 1.6;
  opacity: 0; transition: opacity .8s ease .45s;
}
.campea.in .campea-desc { opacity: 1; }
.campea-stats {
  display: flex; gap: 48px; margin-top: 36px;
  opacity: 0; transform: translateY(18px); transition: all .8s ease .55s;
}
.campea.in .campea-stats { opacity: 1; transform: none; }
.campea-stats > div { display: flex; flex-direction: column; }
.cs-num { font-family: var(--ff-display); font-weight: 900; font-size: clamp(36px,8vw,60px); color: #fff; }
.cs-lbl { font-size: 13px; color: rgba(255,255,255,.6); text-transform: uppercase; letter-spacing: .08em; font-family: var(--ff-mono); }

/* PODIO */
.podio { background: linear-gradient(180deg, #06070f, #120a24); }
.podio-sub { color: rgba(255,255,255,.7); max-width: 50ch; line-height: 1.6; margin: 0 0 44px; font-size: 15px;
  opacity: 0; transition: opacity .8s ease .3s; }
.podio.in .podio-sub { opacity: 1; }
.podio-wrap { display: flex; align-items: flex-end; justify-content: center; gap: 10px; width: 100%; max-width: 640px; }
.podio-col {
  flex: 1; display: flex; flex-direction: column; align-items: center;
  opacity: 0; transform: translateY(40px); transition: all .8s cubic-bezier(.2,.7,.2,1) var(--d, 0s);
}
.podio.in .podio-col { opacity: 1; transform: none; }
.podio-col.p1 { flex: 1.25; }
.podio-coroa { font-size: 34px; line-height: 1; margin-bottom: -6px; filter: drop-shadow(0 2px 10px rgba(255,211,77,.6)); }
.podio-masc { object-fit: contain; filter: drop-shadow(0 8px 22px rgba(0,0,0,.4)); margin-bottom: 8px; }
.podio-col.p1 .podio-masc { filter: drop-shadow(0 8px 28px rgba(255,211,77,.45)); }
.podio-step {
  width: 100%; border-radius: 16px 16px 0 0; display: flex; flex-direction: column;
  align-items: center; justify-content: flex-start; gap: 2px; padding: 10px 6px;
  background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.12); border-bottom: none;
}
.podio-col.p1 .podio-step { background: linear-gradient(165deg, rgba(255,211,77,.28), rgba(224,161,0,.16)); border-color: rgba(255,211,77,.5); }
.podio-medal { font-size: 24px; line-height: 1; }
.podio-nome { font-weight: 800; font-size: 13px; line-height: 1.15; }
.podio-pts { font-family: var(--ff-display); font-weight: 900; font-size: 20px; color: var(--accent); }
.podio-pts small { font-size: 10px; font-family: var(--ff-mono); opacity: .7; }

/* PARADOXO */
.paradoxo { background: linear-gradient(135deg, #0a1230, #1a0a24); }
.cena-h2.invert { color: #fff; }
.par-split { display: flex; gap: 40px; flex-wrap: wrap; justify-content: center; align-items: flex-start; max-width: 760px; }
.par-half { flex: 1; min-width: 240px; max-width: 320px;
  opacity: 0; transform: translateY(28px); transition: all .8s ease .2s; }
.paradoxo.in .par-half { opacity: 1; transform: none; }
.paradoxo.in .par-half.miss { transition-delay: .4s; }
.par-ring {
  --p: 0; width: 180px; height: 180px; border-radius: 50%; margin: 0 auto 20px;
  display: grid; place-items: center; position: relative;
  background: conic-gradient(var(--primary-2) calc(var(--p) * 1%), rgba(255,255,255,.08) 0);
}
.par-ring.small { background: conic-gradient(var(--extra) calc(var(--p) * 1%), rgba(255,255,255,.08) 0); }
.par-ring::after { content: ""; position: absolute; inset: 14px; border-radius: 50%; background: #0d0a1c; }
.par-pct { position: relative; z-index: 2; font-family: var(--ff-display); font-weight: 900; font-size: 44px; }
.par-cap { color: rgba(255,255,255,.78); line-height: 1.6; font-size: 15px; }
.par-cap strong { color: #fff; }

/* ZEBRA DESTAQUE */
.zebrad { background: radial-gradient(120% 100% at 50% 40%, #1c1c22, #06070f 75%); }
.zebra-emoji { font-size: clamp(56px, 14vw, 120px); line-height: 1;
  opacity: 0; transform: scale(.6) rotate(8deg); transition: all .8s cubic-bezier(.2,1.3,.4,1) .1s; }
.zebrad.in .zebra-emoji, .zebras.in .zebra-card .zc-real { }
.zebrad.in .zebra-emoji { opacity: 1; transform: none; }
.zd-match { display: flex; align-items: center; justify-content: center; gap: clamp(16px, 5vw, 48px); margin: 26px 0 22px;
  opacity: 0; transform: translateY(24px); transition: all .8s ease .3s; }
.zebrad.in .zd-match { opacity: 1; transform: none; }
.zd-placar { font-family: var(--ff-display); font-weight: 900; font-size: clamp(48px, 13vw, 110px); line-height: 1; }
.zd-x { color: var(--extra); margin: 0 6px; }
.zd-cap { color: rgba(255,255,255,.78); max-width: 50ch; line-height: 1.6; font-size: 16px;
  opacity: 0; transition: opacity .9s ease .55s; }
.zebrad.in .zd-cap { opacity: 1; }
.zd-cap strong { color: var(--accent); }

/* ZEBRAS GRID */
.zebras { background: linear-gradient(180deg, #06070f, #0a1230); }
.zebras-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; width: 100%; max-width: 720px; }
.zebra-card {
  background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.09);
  border-radius: 16px; padding: 14px 12px;
  opacity: 0; transform: translateY(20px) scale(.97); transition: all .6s ease var(--d, 0s);
}
.zebras.in .zebra-card { opacity: 1; transform: none; }
.zc-times { display: flex; align-items: center; justify-content: center; gap: 8px; }
.zc-real { font-family: var(--ff-display); font-weight: 900; font-size: 22px; color: #fff; }
.zc-pred { margin-top: 6px; font-size: 11px; color: rgba(255,255,255,.55); font-family: var(--ff-mono); }

/* GOLEADA */
.goleada { background: radial-gradient(120% 90% at 50% 30%, #06210f, #06070f 75%); }
.gol-hero { display: flex; align-items: center; justify-content: center; gap: clamp(14px, 5vw, 44px); margin: 6px 0 30px;
  opacity: 0; transform: translateY(24px); transition: all .8s ease .25s; }
.goleada.in .gol-hero { opacity: 1; transform: none; }
.gol-placar { font-family: var(--ff-display); font-weight: 900; font-size: clamp(52px, 14vw, 120px); line-height: 1; color: var(--primary-2); }
.gol-x { color: #fff; margin: 0 4px; }
.gol-resto { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; max-width: 640px;
  opacity: 0; transition: opacity .9s ease .5s; }
.goleada.in .gol-resto { opacity: 1; }
.gol-mini { display: flex; align-items: center; gap: 7px; background: rgba(255,255,255,.05);
  border: 1px solid rgba(255,255,255,.1); border-radius: 999px; padding: 7px 14px; font-weight: 800; font-size: 14px; }

/* LICOES */
.licoes { background: linear-gradient(180deg, #06070f, #160a16); }
.licoes-list { display: flex; flex-direction: column; gap: 16px; width: 100%; max-width: 620px; text-align: left; }
.licao { display: flex; gap: 16px; align-items: flex-start; background: rgba(255,255,255,.04);
  border: 1px solid rgba(255,255,255,.09); border-radius: 18px; padding: 20px 22px;
  opacity: 0; transform: translateX(-24px); transition: all .7s ease var(--d, 0s); }
.licoes.in .licao { opacity: 1; transform: none; }
.licao-emoji { font-size: 34px; line-height: 1; flex-shrink: 0; }
.licao h3 { font-family: var(--ff-display); font-weight: 800; font-size: 19px; margin: 0 0 4px; color: #fff; }
.licao p { color: rgba(255,255,255,.72); font-size: 14px; line-height: 1.55; margin: 0; }

/* FINAL */
.final { background: radial-gradient(120% 100% at 50% 100%, #0b1437, #06070f 72%); }
.final-inner { position: relative; z-index: 2; max-width: 720px; }
.final-emoji { font-size: clamp(56px, 14vw, 110px); line-height: 1; margin-bottom: 12px;
  filter: drop-shadow(0 10px 36px rgba(129,52,175,.5));
  opacity: 0; transform: scale(.6); transition: all .9s cubic-bezier(.2,1.3,.4,1) .1s; }
.final.in .final-emoji { opacity: 1; transform: none; }
.final-titulo { font-family: var(--ff-display); font-weight: 900; font-size: clamp(34px, 8vw, 72px);
  line-height: 1.02; margin: 0 0 18px; letter-spacing: -.02em;
  opacity: 0; transform: translateY(24px); transition: all .9s ease .25s; }
.final.in .final-titulo { opacity: 1; transform: none; }
.final-sub { color: rgba(255,255,255,.78); font-size: clamp(15px,2.2vw,18px); line-height: 1.6; max-width: 52ch; margin: 0 auto;
  opacity: 0; transition: opacity .9s ease .45s; }
.final.in .final-sub { opacity: 1; }
.final-cta { display: flex; gap: 12px; flex-wrap: wrap; justify-content: center; margin-top: 32px;
  opacity: 0; transform: translateY(18px); transition: all .8s ease .55s; }
.final.in .final-cta { opacity: 1; transform: none; }
.btn-retro { border-radius: 999px; padding: 14px 26px; font-weight: 800; font-size: 15px; cursor: pointer;
  border: 2px solid transparent; text-decoration: none; transition: transform .15s ease, box-shadow .15s ease; }
.btn-retro.primary { background: linear-gradient(100deg, var(--primary), var(--primary-2)); color: #fff; box-shadow: 0 10px 30px -8px rgba(0,156,59,.6); }
.btn-retro.ghost { background: rgba(255,255,255,.08); color: #fff; border-color: rgba(255,255,255,.25); }
.btn-retro:hover { transform: translateY(-2px); }
.final-links { margin-top: 28px; display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; align-items: center;
  font-size: 13px; color: rgba(255,255,255,.5);
  opacity: 0; transition: opacity 1s ease .75s; }
.final.in .final-links { opacity: 1; }
.final-links a { color: rgba(255,255,255,.7); text-decoration: none; border-bottom: 1px solid rgba(255,255,255,.25); }
.final-links a:hover { color: #fff; }

/* TIME (bandeira + nome) */
.time { display: flex; flex-direction: column; align-items: center; gap: 8px; max-width: 130px; }
.time.flip { }
.time-flag { border-radius: 50%; object-fit: cover; box-shadow: 0 4px 14px rgba(0,0,0,.35); display: inline-flex; align-items: center; justify-content: center; background: rgba(255,255,255,.1); }
.time-nome { font-weight: 700; font-size: clamp(12px, 2.4vw, 16px); line-height: 1.15; }

@media (max-width: 560px) {
  .escala-grid { grid-template-columns: 1fr 1fr; gap: 12px; }
  .par-split { gap: 24px; }
  .campea-stats { gap: 28px; }
}

/* Celulares estreitos em retrato */
@media (max-width: 380px) {
  .retro-root .cena { padding: 48px 16px; }
  .zebras-grid { gap: 10px; }
  .zebra-card { padding: 12px 10px; }
  .time-nome { font-size: 11px; }
}

/* Telas baixas / celular em PAISAGEM: relaxa o snap, encolhe os elementos
   gigantes (que escalam por vw) e deixa cada cena crescer com seu conteúdo
   pra nada ser cortado. Capa e final continuam ocupando a tela cheia. */
@media (max-height: 620px) {
  .retro-root { scroll-snap-type: y proximity; }
  .retro-root .cena { min-height: auto; padding: 40px 22px; }
  .capa, .final { min-height: 100dvh; justify-content: center; }
  .cena-h2 { font-size: clamp(22px, 5vw, 38px); margin-bottom: 16px; }
  .capa-titulo { font-size: clamp(32px, 8vw, 60px); margin-bottom: 16px; }
  .capa-sub { font-size: clamp(13px, 2vw, 16px); }
  .campea-trofeu { font-size: clamp(44px, 9vh, 84px); }
  .zebra-emoji, .final-emoji { font-size: clamp(40px, 8vh, 80px); }
  .escala-num { font-size: clamp(32px, 7vh, 54px); }
  .escala-card { padding: 16px 14px; }
  .par-ring { width: 120px; height: 120px; margin-bottom: 14px; }
  .par-pct { font-size: 30px; }
  .zd-placar, .gol-placar { font-size: clamp(38px, 9vh, 78px); }
  .campea-stats { gap: 28px; margin-top: 18px; }
  .cs-num { font-size: clamp(30px, 6vh, 48px); }
  .scroll-hint { margin-top: 24px; }
  .licao { padding: 14px 16px; }
  .licao-emoji { font-size: 28px; }
}

/* Paisagem propriamente dita: aproveita a largura extra */
@media (orientation: landscape) and (max-height: 620px) {
  .escala-grid { grid-template-columns: repeat(4, 1fr); max-width: 900px; }
  .par-split { flex-wrap: nowrap; gap: 28px; }
  .licoes-list { max-width: 840px; }
  .capa-titulo { font-size: clamp(36px, 7vw, 72px); }
}
@media (prefers-reduced-motion: reduce) {
  .retro-root { scroll-snap-type: none; }
  .cena * { transition: none !important; animation: none !important; }
  .kicker, .cena-h2, .capa-titulo, .capa-sub, .scroll-hint, .escala-card, .escala-foot,
  .campea-trofeu, .campea-nome, .campea-desc, .campea-stats, .podio-sub, .podio-col,
  .par-half, .zebra-emoji, .zd-match, .zd-cap, .zebra-card, .gol-hero, .gol-resto,
  .licao, .final-emoji, .final-titulo, .final-sub, .final-cta, .final-links { opacity: 1 !important; transform: none !important; }
}
`;
