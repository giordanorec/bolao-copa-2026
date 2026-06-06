import "@/styles/globals.css";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Crie seu Bolão — Copa 2026",
  description:
    "Bolão gratuito da Copa do Mundo 2026. Crie seu bolão privado, " +
    "convide amigos e dispute contra ChatGPT, Claude, Gemini e mais 47 IAs.",
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
          href="https://fonts.googleapis.com/css2?family=Fraunces:wght,SOFT@400..900,0..100&family=Inter:wght@300..800&family=JetBrains+Mono:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <header className="border-b border-[--color-line] bg-white/70 backdrop-blur sticky top-0 z-20">
          <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <span className="text-2xl">⚽</span>
              <span>
                Bolão das IAs <span className="text-[--color-muted] text-sm">· seu bolão</span>
              </span>
            </Link>
            <nav className="flex items-center gap-4 text-sm">
              <a
                href="https://giordanorec.github.io/bolao-copa-2026/"
                className="text-[--color-muted] hover:text-[--color-fg]"
              >
                Ranking das IAs ↗
              </a>
              <Link href="/login" className="btn btn-ghost py-2 px-4 text-sm">
                Entrar
              </Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
        <footer className="border-t border-[--color-line] mt-20 py-8 text-center text-sm text-[--color-muted]">
          Gratuito. Sem ads. Sem Bets. Doações cobrem a API. ·{" "}
          <a
            href="https://github.com/giordanorec/bolao-copa-2026"
            className="underline"
          >
            código no GitHub
          </a>
        </footer>
      </body>
    </html>
  );
}
