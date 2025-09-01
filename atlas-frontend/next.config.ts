import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // proxy setup for the backend
  async rewrites() {
      return [
        {
          source: "/flask-api/:path*",
          destination: "http://127.0.0.1:5000/:path*"
        },
      ];
  },
};

export default nextConfig;
