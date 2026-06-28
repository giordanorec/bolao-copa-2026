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
- Coleta versionada: cada IA palpita em rodadas (v1→v2→v3, com e sem dossiê
  de lesões/forma/odds) — dá pra ver como mudam de ideia.
- Regras clássicas: placar exato 10 pts, vencedor+saldo 7, vencedor 5,
  empate 5, mata-mata vale 2x.
- Projeto independente, bancado pela comunidade (~R$ 1,6 mil de ~120
  apoiadores via Pix).

O GANCHO (a parte que surpreende)
- O líder NÃO é o modelo mais famoso: quem manda é o Grok 4 Fast Reasoning
  (324 pts, 13 placares exatos).
- Um modelo pequeno e barato, o Mistral Small 3, empatou em 2º com o o3 da
  OpenAI (296 pts).
- A Meta AI (Llama 4) está na lanterna.
- Conclusão: pagar mais caro num modelo não garante palpite melhor — e
  nenhuma IA chega perto de cravar tudo.

ONDE JÁ SAIU
NE TV (Globo PE), G1, Folha de Pernambuco e CBN nacional.

LINKS
- Site: ${SITE}
- Instagram: @arena.das.ias
- Contato: [seu e-mail/whatsapp aqui]`;

type Canal = { label: string; href?: string };

type Alvo = {
  id: string;
  emoji: string;
  nome: string;
  cargo: string;
  categoria: string;
  canais: Canal[];
  verificado: boolean;
  gancho: string;
  mensagem: string;
};

// Contatos REAIS pesquisados. "verificado" = canal direto confirmado
// (e-mail/site oficial). Os demais são o melhor caminho encontrado
// (LinkedIn/form de pauta) — confirme antes de enviar.
const ALVOS: Alvo[] = [
  {
    id: "aline-sordili",
    emoji: "📰",
    nome: "Aline Sordili",
    cargo: "Colunista de Economia do UOL (beat: IA + negócios + comportamento)",
    categoria: "Jornalismo de IA",
    canais: [
      { label: "LinkedIn", href: "https://www.linkedin.com/in/alinesordili" },
      { label: "sordili.com", href: "https://sordili.com" },
    ],
    verificado: false,
    gancho:
      "Já escreveu coluna com ChatGPT cravando Brasil x Escócia. Ângulo de comportamento (como as IAs mudam de ideia) é a cara do beat dela.",
    mensagem: `» PARA: Aline Sordili — colunista de Economia do UOL (beat: IA + negócios + comportamento do consumidor)
» CANAL: LinkedIn (linkedin.com/in/alinesordili) ou site pessoal sordili.com
» CONTATO: sem e-mail direto confirmado — o LinkedIn é o caminho mais seguro

Oi, Aline! Acompanho sua coluna no UOL sobre como a IA muda negócios e comportamento — e você já escreveu sobre o ChatGPT cravando Brasil x Escócia. Tenho um experimento que conversa direto com esse ângulo.

Criei a Arena de IAs (${SITE}): 54 modelos de IA — de 124 convidados — palpitando todos os jogos da Copa 2026 com as regras de um bolão clássico (placar exato 10 pts, vencedor+saldo 7, mata-mata 2x), e um ranking ao vivo de qual acerta mais. Já são ~9,6 mil palpites.

O que acho que rende pra você: cada IA palpita em rodadas (v1→v2→v3, com e sem dossiê de contexto), então dá pra ver como elas MUDAM de ideia e o quanto são (in)consistentes — puro comportamento. E o resultado é contraintuitivo: o líder não é o ChatGPT nem o Gemini, é o Grok 4 Fast Reasoning (324 pts, 13 placares exatos); um modelo pequeno e barato (Mistral Small 3) empatou em 2º com o o3 da OpenAI; e a Meta AI (Llama 4) está na lanterna. Pagar mais caro não garantiu palpite melhor.

É projeto independente, bancado pela comunidade (~R$ 1,6 mil de ~120 apoiadores), e já saiu em NE TV (Globo PE), G1, Folha de Pernambuco e CBN. Posso te passar os dados brutos, recortes por modelo e a evolução dos palpites. Topa dar uma olhada?

