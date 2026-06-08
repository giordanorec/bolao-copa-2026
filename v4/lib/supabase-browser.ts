"use client";

import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./supabase-config";

let cliente: ReturnType<typeof createBrowserClient> | null = null;

/**
 * IMPORTANTE: NÃO setar `storageKey` nem `persistSession`/`autoRefreshToken`
 * customizados. A lib `@supabase/ssr` usa cookies por default (e não
 * localStorage), o que é necessário pra o SSR ver a sessão.
 */
export function createClient() {
  if (cliente) return cliente;
  // Limpa sessão antiga em localStorage (config anterior usava storageKey
  // customizado que não funcionava com SSR). Forçar re-login uma vez.
  if (typeof window !== "undefined") {
    try {
      const antiga = window.localStorage.getItem("sb-arena-auth");
      if (antiga) window.localStorage.removeItem("sb-arena-auth");
    } catch {}
  }
  cliente = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookieOptions: {
      maxAge: 60 * 60 * 24 * 365, // 1 ano
      sameSite: "lax",
      secure: true,
      path: "/",
    },
  });
  return cliente;
}
