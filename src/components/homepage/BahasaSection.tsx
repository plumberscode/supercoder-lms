"use client";

import { useRef } from "react";
import Image from "next/image";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Code2, Wrench } from "lucide-react";

const stackGroups = [
  {
    title: "Core Web Languages",
    icon: Code2,
    badgeColor: "border-red-200 bg-red-50 text-red-600",
    items: [
      {
        src: "/images/html-logo-transparent.webp",
        name: "HTML5",
        type: "Struktur Web",
        tagColor: "bg-orange-50 text-orange-600 border-orange-200",
        desc: "Fondasi utama untuk menyusun struktur, kerangka, dan konten halaman web.",
        tooltip: "Struktur, Semantik & Elemen Web Modern",
      },
      {
        src: "/images/css-logo.webp",
        name: "CSS3",
        type: "Desain Visual",
        tagColor: "bg-blue-50 text-blue-600 border-blue-200",
        desc: "Merancang tampilan visual, layout responsif, dan estetika di semua perangkat.",
        tooltip: "Tata Letak, Flexbox, Grid & Animasi",
      },
      {
        src: "/images/javascript-logo.webp",
        name: "JavaScript",
        type: "Logika & Interaktivitas",
        tagColor: "bg-amber-50 text-amber-700 border-amber-200",
        desc: "Memberikan logika agar website bisa berpikir, mengolah data, dan berinteraksi secara dinamis.",
        tooltip: "Logika Algoritma, DOM & Interaksi Interaktif",
      },
    ],
  },
  {
    title: "Industry Standard Tools",
    icon: Wrench,
    badgeColor: "border-orange-200 bg-orange-50 text-orange-600",
    items: [
      {
        src: "/images/vs-code-logo.webp",
        name: "VS Code",
        type: "Code Editor",
        tagColor: "bg-sky-50 text-sky-600 border-sky-200",
        desc: "Code editor standar industri tempat siswa menulis, membedah logika, dan menyusun kode secara profesional.",
        tooltip: "Ekosistem Extension & Debugging Canggih",
      },
      {
        src: "/images/figma-logo.webp",
        name: "Figma",
        type: "UI/UX Design",
        tagColor: "bg-purple-50 text-purple-600 border-purple-200",
        desc: "Aplikasi desain digital untuk merancang wireframe, UI/UX, dan prototype sebelum dibangun menjadi kode.",
        tooltip: "Wireframing, Prototyping & Layouting",
      },
      {
        src: "/images/antigravity-logo.webp",
        name: "Antigravity",
        type: "AI Assistant",
        tagColor: "bg-indigo-50 text-indigo-600 border-indigo-200",
        desc: "AI coding assistant untuk eksplorasi konsep cerdas, problem solving, dan percepatan pembuatan project.",
        tooltip: "AI Coding Assistant, Smart Debugging & Logic Help",
      },
      {
        src: "/images/database-logo.webp",
        name: "Database",
        type: "Cloud Backend",
        tagColor: "bg-emerald-50 text-emerald-600 border-emerald-200",
        desc: "Platform database Postgres berbasis cloud sebagai backend dan arsitektur data aplikasi digital.",
        tooltip: "PostgreSQL, Serverless Architecture & Cloud Data",
      },
    ],
  },
];

export default function BahasaSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap.fromTo(
        ".tech-header",
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
        ".tech-card",
        { y: 20, opacity: 0, scale: 0.97 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.6,
          stagger: 0.05,
          ease: "power3.out",
          clearProps: "transform,opacity",
          scrollTrigger: {
            trigger: ".tech-container",
            start: "top 85%",
            once: true,
          },
        },
      );
    },
    { scope: sectionRef },
  );

  return (
    <TooltipProvider delayDuration={150}>
      <section
        ref={sectionRef}
        className="py-24 px-5 bg-slate-50 relative overflow-hidden"
        id="bahasa"
      >
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="tech-header text-center max-w-2xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 mb-4">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              <span className="font-poppins text-xs font-bold text-slate-500 uppercase tracking-widest">
                Tech Stack &amp; Tools
              </span>
            </div>
            <h2 className="font-poppins text-3xl sm:text-4xl font-bold text-slate-900 mb-4 leading-tight">
              <span className="text-red-500">Fondasi</span> dan{" "}
              <span className="text-orange-500">Tools Modern</span> yang
              Digunakan
            </h2>
            <p className="font-sans text-base sm:text-lg text-slate-600">
              Siswa belajar langsung dengan teknologi standar industri dan
              workflow AI modern.
            </p>
          </div>

          {/* Grouped Tech Stacks */}
          <div className="tech-container space-y-12 max-w-6xl mx-auto">
            {stackGroups.map((group) => {
              const Icon = group.icon;

              return (
                <div key={group.title} className="space-y-6">
                  {/* Category Title */}
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-white shadow-xs border border-slate-200 flex items-center justify-center text-slate-700">
                      <Icon className="w-4 h-4" />
                    </div>
                    <h3 className="font-poppins text-lg sm:text-xl font-bold text-slate-800 tracking-wide">
                      {group.title}
                    </h3>
                  </div>

                  {/* Cards Grid */}
                  <div
                    className={`grid gap-6 ${
                      group.items.length === 3
                        ? "grid-cols-1 md:grid-cols-3"
                        : "grid-cols-1 md:grid-cols-3"
                    }`}
                  >
                    {group.items.map((item) => (
                      <Tooltip key={item.name}>
                        <TooltipTrigger asChild>
                          <Card
                            className="tech-card group bg-white rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-xl hover:border-orange-200 duration-300 hover:-translate-y-1.5 p-6 flex flex-col justify-between cursor-pointer"
                            style={{
                              transitionProperty: "box-shadow, border-color",
                            }}
                          >
                            <CardContent className="p-0 flex flex-col items-start text-left">
                              {/* Top Bar: Logo & Tag */}
                              <div className="w-full flex items-center justify-between gap-4 mb-5">
                                <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center p-2.5 group-hover:scale-110 transition-transform duration-300 shadow-xs">
                                  <Image
                                    src={item.src}
                                    alt={item.name}
                                    width={48}
                                    height={48}
                                    className="object-contain max-h-12 w-auto"
                                  />
                                </div>
                                <Badge
                                  variant="outline"
                                  className={`px-3 py-1 font-semibold text-xs rounded-full ${item.tagColor}`}
                                >
                                  {item.type}
                                </Badge>
                              </div>

                              {/* Title & Desc */}
                              <h4 className="font-poppins text-lg font-bold text-slate-900 mb-2 group-hover:text-red-600 transition-colors">
                                {item.name}
                              </h4>
                              <p className="font-sans text-base text-slate-600 leading-relaxed">
                                {item.desc}
                              </p>
                            </CardContent>
                          </Card>
                        </TooltipTrigger>
                        <TooltipContent className="bg-slate-900 text-white font-sans text-xs px-3.5 py-1.5 rounded-xl shadow-xl">
                          {item.tooltip}
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </TooltipProvider>
  );
}
