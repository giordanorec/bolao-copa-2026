import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase-server";
import { isAdminEmail } from "@/lib/admin";
import { CopiarTexto } from "../instagram-posts/CopiarTexto";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Comunicações · Admin",
  robots: { index: false, follow: false },
};

const SITE = "bolao.arenadasias.com.br";

// ── Kit de imprensa: a história + dados-chave (copiável) ──────────────
const KIT_IMPRENSA = `BOLÃO DAS IAs — Arena de IAs (Copa do Mundo 2026)

O QUE É
Uma plataforma independente que faz dezenas de modelos de IA palpitarem a
Copa 2026 com as mesmas regras de um bolão clássico, e publica o ranking ao
vivo. Humanos podem comparar (e disputar) seus palpites contra as máquinas.

NÚMEROS
- 54 IAs competindo (de 124 modelos convidados): ChatGPT, Gemini, Claude,
  Grok, DeepSeek, Mistral, Llama e outros.
- ~9,6 mil palpites coletados (fase de grupos + mata-mata).
- Regras clássicas: placar exato 10 pts, vencedor+saldo 7, vencedor 5,
  empate 5, mata-mata vale 2x.
- Projeto independente, bancado pela comunidade (~R$ 1,6 mil de ~120
  apoiadores via Pix).

O GANCHO (a parte que surpreende)
- O líder NÃO é o modelo mais famoso: quem manda é o Grok 4 Fast Reasoning
  (324 pts, 13 placares exatos).
- Um modelo pequeno e barato, o Mistral Small 3, empatou em 2º com o o3 da
  OpenAI.
- A Meta AI (Llama 4) está na lanterna.
- Conclusão: pagar mais caro num modelo não garante palpite melhor — e
  nenhuma IA chega perto de cravar tudo.

LINKS
- Site: ${SITE}
- Instagram: @arena.das.ias
- Contato: [seu e-mail/whatsapp aqui]`;

type Persona = {
  id: string;
  emoji: string;
  publico: string;
  gancho: string;
  contato: string;
  mensagem: string;
};

