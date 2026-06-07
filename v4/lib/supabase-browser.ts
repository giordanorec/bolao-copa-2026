"use client";

import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./supabase-config";

let cliente: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  if (cliente) return cliente;
  cliente = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: "sb-arena-auth",
    },
    cookieOptions: {
      maxAge: 60 * 60 * 24 * 365, // 1 ano
      sameSite: "lax",
      secure: true,
      path: "/",
    },
  });
  return cliente;
}
