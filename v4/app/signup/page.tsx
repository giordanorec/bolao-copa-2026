"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase-browser";

function SignupForm() {
  const router = useRouter();
  const params = useSearchParams();
  const redirect = params.get("redirect") || "/dashboard";

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [nome, setNome] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Detectar se o redirect é pra um bolão específico (convite)
  const bolaoMatch = redirect.match(/^\/bolao\/([\w-]+)/);
  const slugConvite = bolaoMatch?.[1] ?? null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErro(null);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: { data: { display_name: nome } },
    });
    if (error) {
      setErro(error.message);
      setLoading(false);
      return;
    }
    // Se veio de convite de bolão, faz auto-join e leva pra /palpitar
    if (slugConvite && data.user) {
      const { data: bolao } = await supabase
        .from("bolao")
        .select("id")
        .eq("slug", slugConvite)
        .single();
      if (bolao) {
        await supabase
          .from("bolao_membro")
          .insert({ bolao_id: bolao.id, user_id: data.user.id });
        router.push(`/bolao/${slugConvite}/palpitar`);
        router.refresh();
        return;
      }
    }
    router.push(redirect);
    router.refresh();
  }

  return (
    <div className="card form-card">
      {slugConvite ? (
        <div
          style={{
            background:
              "linear-gradient(135deg, color-mix(in srgb, var(--accent) 14%, transparent), color-mix(in srgb, var(--primary) 10%, transparent))",
            padding: 14,
            borderRadius: "var(--r-m)",
            marginBottom: 20,
            border: "1px solid color-mix(in srgb, var(--primary) 30%, transparent)",
            fontSize: 14,
            fontWeight: 600,
            color: "var(--fg)",
          }}
        >
          🎯 Você foi convidado pra um bolão. Cria conta e entra direto.
        </div>
      ) : null}
      <h1>Criar conta</h1>
      <p className="lede-form">
        Email e senha, simples. Nada de SMS ou cartão. Login fica salvo por 1
        ano — entra uma vez só.
      </p>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="label" htmlFor="nome">
            Seu nome
          </label>
          <input
            id="nome"
            className="input"
            required
            minLength={2}
            value={nome}
            onChange={(e) => setNome(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label className="label" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label className="label" htmlFor="senha">
            Senha
          </label>
          <input
            id="senha"
            type="password"
            required
            minLength={6}
            className="input"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
          />
          <span className="input-hint">mínimo 6 caracteres</span>
        </div>
        {erro && <p className="err">{erro}</p>}
        <button
          type="submit"
          disabled={loading}
          className="btn primary block"
        >
          {loading ? "Criando..." : "Criar conta"}
        </button>
      </form>
      <p className="alt">
        Já tem conta?{" "}
        <Link
          href={`/login?redirect=${encodeURIComponent(redirect)}`}
        >
          Entrar
        </Link>
      </p>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="card form-card">Carregando…</div>}>
      <SignupForm />
    </Suspense>
  );
}
