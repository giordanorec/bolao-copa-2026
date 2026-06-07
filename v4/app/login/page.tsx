"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase-browser";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const redirect = params.get("redirect") || "/dashboard";

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const bolaoMatch = redirect.match(/^\/bolao\/([\w-]+)/);
  const slugConvite = bolaoMatch?.[1] ?? null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErro(null);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    });
    if (error) {
      setErro("Email ou senha inválidos.");
      setLoading(false);
      return;
    }
    // Se veio de convite, garante membership antes de ir
    if (slugConvite && data.user) {
      const { data: bolao } = await supabase
        .from("bolao")
        .select("id")
        .eq("slug", slugConvite)
        .single();
      if (bolao) {
        await supabase
          .from("bolao_membro")
          .upsert(
            { bolao_id: bolao.id, user_id: data.user.id },
            { onConflict: "bolao_id,user_id", ignoreDuplicates: true },
          );
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
            border:
              "1px solid color-mix(in srgb, var(--primary) 30%, transparent)",
            fontSize: 14,
            fontWeight: 600,
            color: "var(--fg)",
          }}
        >
          🎯 Faltam só 2 campos pra você entrar nesse bolão.
        </div>
      ) : null}
      <h1>Entrar</h1>
      <p className="lede-form">
        Bem-vindo de volta. Login fica salvo, próxima vez vai direto.
      </p>
      <form onSubmit={handleSubmit}>
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
            className="input"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
          />
        </div>
        {erro && <p className="err">{erro}</p>}
        <button
          type="submit"
          disabled={loading}
          className="btn primary block"
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
      <p className="alt">
        Sem conta?{" "}
        <Link href={`/signup?redirect=${encodeURIComponent(redirect)}`}>
          Criar conta
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="card form-card">Carregando…</div>}>
      <LoginForm />
    </Suspense>
  );
}
