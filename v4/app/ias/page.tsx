import Link from "next/link";
import { promises as fs } from "fs";
import path from "path";
import DoacaoBanner from "@/components/DoacaoBanner";
import { resolverLocale } from "@/lib/locale-server";

type IA = {
  slug: string;
  nome: string;
  produto: string;
  modelo: string;
  empresa: string;
  pontos: number;
  rank: number;
};

async function carregarIAs(): Promise<IA[]> {
  const filePath = path.join(process.cwd(), "public", "ranking-ias.json");
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    const data = JSON.parse(raw);
    return (data.ias ?? []).map(
      (
        ia: {
          slug?: string;
          nome_display?: string;
          produto?: string;
          modelo?: string;
          empresa?: string;
          pontos?: number;
          rank?: number;
        },
        i: number,
      ) => ({
        slug: ia.slug ?? "",
        nome: ia.nome_display ?? ia.slug ?? "",
        produto: ia.produto ?? "",
        modelo: ia.modelo ?? "",
        empresa: ia.empresa ?? "",
        pontos: ia.pontos ?? 0,
        rank: ia.rank ?? i + 1,
      }),
    );
  } catch {
    return [];
  }
}

export const metadata = {
  title: "121 IAs no bolão · Bolão das IAs",
  description:
    "Lista completa das IAs participantes: ChatGPT, Claude, Gemini, Grok, DeepSeek e mais 116.",
};

export default async function IAsPage() {
  const ias = await carregarIAs();
  const locale = await resolverLocale();

  const porEmpresa: Record<string, IA[]> = {};
  for (const ia of ias) {
    const emp = ia.empresa || "Outros";
    (porEmpresa[emp] ??= []).push(ia);
  }
  const empresasOrdenadas = Object.entries(porEmpresa).sort(
    ([, a], [, b]) => b.length - a.length,
  );

  return (
    <div style={{ marginTop: 40 }}>
      <div style={{ textAlign: "center", marginBottom: 48 }}>
        <h1 style={{ fontSize: "clamp(36px, 6vw, 64px)", color: "var(--fg)" }}>
          🤖 {ias.length} IAs no bolão
        </h1>
        <p className="lede" style={{ marginTop: 16 }}>
          De ChatGPT a Qwen. Cada uma recebeu o mesmo prompt e palpitou os 104
          jogos.
        </p>
      </div>
      <DoacaoBanner variante="ias" locale={locale} />

      {empresasOrdenadas.length === 0 ? (
        <div className="card empty">
          <p>Aguardando dados das IAs…</p>
          <p style={{ marginTop: 12 }}>
            <a
              href="https://giordanorec.github.io/bolao-copa-2026/ias.html"
              style={{ color: "var(--primary)" }}
            >
              Veja no site do v1 →
            </a>
          </p>
        </div>
      ) : (
        empresasOrdenadas.map(([empresa, lista]) => (
          <section key={empresa} style={{ marginBottom: 40 }}>
            <h2
              style={{
                fontFamily: "var(--ff-mono)",
                fontSize: 13,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: "var(--fg-muted)",
                marginBottom: 16,
              }}
            >
              {empresa} — {lista.length} {lista.length === 1 ? "IA" : "IAs"}
            </h2>
            <div className="bolao-grid">
              {lista.map((ia) => (
                <div key={ia.slug} className="card">
                  <h3 style={{ fontSize: 20, marginBottom: 4 }}>{ia.produto}</h3>
                  <p
                    style={{
                      color: "var(--fg-muted)",
                      fontSize: 14,
                      marginBottom: 12,
                    }}
                  >
                    {ia.modelo}
                  </p>
                  <p
                    style={{
                      fontFamily: "var(--ff-mono)",
                      fontSize: 11,
                      color: "var(--fg-muted)",
                    }}
                  >
                    #{ia.rank} no ranking · {ia.pontos} pts
                  </p>
                </div>
              ))}
            </div>
          </section>
        ))
      )}

      <div
        className="card"
        style={{ textAlign: "center", marginTop: 32, background: "var(--bg-1)" }}
      >
        <h2 style={{ fontSize: 24, marginBottom: 12 }}>
          🔮 Quer disputar contra elas?
        </h2>
        <p style={{ color: "var(--fg-mid)", marginBottom: 20 }}>
          Cria conta, palpita os 104 jogos, e ative o ranking geral.
        </p>
        <Link href="/signup" className="btn primary">
          Criar minha conta →
        </Link>
      </div>
    </div>
  );
}
