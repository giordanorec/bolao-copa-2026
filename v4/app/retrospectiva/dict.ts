import type { Locale } from "@/lib/i18n";

// Dicionário próprio da retrospectiva final (padrão do projeto: dicionário
// inline por página, como CHIP_LABELS em components/SerieA.tsx). Cobre toda
// a copy fixa das cenas — números e nomes de time vêm do JSON e ficam como
// estão (mesma convenção do resto do site: sem tradução de nome de país).

export type RetroDict = {
  scrollHint: string;
  share: string;
  shareCopied: string;
  voltarHome: string;

  capaKicker: string;
  capaTitulo1: string;
  capaTitulo2: string;
  statDias: string;
  statJogos: string;
  statIas: string;
  statPalpites: string;

  expKicker: string;
  expTitulo: string;
  expApiTitulo: string;
  expApiDesc: string;
  expWebTitulo: string;
  expWebDesc: string;
  expHumTitulo: string;
  expHumDesc: string;

  gruposKicker: string;
  gruposTitulo: string;
  gruposJogos: string;
  gruposGols: string;
  gruposMedia: string;
  gruposFoot: string;
  gruposPrevisivelLabel: string;
  gruposZebraLabel: string;
  votos: string;
  consensoAbrev: string;

  zebrasKicker: string;
  zebrasTitulo: string;
  brasilKicker: string;
  brasilCristalDizia: string;
  brasilCampeao: string;
  brasilTexto: string;
  semiKicker: string;
  semiTitulo: string;
  semiTexto: (n: number, total: number) => string;
  terceiroKicker: string;
  terceiroTitulo: string;
  terceiroTexto: (n: number, total: number, gols: number) => string;
  maisZebrasTitulo: string;

  cravadasKicker: string;
  cravadasTitulo: string;
  cravadasSub: string;
  cravadasLabel: string;
  impressionanteKicker: string;
  impressionanteTexto: (n: number, total: number) => string;

  humanosKicker: string;
  humanosTitulo: string;
  humanosNome: string;
  humanosSub: (ias: number, total: number) => string;
  humanosCaption: string;
  humanosPontos: string;
  humanosExatos: string;

  corridaKicker: string;
  corridaTitulo: string;
  corridaSub: string;

  podioKicker: string;
  podioTitulo: string;
  podioGeralLabel: string;
  podioGeralSub: string;
  podioSerieALabel: string;
  podioSerieASub: string;
  podioHumanoLabel: string;
  podioHumanoSub: string;
  pts: string;
  exatosAbrev: string;

  finalKicker: string;
  finalTitulo: string;
  finalConsensoTexto: string;
  finalCravaramTitulo: (n: number) => string;
  finalMaisOutras: (n: number) => string;

  fimKicker: string;
  fimTitulo1: string;
  fimTitulo2: string;
  fimSub: string;
  ctaRanking: string;
  ctaJogos: string;
  ctaAnalise: string;
  instagramLabel: string;
};

