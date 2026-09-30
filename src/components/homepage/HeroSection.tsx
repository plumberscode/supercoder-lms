"use client";

import { useEffect, useRef } from "react";
import { preload } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const schoolLogos = [
  {
    src: "/images/logo-islamicglobalschool-dark.png",
    alt: "Partner Sekolah Islamic Global School Balikpapan",
    width: 250,
    height: 120,
  },
  {
    src: "/images/logo_aisba.png",
    alt: "Partner Sekolah Al-Azhar Syifa Budi Balikpapan AISBA",
    width: 900,
    height: 900,
  },
  {
    src: "/images/logo-SMP-KPS-gray.webp",
    alt: "Partner Sekolah SMP Nasional KPS Balikpapan",
    width: 599,
    height: 149,
  },
  {
    src: "/images/sma3balikpapan.png",
    alt: "Partner Sekolah SMA Negeri 3 Balikpapan",
    width: 120,
    height: 120,
  },
  {
    src: "/images/sd cahaya ilmu.png",
    alt: "Partner Sekolah SD Cahaya Ilmu Balikpapan",
    width: 2048,
    height: 1329,
  },
];

const HERO_POSTER = "/images/hero-video-poster.webp";
// Detik video yang paling mirip dengan poster (dicocokkan dari frame video)
const HERO_POSTER_TIME = 0.5;

export default function HeroSection() {
  const videoRef = useRef<HTMLVideoElement>(null);

  // Poster = elemen LCP di mobile: minta browser mengunduhnya lebih dulu
  preload(HERO_POSTER, { as: "image", fetchPriority: "high" });

  // Teks & video hero dianimasikan lewat CSS (.hero-elem / .hero-video-box di globals.css)
  // supaya tampil di frame pertama tanpa menunggu JS. GSAP hanya untuk logo di bawahnya.
  // Video baru diputar setelah halaman selesai load agar tidak berebut bandwidth dengan
  // JS & font. Hemat data / reduced motion: cukup poster.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    if (connection?.saveData || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let idleId: number | undefined;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    const start = () => {
      const play = () => {
        // Poster = frame di detik ~0,5: mulai dari sana agar tidak "melompat" saat video diputar
        video.currentTime = HERO_POSTER_TIME;
        video.play().catch(() => {
          // Autoplay diblokir browser: poster tetap tampil
        });
      };
      if (video.readyState >= HTMLMediaElement.HAVE_METADATA) play();
      else {
        video.addEventListener("loadedmetadata", play, { once: true });
        video.preload = "auto";
        video.load();
      }
    };
    const schedule = () => {
      if ("requestIdleCallback" in window) idleId = window.requestIdleCallback(start, { timeout: 2000 });
      else timeoutId = setTimeout(start, 200);
    };

    if (document.readyState === "complete") schedule();
    else window.addEventListener("load", schedule, { once: true });

    return () => {
      window.removeEventListener("load", schedule);
      if (idleId !== undefined) window.cancelIdleCallback(idleId);
      if (timeoutId !== undefined) clearTimeout(timeoutId);
    };
  }, []);

  return (
    <section
      className="relative overflow-hidden pt-32 sm:pt-36 pb-20 px-5 bg-gradient-to-b from-white via-slate-50/50 to-slate-50"
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
      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-12 pt-4 pb-14 relative z-10">
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

        {/* Right Hero Video */}
        <div className="w-full lg:w-[48%] flex justify-center">
          <div className="hero-video-box relative w-full max-w-lg lg:max-w-none">
            <video
              ref={videoRef}
              loop
              muted
              playsInline
              poster={HERO_POSTER}
              preload="none"
              className="w-full h-auto rounded-3xl object-cover"
            >
              <source src="/videos/hero-video.webm" type="video/webm" />
              <source src="/videos/hero-video.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
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
                sizes="200px"
                className="h-[46px] w-auto"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
