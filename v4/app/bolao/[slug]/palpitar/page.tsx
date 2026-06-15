import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { carregarJogos } from "@/lib/jogos";
import {
  carregarPalpitesIAs,
  carregarDictIAs,
  carregarPaises,
} from "@/lib/palpites-ias";
import { carregarMapaPaises } from "@/lib/paises";
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

  const [jogos, palpitesIAs, iasDict, paises, mapaPaises] = await Promise.all([
    carregarJogos(),
    carregarPalpitesIAs(),
    carregarDictIAs(),
    carregarPaises(),
    carregarMapaPaises(),
  ]);

  const { data: palpites } = await supabase
    .from("palpite")
    .select("jogo_numero, gols_a, gols_b")
    .eq("user_id", user.id);

  const palpitesMap: Record<number, { gols_a: number; gols_b: number }> = {};
  (palpites ?? []).forEach((p) => {
    palpitesMap[p.jogo_numero] = { gols_a: p.gols_a, gols_b: p.gols_b };
  });

  // Bloqueio server-side: jogos cujo kickoff já passou estão TRAVADOS.
  // O usuário NÃO pode mais inserir/alterar/apagar palpite desses (RLS no
  // banco recusa, e a UI desabilita os inputs). A hora vem do servidor,
  // nunca do relógio do cliente.
  const agora = Date.now();
  const bloqueadosArr = jogos
    .filter((j) => new Date(`${j.data}T${j.hora}:00-03:00`).getTime() <= agora)
    .map((j) => j.numero);

  return (
    <div style={{ marginTop: 40 }}>
      <PalpitarForm
        bolaoNome={bolao.nome}
        bolaoSlug={bolao.slug}
        jogos={jogos}
        palpitesIniciais={palpitesMap}
        palpitesIAs={palpitesIAs}
        iasDict={iasDict}
        paises={paises}
        mapaPaises={mapaPaises}
        bloqueados={bloqueadosArr}
      />
    </div>
  );
}