const PT: RetroDict = {
  scrollHint: "role pra começar",
  share: "Compartilhar",
  shareCopied: "Link copiado!",
  voltarHome: "Voltar à home",

  capaKicker: "Copa do Mundo 2026 · Bolão das IAs",
  capaTitulo1: "A retrospectiva",
  capaTitulo2: "final",
  statDias: "dias de Copa",
  statJogos: "jogos disputados",
  statIas: "IAs no torneio",
  statPalpites: "palpites registrados",

  expKicker: "O experimento",
  expTitulo: "124 cérebros, um único bolão",
  expApiTitulo: "IAs por API",
  expApiDesc:
    "A maioria rodou direto pela API dos provedores — GPT, Claude, Gemini, Grok, DeepSeek, Mistral, Qwen e dezenas de outras. Mesmo prompt, mesmos 104 jogos, sem exceção.",
  expWebTitulo: "IAs pela Web",
  expWebDesc:
    "Onze modelos de interface — a Série A — palpitaram como gente: abriram o navegador, pesquisaram notícias, lesões e forma antes de cravar o placar.",
  expHumTitulo: "Humanos",
  expHumDesc:
    "Pessoas de verdade entraram no mesmo ranking, respondendo ao mesmo placar clássico de bolão. Sem vantagem. Sem handicap.",

  gruposKicker: "A fase de grupos",
  gruposTitulo: "72 jogos pra abrir o apetite",
  gruposJogos: "jogos disputados",
  gruposGols: "gols nas redes",
  gruposMedia: "gols por jogo",
  gruposFoot: "Uma fase de grupos movimentada — e as IAs tentaram cravar cada placar.",
  gruposPrevisivelLabel: "O mais previsível",
  gruposZebraLabel: "A zebra da fase",
  votos: "votos",
  consensoAbrev: "consenso",

  zebrasKicker: "Quando o roteiro virou",
  zebrasTitulo: "A zebra é eterna",
  brasilKicker: "A maior decepção",
  brasilCristalDizia: "🔮 A Bola de Cristal (consenso das IAs) dizia:",
  brasilCampeao: "campeã",
  brasilTexto:
    "O consenso das IAs apostava no Brasil como campeão do mundo. A Seleção nem passou das oitavas.",
  semiKicker: "A cegueira coletiva",
  semiTitulo: "Ninguém viu a campeã chegando",
  semiTexto: (n, total) =>
    `De ${total} IAs, ${n} previram vitória espanhola nessa semifinal. O consenso apontava empate. A futura campeã do mundo foi descartada por unanimidade.`,
  terceiroKicker: "Festival de gols, zero acertos",
  terceiroTitulo: "10 gols. Ninguém cravou.",
  terceiroTexto: (n, total, gols) =>
    `${gols} gols na disputa de 3º lugar e nenhuma das ${total} IAs acertou o placar exato. Só ${n} sequer apostaram numa vitória inglesa.`,
  maisZebrasTitulo: "Mais surpresas que pegaram o consenso no contrapé",

  cravadasKicker: "As cravadas",
  cravadasTitulo: "Cravar o placar é outra história",
  cravadasSub:
    "Acertar quem ganha é craft. Acertar o placar exato, jogo após jogo, é outro nível — só uma dúzia de IAs passou dos 20 acertos em 104 jogos.",
  cravadasLabel: "placares exatos",
  impressionanteKicker: "A cravada mais ousada",
  impressionanteTexto: (n, total) =>
    `Entre ${total} IAs, só ${n} cravaram esse placar de 5 gols. A maioria nem chegou perto.`,

  humanosKicker: "Humanos × Máquinas",
  humanosTitulo: "Um humano no meio do mar de robôs",
  humanosNome: "Gabriel",
  humanosSub: (ias, total) =>
    `${ias} das ${total} IAs do bolão. Gabriel terminou na frente de todas elas.`,
  humanosCaption: "Só os 2 co-campeões e mais uma IA (o4-mini) bateram Gabriel no torneio inteiro.",
  humanosPontos: "pontos",
  humanosExatos: "placares exatos",

  corridaKicker: "A corrida",
  corridaTitulo: "Replay: virada por virada",
  corridaSub:
    "A pontuação real acumulada, jogo a jogo, do primeiro apito ao último. Filtre por fase e escolha quem acompanhar.",

  podioKicker: "O pódio final",
  podioTitulo: "Três campeões, uma Copa",
  podioGeralLabel: "Campeãs geral (124 IAs)",
  podioGeralSub: "Empate no topo — as duas cravaram exatamente 636 pontos.",
  podioSerieALabel: "Campeã da Série A",
  podioSerieASub: "As 12 IAs de interface, pesquisando como gente.",
  podioHumanoLabel: "Campeão humano",
  podioHumanoSub: "Bateu 121 das 124 IAs do bolão inteiro.",
  pts: "pts",
  exatosAbrev: "exatos",

  finalKicker: "A Final",
  finalTitulo: "Ninguém viu vir",
  finalConsensoTexto:
    "O consenso das IAs cravou 1×1 — o maior consenso do mata-mata inteiro, 41 de 62 votos. Saiu 1×0 Espanha.",
  finalCravaramTitulo: (n) => `${n} IAs cravaram o 1×0 exato`,
  finalMaisOutras: (n) => `+ ${n} outras`,

  fimKicker: "Isso foi",
  fimTitulo1: "o Bolão",
  fimTitulo2: "das IAs",
  fimSub:
    "124 modelos, 104 jogos, milhares de palpites — e o futebol, como sempre, teve a última palavra. Explore o resto do site.",
  ctaRanking: "🏆 Ranking completo",
  ctaJogos: "⚽ Todos os jogos",
  ctaAnalise: "📊 Análise completa",
  instagramLabel: "Siga @arena.das.ias",
};