[seu nome] — Arena de IAs · ${SITE} · @arena.das.ias`,
  },
  {
    id: "daniela-braga",
    emoji: "📰",
    nome: "Daniela Braga",
    cargo: "Editora de Inteligência Artificial da Folha de S.Paulo",
    categoria: "Jornalismo de IA",
    canais: [
      { label: "Fale com a Folha", href: "https://www1.folha.uol.com.br/falecomafolha/" },
    ],
    verificado: false,
    gancho:
      "É A editora de IA da Folha desde 2024. Toda pauta de IA passa por ela.",
    mensagem: `» PARA: Daniela Braga — editora de Inteligência Artificial da Folha de S.Paulo
» CANAL: canal de pauta da Folha (ou LinkedIn dela)
» CONTATO: e-mail direto não confirmado — usar o canal de pauta/sugestão da Folha

Olá, Daniela! Como editora de IA da Folha, acho que isto pode virar pauta: um experimento público que compara dezenas de modelos de IA na prática, não no benchmark de papel.

Montei a Arena de IAs (${SITE}): 54 modelos (de 124 convidados — ChatGPT, Gemini, Claude, Grok, DeepSeek, Mistral, Llama) palpitando a Copa 2026 sob regras fixas de bolão (placar exato 10 pts, mata-mata 2x), com ranking ao vivo. Já são ~9,6 mil palpites, coletados em rodadas versionadas (v1→v2→v3, com e sem dossiê de contexto).

O gancho jornalístico: o líder é o Grok 4 Fast Reasoning, não os modelos mais caros; um modelo pequeno e barato (Mistral Small 3) empatou em 2º com o o3 da OpenAI; a Meta AI (Llama 4) está na lanterna. Ou seja, custo×desempenho de LLM virou algo concreto e mensurável — e dá pra discutir calibração e até "alucinação" com dado real.

Projeto independente, bancado pela comunidade (~R$ 1,6 mil de ~120 apoiadores), já citado em NE TV (Globo PE), G1, Folha de Pernambuco e CBN. Dados e método são abertos e reprodutíveis; posso enviar o dataset completo. Faz sentido pra vocês?

[seu nome] — Arena de IAs · ${SITE} · @arena.das.ias`,
  },
  {
    id: "helton-tilt",
    emoji: "📰",
    nome: "Helton Simões Gomes",
    cargo: "Tilt/UOL + apresentador do podcast 'Deu Tilt'",
    categoria: "Jornalismo de IA",
    canais: [
      { label: "Deu Tilt (Apple Podcasts)", href: "https://podcasts.apple.com/br/podcast/deu-tilt/id1500627972" },
      { label: "Tilt/UOL", href: "https://www.uol.com.br/tilt/" },
    ],
    verificado: false,
    gancho:
      "Faz IA 'para humanos atrás das máquinas'. Experimento divertido com IA é a cara do Tilt/Deu Tilt.",
    mensagem: `» PARA: Helton Simões Gomes — Tilt/UOL e podcast "Deu Tilt"
» CANAL: pauta do Tilt/UOL ou DM nas redes dele
» CONTATO: e-mail direto não confirmado — Tilt/UOL ou redes

Fala, Helton! O Tilt explica IA pra gente normal de um jeito divertido, e tenho um experimento com a cara de vocês (rende matéria E episódio de "Deu Tilt").

Criei a Arena de IAs (${SITE}): 54 modelos de IA (de 124 convidados — ChatGPT, Gemini, Claude, Grok, DeepSeek, Mistral...) palpitando a Copa 2026 num bolão de verdade, com regras clássicas (placar exato 10 pts, mata-mata 2x) e ranking ao vivo. Já são ~9,6 mil palpites.

O plot twist é ótimo pra contar: o líder não é o ChatGPT nem o Gemini, é o Grok 4 Fast Reasoning (324 pts, 13 placares exatos); um modelo baratinho (Mistral Small 3) empatou em 2º com o o3; e a Meta AI ficou em último. Dá pra fechar com "qual IA entende mais de futebol — e por que a mais cara não ganha".

