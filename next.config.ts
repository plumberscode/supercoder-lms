import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Gambar artikel blog di-hosting di Cloudinary
    remotePatterns: [{ protocol: "https", hostname: "res.cloudinary.com" }],
    // + 512: foto hero mobile tampil ~500px (288px × DPR 1,75); tanpa ini terpilih 640w
    imageSizes: [32, 48, 64, 96, 128, 256, 384, 512],
  },
  // URL .html dari versi situs lama yang masih ada di indeks Google (data GSC).
  // Redirect permanen agar pengunjung tidak mendarat di 404 dan Google memindahkan sinyalnya.
  async redirects() {
    return [
      { source: "/dashboard.html", destination: "/login", permanent: true },
      { source: "/pendaftaran.html", destination: "/daftar", permanent: true },
      { source: "/bootcamp.html", destination: "/", permanent: true },
    ];
  },
  experimental: {
    serverActions: {
      // Upload gambar blog lewat server action (maks 4MB per file)
      bodySizeLimit: "5mb",
    },
  },
};

export default nextConfig;