const EN: RetroDict = {
  scrollHint: "scroll to begin",
  share: "Share",
  shareCopied: "Link copied!",
  voltarHome: "Back home",

  capaKicker: "2026 World Cup · The AI Soccer Pool",
  capaTitulo1: "The final",
  capaTitulo2: "retrospective",
  statDias: "days of World Cup",
  statJogos: "matches played",
  statIas: "AIs in the tournament",
  statPalpites: "predictions logged",

  expKicker: "The experiment",
  expTitulo: "124 brains, one single pool",
  expApiTitulo: "AIs via API",
  expApiDesc:
    "Most ran straight through provider APIs — GPT, Claude, Gemini, Grok, DeepSeek, Mistral, Qwen and dozens more. Same prompt, same 104 matches, no exceptions.",
  expWebTitulo: "AIs via the Web",
  expWebDesc:
    "Eleven consumer-facing models — the Premier League — predicted like a human would: opened a browser, researched news, injuries and form before locking in a score.",
  expHumTitulo: "Humans",
  expHumDesc:
    "Real people entered the very same ranking, answering to the very same classic pool scoring. No edge. No handicap.",

  gruposKicker: "The group stage",
  gruposTitulo: "72 matches to warm up",
  gruposJogos: "matches played",
  gruposGols: "goals scored",
  gruposMedia: "goals per match",
  gruposFoot: "A busy group stage — and the AIs tried to nail every single score.",
  gruposPrevisivelLabel: "The most predictable",
  gruposZebraLabel: "The stage's biggest upset",
  votos: "votes",
  consensoAbrev: "consensus",

  zebrasKicker: "When the script flipped",
  zebrasTitulo: "The upset is eternal",
  brasilKicker: "The biggest letdown",
  brasilCristalDizia: "🔮 The Crystal Ball (the AI consensus) said:",
  brasilCampeao: "champion",
  brasilTexto:
    "The AI consensus bet on Brazil as world champion. The Seleção didn't even make it past the round of 16.",
  semiKicker: "Collective blindness",
  semiTitulo: "Nobody saw the champion coming",
  semiTexto: (n, total) =>
    `Out of ${total} AIs, ${n} predicted a Spanish win in this semifinal. The consensus called a draw. The future world champion was dismissed unanimously.`,
  terceiroKicker: "Goal fest, zero exact calls",
  terceiroTitulo: "10 goals. Nobody nailed it.",
  terceiroTexto: (n, total, gols) =>
    `${gols} goals in the third-place match and not one of ${total} AIs got the exact score. Only ${n} even bet on an England win.`,
  maisZebrasTitulo: "More upsets that caught the consensus off guard",

  cravadasKicker: "The exact calls",
  cravadasTitulo: "Nailing the score is a different game",
  cravadasSub:
    "Picking the winner is craft. Nailing the exact score, match after match, is another level — only a dozen AIs cleared 20 exact calls across 104 matches.",
  cravadasLabel: "exact scores",
  impressionanteKicker: "The boldest exact call",
  impressionanteTexto: (n, total) =>
    `Out of ${total} AIs, only ${n} nailed this 5-goal scoreline. Most weren't even close.`,

  humanosKicker: "Humans × Machines",
  humanosTitulo: "One human in a sea of robots",
  humanosNome: "Gabriel",
  humanosSub: (ias, total) =>
    `${ias} out of ${total} AIs in the pool. Gabriel finished ahead of every single one of them.`,
  humanosCaption: "Only the 2 co-champions and one more AI (o4-mini) beat Gabriel across the whole tournament.",
  humanosPontos: "points",
  humanosExatos: "exact scores",

  corridaKicker: "The race",
  corridaTitulo: "Replay: comeback by comeback",
  corridaSub:
    "Real accumulated points, match by match, from the first whistle to the last. Filter by stage and pick who to follow.",

  podioKicker: "The final podium",
  podioTitulo: "Three champions, one World Cup",
  podioGeralLabel: "Overall champions (124 AIs)",
  podioGeralSub: "Tied at the top — both landed exactly 636 points.",
  podioSerieALabel: "Premier League champion",
  podioSerieASub: "The 12 consumer-facing AIs, researching like a person.",
  podioHumanoLabel: "Human champion",
  podioHumanoSub: "Beat 121 out of 124 AIs in the entire pool.",
  pts: "pts",
  exatosAbrev: "exact",

  finalKicker: "The Final",
  finalTitulo: "Nobody saw it coming",
  finalConsensoTexto:
    "The AI consensus called 1-1 — the strongest consensus of the entire knockout stage, 41 of 62 votes. It ended 1-0 Spain.",
  finalCravaramTitulo: (n) => `${n} AIs nailed the exact 1-0`,
  finalMaisOutras: (n) => `+ ${n} more`,

  fimKicker: "That was",
  fimTitulo1: "the AI",
  fimTitulo2: "Soccer Pool",
  fimSub:
    "124 models, 104 matches, thousands of predictions — and football, as always, had the final word. Explore the rest of the site.",
  ctaRanking: "🏆 Full ranking",
  ctaJogos: "⚽ All matches",
  ctaAnalise: "📊 Full analysis",
  instagramLabel: "Follow @arena.das.ias",
};

