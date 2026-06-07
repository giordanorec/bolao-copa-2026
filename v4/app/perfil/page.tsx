import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import PerfilForm from "./PerfilForm";

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
    .select("display_name, instagram, whatsapp, opt_in_geral")
    .eq("id", user.id)
    .single();

  return (
    <PerfilForm
      inicial={{
        display_name: profile?.display_name ?? "",
        instagram: profile?.instagram ?? "",
        whatsapp: profile?.whatsapp ?? "",
        opt_in_geral: profile?.opt_in_geral ?? false,
      }}
      email={user.email ?? ""}
    />
  );
}
