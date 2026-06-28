import { notFound } from "next/navigation";
import Link from "next/link";
import fs from "fs";
import path from "path";
import { createClient } from "@/lib/supabase-server";
import { isAdminEmail, createAdminClient } from "@/lib/admin";
import { CopiarTexto } from "./CopiarTexto";
import { BaixarImagens } from "./BaixarImagens";
import { PublicarToggle } from "./PublicarToggle";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Instagram Posts · Admin",
  robots: { index: false, follow: false },
};

type IgPost = {
  id: string;
  tipo: "reel" | "carrossel" | "card";
  titulo: string;
  caption: string;
  roteiro: string;
  images: string[];
  thumbs?: string[];
  hasVideo: boolean;
  video?: string;
  publicado?: boolean;
};

function loadManifest(): IgPost[] {
  const manifestPath = path.join(process.cwd(), "public", "ig-posts-manifest.json");
  if (!fs.existsSync(manifestPath)) return [];
  const raw = fs.readFileSync(manifestPath, "utf8");
  return JSON.parse(raw) as IgPost[];
}

/**
 * Set de post_ids já publicados (tabela ig_posts_status). Tolera a tabela
 * ainda não existir — nesse caso ninguém aparece como publicado.
 */
async function carregarPublicados(): Promise<Set<string>> {
  const admin = createAdminClient();
  if (!admin) return new Set();
  const { data, error } = await admin
    .from("ig_posts_status")
    .select("post_id")
    .eq("publicado", true);
  if (error) return new Set();
  return new Set((data ?? []).map((r) => r.post_id as string));
}

// Badge colour per tipo
const TIPO_META: Record<string, { label: string; color: string; bg: string }> = {
  reel: {
    label: "Reel",
    color: "#9333ea",
    bg: "color-mix(in srgb, #9333ea 16%, transparent)",
  },
  carrossel: {
    label: "Carrossel",
    color: "#0ea5e9",
    bg: "color-mix(in srgb, #0ea5e9 16%, transparent)",
  },
  card: {
    label: "Card",
    color: "#f59e0b",
    bg: "color-mix(in srgb, #f59e0b 16%, transparent)",
  },
};

