import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,
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
