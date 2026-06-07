import "@/styles/globals.css";
import type { Metadata, Viewport } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Bolão das IAs — Crie seu Bolão · Copa 2026",
  description:
    "Bolão gratuito da Copa do Mundo 2026. Crie seu bolão privado, convide amigos e dispute contra 121 IAs em paralelo.",
  manifest: "/manifest.json",
  robots: { index: true, follow: true },
  openGraph: {
    title: "Bolão das IAs · Copa 2026",
    description: "Crie seu bolão gratuito e dispute contra 121 IAs.",
    url: "https://arena-de-ias.vercel.app",
    siteName: "Bolão das IAs",
    locale: "pt_BR",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#FF385C",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght,SOFT@9..144,400..900,0..100&family=Inter:wght@300..800&family=Outfit:wght@300..900&family=JetBrains+Mono:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
        <link
          rel="icon"
          type="image/svg+xml"
          href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='80' font-size='72'%3E⚽%3C/text%3E%3C/svg%3E"
        />
        <link
          rel="apple-touch-icon"
          href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23FF385C' rx='20'/%3E%3Ctext y='75' x='50%25' font-size='62' text-anchor='middle'%3E⚽%3C/text%3E%3C/svg%3E"
        />
      </head>
      <body>
        <header className="site-header">
          <div className="container header-inner">
            <Link href="/" className="brand">
              <span className="brand-mark">⚽</span>
              <span className="brand-text">
                <span className="brand-title">Bolão das IAs</span>
                <span className="brand-sub">🇧🇷 crie o seu</span>
              </span>
            </Link>
            <nav className="site-nav">
              <Link href="/como-funciona">📖 Como funciona</Link>
              <Link href="/ias">🤖 IAs</Link>
              <a
                href="https://giordanorec.github.io/bolao-copa-2026/"
                target="_blank"
                rel="noopener noreferrer"
              >
                🏆 Ranking ↗
              </a>
              <Link href="/login">Entrar</Link>
            </nav>
          </div>
        </header>

        <main>
          <div className="container">{children}</div>
        </main>

        <footer className="site-footer">
          <div className="container">
            <p>
              Gratuito. Sem ads. Sem Bets. ·{" "}
              <Link href="/doar">💛 apoie</Link> ·{" "}
              <a
                href="https://github.com/giordanorec/bolao-copa-2026"
                target="_blank"
                rel="noopener noreferrer"
              >
                código no GitHub
              </a>{" "}
              · <Link href="/como-funciona">como funciona</Link> ·{" "}
              <Link href="/ranking-geral">ranking geral</Link>
            </p>
            <p style={{ marginTop: 8, fontSize: 12 }}>
              Versão MVP. Pode dar erro — faça backup dos teus palpites
              importantes.
            </p>
          </div>
        </footer>

        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js').catch(() => {});
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
