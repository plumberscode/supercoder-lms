import Link from "next/link";
import { Sparkles } from "lucide-react";

/** Ajakan konversi di akhir setiap artikel. */
export default function ArticleCTA() {
  return (
    <aside className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-red-950 text-white p-7 sm:p-9 relative overflow-hidden">
      <div aria-hidden className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-red-500/30 blur-3xl" />
      <p className="relative inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-orange-300 mb-3">
        <Sparkles className="w-3.5 h-3.5" aria-hidden />
        Kelas Coding &amp; AI Supercoder
      </p>
      <p className="relative font-poppins font-bold text-xl sm:text-2xl leading-snug mb-2">
        Siap mengubah ide menjadi aplikasi nyata?
      </p>
      <p className="relative text-slate-300 text-sm sm:text-base mb-6 max-w-xl">
        Belajar coding fundamentals dan AI workflow bersama mentor, dari nol sampai
        punya portofolio project sendiri.
      </p>
      <div className="relative flex flex-wrap gap-3">
        <Link
          href="/daftar"
          className="inline-flex items-center rounded-full px-5 py-2.5 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 font-poppins font-semibold text-sm shadow-lg shadow-red-500/30 transition-colors"
        >
          Daftar Kelas Sekarang
        </Link>
        <Link
          href="/#program"
          className="inline-flex items-center rounded-full px-5 py-2.5 border border-white/20 hover:bg-white/10 font-poppins font-semibold text-sm transition-colors"
        >
          Lihat Program
        </Link>
      </div>
    </aside>
  );
}
