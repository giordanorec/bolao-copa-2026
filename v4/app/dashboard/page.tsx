import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import LogoutButton from "@/components/LogoutButton";
import type { Bolao } from "@/lib/types";

export default async function Dashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/dashboard");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, opt_in_geral")
    .eq("id", user.id)
    .single();

  const { data: meusBoloes } = await supabase
    .from("bolao_membro")
    .select("bolao!inner(id, slug, nome, descricao, criador_id)")
    .eq("user_id", user.id);

  const boloes = (meusBoloes ?? []).map(
    (m) => (m as unknown as { bolao: Bolao }).bolao,
  );

  return (
    <>
      <div className="dash-head" style={{ marginTop: 40 }}>
        <div>
          <h1>Olá, {profile?.display_name ?? "amigo"}!</h1>
          <p>Seus bolões aparecem aqui 👇</p>
        </div>
        <LogoutButton />
      </div>

      {user.email?.toLowerCase() === "denilson-dgs@hotmail.com" && (
        <Link
          href="/analise-v2"
          className="card"
          style={{
            display: "block",
            marginTop: 24,
            textDecoration: "none",
            background:
              "linear-gradient(135deg, var(--accent), var(--accent-2))",
            color: "var(--secondary)",
            border: "none",
          }}
        >
          <h3 style={{ marginBottom: 6, color: "var(--secondary)" }}>
            💛 Obrigado pela sugestão. Implementada.
          </h3>
          <p style={{ color: "var(--secondary)", opacity: 0.85 }}>
            O seletor de IA já está no ar na Análise v1 → v2: escolha uma IA e
            veja todas as mudanças dela de uma vez. →
          </p>
        </Link>
      )}

      {user.email?.toLowerCase() === "renanpglima@gmail.com" && (
        <Link
          href="/analise-v2"
          className="card"
          style={{
            display: "block",
            marginTop: 24,
            textDecoration: "none",
            background:
              "linear-gradient(135deg, var(--accent), var(--accent-2))",
            color: "var(--secondary)",
            border: "none",
          }}
        >
          <h3 style={{ marginBottom: 6, color: "var(--secondary)" }}>
            🎁 Presentinho especial para Renan ;)
          </h3>
          <p style={{ color: "var(--secondary)", opacity: 0.85 }}>
            Liberamos seu acesso à Análise v1 → v2. Aproveite! →
          </p>
        </Link>
      )}

      <div className="actions">
        <Link href="/criar" className="btn primary">
          ➕ Criar bolão novo
        </Link>
        <Link href="/perfil" className="btn">
          👤 Meu perfil
        </Link>
        <Link href="/ranking-geral" className="btn yellow">
          🏆 Ranking geral
        </Link>
      </div>

      {!profile?.opt_in_geral && (
        <Link
          href="/perfil"
          className="card"
          style={{
            display: "block",
            marginTop: 24,
            textDecoration: "none",
            background:
              "linear-gradient(135deg, color-mix(in srgb, var(--accent) 14%, transparent), color-mix(in srgb, var(--primary) 10%, transparent))",
            border: "1px solid color-mix(in srgb, var(--accent) 35%, transparent)",
          }}
        >
          <h3 style={{ marginBottom: 6 }}>
            🏆 Concorra no Hall da Fama
          </h3>
          <p style={{ color: "var(--fg-mid)" }}>
            Seus palpites ainda são privados. Deixe-os públicos pra entrar no
            Ranking Geral, onde humanos e IAs disputam a liderança no mesmo
            placar. →
          </p>
        </Link>
      )}

      {boloes.length === 0 ? (
        <div className="card empty">
          <p>Você ainda não está em nenhum bolão.</p>
          <Link href="/criar">Crie o seu →</Link>
        </div>
      ) : (
        <div className="bolao-grid">
          {boloes.map((b) => (
            <Link
              key={b.id}
              href={`/bolao/${b.slug}`}
              className="bolao-card-link"
            >
              <div className="card">
                <div className="bolao-card-badge">🏆</div>
                <h3>{b.nome}</h3>
                {b.descricao && <p>{b.descricao}</p>}
                <div className="bolao-card-foot">
                  <span className="slug">/{b.slug}</span>
                  <span className="bolao-card-cta">Abrir ranking →</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
