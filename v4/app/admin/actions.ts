"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient, isAdminEmail } from "@/lib/admin";

const BUCKET = "comprovantes";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!isAdminEmail(user?.email)) {
    throw new Error("Acesso negado.");
  }
  const admin = createAdminClient();
  if (!admin) throw new Error("Service role ausente no servidor.");
  return admin;
}

function parseValor(raw: string | null): number | null {
  if (!raw) return null;
  const n = Number(String(raw).replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

function normEmail(raw: string | null): string | null {
  const e = (raw ?? "").trim().toLowerCase();
  return e ? e : null;
}

function normInsta(raw: string | null): string | null {
  let s = (raw ?? "").trim();
  if (!s) return null;
  s = s.replace(/^@+/, "").replace(/^https?:\/\/(www\.)?instagram\.com\//i, "").replace(/\/+$/, "");
  return s ? "@" + s : null;
}

/** Adiciona uma contribuição como RASCUNHO (vai pro banco só ao processar). */
export async function adicionarContribuicao(formData: FormData) {
  const admin = await requireAdmin();

  const nome = (formData.get("nome") as string)?.trim();
  const valor = parseValor(formData.get("valor") as string);
  if (!nome) throw new Error("Nome é obrigatório.");
  if (valor == null || valor <= 0) throw new Error("Valor inválido.");

  const email = normEmail(formData.get("email") as string);
  const instagram = normInsta(formData.get("instagram") as string);
  const dataRaw = (formData.get("data") as string)?.trim() || null;
  const horaRaw = (formData.get("hora") as string)?.trim() || null;
  const nota = (formData.get("nota") as string)?.trim() || null;

  let comprovante_url: string | null = null;
  const file = formData.get("comprovante") as File | null;
  if (file && typeof file.size === "number" && file.size > 0) {
    const ext = (file.name.split(".").pop() || "bin").toLowerCase().slice(0, 8);
    const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const buf = Buffer.from(await file.arrayBuffer());
    const { error: upErr } = await admin.storage
      .from(BUCKET)
      .upload(path, buf, { contentType: file.type || "application/octet-stream", upsert: false });
    if (upErr) throw new Error("Falha ao subir comprovante: " + upErr.message);
    comprovante_url = path;
  }

  const { error } = await admin.from("contribuicoes").insert({
    nome,
    email,
    valor,
    data: dataRaw,
    hora: horaRaw,
    instagram,
    nota,
    comprovante_url,
    status: "rascunho",
  });
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}

/** Processa TODOS os rascunhos: libera os emails na allowlist e marca processado. */
export async function processarRascunhos() {
  const admin = await requireAdmin();

  const { data: rascunhos, error } = await admin
    .from("contribuicoes")
    .select("id, nome, email, instagram")
    .eq("status", "rascunho");
  if (error) throw new Error(error.message);
  if (!rascunhos || rascunhos.length === 0) return;

  // Libera (upsert) na allowlist os que têm email.
  const comEmail = rascunhos.filter((r) => r.email);
  if (comEmail.length > 0) {
    const linhas = comEmail.map((r) => ({
      email: r.email as string,
      nome: r.nome as string,
      instagram: (r.instagram as string | null) ?? null,
    }));
    const { error: upErr } = await admin
      .from("contribuintes")
      .upsert(linhas, { onConflict: "email", ignoreDuplicates: false });
    if (upErr) throw new Error("Falha ao liberar: " + upErr.message);
  }

  const { error: stErr } = await admin
    .from("contribuicoes")
    .update({ status: "processado", processado_em: new Date().toISOString() })
    .eq("status", "rascunho");
  if (stErr) throw new Error(stErr.message);
  revalidatePath("/admin");
}

/** Atualiza email / instagram / nota / valor de uma contribuição (ex.: identificar pendente). */
export async function atualizarContribuicao(formData: FormData) {
  const admin = await requireAdmin();
  const id = Number(formData.get("id"));
  if (!Number.isFinite(id)) throw new Error("ID inválido.");

  const patch: Record<string, unknown> = {};
  if (formData.has("email")) patch.email = normEmail(formData.get("email") as string);
  if (formData.has("instagram")) patch.instagram = normInsta(formData.get("instagram") as string);
  if (formData.has("nota")) patch.nota = (formData.get("nota") as string)?.trim() || null;
  if (formData.has("valor")) {
    const v = parseValor(formData.get("valor") as string);
    if (v != null) patch.valor = v;
  }
  if (Object.keys(patch).length === 0) return;

  const { error } = await admin.from("contribuicoes").update(patch).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}

/** Remove uma contribuição em rascunho (não mexe nas já processadas). */
export async function removerContribuicao(formData: FormData) {
  const admin = await requireAdmin();
  const id = Number(formData.get("id"));
  if (!Number.isFinite(id)) throw new Error("ID inválido.");
  const { error } = await admin
    .from("contribuicoes")
    .delete()
    .eq("id", id)
    .eq("status", "rascunho");
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}

/** Define/atualiza o Instagram diretamente na allowlist (contribuintes). */
export async function definirInstagramContribuinte(formData: FormData) {
  const admin = await requireAdmin();
  const email = normEmail(formData.get("email") as string);
  if (!email) throw new Error("Email obrigatório.");
  const instagram = normInsta(formData.get("instagram") as string);
  const { error } = await admin
    .from("contribuintes")
    .update({ instagram })
    .eq("email", email);
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}
