"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";
import { Badge } from "@/components/ui/badge";
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

export default function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.fromTo(
        ".hero-elem",
        { y: 20, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.65,
          stagger: 0.06,
          clearProps: "transform,opacity",
        },
      )
        .fromTo(
          ".hero-video-box",
          { scale: 0.96, opacity: 0, y: 15 },
          {
            scale: 1,
            opacity: 1,
            y: 0,
            duration: 0.7,
            ease: "power3.out",
            clearProps: "transform,opacity",
          },
          "-=0.6",
        )
        .fromTo(
          ".school-logo-item",
          { y: 12, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.55,
            stagger: 0.04,
            clearProps: "transform,opacity",
          },
          "-=0.5",
        );
    },
    { scope: sectionRef },
  );

  return (
    <section
      ref={sectionRef}
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
          <div className="hero-elem inline-flex items-center gap-2 mb-6">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <span className="font-poppins text-xs font-bold text-slate-500 uppercase tracking-widest">
              Kelas Coding dan AI di Balikpapan
            </span>
          </div>

          <h1 className="hero-elem font-poppins text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.15] mb-5">
            Belajar Membangun{" "}
            <span className="bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
              Aplikasi Web
            </span>
          </h1>

          <p className="hero-elem font-sans text-base sm:text-lg lg:text-xl text-slate-600 leading-relaxed mb-4 max-w-lg">
            Kuasai coding fundamentals dan manfaatkan AI untuk mengubah ide
            menjadi website, aplikasi, dan project digital nyata.
          </p>

          <p className="hero-elem font-sans text-base sm:text-lg font-medium text-slate-700 mb-8 max-w-lg">
            Bukan sekadar menghafal sintaks atau meminta AI membuatkan sesuatu —
            kamu belajar memahami teknologi, melatih logika, dan membangun
            secara mandiri.
          </p>

          {/* Action Buttons */}
          <div className="hero-elem flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 sm:gap-4 w-full sm:w-auto">
            <Button
              asChild
              size="lg"
              className="w-full sm:w-auto h-auto py-3.5 px-7 sm:px-8 rounded-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-poppins font-semibold text-sm sm:text-base shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/35 transition-all duration-200 hover:-translate-y-0.5"
            >
              <a
                href="https://wa.me/6287788931919"
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
              autoPlay
              loop
              muted
              playsInline
              poster="/images/hero-video-poster.webp"
              preload="auto"
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
                sizes="(max-width: 640px) 50vw, 220px"
                className="h-[46px] w-auto"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
