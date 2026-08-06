import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/giris",
        destination: "/login",
        permanent: true,
      },
      {
        source: "/calisma-alani",
        destination: "/workspace",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
