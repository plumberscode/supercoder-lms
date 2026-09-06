"use client";

import { useState, useEffect, useLayoutEffect, useRef } from "react";
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
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, Star, Crown, Quote } from "lucide-react";

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

// Pinned above the auto-sliding carousel — does not rotate and is not part
// of `testimonials`/the slide logic at all.
const featuredTestimonial: Testimonial = {
  name: "Nararya Riffat",
  role: "Siswa Premium Online Class",
  highlight: "Ada leaderboard yang membuat kita bersemangat..",
  quote: [
    "Materinya sangat gampang dipahami dan metode koreksinya menggunakan AI yang sangat memudahkan dan membantu memberitahu masalah di code/script yang kita ketik.",
    "Ada leaderboard yang membuat kita bersemangat mengejar peringkat ke-1 dan banyak challenge yang asik.",
    "Belajar di sini sangat asik dan cepat paham, saya sudah belajar selama 2 tahun di Supercoder tanpa ada kendala satu pun.",
  ].join("\n\n"),
  stars: 5,
  program: "Premium Online Class",
  initial: "NR",
  color: "from-amber-500 to-orange-600",
};

const AUTOPLAY_INTERVAL_MS = 7000;

function getVisibleTestimonials(index: number): Testimonial[] {
  return [
    testimonials[index % testimonials.length],
    testimonials[(index + 1) % testimonials.length],
    testimonials[(index + 2) % testimonials.length],
  ];
}

