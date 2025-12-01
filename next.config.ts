import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // Disable static pre-rendering for dashboard pages
  output: 'export',
  // Disable static optimization for dashboard pages
  staticPageGenerationTimeout: 1000,
};

export default nextConfig;
