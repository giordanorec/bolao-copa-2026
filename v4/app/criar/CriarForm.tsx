"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { nanoid } from "nanoid";
import { createClient } from "@/lib/supabase-browser";

export default function CriarForm() {
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
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login?redirect=/criar");
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
    <div className="card form-card">
      <h1>🎯 Criar bolão</h1>
      <p className="lede-form">
        Gera um link único pra você convidar a galera.
      </p>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="label" htmlFor="nome">
            Nome do bolão
          </label>
          <input
            id="nome"
            required
            minLength={2}
            maxLength={80}
            className="input"
            placeholder="Ex.: Galera do Boteco"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label className="label" htmlFor="descricao">
            Descrição (opcional)
          </label>
          <textarea
            id="descricao"
            maxLength={500}
            rows={3}
            className="input"
            placeholder="Pra apostadores sérios e zoeira moderada."
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
          />
        </div>
        {erro && <p className="err">{erro}</p>}
        <button
          type="submit"
          disabled={loading}
          className="btn primary block"
        >
          {loading ? "Criando..." : "Criar bolão"}
        </button>
      </form>
    </div>
  );
}
