"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { nanoid } from "nanoid";
import { createClient } from "@/lib/supabase-browser";
import { Sparkles } from "lucide-react";

export default function CriarBolaoPage() {
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErro(null);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    const slug = nanoid(8);
    const { error: errInsert } = await supabase.from("bolao").insert({
      slug,
      nome: nome.trim(),
      descricao: descricao.trim() || null,
      criador_id: user.id,
    });
    if (errInsert) {
      setErro(errInsert.message);
      setLoading(false);
      return;
    }

    // criador entra automaticamente como membro
    const { data: novoBolao } = await supabase
      .from("bolao")
      .select("id")
      .eq("slug", slug)
      .single();
    if (novoBolao) {
      await supabase
        .from("bolao_membro")
        .insert({ bolao_id: novoBolao.id, user_id: user.id });
    }
    router.push(`/bolao/${slug}`);
    router.refresh();
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <span className="grid place-items-center w-12 h-12 rounded-full bg-[--color-primary]/10 text-[--color-primary]">
            <Sparkles size={24} />
          </span>
          <div>
            <h1 className="text-3xl">Criar bolão</h1>
            <p className="text-[--color-muted] text-sm">
              Gera um link único pra convidar a galera
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label" htmlFor="nome">Nome do bolão</label>
            <input id="nome" required minLength={2} maxLength={80} className="input"
              placeholder="Ex.: Galera do Boteco"
              value={nome} onChange={(e) => setNome(e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="descricao">Descrição (opcional)</label>
            <textarea id="descricao" maxLength={500} rows={3} className="input"
              placeholder="Pra apostadores sérios e zoeira moderada."
              value={descricao} onChange={(e) => setDescricao(e.target.value)} />
          </div>
          {erro && <p className="text-red-600 text-sm">{erro}</p>}
          <button type="submit" disabled={loading} className="btn btn-primary w-full justify-center">
            {loading ? "Criando..." : "Criar bolão e ver link"}
          </button>
        </form>
      </div>
    </div>
  );
}
