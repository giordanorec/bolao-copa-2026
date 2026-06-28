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

type Admin = NonNullable<ReturnType<typeof createAdminClient>>;

/**
 * Confirma que `email` corresponde a uma conta cadastrada (auth.users).
 * Caminho rápido: RPC `email_tem_conta` (migration 2026-06-24). Se a RPC
 * ainda não foi aplicada, cai no fallback que pagina o admin do auth.
 */
async function emailTemConta(admin: Admin, email: string): Promise<boolean> {
  const alvo = email.trim().toLowerCase();
  const { data, error } = await admin.rpc("email_tem_conta", { p_email: alvo });
  if (!error) return data === true;

  // Fallback: pagina auth.users e procura o email (RPC ausente/erro).
  for (let page = 1; page <= 50; page++) {
    const { data: lote, error: e2 } = await admin.auth.admin.listUsers({
      page,
      perPage: 200,
    });
    if (e2) throw new Error("Falha ao verificar conta: " + e2.message);
    const users = lote?.users ?? [];
    if (users.length === 0) break;
    if (users.some((u) => (u.email ?? "").toLowerCase() === alvo)) return true;
    if (users.length < 200) break;
  }
  return false;
}

/** Adiciona uma contribuição como RASCUNHO (vai pro banco só ao processar). */
export async function adicionarContribuicao(formData: FormData) {
  const admin = await requireAdmin();

  const nome = (formData.get("nome") as string)?.trim();
  if (!nome) throw new Error("Nome é obrigatório.");
  // Valor é opcional: rascunho com vários Pix num único print entra como R$0
  // e os valores reais são preenchidos ao identificar cada pessoa.
  const valorRaw = (formData.get("valor") as string)?.trim();
  const valor = valorRaw ? parseValor(valorRaw) : 0;
  if (valor == null || valor < 0) throw new Error("Valor inválido.");

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

/**
 * Envia uma FOTO de Pix como rascunho. Pode ser um Pix individual detalhado
 * OU um extrato/relatório com vários — por definição cobre 1+ contribuintes,
 * identificados depois ao processar a imagem. Só pede a imagem (sem nome/valor).
 */
export async function adicionarFotoPix(formData: FormData) {
  const admin = await requireAdmin();

  const file = formData.get("comprovante") as File | null;
  if (!file || typeof file.size !== "number" || file.size === 0) {
    throw new Error("Selecione uma imagem do Pix.");
  }
  const ext = (file.name.split(".").pop() || "bin").toLowerCase().slice(0, 8);
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const buf = Buffer.from(await file.arrayBuffer());
  const { error: upErr } = await admin.storage
    .from(BUCKET)
    .upload(path, buf, { contentType: file.type || "application/octet-stream", upsert: false });
  if (upErr) throw new Error("Falha ao subir imagem: " + upErr.message);

  const nota = (formData.get("nota") as string)?.trim() || null;
  const { error } = await admin.from("contribuicoes").insert({
    nome: "📷 Foto de Pix (a identificar)",
    valor: 0,
    nota,
    comprovante_url: path,
    status: "rascunho",
  });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/contribuicoes");
}

/**
 * Processa os rascunhos: libera na allowlist só os emails com conta
 * cadastrada e marca processado. Rascunho com email SEM conta fica como
 * rascunho (visível) pra você conferir — nunca some nem libera errado.
 * Rascunho sem email vira pendente (processado sem email), como antes.
 */
export async function processarRascunhos() {
  const admin = await requireAdmin();

  const { data: rascunhos, error } = await admin
    .from("contribuicoes")
    .select("id, nome, email, instagram")
    .eq("status", "rascunho");
  if (error) throw new Error(error.message);
  if (!rascunhos || rascunhos.length === 0) return;

  // Verifica cada email; separa os que têm conta dos que não têm.
  const aLiberar: { email: string; nome: string; instagram: string | null }[] = [];
  const idsBloqueados = new Set<number>();
  for (const r of rascunhos) {
    if (!r.email) continue; // sem email vira pendente
    if (await emailTemConta(admin, r.email as string)) {
      aLiberar.push({
        email: r.email as string,
        nome: r.nome as string,
        instagram: (r.instagram as string | null) ?? null,
      });
    } else {
      idsBloqueados.add(r.id as number); // sem conta: não processa
    }
  }

  if (aLiberar.length > 0) {
    const { error: upErr } = await admin
      .from("contribuintes")
      .upsert(aLiberar, { onConflict: "email", ignoreDuplicates: false });
    if (upErr) throw new Error("Falha ao liberar: " + upErr.message);
  }

  // Marca processado todos os rascunhos MENOS os bloqueados (email sem conta).
  const idsProcessar = rascunhos
    .map((r) => r.id as number)
    .filter((id) => !idsBloqueados.has(id));
  if (idsProcessar.length > 0) {
    const { error: stErr } = await admin
      .from("contribuicoes")
      .update({ status: "processado", processado_em: new Date().toISOString() })
      .in("id", idsProcessar);
    if (stErr) throw new Error(stErr.message);
  }
  revalidatePath("/admin");
}

/**
 * Identifica um pagamento PENDENTE: grava o email, VERIFICA que ele tem
 * conta cadastrada e — só então — libera na allowlist de uma vez.
 * Fecha o buraco antigo em que salvar o email no pendente não liberava
 * nada (e impede habilitar um email sem conta, digitado errado).
 */
export async function identificarPendente(formData: FormData) {
  const admin = await requireAdmin();
  const id = Number(formData.get("id"));
  if (!Number.isFinite(id)) throw new Error("ID inválido.");

  const email = normEmail(formData.get("email") as string);
  if (!email) throw new Error("Informe o email pra liberar este pagamento.");
  const instagram = normInsta(formData.get("instagram") as string);

  if (!(await emailTemConta(admin, email))) {
    throw new Error(
      `O email "${email}" não tem conta cadastrada — confira o endereço. Nada foi liberado.`,
    );
  }

  // Pega nome do pagamento pra registrar na allowlist.
  const { data: row } = await admin
    .from("contribuicoes")
    .select("nome")
    .eq("id", id)
    .maybeSingle();

  const { error: upContrib } = await admin
    .from("contribuicoes")
    .update({ email, instagram })
    .eq("id", id);
  if (upContrib) throw new Error(upContrib.message);

  const { error: upAllow } = await admin
    .from("contribuintes")
    .upsert(
      { email, nome: (row?.nome as string) ?? null, instagram },
      { onConflict: "email", ignoreDuplicates: false },
    );
  if (upAllow) throw new Error("Falha ao liberar: " + upAllow.message);

  revalidatePath("/admin/contribuicoes");
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

/**
 * Remove uma contribuição PENDENTE (já processada, mas sem email).
 * Restrito a `email is null` pra nunca apagar um pagamento já identificado
 * e liberado por engano.
 */
export async function removerPendente(formData: FormData) {
  const admin = await requireAdmin();
  const id = Number(formData.get("id"));
  if (!Number.isFinite(id)) throw new Error("ID inválido.");
  const { error } = await admin
    .from("contribuicoes")
    .delete()
    .eq("id", id)
    .is("email", null);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/contribuicoes");
}

/**
 * Edita os dados de uma PESSOA na allowlist (nome / instagram / nota).
 * Aplica em TODOS os emails dela (campo `emails` separado por vírgula),
 * o que também consolida pessoas com vários emails sob o mesmo nome.
 */
export async function atualizarContribuinte(formData: FormData) {
  const admin = await requireAdmin();
  const emails = ((formData.get("emails") as string) ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  if (emails.length === 0) throw new Error("Email obrigatório.");

  const patch: Record<string, unknown> = {};
  if (formData.has("nome")) patch.nome = (formData.get("nome") as string)?.trim() || null;
  if (formData.has("instagram")) patch.instagram = normInsta(formData.get("instagram") as string);
  if (formData.has("nota")) patch.nota = (formData.get("nota") as string)?.trim() || null;
  if (Object.keys(patch).length === 0) return;

  const { error } = await admin
    .from("contribuintes")
    .update(patch)
    .in("email", emails);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/contribuicoes");
}

/**
 * Marca/desmarca um post do Instagram como já publicado em @arena.das.ias.
 * `postId` casa com o id no ig-posts-manifest.json. Persiste em
 * `ig_posts_status` (service_role only).
 */
export async function marcarPublicado(postId: string, publicado: boolean) {
  const admin = await requireAdmin();
  if (!postId) throw new Error("Post inválido.");
  const { error } = await admin.from("ig_posts_status").upsert(
    {
      post_id: postId,
      publicado,
      publicado_em: publicado ? new Date().toISOString() : null,
      atualizado_em: new Date().toISOString(),
    },
    { onConflict: "post_id" },
  );
  if (error) throw new Error(error.message);
  revalidatePath("/admin/instagram-posts");
}
