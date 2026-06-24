"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase-browser";

// Hashes SHA-256 dos emails admin. Comparação server-side acontece em /admin
// — aqui é só pra decidir mostrar/esconder o link no menu.
const ADMIN_EMAIL_HASHES = new Set([
  "3af6dac2945f81befdd61bfd0ca2562c72c98386d42a1301debb2466de0ad287", // grec@cin.ufpe.br
  "5fc13b2b727324dd5cb5cba74975bd87d23cab9d7e72aabb78464cc5c8c430ed", // pontes05@gmail.com
]);

async function checarAdmin(email: string | null | undefined): Promise<boolean> {
  if (!email) return false;
  try {
    const enc = new TextEncoder().encode(email.toLowerCase().trim());
    const buf = await crypto.subtle.digest("SHA-256", enc);
    const hex = Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    return ADMIN_EMAIL_HASHES.has(hex);
  } catch {
    return false;
  }
}

export default function UserWidget({
  onNavigate,
}: { onNavigate?: () => void } = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const [nome, setNome] = useState<string | null>(null);
  const [admin, setAdmin] = useState(false);
  const [carregado, setCarregado] = useState(false);
  const [aberto, setAberto] = useState(false);

  useEffect(() => {
    let alive = true;
    const supabase = createClient();
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!alive) return;
      if (!user) {
        setNome(null);
        setAdmin(false);
        setCarregado(true);
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", user.id)
        .single();
      setNome((profile as { display_name?: string } | null)?.display_name ?? user.email ?? null);
      const ehAdmin = await checarAdmin(user.email);
      if (!alive) return;
      setAdmin(ehAdmin);
      setCarregado(true);
    })();
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!alive) return;
      if (!session?.user) setNome(null);
    });
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, [pathname]);

  async function sair() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setNome(null);
    setAberto(false);
    router.push("/");
    router.refresh();
  }

  if (!carregado) {
    return null;
  }

  if (!nome) {
    return (
      <Link href="/login" className="cta" onClick={onNavigate}>
        Entrar
      </Link>
    );
  }

  // Primeira letra como avatar
  const inicial = nome.trim().charAt(0).toUpperCase();
  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setAberto((a) => !a)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: "var(--bg-soft)",
          border: "1px solid var(--line)",
          borderRadius: 999,
          padding: "6px 12px 6px 6px",
          fontSize: 14,
          fontWeight: 700,
          cursor: "pointer",
          color: "var(--fg)",
          fontFamily: "var(--ff-sans)",
        }}
      >
        <span
          style={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            background: "var(--primary)",
            color: "white",
            display: "grid",
            placeItems: "center",
            fontSize: 13,
            fontWeight: 800,
          }}
        >
          {inicial}
        </span>
        <span
          style={{
            maxWidth: 100,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {nome}
        </span>
        <span style={{ fontSize: 10, opacity: 0.6 }}>▾</span>
      </button>
      {aberto && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            background: "var(--bg-2)",
            border: "1px solid var(--line)",
            borderRadius: "var(--r-m)",
            boxShadow: "var(--shadow-pop)",
            minWidth: 200,
            padding: 8,
            zIndex: 100,
          }}
        >
          <Link
            href="/dashboard"
            onClick={() => setAberto(false)}
            style={menuItem}
          >
            🎯 Meus bolões
          </Link>
          <Link
            href="/criar"
            onClick={() => setAberto(false)}
            style={menuItem}
          >
            ➕ Criar bolão novo
          </Link>
          <Link
            href="/perfil"
            onClick={() => setAberto(false)}
            style={menuItem}
          >
            👤 Meu perfil
          </Link>
          {admin && (
            <>
              <hr style={{ border: 0, borderTop: "1px solid var(--line)", margin: "6px 0" }} />
              <Link
                href="/admin"
                onClick={() => setAberto(false)}
                style={{ ...menuItem, color: "var(--primary)" }}
              >
                🛡️ Painel admin
              </Link>
            </>
          )}
          <hr style={{ border: 0, borderTop: "1px solid var(--line)", margin: "6px 0" }} />
          <button onClick={sair} style={{ ...menuItem, color: "var(--fg-muted)", width: "100%", textAlign: "left", background: "transparent", border: "none", cursor: "pointer", fontFamily: "var(--ff-sans)" }}>
            Sair
          </button>
        </div>
      )}
    </div>
  );
}

const menuItem: React.CSSProperties = {
  display: "block",
  padding: "10px 14px",
  fontSize: 14,
  fontWeight: 600,
  color: "var(--fg)",
  textDecoration: "none",
  borderRadius: "var(--r-s)",
};