Projeto independente bancado pela comunidade (~R$ 1,6 mil de ~120 apoiadores), já em NE TV (Globo PE), G1, Folha PE e CBN. Tenho cards, prints e dados prontos pra você usar. Topa?

[seu nome] — Arena de IAs · ${SITE} · @arena.das.ias`,
  },
  {
    id: "diogo-cortiz",
    emoji: "🎓",
    nome: "Diogo Cortiz",
    cargo: "Pesquisador NIC.br, prof. PUC-SP, colunista UOL, host 'Papo de IA'",
    categoria: "Acadêmico / divulgador",
    canais: [
      { label: "diogocortiz.com.br", href: "https://diogocortiz.com.br" },
    ],
    verificado: true,
    gancho:
      "Maior divulgador-acadêmico de IA do país. Adora o ângulo 'como os modelos diferem entre si'.",
    mensagem: `» PARA: Diogo Cortiz — pesquisador (NIC.br/PUC-SP), colunista UOL, host do "Papo de IA"
» CANAL: formulário/contato no site diogocortiz.com.br [VERIFICADO]
» CONTATO: diogocortiz.com.br

Olá, Diogo! Acompanho seu trabalho de divulgação de IA e montei um experimento público que vira ótimo material de aula, post ou episódio.

É a Arena de IAs (${SITE}): um benchmark informal e aberto onde 54 LLMs (de 124 — ChatGPT, Gemini, Claude, Grok, DeepSeek, Mistral, Llama) geram previsões de placar pra Copa 2026 sob regras fixas de pontuação, com coleta versionada (v1→v2→v3, com e sem dossiê de contexto) e ranking ao vivo. Já são ~9,6 mil previsões.

O que dá discussão boa sobre como os modelos diferem: o líder é o Grok 4 Fast Reasoning (modelo de inferência rápida), um modelo pequeno (Mistral Small 3) rivaliza com modelos de ponta e empatou em 2º com o o3 da OpenAI, a Meta AI (Llama 4) ficou em último, e há casos de erro consensual (todas erram o mesmo jogo). É calibração e custo×desempenho na prática.

Projeto independente bancado pela comunidade (~R$ 1,6 mil de ~120 apoiadores), já citado em NE TV (Globo PE), G1, Folha PE e CBN. Dados e método são abertos — te passo o dataset completo se for útil. Abraço!

[seu nome] — Arena de IAs · ${SITE} · @arena.das.ias`,
  },
  {
    id: "rodrigo-ghedin",
    emoji: "📰",
    nome: "Rodrigo Ghedin",
    cargo: "Manual do Usuário (newsletter + podcast Tecnocracia)",
    categoria: "Jornalismo de IA",
    canais: [
      { label: "manualdousuario.net/contato", href: "https://manualdousuario.net/contato/" },
    ],
    verificado: true,
    gancho:
      "Voz independente influente, cobre IA generativa com olhar crítico. Combina com 'caro não é melhor'.",
    mensagem: `» PARA: Rodrigo Ghedin — Manual do Usuário (newsletter + podcast Tecnocracia)
» CANAL: formulário de contato em manualdousuario.net [VERIFICADO]
» CONTATO: manualdousuario.net

Oi, Rodrigo! Curto o olhar crítico do Manual do Usuário sobre IA generativa, e tenho um caso real que foge do hype e mostra os limites dos modelos.

Criei a Arena de IAs (${SITE}): 54 modelos de IA (de 124 convidados) palpitando a Copa 2026 num bolão com regras clássicas (placar exato 10 pts, mata-mata 2x) e ranking ao vivo. Já são ~9,6 mil palpites, coletados em rodadas versionadas (v1→v2→v3, com e sem dossiê).

O ângulo que acho que combina com você: na prática, "modelo maior/mais caro" não venceu. O líder é o Grok 4 Fast Reasoning, um modelo pequeno e barato (Mistral Small 3) empatou em 2º com o o3, a Meta AI ficou em último — e nenhuma chega perto de cravar tudo. É um banho de realidade contra a propaganda de que IA "acerta tudo".

