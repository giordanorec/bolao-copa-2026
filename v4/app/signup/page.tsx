"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase-browser";
import { useLocale } from "@/lib/use-locale";
import { t } from "@/lib/i18n";

function SignupForm() {
  const router = useRouter();
  const params = useSearchParams();
  const redirect = params.get("redirect") || "/dashboard";
  const locale = useLocale();

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
          {t(locale, "signup.convite_banner")}
        </div>
      ) : null}
      <h1>{t(locale, "signup.titulo")}</h1>
      <p className="lede-form">{t(locale, "signup.lede")}</p>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="label" htmlFor="nome">
            {t(locale, "signup.nome")}
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
            {t(locale, "signup.email")}
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
            {t(locale, "signup.senha")}
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
        </div>
        {erro && <p className="err">{erro}</p>}
        <button
          type="submit"
          disabled={loading}
          className="btn primary block"
        >
          {loading ? t(locale, "signup.criando") : t(locale, "signup.criar")}
        </button>
      </form>
      <p className="alt">
        {t(locale, "signup.ja_conta")}{" "}
        <Link href={`/login?redirect=${encodeURIComponent(redirect)}`}>
          {t(locale, "signup.entrar")}
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
