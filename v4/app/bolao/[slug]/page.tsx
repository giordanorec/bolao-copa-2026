import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase-server";
import { Share2, Users, Trophy } from "lucide-react";
import EntrarButton from "./EntrarButton";
import CopyLinkButton from "./CopyLinkButton";
import RankingDoBolao from "./RankingDoBolao";

export default async function BolaoPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: bolao } = await supabase
    .from("bolao")
    .select("id, slug, nome, descricao, criador_id, criado_em")
    .eq("slug", slug)
    .single();

  if (!bolao) notFound();

  const { data: { user } } = await supabase.auth.getUser();

  const { data: membros } = await supabase
    .from("bolao_membro")
    .select("user_id, profiles:profiles!inner(display_name)")
    .eq("bolao_id", bolao.id);

  type MembroRow = { user_id: string; profiles: { display_name: string } };
  const membrosTyped: MembroRow[] = (membros ?? []) as unknown as MembroRow[];

  const sou_membro = user ? membrosTyped.some((m) => m.user_id === user.id) : false;

  return (
    <div className="space-y-8">
      <div className="card">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-4xl mb-2">{bolao.nome}</h1>
            {bolao.descricao && (
              <p className="text-[--color-muted]">{bolao.descricao}</p>
            )}
            <p className="text-xs text-[--color-muted] font-mono mt-3">
              link: /bolao/{bolao.slug}
            </p>
          </div>
          <CopyLinkButton slug={bolao.slug} />
        </div>

        <div className="mt-6 pt-6 border-t border-[--color-line] flex flex-wrap gap-4 items-center">
          <span className="flex items-center gap-2 text-sm text-[--color-muted]">
            <Users size={16} /> {membrosTyped.length} {membrosTyped.length === 1 ? "membro" : "membros"}
          </span>
          {!user ? (
            <Link href={`/login?redirect=/bolao/${bolao.slug}`} className="btn btn-primary text-sm py-2 px-4">
              Entrar pra participar
            </Link>
          ) : sou_membro ? (
            <Link href={`/bolao/${bolao.slug}/palpitar`} className="btn btn-primary text-sm py-2 px-4">
              <Trophy size={16} /> Meus palpites
            </Link>
          ) : (
            <EntrarButton bolaoId={bolao.id} slug={bolao.slug} />
          )}
        </div>
      </div>

      <RankingDoBolao bolaoId={bolao.id} membros={membrosTyped} />
    </div>
  );
}