export default function TestimoniSection() {
  const [currentIndex, setCurrentIndex] = useState(0);
  // Snapshot of the testimonials that are sliding OUT. Kept mounted
  // side-by-side with the new (current) set until the slide finishes, so
  // the viewport always has content in it — nothing ever "disappears".
  const [outgoing, setOutgoing] = useState<{
    items: Testimonial[];
    direction: 1 | -1;
  } | null>(null);

  const sectionRef = useRef<HTMLElement>(null);
  const currentPanelRef = useRef<HTMLDivElement>(null);
  const outgoingPanelRef = useRef<HTMLDivElement>(null);
  const quoteRefs = useRef<Record<string, HTMLParagraphElement | null>>({});
  const [truncatedMap, setTruncatedMap] = useState<Record<string, boolean>>({});

  // Kept in refs so the autoplay timer and GSAP callbacks always read the
  // latest value without stale closures.
  const currentIndexRef = useRef(currentIndex);
  const isAnimatingRef = useRef(false);
  const isPausedRef = useRef(false);

  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

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
        ".testi-featured",
        { y: 20, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          ease: "power3.out",
          clearProps: "transform,opacity",
          scrollTrigger: {
            trigger: ".testi-featured",
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

  // Kicks off a slide: the current testimonials become the "outgoing"
  // snapshot (rendered on top, about to exit) while the new testimonials
  // render underneath as the incoming set — both are visible at once.
  const goTo = (nextIndex: number, dir: 1 | -1) => {
    if (isAnimatingRef.current) return;
    isAnimatingRef.current = true;
    setOutgoing({
      items: getVisibleTestimonials(currentIndexRef.current),
      direction: dir,
    });
    setCurrentIndex(nextIndex);
  };

  // Runs once both the outgoing snapshot and the new current testimonials
  // are in the DOM together (same commit as `goTo`'s state updates), so the
  // cross-slide animates two fully-populated panels past each other instead
  // of fading through an empty gap. useLayoutEffect (not useEffect) applies
  // the starting transform before the browser paints, so there's no flash.
  useLayoutEffect(() => {
    if (!outgoing) return;
    const dir = outgoing.direction;
    const currentEl = currentPanelRef.current;
    const outgoingEl = outgoingPanelRef.current;
    if (!currentEl || !outgoingEl) {
      setOutgoing(null);
      isAnimatingRef.current = false;
      return;
    }

    gsap.set(currentEl, { xPercent: dir * 100 });
    gsap.set(outgoingEl, { xPercent: 0 });

    const tl = gsap.timeline({
      defaults: { duration: 0.6, ease: "power3.inOut" },
      onComplete: () => {
        setOutgoing(null);
        isAnimatingRef.current = false;
      },
    });
    tl.to(currentEl, { xPercent: 0 }, 0);
    tl.to(outgoingEl, { xPercent: dir * -100 }, 0);

    return () => {
      tl.kill();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (isAnimatingRef.current || isPausedRef.current) return;
      const next = (currentIndexRef.current + 1) % testimonials.length;
      goTo(next, 1);
    }, AUTOPLAY_INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

  // Detect which visible quotes are actually clipped by line-clamp-6 at the
  // current viewport width, so the "Baca Selengkapnya" link only shows up
  // when it's actually needed — cards that already fit stay untouched.
  useEffect(() => {
    const checkTruncation = () => {
      setTruncatedMap((prev) => {
        const next = { ...prev };
        let changed = false;
        Object.entries(quoteRefs.current).forEach(([name, el]) => {
          const isTruncated = !!el && el.scrollHeight > el.clientHeight + 1;
          if (next[name] !== isTruncated) {
            next[name] = isTruncated;
            changed = true;
          }
        });
        return changed ? next : prev;
      });
    };

    checkTruncation();
    window.addEventListener("resize", checkTruncation);
    return () => window.removeEventListener("resize", checkTruncation);
  }, [currentIndex]);

  const handlePrev = () => {
    const next = currentIndex > 0 ? currentIndex - 1 : testimonials.length - 1;
    goTo(next, -1);
  };

  const handleNext = () => {
    const next = (currentIndex + 1) % testimonials.length;
    goTo(next, 1);
  };

  const visibleTestimonials = getVisibleTestimonials(currentIndex);

  // Shared card renderer for both the live (interactive) panel and the
  // outgoing (ghost, pointer-events-none) panel during a slide.
  const renderCard = (item: Testimonial, idx: number, interactive: boolean) => (
    <div
      key={`${item.name}-${idx}`}
      className={`relative h-full ${idx > 0 ? "hidden md:block" : "block"}`}
    >
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
                <p className="font-sans text-sm text-slate-500">{item.role}</p>
              </div>
            </div>
          </CardHeader>

          {/* Content: Highlight & Quote */}
          <CardContent className="p-0 text-left">
            <p className="font-sans text-base font-bold text-slate-800 leading-snug mb-3">
              &ldquo;{item.highlight}&rdquo;
            </p>
            {interactive ? (
              <Dialog>
                <p
                  ref={(el) => {
                    quoteRefs.current[item.name] = el;
                  }}
                  className="font-sans text-base sm:text-[17px] text-slate-700 leading-relaxed line-clamp-6"
                >
                  {item.quote}
                </p>
                {truncatedMap[item.name] && (
                  <DialogTrigger asChild>
                    <button
                      type="button"
                      className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-red-600 hover:text-red-700 transition-colors"
                    >
                      Baca Selengkapnya
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </DialogTrigger>
                )}

                {/* Full testimonial popup — mirrors the card so the reveal feels like one design */}
                <DialogContent className="max-w-lg p-0 overflow-hidden rounded-3xl border-0 shadow-2xl">
                  <div className="p-6 sm:p-8">
                    <div className="flex items-center gap-3.5 mb-6">
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

                    <p className="font-sans text-base font-bold text-slate-800 leading-snug mb-3">
                      &ldquo;{item.highlight}&rdquo;
                    </p>
                    <p className="font-sans text-base sm:text-[17px] text-slate-700 leading-relaxed">
                      {item.quote}
                    </p>

                    <div className="flex items-center justify-between pt-6 mt-4 border-t border-slate-100">
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
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            ) : (
              <p className="font-sans text-base sm:text-[17px] text-slate-700 leading-relaxed line-clamp-6">
                {item.quote}
              </p>
            )}
          </CardContent>
        </div>

        {/* Footer: Stars & Program Badge */}
        <CardFooter className="p-0 pt-6 mt-4 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-1 text-amber-400">
            {Array.from({ length: item.stars }).map((_, i) => (
              <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
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
    </div>
  );

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

        {/* Featured Testimonial — pinned above the carousel, never rotates */}
        <div className="testi-featured relative mb-12 sm:mb-14">
          <div className="relative rounded-[28px] bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 p-[2px] shadow-lg shadow-orange-500/20">
            <div className="relative rounded-[26px] bg-white overflow-hidden p-6 sm:p-10 lg:p-12">
              <Quote className="pointer-events-none absolute -top-4 right-6 sm:right-10 w-24 h-24 sm:w-32 sm:h-32 text-orange-50" />

              <div className="relative inline-flex items-center gap-1.5 mb-6 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 text-white text-xs font-bold uppercase tracking-wider shadow-sm">
                <Crown className="w-3.5 h-3.5" />
                Testimoni Pilihan
              </div>

              <div className="relative grid grid-cols-1 md:grid-cols-[auto_1fr] gap-6 sm:gap-8 items-start">
                <div className="flex md:flex-col items-center md:items-start gap-3.5 md:gap-3 md:w-40 shrink-0">
                  <Avatar className="w-14 h-14 shadow-xs ring-2 ring-white">
                    <AvatarFallback
                      className={`bg-gradient-to-br ${featuredTestimonial.color} text-white font-poppins font-bold text-base`}
                    >
                      {featuredTestimonial.initial}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-left">
                    <h4 className="font-poppins text-base font-bold text-slate-900 leading-snug">
                      {featuredTestimonial.name}
                    </h4>
                    <p className="font-sans text-sm text-slate-500">
                      {featuredTestimonial.role}
                    </p>
                  </div>
                </div>

                <div className="text-left">
                  <p className="font-sans text-lg sm:text-xl font-bold text-slate-900 leading-snug mb-4">
                    &ldquo;{featuredTestimonial.highlight}&rdquo;
                  </p>
                  <div className="font-sans text-base sm:text-[17px] text-slate-700 leading-relaxed whitespace-pre-line">
                    {featuredTestimonial.quote}
                  </div>

                  <div className="flex flex-wrap items-center gap-4 mt-6 pt-6 border-t border-slate-100">
                    <div className="flex items-center gap-1 text-amber-400">
                      {Array.from({ length: featuredTestimonial.stars }).map(
                        (_, i) => (
                          <Star
                            key={i}
                            className="w-4 h-4 fill-amber-400 text-amber-400"
                          />
                        ),
                      )}
                    </div>
                    <Badge
                      variant="secondary"
                      className="font-semibold text-xs bg-slate-100 text-slate-700"
                    >
                      {featuredTestimonial.program}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Arrows anchor to this box's true edges; it stays untouched by the
            overflow-hidden slide viewport nested inside it. */}
        <div
          className="testi-cards-wrap relative max-w-6xl mx-auto"
          onMouseEnter={() => {
            isPausedRef.current = true;
          }}
          onMouseLeave={() => {
            isPausedRef.current = false;
          }}
        >
          {/* Floating Left Arrow */}
          <button
            onClick={handlePrev}
            aria-label="Previous testimonials"
            className="absolute -left-3 sm:-left-5 top-1/2 -translate-y-1/2 z-30 w-9 h-9 rounded-full bg-white border border-slate-300 text-slate-500 hover:text-slate-900 hover:border-slate-400 hover:scale-105 shadow-md flex items-center justify-center transition-all duration-200"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Floating Right Arrow: mobile */}
          <button
            onClick={handleNext}
            aria-label="Next testimonials"
            className="md:hidden absolute -right-3 top-1/2 -translate-y-1/2 z-30 w-9 h-9 rounded-full bg-white border border-slate-300 text-slate-500 hover:text-slate-900 hover:border-slate-400 hover:scale-105 shadow-md flex items-center justify-center transition-all duration-200"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Floating Right Arrow: desktop */}
          <button
            onClick={handleNext}
            aria-label="Next testimonials"
            className="hidden md:flex absolute -right-4 sm:-right-5 top-1/2 -translate-y-1/2 z-30 w-9 h-9 rounded-full bg-white border border-slate-300 text-slate-500 hover:text-slate-900 hover:border-slate-400 hover:scale-105 shadow-md items-center justify-center transition-all duration-200"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Slide viewport — clips the two panels while they cross-fade so
              nothing overflows the card row's own width */}
          <div className="relative overflow-hidden">
            {outgoing && (
              <div
                ref={outgoingPanelRef}
                className="absolute inset-0 grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 pointer-events-none z-0"
              >
                {outgoing.items.map((item, idx) =>
                  renderCard(item, idx, false),
                )}
              </div>
            )}

            <div
              ref={currentPanelRef}
              className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8"
            >
              {visibleTestimonials.map((item, idx) =>
                renderCard(item, idx, true),
              )}
            </div>
          </div>
        </div>

        {/* Pagination Dots */}
        <div className="flex items-center justify-center gap-2.5 mt-10">
          {testimonials.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i, i >= currentIndex ? 1 : -1)}
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