const ES: RetroDict = {
  scrollHint: "desliza para empezar",
  share: "Compartir",
  shareCopied: "¡Enlace copiado!",
  voltarHome: "Volver al inicio",

  capaKicker: "Mundial 2026 · La Polla de las IAs",
  capaTitulo1: "La retrospectiva",
  capaTitulo2: "final",
  statDias: "días de Mundial",
  statJogos: "partidos disputados",
  statIas: "IAs en el torneo",
  statPalpites: "pronósticos registrados",

  expKicker: "El experimento",
  expTitulo: "124 cerebros, una sola polla",
  expApiTitulo: "IAs por API",
  expApiDesc:
    "La mayoría corrió directo por la API de los proveedores — GPT, Claude, Gemini, Grok, DeepSeek, Mistral, Qwen y decenas más. Mismo prompt, mismos 104 partidos, sin excepciones.",
  expWebTitulo: "IAs por la Web",
  expWebDesc:
    "Once modelos de interfaz — la Liga — pronosticaron como una persona: abrieron el navegador, buscaron noticias, lesiones y forma antes de fijar el marcador.",
  expHumTitulo: "Humanos",
  expHumDesc:
    "Personas de verdad entraron en el mismo ranking, respondiendo al mismo puntaje clásico de polla. Sin ventaja. Sin hándicap.",

  gruposKicker: "La fase de grupos",
  gruposTitulo: "72 partidos para entrar en calor",
  gruposJogos: "partidos disputados",
  gruposGols: "goles anotados",
  gruposMedia: "goles por partido",
  gruposFoot: "Una fase de grupos movida — y las IAs intentaron acertar cada marcador.",
  gruposPrevisivelLabel: "El más previsible",
  gruposZebraLabel: "La sorpresa de la fase",
  votos: "votos",
  consensoAbrev: "consenso",

  zebrasKicker: "Cuando el guion cambió",
  zebrasTitulo: "La sorpresa es eterna",
  brasilKicker: "La mayor decepción",
  brasilCristalDizia: "🔮 La Bola de Cristal (el consenso de las IAs) decía:",
  brasilCampeao: "campeona",
  brasilTexto:
    "El consenso de las IAs apostaba por Brasil como campeón del mundo. La Selección ni siquiera pasó de octavos.",
  semiKicker: "Ceguera colectiva",
  semiTitulo: "Nadie vio venir a la campeona",
  semiTexto: (n, total) =>
    `De ${total} IAs, ${n} pronosticaron una victoria española en esta semifinal. El consenso marcaba empate. A la futura campeona del mundo la descartaron por unanimidad.`,
  terceiroKicker: "Festival de goles, cero aciertos",
  terceiroTitulo: "10 goles. Nadie lo acertó.",
  terceiroTexto: (n, total, gols) =>
    `${gols} goles en la disputa por el 3er lugar y ninguna de las ${total} IAs acertó el marcador exacto. Solo ${n} apostaron por una victoria inglesa.`,
  maisZebrasTitulo: "Más sorpresas que agarraron al consenso a contrapié",

  cravadasKicker: "Los aciertos exactos",
  cravadasTitulo: "Acertar el marcador es otra historia",
  cravadasSub:
    "Acertar quién gana es oficio. Acertar el marcador exacto, partido tras partido, es otro nivel — solo una docena de IAs superó los 20 aciertos en 104 partidos.",
  cravadasLabel: "marcadores exactos",
  impressionanteKicker: "El acierto más audaz",
  impressionanteTexto: (n, total) =>
    `Entre ${total} IAs, solo ${n} acertaron este marcador de 5 goles. La mayoría ni se acercó.`,

  humanosKicker: "Humanos × Máquinas",
  humanosTitulo: "Un humano en medio del mar de robots",
  humanosNome: "Gabriel",
  humanosSub: (ias, total) =>
    `${ias} de las ${total} IAs de la polla. Gabriel terminó por delante de todas ellas.`,
  humanosCaption: "Solo los 2 co-campeones y una IA más (o4-mini) superaron a Gabriel en todo el torneo.",
  humanosPontos: "puntos",
  humanosExatos: "marcadores exactos",

  corridaKicker: "La carrera",
  corridaTitulo: "Repetición: vuelco tras vuelco",
  corridaSub:
    "El puntaje real acumulado, partido a partido, desde el primer pitazo hasta el último. Filtra por fase y elige a quién seguir.",

  podioKicker: "El podio final",
  podioTitulo: "Tres campeones, un Mundial",
  podioGeralLabel: "Campeonas general (124 IAs)",
  podioGeralSub: "Empate en la cima — ambas llegaron exactamente a 636 puntos.",
  podioSerieALabel: "Campeona de la Liga",
  podioSerieASub: "Las 12 IAs de interfaz, investigando como una persona.",
  podioHumanoLabel: "Campeón humano",
  podioHumanoSub: "Superó a 121 de las 124 IAs de toda la polla.",
  pts: "pts",
  exatosAbrev: "exactos",

  finalKicker: "La Final",
  finalTitulo: "Nadie lo vio venir",
  finalConsensoTexto:
    "El consenso de las IAs marcó 1-1 — el consenso más fuerte de toda la eliminatoria, 41 de 62 votos. Terminó 1-0 España.",
  finalCravaramTitulo: (n) => `${n} IAs acertaron el 1-0 exacto`,
  finalMaisOutras: (n) => `+ ${n} más`,

  fimKicker: "Esto fue",
  fimTitulo1: "la Polla",
  fimTitulo2: "de las IAs",
  fimSub:
    "124 modelos, 104 partidos, miles de pronósticos — y el fútbol, como siempre, tuvo la última palabra. Explora el resto del sitio.",
  ctaRanking: "🏆 Ranking completo",
  ctaJogos: "⚽ Todos los partidos",
  ctaAnalise: "📊 Análisis completo",
  instagramLabel: "Síguenos en @arena.das.ias",
};

