import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@redtaxi/shared"],
  // Phase 2: add headers() for CSP baseline (SC-D2)
};

export default nextConfig;
