import "@/styles/globals.css";
import type { Metadata, Viewport } from "next";
import Link from "next/link";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import UserWidget from "@/components/UserWidget";

export const metadata: Metadata = {
  title: "Bolão das IAs · Copa do Mundo 2026",
  description:
    "As IAs palpitam a Copa 2026 ⚽🇧🇷. ChatGPT, Claude, Gemini, Grok, DeepSeek e mais 117 modelos competindo. Quem chuta melhor?",
  manifest: "/manifest.json",
  robots: { index: true, follow: true },
  openGraph: {
    title: "Bolão das IAs · Copa 2026",
    description:
      "122 IAs palpitam a Copa. Crie seu bolão e dispute contra elas.",
    url: "https://arena-de-ias.vercel.app",
    siteName: "Bolão das IAs",
    locale: "pt_BR",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#009C3B",
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
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body data-theme="airbnb">
        <header className="site-header">
          <div className="container header-inner">
            <Link href="/" className="brand">
              <span className="brand-mark">⚽</span>
              <span className="brand-text">
                <span className="brand-title">Bolão das IAs</span>
                <span className="brand-sub">🇧🇷 Copa 2026</span>
              </span>
            </Link>
            <nav className="site-nav">
              <a
                href="https://giordanorec.github.io/bolao-copa-2026/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Ranking ↗
              </a>
              <a
                href="https://giordanorec.github.io/bolao-copa-2026/jogos.html"
                target="_blank"
                rel="noopener noreferrer"
              >
                Jogos ↗
              </a>
              <a
                href="https://giordanorec.github.io/bolao-copa-2026/serie-a.html"
                target="_blank"
                rel="noopener noreferrer"
              >
                Série A ↗
              </a>
              <a
                href="https://giordanorec.github.io/bolao-copa-2026/cristal.html"
                target="_blank"
                rel="noopener noreferrer"
              >
                🔮 Cristal ↗
              </a>
              <Link href="/como-funciona">Como funciona</Link>
              <UserWidget />
            </nav>
          </div>
        </header>

        <ThemeSwitcher />

        <main>
          <div className="container">{children}</div>
        </main>

        <footer className="site-footer">
          <div className="container footer-inner">
            <div className="footer-col">
              <h4>O Bolão</h4>
              <p>
                Comparamos palpites de modelos de IA sobre a Copa do Mundo FIFA
                2026. <strong>122 IAs</strong> participantes + Bola de Cristal,
                dossiê de contexto padronizado e regras clássicas (placar exato
                10, vencedor+saldo 7, vencedor 5, errado 0; mata-mata 2×). É
                sério, e é uma festa. 🎉
              </p>
              <p style={{ marginTop: 12 }}>
                <Link href="/signup" style={{ color: "var(--primary)", fontWeight: 700 }}>
                  Crie seu bolão →
                </Link>
              </p>
            </div>
            <div className="footer-col">
              <h4>Disclaimers</h4>
              <ul>
                <li>Não pegamos informação de casas de apostas.</li>
                <li>Não somos patrocinados por Bets.</li>
                <li>Gratuito. Doações cobrem a API.</li>
                <li>Projeto em andamento — faça backup, não confie cegamente.</li>
              </ul>
            </div>
            <div className="footer-col">
              <h4>Atualização</h4>
              <p>
                v4 ao vivo em{" "}
                <a href="https://arena-de-ias.vercel.app">arena-de-ias.vercel.app</a>
              </p>
              <p style={{ marginTop: 8 }}>
                <Link href="/doar">💛 Doe via PIX</Link> ·{" "}
                <a
                  href="https://github.com/giordanorec/bolao-copa-2026"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  código no GitHub
                </a>
              </p>
              <p className="versao" style={{ marginTop: 8 }}>
                Built with care & frevo. v0.6.0
              </p>
            </div>
          </div>
        </footer>

        <div className="toast" role="status" aria-live="polite" />

        <script
          dangerouslySetInnerHTML={{
            __html: `if('serviceWorker' in navigator){window.addEventListener('load',()=>{navigator.serviceWorker.register('/sw.js').catch(()=>{})})}`,
          }}
        />
      </body>
    </html>
  );
}
