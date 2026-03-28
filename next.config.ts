import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      // Proxy /photos/* through the dynamic API so images appear immediately
      // after upload without waiting for a Vercel redeploy
      { source: "/photos/:path*", destination: "/api/photos/:path*" },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "streetviewpixels-pa.googleapis.com",
      },
    ],
  },
};

export default nextConfig;
