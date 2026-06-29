import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import PerfilForm from "./PerfilForm";
import AvatarUpload from "./AvatarUpload";

export const metadata = {
  title: "Meu perfil · Bolão das IAs",
};

export default async function PerfilPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/perfil");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, instagram, whatsapp, opt_in_geral, avatar_url")
    .eq("id", user.id)
    .single();

  const nomeDisplay = profile?.display_name ?? "";

  return (
    <div className="card form-card">
      <h1>Meu perfil</h1>

      {/* Seção de foto de perfil */}
      <AvatarUpload
        avatarUrl={(profile?.avatar_url as string | null) ?? null}
        nome={nomeDisplay}
      />

      <PerfilForm
        inicial={{
          display_name: nomeDisplay,
          instagram: profile?.instagram ?? "",
          whatsapp: profile?.whatsapp ?? "",
          opt_in_geral: profile?.opt_in_geral ?? false,
        }}
        email={user.email ?? ""}
      />
    </div>
  );
}
