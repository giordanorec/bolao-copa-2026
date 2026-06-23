"use client";

/**
 * /redefinir-senha — destino do link de recuperação enviado por email.
 *
 * O client `@supabase/ssr` (PKCE, detectSessionInUrl) troca o `?code=` da URL
 * por uma sessão de recuperação automaticamente ao montar. Esperamos essa
 * sessão aparecer (onAuthStateChange / getSession); com ela, `updateUser`
 * define a nova senha. Sem sessão em alguns segundos → link inválido/expirado.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase-browser";
import { useLocale } from "@/lib/use-locale";
import { t } from "@/lib/i18n";

type Estado = "checando" | "pronto" | "invalido" | "sucesso";

export default function RedefinirSenhaPage() {
  const locale = useLocale();
  const [estado, setEstado] = useState<Estado>("checando");
  const [senha, setSenha] = useState("");
  const [confirma, setConfirma] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    let resolvido = false;
    const pronto = () => {
      resolvido = true;
      setEstado("pronto");
    };

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) pronto();
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) pronto();
    });

    const timer = setTimeout(() => {
      if (!resolvido) setEstado((e) => (e === "checando" ? "invalido" : e));
    }, 5000);

    return () => {
      sub.subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    if (senha.length < 6) {
      setErro(t(locale, "redefinir.curta"));
      return;
    }
    if (senha !== confirma) {
      setErro(t(locale, "redefinir.naoconfere"));
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: senha });
    setLoading(false);
    if (error) {
      setErro(t(locale, "redefinir.erro"));
      return;
    }
    setEstado("sucesso");
  }

  if (estado === "checando") {
    return (
      <div className="card form-card">
        <p className="lede-form">{t(locale, "redefinir.checando")}</p>
      </div>
    );
  }

  if (estado === "invalido") {
    return (
      <div className="card form-card">
        <h1>{t(locale, "redefinir.titulo")}</h1>
        <p className="err">{t(locale, "redefinir.invalido")}</p>
        <Link
          href="/esqueci-senha"
          className="btn primary block"
          style={{ marginTop: 8 }}
        >
          {t(locale, "redefinir.pedir_novo")}
        </Link>
      </div>
    );
  }

  if (estado === "sucesso") {
    return (
      <div className="card form-card">
        <h1>{t(locale, "redefinir.titulo")}</h1>
        <p className="lede-form">✅ {t(locale, "redefinir.sucesso")}</p>
        <Link href="/dashboard" className="btn primary block" style={{ marginTop: 8 }}>
          {t(locale, "redefinir.ir_login")}
        </Link>
      </div>
    );
  }

  return (
    <div className="card form-card">
      <h1>{t(locale, "redefinir.titulo")}</h1>
      <p className="lede-form">{t(locale, "redefinir.lede")}</p>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="label" htmlFor="senha">
            {t(locale, "redefinir.nova")}
          </label>
          <input
            id="senha"
            type="password"
            required
            autoComplete="new-password"
            className="input"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label className="label" htmlFor="confirma">
            {t(locale, "redefinir.confirmar")}
          </label>
          <input
            id="confirma"
            type="password"
            required
            autoComplete="new-password"
            className="input"
            value={confirma}
            onChange={(e) => setConfirma(e.target.value)}
          />
        </div>
        {erro && <p className="err">{erro}</p>}
        <button type="submit" disabled={loading} className="btn primary block">
          {loading ? t(locale, "redefinir.salvando") : t(locale, "redefinir.salvar")}
        </button>
      </form>
    </div>
  );
}
