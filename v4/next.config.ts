import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,
  // Páginas que leem JSON de public/ via fs fazem o Next rastrear a pasta
  // public/ inteira pra dentro das funções serverless. As imagens dos posts
  // de IG (servidas do Supabase) estouravam o limite de 250MB. Excluí do trace.
  outputFileTracingExcludes: {
    "*": ["public/ig-posts/**"],
  },
  experimental: {
    // Prints de Pix (foto de celular) passam fácil do default de 1MB.
    serverActions: { bodySizeLimit: "10mb" },
  },
  async redirects() {
    return [
      { source: "/ias", destination: "/ranking-ias", permanent: true },
      { source: "/serie-a", destination: "/ranking-ias", permanent: true },
      { source: "/doar", destination: "/colaborar", permanent: true },
    ];
  },
};

export default config;