const PERSONAS: Persona[] = [
  {
    id: "tech-news",
    emoji: "📰",
    publico: "Jornalista de tecnologia",
    gancho: "Modelo barato bate modelo caro + dataset aberto e reprodutível.",
    contato:
      "E-mail de pauta do veículo (pauta@ / redacao@) ou DM no LinkedIn do repórter da editoria de IA/tech.",
    mensagem: `Oi, [nome]! Tenho uma pauta de IA com um gancho contraintuitivo que acho que rende.

Montei a Arena de IAs: 54 modelos de IA (de 124 convidados) palpitando a Copa 2026 com as regras de um bolão clássico, ranking ao vivo. Já são ~9,6 mil palpites.

O resultado surpreende: o líder não é o ChatGPT nem o Gemini — é o Grok 4 Fast Reasoning. Um modelo pequeno e barato (Mistral Small 3) empatou em 2º com o o3 da OpenAI, e a Meta AI (Llama 4) está na lanterna. Pagar mais caro não garantiu palpite melhor.

Tudo é público e reprodutível: ${SITE}. Posso te passar os dados brutos, recortes por modelo e o método. Topa?

[seu nome]`,
  },
  {
    id: "esporte",
    emoji: "⚽",
    publico: "Jornalista de esporte / dados",
    gancho: "IA vs. palpiteiro humano: quem crava mais placar. Histórias por jogo.",
    contato:
      "Editoria de esporte ou colunista de dados — e-mail de pauta do veículo ou LinkedIn.",
    mensagem: `Oi, [nome]! Uma pauta diferente pra Copa: IA contra palpiteiro humano.

Coloquei 54 inteligências artificiais pra cravar placar de todos os jogos da Copa 2026, com as mesmas regras de bolão que a gente usa na resenha. Ranking ao vivo, ~9,6 mil palpites.

Dá várias histórias: em que jogos TODAS as IAs erraram juntas, qual modelo é o mais "ousado", e se alguma máquina bate o melhor humano. Estou inclusive abrindo pros leitores entrarem e disputarem contra as IAs no mata-mata.

Site: ${SITE}. Te mando os recortes que quiser. Bora?

[seu nome]`,
  },
  {
    id: "influ-ia",
    emoji: "🤖",
    publico: "Influenciador de IA (YouTube/Insta)",
    gancho: "Vídeo/post 'qual IA é mais inteligente de verdade?' com cards prontos.",
    contato: "DM no Instagram/X ou e-mail comercial da bio.",
    mensagem: `Fala, [nome]! Curto teu conteúdo de IA e acho que isso aqui vira um vídeo/post ótimo:

Botei 54 IAs (ChatGPT, Gemini, Claude, Grok, DeepSeek, Mistral...) pra palpitar a Copa 2026 num bolão, com ranking ao vivo. Já são ~9,6 mil palpites.

O plot twist: o líder é o Grok 4 Fast, um modelo baratinho (Mistral Small 3) empatou em 2º com o o3, e a Meta AI ficou em último. Ótimo pra um "qual IA é mais inteligente de verdade?".

Tenho cards e dados prontos pra você usar. Site: ${SITE}. Se quiser, te passo tudo.

Abraço, [seu nome]`,
  },
  {
    id: "influ-fut",
    emoji: "🎯",
    publico: "Influenciador de futebol / palpites",
    gancho: "Ranking de qual 'robô' acerta mais — e o público entra pra bater as máquinas.",
    contato: "DM no Instagram/X ou e-mail da bio.",
    mensagem: `Fala, [nome]! Pauta boa pra galera de palpite: criei um bolão só de IAs pra Copa 2026.

54 inteligências artificiais cravando placar com as regras clássicas (placar exato 10, mata-mata 2x). Dá pra ver qual "robô" acerta mais — e o público pode entrar e tentar bater as máquinas no mata-mata.

Spoiler: as IAs erram MUITO em jogo "fácil". Rende treta boa. Site: ${SITE}.

Posso te mandar o ranking e os melhores recortes. Topa divulgar/testar?

[seu nome]`,
  },
  {
    id: "podcast",
    emoji: "🎙️",
    publico: "Podcast de tech / cultura",
    gancho: "Bloco sobre 'o modelo mais caro não ganha' + experimento público feito sozinho.",
    contato: "Formulário de pauta do podcast ou e-mail de contato no site/bio.",
    mensagem: `Oi, pessoal! Acho que tenho um bom papo de bloco pra vocês.

Criei a Arena de IAs: 54 modelos de IA disputando um bolão da Copa 2026, ranking ao vivo, ~9,6 mil palpites, projeto independente bancado pela própria comunidade (uns R$ 1,6 mil de ~120 apoiadores).

Dá conversa sobre: o modelo mais caro não ganha (o líder é o Grok 4 Fast, e um modelo barato empatou em 2º), o que isso diz sobre "inteligência" de LLM, e como dá pra rodar um experimento público assim sozinho.

${SITE}. Se rolar, topo participar ou só passar os dados.

[seu nome]`,
  },
  {
    id: "academico",
    emoji: "🎓",
    publico: "Pesquisador(a) / professor(a) de IA",
    gancho: "Benchmark informal e reprodutível: calibração e custo×desempenho de LLMs.",
    contato: "LinkedIn (mensagem direta) ou e-mail institucional.",
    mensagem: `Olá, [nome]! Acompanho seu trabalho em [área] e queria compartilhar um experimento que pode te interessar.

Montei um benchmark informal e público: 54 LLMs (de 124) gerando previsões de placar pra Copa 2026 sob regras fixas de pontuação, com coleta versionada (com e sem dossiê de contexto) e ranking aberto. ~9,6 mil previsões até agora.

Resultados curiosos pra discutir calibração e custo×desempenho: o líder é um modelo de inferência rápida, um modelo pequeno (Mistral Small 3) rivaliza com modelos de ponta, e há casos de erro consensual. Dados e método públicos em ${SITE}.

Se for útil pra aula, post ou pesquisa, te passo o dataset. Abraço, [seu nome]`,
  },
  {
    id: "newsletter",
    emoji: "✉️",
    publico: "Newsletter de IA / tech",
    gancho: "Item curto e clicável: '54 IAs apostaram na Copa — e a mais cara perdeu.'",
    contato: "Responder a uma edição da newsletter ou e-mail de contato/pauta.",
    mensagem: `Oi, [nome]! Sugestão de item pra newsletter:

"54 IAs apostaram na Copa — e a mais cara perdeu." Coloquei 54 modelos (de 124 convidados) pra palpitar a Copa 2026 num bolão com ranking ao vivo (~9,6 mil palpites). Líder: Grok 4 Fast; um modelo pequeno (Mistral Small 3) empatou em 2º com o o3; Meta AI na lanterna.

Tudo aberto: ${SITE}. Posso mandar dados e um print do ranking se quiser usar. Valeu!

[seu nome]`,
  },
];

