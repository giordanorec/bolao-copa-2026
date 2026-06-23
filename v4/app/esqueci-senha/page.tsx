"use client";

/**
 * /esqueci-senha — pede o email e dispara o link de recuperação do Supabase.
 *
 * O link do email aponta pra /redefinir-senha (redirectTo), onde o usuário
 * define a nova senha. Mensagem de sucesso é genérica de propósito (não revela
 * se o email existe), pra não virar oráculo de contas cadastradas.
 */

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase-browser";
import { useLocale } from "@/lib/use-locale";
import { t } from "@/lib/i18n";

export default function EsqueciSenhaPage() {
  const locale = useLocale();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErro(null);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/redefinir-senha`,
    });
    setLoading(false);
    if (error) {
      setErro(t(locale, "esqueci.erro"));
      return;
    }
    setEnviado(true);
  }

  if (enviado) {
    return (
      <div className="card form-card">
        <h1>{t(locale, "esqueci.titulo")}</h1>
        <p className="lede-form">📬 {t(locale, "esqueci.enviado")}</p>
        <Link href="/login" className="btn primary block" style={{ marginTop: 8 }}>
          {t(locale, "esqueci.voltar")}
        </Link>
      </div>
    );
  }

  return (
    <div className="card form-card">
      <h1>{t(locale, "esqueci.titulo")}</h1>
      <p className="lede-form">{t(locale, "esqueci.lede")}</p>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="label" htmlFor="email">
            {t(locale, "esqueci.email")}
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
        {erro && <p className="err">{erro}</p>}
        <button type="submit" disabled={loading} className="btn primary block">
          {loading ? t(locale, "esqueci.enviando") : t(locale, "esqueci.enviar")}
        </button>
      </form>
      <p className="alt">
        <Link href="/login">{t(locale, "esqueci.voltar")}</Link>
      </p>
    </div>
  );
}
