"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot, BrainCircuit, Rocket } from "lucide-react";

export default function ManifestoSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap.fromTo(
        ".manifesto-card",
        { y: 24, opacity: 0 },
        {
          y: 0,
          opacity: 1,
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

      gsap.fromTo(
        ".manifesto-point",
        { y: 18, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          stagger: 0.06,
          ease: "power3.out",
          clearProps: "transform,opacity",
          scrollTrigger: {
            trigger: ".manifesto-grid",
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
      className="bg-slate-50/80 py-24 sm:py-32 lg:py-36 px-5 relative overflow-hidden"
    >
      {/* Ambient background blur */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[450px] pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(255,237,213,0.25), transparent 70%)",
        }}
      />

      <div className="max-w-6xl mx-auto relative z-10">
        <Card className="manifesto-card bg-white rounded-3xl border border-slate-200/80 shadow-xl shadow-slate-900/5 overflow-hidden p-6 sm:p-10 lg:p-14">
          <CardContent className="p-0 flex flex-col items-center">
            {/* Badge & Title */}
            <div className="inline-flex items-center gap-2 mb-6">
              <span className="w-2 h-2 rounded-full bg-orange-500" />
              <span className="font-poppins text-xs font-bold text-slate-500 uppercase tracking-widest">
                Mengapa Supercoder?
              </span>
            </div>

            <h2 className="font-poppins text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 text-center leading-snug mb-10 sm:mb-12 max-w-3xl">
              Dunia Berubah Cepat.{" "}
              <span className="bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
                Skill Biasa
              </span>{" "}
              Tidak Lagi Cukup.
            </h2>

            {/* 3 Insight Grid Cards */}
            <div className="manifesto-grid grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 w-full">
              {/* Point 1 */}
              <div
                className="manifesto-point px-0 py-6 sm:p-7 rounded-2xl bg-slate-50/70 border border-slate-100 flex flex-col gap-4 hover:border-slate-200 hover:bg-slate-50"
                style={{ transitionProperty: "border-color, background-color" }}
              >
                <div className="w-11 h-11 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                  <Bot className="w-5 h-5" />
                </div>
                <h3 className="font-poppins font-bold text-slate-900 text-base">
                  AI Memberikan Kecepatan
                </h3>
                <p className="font-sans text-base text-slate-600 leading-relaxed">
                  Hari ini, siapa saja bisa meminta AI membuat kode. Namun{" "}
                  <span className="text-orange-600 font-semibold">
                    membuat sesuatu
                  </span>{" "}
                  dan{" "}
                  <span className="text-red-600 font-semibold">
                    memahami apa yang dibangun
                  </span>{" "}
                  adalah dua hal yang sangat berbeda.
                </p>
              </div>

              {/* Point 2 */}
              <div
                className="manifesto-point px-0 py-6 sm:p-7 rounded-2xl bg-slate-50/70 border border-slate-100 flex flex-col gap-4 hover:border-slate-200 hover:bg-slate-50"
                style={{ transitionProperty: "border-color, background-color" }}
              >
                <div className="w-11 h-11 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                  <BrainCircuit className="w-5 h-5" />
                </div>
                <h3 className="font-poppins font-bold text-slate-900 text-base">
                  Fundamental Memberikan Kendali
                </h3>
                <p className="font-sans text-base text-slate-600 leading-relaxed">
                  Tanpa fundamental yang kuat, kita mudah bingung saat terjadi
                  error. Pemahaman logika memberimu{" "}
                  <span className="text-red-600 font-semibold">
                    kendali penuh
                  </span>{" "}
                  atas apa yang kamu ciptakan.
                </p>
              </div>

              {/* Point 3 */}
              <div
                className="manifesto-point px-0 py-6 sm:p-7 rounded-2xl bg-slate-50/70 border border-slate-100 flex flex-col gap-4 hover:border-slate-200 hover:bg-slate-50"
                style={{ transitionProperty: "border-color, background-color" }}
              >
                <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                  <Rocket className="w-5 h-5" />
                </div>
                <h3 className="font-poppins font-bold text-slate-900 text-base">
                  Menjadi Digital Builder
                </h3>
                <p className="font-sans text-base text-slate-600 leading-relaxed">
                  <span className="text-orange-500 font-semibold">
                    SuperCoder
                  </span>{" "}
                  menggabungkan keduanya: melatih siswa SMP, SMA, dan pemula
                  memahami coding mendalam dan memanfaatkan AI secara strategis
                  untuk membangun project nyata.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
