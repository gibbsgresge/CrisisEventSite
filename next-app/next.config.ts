import type { NextConfig } from "next";

const nextConfig: NextConfig = {
 //for docker file to build
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },

  // your other config options...
};

export default nextConfig;
