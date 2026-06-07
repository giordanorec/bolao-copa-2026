"use client";

import { useEffect, useState } from "react";

const TEMAS = [
  { value: "airbnb", label: "🏠 Airbnb" },
  { value: "festivo-br", label: "🇧🇷 Festivo BR" },
  { value: "apple", label: "🍎 Apple HIG" },
  { value: "nike", label: "👟 Nike" },
  { value: "stripe-press", label: "📚 Stripe Press" },
  { value: "notion", label: "📝 Notion" },
  { value: "spotify", label: "🎵 Spotify" },
  { value: "geist", label: "▮ Vercel/Geist" },
  { value: "linear", label: "◇ Linear" },
  { value: "anthropic", label: "📜 Anthropic" },
  { value: "carnaval", label: "🎉 Carnaval" },
  { value: "tropical", label: "🌴 Tropical" },
];

export default function ThemeSwitcher() {
  const [tema, setTema] = useState<string>("airbnb");
  const [aberto, setAberto] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("v4-tema");
    if (saved) {
      document.body.dataset.theme = saved;
      setTema(saved);
    } else {
      document.body.dataset.theme = "airbnb";
    }
    if (localStorage.getItem("v4-tema-fechado") === "1") {
      document.body.classList.add("theme-switcher-closed");
    } else {
      setAberto(true);
    }
  }, []);

  function trocar(v: string) {
    document.body.dataset.theme = v;
    localStorage.setItem("v4-tema", v);
    setTema(v);
  }

  function toggle() {
    const novo = !aberto;
    setAberto(novo);
    if (novo) {
      document.body.classList.remove("theme-switcher-closed");
      localStorage.removeItem("v4-tema-fechado");
    } else {
      document.body.classList.add("theme-switcher-closed");
      localStorage.setItem("v4-tema-fechado", "1");
    }
  }

  return (
    <div className="theme-switcher" aria-label="Escolha do tema visual">
      <h6>🎨 escolha um tema</h6>
      {TEMAS.map((t) => (
        <label key={t.value}>
          <input
            type="radio"
            name="theme"
            value={t.value}
            checked={tema === t.value}
            onChange={() => trocar(t.value)}
          />
          {" "}
          {t.label}
        </label>
      ))}
      <button
        className="toggle-btn"
        title={aberto ? "fechar" : "abrir"}
        onClick={toggle}
      >
        🎨
      </button>
    </div>
  );
}
