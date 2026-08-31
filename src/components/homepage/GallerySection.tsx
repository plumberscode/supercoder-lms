"use client";

import { useRef } from "react";
import Image from "next/image";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { ZoomIn, Camera } from "lucide-react";

const photos = [
  {
    src: "/images/gallery/coding class balikpapan one.webp",
    title: "Weekend Coding Class",
    caption:
      "Peserta Weekend Coding Class sedang merancang dan mengkodekan komponen antarmuka web (UI Cards) secara presisi.",
  },
  {
    src: "/images/gallery/coding class balikpapan two.webp",
    title: "Tantangan Hands-on",
    caption:
      "Di setiap pertemuan, peserta selalu diberikan tantangan hands-on untuk melatih logika dan membangun komponen UI interaktif.",
  },
  {
    src: "/images/gallery/coding class balikpapan three.webp",
    title: "Suasana Belajar Nyaman",
    caption:
      "Suasana belajar yang seru dan interaktif. Di lantai bawah, ada Falya Risol yang bisa kamu nikmati saat jeda belajar.",
  },
];

export default function GallerySection() {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap.fromTo(
        ".gallery-header",
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
        ".gallery-card",
        { y: 22, opacity: 0, scale: 0.97 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.6,
          stagger: 0.06,
          ease: "power3.out",
          clearProps: "transform,opacity",
          scrollTrigger: {
            trigger: ".gallery-grid",
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
      id="galeri"
    >
      {/* Background ambient accents */}
      <div
        className="absolute top-1/2 right-0 w-96 h-96 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(255,247,237,0.5), transparent 70%)",
        }}
      />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Title Header */}
        <div className="gallery-header text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 mb-4">
            <span className="w-2 h-2 rounded-full bg-orange-500" />
            <span className="font-poppins text-xs font-bold text-slate-500 uppercase tracking-widest">
              Dokumentasi Kelas
            </span>
          </div>
          <h2 className="font-poppins text-3xl sm:text-4xl font-bold text-slate-900 mb-4 leading-tight">
            Suasana{" "}
            <span className="text-orange-500">Belajar &amp; Membangun</span>
          </h2>
          <p className="font-sans text-sm text-slate-600">
            Bukan sekadar duduk dan mendengarkan teori. Di setiap sesi, siswa
            aktif mencoba, memecahkan error, berdiskusi, dan membangun karya
            digital mereka.
          </p>
        </div>

        {/* 3 Photos Gallery Grid */}
        <div className="gallery-grid grid grid-cols-1 md:grid-cols-3 gap-8">
          {photos.map((photo, i) => (
            <Dialog key={photo.src}>
              <DialogTrigger asChild>
                <Card
                  className="gallery-card group bg-white rounded-3xl border border-slate-200/80 shadow-md hover:shadow-2xl duration-300 hover:-translate-y-2 overflow-hidden cursor-pointer flex flex-col justify-between"
                  style={{ transitionProperty: "box-shadow" }}
                >
                  <CardContent className="p-0 flex flex-col h-full">
                    {/* Image Frame with Zoom Overlay */}
                    <div className="relative w-full h-64 overflow-hidden bg-slate-100">
                      <Image
                        src={photo.src}
                        alt={`${photo.title} - Suasana Kelas Coding dan AI Supercoder Balikpapan`}
                        fill
                        sizes="(max-width: 768px) 100vw, 400px"
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      {/* Zoom Indicator */}
                      <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-xs">
                        <div className="w-11 h-11 rounded-full bg-white/90 text-slate-900 flex items-center justify-center shadow-lg transform scale-75 group-hover:scale-100 transition-transform duration-300">
                          <ZoomIn className="w-5 h-5" />
                        </div>
                      </div>
                    </div>

                    {/* Caption Block */}
                    <div className="p-6 flex flex-col justify-between grow">
                      <div>
                        <h4 className="font-poppins text-base font-bold text-slate-900 mb-2 group-hover:text-orange-600 transition-colors">
                          {photo.title}
                        </h4>
                        <p className="font-sans text-sm text-slate-600 leading-relaxed">
                          {photo.caption}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </DialogTrigger>

              {/* Lightbox Dialog Popup */}
              <DialogContent className="max-w-4xl p-2 bg-transparent border-0 shadow-none overflow-hidden sm:rounded-3xl">
                <div className="relative w-full h-[65vh] rounded-2xl overflow-hidden bg-black/90">
                  <Image
                    src={photo.src}
                    alt={photo.title}
                    fill
                    className="object-contain"
                    sizes="100vw"
                  />
                  <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent text-white">
                    <p className="font-poppins font-bold text-base">
                      {photo.title}
                    </p>
                    <p className="font-sans text-sm text-slate-200 mt-1">
                      {photo.caption}
                    </p>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          ))}
        </div>
      </div>
    </section>
  );
}
