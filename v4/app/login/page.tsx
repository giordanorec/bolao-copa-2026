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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErro(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    });
    if (error) {
      setErro("Email ou senha inválidos.");
      setLoading(false);
      return;
    }
    router.push(redirect);
    router.refresh();
  }

  return (
    <div className="card form-card">
      <h1>Entrar</h1>
      <p className="lede-form">Bem-vindo de volta.</p>
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
        <Link href="/signup">Criar conta</Link>
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
