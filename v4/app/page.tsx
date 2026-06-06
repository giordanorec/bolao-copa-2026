import Link from "next/link";
import { ArrowRight, Sparkles, Users, Trophy } from "lucide-react";

export default function Home() {
  return (
    <div className="space-y-20">
      <section className="text-center pt-12 pb-8">
        <p className="text-sm font-mono uppercase tracking-widest text-[--color-muted] mb-3">
          🤖 Arena de IAs
        </p>
        <h1 className="text-5xl md:text-7xl text-[--color-primary] mb-4">
          Bolão da Copa 2026
        </h1>
        <p className="text-xl text-[--color-muted] max-w-2xl mx-auto mb-8">
          Crie seu bolão gratuito, convide amigos, palpite os 104 jogos e
          dispute contra <strong className="text-[--color-fg]">121 IAs</strong> em
          paralelo. É o primeiro produto da Arena.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Link href="/signup" className="btn btn-primary">
            Criar meu bolão <ArrowRight size={18} />
          </Link>
          <Link href="/login" className="btn btn-ghost">
            Entrar
          </Link>
        </div>
      </section>

      <section className="grid md:grid-cols-3 gap-6">
        <Feature
          icon={<Sparkles className="text-[--color-accent]" />}
          title="100% gratuito"
          body="Sem ads, sem cobrança, sem casa de aposta envolvida. Doações cobrem a infra."
        />
        <Feature
          icon={<Users className="text-[--color-primary]" />}
          title="Privado por padrão"
          body="Cada bolão vira um link só seu. Compartilha por WhatsApp, só entra quem você convida."
        />
        <Feature
          icon={<Trophy className="text-[--color-secondary]" />}
          title="Contra as IAs"
          body="Opcionalmente entre no ranking geral e veja se vence ChatGPT, Claude, Gemini, Grok…"
        />
      </section>

      <section className="card text-center bg-gradient-to-br from-[--color-primary]/5 to-[--color-secondary]/5">
        <h2 className="text-3xl mb-3">Como funciona</h2>
        <ol className="text-left max-w-xl mx-auto space-y-4 text-[--color-fg]">
          <Step n={1} text="Cria conta (email + senha)" />
          <Step n={2} text="Cria um bolão, dá um nome" />
          <Step n={3} text="Compartilha o link com a galera" />
          <Step n={4} text="Cada um palpita os 104 jogos da Copa" />
          <Step n={5} text="Ranking interno do grupo + geral (opcional)" />
        </ol>
      </section>

      <section className="text-center text-sm text-[--color-muted]">
        <p>
          A Arena de IAs vai abrigar outros produtos no futuro
          (bola de cristal, comparador de palpites, dicas pré-jogo…).
          Esse aqui é o primeiro.
        </p>
      </section>
    </div>
  );
}

function Feature({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="card">
      <div className="mb-3">{icon}</div>
      <h3 className="text-xl mb-2">{title}</h3>
      <p className="text-[--color-muted] text-sm">{body}</p>
    </div>
  );
}

function Step({ n, text }: { n: number; text: string }) {
  return (
    <li className="flex items-start gap-4">
      <span className="flex-none w-8 h-8 rounded-full bg-[--color-primary] text-white grid place-items-center font-bold">
        {n}
      </span>
      <span className="pt-1">{text}</span>
    </li>
  );
}
