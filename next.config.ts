import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/docs",
        destination: "https://co-b18e5043552e498e9626d4b28fa82be8.ecs.us-east-1.on.aws/docs",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
