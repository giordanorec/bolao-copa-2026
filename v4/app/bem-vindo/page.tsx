"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

const SLIDES = [
  {
    emoji: "👋",
    titulo: "Bora!",
    desc: "Te explico em 30 segundos o que dá pra fazer aqui.",
  },
  {
    emoji: "⚽",
    titulo: "Palpita 104 jogos",
    desc: "Os 104 jogos da Copa 2026 estão prontos. Você palpita o placar de cada um. Auto-salva. Pode editar até o jogo começar.",
  },
  {
    emoji: "🤖",
    titulo: "Aproveite as 122 IAs",
    desc: "ChatGPT, Claude, Gemini, Grok e mais 118 modelos já palpitaram. Você pode copiar o palpite de qualquer uma delas num clique.",
  },
  {
    emoji: "🎯",
    titulo: "Bolões privados",
    desc: "Cria um bolão, copia o link, manda no grupo do WhatsApp. Ranking automático entre vocês — e contra as 122 IAs.",
  },
  {
    emoji: "🚀",
    titulo: "Bora começar?",
    desc: "Cria teu primeiro bolão agora ou já entra num pra ver as IAs em ação.",
  },
];

function BemVindoCarrossel() {
  const router = useRouter();
  const params = useSearchParams();
  const redirect = params.get("redirect") || "/dashboard";
  const [i, setI] = useState(0);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight") setI((x) => Math.min(x + 1, SLIDES.length - 1));
      if (e.key === "ArrowLeft") setI((x) => Math.max(x - 1, 0));
      if (e.key === "Escape") concluir();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function concluir() {
    try {
      localStorage.setItem("v4-onboard-feito", "1");
    } catch {}
    router.push(redirect);
  }

  const isUltimo = i === SLIDES.length - 1;
  const slide = SLIDES[i];

  return (
    <div className="onboard-page">
      <div className="onboard-card">
        <button className="onboard-pular" onClick={concluir}>
          Pular →
        </button>

        <div className="onboard-emoji">{slide.emoji}</div>
        <h1>{slide.titulo}</h1>
        <p>{slide.desc}</p>

        <div className="onboard-dots">
          {SLIDES.map((_, k) => (
            <button
              key={k}
              type="button"
              onClick={() => setI(k)}
              className={`onboard-dot ${k === i ? "is-current" : ""}`}
              aria-label={`Slide ${k + 1}`}
            />
          ))}
        </div>

        <div className="onboard-actions">
          {i > 0 && (
            <button
              type="button"
              onClick={() => setI((x) => Math.max(x - 1, 0))}
              className="btn"
            >
              ← Voltar
            </button>
          )}
          {!isUltimo ? (
            <button
              type="button"
              onClick={() => setI((x) => Math.min(x + 1, SLIDES.length - 1))}
              className="btn primary"
              style={{ marginLeft: "auto" }}
            >
              Próximo →
            </button>
          ) : (
            <div style={{ display: "flex", gap: 10, marginLeft: "auto", flexWrap: "wrap" }}>
              <Link
                href="/criar"
                onClick={() => {
                  try {
                    localStorage.setItem("v4-onboard-feito", "1");
                  } catch {}
                }}
                className="btn"
              >
                🎯 Criar bolão
              </Link>
              <button onClick={concluir} className="btn primary">
                🚀 Bora →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function BemVindoPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40 }}>Carregando…</div>}>
      <BemVindoCarrossel />
    </Suspense>
  );
}
