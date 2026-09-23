import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Gambar artikel blog di-hosting di Cloudinary
    remotePatterns: [{ protocol: "https", hostname: "res.cloudinary.com" }],
  },
  experimental: {
    serverActions: {
      // Upload gambar blog lewat server action (maks 4MB per file)
      bodySizeLimit: "5mb",
    },
  },
};

export default nextConfig;