Projeto independente, bancado pela comunidade (~R$ 1,6 mil de ~120 apoiadores), já em NE TV (Globo PE), G1, Folha PE e CBN. Dados abertos e reprodutíveis; te mando o que precisar. Valeu!

[seu nome] — Arena de IAs · ${SITE} · @arena.das.ias`,
  },
  {
    id: "spagnuolo-nucleo",
    emoji: "📊",
    nome: "Sérgio Spagnuolo",
    cargo: "Diretor/cofundador do Núcleo Jornalismo",
    categoria: "Jornalismo de dados",
    canais: [
      { label: "nucleo.jor.br", href: "https://nucleo.jor.br/sobre/" },
      { label: "spagnuolo.news", href: "https://spagnuolo.news" },
    ],
    verificado: true,
    gancho:
      "Núcleo é especializado em 'como tech e IA moldam a sociedade'. 54 modelos = jornalismo de dados puro.",
    mensagem: `» PARA: Sérgio Spagnuolo — Núcleo Jornalismo
» CANAL: contato em nucleo.jor.br ou site pessoal spagnuolo.news [VERIFICADO]
» CONTATO: nucleo.jor.br / spagnuolo.news

Olá, Sérgio! O Núcleo cobre como a tecnologia e a IA moldam a sociedade, e tenho um dataset que é jornalismo de dados puro.

É a Arena de IAs (${SITE}): 54 modelos de IA (de 124 convidados — ChatGPT, Gemini, Claude, Grok, DeepSeek, Mistral, Llama) palpitando todos os jogos da Copa 2026 sob regras fixas de bolão (placar exato 10 pts, mata-mata 2x), com coleta versionada (v1→v2→v3, com e sem dossiê) e ranking ao vivo. Já são ~9,6 mil previsões estruturadas.

Os recortes que rendem: o líder é o Grok 4 Fast Reasoning (não os modelos mais caros), um modelo pequeno (Mistral Small 3) empatou em 2º com o o3 da OpenAI, a Meta AI (Llama 4) está na lanterna, e há jogos de erro consensual (todas erram juntas). Dá pra cruzar custo×desempenho, divergência entre modelos e consistência rodada a rodada.

Projeto independente, bancado pela comunidade (~R$ 1,6 mil de ~120 apoiadores), já citado em NE TV (Globo PE), G1, Folha PE e CBN. Tudo é aberto e reprodutível — posso enviar o dataset completo. Faz sentido pro Núcleo?

[seu nome] — Arena de IAs · ${SITE} · @arena.das.ias`,
  },
  {
    id: "olhar-digital",
    emoji: "📰",
    nome: "Redação Olhar Digital",
    cargo: "Portal de tecnologia (cobre IA diariamente)",
    categoria: "Jornalismo tech",
    canais: [
      { label: "redacao@olhardigital.com.br", href: "mailto:redacao@olhardigital.com.br" },
      { label: "contato@olhardigital.com.br", href: "mailto:contato@olhardigital.com.br" },
    ],
    verificado: true,
    gancho:
      "Portal de alto volume, cobre IA todo dia e gosta de ângulo curioso/clicável.",
    mensagem: `» PARA: Redação do Olhar Digital
» CANAL: e-mail de pauta [VERIFICADO]
» CONTATO: redacao@olhardigital.com.br (cópia: contato@olhardigital.com.br)

Olá, equipe Olhar Digital! Sugestão de pauta de IA com gancho clicável:

"54 IAs apostaram na Copa — e a mais cara perdeu." Criei a Arena de IAs (${SITE}): 54 modelos de IA (de 124 convidados — ChatGPT, Gemini, Claude, Grok, DeepSeek, Mistral...) palpitando a Copa 2026 num bolão com regras clássicas (placar exato 10 pts, mata-mata 2x) e ranking ao vivo. Já são ~9,6 mil palpites.

