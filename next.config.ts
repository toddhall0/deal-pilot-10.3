import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Limit workers to prevent resource exhaustion on Railway
    cpus: 1,
  },
  // Disable static page generation at build time
  output: "standalone",
  // Externalize pdf packages to avoid canvas dependency issues during build
  serverExternalPackages: ["pdf-parse", "pdfjs-dist"],
};

export default nextConfig;
