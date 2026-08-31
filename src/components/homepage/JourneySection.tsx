"use client";

import { useRef } from "react";
import Image from "next/image";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Sparkles } from "lucide-react";

const levels = [
  {
    level: "LEVEL 01",
    badgeText: "Understand the Web",
    badgeStyle: "bg-emerald-500 text-white",
    title: "Super Coder Junior",
    image: "/images/supercoder-junior.webp",
    desc: "Membangun fondasi. Siswa memahami bagaimana web bekerja serta menyusun struktur dan tampilan visual yang presisi di semua perangkat (Responsive Design).",
    list: [
      "Dasar Semantik HTML5 & CSS3",
      "Layouting Responsive Container & Images",
      "Tipografi Web & Google Fonts",
      "Modern Flexbox & CSS Grid System",
      "Media Queries untuk Tampilan Mobile",
      "Responsive Navigation Bar",
      "Perkenalan Google Antigravity",
    ],
  },
  {
    level: "LEVEL 02",
    badgeText: "Understand the Logic",
    badgeStyle: "bg-blue-600 text-white",
    title: "Super Coder Builder",
    image: "/images/supercoder-builder.webp",
    desc: "Menghidupkan logika pemrograman dengan JavaScript dan mulai memanfaatkan AI secara terarah untuk eksplorasi konsep, pemecahan masalah, dan debugging.",
    list: [
      "CSS Transitions & Custom Variables",
      "JavaScript Fundamentals & Data Types",
      "Logika Kondisional (If-Else)",
      "Functions, Scope & Events",
      "Struktur Data Arrays & Objects",
      "AI-Assisted Debugging & Logic Solving",
      "Interactive Web Apps Projects",
    ],
  },
  {
    level: "LEVEL 03",
    badgeText: "Build with AI",
    badgeStyle: "bg-gradient-to-r from-orange-500 to-red-500 text-white",
    title: "Super Coder Elite",
    image: "/images/supercoder-elite-2026.webp",
    desc: "Puncak kurikulum hybrid. Menggabungkan coding fundamentals, problem solving, dan modern AI workflow untuk menciptakan aplikasi interaktif dan portofolio nyata.",
    list: [
      "Arsitektur Frontend Dinamis",
      "Integrasi Modern AI Workflow",
      "Next JS Framework",
      "Serverless Database",
      "Pengembangan Web Application",
      "Showcase Portofolio Project",
    ],
  },
];

export default function JourneySection() {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap.fromTo(
        ".journey-header",
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
        ".journey-card",
        { y: 24, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          stagger: 0.07,
          ease: "power3.out",
          clearProps: "transform,opacity",
          scrollTrigger: {
            trigger: ".journey-grid",
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
      className="py-24 px-5 bg-white relative overflow-hidden"
      id="journey"
    >
      {/* Ambient background decoration */}
      <div
        className="absolute top-1/3 left-0 w-96 h-96 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(241,245,249,0.7), transparent 70%)",
        }}
      />
      <div
        className="absolute bottom-10 right-0 w-96 h-96 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(255,247,237,0.5), transparent 70%)",
        }}
      />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header Title */}
        <div className="journey-header text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 mb-4">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <span className="font-poppins text-xs font-bold text-slate-500 uppercase tracking-widest">
              Learning Path
            </span>
          </div>
          <h2 className="font-poppins text-3xl sm:text-4xl font-bold text-slate-900 mb-4 leading-tight">
            Coding <span className="text-red-500">Journey</span>
          </h2>
          <p className="font-sans text-base sm:text-lg text-slate-600">
            Perjalanan bertahap dari memahami dasar web hingga membangun
            aplikasi nyata dengan bantuan AI.
          </p>
        </div>

        {/* 3 Level Cards Grid */}
        <div className="journey-grid grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-8">
          {levels.map((lvl) => (
            <Card
              key={lvl.title}
              className="journey-card group bg-white rounded-3xl border border-slate-200/80 shadow-md hover:shadow-2xl duration-300 hover:-translate-y-2 overflow-hidden flex flex-col justify-between"
              style={{ transitionProperty: "box-shadow" }}
            >
              <div>
                {/* Image Header with Level Badge */}
                <div className="relative w-full h-52 overflow-hidden bg-slate-100">
                  <Image
                    src={lvl.image}
                    alt={lvl.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 400px"
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3.5 left-3.5 z-10 flex items-center gap-2">
                    <Badge
                      className={`${lvl.badgeStyle} border-0 px-3 py-1 rounded-full text-xs font-bold shadow-md`}
                    >
                      {lvl.level}
                    </Badge>
                    <Badge className="bg-slate-900/80 backdrop-blur-md text-white border-0 px-2.5 py-1 rounded-full text-[11px] font-medium shadow-md">
                      {lvl.badgeText}
                    </Badge>
                  </div>
                </div>

                {/* Card Header */}
                <CardHeader className="p-6 pb-3">
                  <CardTitle className="font-poppins text-xl font-bold text-slate-900 group-hover:text-red-600 transition-colors">
                    {lvl.title}
                  </CardTitle>
                  <CardDescription className="font-sans text-base text-slate-600 leading-relaxed mt-2">
                    {lvl.desc}
                  </CardDescription>
                </CardHeader>

                {/* Curriculum Checklist */}
                <CardContent className="p-6 pt-2">
                  <div className="pt-4 border-t border-slate-100">
                    <p className="font-poppins text-xs font-bold text-slate-400 uppercase tracking-wider mb-3.5 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      Materi yang dipelajari:
                    </p>
                    <ul className="space-y-2.5">
                      {lvl.list.map((item) => (
                        <li key={item} className="flex items-start gap-2.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                          <span className="font-sans text-sm sm:text-base text-slate-700 font-medium leading-tight">
                            {item}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