O dado que vira manchete: o líder é o Grok 4 Fast Reasoning (324 pts, 13 placares exatos), um modelo pequeno e barato (Mistral Small 3) empatou em 2º com o o3 da OpenAI, e a Meta AI (Llama 4) está em último. Pagar mais caro não garantiu acerto.

Projeto independente, bancado pela comunidade (~R$ 1,6 mil de ~120 apoiadores), já citado em NE TV (Globo PE), G1, Folha de Pernambuco e CBN. Tudo é aberto: posso mandar dados, recortes por modelo e prints do ranking ao vivo. Topam?

[seu nome] — Arena de IAs · ${SITE} · @arena.das.ias`,
  },
  {
    id: "tecnocast",
    emoji: "🎙️",
    nome: "Tecnocast (Tecnoblog)",
    cargo: "Podcast semanal de tecnologia",
    categoria: "Podcast",
    canais: [
      { label: "tecnocast@tecnoblog.net", href: "mailto:tecnocast@tecnoblog.net" },
    ],
    verificado: true,
    gancho:
      "Podcast tech grande; pauta 'qual IA é melhor — e a mais cara não ganha' é perfeita pra um bloco.",
    mensagem: `» PARA: Tecnocast (Tecnoblog)
» CANAL: e-mail do podcast [VERIFICADO]
» CONTATO: tecnocast@tecnoblog.net

Olá, equipe do Tecnocast! Tenho um papo de bloco que acho que rende muito com o público de vocês.

Criei a Arena de IAs (${SITE}): 54 modelos de IA (de 124 convidados — ChatGPT, Gemini, Claude, Grok, DeepSeek, Mistral, Llama) disputando um bolão da Copa 2026, com regras clássicas (placar exato 10 pts, mata-mata 2x), ranking ao vivo e ~9,6 mil palpites, coletados em rodadas versionadas (v1→v2→v3).

O assunto: o modelo mais caro não ganha. O líder é o Grok 4 Fast Reasoning, um modelo baratinho (Mistral Small 3) empatou em 2º com o o3 da OpenAI, e a Meta AI ficou em último. Dá conversa sobre o que isso diz de "inteligência" de LLM, calibração, custo×desempenho — e como dá pra rodar um experimento público assim sozinho.

Projeto independente bancado pela comunidade (~R$ 1,6 mil de ~120 apoiadores), já em NE TV (Globo PE), G1, Folha PE e CBN. Topo participar de um episódio ou só passar os dados. Bora?

[seu nome] — Arena de IAs · ${SITE} · @arena.das.ias`,
  },
  {
    id: "mamilos",
    emoji: "🎙️",
    nome: "Mamilos (B9)",
    cargo: "Cris Bartis + Ju Wallauer — sociedade e cultura",
    categoria: "Podcast",
    canais: [
      { label: "mamilos@mamilos.me", href: "mailto:mamilos@mamilos.me" },
      { label: "@mamilospod", href: "https://instagram.com/mamilospod" },
    ],
    verificado: true,
    gancho:
      "Aceitam sugestão de ouvinte. 'IA palpitando a Copa' é debate cultural divertido sobre confiar (ou não) em IA.",
    mensagem: `» PARA: Mamilos (Cris Bartis e Ju Wallauer)
» CANAL: e-mail de sugestões [VERIFICADO]
» CONTATO: mamilos@mamilos.me (ou IG @mamilospod)

Oi, Cris e Ju! Sugestão de tema de ouvinte, no espírito do Mamilos de discutir cultura e sociedade:

Quanto a gente confia (e devia confiar) na inteligência artificial? Pra testar isso de um jeito divertido, criei a Arena de IAs (${SITE}): 54 modelos de IA (de 124 — ChatGPT, Gemini, Claude, Grok...) palpitando a Copa 2026 num bolão, com ranking ao vivo de qual acerta mais. Já são ~9,6 mil palpites.

O que vira debate: a IA "mais inteligente" não venceu — o líder é o Grok 4 Fast, um modelo barato empatou em 2º, e a Meta AI ficou em último; e em vários jogos TODAS erraram juntas. É uma metáfora ótima pra falar de hype, autoridade da máquina e por que a gente terceiriza decisão pra IA.

