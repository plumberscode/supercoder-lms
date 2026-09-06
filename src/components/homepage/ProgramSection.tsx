"use client";

import { useRef } from "react";
import Image from "next/image";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Clock,
  Calendar,
  MapPin,
  Video,
  Sparkles,
  Layers,
  PartyPopper,
} from "lucide-react";

const programs = [
  {
    tag: "Tatap Muka",
    badgeVariant: "default" as const,
    title: "Weekend Coding Class",
    desc: "Belajar langsung bersama mentor untuk menguasai coding fundamentals, memahami logika teknologi, dan memanfaatkan AI sebagai bagian dari workflow modern untuk mengembangkan project nyata.",
    image: "/images/weekend-coding-class.webp",
    ctaText: "Amankan Seat",
    details: [
      { icon: Clock, label: "Durasi", value: "90 menit per sesi" },
      {
        icon: Calendar,
        label: "Frekuensi",
        value: "1x seminggu (Minggu: 09.00 - 10.30)",
      },
      { icon: MapPin, label: "Lokasi", value: "Falya Risol Mayo" },
      { icon: Sparkles, label: "Investasi", value: "Rp 449.000 / bulan" },
    ],
  },
  {
    tag: "Online Interaktif",
    badgeVariant: "secondary" as const,
    title: "Premium Online Class",
    desc: "Pembelajaran privat bersama mentor dengan kurikulum adaptif. Bangun fundamental coding yang kokoh sekaligus kuasai cara memanfaatkan AI secara efektif untuk mempercepat pembuatan project digital.",
    image: "/images/premium-online-class.webp",
    ctaText: "Amankan Seat",
    details: [
      { icon: Clock, label: "Durasi", value: "90 menit per sesi" },
      {
        icon: Calendar,
        label: "Frekuensi",
        value: "1x seminggu (Jadwal fleksibel)",
      },
      { icon: Video, label: "Platform", value: "Google Meet" },
      { icon: Sparkles, label: "Investasi", value: "Rp 499.000 / bulan" },
    ],
  },
  {
    tag: "Mentorship Project",
    badgeVariant: "default" as const,
    title: "Custom Project Class",
    desc: "Punya ide website atau aplikasi yang ingin kamu buat? Bawa idemu ke kelas. Pelajari fundamental yang dibutuhkan sambil langsung membangun project secara bertahap bersama mentor dengan bantuan coding dan AI.",
    image: "/images/custom-project-class.webp",
    ctaText: "Diskusikan Projectmu",
    details: [
      { icon: Clock, label: "Durasi", value: "90 menit per sesi" },
      { icon: Calendar, label: "Frekuensi", value: "2x seminggu" },
      { icon: Video, label: "Platform", value: "Google Meet" },
      { icon: Layers, label: "Skala Project", value: "Ringan - Sedang" },
    ],
  },
];

export default function ProgramSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap.fromTo(
        ".program-header",
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
        ".program-card",
        { y: 24, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          stagger: 0.07,
          ease: "power3.out",
          clearProps: "transform,opacity",
          scrollTrigger: {
            trigger: ".program-grid",
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
      className="py-24 px-5 bg-slate-50 relative"
      id="program"
    >
      <div className="max-w-6xl mx-auto">
        {/* Title Header */}
        <div className="program-header text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 mb-4">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <span className="font-poppins text-xs font-bold text-slate-500 uppercase tracking-widest">
              Kelas Kami
            </span>
          </div>
          <h2 className="font-poppins text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
            Program <span className="text-red-500">Pilihan</span>
          </h2>
          <p className="font-sans text-base sm:text-lg text-slate-600">
            Pilih format belajar yang paling sesuai dengan ritme dan target
            belajarmu.
          </p>
        </div>

        {/* 3 Program Cards Grid */}
        <div className="program-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {programs.map((prog, index) => (
            <div
              key={prog.title}
              className={`relative ${
                index === 2
                  ? "md:col-span-2 md:max-w-md md:mx-auto lg:col-span-1 lg:max-w-none lg:mx-0 w-full"
                  : ""
              }`}
            >
              {/* Promo badge — pinned to the card's wrapper so it can poke out past the edges */}
              <div className="absolute -top-4 -right-4 z-20">
                <div className="promo-badge-99 w-16 h-16 rounded-full text-white shadow-lg shadow-orange-900/30 flex flex-col items-center justify-center leading-none">
                  <PartyPopper className="w-4 h-4 mb-0.5" />
                  <span className="text-[10px] font-black tracking-wide">
                    PROMO
                  </span>
                  <span className="text-xs font-black tracking-wide">99</span>
                </div>
              </div>

              <Card
                style={{ transitionProperty: "box-shadow" }}
                className="program-card group bg-white rounded-3xl border border-slate-200/80 shadow-md hover:shadow-2xl duration-300 hover:-translate-y-1.5 overflow-hidden flex flex-col justify-between"
              >
                <div>
                  {/* Image Header with Badge Overlay */}
                  <div className="relative w-full h-48 sm:h-52 overflow-hidden bg-slate-100">
                    <Image
                      src={prog.image}
                      alt={prog.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 500px"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-4 left-4 z-10">
                      <Badge className="bg-slate-900/85 backdrop-blur-md text-white border-0 px-3.5 py-1 rounded-full text-xs font-semibold shadow-md">
                        {prog.tag}
                      </Badge>
                    </div>
                  </div>

                  {/* Card Header & Content */}
                  <CardHeader className="p-5 sm:p-6 pb-2 flex flex-col justify-start min-h-[135px] sm:min-h-[145px]">
                    <CardTitle className="font-poppins text-xl sm:text-2xl font-bold text-slate-900 group-hover:text-red-600 transition-colors">
                      {prog.title}
                    </CardTitle>
                    <CardDescription className="font-sans text-base text-slate-600 leading-relaxed mt-1.5">
                      {prog.desc}
                    </CardDescription>
                  </CardHeader>

                  {/* Details List */}
                  <CardContent className="px-5 sm:px-6 pt-0 pb-5">
                    <div className="space-y-2 pt-3 border-t border-slate-100">
                      {prog.details.map((d) => {
                        const Icon = d.icon;

                        return (
                          <div
                            key={d.label}
                            className="flex items-center gap-3 py-2 px-3 rounded-xl bg-slate-50/80 transition-colors"
                          >
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-slate-200/80 text-slate-700">
                              <Icon className="w-3.5 h-3.5" />
                            </div>
                            <div className="text-sm sm:text-base">
                              <span className="text-slate-500 font-medium mr-1.5">
                                {d.label}:
                              </span>
                              <span className="font-semibold text-slate-800">
                                {d.value}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </div>

                {/* Card Footer with CTA Button */}
                <CardFooter className="px-5 sm:px-6 pb-5 sm:pb-6 pt-0">
                  <Button
                    asChild
                    className="w-full h-11 sm:h-12 rounded-2xl bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-poppins font-semibold text-sm sm:text-base shadow-md shadow-red-500/20 hover:shadow-lg hover:shadow-red-500/30 transition-all duration-200"
                  >
                    <Link
                      href={`/daftar?class=${encodeURIComponent(prog.title)}`}
                      className="inline-flex items-center justify-center gap-2"
                    >
                      <span>{prog.ctaText || "Daftar Sekarang"}</span>
                      <span>&rarr;</span>
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