type Whats = { id: string; quando: string; titulo: string; texto: string };

// Mensagens de divulgação pro WhatsApp (grupos, listas). Editáveis aqui.
const WHATSAPP: Whats[] = [
  {
    id: "wpp-anuncio",
    quando: "Anúncio inicial",
    titulo: "Apresentar o bolão das IAs",
    texto: `Galera, montei um bolão das IAs pra Copa 2026 — máquina contra máquina, ranking ao vivo.

54 inteligências artificiais (de 124 convidadas) palpitaram os jogos com as regras clássicas: placar exato 10, vencedor+saldo 7, vencedor 5, empate 5, mata-mata 2x. Já são ~9,6 mil palpites.

O plot twist: o líder não é o ChatGPT nem o Gemini — é o Grok 4 Fast. Um modelo barato (Mistral Small 3) empatou em 2º, e a Meta AI ficou na lanterna.

Dá pra entrar e tentar bater as máquinas no mata-mata: ${SITE}`,
  },
  {
    id: "wpp-rodada",
    quando: "Resumo por rodada",
    titulo: "Template pós-apuração",
    texto: `Rodada <data> — <N> jogos apurados

Top 3 das IAs:
1. <IA líder> — <pts> pts (<exatos> exatos)
2. <IA 2ª> — <pts> pts
3. <IA 3ª> — <pts> pts

Destaques:
- <jogo + placar>: quem cravou exato (+10) | quem errou feio
- Consenso errado: todas apostaram em <X>, deu <Y>

Ranking completo: ${SITE}`,
  },
  {
    id: "wpp-fim-grupos",
    quando: "Fim da fase de grupos",
    titulo: "Virada de chave pro mata-mata",
    texto: `Fechou a fase de grupos! Ranking parcial das IAs:

1. Grok 4 Fast Reasoning — 324 pts (13 placares exatos)
2. OpenAI o3 — 296 pts
3. Mistral Small 3 — 296 pts

Curiosidades:
- IA mais "exata" (mais placares cravados): <IA>
- Maior consenso errado: <jogo + placar>
- Surpresa: modelo barato brigando com os caros

Agora vem o mata-mata, que vale 2x — e o público pode entrar pra disputar contra as IAs: ${SITE}`,
  },
  {
    id: "wpp-encerramento",
    quando: "Encerramento",
    titulo: "Ranking final",
    texto: `Acabou! Ranking final do Bolão das IAs:

🥇 1. <IA campeã> — <pts> pts
🥈 2. <IA vice> — <pts> pts
🥉 3. <IA 3ª> — <pts> pts

Postmortem:
- IA que mais cravou placar exato: <IA>
- Maior fracasso individual: <IA> no jogo <X>
- Humano que bateu as máquinas: <nome> (ou "nenhum 🤖")

Tudo público: ${SITE}. Obrigado quem acompanhou!`,
  },
];

type Contato = {
  nome: string;
  categoria: string;
  canal: string;
  obs: string;
};

// Veículos/pessoas sugeridos. Canais são pontos de partida — confirmar o
// e-mail/handle atual no site oficial ou LinkedIn antes de enviar.
const CONTATOS: Contato[] = [
  { nome: "Tilt (UOL)", categoria: "Jornalismo tech", canal: "Pauta pelo site UOL / LinkedIn dos repórteres de IA", obs: "Editoria forte em IA e cultura digital." },
  { nome: "TecMundo", categoria: "Jornalismo tech", canal: "redacao@tecmundo.com.br (confirmar) / LinkedIn", obs: "Alto alcance, gosta de ângulos curiosos." },
  { nome: "Olhar Digital", categoria: "Jornalismo tech", canal: "Formulário 'fale conosco' / LinkedIn", obs: "Cobre IA diariamente." },
  { nome: "Canaltech", categoria: "Jornalismo tech", canal: "Pauta pelo site / LinkedIn", obs: "Bom pra notícia rápida." },
  { nome: "Núcleo Jornalismo", categoria: "Jornalismo tech", canal: "contato pelo site / X (@nucleo)", obs: "Foco em tecnologia e sociedade." },
  { nome: "MIT Technology Review Brasil", categoria: "Jornalismo tech", canal: "E-mail de pauta no site", obs: "Ângulo mais analítico/custo×desempenho." },
  { nome: "ge / Globo Esporte", categoria: "Esporte", canal: "Pauta pelo site / LinkedIn de editores", obs: "Pauta de dados na Copa." },
  { nome: "ESPN Brasil", categoria: "Esporte", canal: "Contato pelo site / X", obs: "Gosta de curiosidade estatística." },
  { nome: "Trivela", categoria: "Esporte", canal: "E-mail de contato no site / X", obs: "Público analítico de futebol." },
  { nome: "Filipe Deschamps", categoria: "Creator tech", canal: "E-mail comercial / DM", obs: "Audiência dev/tech enorme." },
  { nome: "Código Fonte TV", categoria: "Creator tech", canal: "E-mail comercial na descrição", obs: "Formato notícia tech." },
  { nome: "Hipsters.tech (Alura)", categoria: "Podcast", canal: "Formulário de pauta / e-mail Alura", obs: "Episódio sobre IA aplicada." },
  { nome: "Like a Boss", categoria: "Podcast", canal: "Contato no site / Instagram", obs: "Tech + empreendedorismo." },
  { nome: "Mamilos", categoria: "Podcast", canal: "Contato no site", obs: "Ângulo de sociedade/IA." },
];

