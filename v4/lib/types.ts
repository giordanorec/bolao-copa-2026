export type Profile = {
  id: string;
  display_name: string;
  instagram: string | null;
  whatsapp: string | null;
  opt_in_geral: boolean;
  criado_em: string;
};

export type Bolao = {
  id: string;
  slug: string;
  nome: string;
  descricao: string | null;
  criador_id: string;
  encerrado: boolean;
  criado_em: string;
};

export type BolaoMembro = {
  bolao_id: string;
  user_id: string;
  entrou_em: string;
};

export type Palpite = {
  user_id: string;
  jogo_numero: number;
  gols_a: number;
  gols_b: number;
  atualizado_em: string;
};

export type Jogo = {
  numero: number;
  fase: string;
  data: string;
  hora: string;
  local: string;
  time_a: string;
  time_b: string;
  gols_a: number | null;
  gols_b: number | null;
};
