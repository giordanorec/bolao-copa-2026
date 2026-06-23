/**
 * AgradecimentoContribuinte — banner de agradecimento na landing para
 * contribuintes logados (conta na allowlist `contribuintes` ou admin).
 *
 * Server component: lê o usuário logado e checa a allowlist server-side
 * (service_role, RLS bypass). Não renderiza nada para visitantes comuns.
 * Linka direto pra Análise v2.
 */

import Link from "next/link";
import { createClient } from "@/lib/supabase-server";
import { isContribuinte } from "@/lib/admin";
import type { Locale } from "@/lib/i18n";

const TX: Record<
  Locale,
  { ola: string; texto: string; cta: string }
> = {
  pt: {
    ola: "Obrigado por contribuir",
    texto: "Seus palpites v2 estão liberados na sua conta.",
    cta: "Ver Análise v2 →",
  },
  en: {
    ola: "Thanks for contributing",
    texto: "Your v2 picks are unlocked on your account.",
    cta: "See v2 Analysis →",
  },
  es: {
    ola: "Gracias por colaborar",
    texto: "Tus pronósticos v2 están habilitados en tu cuenta.",
    cta: "Ver Análisis v2 →",
  },
  fr: {
    ola: "Merci pour votre soutien",
    texto: "Vos pronostics v2 sont débloqués sur votre compte.",
    cta: "Voir l'Analyse v2 →",
  },
};

export default async function AgradecimentoContribuinte({
  locale,
}: {
  locale: Locale;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return null;

  if (!(await isContribuinte(user.email))) return null;

  const { data: perfil } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();

  const nome = (perfil?.display_name as string | undefined)?.trim();
  const tx = TX[locale] ?? TX.pt;

  return (
    <section className="section" style={{ paddingTop: 16, paddingBottom: 0 }}>
      <div className="container">
        <Link
          href="/analise-v2"
          className="card hoverable"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            justifyContent: "center",
            flexWrap: "wrap",
            border: "1px solid var(--secondary)",
            textAlign: "center",
          }}
        >
          <span style={{ fontSize: 28, lineHeight: 1 }}>💛</span>
          <span>
            <strong style={{ color: "var(--secondary)" }}>
              {tx.ola}
              {nome ? `, ${nome}` : ""}!
            </strong>{" "}
            {tx.texto}
          </span>
          <span style={{ color: "var(--primary)", fontWeight: 700 }}>
            {tx.cta}
          </span>
        </Link>
      </div>
    </section>
  );
}
