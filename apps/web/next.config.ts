import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Phase 2: add transpilePackages: ["@redtaxi/shared"] when shared code is imported
  // Phase 2: add headers() for CSP baseline (SC-D2)
};

export default nextConfig;
