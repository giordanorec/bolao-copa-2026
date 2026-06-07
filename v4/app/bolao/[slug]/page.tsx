import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase-server";
import { totalPontos } from "@/lib/scoring";
import { carregarJogos } from "@/lib/jogos";
import EntrarButton from "./EntrarButton";
import CopyLinkButton from "./CopyLinkButton";
import RankingDoBolao from "./RankingDoBolao";
import ShareCardButton from "./ShareCardButton";
import type { Palpite } from "@/lib/types";

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

  const userIds = membrosTyped.map((m) => m.user_id);
  const jogos = await carregarJogos();
  let rankingPraShare: { nome: string; pontos: number }[] = [];
  if (userIds.length > 0) {
    const { data: pp } = await supabase
      .from("palpite")
      .select("user_id, jogo_numero, gols_a, gols_b, atualizado_em")
      .in("user_id", userIds);
    const porUser = new Map<string, Record<number, Palpite>>();
    (pp ?? []).forEach((p) => {
      if (!porUser.has(p.user_id)) porUser.set(p.user_id, {});
      porUser.get(p.user_id)![p.jogo_numero] = p as Palpite;
    });
    rankingPraShare = membrosTyped
      .map((m) => ({
        nome: m.profiles.display_name,
        pontos: totalPontos(porUser.get(m.user_id) ?? {}, jogos),
      }))
      .sort((a, b) => b.pontos - a.pontos);
  }

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
          <ShareCardButton
            nomeBolao={bolao.nome}
            slug={bolao.slug}
            ranking={rankingPraShare}
          />
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
