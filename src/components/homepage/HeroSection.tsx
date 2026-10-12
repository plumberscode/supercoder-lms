import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import HeroVisual from "./HeroVisual";

const schoolLogos = [
  {
    src: "/images/partner-islamic-global.webp",
    alt: "Partner Sekolah Islamic Global School Balikpapan",
    width: 208,
    height: 100,
  },
  {
    src: "/images/partner-aisba.webp",
    alt: "Partner Sekolah Al-Azhar Syifa Budi Balikpapan AISBA",
    width: 100,
    height: 100,
  },
  {
    src: "/images/logo-SMP-KPS-gray.webp",
    alt: "Partner Sekolah SMP Nasional KPS Balikpapan",
    width: 599,
    height: 149,
  },
  {
    src: "/images/partner-sma3.webp",
    alt: "Partner Sekolah SMA Negeri 3 Balikpapan",
    width: 100,
    height: 100,
  },
  {
    src: "/images/partner-sd-cahaya-ilmu.webp",
    alt: "Partner Sekolah SD Cahaya Ilmu Balikpapan",
    width: 154,
    height: 100,
  },
];

export default function HeroSection() {
  return (
    <section
      className="relative overflow-hidden pt-32 sm:pt-36 lg:pt-[112px] xl:pt-[92px] pb-20 px-5 bg-gradient-to-b from-white via-slate-50/50 to-slate-50"
    >
      {/* Neutral ambient background glows */}
      <div
        className="absolute top-0 left-10 w-[500px] h-[350px] pointer-events-none -translate-x-1/4 -translate-y-1/2"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(241,245,249,0.8), transparent 70%)",
        }}
      />
      <div
        className="absolute top-20 right-0 w-[450px] h-[350px] pointer-events-none translate-x-1/4"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(255,247,237,0.3), transparent 70%)",
        }}
      />

      {/* Main Hero Container */}
      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-12 pt-4 pb-14 lg:pb-10 relative z-10">
        {/* Left Content */}
        <div className="w-full lg:w-[48%] flex flex-col items-start text-left">
          {/* Eyebrow berada di dalam H1 agar keyword lokal masuk ke heading utama */}
          <h1 style={{ animationDelay: "0ms" }} className="hero-elem font-poppins text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.15] mb-5">
            <span className="flex items-center gap-2 mb-6 text-xs font-bold text-slate-500 uppercase tracking-widest leading-normal">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              Kursus Coding &amp; AI Balikpapan
            </span>
            Belajar Membangun{" "}
            <span className="bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
              Aplikasi Web
            </span>
          </h1>

          <p style={{ animationDelay: "60ms" }} className="hero-elem font-sans text-base sm:text-lg lg:text-xl text-slate-600 leading-relaxed mb-4 max-w-lg">
            Kuasai coding fundamentals dan manfaatkan AI untuk mengubah ide
            menjadi website, aplikasi, dan project digital nyata.
          </p>

          <p style={{ animationDelay: "120ms" }} className="hero-elem font-sans text-base sm:text-lg font-medium text-slate-700 mb-8 max-w-lg">
            Bukan sekadar menghafal sintaks atau meminta AI membuatkan sesuatu —
            kamu belajar memahami teknologi, melatih logika, dan membangun
            secara mandiri.
          </p>

          {/* Action Buttons */}
          <div style={{ animationDelay: "180ms" }} className="hero-elem flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 sm:gap-4 w-full sm:w-auto">
            <Button
              asChild
              size="lg"
              className="w-full sm:w-auto h-auto py-3.5 px-7 sm:px-8 rounded-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-poppins font-semibold text-sm sm:text-base shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/35 transition-all duration-200 hover:-translate-y-0.5"
            >
              <a
                href="https://wa.me/62816331126"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2.5 !py-3.5 !px-6 sm:!px-8 text-white no-underline"
              >
                <Image
                  src="/images/whatsapp.svg"
                  alt="WhatsApp"
                  width={22}
                  height={22}
                  className="w-5 h-5 shrink-0"
                />
                <span className="text-white font-semibold">Konsultasi</span>
              </a>
            </Button>

            <Button
              asChild
              size="lg"
              className="w-full sm:w-auto h-auto py-3.5 px-7 sm:px-8 rounded-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-poppins font-semibold text-sm sm:text-base shadow-lg shadow-red-500/25 hover:shadow-xl hover:shadow-red-500/35 transition-all duration-200 hover:-translate-y-0.5"
            >
              <Link
                href="/daftar"
                className="inline-flex items-center justify-center !py-3.5 !px-6 sm:!px-8 text-white no-underline"
              >
                <span className="text-white font-semibold">Daftar</span>
              </Link>
            </Button>
          </div>
        </div>

        {/* Right Hero Visual: foto siswa + arch + kartu prestasi */}
        <div className="w-full lg:w-[48%] flex justify-center lg:justify-start">
          <HeroVisual />
        </div>
      </div>

      {/* School Logos Section on Seamless Light Background */}
      <div className="max-w-6xl mx-auto mt-6 pt-10 border-t border-slate-200/80 relative z-10">
        <p className="font-sans text-slate-600 text-base font-semibold mb-8 text-center tracking-wide">
          Siswa-siswa dari sekolah ini, sudah mulai memahami teknologi dan
          membangun bersama Super Coder:
        </p>
        <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12">
          {schoolLogos.map((logo) => (
            <div
              key={logo.src}
              className="school-logo-item flex items-center justify-center hover:scale-105"
            >
              <Image
                src={logo.src}
                alt={logo.alt}
                width={logo.width}
                height={logo.height}
                sizes="(min-width: 640px) 160px, 120px"
                className="h-[46px] w-auto"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
