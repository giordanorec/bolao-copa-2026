"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import { UserPlus } from "lucide-react";

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
      .insert({ bolao_id: bolaoId, user_id: user.id });
    router.refresh();
  }

  return (
    <button
      onClick={entrar}
      disabled={loading}
      className="btn btn-primary text-sm py-2 px-4"
    >
      <UserPlus size={16} /> {loading ? "Entrando…" : "Entrar no bolão"}
    </button>
  );
}
