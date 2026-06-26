"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import IconeIA from "@/components/IconeIA";
import { marcaDe } from "@/lib/ias";
import { SLUGS_SERIE_A } from "@/lib/serie-a";
import { track } from "@/lib/analytics";

// Slugs que têm arquivo de mascote em /public/mascots/<slug>.png (= Série A).
const COM_MASCOTE = new Set(SLUGS_SERIE_A);

type IA = {
  slug: string;
  nome_display: string;
  pontos: number;
};

type Frame = {
  jogoNum: number;
  rotulo: string;
  pts: Record<string, number>;
};

const LANE_H = 30; // altura de cada raia (px)
const ICON = 20;
const SPAN = 78; // % usada SÓ no empacotamento de raias (Y); o X agora é por câmera
const MIN_GAP = 6; // distância % mínima entre dois ícones na MESMA raia (final limpo)
const SEG_MS = 520; // tempo pra animar UM jogo — bem mais rápido que antes
const PAUSA_FINAL_MS = 4800; // pausa no fim: dá tempo do zoom-out revelar a chegada

// Câmera centrada no CENTRO DE MASSA do pelotão (média de pontos). half = meia-
// largura visível; quanto menor, mais zoom (diferenças mais evidentes). O mundo
// é medido em fração da corrida: w = pts / maxPts (w=1 = líder atual).
const MIN_HALF = 0.05; // meia-largura mínima ⇒ zoom MÁXIMO quando agrupados
const VIS_K = 1.9; // folga multiplicativa em torno dos extremos (espaçamento maior)
const EDGE_PAD = 0.03; // folga absoluta pras pontas não colarem na borda
const CAM_EASE = 0.1; // inércia: suavização do movimento da câmera por frame

// === Câmera de transmissão (follow contínuo) ===
// Como numa transmissão de atletismo/futebol: a câmera NUNCA perde o líder de
// vista e se move de forma contínua e fluida (sem cortes nem freadas pra segurar
// quadro estático). Enquadra do pelotão relevante até um pouco à frente do líder
// (lead room). Quando a briga na frente está acirrada, fecha suavemente nos
// primeiros; quando o pelotão espalha, abre. Sem "diretor" de planos discretos.
const LEAD_ROOM = 0.22; // espaço à frente do líder (fração do tamanho do pelotão)
const BACK_CAP = 0.55; // quanto, no máx., mostramos atrás do líder (fração da corrida)
const FRONT_TIGHT = 0.06; // gap (fração) abaixo do qual a briga na frente é acirrada
const TIGHT_CROP = 0.55; // o quanto cortamos do fundo pra focar a frente numa briga
const LEAD_MARGIN = 0.1; // margem mínima (fração da janela) que o líder guarda da borda
const KB_AMP_H = 0.05; // respiração de zoom (Ken Burns), bem sutil
const KB_W2 = (2 * Math.PI) / 8.5; // freq. da respiração de zoom (rad/s)
// Linha de chegada = FIM DA COPA inteira (104 jogos), bem distante; só aparece
// no zoom-out final.
const TOTAL_JOGOS = 104;
// Piso em faixas alternadas (parallax) — cor muda por FASE do torneio. A troca
// entre fases é SECA (sem degradê): cada fase tem uma cor radicalmente diferente.
const BAND_W = 0.038; // largura de cada faixa (fração da corrida)

// Piso é FUNDO: cores dessaturadas (não competem com os personagens). Cada
// matiz tem um claro e um escuro bem distintos (lê-se o parallax), e a troca de
// fase muda o matiz com clareza — azul (grupos) → rosa (16-avos) → etc.
const FASES = [
  { ini: 1, fim: 72, dark: "#1f3b5c", light: "#2f5685" }, // grupos — azul
  { ini: 73, fim: 88, dark: "#5a2746", light: "#883a68" }, // 16-avos — rosa
  { ini: 89, fim: 96, dark: "#5a3a22", light: "#875833" }, // oitavas — laranja
  { ini: 97, fim: 100, dark: "#1f4a34", light: "#2f704f" }, // quartas — verde
  { ini: 101, fim: 102, dark: "#3a2a5c", light: "#564088" }, // semis — roxo
  { ini: 103, fim: 104, dark: "#524a22", light: "#7d7033" }, // decisão — ouro
];

const clamp = (v: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, v));

// Cor (dark/light) da fase do jogo jn — troca seca, sem transição entre fases.
const coresFase = (jn: number) => {
  let i = FASES.findIndex((f) => jn >= f.ini && jn <= f.fim);
  if (i < 0) i = jn < 1 ? 0 : FASES.length - 1;
  return { dark: FASES[i].dark, light: FASES[i].light };
};

