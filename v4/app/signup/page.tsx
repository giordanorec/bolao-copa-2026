"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase-browser";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [nome, setNome] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErro(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: { data: { display_name: nome } },
    });
    if (error) {
      setErro(error.message);
      setLoading(false);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="max-w-md mx-auto card mt-8">
      <h1 className="text-3xl mb-2">Criar conta</h1>
      <p className="text-[--color-muted] text-sm mb-6">
        Email e senha, simples. Nada de SMS ou cartão.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label" htmlFor="nome">Seu nome</label>
          <input id="nome" className="input" required minLength={2}
            value={nome} onChange={(e) => setNome(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input id="email" type="email" required className="input"
            value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="senha">Senha</label>
          <input id="senha" type="password" required minLength={6} className="input"
            value={senha} onChange={(e) => setSenha(e.target.value)} />
          <p className="text-xs text-[--color-muted] mt-1">mínimo 6 caracteres</p>
        </div>
        {erro && <p className="text-red-600 text-sm">{erro}</p>}
        <button type="submit" disabled={loading} className="btn btn-primary w-full justify-center">
          {loading ? "Criando..." : "Criar conta"}
        </button>
      </form>
      <p className="text-sm text-[--color-muted] mt-6 text-center">
        Já tem conta? <Link href="/login" className="text-[--color-primary] font-semibold">Entrar</Link>
      </p>
    </div>
  );
}
