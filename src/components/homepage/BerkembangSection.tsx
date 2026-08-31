"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Gamepad2, Zap, FolderGit2, Rocket } from "lucide-react";

const boxes = [
  {
    icon: Gamepad2,
    iconColor: "bg-rose-100 text-rose-600",
    title: "FUN",
    text: "Belajar konsep teknologi dan coding dengan cara yang seru, praktis, dan mudah dipahami.",
  },
  {
    icon: Zap,
    iconColor: "bg-amber-100 text-amber-600",
    title: "AI-POWERED",
    text: "Menggunakan AI sebagai partner untuk eksplorasi ide, debugging, dan percepatan bangun project digital.",
  },
  {
    icon: FolderGit2,
    iconColor: "bg-blue-100 text-blue-600",
    title: "PROJECT BASED",
    text: "Setiap konsep langsung dipraktikkan untuk membuat website dan aplikasi nyata.",
  },
  {
    icon: Rocket,
    iconColor: "bg-purple-100 text-purple-600",
    title: "FUTURE READY",
    text: "Kombinasi fundamental kuat dan workflow modern yang relevan dengan masa depan digital.",
  },
];

export default function BerkembangSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap.fromTo(
        ".value-header",
        { y: 20, opacity: 0 },
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
        ".value-card",
        { y: 24, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          stagger: 0.06,
          ease: "power3.out",
          clearProps: "transform,opacity",
          scrollTrigger: {
            trigger: ".value-grid",
            start: "top 85%",
            once: true,
          },
        },
      );

      gsap.fromTo(
        ".value-icon",
        { scale: 0.75, opacity: 0 },
        {
          scale: 1,
          opacity: 1,
          duration: 0.55,
          stagger: 0.06,
          delay: 0.15,
          ease: "back.out(1.4)",
          clearProps: "transform,opacity",
          scrollTrigger: {
            trigger: ".value-grid",
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
      className="py-28 sm:py-36 lg:py-44 px-5 bg-gradient-to-b from-white via-orange-50/25 to-slate-50 relative overflow-hidden"
    >
      {/* Soft ambient background glows */}
      <div
        className="absolute top-1/3 -left-32 w-96 h-96 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(255,237,213,0.3), transparent 70%)",
        }}
      />
      <div
        className="absolute bottom-1/3 -right-32 w-96 h-96 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(254,226,226,0.2), transparent 70%)",
        }}
      />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Title Header */}
        <div className="value-header text-center max-w-3xl mx-auto mb-16 sm:mb-20">
          <div className="inline-flex items-center gap-2 mb-5">
            <span className="w-2 h-2 rounded-full bg-orange-500" />
            <span className="font-poppins text-xs font-bold text-slate-500 uppercase tracking-widest">
              Value Kami
            </span>
          </div>
          <h2 className="font-poppins text-3xl sm:text-4xl lg:text-[42px] font-bold text-slate-900 mb-6 leading-tight tracking-tight">
            Super Coder bukan sekadar tempat{" "}
            <span className="text-red-500">belajar</span>, tapi tempat{" "}
            <span className="text-orange-500">berkembang!</span>
          </h2>
          <p className="font-sans text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
            Dunia digital membutuhkan generasi baru yang tidak hanya menjadi
            penonton, tetapi mampu berpikir, bereksperimen, dan membangun.
            SuperCoder mendampingi siswa bertransformasi dari pengguna biasa
            menjadi Digital Builder yang percaya diri menciptakan karya
            teknologi.
          </p>
        </div>

        {/* 4 Cards Grid */}
        <div className="value-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-7 lg:gap-8">
          {boxes.map((box) => {
            const Icon = box.icon;

            return (
              <Card
                key={box.title}
                className="value-card group bg-white/95 backdrop-blur-md rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-xl hover:border-orange-200 duration-300 hover:-translate-y-2 flex flex-col justify-between p-7 sm:p-8"
                style={{ transitionProperty: "box-shadow, border-color" }}
              >
                <div>
                  <CardHeader className="p-0 mb-6 flex flex-row items-center">
                    <div
                      className={`value-icon w-12 h-12 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 ${box.iconColor}`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                  </CardHeader>

                  <CardTitle className="font-poppins text-xl font-bold text-slate-900 mb-3.5 tracking-wide group-hover:text-red-600 transition-colors">
                    {box.title}
                  </CardTitle>

                  <CardContent className="p-0">
                    <p className="font-sans text-base text-slate-600 leading-relaxed">
                      {box.text}
                    </p>
                  </CardContent>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
