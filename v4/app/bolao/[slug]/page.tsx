import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase-server";
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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: membros } = await supabase
    .from("bolao_membro")
    .select("user_id, profiles:profiles!inner(display_name)")
    .eq("bolao_id", bolao.id);

  type MembroRow = { user_id: string; profiles: { display_name: string } };
  const membrosTyped: MembroRow[] = (membros ?? []) as unknown as MembroRow[];

  const sou_membro = user
    ? membrosTyped.some((m) => m.user_id === user.id)
    : false;

  return (
    <div style={{ marginTop: 40 }}>
      <div className="card">
        <div className="bolao-head">
          <h1>🎯 {bolao.nome}</h1>
          {bolao.descricao && <p className="desc">{bolao.descricao}</p>}
          <span className="slug-tag">link: /bolao/{bolao.slug}</span>
        </div>

        <div className="share-row">
          <span className="members-count">
            👥 {membrosTyped.length}{" "}
            {membrosTyped.length === 1 ? "membro" : "membros"}
          </span>
          <CopyLinkButton slug={bolao.slug} />
          {!user ? (
            <Link
              href={`/login?redirect=/bolao/${bolao.slug}`}
              className="btn primary small"
            >
              Entrar pra participar
            </Link>
          ) : sou_membro ? (
            <Link
              href={`/bolao/${bolao.slug}/palpitar`}
              className="btn primary small"
            >
              🏆 Meus palpites
            </Link>
          ) : (
            <EntrarButton bolaoId={bolao.id} slug={bolao.slug} />
          )}
        </div>
      </div>

      <div style={{ marginTop: 24 }}>
        <RankingDoBolao bolaoId={bolao.id} membros={membrosTyped} />
      </div>
    </div>
  );
}
