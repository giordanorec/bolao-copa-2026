import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      { source: "/ias", destination: "/ranking-ias", permanent: true },
      { source: "/serie-a", destination: "/ranking-ias", permanent: true },
    ];
  },
};

export default config;