export default async function ComunicacoesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isAdminEmail(user.email)) notFound();

  return (
    <main style={{ maxWidth: 1080, margin: "32px auto", padding: "0 20px 60px" }}>
      <ComStyle />

      <div style={{ marginBottom: 20 }}>
        <Link href="/admin" style={{ fontSize: 13, color: "var(--fg-muted)" }}>
          ← painel admin
        </Link>
      </div>

      <h1 style={{ fontSize: 32, fontWeight: 900, marginBottom: 4 }}>
        📣 Comunicações
      </h1>
      <p style={{ color: "var(--fg-muted)", fontSize: 14, marginBottom: 28 }}>
        Mensagens prontas pra influenciadores, jornalistas e parceiros — com o
        gancho, os dados e o canal de contato de cada um. Logado como{" "}
        <code>{user.email}</code>.
      </p>

      {/* Kit de imprensa */}
      <section className="com-card" style={{ marginBottom: 28 }}>
        <div className="com-head">
          <div>
            <span className="com-badge" style={{ background: "color-mix(in srgb, #6d28d9 16%, transparent)", color: "#6d28d9" }}>
              Kit de imprensa
            </span>
            <h2 className="com-titulo">Dados-chave + a história pra contar</h2>
            <p className="com-gancho">
              Cole isso no topo de qualquer e-mail ou mande como anexo. Atualize
              os números no início de cada fase.
            </p>
          </div>
          <CopiarTexto texto={KIT_IMPRENSA} label="Copiar kit" />
        </div>
        <pre className="com-texto">{KIT_IMPRENSA}</pre>
      </section>

      {/* Personas */}
      <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 14 }}>
        Mensagens por público ({PERSONAS.length})
      </h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 36 }}>
        {PERSONAS.map((p) => (
          <section key={p.id} className="com-card">
            <div className="com-head">
              <div>
                <span className="com-badge">
                  {p.emoji} {p.publico}
                </span>
                <p className="com-gancho">
                  <strong>Gancho:</strong> {p.gancho}
                </p>
                <p className="com-contato">
                  <strong>📬 Contato:</strong> {p.contato}
                </p>
              </div>
              <CopiarTexto texto={p.mensagem} label="Copiar" />
            </div>
            <pre className="com-texto">{p.mensagem}</pre>
          </section>
        ))}
      </div>

      {/* Lista de contatos */}
      <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>
        Quem procurar ({CONTATOS.length})
      </h2>
      <p style={{ color: "var(--fg-muted)", fontSize: 13, marginBottom: 14 }}>
        Pontos de partida. Confirme o e-mail/handle atual no site oficial ou
        LinkedIn antes de enviar — evite mandar pra contato desatualizado.
      </p>
      <div className="com-tabela-wrap">
        <table className="com-tabela">
          <thead>
            <tr>
              <th>Veículo / pessoa</th>
              <th>Categoria</th>
              <th>Canal</th>
              <th>Observação</th>
            </tr>
          </thead>
          <tbody>
            {CONTATOS.map((c) => (
              <tr key={c.nome}>
                <td><strong>{c.nome}</strong></td>
                <td>{c.categoria}</td>
                <td>{c.canal}</td>
                <td style={{ color: "var(--fg-muted)" }}>{c.obs}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* WhatsApp / grupos */}
      <h2 style={{ fontSize: 22, fontWeight: 800, margin: "8px 0 14px" }}>
        Mensagens de WhatsApp / grupos ({WHATSAPP.length})
      </h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 36 }}>
        {WHATSAPP.map((w) => (
          <section key={w.id} className="com-card">
            <div className="com-head">
              <div>
                <span className="com-badge" style={{ background: "color-mix(in srgb, #25d366 18%, transparent)", color: "#128c4b" }}>
                  💬 {w.quando}
                </span>
                <p className="com-gancho">{w.titulo}</p>
              </div>
              <CopiarTexto texto={w.texto} label="Copiar" />
            </div>
            <pre className="com-texto">{w.texto}</pre>
          </section>
        ))}
      </div>

      <section style={{ marginTop: 8, paddingTop: 20, borderTop: "1px solid var(--line)" }}>
        <p style={{ fontSize: 14, color: "var(--fg-muted)" }}>
          Posts de Instagram prontos ficam em{" "}
          <Link href="/admin/instagram-posts">/admin/instagram-posts</Link>.
        </p>
      </section>
    </main>
  );
}

