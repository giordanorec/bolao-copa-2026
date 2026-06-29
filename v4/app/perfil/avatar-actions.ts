"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase-server";

const BUCKET = "avatares";
const MAX_BYTES = 2 * 1024 * 1024; // 2 MB
const MIME_ACEITOS = new Set(["image/jpeg", "image/png", "image/webp"]);

export type AvatarResult =
  | { ok: true; url: string }
  | { ok: false; erro: string };

export async function uploadAvatar(
  formData: FormData,
): Promise<AvatarResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, erro: "Não autenticado." };

  const arquivo = formData.get("avatar") as File | null;
  if (!arquivo || arquivo.size === 0) {
    return { ok: false, erro: "Nenhum arquivo enviado." };
  }

  // Validação de tamanho
  if (arquivo.size > MAX_BYTES) {
    return { ok: false, erro: "Arquivo muito grande. Máximo 2 MB." };
  }

  // Validação de tipo MIME server-side (não confia no front)
  if (!MIME_ACEITOS.has(arquivo.type)) {
    return {
      ok: false,
      erro: "Formato inválido. Use JPG, PNG ou WebP.",
    };
  }

  const ext = arquivo.type === "image/jpeg" ? "jpg"
    : arquivo.type === "image/png" ? "png"
    : "webp";

  // Path: avatares/<user_id>/<timestamp>.<ext> — monotônico, evita cache stale
  const path = `${user.id}/${Date.now()}.${ext}`;

  const buffer = Buffer.from(await arquivo.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, buffer, {
      contentType: arquivo.type,
      upsert: true,
    });

  if (uploadError) {
    console.error("[avatar] upload error:", uploadError.message);
    return { ok: false, erro: "Falha no upload. Tente de novo." };
  }

  const { data: publicUrlData } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(path);

  const url = publicUrlData.publicUrl;

  const { error: dbError } = await supabase
    .from("profiles")
    .update({ avatar_url: url })
    .eq("id", user.id);

  if (dbError) {
    console.error("[avatar] db error:", dbError.message);
    return { ok: false, erro: "Upload ok, mas falha ao salvar URL no perfil." };
  }

  revalidatePath("/perfil");
  revalidatePath("/ranking-geral");

  return { ok: true, url };
}

export async function removerAvatar(): Promise<AvatarResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, erro: "Não autenticado." };

  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: null })
    .eq("id", user.id);

  if (error) {
    return { ok: false, erro: "Não foi possível remover a foto." };
  }

  revalidatePath("/perfil");
  revalidatePath("/ranking-geral");

  return { ok: true, url: "" };
}