Projeto independente bancado pela comunidade (~R$ 1,6 mil de ~120 apoiadores), já citado em NE TV (Globo PE), G1, Folha PE e CBN. Se topam, passo dados, histórias e posso participar. Abraço!

[seu nome] — Arena de IAs · ${SITE} · @arena.das.ias`,
  },
  {
    id: "filipe-deschamps",
    emoji: "🤖",
    nome: "Filipe Deschamps",
    cargo: "YouTuber/programador — projetos famosos de automação com IA",
    categoria: "Influenciador",
    canais: [
      { label: "LinkedIn", href: "https://www.linkedin.com/in/filipedeschamps" },
      { label: "YouTube", href: "https://youtube.com/FilipeDeschamps" },
    ],
    verificado: false,
    gancho:
      "Audiência enorme e tema técnico-divertido com a cara dele. Aposta nº1 de influenciador.",
    mensagem: `» PARA: Filipe Deschamps — YouTube/programador
» CANAL: contato comercial via site/LinkedIn (/in/filipedeschamps)
» CONTATO: LinkedIn ou e-mail comercial do canal

Fala, Filipe! Curto teus projetos de automação com IA e fiz um experimento técnico-divertido que acho que vira um vídeo ótimo.

Botei 54 modelos de IA (de 124 — ChatGPT, Gemini, Claude, Grok, DeepSeek, Mistral, Llama) pra palpitar a Copa 2026 num bolão de verdade, com regras clássicas (placar exato 10 pts, mata-mata 2x), ranking ao vivo e ~9,6 mil palpites. A coleta é versionada (v1→v2→v3, com e sem dossiê), então dá pra mostrar as IAs mudando de ideia.

O plot twist pro vídeo: o líder não é o ChatGPT nem o Gemini, é o Grok 4 Fast Reasoning; um modelo baratinho (Mistral Small 3) empatou em 2º com o o3 da OpenAI; e a Meta AI ficou em último. Renderia um "qual IA é mais inteligente DE VERDADE?" com dado real, e o público pode entrar e tentar bater as máquinas no mata-mata.

Projeto independente bancado pela comunidade (~R$ 1,6 mil de ~120 apoiadores), já em NE TV (Globo PE), G1, Folha PE e CBN. Tenho dados, cards e o método prontos pra você usar. Abraço!

[seu nome] — Arena de IAs · ${SITE} · @arena.das.ias`,
  },
  {
    id: "trivela",
    emoji: "⚽",
    nome: "Trivela",
    cargo: "Publicação de futebol com pegada analítica/dados",
    categoria: "Esporte / dados",
    canais: [
      { label: "trivela.com.br", href: "https://trivela.com.br" },
    ],
    verificado: false,
    gancho:
      "Público analítico de futebol. 'IA vs. palpiteiro' e erros consensuais rendem texto de dados.",
    mensagem: `» PARA: Redação da Trivela
» CANAL: contato/pauta no site trivela.com.br (pessoa específica não identificada)
» CONTATO: trivela.com.br

Olá, equipe Trivela! Uma pauta de dados diferente pra Copa: inteligência artificial contra palpiteiro humano.

Criei a Arena de IAs (${SITE}): 54 modelos de IA (de 124 — ChatGPT, Gemini, Claude, Grok, DeepSeek, Mistral...) cravando placar de todos os jogos da Copa 2026, com as regras clássicas de bolão (placar exato 10 pts, vencedor+saldo 7, mata-mata 2x) e ranking ao vivo. Já são ~9,6 mil palpites.

Pro público analítico de vocês rende bastante: em que jogos TODAS as IAs erraram juntas, qual modelo é o mais "ousado" (arrisca placar improvável e acerta), e se alguma máquina bate o melhor humano. Curiosidade: a IA "mais cara" não lidera — quem manda é o Grok 4 Fast, e um modelo baratinho (Mistral Small 3) empatou em 2º com o o3 da OpenAI. Estou abrindo pros leitores entrarem e disputarem contra as IAs no mata-mata.

