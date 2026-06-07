"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";

export default function EntrarButton({
  bolaoId,
  slug,
}: {
  bolaoId: string;
  slug: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function entrar() {
    setLoading(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push(`/login?redirect=/bolao/${slug}`);
      return;
    }
    await supabase
      .from("bolao_membro")
      .upsert(
        { bolao_id: bolaoId, user_id: user.id },
        { onConflict: "bolao_id,user_id", ignoreDuplicates: true },
      );
    router.push(`/bolao/${slug}/palpitar`);
    router.refresh();
  }

  return (
    <button
      onClick={entrar}
      disabled={loading}
      className="btn primary"
    >
      {loading ? "Entrando…" : "🎯 Entrar no bolão →"}
    </button>
  );
}
