"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";

export default function EntrarPublicoButton({
  bolaoId,
  slug,
}: {
  bolaoId: string;
  slug: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [modalAberto, setModalAberto] = useState(false);

  async function confirmar() {
    setLoading(true);
    setModalAberto(false);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push(`/login?redirect=/bolao/${slug}`);
      return;
    }
    // 1. Entrar no bolão
    await supabase
      .from("bolao_membro")
      .upsert(
        { bolao_id: bolaoId, user_id: user.id },
        { onConflict: "bolao_id,user_id", ignoreDuplicates: true },
      );
    // 2. Tornar palpites públicos no ranking geral
    await supabase
      .from("profiles")
      .update({ opt_in_geral: true })
      .eq("id", user.id);

    router.push(`/bolao/${slug}/palpitar`);
    router.refresh();
  }

  return (
    <>
      <button
        onClick={() => setModalAberto(true)}
        disabled={loading}
        className="btn primary"
      >
        {loading ? "Entrando…" : "🎯 Entrar no bolão →"}
      </button>

      {modalAberto && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.65)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 16px",
          }}
          onClick={() => setModalAberto(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--bg-0)",
              borderRadius: 20,
              padding: "32px 28px",
              maxWidth: 480,
              width: "100%",
              boxShadow: "0 24px 80px rgba(0,0,0,0.45)",
              border: "1px solid var(--line-strong)",
            }}
          >
            <div
              style={{
                fontSize: 44,
                textAlign: "center",
                marginBottom: 16,
                lineHeight: 1,
              }}
            >
              🌍
            </div>
            <h2
              style={{
                textAlign: "center",
                fontSize: 22,
                marginBottom: 12,
                lineHeight: 1.2,
              }}
            >
              Seus palpites ficam públicos
            </h2>
            <p
              style={{
                color: "var(--fg-mid)",
                fontSize: 15,
                lineHeight: 1.6,
                marginBottom: 20,
                textAlign: "center",
              }}
            >
              Este é o bolão público{" "}
              <strong>Humanos × IAs</strong>. Ao entrar, seus palpites
              aparecem no{" "}
              <strong>Ranking Geral</strong> — todo mundo pode ver como você
              foi comparado às 122 IAs.
            </p>
            <div
              style={{
                background: "color-mix(in srgb, var(--primary) 8%, transparent)",
                border: "1px solid color-mix(in srgb, var(--primary) 20%, transparent)",
                borderRadius: 12,
                padding: "12px 16px",
                marginBottom: 24,
                fontSize: 14,
                color: "var(--fg-mid)",
                lineHeight: 1.5,
              }}
            >
              Ao confirmar: você entra no bolão <em>e</em> seus palpites
              passam a aparecer no Ranking Geral automaticamente.{" "}
              Você pode sair do ranking a qualquer momento pelo perfil.
            </div>
            <div style={{ display: "flex", gap: 12, flexDirection: "column" }}>
              <button
                onClick={confirmar}
                disabled={loading}
                className="btn primary"
                style={{ width: "100%", fontSize: 16, padding: "14px 0" }}
              >
                ✅ Topa — entrar e tornar público
              </button>
              <button
                onClick={() => setModalAberto(false)}
                className="btn"
                style={{ width: "100%", fontSize: 15 }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