export default async function InstagramPostsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isAdminEmail(user.email)) notFound();

  const [postsRaw, publicados] = await Promise.all([
    Promise.resolve(loadManifest()),
    carregarPublicados(),
  ]);
  const posts = postsRaw.map((p) => ({ ...p, publicado: publicados.has(p.id) }));
  const totalPublicados = posts.filter((p) => p.publicado).length;

  return (
    <main style={{ maxWidth: 1160, margin: "32px auto", padding: "0 20px 60px" }}>
      <IgStyle />

      <div style={{ marginBottom: 20 }}>
        <Link href="/admin" style={{ fontSize: 13, color: "var(--fg-muted)" }}>
          ← painel admin
        </Link>
      </div>

      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 8 }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 900, marginBottom: 4, fontFamily: "var(--ff-display, inherit)" }}>
            Instagram Posts
          </h1>
          <p style={{ color: "var(--fg-muted)", fontSize: 14 }}>
            {posts.length} posts prontos · {totalPublicados} publicados · logado como <code>{user.email}</code>
          </p>
        </div>
        <a
          href="https://www.instagram.com/arena.das.ias/"
          target="_blank"
          rel="noopener noreferrer"
          className="btn primary"
          style={{ fontSize: 14, padding: "10px 18px", whiteSpace: "nowrap" }}
        >
          Abrir Instagram
        </a>
      </div>

      {/* legend */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 28 }}>
        {(["reel", "carrossel", "card"] as const).map((t) => {
          const m = TIPO_META[t];
          const count = posts.filter((p) => p.tipo === t).length;
          return (
            <span
              key={t}
              style={{
                fontSize: 12,
                fontWeight: 700,
                padding: "4px 12px",
                borderRadius: 999,
                background: m.bg,
                border: `1px solid color-mix(in srgb, ${m.color} 40%, transparent)`,
                color: m.color,
              }}
            >
              {m.label} · {count}
            </span>
          );
        })}
      </div>

      {posts.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "var(--fg-muted)" }}>
          <p style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Manifest vazio</p>
          <p style={{ fontSize: 14 }}>
            Execute <code>node marketing/scripts/build_ig_manifest.mjs</code> para gerar.
          </p>
        </div>
      ) : (
        <div className="ig-grid">
          {posts.map((post, idx) => {
            const tipo = TIPO_META[post.tipo] ?? TIPO_META.reel;
            const hasImages = post.images.length > 0;
            const isCarrossel = post.tipo === "carrossel";
            const firstImage = post.images[0];

            return (
              <article key={post.id} className="ig-card">
                {/* ── Image area ─────────────────────────────────────── */}
                <div className="ig-media">
                  {post.video ? (
                    <video
                      className="ig-video"
                      src={post.video}
                      poster={firstImage}
                      controls
                      playsInline
                      preload="metadata"
                    />
                  ) : !hasImages ? (
                    <div className="ig-no-image">
                      <span style={{ fontSize: 32 }}>🖼️</span>
                      <span style={{ fontSize: 13, color: "var(--fg-muted)", marginTop: 6 }}>
                        Sem imagem
                      </span>
                    </div>
                  ) : isCarrossel ? (
                    <div className="ig-carousel">
                      {post.images.map((src, i) => (
                        <a
                          key={i}
                          href={src}
                          target="_blank"
                          rel="noreferrer"
                          className="ig-carousel-item"
                          title={`Slide ${i + 1}`}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={post.thumbs?.[i] ?? src}
                            alt={`Slide ${i + 1} — ${post.titulo}`}
                            className="ig-carousel-img"
                            loading="lazy"
                          />
                          <span className="ig-slide-num">{i + 1}</span>
                        </a>
                      ))}
                    </div>
                  ) : (
                    <a
                      href={firstImage}
                      target="_blank"
                      rel="noreferrer"
                      className="ig-single-wrap"
                      title="Abrir imagem em tamanho real"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={post.thumbs?.[0] ?? firstImage}
                        alt={post.titulo}
                        className="ig-single-img"
                        loading="lazy"
                      />
                      {post.hasVideo && (
                        <div className="ig-play-badge" title="Vídeo disponível na pasta de origem">
                          <span>▶</span>
                        </div>
                      )}
                    </a>
                  )}
                </div>

                {/* ── Meta row ───────────────────────────────────────── */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      padding: "3px 10px",
                      borderRadius: 999,
                      background: tipo.bg,
                      border: `1px solid color-mix(in srgb, ${tipo.color} 40%, transparent)`,
                      color: tipo.color,
                      textTransform: "uppercase",
                      letterSpacing: ".05em",
                    }}
                  >
                    {tipo.label}
                  </span>
                  {post.publicado && (
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 800,
                        padding: "3px 10px",
                        borderRadius: 999,
                        background: "color-mix(in srgb, #16a34a 16%, transparent)",
                        border: "1px solid color-mix(in srgb, #16a34a 45%, transparent)",
                        color: "#16a34a",
                      }}
                    >
                      ✓ publicado
                    </span>
                  )}
                  {post.hasVideo && (
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: "3px 8px",
                        borderRadius: 999,
                        background: "color-mix(in srgb, #ef4444 14%, transparent)",
                        border: "1px solid color-mix(in srgb, #ef4444 35%, transparent)",
                        color: "#ef4444",
                      }}
                    >
                      vídeo
                    </span>
                  )}
                  <span style={{ marginLeft: "auto", fontSize: 12, color: "var(--fg-muted)", fontFamily: "var(--ff-mono)" }}>
                    #{String(idx + 1).padStart(2, "0")}
                  </span>
                </div>

                {/* ── Title ──────────────────────────────────────────── */}
                <h2 style={{ fontSize: 17, fontWeight: 800, marginBottom: 10, lineHeight: 1.3, fontFamily: "var(--ff-display, inherit)" }}>
                  {post.titulo}
                </h2>

                {/* ── Caption ────────────────────────────────────────── */}
                {post.caption ? (
                  <div className="ig-caption-block">
                    <div className="ig-caption-head">
                      <span style={{ fontSize: 11, fontWeight: 700, color: "var(--fg-muted)", textTransform: "uppercase", letterSpacing: ".04em" }}>
                        Legenda
                      </span>
                      <CopiarTexto texto={post.caption} label="Copiar legenda" compacto />
                    </div>
                    <p className="ig-caption-text">{post.caption}</p>
                  </div>
                ) : (
                  <p style={{ fontSize: 13, color: "var(--fg-muted)", fontStyle: "italic", marginBottom: 14 }}>
                    Sem legenda.
                  </p>
                )}

                {/* ── Roteiro (collapsible) ──────────────────────────── */}
                {post.roteiro && (
                  <details className="ig-roteiro">
                    <summary>Ver roteiro / script</summary>
                    <pre className="ig-roteiro-pre">{post.roteiro}</pre>
                    <div className="ig-roteiro-actions">
                      <CopiarTexto texto={post.roteiro} label="Copiar roteiro" />
                    </div>
                  </details>
                )}

                {/* ── Action buttons ─────────────────────────────────── */}
                <div className="ig-actions">
                  <PublicarToggle postId={post.id} publicado={!!post.publicado} />

                  {(hasImages || post.video) && (
                    <BaixarImagens
                      images={post.images}
                      nomeBase={post.id}
                      video={post.video}
                      tipo={post.tipo}
                    />
                  )}

                  <a
                    href="https://www.instagram.com/arena.das.ias/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ig-action-btn ig-action-ig"
                    title="Abrir @arena.das.ias no Instagram"
                  >
                    Abrir Instagram
                  </a>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}

