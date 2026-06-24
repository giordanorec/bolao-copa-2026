import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient, isAdminEmail } from "@/lib/admin";
import {
  adicionarContribuicao,
  processarRascunhos,
  atualizarContribuicao,
  removerContribuicao,
  atualizarContribuinte,
} from "../actions";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Contribuições · Admin",
  robots: { index: false, follow: false },
};

const BUCKET = "comprovantes";

type Contribuicao = {
  id: number;
  nome: string;
  email: string | null;
  valor: number;
  data: string | null;
  hora: string | null;
  instagram: string | null;
  comprovante_url: string | null;
  status: string;
  nota: string | null;
  criado_em: string;
  processado_em: string | null;
};

type Contribuinte = {
  email: string;
  nome: string | null;
  instagram: string | null;
  nota: string | null;
};

function brl(n: number): string {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// Nível (prestígio) por valor total contribuído. Só reconhecimento.
function nivelDe(total: number): { label: string; badge: string; cls: string } {
  if (total >= 50) return { label: "Padrinho", badge: "👑", cls: "cn-padrinho" };
  if (total >= 25) return { label: "Mantenedor", badge: "🛟", cls: "cn-mantenedor" };
  if (total >= 10) return { label: "Apoiador", badge: "💛", cls: "cn-apoiador" };
  return { label: "Cortesia", badge: "🎁", cls: "cn-cortesia" };
}

export default async function ContribuicoesAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ ordem?: string }>;
}) {
  const { ordem } = await searchParams;
  const ordenarPorValor = ordem === "valor";
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
        <p>
          Falta a env <code>SUPABASE_SERVICE_ROLE_KEY</code> no servidor. Sem ela
          não dá pra ler/gravar contribuições.
        </p>
      </main>
    );
  }

  const { data: contribsRaw, error: contribsErr } = await admin
    .from("contribuicoes")
    .select(
      "id, nome, email, valor, data, hora, instagram, comprovante_url, status, nota, criado_em, processado_em",
    )
    .order("status", { ascending: true })
    .order("data", { ascending: false })
    .order("hora", { ascending: false });

  const tabelaFaltando =
    contribsErr &&
    /relation .*contribuicoes.* does not exist|could not find the table/i.test(
      contribsErr.message,
    );

  if (tabelaFaltando) {
    return (
      <main style={{ maxWidth: 760, margin: "60px auto", padding: 24 }}>
        <Link href="/admin" style={{ fontSize: 13, color: "var(--fg-muted)" }}>
          ← painel admin
        </Link>
        <h1 style={{ fontSize: 28, fontWeight: 900, margin: "16px 0" }}>
          🗄️ Rode a migration primeiro
        </h1>
        <p style={{ marginBottom: 12 }}>
          A tabela <code>contribuicoes</code> ainda não existe no banco. Abra o{" "}
          <a
            href="https://supabase.com/dashboard/project/dkrsxsvdihrxmehilohq/sql/new"
            target="_blank"
            rel="noreferrer"
          >
            SQL Editor do Supabase
          </a>{" "}
          e cole o conteúdo de{" "}
          <code>v4/sql/migrations/2026-06-24_contribuicoes.sql</code>.
        </p>
        <p style={{ fontSize: 13, color: "var(--fg-muted)" }}>
          Depois recarregue esta página.
        </p>
      </main>
    );
  }

  if (contribsErr) {
    return (
      <main style={{ maxWidth: 720, margin: "60px auto", padding: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 900, marginBottom: 12 }}>
          Erro ao ler contribuições
        </h1>
        <pre style={{ whiteSpace: "pre-wrap", color: "#C0392B" }}>
          {contribsErr.message}
        </pre>
      </main>
    );
  }

  const contribs = (contribsRaw ?? []) as Contribuicao[];
  const rascunhos = contribs.filter((c) => c.status === "rascunho");
  const processados = contribs.filter((c) => c.status !== "rascunho");
  const pendentes = processados.filter((c) => !c.email);

  const totalProcessado = processados.reduce((s, c) => s + Number(c.valor), 0);
  const totalRascunho = rascunhos.reduce((s, c) => s + Number(c.valor), 0);

  // Total contribuído por email (soma de todos os pagamentos, juntando repetidos)
  const totalPorEmail = new Map<string, number>();
  contribs.forEach((c) => {
    if (!c.email) return;
    const k = c.email.toLowerCase().trim();
    totalPorEmail.set(k, (totalPorEmail.get(k) ?? 0) + Number(c.valor));
  });

  // Allowlist (contribuintes liberados)
  const { data: contribuintesRaw } = await admin
    .from("contribuintes")
    .select("email, nome, instagram, nota")
    .order("nome", { ascending: true });
  const contribuintes = (contribuintesRaw ?? []) as Contribuinte[];

  // Agrupa por PESSOA (mesma pessoa pode ter vários emails liberados).
  // Chave = nome normalizado; sem nome, cada email é sua própria pessoa.
  type Pessoa = {
    nome: string | null;
    emails: string[];
    instagram: string | null;
    nota: string | null;
    total: number;
  };
  const pessoasMap = new Map<string, Pessoa>();
  for (const c of contribuintes) {
    const nomeNorm = (c.nome ?? "").toLowerCase().trim().replace(/\s+/g, " ");
    const key = nomeNorm || `email:${c.email.toLowerCase().trim()}`;
    let p = pessoasMap.get(key);
    if (!p) {
      p = { nome: c.nome, emails: [], instagram: null, nota: null, total: 0 };
      pessoasMap.set(key, p);
    }
    p.emails.push(c.email);
    if (!p.nome && c.nome) p.nome = c.nome;
    if (!p.instagram && c.instagram) p.instagram = c.instagram;
    if (!p.nota && c.nota) p.nota = c.nota;
  }
  for (const p of pessoasMap.values()) {
    p.total = p.emails.reduce(
      (s, e) => s + (totalPorEmail.get(e.toLowerCase().trim()) ?? 0),
      0,
    );
  }
  const pessoas = Array.from(pessoasMap.values()).sort((a, b) =>
    ordenarPorValor
      ? b.total - a.total ||
        (a.nome ?? a.emails[0]).localeCompare(b.nome ?? b.emails[0])
      : (a.nome ?? a.emails[0]).localeCompare(b.nome ?? b.emails[0]),
  );
  // Cortesia = liberado mas sem contribuição registrada (total R$0).
  const totalCortesias = pessoas.filter((p) => p.total === 0).length;

  // URLs assinadas pros comprovantes (bucket privado)
  const paths = contribs
    .map((c) => c.comprovante_url)
    .filter((p): p is string => !!p);
  const signedMap = new Map<string, string>();
  if (paths.length > 0) {
    const { data: signed } = await admin.storage
      .from(BUCKET)
      .createSignedUrls(paths, 60 * 30);
    (signed ?? []).forEach((s) => {
      if (s.path && s.signedUrl) signedMap.set(s.path, s.signedUrl);
    });
  }

  return (
    <main style={{ maxWidth: 1080, margin: "32px auto", padding: 24 }}>
      <ContribStyle />

      <div style={{ marginBottom: 20 }}>
        <Link href="/admin" style={{ fontSize: 13, color: "var(--fg-muted)" }}>
          ← painel admin
        </Link>
      </div>

      <h1 style={{ fontSize: 32, fontWeight: 900, marginBottom: 4 }}>
        💰 Contribuições
      </h1>
      <p style={{ color: "var(--fg-muted)", marginBottom: 28, fontSize: 14 }}>
        Adicione como rascunho e clique <strong>Processar</strong> pra liberar
        todos de uma vez na allowlist. Logado como <code>{user.email}</code>.
      </p>

      {/* Resumo */}
      <section className="cstat-grid">
        <div className="cstat">
          <div className="cstat-ic">✅</div>
          <div className="cstat-val">{brl(totalProcessado)}</div>
          <div className="cstat-lbl">
            Processado · {processados.length} pgto
          </div>
        </div>
        <div className="cstat">
          <div className="cstat-ic">📝</div>
          <div className="cstat-val">{brl(totalRascunho)}</div>
          <div className="cstat-lbl">Rascunho · {rascunhos.length} pgto</div>
        </div>
        <div className="cstat">
          <div className="cstat-ic">🔓</div>
          <div className="cstat-val">{pessoas.length}</div>
          <div className="cstat-lbl">Pessoas liberadas</div>
        </div>
        <div className="cstat">
          <div className="cstat-ic">🎁</div>
          <div className="cstat-val">{totalCortesias}</div>
          <div className="cstat-lbl">Cortesias (R$0)</div>
        </div>
        <div className="cstat">
          <div className="cstat-ic">❓</div>
          <div className="cstat-val">{pendentes.length}</div>
          <div className="cstat-lbl">Sem email (pendentes)</div>
        </div>
      </section>

      {/* Adicionar nova contribuição */}
      <section className="cbox">
        <h2 className="ctitle">➕ Nova contribuição (rascunho)</h2>
        <form action={adicionarContribuicao} className="cform">
          <div className="cfield">
            <label>Nome *</label>
            <input className="input" name="nome" required placeholder="Nome completo" />
          </div>
          <div className="cfield">
            <label>Valor (R$) *</label>
            <input className="input" name="valor" required placeholder="10,00" inputMode="decimal" />
          </div>
          <div className="cfield">
            <label>Email</label>
            <input className="input" name="email" type="email" placeholder="opcional — pra liberar" />
          </div>
          <div className="cfield">
            <label>Instagram</label>
            <input className="input" name="instagram" placeholder="@usuario" />
          </div>
          <div className="cfield">
            <label>Data</label>
            <input className="input" name="data" type="date" />
          </div>
          <div className="cfield">
            <label>Hora</label>
            <input className="input" name="hora" type="time" />
          </div>
          <div className="cfield cfield-wide">
            <label>Nota (interno / mensagem de agradecimento)</label>
            <input className="input" name="nota" placeholder="opcional" />
          </div>
          <div className="cfield cfield-wide">
            <label>Comprovante Pix (imagem)</label>
            <input className="input" name="comprovante" type="file" accept="image/*,application/pdf" />
          </div>
          <div className="cfield-wide">
            <button type="submit" className="btn primary small">
              Salvar rascunho
            </button>
          </div>
        </form>
      </section>

      {/* Rascunhos pendentes de processar */}
      <section className="cbox">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <h2 className="ctitle" style={{ margin: 0 }}>
            📝 Rascunhos ({rascunhos.length})
          </h2>
          {rascunhos.length > 0 && (
            <form action={processarRascunhos}>
              <button type="submit" className="btn yellow small">
                ⚡ Processar todos ({brl(totalRascunho)})
              </button>
            </form>
          )}
        </div>

        {rascunhos.length === 0 ? (
          <p style={{ color: "var(--fg-muted)", fontStyle: "italic", marginTop: 12 }}>
            Nenhum rascunho. Adicione acima.
          </p>
        ) : (
          <div className="ctable-wrap">
            <table className="ctable">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Valor</th>
                  <th>Email</th>
                  <th>Instagram</th>
                  <th>Pix</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rascunhos.map((c) => (
                  <tr key={c.id}>
                    <td>{c.nome}</td>
                    <td className="cnum">{brl(Number(c.valor))}</td>
                    <td>{c.email ?? <span className="cmuted">—</span>}</td>
                    <td>{c.instagram ?? <span className="cmuted">—</span>}</td>
                    <td>
                      {c.comprovante_url && signedMap.has(c.comprovante_url) ? (
                        <a href={signedMap.get(c.comprovante_url)} target="_blank" rel="noreferrer">
                          ver
                        </a>
                      ) : (
                        <span className="cmuted">—</span>
                      )}
                    </td>
                    <td>
                      <form action={removerContribuicao}>
                        <input type="hidden" name="id" value={c.id} />
                        <button type="submit" className="clink-del" title="Remover rascunho">
                          ✕
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p style={{ fontSize: 12, color: "var(--fg-muted)", marginTop: 10 }}>
          Processar = grava na allowlist (<code>contribuintes</code>) os que têm
          email e marca tudo como processado. Quem não tem email entra como
          pendente.
        </p>
      </section>

      {/* Pendentes sem email — identificar */}
      {pendentes.length > 0 && (
        <section className="cbox">
          <h2 className="ctitle">❓ Pendentes sem email ({pendentes.length})</h2>
          <p style={{ fontSize: 13, color: "var(--fg-muted)", marginBottom: 14 }}>
            Já processados, mas sem email associado — preencha pra liberar no
            próximo processamento.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {pendentes.map((c) => (
              <form key={c.id} action={atualizarContribuicao} className="cpend">
                <input type="hidden" name="id" value={c.id} />
                <div className="cpend-nome">
                  <strong>{c.nome}</strong>
                  <span className="cmuted"> · {brl(Number(c.valor))}</span>
                </div>
                <input className="input" name="email" type="email" placeholder="email@..." />
                <input className="input" name="instagram" placeholder="@instagram" />
                <button type="submit" className="btn small">
                  Salvar
                </button>
              </form>
            ))}
          </div>
        </section>
      )}

      {/* Allowlist (pessoas liberadas) */}
      <section className="cbox">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 8 }}>
          <h2 className="ctitle" style={{ margin: 0 }}>
            🔓 Pessoas liberadas ({pessoas.length})
          </h2>
          <div className="cordena">
            <span className="cmuted" style={{ fontSize: 12 }}>Ordenar:</span>
            <Link
              href="/admin/contribuicoes"
              className={!ordenarPorValor ? "cordena-on" : "cordena-off"}
            >
              A–Z
            </Link>
            <Link
              href="/admin/contribuicoes?ordem=valor"
              className={ordenarPorValor ? "cordena-on" : "cordena-off"}
            >
              Maior valor
            </Link>
          </div>
        </div>
        <p style={{ fontSize: 13, color: "var(--fg-muted)", marginBottom: 14 }}>
          Emails da mesma pessoa agrupados; total soma todas as contribuições
          dela. Nível: 💛 Apoiador (R$10+) · 🛟 Mantenedor (R$25+) · 👑 Padrinho
          (R$50+) · 🎁 Cortesia (R$0).
        </p>
        {pessoas.length === 0 ? (
          <p style={{ color: "var(--fg-muted)", fontStyle: "italic" }}>
            Ninguém na allowlist ainda.
          </p>
        ) : (
          <div className="ctable-wrap">
            <table className="ctable">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Nível</th>
                  <th>Email(s)</th>
                  <th>Total</th>
                  <th>Editar</th>
                </tr>
              </thead>
              <tbody>
                {pessoas.map((p) => {
                  const cortesia = p.total === 0;
                  const nivel = nivelDe(p.total);
                  return (
                    <tr key={p.emails[0]}>
                      <td>{p.nome ?? <span className="cmuted">—</span>}</td>
                      <td>
                        <span className={`cnivel ${nivel.cls}`}>
                          {nivel.badge} {nivel.label}
                        </span>
                      </td>
                      <td>
                        {p.emails.map((e) => (
                          <div key={e}>
                            <code style={{ fontSize: 12 }}>{e}</code>
                          </div>
                        ))}
                      </td>
                      <td className="cnum">
                        {cortesia ? (
                          <span className="cmuted">R$ 0</span>
                        ) : (
                          brl(p.total)
                        )}
                      </td>
                      <td>
                        <details className="cedit">
                          <summary>✏️ editar</summary>
                          <form action={atualizarContribuinte} className="cedit-form">
                            <input type="hidden" name="emails" value={p.emails.join(",")} />
                            <label>Nome</label>
                            <input
                              className="input"
                              name="nome"
                              defaultValue={p.nome ?? ""}
                              placeholder="Nome completo"
                            />
                            <label>Instagram</label>
                            <input
                              className="input"
                              name="instagram"
                              defaultValue={p.instagram ?? ""}
                              placeholder="@usuario"
                            />
                            <label>Nota (mensagem de agradecimento)</label>
                            <input
                              className="input"
                              name="nota"
                              defaultValue={p.nota ?? ""}
                              placeholder="opcional"
                            />
                            <button type="submit" className="btn primary small">
                              Salvar
                            </button>
                          </form>
                        </details>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

function ContribStyle() {
  return (
    <style>{`
      .cstat-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 14px;
        margin-bottom: 28px;
      }
      .cstat {
        border: 1px solid var(--line);
        border-radius: var(--r-m);
        padding: 16px;
        background: var(--bg-2);
      }
      .cstat-ic { font-size: 20px; margin-bottom: 4px; }
      .cstat-val {
        font-size: 24px; font-weight: 900; line-height: 1.1;
        font-family: var(--ff-mono);
      }
      .cstat-lbl {
        font-size: 11px; color: var(--fg-muted); margin-top: 6px;
        text-transform: uppercase; letter-spacing: .04em; font-weight: 700;
      }
      .cbox {
        border: 1px solid var(--line);
        border-radius: var(--r-m);
        padding: 20px;
        background: var(--bg-2);
        margin-bottom: 24px;
      }
      .ctitle { font-size: 20px; font-weight: 800; margin: 0 0 16px; }
      .cform {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 14px;
      }
      .cfield { display: flex; flex-direction: column; gap: 6px; }
      .cfield-wide { grid-column: 1 / -1; }
      .cfield label, .cpend label {
        font-size: 12px; font-weight: 700; color: var(--fg-mid);
      }
      .ctable-wrap { overflow-x: auto; }
      .ctable { width: 100%; border-collapse: collapse; font-size: 14px; }
      .ctable th {
        text-align: left; padding: 10px 12px;
        border-bottom: 2px solid var(--line);
        font-size: 11px; text-transform: uppercase; letter-spacing: .04em;
        color: var(--fg-muted); font-weight: 800;
      }
      .ctable td {
        padding: 10px 12px;
        border-bottom: 1px solid var(--line);
        vertical-align: middle;
      }
      .cnum { font-family: var(--ff-mono); font-weight: 700; white-space: nowrap; }
      .cmuted { color: var(--fg-muted); }
      .cbadge {
        display: inline-block; margin-left: 8px;
        font-size: 11px; font-weight: 700;
        padding: 2px 8px; border-radius: 999px;
        background: color-mix(in srgb, var(--accent) 22%, transparent);
        border: 1px solid color-mix(in srgb, var(--accent) 45%, transparent);
        color: var(--fg); white-space: nowrap;
      }
      .cnivel {
        display: inline-block;
        font-size: 12px; font-weight: 800;
        padding: 3px 10px; border-radius: 999px;
        white-space: nowrap; border: 1px solid transparent;
      }
      .cn-padrinho {
        background: linear-gradient(135deg, color-mix(in srgb,#FFD700 28%,transparent), color-mix(in srgb,#FF8A00 22%,transparent));
        border-color: color-mix(in srgb,#FF8A00 55%,transparent); color: var(--fg);
      }
      .cn-mantenedor {
        background: color-mix(in srgb,#007AFF 18%,transparent);
        border-color: color-mix(in srgb,#007AFF 45%,transparent); color: var(--fg);
      }
      .cn-apoiador {
        background: color-mix(in srgb,#FFC700 20%,transparent);
        border-color: color-mix(in srgb,#FFC700 50%,transparent); color: var(--fg);
      }
      .cn-cortesia {
        background: var(--bg-soft);
        border-color: var(--line); color: var(--fg-muted);
      }
      .cordena { display: flex; align-items: center; gap: 8px; }
      .cordena-on, .cordena-off {
        font-size: 13px; font-weight: 700; text-decoration: none;
        padding: 5px 12px; border-radius: 999px; border: 1px solid var(--line);
      }
      .cordena-on { background: var(--primary); color: #fff; border-color: var(--primary); }
      .cordena-off { background: var(--bg-soft); color: var(--fg-mid); }
      .clink-del {
        border: 1px solid var(--line-strong);
        background: var(--bg-2); color: var(--fg-muted);
        border-radius: var(--r-s); cursor: pointer;
        width: 30px; height: 30px; font-size: 14px; font-weight: 700;
      }
      .clink-del:hover { background: #fee2e2; color: #C0392B; border-color: #C0392B; }
      .cpend {
        display: grid;
        grid-template-columns: 1.4fr 1.4fr 1fr auto;
        gap: 10px;
        align-items: center;
        padding: 10px;
        border: 1px solid var(--line);
        border-radius: var(--r-s);
      }
      .cpend-nome { font-size: 14px; }
      .cig { display: flex; gap: 8px; align-items: center; }
      .cig .input { max-width: 220px; }
      .cedit summary {
        cursor: pointer; font-size: 13px; font-weight: 700;
        color: var(--primary); list-style: none; white-space: nowrap;
      }
      .cedit summary::-webkit-details-marker { display: none; }
      .cedit-form {
        display: flex; flex-direction: column; gap: 6px;
        margin-top: 10px; min-width: 240px;
      }
      .cedit-form label {
        font-size: 11px; font-weight: 700; color: var(--fg-muted);
        text-transform: uppercase; letter-spacing: .03em;
      }
      .cedit-form .btn { align-self: flex-start; margin-top: 4px; }
      @media (max-width: 720px) {
        .cform { grid-template-columns: 1fr; }
        .cpend { grid-template-columns: 1fr; }
      }
    `}</style>
  );
}
