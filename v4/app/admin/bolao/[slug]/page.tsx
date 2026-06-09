import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient, isAdminEmail } from "@/lib/admin";
import { carregarJogos } from "@/lib/jogos";
import { pontosJogo, totalPontos } from "@/lib/scoring";
import type { Palpite, Jogo } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Auditoria de bolão · Admin",
  robots: { index: false, follow: false },
};

type BolaoRow = {
  id: string;
  slug: string;
  nome: string;
  descricao: string | null;
  criador_id: string;
  encerrado: boolean;
  criado_em: string;
};

type ProfileRow = { id: string; display_name: string };

type PalpiteRow = {
  user_id: string;
  jogo_numero: number;
  gols_a: number;
  gols_b: number;
  atualizado_em: string;
};

export default async function AdminBolaoPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isAdminEmail(user.email)) notFound();

  const admin = createAdminClient();
  if (!admin) notFound();

  const { data: bolao } = await admin
    .from("bolao")
    .select("id, slug, nome, descricao, criador_id, encerrado, criado_em")
    .eq("slug", slug)
    .single();

  if (!bolao) notFound();
  const b = bolao as BolaoRow;

  const { data: membros } = await admin
    .from("bolao_membro")
    .select("user_id, entrou_em")
    .eq("bolao_id", b.id);

  const membrosArr = (membros ?? []) as { user_id: string; entrou_em: string }[];
  const userIds = membrosArr.map((m) => m.user_id);
  const allUserIds = Array.from(new Set([b.criador_id, ...userIds]));

  const [{ data: profiles }, { data: palpites }, jogos] = await Promise.all([
    admin.from("profiles").select("id, display_name").in("id", allUserIds.length ? allUserIds : ["00000000-0000-0000-0000-000000000000"]),
    admin
      .from("palpite")
      .select("user_id, jogo_numero, gols_a, gols_b, atualizado_em")
      .in("user_id", userIds.length ? userIds : ["00000000-0000-0000-0000-000000000000"]),
    carregarJogos(),
  ]);

  const profMap = new Map(((profiles ?? []) as ProfileRow[]).map((p) => [p.id, p.display_name]));
  const palpitesByUser = new Map<string, Record<number, Palpite>>();
  ((palpites ?? []) as PalpiteRow[]).forEach((p) => {
    if (!palpitesByUser.has(p.user_id)) palpitesByUser.set(p.user_id, {});
    palpitesByUser.get(p.user_id)![p.jogo_numero] = {
      user_id: p.user_id,
      jogo_numero: p.jogo_numero,
      gols_a: p.gols_a,
      gols_b: p.gols_b,
      atualizado_em: p.atualizado_em,
    };
  });

  const ranking = membrosArr
    .map((m) => {
      const palpitesUser = palpitesByUser.get(m.user_id) ?? {};
      const totalQuant = Object.keys(palpitesUser).length;
      const pts = totalPontos(palpitesUser, jogos);
      return {
        user_id: m.user_id,
        nome: profMap.get(m.user_id) ?? "?",
        entrou_em: m.entrou_em,
        palpitesQuant: totalQuant,
        pontos: pts,
      };
    })
    .sort((a, b) => b.pontos - a.pontos);

  return (
    <main style={{ maxWidth: 1080, margin: "32px auto", padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <Link href="/admin" style={{ fontSize: 13, color: "var(--fg-muted)" }}>
          ← voltar pro painel
        </Link>
      </div>

      <h1 style={{ fontSize: 28, fontWeight: 900, marginBottom: 4 }}>
        🔍 {b.nome}
      </h1>
      <p style={{ color: "var(--fg-muted)", marginBottom: 24, fontSize: 13 }}>
        <code>/bolao/{b.slug}</code> ·
        criado por <strong>{profMap.get(b.criador_id) ?? "?"}</strong> em{" "}
        {new Date(b.criado_em).toLocaleString("pt-BR")}
      </p>

      <div style={{ display: "flex", gap: 12, marginBottom: 28 }}>
        <Link href={`/bolao/${b.slug}`} className="btn ghost" style={{ fontSize: 13 }}>
          ↗ ver página pública
        </Link>
      </div>

      {/* Ranking interno auditável */}
      <section style={{ marginBottom: 36 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 14 }}>
          🏆 Ranking interno ({ranking.length} {ranking.length === 1 ? "membro" : "membros"})
        </h2>
        {ranking.length === 0 ? (
          <p style={{ color: "var(--fg-muted)", fontStyle: "italic" }}>
            Sem membros ainda.
          </p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ background: "var(--bg-soft)", textAlign: "left" }}>
                <th style={th}>#</th>
                <th style={th}>Nome</th>
                <th style={th}>Palpites dados</th>
                <th style={th}>Pontos</th>
                <th style={th}>Entrou em</th>
              </tr>
            </thead>
            <tbody>
              {ranking.map((r, i) => (
                <tr key={r.user_id} style={{ borderBottom: "1px solid var(--line)" }}>
                  <td style={td}><strong>{i + 1}º</strong></td>
                  <td style={td}>{r.nome}</td>
                  <td style={td}>
                    <span style={{ fontFamily: "var(--ff-mono)" }}>
                      {r.palpitesQuant}/104
                    </span>
                  </td>
                  <td style={{ ...td, fontWeight: 800, fontFamily: "var(--ff-mono)" }}>
                    {r.pontos}
                  </td>
                  <td style={{ ...td, fontSize: 12, color: "var(--fg-muted)" }}>
                    {new Date(r.entrou_em).toLocaleString("pt-BR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Palpites detalhados por membro */}
      <section>
        <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 14 }}>
          📋 Palpites detalhados por membro
        </h2>

        {ranking.map((r) => {
          const palpitesUser = palpitesByUser.get(r.user_id) ?? {};
          const palpitesArr = Object.entries(palpitesUser)
            .map(([num, p]) => ({ jogo_numero: Number(num), palpite: p }))
            .sort((a, b) => a.jogo_numero - b.jogo_numero);
          return (
            <details key={r.user_id} style={{ marginBottom: 12, border: "1px solid var(--line)", borderRadius: "var(--r-m)", padding: "12px 16px", background: "var(--bg-2)" }}>
              <summary style={{ cursor: "pointer", fontWeight: 700, display: "flex", gap: 12, alignItems: "center" }}>
                <span style={{ flex: 1 }}>{r.nome}</span>
                <span style={{ fontSize: 12, color: "var(--fg-muted)", fontFamily: "var(--ff-mono)" }}>
                  {palpitesArr.length}/104 palpites · {r.pontos} pts
                </span>
              </summary>
              {palpitesArr.length === 0 ? (
                <p style={{ marginTop: 12, fontSize: 13, color: "var(--fg-muted)" }}>
                  Não deu nenhum palpite ainda.
                </p>
              ) : (
                <table style={{ width: "100%", marginTop: 14, fontSize: 12 }}>
                  <thead>
                    <tr style={{ textAlign: "left", color: "var(--fg-muted)" }}>
                      <th style={tdSmall}>#</th>
                      <th style={tdSmall}>Fase</th>
                      <th style={tdSmall}>Jogo</th>
                      <th style={tdSmall}>Palpite</th>
                      <th style={tdSmall}>Resultado</th>
                      <th style={tdSmall}>Pts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {palpitesArr.map(({ jogo_numero, palpite }) => {
                      const jogo = jogos.find((j: Jogo) => j.numero === jogo_numero);
                      if (!jogo) return null;
                      const pts = pontosJogo(palpite, jogo);
                      const temResult = jogo.gols_a != null && jogo.gols_b != null;
                      return (
                        <tr key={jogo_numero} style={{ borderTop: "1px solid var(--line)" }}>
                          <td style={tdSmall}>{jogo_numero}</td>
                          <td style={tdSmall}>{jogo.fase}</td>
                          <td style={tdSmall}>{jogo.time_a} × {jogo.time_b}</td>
                          <td style={{ ...tdSmall, fontFamily: "var(--ff-mono)" }}>
                            {palpite.gols_a}-{palpite.gols_b}
                          </td>
                          <td style={{ ...tdSmall, fontFamily: "var(--ff-mono)", color: "var(--fg-muted)" }}>
                            {temResult ? `${jogo.gols_a}-${jogo.gols_b}` : "—"}
                          </td>
                          <td style={{ ...tdSmall, fontWeight: 800 }}>
                            {temResult ? pts : "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </details>
          );
        })}
      </section>
    </main>
  );
}

const th: React.CSSProperties = { padding: "10px 12px", fontWeight: 800, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.05em" };
const td: React.CSSProperties = { padding: "10px 12px" };
const tdSmall: React.CSSProperties = { padding: "6px 10px" };
