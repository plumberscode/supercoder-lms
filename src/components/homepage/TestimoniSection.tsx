"use client";

import { useState, useEffect, useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";
import {
  Card,
  CardContent,
  CardHeader,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";

interface Testimonial {
  name: string;
  role: string;
  highlight: string;
  quote: string;
  stars: number;
  program: string;
  initial: string;
  color: string;
  image?: string;
}

const testimonials: Testimonial[] = [
  {
    name: "Naufal Brata Pratama",
    role: "Siswa SMAN 1 Balikpapan",
    highlight: "Sangat interaktif & ilmunya berguna untuk masa depan.",
    quote:
      "Saya sangat menikmati coding class di Supercoder. Materinya sangat relevan dan pas pertama kali website saya bisa dibuka di browser rasanya bangga sekali. Feedback dari instruktur sangat membantu.",
    stars: 5,
    program: "Weekend Class",
    initial: "NB",
    color: "from-orange-500 to-amber-500",
  },
  {
    name: "Maria Olga",
    role: "Staf ASN",
    highlight: "Belajar dari nol tidak semenakutkan itu 😁",
    quote:
      "Pagi kak...happy poll, jujur belajar hal baru dari nol di coding class supercoder, tidak semenakutkan itu 😁, buat saya yg gaptek hal ini, belajar dengan sistem online tidak sulit. Saya sukai pengajar dapat membawakan materi dengan sederhana, yg saya orang awam bisa memahaminya. Bahkan bisa disesuaikan dengan jadwal saya juga.",
    stars: 5,
    program: "Online Class",
    initial: "MO",
    color: "from-red-500 to-rose-500",
  },
  {
    name: "Muhammad Aslam",
    role: "Siswa Kelas 9 MTS Ibnu Umar",
    highlight: "Tempatnya nyaman, materi gampang masuk ke otak.",
    quote:
      "Gurunya penjelasannya baik dan ramah. Saya belajar dari HTML, CSS hingga Javascript dan sekarang sudah bisa bikin website sendiri.",
    stars: 5,
    program: "Bootcamp",
    initial: "MA",
    color: "from-purple-600 to-indigo-600",
  },
  {
    name: "Muhammad Qadarian",
    role: "Guru, SD Al-Imam Islamic School",
    highlight: "Materi interaktif & desain materinya mantap!",
    quote:
      "Seru banget! Banyak ilmu baru yang didapat, basic-basicnya dapat semua. Sangat membantu saya membuat media pembelajaran digital yang menarik untuk murid.",
    stars: 5,
    program: "Bootcamp",
    initial: "MQ",
    color: "from-cyan-600 to-blue-600",
    image: "/images/rian.webp",
  },
];

export default function TestimoniSection() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap.fromTo(
        ".testi-header",
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
        ".testi-cards-wrap",
        { y: 24, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          ease: "power3.out",
          clearProps: "transform,opacity",
          scrollTrigger: {
            trigger: ".testi-cards-wrap",
            start: "top 85%",
            once: true,
          },
        },
      );
    },
    { scope: sectionRef },
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : testimonials.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  // Exactly 3 full visible items without truncation
  const visibleTestimonials = [
    testimonials[currentIndex % testimonials.length],
    testimonials[(currentIndex + 1) % testimonials.length],
    testimonials[(currentIndex + 2) % testimonials.length],
  ];

  return (
    <section
      ref={sectionRef}
      className="py-28 sm:py-36 lg:py-44 px-5 bg-slate-50 relative overflow-hidden"
      id="testimoni"
    >
      <div className="max-w-6xl mx-auto">
        <div className="testi-header flex flex-col items-center justify-center text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 mb-4">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <span className="font-poppins text-xs font-bold text-slate-500 uppercase tracking-widest">
              Testimoni
            </span>
          </div>
          <h2 className="font-poppins text-3xl sm:text-4xl font-bold text-slate-900 mb-4 leading-tight">
            Apa Kata <span className="text-[#EF4444]">Mereka?</span>
          </h2>
          <p className="font-sans text-base sm:text-lg text-slate-600">
            Setiap perjalanan dimulai dari satu langkah. Inilah cerita mereka
            yang sudah belajar dan mulai membangun bersama SuperCoder.
          </p>
        </div>

        {/* Responsive Cards Grid (1 on mobile, 3 on md+) */}
        <div className="testi-cards-wrap grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto relative">
          {visibleTestimonials.map((item, idx) => {
            const isLeftmost = idx === 0;
            const isRightmost = idx === 2;

            return (
              <div
                key={`${item.name}-${idx}`}
                className={`relative h-full ${idx > 0 ? "hidden md:block" : "block"}`}
              >
                {/* Floating Left Arrow: On 1st card (desktop if scrolled, mobile always) */}
                {isLeftmost && (
                  <button
                    onClick={handlePrev}
                    aria-label="Previous testimonials"
                    className="absolute -left-3 sm:-left-5 top-1/2 -translate-y-1/2 z-30 w-9 h-9 rounded-full bg-white border border-slate-300 text-slate-500 hover:text-slate-900 hover:border-slate-400 hover:scale-105 shadow-md flex items-center justify-center transition-all duration-200"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                )}

                <Card className="bg-white rounded-3xl border-0 shadow-md hover:shadow-xl transition-all duration-300 h-full flex flex-col justify-between p-6 sm:p-8 lg:p-10">
                  <div>
                    {/* Header: Avatar, Name, Role */}
                    <CardHeader className="p-0 mb-6 sm:mb-7 flex flex-row items-center justify-between space-y-0">
                      <div className="flex items-center gap-3.5">
                        <Avatar className="w-11 h-11 shadow-xs ring-2 ring-white">
                          {item.image && (
                            <AvatarImage
                              src={item.image}
                              alt={item.name}
                              className="object-cover"
                            />
                          )}
                          <AvatarFallback
                            className={`bg-gradient-to-br ${item.color} text-white font-poppins font-bold text-sm`}
                          >
                            {item.initial}
                          </AvatarFallback>
                        </Avatar>
                        <div className="text-left">
                          <h4 className="font-poppins text-base font-bold text-slate-900 leading-snug">
                            {item.name}
                          </h4>
                          <p className="font-sans text-sm text-slate-500">
                            {item.role}
                          </p>
                        </div>
                      </div>
                    </CardHeader>

                    {/* Content: Highlight & Quote */}
                    <CardContent className="p-0 text-left">
                      <p className="font-sans text-base font-bold text-slate-800 leading-snug mb-3">
                        &ldquo;{item.highlight}&rdquo;
                      </p>
                      <p className="font-sans text-base sm:text-[17px] text-slate-700 leading-relaxed line-clamp-6">
                        {item.quote}
                      </p>
                    </CardContent>
                  </div>

                  {/* Footer: Stars & Program Badge */}
                  <CardFooter className="p-0 pt-6 mt-4 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-1 text-amber-400">
                      {Array.from({ length: item.stars }).map((_, i) => (
                        <Star
                          key={i}
                          className="w-4 h-4 fill-amber-400 text-amber-400"
                        />
                      ))}
                    </div>
                    <Badge
                      variant="secondary"
                      className="font-semibold text-xs bg-slate-100 text-slate-700"
                    >
                      {item.program}
                    </Badge>
                  </CardFooter>
                </Card>

                {/* Floating Right Arrow: On 1st card for mobile only */}
                {isLeftmost && (
                  <button
                    onClick={handleNext}
                    aria-label="Next testimonials"
                    className="md:hidden absolute -right-3 top-1/2 -translate-y-1/2 z-30 w-9 h-9 rounded-full bg-white border border-slate-300 text-slate-500 hover:text-slate-900 hover:border-slate-400 hover:scale-105 shadow-md flex items-center justify-center transition-all duration-200"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}

                {/* Floating Right Arrow: On 3rd card for desktop */}
                {isRightmost && (
                  <button
                    onClick={handleNext}
                    aria-label="Next testimonials"
                    className="hidden md:flex absolute -right-4 sm:-right-5 top-1/2 -translate-y-1/2 z-30 w-9 h-9 rounded-full bg-white border border-slate-300 text-slate-500 hover:text-slate-900 hover:border-slate-400 hover:scale-105 shadow-md items-center justify-center transition-all duration-200"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Pagination Dots */}
        <div className="flex items-center justify-center gap-2.5 mt-10">
          {testimonials.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              aria-label={`Testimoni slide ${i + 1}`}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === currentIndex
                  ? "w-8 bg-red-500"
                  : "w-2 bg-slate-300 hover:bg-slate-400"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
