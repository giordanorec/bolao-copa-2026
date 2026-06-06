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
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
    if (error) {
      setErro("Email ou senha inválidos.");
      setLoading(false);
      return;
    }
    router.push(redirect);
    router.refresh();
  }

  return (
    <div className="max-w-md mx-auto card mt-8">
      <h1 className="text-3xl mb-2">Entrar</h1>
      <p className="text-[--color-muted] text-sm mb-6">Bem-vindo de volta.</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input id="email" type="email" required className="input"
            value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="senha">Senha</label>
          <input id="senha" type="password" required className="input"
            value={senha} onChange={(e) => setSenha(e.target.value)} />
        </div>
        {erro && <p className="text-red-600 text-sm">{erro}</p>}
        <button type="submit" disabled={loading} className="btn btn-primary w-full justify-center">
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
      <p className="text-sm text-[--color-muted] mt-6 text-center">
        Sem conta? <Link href="/signup" className="text-[--color-primary] font-semibold">Criar conta</Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="card mt-8">Carregando…</div>}>
      <LoginForm />
    </Suspense>
  );
}
