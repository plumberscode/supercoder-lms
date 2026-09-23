import Link from "next/link";

export default function BlogNotFound() {
  return (
    <div className="max-w-2xl mx-auto px-5 py-24 text-center">
      <p className="text-sm font-bold uppercase tracking-wider text-red-600 mb-3">404</p>
      <h1 className="font-poppins font-extrabold text-3xl text-slate-900 mb-4">
        Artikel tidak ditemukan
      </h1>
      <p className="text-slate-600 mb-8">
        Artikel yang kamu cari mungkin sudah dipindahkan atau belum diterbitkan.
      </p>
      <Link
        href="/blog"
        className="inline-flex rounded-full px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold text-sm transition-colors"
      >
        Lihat semua artikel
      </Link>
    </div>
  );
}
