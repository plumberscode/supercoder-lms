"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { HelpCircle } from "lucide-react";

const faqs = [
  {
    q: "Anak saya belum pernah belajar coding sama sekali, apakah bisa ikut kelas ini?",
    a: "Bisa sekali. Kurikulum di SuperCoder dirancang ramah untuk pemula total. Siswa akan dibimbing dari pemahaman dasar langkah demi langkah, sehingga tidak perlu khawatir tertinggal.",
  },
  {
    q: "Apakah dengan adanya AI, anak tetap perlu belajar coding?",
    a: "Sangat perlu. AI mempercepat proses pembuatan, tetapi pemahaman coding fundamentals membuat siswa paham logika di baliknya, mampu mengevaluasi hasil AI, menemukan kesalahan kode, dan memiliki kendali penuh atas project yang dibangun.",
  },
  {
    q: "Apakah siswa harus sudah mengerti AI sebelum bergabung?",
    a: "Tidak perlu. Pembelajaran disusun secara bertahap. Siswa membangun dasar logika dan coding terlebih dahulu, lalu diajarkan cara menggunakan AI secara terarah sebagai partner belajar dan development.",
  },
  {
    q: "Apakah ada Kelas Online dan Offline?",
    a: "Ya, kami menyediakan kelas offline (tatap muka kelompok kecil di Balikpapan) dan kelas online privat 1-on-1 bersama mentor yang dapat diikuti dari mana saja secara fleksibel.",
  },
  {
    q: "Berapa jumlah siswa maksimal untuk kelas offline dan online?",
    a: "Untuk menjaga efektivitas bimbingan, kelas offline dibatasi maksimal 6 orang per sesi, sedangkan kelas online bersifat privat 1-on-1 (1 siswa bersama 1 mentor).",
  },
];

export default function FAQSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap.fromTo(
        ".faq-header",
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
        ".faq-item",
        { y: 18, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.55,
          stagger: 0.05,
          ease: "power3.out",
          clearProps: "transform,opacity",
          scrollTrigger: {
            trigger: ".faq-accordion",
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
      className="py-24 px-5 bg-slate-50 relative overflow-hidden"
      id="faq"
    >
      {/* Background ambient glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(254,242,242,0.5), transparent 70%)",
        }}
      />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header Section */}
        <div className="faq-header text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 mb-4">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <span className="font-poppins text-xs font-bold text-slate-500 uppercase tracking-widest">
              Tanya Jawab
            </span>
          </div>
          <h2 className="font-poppins text-3xl sm:text-4xl font-bold text-slate-900 mb-4 leading-tight">
            FAQ :{" "}
            <span className="text-orange-500">Frequently Asked Questions</span>
          </h2>
          <p className="font-sans text-base sm:text-lg text-slate-600">
            Pertanyaan yang sering diajukan seputar metode belajar, coding
            fundamentals, dan peran AI di SuperCoder.
          </p>
        </div>

        {/* shadcn Accordion */}
        <Accordion
          type="single"
          collapsible
          className="faq-accordion w-full space-y-4"
        >
          {faqs.map((faq, i) => (
            <AccordionItem
              key={i}
              value={`item-${i}`}
              className="faq-item border border-slate-200/80 bg-white rounded-2xl px-6 shadow-xs data-[state=open]:border-orange-200 data-[state=open]:shadow-md duration-200 overflow-hidden"
              style={{ transitionProperty: "border-color, box-shadow" }}
            >
              <AccordionTrigger className="font-poppins font-semibold text-base sm:text-[17px] text-slate-900 hover:text-red-600 text-left py-5 gap-4 hover:no-underline [&[data-state=open]>svg]:text-red-600">
                <span className="flex items-center gap-3">
                  <HelpCircle className="w-5 h-5 text-orange-500 shrink-0 hidden sm:block" />
                  {faq.q}
                </span>
              </AccordionTrigger>
              <AccordionContent className="font-sans text-base text-slate-600 leading-relaxed pb-6 pt-1 sm:pl-8">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