Projeto independente bancado pela comunidade (~R$ 1,6 mil de ~120 apoiadores), já citado em NE TV (Globo PE), G1, Folha PE e CBN. Te mando os recortes que quiserem. Bora?

[seu nome] — Arena de IAs · ${SITE} · @arena.das.ias`,
  },
  {
    id: "renato-santino",
    emoji: "📰",
    nome: "Renato Santino",
    cargo: "Valor Econômico (ex-editor do Olhar Digital), +10 anos em tech",
    categoria: "Jornalismo tech",
    canais: [
      { label: "LinkedIn", href: "https://www.linkedin.com/in/renatosantino" },
    ],
    verificado: false,
    gancho:
      "Veterano de tech/IA, agora no Valor. Bom pra ângulo de mercado/custo×desempenho de LLM.",
    mensagem: `» PARA: Renato Santino — Valor Econômico (ex-Olhar Digital)
» CANAL: LinkedIn (/in/renatosantino)
» CONTATO: DM no LinkedIn

Oi, Renato! Você cobre tech/IA há tempos e agora no Valor — tenho um caso com ângulo de mercado que acho que te interessa.

Criei a Arena de IAs (${SITE}): 54 modelos de IA (de 124 convidados) palpitando a Copa 2026 num bolão com regras clássicas (placar exato 10 pts, mata-mata 2x) e ranking ao vivo. Já são ~9,6 mil palpites.

O ângulo econômico: virou um teste prático de custo×desempenho de LLM. O líder é o Grok 4 Fast Reasoning, um modelo pequeno e barato (Mistral Small 3) empatou em 2º com o o3 da OpenAI, e a Meta AI (Llama 4) ficou em último. Ou seja, gastar mais com o modelo "topo de linha" não comprou acerto — um dado concreto pra discutir o hype e o preço da IA.

Projeto independente, bancado pela comunidade (~R$ 1,6 mil de ~120 apoiadores), já citado em NE TV (Globo PE), G1, Folha PE e CBN. Dados abertos e reprodutíveis; te passo o que precisar. Abraço!

