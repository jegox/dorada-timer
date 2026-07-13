import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3", "@prisma/adapter-better-sqlite3", "@prisma/client"],
  turbopack: {
    root: path.resolve(__dirname),
  },
  allowedDevOrigins: ["192.168.40.91"],
};

export default nextConfig;
