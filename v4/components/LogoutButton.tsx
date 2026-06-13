"use client";

import { useRouter } from "next/navigation";
import posthog from "posthog-js";
import { createClient } from "@/lib/supabase-browser";

export default function LogoutButton() {
  const router = useRouter();
  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    posthog.capture("logout");
    posthog.reset();
    router.push("/");
    router.refresh();
  }
  return (
    <button onClick={logout} className="btn small">
      Sair
    </button>
  );
}
