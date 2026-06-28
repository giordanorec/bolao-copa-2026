"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import posthog from "posthog-js";
import { createClient } from "@/lib/supabase-browser";
import { useLocale } from "@/lib/use-locale";
import { t } from "@/lib/i18n";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const redirect = params.get("redirect") || "/";
  const locale = useLocale();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sessaoExistente, setSessaoExistente] = useState<{
    nome: string;
  } | null>(null);
  const [verificandoSessao, setVerificandoSessao] = useState(true);

  const bolaoMatch = redirect.match(/^\/bolao\/([\w-]+)/);
  const slugConvite = bolaoMatch?.[1] ?? null;

  useEffect(() => {
    try {
      const ultimoEmail = localStorage.getItem("v4-ultimo-email");
      if (ultimoEmail) setEmail(ultimoEmail);
    } catch {}
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (data.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("display_name")
          .eq("id", data.user.id)
          .single();
        setSessaoExistente({
          nome:
            (profile as { display_name?: string } | null)?.display_name ??
            data.user.email ??
            "você",
        });
      }
      setVerificandoSessao(false);
    });
  }, []);

  async function continuarComoAtual() {
    const supabase = createClient();
    const { data } = await supabase.auth.getUser();
    if (data.user && slugConvite) {
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

  async function trocarConta() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setSessaoExistente(null);
  }

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
      setErro(t(locale, "login.erro"));
      setLoading(false);
      return;
    }
    try {
      localStorage.setItem("v4-ultimo-email", email);
    } catch {}
    if (data.user) {
      posthog.identify(data.user.id, { email });
      posthog.capture("login", { veio_de_convite: !!slugConvite });
    }
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

  if (verificandoSessao) {
    return <div className="card form-card">Carregando…</div>;
  }

  if (sessaoExistente) {
    return (
      <div className="card form-card">
        {slugConvite && (
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
            {t(locale, "signup.convite_banner")}
          </div>
        )}
        <h1>{t(locale, "login.bem_vindo_volta")}</h1>
        <p className="lede-form">
          {t(locale, "login.ja_logado_como")}{" "}
          <strong>{sessaoExistente.nome}</strong>.
        </p>
        <button
          onClick={continuarComoAtual}
          className="btn primary block"
          style={{ marginBottom: 12 }}
        >
          {t(locale, "login.continuar_como")} {sessaoExistente.nome} →
        </button>
        <button
          onClick={trocarConta}
          className="btn block"
          style={{ background: "transparent", borderColor: "var(--line)" }}
        >
          {t(locale, "login.outra_conta")}
        </button>
      </div>
    );
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
          {t(locale, "signup.convite_banner")}
        </div>
      ) : null}
      <h1>{t(locale, "login.titulo")}</h1>
      <p className="lede-form">{t(locale, "login.lede")}</p>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="label" htmlFor="email">
            {t(locale, "login.email")}
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
            {t(locale, "login.senha")}
          </label>
          <input
            id="senha"
            type="password"
            required
            className="input"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
          />
          <p className="alt" style={{ marginTop: 6, textAlign: "right" }}>
            <Link href="/esqueci-senha">{t(locale, "login.esqueceu")}</Link>
          </p>
        </div>
        {erro && <p className="err">{erro}</p>}
        <button
          type="submit"
          disabled={loading}
          className="btn primary block"
        >
          {loading ? t(locale, "login.entrando") : t(locale, "login.entrar")}
        </button>
      </form>
      <p className="alt">
        {t(locale, "login.sem_conta")}{" "}
        <Link href={`/signup?redirect=${encodeURIComponent(redirect)}`}>
          {t(locale, "login.criar")}
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