const FR: RetroDict = {
  scrollHint: "défiler pour commencer",
  share: "Partager",
  shareCopied: "Lien copié !",
  voltarHome: "Retour à l'accueil",

  capaKicker: "Coupe du Monde 2026 · La Cagnotte des IA",
  capaTitulo1: "La rétrospective",
  capaTitulo2: "finale",
  statDias: "jours de Coupe",
  statJogos: "matches joués",
  statIas: "IA dans le tournoi",
  statPalpites: "pronostics enregistrés",

  expKicker: "L'expérience",
  expTitulo: "124 cerveaux, une seule cagnotte",
  expApiTitulo: "IA par API",
  expApiDesc:
    "La plupart ont tourné directement via l'API des fournisseurs — GPT, Claude, Gemini, Grok, DeepSeek, Mistral, Qwen et des dizaines d'autres. Même prompt, mêmes 104 matches, sans exception.",
  expWebTitulo: "IA par le Web",
  expWebDesc:
    "Onze modèles grand public — la Ligue — ont pronostiqué comme un humain : navigateur ouvert, recherche d'actualités, de blessures et de forme avant de fixer le score.",
  expHumTitulo: "Humains",
  expHumDesc:
    "De vraies personnes sont entrées dans le même classement, répondant au même barème classique de cagnotte. Sans avantage. Sans handicap.",

  gruposKicker: "La phase de groupes",
  gruposTitulo: "72 matches pour se mettre en jambes",
  gruposJogos: "matches joués",
  gruposGols: "buts inscrits",
  gruposMedia: "buts par match",
  gruposFoot: "Une phase de groupes animée — et les IA ont tenté de deviner chaque score.",
  gruposPrevisivelLabel: "Le plus prévisible",
  gruposZebraLabel: "La surprise de la phase",
  votos: "voix",
  consensoAbrev: "consensus",

  zebrasKicker: "Quand le scénario a basculé",
  zebrasTitulo: "La surprise est éternelle",
  brasilKicker: "La plus grosse déception",
  brasilCristalDizia: "🔮 La Boule de Cristal (le consensus des IA) disait :",
  brasilCampeao: "championne",
  brasilTexto:
    "Le consensus des IA misait sur le Brésil comme champion du monde. La Seleção n'a même pas passé les huitièmes.",
  semiKicker: "Aveuglement collectif",
  semiTitulo: "Personne n'a vu venir la championne",
  semiTexto: (n, total) =>
    `Sur ${total} IA, ${n} ont prédit une victoire espagnole dans cette demi-finale. Le consensus annonçait un nul. La future championne du monde a été écartée à l'unanimité.`,
  terceiroKicker: "Festival de buts, zéro score exact",
  terceiroTitulo: "10 buts. Personne n'a trouvé.",
  terceiroTexto: (n, total, gols) =>
    `${gols} buts lors de la petite finale et aucune des ${total} IA n'a trouvé le score exact. Seulement ${n} ont même parié sur une victoire anglaise.`,
  maisZebrasTitulo: "D'autres surprises qui ont pris le consensus à contre-pied",

  cravadasKicker: "Les scores exacts",
  cravadasTitulo: "Trouver le score exact, c'est une autre histoire",
  cravadasSub:
    "Deviner le vainqueur, c'est un métier. Trouver le score exact, match après match, c'est un autre niveau — seule une douzaine d'IA a dépassé 20 scores exacts sur 104 matches.",
  cravadasLabel: "scores exacts",
  impressionanteKicker: "Le score exact le plus osé",
  impressionanteTexto: (n, total) =>
    `Sur ${total} IA, seules ${n} ont trouvé ce score à 5 buts. La plupart n'étaient même pas proches.`,

  humanosKicker: "Humains × Machines",
  humanosTitulo: "Un humain au milieu d'une mer de robots",
  humanosNome: "Gabriel",
  humanosSub: (ias, total) =>
    `${ias} des ${total} IA de la cagnotte. Gabriel a terminé devant chacune d'entre elles.`,
  humanosCaption: "Seuls les 2 co-champions et une IA de plus (o4-mini) ont battu Gabriel sur tout le tournoi.",
  humanosPontos: "points",
  humanosExatos: "scores exacts",

  corridaKicker: "La course",
  corridaTitulo: "Replay : rebondissement après rebondissement",
  corridaSub:
    "Le score réel cumulé, match après match, du coup d'envoi au coup de sifflet final. Filtrez par phase et choisissez qui suivre.",

  podioKicker: "Le podium final",
  podioTitulo: "Trois champions, une Coupe du Monde",
  podioGeralLabel: "Championnes générales (124 IA)",
  podioGeralSub: "Égalité au sommet — les deux ont atteint exactement 636 points.",
  podioSerieALabel: "Championne de la Ligue",
  podioSerieASub: "Les 12 IA grand public, qui enquêtent comme une personne.",
  podioHumanoLabel: "Champion humain",
  podioHumanoSub: "A battu 121 des 124 IA de toute la cagnotte.",
  pts: "pts",
  exatosAbrev: "exacts",

  finalKicker: "La Finale",
  finalTitulo: "Personne ne l'a vu venir",
  finalConsensoTexto:
    "Le consensus des IA annonçait 1-1 — le plus fort consensus de toute la phase éliminatoire, 41 voix sur 62. Score final : 1-0 Espagne.",
  finalCravaramTitulo: (n) => `${n} IA ont trouvé le score exact 1-0`,
  finalMaisOutras: (n) => `+ ${n} autres`,

  fimKicker: "Voilà",
  fimTitulo1: "la Cagnotte",
  fimTitulo2: "des IA",
  fimSub:
    "124 modèles, 104 matches, des milliers de pronostics — et le football, comme toujours, a eu le dernier mot. Explorez le reste du site.",
  ctaRanking: "🏆 Classement complet",
  ctaJogos: "⚽ Tous les matches",
  ctaAnalise: "📊 Analyse complète",
  instagramLabel: "Suivez @arena.das.ias",
};

export const DICTS: Record<Locale, RetroDict> = { pt: PT, en: EN, es: ES, fr: FR };

export function tr(locale: Locale): RetroDict {
  return DICTS[locale] ?? DICTS.pt;
}
