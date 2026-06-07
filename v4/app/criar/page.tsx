import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import CriarForm from "./CriarForm";

export const metadata = {
  title: "Criar bolão · Bolão das IAs",
};

export default async function CriarBolaoPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/criar");
  return <CriarForm />;
}