function ComStyle() {
  return (
    <style>{`
      .com-card {
        border: 1px solid var(--line);
        border-radius: var(--r-m, 12px);
        background: var(--bg-2);
        padding: 18px;
      }
      .com-head {
        display: flex;
        gap: 12px;
        align-items: flex-start;
        justify-content: space-between;
        margin-bottom: 12px;
      }
      .com-badge {
        display: inline-block;
        font-size: 13px;
        font-weight: 800;
        padding: 4px 10px;
        border-radius: 999px;
        background: var(--bg-soft);
        color: var(--fg);
        margin-bottom: 8px;
      }
      .com-titulo { font-size: 18px; font-weight: 800; margin: 2px 0 6px; }
      .com-gancho { font-size: 13px; color: var(--fg-mid); line-height: 1.5; margin: 4px 0; }
      .com-contato { font-size: 13px; color: var(--fg-mid); line-height: 1.5; margin: 4px 0 0; }
      .com-texto {
        font-size: 13px;
        color: var(--fg);
        line-height: 1.6;
        white-space: pre-wrap;
        word-break: break-word;
        margin: 0;
        padding: 14px;
        background: var(--bg-1, var(--bg-soft));
        border: 1px solid var(--line);
        border-radius: var(--r-s, 8px);
        font-family: inherit;
      }
      .com-tabela-wrap { overflow-x: auto; border: 1px solid var(--line); border-radius: var(--r-m, 12px); }
      .com-tabela { width: 100%; border-collapse: collapse; font-size: 13px; min-width: 640px; }
      .com-tabela th {
        text-align: left;
        padding: 10px 14px;
        background: var(--bg-soft);
        font-weight: 800;
        text-transform: uppercase;
        font-size: 11px;
        letter-spacing: 0.05em;
        color: var(--fg-mid);
        border-bottom: 1px solid var(--line);
      }
      .com-tabela td { padding: 11px 14px; border-bottom: 1px solid var(--line); vertical-align: top; }
      .com-tabela tr:last-child td { border-bottom: none; }

      /* Botão copiar (reuso do CopiarTexto) */
      .ig-act {
        flex: 0 0 auto;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 7px;
        padding: 10px 16px;
        min-height: 40px;
        border-radius: var(--r-m, 8px);
        font-size: 13px;
        font-weight: 700;
        cursor: pointer;
        line-height: 1;
        white-space: nowrap;
        border: 1px solid color-mix(in srgb, var(--primary, #6d28d9) 38%, transparent);
        background: color-mix(in srgb, var(--primary, #6d28d9) 12%, transparent);
        color: var(--primary, #6d28d9);
        transition: background .12s, color .12s, border-color .12s;
      }
      .ig-act:hover:not(:disabled) {
        background: color-mix(in srgb, var(--primary, #6d28d9) 20%, transparent);
        border-color: color-mix(in srgb, var(--primary, #6d28d9) 55%, transparent);
      }
      .ig-act.ok {
        background: color-mix(in srgb, #22c55e 16%, transparent);
        border-color: color-mix(in srgb, #22c55e 50%, transparent);
        color: #16a34a;
      }
      .ig-act svg { flex-shrink: 0; }

      @media (max-width: 600px) {
        .com-head { flex-direction: column; }
        .com-head .ig-act { align-self: flex-start; }
      }
    `}</style>
  );
}
