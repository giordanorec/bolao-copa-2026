import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient, isAdminEmail } from "@/lib/admin";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin · Bolão das IAs",
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

type MembroRow = { bolao_id: string; user_id: string };

type ProfileRow = { id: string; display_name: string };

type PalpiteRow = {
  user_id: string;
  jogo_numero: number;
  gols_a: number;
  gols_b: number;
};

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isAdminEmail(user.email)) notFound();

  const admin = createAdminClient();
  if (!admin) {
    return (
      <main style={{ maxWidth: 720, margin: "60px auto", padding: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 900, marginBottom: 16 }}>
          🛠️ Configuração pendente
        </h1>
        <p style={{ marginBottom: 12 }}>
          A página /admin precisa da variável de ambiente{" "}
          <code style={{
            background: "var(--bg-soft)",
            padding: "2px 8px",
            borderRadius: 6,
            fontFamily: "var(--ff-mono)",
            fontSize: 14,
          }}>
            SUPABASE_SERVICE_ROLE_KEY
          </code>{" "}
          pra bypassar RLS e listar todos os bolões.
        </p>
        <ol style={{ paddingLeft: 24, lineHeight: 1.7 }}>
          <li>Abre <a href="https://supabase.com/dashboard/project/dkrsxsvdihrxmehilohq/settings/api" target="_blank" rel="noreferrer">Supabase → Settings → API</a></li>
          <li>Copia a <strong>service_role secret</strong></li>
          <li>Adiciona em <code>.env.local</code> + Vercel (Production e Preview): <code>SUPABASE_SERVICE_ROLE_KEY=...</code></li>
          <li>Faz redeploy e volta aqui.</li>
        </ol>
        <p style={{ marginTop: 24, fontSize: 13, color: "var(--fg-muted)" }}>
          A chave NUNCA pode ter prefixo <code>NEXT_PUBLIC_</code> nem ir pro
          repo. Ela bypassa toda a segurança do banco.
        </p>
      </main>
    );
  }

  // Estatísticas globais
  const [
    { data: boloes, count: totalBoloes },
    { count: totalProfiles },
    { count: totalPalpites },
    { count: totalMembros },
  ] = await Promise.all([
    admin
      .from("bolao")
      .select("id, slug, nome, descricao, criador_id, encerrado, criado_em", { count: "exact" })
      .order("criado_em", { ascending: false }),
    admin.from("profiles").select("id", { count: "exact", head: true }),
    admin.from("palpite").select("user_id", { count: "exact", head: true }),
    admin.from("bolao_membro").select("user_id", { count: "exact", head: true }),
  ]);

  const boloesData = (boloes ?? []) as BolaoRow[];
  const bolaoIds = boloesData.map((b) => b.id);
  const criadorIds = Array.from(new Set(boloesData.map((b) => b.criador_id)));

  const [{ data: criadores }, { data: membros }] = await Promise.all([
    admin.from("profiles").select("id, display_name").in("id", criadorIds.length ? criadorIds : ["00000000-0000-0000-0000-000000000000"]),
    admin.from("bolao_membro").select("bolao_id, user_id").in("bolao_id", bolaoIds.length ? bolaoIds : ["00000000-0000-0000-0000-000000000000"]),
  ]);

  const criadoresMap = new Map(((criadores ?? []) as ProfileRow[]).map((p) => [p.id, p.display_name]));
  const membrosByBolao = new Map<string, number>();
  ((membros ?? []) as MembroRow[]).forEach((m) => {
    membrosByBolao.set(m.bolao_id, (membrosByBolao.get(m.bolao_id) ?? 0) + 1);
  });

  // Palpites por bolão = palpites distintos dos user_ids membros
  // (cálculo grosso, suficiente pra auditoria)
  const userIdsByBolao = new Map<string, Set<string>>();
  ((membros ?? []) as MembroRow[]).forEach((m) => {
    if (!userIdsByBolao.has(m.bolao_id)) userIdsByBolao.set(m.bolao_id, new Set());
    userIdsByBolao.get(m.bolao_id)!.add(m.user_id);
  });

  const userIdsAll = Array.from(new Set(((membros ?? []) as MembroRow[]).map((m) => m.user_id)));
  const { data: palpitesGlobais } = await admin
    .from("palpite")
    .select("user_id, jogo_numero")
    .in("user_id", userIdsAll.length ? userIdsAll : ["00000000-0000-0000-0000-000000000000"]);

  const palpitesPorUser = new Map<string, number>();
  ((palpitesGlobais ?? []) as { user_id: string }[]).forEach((p) => {
    palpitesPorUser.set(p.user_id, (palpitesPorUser.get(p.user_id) ?? 0) + 1);
  });

  return (
    <main style={{ maxWidth: 1080, margin: "32px auto", padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <Link href="/" style={{ fontSize: 13, color: "var(--fg-muted)" }}>
          ← voltar pro site
        </Link>
      </div>

      <h1 style={{ fontSize: 32, fontWeight: 900, marginBottom: 4 }}>
        🛡️ Painel admin
      </h1>
      <p style={{ color: "var(--fg-muted)", marginBottom: 28, fontSize: 14 }}>
        Acesso restrito a <code>{user.email}</code> · RLS bypassada (service_role).
      </p>

      {/* Estatísticas */}
      <section style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: 14,
        marginBottom: 36,
      }}>
        <StatCard label="Bolões" value={totalBoloes ?? 0} icon="🎯" />
        <StatCard label="Usuários" value={totalProfiles ?? 0} icon="👤" />
        <StatCard label="Membros (entradas)" value={totalMembros ?? 0} icon="👥" />
        <StatCard label="Palpites" value={totalPalpites ?? 0} icon="⚽" />
      </section>

      {/* Lista de bolões */}
      <section>
        <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 14 }}>
          📋 Todos os bolões ({totalBoloes ?? 0})
        </h2>

        {boloesData.length === 0 ? (
          <p style={{ color: "var(--fg-muted)", fontStyle: "italic" }}>
            Nenhum bolão criado ainda.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {boloesData.map((b) => {
              const membrosCount = membrosByBolao.get(b.id) ?? 0;
              const palpitesCount = Array.from(userIdsByBolao.get(b.id) ?? []).reduce(
                (sum, uid) => sum + (palpitesPorUser.get(uid) ?? 0),
                0,
              );
              return (
                <div
                  key={b.id}
                  style={{
                    border: "1px solid var(--line)",
                    borderRadius: "var(--r-m)",
                    padding: 18,
                    background: "var(--bg-2)",
                    display: "grid",
                    gridTemplateColumns: "1fr auto",
                    gap: 12,
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 6, flexWrap: "wrap" }}>
                      <strong style={{ fontSize: 18 }}>{b.nome}</strong>
                      <code style={{
                        fontSize: 12,
                        color: "var(--fg-muted)",
                        background: "var(--bg-soft)",
                        padding: "2px 8px",
                        borderRadius: 6,
                        fontFamily: "var(--ff-mono)",
                      }}>
                        /{b.slug}
                      </code>
                      {b.encerrado && (
                        <span style={{
                          fontSize: 11,
                          background: "#FF5A5F",
                          color: "white",
                          padding: "2px 8px",
                          borderRadius: 999,
                          fontWeight: 700,
                        }}>
                          ENCERRADO
                        </span>
                      )}
                    </div>
                    {b.descricao && (
                      <p style={{ fontSize: 13, color: "var(--fg-muted)", marginBottom: 6 }}>
                        {b.descricao}
                      </p>
                    )}
                    <div style={{ fontSize: 12, color: "var(--fg-muted)", display: "flex", gap: 14, flexWrap: "wrap" }}>
                      <span>👤 criador: <strong>{criadoresMap.get(b.criador_id) ?? "?"}</strong></span>
                      <span>👥 {membrosCount} {membrosCount === 1 ? "membro" : "membros"}</span>
                      <span>⚽ {palpitesCount} palpites totais</span>
                      <span>📅 {new Date(b.criado_em).toLocaleString("pt-BR")}</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <Link
                      href={`/admin/bolao/${b.slug}`}
                      className="btn"
                      style={{ fontSize: 13, padding: "8px 14px" }}
                    >
                      🔍 Auditar
                    </Link>
                    <Link
                      href={`/bolao/${b.slug}`}
                      className="btn ghost"
                      style={{ fontSize: 12, padding: "6px 14px" }}
                    >
                      ↗ ver público
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section style={{ marginTop: 36, paddingTop: 24, borderTop: "1px solid var(--line)" }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 14 }}>
          🔗 Auditorias úteis
        </h2>
        <ul style={{ paddingLeft: 20, lineHeight: 1.9 }}>
          <li><Link href="/ranking-geral">/ranking-geral</Link> — checar ordem competitiva</li>
          <li><Link href="/ranking-ias">/ranking-ias</Link> — ranking só de IAs</li>
          <li><Link href="/jogos">/jogos</Link> — placares votados por jogo</li>
        </ul>
      </section>
    </main>
  );
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: string }) {
  return (
    <div style={{
      border: "1px solid var(--line)",
      borderRadius: "var(--r-m)",
      padding: 18,
      background: "var(--bg-2)",
    }}>
      <div style={{ fontSize: 22, marginBottom: 4 }}>{icon}</div>
      <div style={{ fontSize: 32, fontWeight: 900, lineHeight: 1, fontFamily: "var(--ff-mono)" }}>
        {value.toLocaleString("pt-BR")}
      </div>
      <div style={{ fontSize: 12, color: "var(--fg-muted)", marginTop: 6, textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700 }}>
        {label}
      </div>
    </div>
  );
}
