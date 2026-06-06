O que estou querendo fazer é um sistema de bolao que vai servir para algumas coisas:

- QUAL IA VAI GANHAR?
  - serve para satisfazer a curiosidade das pessoas. As pessoas nas redes sociais vao acompanhar qual IA vai ganhar o bolao da copa. É o uso inicial, a v1 que temos que fazer
- DICAS DDA IA (APROVEITE OS PALPITES)
  - apresentacao dos palpites de cada IA, para as pessoas poderem usar na hora de fazer seus proprios palpites. Tem uma interacao um pouco mais sofisticada, e é a v3 que temos pra fazer
- BOLA DE CRISTAL
  - usa as previsoes de todas as IAs para dar um palpite unico, unificando a visao de todas. É a v2 que temos para fazer
- CRIE O SEU BOLAO
  - crie seu proprio bolao, gratuitamente. É um novo site, que será um clone do que já existe, mas de forma gratuita. É a v4 que temos para fazer

O sistema segue o seguinte:

- inicialmente, já temos criamos
  - a tabela com todos os jogos (ao menos os da fase 1)
  - um prompt unico para passar para cada IA
    - versao interface web: dizendo para acessar internet
    - versao api: sem mencao a acesso a internet
  - uma base de dados unificada para passarmos para cada IA
- ai podemos fazer 2 coisas:
  - Bolao das principais. Palpites que vamos pegar das IAs principais, e mandar o prompt unico pedindo para ela pensar na sua melhor estrategia, navegar a vontade na internet para buscar informacoes necessarias, e dar seus palpites. Sao cerca de 15 IAs, e ai tem trabalho manual a fazer
  - Bolao de todas. Palpites que vamos pegar de todas as IAs que conseguirmos a partir do OpenRouter. Para elas vamos passar a base de dados unificada + prompt unico. Sao mais de 100, e aqui deve ser exaustivo mesmo
- Algumas duvidas ainda:
  - Todos os palpites viram simples tabelas. Precisa confirmar que todas as IAs conseguem gerar uma tabela, como arquivo md, ou csv, ou algo parecido
  - Tem que confirmar tambem se eles vao dar todos os palpites de uma vez, ou se faremos uma chamada / prompt por jogo, o que vai aumentar custos

Quanto ao site que iremos criar (Bolao das IAs?)

- precisa ter uma interface para editar cada jogo
  - incluindo a opcao, jogo a jogo, de pedir qual o palpite de cada ia para ele, inclusive qual a bola de cristal
- precisa ter um modo batch de simplesmente IMPORTAR todos os palpites
  - seja de uma ia especifica, seja da bola de cristal
  - e depois disso, sim, editar o que quiser
- precisa ter um modo de registro de quem é cada usuario, para ele poder voltar, e editar informacoes. O ideal seria um cadastro OAUTH com google, ou email. Mas google vai pedir autorizacao para fazer, entao precisa de um modo rapido, que possa ser feito de forma simples. Tipo email e senha
- precisa ter um modo de criar o bolao em si (qual o grupo, de quais pessoas, de forma que crie um link especifico, que sera distribuido pras outras pessoas que vao entrar no bolao)
- é bom ter tambem um ranking geral. Cada usuario podera dizer se quer ou nao entrar no bolao geral, que vai incluir
  - todas as IAs por interface
  - todas as IAs por API
  - a bola de cristal
  - todos os usuarios que aceitarem

Quanto a divulgacao

- tudo isso é uma bela peça de promocao
- vira conteudo em instagram, tiktok, whatsapp
  - deve gerar cards, msgs whatsapp
  - todo link (resultado, bolao para entrar) deve ser compartilhavel

- inicialmente, uma chamada:
  - quem sabe mais?
  - aproveite os palpites
- depois:
  - dica da IA para cada jogo (claude, chatgpt, gemini) antes da partida
  - quem acertou e quem errou
  - como esta a corrida
  - e todo o tipo de impulsionamento possivel
- canais:
  - mandar isso pra geral. Jornais, canais especializados, etc

Sobre o site / sistema

- cadastro de quem sao as pessoas
- entender como eles vao preencher seu instagram, whatsapp, etc
- sistema de doacao (stripe?)
- usar o claude design para fazer um design moderno
- explicar o sistema todo
  - como funcionam as ias
  - nao pega informacao de BETs! Nao é patrocinado por BETs.
  - é gratuito, mas doaçoes sao bem vindas para financiar melhorar o sistema
  - quais as regras do bolao
  - atualizacao das informacoes so em momentos chave
  - projeto em andamento, pode dar erro, faça seu backup, nao confie!
- idealmente usar github do farol@cin.ufpe.br
