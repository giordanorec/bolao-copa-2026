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
    .select("display_name")
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

      <div className="actions">
        <Link href="/criar" className="btn primary">
          ➕ Criar bolão novo
        </Link>
        <a
          href="https://giordanorec.github.io/bolao-copa-2026/"
          className="btn yellow"
        >
          🏆 Ranking das IAs ↗
        </a>
      </div>

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
                <h3>{b.nome}</h3>
                {b.descricao && <p>{b.descricao}</p>}
                <p className="slug">/{b.slug}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
