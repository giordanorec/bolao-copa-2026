import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { carregarJogos } from "@/lib/jogos";
import { carregarPalpitesIAs, carregarDictIAs } from "@/lib/palpites-ias";
import PalpitarForm from "./PalpitarForm";

export const metadata = {
  title: "Meus palpites · Bolão das IAs",
};

export default async function PalpitarPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?redirect=/bolao/${slug}/palpitar`);

  const { data: bolao } = await supabase
    .from("bolao")
    .select("id, nome, slug")
    .eq("slug", slug)
    .single();
  if (!bolao) notFound();

  const [jogos, palpitesIAs, iasDict] = await Promise.all([
    carregarJogos(),
    carregarPalpitesIAs(),
    carregarDictIAs(),
  ]);

  const { data: palpites } = await supabase
    .from("palpite")
    .select("jogo_numero, gols_a, gols_b")
    .eq("user_id", user.id);

  const palpitesMap: Record<number, { gols_a: number; gols_b: number }> = {};
  (palpites ?? []).forEach((p) => {
    palpitesMap[p.jogo_numero] = { gols_a: p.gols_a, gols_b: p.gols_b };
  });

  return (
    <div style={{ marginTop: 40 }}>
      <div style={{ marginBottom: 24 }}>
        <p
          style={{
            fontFamily: "var(--ff-mono)",
            fontSize: 12,
            color: "var(--fg-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          {bolao.nome}
        </p>
        <h1 style={{ fontSize: 36, marginTop: 4 }}>🎯 Seus palpites</h1>
        <p style={{ color: "var(--fg-muted)", marginTop: 6, fontSize: 14 }}>
          Vale pra todos os bolões em que você está. Salva sozinho ao mudar.
          Use o 💡 ao lado de cada jogo pra ver palpites das IAs.
        </p>
      </div>
      <PalpitarForm
        jogos={jogos}
        palpitesIniciais={palpitesMap}
        palpitesIAs={palpitesIAs}
        iasDict={iasDict}
      />
    </div>
  );
}
