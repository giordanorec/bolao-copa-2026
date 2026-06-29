"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import Avatar from "@/components/Avatar";
import { uploadAvatar } from "@/app/perfil/avatar-actions";

const AVATAR_PROMPT_KEY = "avatar_prompt_dismissed";

// Textos em 4 idiomas
type Locale = "pt" | "en" | "es" | "fr";
const TEXTS: Record<
  Locale,
  { titulo: string; corpo: string; escolher: string; agora_nao: string }
> = {
  pt: {
    titulo: "Dá um rosto pra você!",
    corpo:
      "Sua foto vai aparecer no ranking ao lado do seu nome. Ajuda a galera te reconhecer.",
    escolher: "Escolher foto",
    agora_nao: "Agora não",
  },
  en: {
    titulo: "Put a face to your name!",
    corpo:
      "Your photo will show next to your name in the ranking. It helps everyone recognize you.",
    escolher: "Choose photo",
    agora_nao: "Not now",
  },
  es: {
    titulo: "¡Dale una cara a tu perfil!",
    corpo:
      "Tu foto aparecerá en el ranking junto a tu nombre. Ayuda a que todos te reconozcan.",
    escolher: "Elegir foto",
    agora_nao: "Ahora no",
  },
  fr: {
    titulo: "Mettez un visage sur votre nom !",
    corpo:
      "Votre photo apparaîtra dans le classement à côté de votre nom. Cela aide tout le monde à vous reconnaître.",
    escolher: "Choisir une photo",
    agora_nao: "Pas maintenant",
  },
};

function getLocale(): Locale {
  if (typeof window === "undefined") return "pt";
  const lang = navigator.language?.slice(0, 2).toLowerCase();
  if (lang === "en") return "en";
  if (lang === "es") return "es";
  if (lang === "fr") return "fr";
  return "pt";
}

function jaDispensou(): boolean {
  try {
    return localStorage.getItem(AVATAR_PROMPT_KEY) === "true";
  } catch {
    return false;
  }
}

function dispensar() {
  try {
    localStorage.setItem(AVATAR_PROMPT_KEY, "true");
  } catch {}
}

export default function EntrarPublicoButton({
  bolaoId,
  slug,
}: {
  bolaoId: string;
  slug: string;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [modalAberto, setModalAberto] = useState(false);
  const [modalAvatar, setModalAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [msgAvatar, setMsgAvatar] = useState<string | null>(null);
  const [uploadando, setUploadando] = useState(false);
  const [nomeUsuario, setNomeUsuario] = useState("?");
  const loc = TEXTS[getLocale()];

  async function confirmar() {
    setLoading(true);
    setModalAberto(false);
    setModalAvatar(false);
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

  async function handleEntrar() {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push(`/login?redirect=/bolao/${slug}`);
      return;
    }

    // Checar se já tem avatar ou se já dispensou o prompt
    if (!jaDispensou()) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("avatar_url, display_name")
        .eq("id", user.id)
        .single();

      const semAvatar = !profile?.avatar_url;
      setNomeUsuario(profile?.display_name ?? "?");

      if (semAvatar) {
        // Mostrar prompt de avatar antes do modal de confirmação
        setModalAvatar(true);
        return;
      }
    }

    setModalAberto(true);
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;

    const localUrl = URL.createObjectURL(arquivo);
    setAvatarPreview(localUrl);
    setUploadando(true);
    setMsgAvatar(null);

    const fd = new FormData();
    fd.append("avatar", arquivo);

    const res = await uploadAvatar(fd);
    setUploadando(false);

    if (res.ok) {
      setAvatarPreview(res.url);
      dispensar();
      // Fecha o prompt de avatar e abre o de confirmação
      setModalAvatar(false);
      setModalAberto(true);
    } else {
      setAvatarPreview(null);
      setMsgAvatar("Erro: " + res.erro);
    }

    e.target.value = "";
  }

  function handleAgora_nao() {
    dispensar();
    setModalAvatar(false);
    setModalAberto(true);
  }

  return (
    <>
      <button
        onClick={handleEntrar}
        disabled={loading}
        className="btn primary"
      >
        {loading ? "Entrando..." : "Entrar no bolao →"}
      </button>

      {/* ── Modal: prompt de avatar ── */}
      {modalAvatar && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.65)",
            zIndex: 1001,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 16px",
          }}
          onClick={handleAgora_nao}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--bg-0)",
              borderRadius: 20,
              padding: "32px 28px",
              maxWidth: 420,
              width: "100%",
              boxShadow: "0 24px 80px rgba(0,0,0,0.45)",
              border: "1px solid var(--line-strong)",
              textAlign: "center",
            }}
          >
            {/* Avatar preview */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginBottom: 16,
              }}
            >
              <Avatar
                src={avatarPreview}
                nome={nomeUsuario}
                size={80}
              />
            </div>

            <h2
              style={{
                fontSize: 20,
                marginBottom: 10,
                lineHeight: 1.2,
                color: "var(--fg)",
              }}
            >
              {loc.titulo}
            </h2>
            <p
              style={{
                color: "var(--fg-mid)",
                fontSize: 14,
                lineHeight: 1.6,
                marginBottom: 24,
              }}
            >
              {loc.corpo}
            </p>

            {msgAvatar && (
              <p
                style={{
                  fontSize: 13,
                  color: "var(--err, #dc2626)",
                  marginBottom: 12,
                }}
              >
                {msgAvatar}
              </p>
            )}

            <div
              style={{ display: "flex", flexDirection: "column", gap: 10 }}
            >
              <button
                type="button"
                disabled={uploadando}
                onClick={() => fileInputRef.current?.click()}
                className="btn primary"
                style={{ width: "100%", fontSize: 15, padding: "12px 0" }}
              >
                {uploadando ? "Enviando..." : loc.escolher}
              </button>
              <button
                type="button"
                onClick={handleAgora_nao}
                className="btn"
                style={{ width: "100%", fontSize: 14 }}
              >
                {loc.agora_nao}
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              style={{ display: "none" }}
              onChange={handleFileChange}
              aria-label="Escolher foto de perfil"
            />
          </div>
        </div>
      )}

      {/* ── Modal: confirmação de bolao publico ── */}
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
                background:
                  "color-mix(in srgb, var(--primary) 8%, transparent)",
                border:
                  "1px solid color-mix(in srgb, var(--primary) 20%, transparent)",
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
                Topa — entrar e tornar público
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
