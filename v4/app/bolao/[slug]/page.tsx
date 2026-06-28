import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase-server";
import { totalPontos } from "@/lib/scoring";
import { carregarJogos } from "@/lib/jogos";
import { escopoDoBolao, jogosNoEscopo } from "@/lib/bolao-escopo";
import { resolverLocale } from "@/lib/locale-server";
import SerieA from "@/components/SerieA";
import EntrarButton from "./EntrarButton";
import EntrarPublicoButton from "./EntrarPublicoButton";
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

  // Bolões públicos (entrada torna palpites públicos no Ranking Geral).
  // Mantido como allowlist em código para não depender de coluna no schema.
  const BOLOES_PUBLICOS = new Set(["humanos-vs-ias"]);
  const ehPublico = BOLOES_PUBLICOS.has(bolao.slug);

  const [{ data: { user } }, locale] = await Promise.all([
    supabase.auth.getUser(),
    resolverLocale(),
  ]);

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
  const todosJogos = await carregarJogos();
  const escopo = escopoDoBolao(bolao.slug);
  const jogos = jogosNoEscopo(todosJogos, escopo);
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

  const isAnon = !user;
  const isVisitante = !sou_membro;

  const criadorNome =
    membrosTyped.find((m) => m.user_id === bolao.criador_id)?.profiles
      .display_name ?? null;
  const lider =
    rankingPraShare.length > 0 && rankingPraShare[0].pontos > 0
      ? rankingPraShare[0]
      : null;
  const AVATAR_CORES = [
    "linear-gradient(135deg,#009C3B,#00B040)",
    "linear-gradient(135deg,#FFC700,#C99800)",
    "linear-gradient(135deg,#007AFF,#0040DD)",
    "linear-gradient(135deg,#FF385C,#E61E4D)",
    "linear-gradient(135deg,#8134AF,#DD2A7B)",
  ];
  const avatares = membrosTyped.slice(0, 5).map((m, i) => ({
    inicial: (m.profiles.display_name || "?").trim().charAt(0).toUpperCase(),
    cor: AVATAR_CORES[i % AVATAR_CORES.length],
  }));
  const sobrando = membrosTyped.length - avatares.length;

  return (
    <div className="bolao-page">
      {/* ── HERO convite ── */}
      <section className="bolao-hero">
        <div className="bolao-hero-badge" aria-hidden>
          🏆
        </div>
        <p className="bolao-hero-kicker">
          {isVisitante
            ? "Você foi convidado pra um bolão · Copa 2026"
            : "Seu bolão · Copa 2026"}
        </p>
        <h1 className="bolao-hero-titulo">{bolao.nome}</h1>
        {bolao.descricao && (
          <p className="bolao-hero-desc">{bolao.descricao}</p>
        )}

        {(avatares.length > 0 || criadorNome) && (
          <div className="bolao-hero-membros">
            {avatares.length > 0 && (
              <div className="bolao-avatars">
                {avatares.map((a, i) => (
                  <span key={i} style={{ background: a.cor }}>
                    {a.inicial}
                  </span>
                ))}
                {sobrando > 0 && (
                  <span className="bolao-avatars-mais">+{sobrando}</span>
                )}
              </div>
            )}
            {criadorNome && (
              <span className="bolao-hero-criador">
                criado por <strong>{criadorNome}</strong>
              </span>
            )}
          </div>
        )}

        {lider && (
          <div className="bolao-hero-lider">
            🥇 <strong>{lider.nome}</strong> lidera com {lider.pontos} pts
          </div>
        )}

        <div className="bolao-hero-meta">
          <span>
            👥 <strong>{membrosTyped.length}</strong>{" "}
            {membrosTyped.length === 1 ? "membro" : "membros"}
          </span>
          <span>⚽ {jogos.length} jogos{escopo.maxJogo - escopo.minJogo + 1 < todosJogos.length ? ` (${escopo.label})` : ""}</span>
          <span>🔮 122 IAs palpitando</span>
        </div>

        <div className="bolao-hero-cta">
          {isAnon ? (
            <Link
              href={`/login?redirect=/bolao/${bolao.slug}`}
              className="btn primary"
            >
              🎯 Entrar nesse bolão →
            </Link>
          ) : isVisitante ? (
            ehPublico ? (
              <EntrarPublicoButton bolaoId={bolao.id} slug={bolao.slug} />
            ) : (
              <EntrarButton bolaoId={bolao.id} slug={bolao.slug} />
            )
          ) : (
            <Link
              href={`/bolao/${bolao.slug}/palpitar`}
              className="btn primary"
            >
              🏆 Dar meus palpites →
            </Link>
          )}
          <CopyLinkButton slug={bolao.slug} nome={bolao.nome} />
          <ShareCardButton
            nomeBolao={bolao.nome}
            slug={bolao.slug}
            ranking={rankingPraShare}
          />
        </div>
      </section>

      {/* ── Ranking do bolão (logo após o hero) ── */}
      <section style={{ marginTop: 32 }}>
        <RankingDoBolao
          bolaoId={bolao.id}
          slug={bolao.slug}
          membros={membrosTyped}
        />
      </section>

      {/* ── O que é o Bolão das IAs (pra TODO mundo) ── */}
      <section className="bolao-explica">
        <h2>{isVisitante ? "Espera, o que é esse site?" : "Explore o resto do site"}</h2>
        <p className="bolao-explica-lede">
          <strong>Bolão das IAs</strong> é um bolão da Copa 2026, mas com um
          twist: além de você e a galera palpitar, a gente pegou{" "}
          <strong>122 modelos de IA</strong> (ChatGPT, Claude, Gemini, Grok,
          DeepSeek e mais 117) e mandou cada uma palpitar os 104 jogos
          também.
        </p>
        <div className="bolao-explica-grid">
          <Link href="/jogos" className="card hoverable">
            <div className="bolao-explica-emoji">⚽</div>
            <strong>Os 104 jogos</strong>
            <p>O que cada IA chutou pra cada partida. Clique num jogo, veja todos os placares votados.</p>
          </Link>
          <Link href="/cristal" className="card hoverable">
            <div className="bolao-explica-emoji">🔮</div>
            <strong>Bola de Cristal</strong>
            <p>O placar mais votado entre as 122 IAs pra cada jogo. Sabedoria das máquinas.</p>
          </Link>
          <Link href="/ranking-ias" className="card hoverable">
            <div className="bolao-explica-emoji">🏆</div>
            <strong>Ranking das IAs</strong>
            <p>Quem está chutando melhor — ChatGPT, Claude, Gemini, Grok? Todas comparadas.</p>
          </Link>
          <Link href="/ranking-geral" className="card hoverable">
            <div className="bolao-explica-emoji">🌍</div>
            <strong>Hall da Fama</strong>
            <p>Humanos opt-in disputam contra as 122 IAs no mesmo placar.</p>
          </Link>
          <Link href="/como-funciona" className="card hoverable">
            <div className="bolao-explica-emoji">📘</div>
            <strong>Como funciona</strong>
            <p>Placar exato vale 10, vencedor com saldo 7, vencedor 5, errado 0. Mata-mata 2×.</p>
          </Link>
          <Link href="/colaborar" className="card hoverable">
            <div className="bolao-explica-emoji">💛</div>
            <strong>Apoie</strong>
            <p>Sem ads, sem casa de aposta. Colaborações cobrem as APIs das IAs.</p>
          </Link>
        </div>
      </section>

      {/* ── Série A em destaque (sempre) ── */}
      <SerieA locale={locale} variante="compact" />
    </div>
  );
}
