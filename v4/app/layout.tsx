import "@/styles/globals.css";
import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import PostHogProvider from "@/components/PostHogProvider";
import SiteNav from "@/components/SiteNav";
import AvisoDesclassificacao from "@/components/AvisoDesclassificacao";
import HeaderNavBar from "@/components/HeaderNavBar";
import LangSwitcher from "@/components/LangSwitcher";
import { resolverLocale } from "@/lib/locale-server";
import { resolverTema } from "@/lib/tema-server";
import { t } from "@/lib/i18n";

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

const HTML_LANG: Record<string, string> = {
  pt: "pt-BR",
  en: "en",
  es: "es",
  fr: "fr",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [locale, tema] = await Promise.all([resolverLocale(), resolverTema()]);
  return (
    <html lang={HTML_LANG[locale] ?? "pt-BR"}>
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
      <body data-theme={tema}>
        <PostHogProvider>
        <header className="site-header">
          <div className="container header-inner">
            <Link href="/" className="brand">
              <span className="brand-mark">⚽</span>
              <span className="brand-text">
                <span className="brand-title">{t(locale, "brand.title")}</span>
                <span className="brand-sub">{t(locale, "brand.sub")}</span>
              </span>
            </Link>
            <HeaderNavBar locale={locale} />
            <SiteNav locale={locale} tema={tema} />
          </div>
        </header>

        <AvisoDesclassificacao />

        <main>
          <div className="container">{children}</div>
        </main>

        <footer className="site-footer">
          <div className="container footer-inner">
            <div className="footer-col">
              <h4>{t(locale, "footer.bolao.titulo")}</h4>
              <p>{t(locale, "footer.bolao.texto")}</p>
              <p style={{ marginTop: 12 }}>
                <Link
                  href="/retrospectiva"
                  style={{ color: "var(--primary)", fontWeight: 700 }}
                >
                  {t(locale, "footer.bolao.criar")}
                </Link>
              </p>
              <a
                href="https://instagram.com/arena.das.ias"
                target="_blank"
                rel="noopener noreferrer"
                className="ig-btn"
                style={{ marginTop: 16 }}
              >
                📸 {t(locale, "footer.instagram")}
                <span className="ig-handle">@arena.das.ias</span>
              </a>
            </div>
            <div className="footer-col">
              <h4>{t(locale, "footer.disclaimers.titulo")}</h4>
              <ul>
                <li>{t(locale, "footer.disclaimers.1")}</li>
                <li>{t(locale, "footer.disclaimers.2")}</li>
                <li>{t(locale, "footer.disclaimers.3")}</li>
                <li>{t(locale, "footer.disclaimers.4")}</li>
              </ul>
            </div>
            <div className="footer-col">
              <h4>{t(locale, "footer.atualizacao.titulo")}</h4>
              <p>
                <a href="https://arena-de-ias.vercel.app">
                  arena-de-ias.vercel.app
                </a>
              </p>
              <p style={{ marginTop: 8 }}>
                <Link href="/colaborar">{t(locale, "footer.colaborar")}</Link>
              </p>
              <p className="versao" style={{ marginTop: 8 }}>
                v0.7.0
              </p>
              <div
                style={{
                  marginTop: 14,
                  paddingTop: 14,
                  borderTop: "1px solid var(--line)",
                }}
              >
                <p
                  style={{
                    fontSize: 11,
                    fontFamily: "var(--ff-mono)",
                    color: "var(--fg-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    marginBottom: 8,
                  }}
                >
                  {t(locale, "footer.idioma")}
                </p>
                <LangSwitcher atual={locale} />
              </div>
            </div>
          </div>
        </footer>

        <div className="toast" role="status" aria-live="polite" />

        <script
          dangerouslySetInnerHTML={{
            __html: `if('serviceWorker' in navigator){window.addEventListener('load',()=>{navigator.serviceWorker.register('/sw.js').catch(()=>{})})}`,
          }}
        />

        <Analytics />
        <SpeedInsights />
        </PostHogProvider>
      </body>
    </html>
  );
}
