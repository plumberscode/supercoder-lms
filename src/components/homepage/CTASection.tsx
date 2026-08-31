"use client";

import { useRef } from "react";
import Image from "next/image";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

export default function CTASection() {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap.fromTo(
        ".cta-card",
        { y: 24, opacity: 0, scale: 0.97 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.6,
          ease: "power3.out",
          clearProps: "transform,opacity",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 85%",
            once: true,
          },
        },
      );
    },
    { scope: sectionRef },
  );

  return (
    <section
      ref={sectionRef}
      className="py-20 sm:py-24 px-5 bg-white relative overflow-hidden"
    >
      <div className="max-w-6xl mx-auto">
        <div className="cta-card relative rounded-3xl sm:rounded-[36px] bg-gradient-to-r from-orange-500 via-red-500 to-rose-600 p-8 sm:p-14 lg:p-16 text-center text-white shadow-2xl shadow-red-500/25 overflow-hidden">
          {/* Ambient background decoration */}
          <div
            className="absolute top-0 right-0 w-80 h-80 pointer-events-none translate-x-1/3 -translate-y-1/3"
            style={{
              backgroundImage:
                "radial-gradient(circle, rgba(255,255,255,0.1), transparent 70%)",
            }}
          />
          <div
            className="absolute bottom-0 left-0 w-80 h-80 pointer-events-none -translate-x-1/3 translate-y-1/3"
            style={{
              backgroundImage:
                "radial-gradient(circle, rgba(0,0,0,0.1), transparent 70%)",
            }}
          />

          <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center">
            <Badge className="mb-6 px-4 py-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-md font-bold text-xs tracking-wider shadow-xs">
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              KONSULTASI GRATIS
            </Badge>

            <h2 className="font-poppins text-2xl sm:text-4xl lg:text-5xl font-black text-white leading-tight mb-6">
              Jangan Hanya Menjadi Pengguna Teknologi. Mulai Bangun Aplikasimu.
            </h2>

            <p className="font-sans text-base sm:text-lg text-white/90 leading-relaxed max-w-2xl mb-10">
              AI membuka kesempatan tanpa batas bagi siapa saja yang memiliki
              ide. Bekali dirimu dengan coding fundamentals yang kuat dan
              workflow modern untuk mengubah ide menjadi produk digital nyata.
              Lebih dari sekadar belajar coding, ini adalah perjalanan untuk
              menjadi Digital Builder yang mampu memahami, membuat, dan memimpin
              masa depan.
            </p>

            <Button
              asChild
              size="lg"
              className="w-full sm:w-auto h-auto py-3 px-6 sm:px-7 rounded-full bg-white hover:bg-slate-50 text-red-600 font-poppins font-semibold text-xs sm:text-sm shadow-xl shadow-black/15 hover:shadow-2xl hover:scale-105 transition-all duration-200"
            >
              <a
                href="https://wa.me/6287788931919"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 sm:gap-2.5 text-red-600 no-underline text-center"
              >
                <Image
                  src="/images/whatsapp.svg"
                  alt="WhatsApp"
                  width={20}
                  height={20}
                  className="w-4 h-4 sm:w-4.5 sm:h-4.5 shrink-0"
                />
                <span>Konsultasi Sekarang via WhatsApp</span>
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
