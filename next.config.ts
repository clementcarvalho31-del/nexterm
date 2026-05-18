import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  serverExternalPackages: ["fastify", "@fastify/websocket", "@fastify/cors"],
};

export default nextConfig;