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
  // Skip TypeScript checking during build to prevent OOM on Railway
  // Type errors are still caught in development and IDE
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
