import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  env: {
    TZ: 'America/Los_Angeles', // Ensure PST timezone for server-side rendering
  },
  serverExternalPackages: [], // Updated from experimental.serverComponentsExternalPackages
};

export default nextConfig;