// Interpolação monotônica de Hermite (Fritsch–Carlson). Passa EXATAMENTE pelos
// pontos reais de cada jogo (y0 em t=0, y1 em t=1), mas com velocidade contínua
// entre segmentos: o personagem acelera e desacelera em vez de dar saltos
// abruptos. Como os pontos só crescem, nunca anda pra trás (sem overshoot).
const monoHermite = (
  yPrev: number,
  y0: number,
  y1: number,
  yNext: number,
  t: number,
) => {
  const d0 = y1 - y0; // secante do segmento atual
  const dm1 = y0 - yPrev; // secante anterior
  const d1 = yNext - y1; // secante seguinte
  let m0 = 0;
  let m1 = 0;
  // Tangente POR NÓ (não por segmento), pra a velocidade casar entre segmentos
  // vizinhos (C1). Como os pontos só crescem, a tangente num nó só zera quando a
  // secante ADJACENTE é zero — aí o corredor DESACELERA até parar (entrando num
  // jogo sem pontos) e ACELERA do zero ao sair, sem salto 0→100 nem freada seca.
  if (d0 !== 0) {
    m0 = dm1 === 0 ? 0 : (dm1 + d0) / 2;
    m1 = d1 === 0 ? 0 : (d0 + d1) / 2;
    if (m0 < 0) m0 = 0; // dados monotônicos (pontos só sobem)
    if (m1 < 0) m1 = 0;
    const a = m0 / d0;
    const b = m1 / d0;
    const s = a * a + b * b;
    if (s > 9) {
      const tau = 3 / Math.sqrt(s); // limita inclinação (sem overshoot)
      m0 = tau * a * d0;
      m1 = tau * b * d0;
    }
  }
  const t2 = t * t;
  const t3 = t2 * t;
  const h00 = 2 * t3 - 3 * t2 + 1;
  const h10 = t3 - 2 * t2 + t;
  const h01 = -2 * t3 + 3 * t2;
  const h11 = t3 - t2;
  return h00 * y0 + h10 * m0 + h01 * y1 + h11 * m1;
};

