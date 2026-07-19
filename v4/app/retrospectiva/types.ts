// Tipos do JSON pré-computado v4/public/retrospectiva.json
// (gerado por v4/scripts/gerar_retrospectiva_dados.mjs).

export type TimeJogo = {
  numero: number;
  fase: string;
  timeA: string;
  timeB: string;
  isoA?: string;
  isoB?: string;
  golsA: number;
  golsB: number;
};

export type Upset = TimeJogo & {
  cristalA: number;
  cristalB: number;
  votos: number;
};

export type PodioItem = {
  slug: string;
  nome: string;
  pontos: number;
  exatos: number;
  posicao: number;
};

export type Humano = {
  nome: string;
  pontos: number;
  exatos: number;
  rank: number;
  iasAtras: number;
  totalIas: number;
};

export type RetrospectivaData = {
  geradoEm: string;
  overview: {
    dias: number;
    totalJogos: number;
    totalIas: number;
    totalPalpites: number;
    totalGols: number;
    mediaGolsJogo: string;
    maxTeorico: number;
  };
  grupos: {
    totalJogos: number;
    totalGols: number;
    mediaGolsJogo: string;
    jogoMaisPrevisivel: Upset | null;
    zebraDestaque: Upset | null;
  };
  zebras: {
    lista: Upset[];
    brasil: (TimeJogo & { consensoCampeao: string }) | null;
    semifinalEspanha:
      | (Upset & { totalIas: number; previramVitoriaB: number })
      | null;
    terceiroLugar:
      | (TimeJogo & {
          totalGols: number;
          totalIas: number;
          exatos: number;
          previramVitoriaB: number;
        })
      | null;
  };
  cravadas: {
    lideres: { slug: string; nome: string; exatos: number; pontos: number }[];
    maisImpressionante:
      | (TimeJogo & { totalGols: number; quemCravou: number })
      | null;
  };
  humanos: {
    gabriel: Humano;
    totalHumanos: number | null;
    top: { nome: string; pontos: number; exatos: number }[];
  };
  campeoes: {
    geral: { slug: string; nome: string; pontos: number; exatos: number }[];
    geralPodio: PodioItem[];
    serieA: PodioItem[];
    humano: Humano;
  };
  final:
    | (TimeJogo & {
        cristalA?: number;
        cristalB?: number;
        votos?: number;
        totalIas: number;
        cravaramTotal: number;
        destaques: { slug: string; nome: string }[];
      })
    | null;
  consenso: {
    acertouVencedor: number;
    totalComCristal: number;
    pctVencedor: number;
    exatos: number;
    pctExatos: number;
  };
  pctMaxCampeoes: number;
};