function IgStyle() {
  return (
    <style>{`
      .ig-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
        gap: 24px;
      }

      .ig-card {
        border: 1px solid var(--line);
        border-radius: var(--r-l, 14px);
        background: var(--bg-2);
        padding: 18px;
        display: flex;
        flex-direction: column;
        gap: 0;
        min-width: 0;
        transition: box-shadow .15s;
      }
      .ig-card:hover {
        box-shadow: 0 4px 24px color-mix(in srgb, var(--fg) 8%, transparent);
      }

      /* ── Media area ─────────────────────────────────────────────── */
      .ig-media {
        width: 100%;
        min-width: 0;
        border-radius: var(--r-m, 10px);
        overflow: hidden;
        background: var(--bg-soft);
        margin-bottom: 14px;
        border: 1px solid var(--line);
      }

      .ig-no-image {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 140px;
        color: var(--fg-muted);
      }

      /* Single image (reel / card) — miniatura proporcional, sem distorção */
      .ig-single-wrap {
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        line-height: 0;
        padding: 8px;
      }
      .ig-single-img {
        width: auto;
        max-width: 100%;
        height: auto;
        max-height: 340px;
        margin: 0 auto;
        display: block;
        border-radius: var(--r-s, 6px);
        background: var(--bg-1);
        transition: opacity .15s;
      }
      .ig-single-wrap:hover .ig-single-img { opacity: .92; }

      /* Vídeo inline tocável (reels) */
      .ig-video {
        display: block;
        width: 100%;
        max-height: 60vh;
        margin: 0 auto;
        background: #000;
        border-radius: var(--r-s, 6px);
      }

      .ig-play-badge {
        position: absolute;
        bottom: 10px;
        right: 10px;
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: rgba(0,0,0,.65);
        color: #fff;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        backdrop-filter: blur(4px);
      }

      /* Carrossel */
      .ig-carousel {
        display: flex;
        overflow-x: auto;
        gap: 6px;
        padding: 8px;
        scroll-snap-type: x mandatory;
        -webkit-overflow-scrolling: touch;
      }
      .ig-carousel::-webkit-scrollbar { height: 4px; }
      .ig-carousel::-webkit-scrollbar-thumb {
        background: var(--line);
        border-radius: 4px;
      }

      .ig-carousel-item {
        flex-shrink: 0;
        position: relative;
        border-radius: var(--r-s, 6px);
        overflow: hidden;
        scroll-snap-align: start;
        line-height: 0;
        border: 1px solid var(--line);
      }
      .ig-carousel-img {
        width: 140px;
        height: 180px;
        object-fit: cover;
        display: block;
        transition: opacity .12s;
      }
      .ig-carousel-item:hover .ig-carousel-img { opacity: .88; }

      .ig-slide-num {
        position: absolute;
        top: 6px;
        left: 6px;
        background: rgba(0,0,0,.55);
        color: #fff;
        font-size: 10px;
        font-weight: 800;
        padding: 2px 6px;
        border-radius: 4px;
        backdrop-filter: blur(3px);
      }

      /* ── Caption ──────────────────────────────────────────────── */
      .ig-caption-block {
        background: var(--bg-soft);
        border: 1px solid var(--line);
        border-radius: var(--r-m, 10px);
        padding: 12px 14px;
        margin-bottom: 14px;
      }
      .ig-caption-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        margin-bottom: 6px;
      }
      /* Botão de ícone (copiar legenda) — quadrado, toque-amigável */
      .ig-icon-btn {
        flex-shrink: 0;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        border-radius: var(--r-s, 8px);
        border: 1px solid var(--line);
        background: var(--bg-2);
        color: var(--fg-mid);
        cursor: pointer;
        line-height: 0;
        transition: background .12s, border-color .12s, color .12s;
      }
      .ig-icon-btn:hover {
        background: var(--bg-1);
        border-color: var(--fg-muted);
        color: var(--fg);
      }
      .ig-icon-btn.ok {
        background: color-mix(in srgb, #22c55e 16%, transparent);
        border-color: color-mix(in srgb, #22c55e 50%, transparent);
        color: #16a34a;
      }
      .ig-caption-text {
        font-size: 13px;
        color: var(--fg);
        line-height: 1.6;
        white-space: pre-wrap;
        word-break: break-word;
        margin: 0;
      }

      /* ── Roteiro ──────────────────────────────────────────────── */
      .ig-roteiro {
        margin-bottom: 14px;
        border: 1px solid var(--line);
        border-radius: var(--r-m, 10px);
        overflow: hidden;
      }
      .ig-roteiro summary {
        cursor: pointer;
        padding: 10px 14px;
        font-size: 13px;
        font-weight: 700;
        color: var(--fg-mid);
        list-style: none;
        user-select: none;
        background: var(--bg-soft);
      }
      .ig-roteiro summary::-webkit-details-marker { display: none; }
      .ig-roteiro[open] summary {
        border-bottom: 1px solid var(--line);
        color: var(--fg);
      }
      .ig-roteiro-pre {
        margin: 0;
        padding: 12px 14px;
        font-size: 12px;
        font-family: var(--ff-mono);
        color: var(--fg-mid);
        white-space: pre-wrap;
        word-break: break-word;
        line-height: 1.6;
        background: var(--bg-2);
        max-height: 320px;
        overflow-y: auto;
      }

      /* ── Actions ──────────────────────────────────────────────── */
      .ig-actions {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        margin-top: auto;
        padding-top: 6px;
      }

      /* Botão padrão com ícone + texto (download, copiar roteiro) */
      .ig-act {
        flex: 1;
        min-width: 120px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 7px;
        padding: 11px 14px;
        min-height: 44px;
        border-radius: var(--r-m, 8px);
        font-size: 13px;
        font-weight: 700;
        cursor: pointer;
        text-decoration: none;
        line-height: 1;
        border: 1px solid color-mix(in srgb, var(--primary, #6d28d9) 38%, transparent);
        background: color-mix(in srgb, var(--primary, #6d28d9) 12%, transparent);
        color: var(--primary, #6d28d9);
        transition: background .12s, color .12s, border-color .12s;
      }
      .ig-act:hover:not(:disabled) {
        background: color-mix(in srgb, var(--primary, #6d28d9) 20%, transparent);
        border-color: color-mix(in srgb, var(--primary, #6d28d9) 55%, transparent);
      }
      .ig-act:disabled { opacity: .75; }
      .ig-act.ok {
        background: color-mix(in srgb, #22c55e 16%, transparent);
        border-color: color-mix(in srgb, #22c55e 50%, transparent);
        color: #16a34a;
      }
      .ig-act svg { flex-shrink: 0; }

      .ig-action-btn {
        flex: 1;
        min-width: 120px;
        min-height: 44px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 5px;
        padding: 11px 14px;
        border-radius: var(--r-m, 8px);
        font-size: 13px;
        font-weight: 700;
        cursor: pointer;
        text-decoration: none;
        border: 1px solid var(--line);
        background: var(--bg-soft);
        color: var(--fg-mid);
        transition: background .12s, color .12s, border-color .12s;
        white-space: nowrap;
      }
      .ig-action-btn:hover {
        background: var(--bg-1);
        color: var(--fg);
        border-color: var(--fg-muted);
      }

      .ig-action-ig {
        background: color-mix(in srgb, #e1306c 10%, transparent);
        border-color: color-mix(in srgb, #e1306c 35%, transparent);
        color: #e1306c;
      }
      .ig-action-ig:hover {
        background: color-mix(in srgb, #e1306c 18%, transparent);
        border-color: color-mix(in srgb, #e1306c 55%, transparent);
        color: #c2185b;
      }

      /* Botão de download em destaque */
      .ig-action-dl {
        background: color-mix(in srgb, var(--primary, #6d28d9) 12%, transparent);
        border-color: color-mix(in srgb, var(--primary, #6d28d9) 38%, transparent);
        color: var(--primary, #6d28d9);
      }
      .ig-action-dl:hover:not(:disabled) {
        background: color-mix(in srgb, var(--primary, #6d28d9) 20%, transparent);
        border-color: color-mix(in srgb, var(--primary, #6d28d9) 55%, transparent);
      }
      .ig-action-dl:disabled { opacity: .8; }

      /* Botão "marcar publicado" — verde quando já publicado */
      .ig-pub-on {
        background: color-mix(in srgb, #16a34a 14%, transparent);
        border-color: color-mix(in srgb, #16a34a 45%, transparent);
        color: #15803d;
        font-weight: 600;
      }
      .ig-pub-on:hover:not(:disabled) {
        background: color-mix(in srgb, #16a34a 22%, transparent);
        border-color: color-mix(in srgb, #16a34a 60%, transparent);
        color: #166534;
      }

      .ig-roteiro-actions {
        display: flex;
        padding: 10px 14px;
        background: var(--bg-2);
        border-top: 1px solid var(--line);
      }
      .ig-roteiro-actions .ig-act { flex: 0 0 auto; min-width: 0; }

      @media (max-width: 600px) {
        .ig-grid { grid-template-columns: 1fr; gap: 16px; }
        .ig-card { padding: 14px; }
        .ig-single-img { max-height: 60vh; }
        .ig-carousel-img { width: 120px; height: 154px; }
        .ig-actions { gap: 8px; }
        .ig-act { flex: 1 1 100%; min-width: 0; }
      }
    `}</style>
  );
}
