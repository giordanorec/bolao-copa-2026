import Link from "next/link";
import { createClient } from "@/lib/supabase-server";
import { Plus } from "lucide-react";
import LogoutButton from "@/components/LogoutButton";
import type { Bolao } from "@/lib/types";

export default async function Dashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .single();

  // bolões em que estou
  const { data: meusBoloes } = await supabase
    .from("bolao_membro")
    .select("bolao!inner(id, slug, nome, descricao, criador_id)")
    .eq("user_id", user.id);

  const boloes = (meusBoloes ?? []).map(
    (m) => (m as unknown as { bolao: Bolao }).bolao,
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl">Olá, {profile?.display_name ?? "amigo"}</h1>
          <p className="text-[--color-muted]">Seus bolões aparecem aqui</p>
        </div>
        <LogoutButton />
      </div>

      <div className="flex gap-3 flex-wrap">
        <Link href="/criar" className="btn btn-primary">
          <Plus size={18} /> Criar bolão novo
        </Link>
      </div>

      {boloes.length === 0 ? (
        <div className="card text-center text-[--color-muted]">
          <p className="mb-3">Você ainda não está em nenhum bolão.</p>
          <Link href="/criar" className="text-[--color-primary] font-semibold">
            Crie o seu →
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {boloes.map((b) => (
            <Link key={b.id} href={`/bolao/${b.slug}`} className="card hover:shadow-md transition-all">
              <h3 className="text-xl mb-1">{b.nome}</h3>
              {b.descricao && (
                <p className="text-sm text-[--color-muted] line-clamp-2">{b.descricao}</p>
              )}
              <p className="text-xs text-[--color-muted] mt-3 font-mono">/{b.slug}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