export default function CorridaTopDown({
  ias,
  frames,
}: {
  ias: IA[];
  frames: Frame[];
}) {
  // pos é um índice de frame CONTÍNUO (float). Entre dois frames inteiros a
  // posição é interpolada → corrida fluida, sem "anda e para". Cada inteiro
  // pousa exatamente na pontuação real daquele jogo (nada de trajetória falsa).
  const [pos, setPos] = useState(0);
  const [pausado, setPausado] = useState(false);
  // Nome ao lado do mascote: default escondido (só os bichinhos ficam mais
  // limpos visualmente). Usuário pode ligar via checkbox.
  const [mostrarNome, setMostrarNome] = useState(false);
  // Modo de câmera: "dinamico" = diretor cinematográfico (planos, Ken Burns);
  // "simples" = só segue o pelotão (enquadramento aberto, sem jogo de câmera).
  // O rAF lê via ref (a closure do tick captura o valor no mount).
  const [modoCamera, setModoCamera] = useState<"dinamico" | "simples">(
    "dinamico",
  );
  const modoRef = useRef<"dinamico" | "simples">("dinamico");
  modoRef.current = modoCamera;
  // Fullscreen do card.
  const cardRef = useRef<HTMLDivElement>(null);
  const [isFs, setIsFs] = useState(false);

  // Disparo único ao montar — engagement com Modo A.
  useEffect(() => {
    track("corrida_view", { modo: "A", ias_visiveis: ias.length });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const posRef = useRef(0);
  const lastRef = useRef(0);
  const rafRef = useRef(0);
  const esperandoFimRef = useRef(false);
  const segFastRef = useRef<boolean[]>([]);
  // Câmera no mundo: centro c + meia-largura h (fração da corrida).
  const camRef = useRef({ c: MIN_HALF, h: MIN_HALF });
  const [cam, setCam] = useState({ c: MIN_HALF, h: MIN_HALF });
  // Posição (fração) do líder no último frame de câmera — usada como trava de
  // segurança pra ele nunca sair de quadro, mesmo com a inércia da câmera.
  const leadRef = useRef(0);

  const ultimo = frames.length - 1;

  const irPara = (i: number) => {
    posRef.current = i;
    setPos(i);
    lastRef.current = performance.now();
    esperandoFimRef.current = false;
    const wf = wideFraming(i);
    camRef.current = { c: wf.c, h: wf.h };
    setCam({ c: wf.c, h: wf.h });
  };

  const ordenadas = useMemo(
    () =>
      [...ias].sort(
        (a, b) => b.pontos - a.pontos || a.slug.localeCompare(b.slug),
      ),
    [ias],
  );

  // Escala fixa do eixo X (maior pontuação em qualquer frame).
  const maxPts = useMemo(
    () =>
      Math.max(
        1,
        ...frames.flatMap((f) => ordenadas.map((ia) => f.pts[ia.slug] ?? 0)),
      ),
    [frames, ordenadas],
  );

  // Chegada = fim da Copa inteira. O líder atual (w=1) jogou `ultimo` jogos; a
  // Copa tem TOTAL_JOGOS ⇒ a chegada fica lá em w = TOTAL_JOGOS / ultimo.
  const worldFinish = TOTAL_JOGOS / Math.max(1, ultimo);

  // Estatísticas do pelotão na posição contínua p: w (fração) de cada IA agora,
  // e a ordem (ranking) nos frames inteiro a e b — pra detectar trocas de posição.
  const packStats = (p: number) => {
    const a = clamp(Math.floor(p), 0, ultimo);
    const b = clamp(a + 1, 0, ultimo);
    const fr = p - a;
    const arr = ordenadas.map((ia) => {
      const pa = frames[a]?.pts[ia.slug] ?? 0;
      const pb = frames[b]?.pts[ia.slug] ?? 0;
      return {
        slug: ia.slug,
        w: (pa + (pb - pa) * fr) / maxPts,
        wa: pa / maxPts,
        wb: pb / maxPts,
      };
    });
    let wMin = Infinity;
    let wMax = -Infinity;
    let soma = 0;
    for (const r of arr) {
      if (r.w < wMin) wMin = r.w;
      if (r.w > wMax) wMax = r.w;
      soma += r.w;
    }
    if (!Number.isFinite(wMin)) {
      wMin = 0;
      wMax = 0;
    }
    const centroid = arr.length ? soma / arr.length : 0;
    const byNow = [...arr].sort((x, y) => y.w - x.w);
    const orderA = [...arr].sort((x, y) => y.wa - x.wa);
    const orderB = [...arr].sort((x, y) => y.wb - x.wb);
    return { wMin, wMax, centroid, byNow, orderA, orderB };
  };

  // Plano aberto (estabelecimento): centro de massa + folga pra caber o pelotão.
  const wideFraming = (p: number) => {
    const s = packStats(p);
    const span = Math.max(s.wMax - s.centroid, s.centroid - s.wMin);
    let h = Math.max(MIN_HALF, span * VIS_K + EDGE_PAD);
    let c = s.centroid;
    if (c - h < 0) c = h;
    return { c, h };
  };

  // Alvo da câmera. reveal (fim): afasta da largada até a chegada. Fora isso,
  // FOLLOW contínuo de transmissão: enquadra do fundo relevante até um pouco à
  // frente do líder, fechando suavemente quando a briga na frente aperta. O
  // líder NUNCA sai de quadro; nada de cortes nem freadas pra segurar quadro.
  const cineTarget = (p: number, now: number) => {
    if (esperandoFimRef.current) {
      const left = -EDGE_PAD;
      const right = worldFinish + EDGE_PAD;
      leadRef.current = worldFinish;
      return {
        c: (left + right) / 2,
        h: Math.max(MIN_HALF, (right - left) / 2),
        reveal: true,
      };
    }
    const s = packStats(p);
    const wLead = s.byNow[0]?.w ?? 0;
    const wSecond = s.byNow[1]?.w ?? wLead;
    leadRef.current = wLead;

    // Fundo relevante: o pelotão, mas sem deixar um retardatário lá atrás obrigar
    // um zoom-out que apequena todo mundo. Limita o quanto mostramos atrás.
    const back = Math.max(s.wMin, wLead - BACK_CAP);
    const span = Math.max(0.0001, wLead - back);

    // Janela base: do fundo até um pouco à frente do líder (lead room).
    let left = back - EDGE_PAD;
    let right = wLead + span * LEAD_ROOM + EDGE_PAD;

    // Briga acirrada na frente ⇒ fecha nos primeiros: corta parte do fundo,
    // mantendo o líder e o 2º em quadro (foco na disputa, sem perder ninguém
    // importante). Contínuo (proporcional ao aperto), sem corte.
    const frontGap = wLead - wSecond;
    const tight = clamp(1 - frontGap / FRONT_TIGHT, 0, 1); // 1 = muito acirrada
    if (tight > 0) {
      const cropTo = wSecond - span * 0.18; // limite até onde o fundo recua
      left += (cropTo - left) * TIGHT_CROP * tight;
    }

    let h = Math.max(MIN_HALF, (right - left) / 2);
    let c = (left + right) / 2;

    // Modo simples: segue o pelotão sem respiração nem fechamento de disputa.
    if (modoRef.current === "simples") {
      const wf = wideFraming(p);
      leadRef.current = wLead;
      return { c: wf.c, h: wf.h, reveal: false };
    }

    // Respiração de zoom (Ken Burns) bem sutil — só vida, não desenquadra.
    h *= 1 + KB_AMP_H * Math.sin((now / 1000) * KB_W2);
    h = Math.max(MIN_HALF, h);

    // Trava: o líder guarda uma margem da borda direita (nunca sai de quadro).
    const margin = LEAD_MARGIN * (2 * h);
    if (wLead > c + h - margin) c = wLead - h + margin;
    if (c - h < 0) c = h;
    return { c, h, reveal: false };
  };

  // Sincroniza isFs com o estado real de fullscreen (inclui ESC do navegador).
  useEffect(() => {
    const onFs = () =>
      setIsFs(document.fullscreenElement === cardRef.current);
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      cardRef.current?.requestFullscreen?.();
    }
  };

  // Snap da câmera no estado inicial (antes do 1º frame de animação).
  useEffect(() => {
    const wf = wideFraming(0);
    camRef.current = { c: wf.c, h: wf.h };
    setCam({ c: wf.c, h: wf.h });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Segmento "rápido": jogo em que NINGUÉM pontuou (todos erraram) — anima na
  // metade do tempo. segFast[s] cobre a transição do frame s → s+1.
  const segFast = useMemo(() => {
    const arr: boolean[] = [];
    for (let s = 0; s < frames.length - 1; s++) {
      const a = frames[s].pts;
      const b = frames[s + 1].pts;
      arr[s] = ordenadas.every(
        (ia) => (b[ia.slug] ?? 0) === (a[ia.slug] ?? 0),
      );
    }
    return arr;
  }, [frames, ordenadas]);
  segFastRef.current = segFast;

  // Lanes DINÂMICAS, jogo a jogo: como uma corrida SEM raias fixas. Em cada
  // frame, processamos por X (desc) e cada IA tenta MANTER a faixa do frame
  // anterior; só sai dela quando alguém à frente está perto demais (< MIN_GAP)
  // — aí procura outro espaço. Resultado: atletas trocam de faixa pra brigar por
  // espaço, e a saída NÃO determina a posição final. Entre frames inteiros o Y
  // é interpolado ⇒ a troca de faixa vira um deslize orgânico.
  const { laneFrames, numLanes } = useMemo(() => {
    const lf: Record<string, number>[] = [];
    let prev: Record<string, number> = {};
    let maxLanes = 1;
    for (let k = 0; k < frames.length; k++) {
      const items = ordenadas
        .map((ia) => ({
          slug: ia.slug,
          x: clamp(((frames[k]?.pts[ia.slug] ?? 0) / maxPts) * SPAN, 0, SPAN),
        }))
        .sort((a, b) => b.x - a.x);
      const lanesLast: (number | undefined)[] = []; // último X ocupado por faixa
      const assign: Record<string, number> = {};
      const livre = (l: number, x: number) =>
        lanesLast[l] === undefined || (lanesLast[l] as number) - x >= MIN_GAP;
      for (const it of items) {
        let placed = -1;
        const pl = prev[it.slug];
        if (pl !== undefined && livre(pl, it.x)) placed = pl; // mantém a faixa
        if (placed < 0) {
          let l = 0;
          while (!livre(l, it.x)) l++; // primeira faixa livre (inclui buracos)
          placed = l;
        }
        lanesLast[placed] = it.x;
        assign[it.slug] = placed;
        if (placed + 1 > maxLanes) maxLanes = placed + 1;
      }
      lf.push(assign);
      prev = assign;
    }
    return { laneFrames: lf, numLanes: maxLanes };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ordenadas, frames, maxPts]);

  useEffect(() => {
    if (pausado || ultimo <= 0) return;
    lastRef.current = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(now - lastRef.current, 60); // ignora saltos (aba oculta)
      lastRef.current = now;
      if (!esperandoFimRef.current) {
        const seg = Math.min(Math.floor(posRef.current), ultimo - 1);
        const segDur = segFastRef.current[seg] ? SEG_MS / 2 : SEG_MS;
        let np = posRef.current + dt / segDur;
        if (np >= ultimo) {
          np = ultimo;
          esperandoFimRef.current = true;
          window.setTimeout(() => irPara(0), PAUSA_FINAL_MS);
        }
        posRef.current = np;
        setPos(np);
      }
      // Câmera roda SEMPRE — inclusive na pausa final, pro zoom-out revelar a
      // chegada. cineTarget dá o alvo; aqui só suavizamos (inércia/follow).
      const t = cineTarget(posRef.current, now);
      const c = camRef.current;
      c.c += (t.c - c.c) * CAM_EASE;
      c.h += (t.h - c.h) * CAM_EASE;
      // Trava de segurança PÓS-inércia: com o follow, a câmera atrasada nunca
      // pode deixar o líder escapar pela direita (como na TV: não se perde quem
      // está na frente). Não vale no zoom-out final (reveal).
      if (!t.reveal) {
        const margin = LEAD_MARGIN * (2 * c.h);
        if (leadRef.current > c.c + c.h - margin)
          c.c = leadRef.current - c.h + margin;
        if (c.c - c.h < 0) c.c = c.h;
      }
      setCam({ c: c.c, h: c.h });
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pausado, ultimo]);

  // Frame inteiro corrente (fA) e o próximo (fB); frac = progresso no segmento.
  const fA = Math.min(Math.floor(pos), ultimo);
  const fB = Math.min(fA + 1, ultimo);
  const frac = pos - fA;
  const emMovimento = fB > fA;
  // Rótulo: enquanto anima um segmento, mostra o jogo que está sendo apurado.
  const idxRotulo = emMovimento && frac > 0.001 ? fB : fA;
  const f = frames[idxRotulo];
  const alturaPista = numLanes * LANE_H + 14;

  // Converte fração-do-mundo w em % horizontal na tela, via janela da câmera.
  const camLeft = cam.c - cam.h;
  const camRight = cam.c + cam.h;
  const camW = Math.max(0.0001, cam.h * 2);
  const screenX = (w: number) => ((w - camLeft) / camW) * 100;
  const xLargada = screenX(0);
  const xChegada = screenX(worldFinish);

  // Faixas do piso visíveis na janela atual (parallax), coloridas por fase.
  const bandas: { b: number; left: number; w: number; bg: string }[] = [];
  {
    const b0 = Math.floor((camLeft - BAND_W) / BAND_W);
    const b1 = Math.ceil((camRight + BAND_W) / BAND_W);
    const wPct = (BAND_W / camW) * 100;
    for (let b = b0; b <= b1; b++) {
      // jogo aproximado representado por esta faixa (w → nº de jogo).
      const wMid = (b + 0.5) * BAND_W;
      const jn = clamp(Math.round(wMid * ultimo), 1, TOTAL_JOGOS);
      const cores = coresFase(jn);
      const dark = (((b % 2) + 2) % 2) === 0;
      bandas.push({
        b,
        left: screenX(b * BAND_W),
        w: wPct,
        bg: dark ? cores.dark : cores.light,
      });
    }
  }

  return (
    <div className="cn-card" ref={cardRef}>
      <div className="cn-header">
        <div className="cn-frame-info">
          <span className="cn-frame-lbl">
            {idxRotulo === 0 ? "INÍCIO" : `JOGO ${f?.jogoNum}`}
          </span>
          <span className="cn-frame-rotulo">{f?.rotulo ?? ""}</span>
        </div>
        <div className="cn-controles">
          <label className="cn-check" title="Mostrar nome ao lado de cada IA">
            <input
              type="checkbox"
              checked={mostrarNome}
              onChange={(e) => {
                setMostrarNome(e.target.checked);
                track("corrida_toggle_nome", {
                  modo: "A",
                  ligado: e.target.checked,
                });
              }}
            />
            <span>nome</span>
          </label>
          <button
            onClick={() => {
              setPausado((p) => {
                track(p ? "corrida_play" : "corrida_pause", { modo: "A" });
                return !p;
              });
            }}
            className="cn-btn"
          >
            {pausado ? "▶ Tocar" : "⏸ Pausar"}
          </button>
          <button
            onClick={() => {
              track("corrida_restart", { modo: "A" });
              irPara(0);
            }}
            className="cn-btn"
          >
            ⟲ Início
          </button>
          <button
            onClick={() => {
              setModoCamera((m) => {
                const novo = m === "dinamico" ? "simples" : "dinamico";
                track("corrida_modo_camera", { modo: "A", camera: novo });
                return novo;
              });
            }}
            className="cn-btn"
            title="Alternar entre câmera dinâmica (cinematográfica) e simples (segue o pelotão)"
          >
            {modoCamera === "dinamico" ? "🎬 Câmera dinâmica" : "📷 Câmera simples"}
          </button>
          <button
            onClick={() => {
              track("corrida_fullscreen", { modo: "A", entrando: !isFs });
              toggleFullscreen();
            }}
            className="cn-btn"
            title={isFs ? "Sair da tela cheia" : "Tela cheia"}
          >
            {isFs ? "✕ Sair" : "⛶ Tela cheia"}
          </button>
        </div>
      </div>

      <div className="cn-progress">
        {frames.map((fr, i) => (
          <button
            key={i}
            className={`cn-progress-tick ${i <= pos ? "ativo" : ""}`}
            onClick={() => irPara(i)}
            title={fr.rotulo}
            aria-label={`Pular para ${fr.rotulo}`}
          />
        ))}
      </div>

      <div className="cn-pista" style={{ height: alturaPista }}>
        {bandas.map((bd) => (
          <div
            key={bd.b}
            className="cn-band"
            style={{
              left: `${bd.left}%`,
              width: `${bd.w}%`,
              background: bd.bg,
            }}
          />
        ))}

        {ordenadas.map((ia, idx) => {
          const ptsPrev = frames[Math.max(fA - 1, 0)]?.pts[ia.slug] ?? 0;
          const ptsA = frames[fA]?.pts[ia.slug] ?? 0;
          const ptsB = frames[fB]?.pts[ia.slug] ?? 0;
          const ptsNext = frames[Math.min(fB + 1, ultimo)]?.pts[ia.slug] ?? 0;
          // posição com suavização monotônica: passa exata na pontuação de cada
          // jogo, mas acelera/desacelera em vez de saltar.
          const ptsNow = monoHermite(ptsPrev, ptsA, ptsB, ptsNext, frac);
          const ptsLabel = Math.round(ptsNow);
          const wNow = clamp(ptsNow / maxPts, 0, 1);
          // Velocidade INSTANTÂNEA (derivada da curva monotônica): rápida no meio
          // do segmento, ~0 parado. Alimenta o balanço (swing) — quem corre mais
          // rápido balança mais; quem está parado fica quieto.
          const velRaw =
            (monoHermite(ptsPrev, ptsA, ptsB, ptsNext, Math.min(frac + 0.03, 1)) -
              monoHermite(
                ptsPrev,
                ptsA,
                ptsB,
                ptsNext,
                Math.max(frac - 0.03, 0),
              )) /
            0.06;
          const sw = clamp(Math.abs(velRaw) / 10, 0, 1);
          // Faixa (Y) interpolada entre os frames inteiros ⇒ troca de faixa vira
          // um deslize suave (corrida sem raias).
          const laneA = laneFrames[fA]?.[ia.slug] ?? 0;
          const laneB = laneFrames[fB]?.[ia.slug] ?? laneA;
          const le = frac * frac * (3 - 2 * frac); // smoothstep no eixo Y
          const lane = laneA + (laneB - laneA) * le;
          const marca = marcaDe(ia.slug);
          const temMascote = COM_MASCOTE.has(ia.slug);
          // "Bateu": errou completamente o jogo em apuração (ganhou 0 ponto).
          const bateu = emMovimento && ptsB - ptsA === 0;
          // Cada IA ganha um delay próprio pra não saltitar em uníssono.
          const swingDelay = `-${(idx * 0.137) % 0.9}s`;
          return (
            <div
              key={ia.slug}
              className={`cn-runner${bateu ? " batendo" : ""}${
                emMovimento && !pausado ? " correndo" : ""
              }`}
              title={`${ia.nome_display} — ${ptsLabel} pts`}
              style={{
                top: `${lane * LANE_H + LANE_H / 2 + 6}px`,
                left: `${screenX(wNow)}%`,
                zIndex: Math.round(ptsNow) + 10,
                ["--cor" as string]: marca.cor,
                ["--swing-delay" as string]: swingDelay,
                ["--sw" as string]: sw.toFixed(3),
              }}
            >
              {bateu && <span className="cn-fumaca" aria-hidden>💨</span>}
              {mostrarNome && (
                <span className="cn-nome">{ia.nome_display}</span>
              )}
              <span className="cn-pts">{ptsLabel}</span>
              {temMascote ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  className="cn-mascote"
                  src={`/mascots/${ia.slug}.png`}
                  alt={ia.nome_display}
                />
              ) : (
                <span className="cn-marca">
                  <IconeIA slug={ia.slug} size={26} />
                </span>
              )}
            </div>
          );
        })}

        {xLargada > -8 && xLargada < 108 && (
          <div className="cn-largada" style={{ left: `${xLargada}%` }}>
            <span>🚦</span>
          </div>
        )}
        {xChegada > -8 && xChegada < 112 && (
          <>
            <div
              className="cn-chegada"
              style={{ left: `${xChegada}%` }}
              aria-hidden
            />
            <div className="cn-bandeira" style={{ left: `${xChegada}%` }}>
              🏁
            </div>
          </>
        )}
      </div>

      <p className="cn-legenda">
        Câmera de transmissão: segue o pelotão de forma contínua e nunca perde o
        líder de vista; fecha nos primeiros quando a briga aperta e abre quando
        espalha. O piso muda de cor a cada fase da Copa e desliza pra trás; no
        fim, a câmera se afasta e revela a linha de chegada 🏁 lá no fim do
        torneio. Empatadas dividem a faixa — passe o dedo/mouse pra ver o nome.
      </p>

      <style>{`
        .cn-card {
          background: linear-gradient(135deg, #0a0d1a 0%, #1a1238 100%);
          border: 2px solid rgba(168, 85, 247, 0.4);
          border-radius: var(--r-l);
          padding: 16px;
          overflow: hidden;
        }
        /* Em tela cheia o card ocupa toda a viewport e centraliza a pista. */
        .cn-card:fullscreen {
          width: 100vw; height: 100vh;
          border-radius: 0; border: none;
          padding: 24px;
          display: flex; flex-direction: column;
          justify-content: center;
        }
        .cn-card:fullscreen .cn-pista { flex: 1; min-height: 0; }
        .cn-header {
          display: flex; align-items: center; justify-content: space-between;
          gap: 14px; flex-wrap: wrap; margin-bottom: 10px;
        }
        .cn-frame-info { display: flex; flex-direction: column; min-width: 0; flex: 1; }
        .cn-frame-lbl {
          font-family: var(--ff-mono);
          font-size: 11px; font-weight: 900;
          color: #c084fc;
          letter-spacing: 0.1em;
        }
        .cn-frame-rotulo {
          font-family: var(--ff-display);
          font-size: 16px; font-weight: 800;
          color: #fff;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .cn-controles { display: flex; gap: 8px; }
        .cn-btn {
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.15);
          padding: 7px 12px;
          font-size: 12px; font-weight: 700;
          color: rgba(255,255,255,0.85);
          border-radius: var(--r-s);
          cursor: pointer;
        }
        .cn-btn:hover { background: rgba(255,255,255,0.12); }
        .cn-check {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 6px 10px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: var(--r-s);
          font-family: var(--ff-mono);
          font-size: 11px; font-weight: 700;
          color: rgba(255,255,255,0.75);
          cursor: pointer;
          user-select: none;
        }
        .cn-check input { margin: 0; accent-color: #a855f7; cursor: pointer; }
        .cn-progress { display: flex; gap: 3px; margin-bottom: 12px; }
        .cn-progress-tick {
          flex: 1; height: 6px;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 3px;
          cursor: pointer; padding: 0;
          transition: background 0.3s;
        }
        .cn-progress-tick.ativo { background: #a855f7; border-color: #a855f7; }
        .cn-pista {
          position: relative;
          width: 100%;
          background: #0a1c33;
          border-radius: var(--r-m);
          overflow: hidden;
        }
        /* Faixas alternadas do piso (parallax): deslizam pra trás. */
        .cn-band {
          position: absolute;
          top: 0; bottom: 0;
          z-index: 0;
        }
        /* Brilho central por cima das faixas, sem tapar os corredores. */
        .cn-pista::after {
          content: "";
          position: absolute; inset: 0;
          background: radial-gradient(ellipse at center, rgba(168,85,247,0.10), transparent 72%);
          z-index: 1; pointer-events: none;
        }
        .cn-largada {
          position: absolute;
          top: 0; bottom: 0;
          width: 30px;
          transform: translateX(-50%);
          background: linear-gradient(90deg, rgba(0,156,59,0.30), transparent);
          display: flex; align-items: center; justify-content: center;
          font-size: 18px; z-index: 2;
        }
        .cn-chegada {
          position: absolute;
          top: 0; bottom: 0;
          width: 10px;
          transform: translateX(-50%);
          background: repeating-linear-gradient(45deg, #fff 0 6px, #000 6px 12px);
          opacity: 0.85; z-index: 2;
        }
        .cn-bandeira {
          position: absolute;
          top: -8px;
          transform: translateX(-50%);
          font-size: 24px; z-index: 3;
        }
        .cn-runner {
          position: absolute;
          transform: translate3d(-100%, -50%, 0);
          will-change: left, top;
          backface-visibility: hidden;
          display: flex; align-items: center; gap: 4px;
          white-space: nowrap;
          pointer-events: auto;
        }
        .cn-marca {
          flex-shrink: 0;
          width: ${ICON + 6}px; height: ${ICON + 6}px;
          display: inline-flex;
          align-items: center; justify-content: center;
          background: transparent;
          filter: drop-shadow(0 2px 3px rgba(0,0,0,0.55));
        }
        .cn-mascote {
          flex-shrink: 0;
          width: 38px; height: 38px;
          object-fit: contain;
          background: transparent;
          border: none;
          /* sombra suave por baixo, sem moldura */
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.55));
        }
        .cn-runner.batendo .cn-mascote {
          animation: cn-rodopio 0.5s linear infinite;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.55))
                  drop-shadow(0 0 6px #ef4444);
        }
        .cn-nome {
          font-family: var(--ff-display);
          font-weight: 800;
          font-size: 9px;
          color: rgba(255,255,255,0.95);
          text-shadow: 0 1px 3px #000, 0 0 6px rgba(168,85,247,0.6);
          max-width: 58px;
          overflow: hidden; text-overflow: ellipsis;
        }
        .cn-pts {
          font-family: var(--ff-mono);
          font-size: 9px; font-weight: 800;
          color: #fbbf24;
          background: rgba(0,0,0,0.65);
          padding: 0 4px; border-radius: 5px;
          flex-shrink: 0;
        }
        .cn-legenda {
          margin-top: 10px;
          font-family: var(--ff-mono);
          font-size: 11px;
          color: rgba(255,255,255,0.5);
          line-height: 1.5;
        }
        @keyframes cn-rodopio {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        /* Gait: saltita e pendula com AMPLITUDE proporcional à velocidade atual
           (--sw, 0..1) — quem corre mais rápido balança mais; parado fica quieto.
           Cada IA tem um --swing-delay próprio pra ficar desencontrado. */
        @keyframes cn-trote {
          0%   { transform: translateY(0) rotate(calc(var(--sw, 0) * -4deg)); }
          25%  { transform: translateY(calc(var(--sw, 0) * -2.5px)) rotate(0deg); }
          50%  { transform: translateY(0) rotate(calc(var(--sw, 0) * 4deg)); }
          75%  { transform: translateY(calc(var(--sw, 0) * -2.5px)) rotate(0deg); }
          100% { transform: translateY(0) rotate(calc(var(--sw, 0) * -4deg)); }
        }
        .cn-runner.correndo:not(.batendo) .cn-mascote,
        .cn-runner.correndo:not(.batendo) .cn-marca {
          /* mais rápido ⇒ ciclo mais curto (pernada mais acelerada) */
          animation: cn-trote calc(0.7s - var(--sw, 0) * 0.35s) ease-in-out infinite;
          animation-delay: var(--swing-delay, 0s);
          transform-origin: 50% 85%;
        }
        @keyframes cn-fumacinha {
          0%   { opacity: 0;   transform: translate(0, 0) scale(0.4); }
          25%  { opacity: 0.9; }
          100% { opacity: 0;   transform: translate(-12px, -14px) scale(1.5); }
        }
        @keyframes cn-tremor {
          0%, 100% { margin-top: 0; }
          25% { margin-top: -1px; }
          75% { margin-top: 1px; }
        }
        .cn-runner.batendo { animation: cn-tremor 0.18s linear infinite; }
        .cn-runner.batendo .cn-marca {
          animation: cn-rodopio 0.5s linear infinite;
          filter: drop-shadow(0 2px 3px rgba(0,0,0,0.55))
                  drop-shadow(0 0 6px #ef4444);
        }
        .cn-fumaca {
          position: absolute;
          left: -4px; top: -10px;
          font-size: 14px;
          pointer-events: none;
          z-index: 4;
          animation: cn-fumacinha 0.7s ease-out infinite;
        }
      `}</style>
    </div>
  );
}
