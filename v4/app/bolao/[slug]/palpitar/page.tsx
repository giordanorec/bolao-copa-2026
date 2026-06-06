import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { carregarJogos } from "@/lib/jogos";
import PalpitarForm from "./PalpitarForm";

export default async function PalpitarPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: bolao } = await supabase
    .from("bolao")
    .select("id, nome, slug")
    .eq("slug", slug)
    .single();
  if (!bolao) notFound();

  const jogos = await carregarJogos();
  const { data: palpites } = await supabase
    .from("palpite")
    .select("jogo_numero, gols_a, gols_b")
    .eq("user_id", user.id);

  const palpitesMap: Record<number, { gols_a: number; gols_b: number }> = {};
  (palpites ?? []).forEach((p) => {
    palpitesMap[p.jogo_numero] = { gols_a: p.gols_a, gols_b: p.gols_b };
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-[--color-muted]">{bolao.nome}</p>
        <h1 className="text-3xl">Seus palpites</h1>
        <p className="text-[--color-muted] mt-2 text-sm">
          Vale pra todos os bolões em que você está. Salva sozinho ao mudar.
        </p>
      </div>
      <PalpitarForm jogos={jogos} palpitesIniciais={palpitesMap} />
    </div>
  );
}
