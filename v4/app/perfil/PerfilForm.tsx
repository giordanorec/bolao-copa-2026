"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase-browser";

type Inicial = {
  display_name: string;
  instagram: string;
  whatsapp: string;
  opt_in_geral: boolean;
};

export default function PerfilForm({
  inicial,
  email,
}: {
  inicial: Inicial;
  email: string;
}) {
  const [nome, setNome] = useState(inicial.display_name);
  const [ig, setIg] = useState(inicial.instagram);
  const [zap, setZap] = useState(inicial.whatsapp);
  const [opt, setOpt] = useState(inicial.opt_in_geral);
  const [salvando, setSalvando] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    setMsg(null);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: nome.trim(),
        instagram: ig.trim() || null,
        whatsapp: zap.trim() || null,
        opt_in_geral: opt,
      })
      .eq("id", user.id);
    if (error) setMsg("❌ " + error.message);
    else setMsg("✅ Salvo!");
    setSalvando(false);
    setTimeout(() => setMsg(null), 3000);
  }

  return (
    <>
      <p className="lede-form">
        Você pode editar a qualquer momento.
      </p>
      <form onSubmit={salvar}>
        <div className="form-group">
          <label className="label" htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            className="input"
            value={email}
            disabled
            style={{ opacity: 0.7 }}
          />
          <span className="input-hint">não dá pra mudar (por enquanto)</span>
        </div>

        <div className="form-group">
          <label className="label" htmlFor="nome">Nome de exibição</label>
          <input
            id="nome"
            className="input"
            required
            minLength={2}
            value={nome}
            onChange={(e) => setNome(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="label" htmlFor="ig">Instagram (opcional)</label>
          <input
            id="ig"
            className="input"
            placeholder="@seuusuario"
            value={ig}
            onChange={(e) => setIg(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="label" htmlFor="zap">WhatsApp (opcional)</label>
          <input
            id="zap"
            className="input"
            placeholder="+55 81 9XXXX-XXXX"
            value={zap}
            onChange={(e) => setZap(e.target.value)}
          />
        </div>

        <div
          className="form-group"
          style={{
            background: "var(--bg-1)",
            padding: 20,
            borderRadius: "var(--r-m)",
            border: "1px solid var(--line)",
          }}
        >
          <label
            style={{
              display: "flex",
              gap: 12,
              cursor: "pointer",
              alignItems: "flex-start",
            }}
          >
            <input
              type="checkbox"
              checked={opt}
              onChange={(e) => setOpt(e.target.checked)}
              style={{ marginTop: 4, width: 20, height: 20 }}
            />
            <span>
              <strong>Entrar no Ranking Geral</strong>
              <br />
              <span style={{ color: "var(--fg-muted)", fontSize: 14 }}>
                Seus palpites aparecem em{" "}
                <a href="/ranking-geral" style={{ color: "var(--primary)" }}>
                  /ranking-geral
                </a>{" "}
                disputando contra as 121 IAs + Bola de Cristal. Pode desativar
                a qualquer momento.
              </span>
            </span>
          </label>
        </div>

        {msg && (
          <p
            className="err"
            style={{
              background: msg.startsWith("✅")
                ? "rgba(0,166,153,0.08)"
                : undefined,
              borderColor: msg.startsWith("✅")
                ? "rgba(0,166,153,0.20)"
                : undefined,
              color: msg.startsWith("✅")
                ? "var(--accent-3)"
                : undefined,
            }}
          >
            {msg}
          </p>
        )}

        <button
          type="submit"
          disabled={salvando}
          className="btn primary block"
        >
          {salvando ? "Salvando..." : "Salvar"}
        </button>
      </form>
    </>
  );
}
