import { type NextRequest } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";

export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  /*
   * Hanya route yang memakai sesi Supabase. Halaman publik (/, /blog,
   * /kursus-coding-balikpapan, /kursus-komputer-balikpapan, sitemap, robots) sengaja tidak masuk agar
   * dilayani langsung dari cache tanpa menunggu refresh sesi (TTFB lebih cepat).
   * Tambahkan di sini jika ada route baru yang membaca sesi login.
   */
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/lessons/:path*",
    "/subjects/:path*",
    "/leaderboard/:path*",
    "/rapor/:path*",
    "/login/:path*",
    "/minas/:path*",
    "/signup/:path*",
    "/auth/:path*",
    "/pending-approval/:path*",
    "/akun-nonaktif/:path*",
    "/daftar/:path*",
    "/api/:path*",
  ],
};
