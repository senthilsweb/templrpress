import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: process.env.NODE_ENV === "development" ? undefined : "export",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  // Dev proxy: forward /api/* requests to Go backend
  // Port 5000 = Docker (opt/templrgo); 9898 = local Go binary
  async rewrites() {
    const backendPort = process.env.NEXT_PUBLIC_API_PORT ?? "5000";
    const base = `http://localhost:${backendPort}`;
    return [
      { source: "/api/:path*",    destination: `${base}/api/:path*` },
      { source: "/static/:path*", destination: `${base}/static/:path*` },
    ];
  },
};

export default nextConfig;
