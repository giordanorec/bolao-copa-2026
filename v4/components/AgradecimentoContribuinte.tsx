/**
 * AgradecimentoContribuinte — banner de agradecimento na landing para
 * contribuintes logados (conta na allowlist `contribuintes` ou admin).
 *
 * Server component: lê o usuário logado e checa a allowlist server-side
 * (service_role, RLS bypass). Não renderiza nada para visitantes comuns.
 * Linka direto pros Palpites Atualizados.
 */

import Link from "next/link";
import { createClient } from "@/lib/supabase-server";
import { isContribuinte } from "@/lib/admin";
import type { Locale } from "@/lib/i18n";

const TX: Record<
  Locale,
  { kicker: string; ola: string; texto: string; cta: string }
> = {
  pt: {
    kicker: "Acesso de contribuinte",
    ola: "Obrigado por contribuir",
    texto: "Os Palpites Atualizados das IAs já estão liberados na sua conta.",
    cta: "Ver Palpites Atualizados",
  },
  en: {
    kicker: "Supporter access",
    ola: "Thanks for contributing",
    texto: "The AIs' Updated Picks are unlocked on your account.",
    cta: "See Updated Picks",
  },
  es: {
    kicker: "Acceso de colaborador",
    ola: "Gracias por colaborar",
    texto: "Los Pronósticos Actualizados de las IAs están habilitados en tu cuenta.",
    cta: "Ver Pronósticos Actualizados",
  },
  fr: {
    kicker: "Accès soutien",
    ola: "Merci pour votre soutien",
    texto: "Les Pronostics Mis à Jour des IA sont débloqués sur votre compte.",
    cta: "Voir les Pronostics Mis à Jour",
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
        <Link href="/analise-v2" className="pa-callout">
          <div className="pa-callout-glow" aria-hidden="true" />
          <div className="pa-callout-icon" aria-hidden="true">
            <span className="pa-callout-spark">✨</span>
            💛
          </div>
          <div className="pa-callout-body">
            <span className="pa-callout-kicker">{tx.kicker}</span>
            <strong className="pa-callout-titulo">
              {tx.ola}
              {nome ? `, ${nome}` : ""}!
            </strong>
            <span className="pa-callout-texto">{tx.texto}</span>
          </div>
          <span className="pa-callout-cta">{tx.cta} →</span>
        </Link>
      </div>
    </section>
  );
}