[seu nome] — Arena de IAs · ${SITE} · @arena.das.ias`,
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

type Extra = { nome: string; categoria: string; canal: string; obs: string };

// Pistas a garimpar: contato genérico ou pessoa não identificada. Confirme
// antes de enviar.
const EXTRAS: Extra[] = [
  { nome: "TecMundo", categoria: "Jornalismo tech", canal: "'Fale Conosco' no site (e-mail direto não confirmado)", obs: "Grande portal popular de tech." },
  { nome: "Hipsters.tech (Alura)", categoria: "Podcast", canal: "Formulário de pauta no site da Alura/Hipsters", obs: "Episódio sobre IA aplicada." },
  { nome: "ge.globo (jornalismo de dados)", categoria: "Esporte / dados", canal: "Pauta via Globo — garimpar repórter de dados atual", obs: "Tradição de data journalism; sem nome verificado." },
  { nome: "ESPN Brasil", categoria: "Esporte", canal: "Contato no site / X (sem nome verificado)", obs: "Apetite por curiosidade estatística." },
  { nome: "Lucas Montano", categoria: "Influenciador", canal: "DM/comercial no YouTube", obs: "Tech/carreira em dev; fit médio (mais carreira que IA)." },
  { nome: "Thiago Mobilon + Paulo Higa", categoria: "Creator tech", canal: "LinkedIn /in/mobilon · site higa.me · /in/paulohiga", obs: "Tecnoblog/Tecnocast — caminho alternativo ao e-mail do podcast." },
  { nome: "Seu Dinheiro / Jornal da USP", categoria: "Contraponto", canal: "Repórteres que cobriram o simulador estatístico da USP/UFBA", obs: "Ângulo 'IA generativa vs. modelo estatístico'." },
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
        Mensagens prontas e autocontidas pra jornalistas, influenciadores e
        podcasts — cada texto copiável já traz para quem enviar, por qual canal,
        o contato e todos os dados. Logado como <code>{user.email}</code>.
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
              As mensagens abaixo já embutem esses dados. Use este bloco como
              anexo/material de apoio. Atualize os números no início de cada fase.
            </p>
          </div>
          <CopiarTexto texto={KIT_IMPRENSA} label="Copiar kit" />
        </div>
        <pre className="com-texto">{KIT_IMPRENSA}</pre>
      </section>

      {/* Alvos nomeados */}
      <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>
        Mensagens por contato ({ALVOS.length})
      </h2>
      <p style={{ color: "var(--fg-muted)", fontSize: 13, marginBottom: 14 }}>
        Cada caixa é autocontida: copie e envie. O selo{" "}
        <span className="com-pill ok">✓ canal verificado</span> indica e-mail/site
        oficial confirmado; <span className="com-pill warn">confirmar</span> é o
        melhor caminho encontrado (LinkedIn/pauta) — cheque antes de mandar.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 36 }}>
        {ALVOS.map((a) => (
          <section key={a.id} className="com-card">
            <div className="com-head">
              <div>
                <span className="com-badge">
                  {a.emoji} {a.nome}
                </span>
                <span className={`com-pill ${a.verificado ? "ok" : "warn"}`}>
                  {a.verificado ? "✓ canal verificado" : "confirmar"}
                </span>
                <p className="com-cargo">{a.cargo}</p>
                <p className="com-contato">
                  <strong>📬 Canal:</strong>{" "}
                  {a.canais.map((c, i) => (
                    <span key={c.label}>
                      {i > 0 && " · "}
                      {c.href ? (
                        <a
                          className="com-link"
                          href={c.href}
                          target={c.href.startsWith("mailto:") ? undefined : "_blank"}
                          rel="noreferrer"
                        >
                          {c.label}
                        </a>
                      ) : (
                        c.label
                      )}
                    </span>
                  ))}
                </p>
                <p className="com-gancho">
                  <strong>Gancho:</strong> {a.gancho}
                </p>
              </div>
              <CopiarTexto texto={a.mensagem} label="Copiar" />
            </div>
            <pre className="com-texto">{a.mensagem}</pre>
          </section>
        ))}
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

      {/* Extras a garimpar */}
      <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>
        Outros pra garimpar ({EXTRAS.length})
      </h2>
      <p style={{ color: "var(--fg-muted)", fontSize: 13, marginBottom: 14 }}>
        Sem contato direto confirmado ou sem pessoa nominal — vale procurar o
        repórter/handle atual antes de enviar. Reaproveite o texto do alvo mais
        parecido acima.
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
            {EXTRAS.map((c) => (
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

      <section style={{ marginTop: 28, paddingTop: 20, borderTop: "1px solid var(--line)" }}>
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
      .com-pill {
        display: inline-block;
        font-size: 11px;
        font-weight: 800;
        padding: 2px 8px;
        border-radius: 999px;
        margin-left: 8px;
        vertical-align: middle;
      }
      .com-pill.ok { background: color-mix(in srgb, #22c55e 16%, transparent); color: #16a34a; }
      .com-pill.warn { background: color-mix(in srgb, #f59e0b 18%, transparent); color: #b45309; }
      .com-titulo { font-size: 18px; font-weight: 800; margin: 2px 0 6px; }
      .com-cargo { font-size: 13px; font-weight: 700; color: var(--fg); line-height: 1.5; margin: 6px 0 2px; }
      .com-gancho { font-size: 13px; color: var(--fg-mid); line-height: 1.5; margin: 4px 0; }
      .com-contato { font-size: 13px; color: var(--fg-mid); line-height: 1.5; margin: 4px 0 0; }
      .com-link { color: var(--primary, #6d28d9); font-weight: 700; text-decoration: underline; }
      .com-link:hover { opacity: .8; }
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
      .com-tabela-wrap { overflow-x: auto; border: 1px solid var(--line); border-radius: var(--r-m, 12px); margin-bottom: 36px; }
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
