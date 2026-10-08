"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, ArrowRight, Code2 } from "lucide-react";

interface StudentProject {
  name: string;
  school: string;
  project: string;
  desc: string;
  url: string;
  /** Live-website CTA — hidden for internal/private projects (e.g. Citra's). */
  showCta?: boolean;
  gradient: string;
  /** Real screenshot, when available — falls back to the gradient tile otherwise. */
  image?: string;
}

const projects: StudentProject[] = [
  {
    name: "Rig Marjanul",
    school: "Kelas 8 SMP, KPS Balikpapan",
    project: "Landing Page Matematika",
    desc: "Website pendaftaran kursus matematika dengan gaya Modern Playful UI.",
    url: "https://rig-porto01-supercoder.netlify.app",
    gradient: "from-orange-400 via-amber-400 to-orange-300",
    image: "/images/karya/rig-mockup.webp",
  },
  {
    name: "Mahadria Althafurrahman",
    school: "Kelas 9 SMP, AISBA Balikpapan",
    project: "Dark Luxury Website",
    desc: "Maha mengembangkan website kursus matematika dengan menggunakan gaya yang premium dan berkelas.",
    url: "https://maha-porto01-supercoder.netlify.app",
    gradient: "from-slate-800 via-slate-700 to-slate-600",
    image: "/images/karya/mahadria-mockup.webp",
  },
  {
    name: "Naufal Brata Pratama",
    school: "Mahasiswa Bisnis Digital ITEKA, Balikpapan",
    project: "Friendly EdTech UI",
    desc: "Website bergaya modern dengan struktur khas landing page SaaS: Hero, Method, Features, Testimonials, CTA, Footer.",
    url: "https://naufal-porto01-supercoder.netlify.app",
    gradient: "from-cyan-500 via-sky-500 to-blue-500",
    image: "/images/karya/naufal-mockup.webp",
  },
  {
    name: "Citra Smaradahana",
    school: "Karyawan Swasta, Sektor Pertambangan",
    project: "Maintenance & Monitoring Service",
    desc: "Aplikasi web internal perusahaan yang dikembangkan solo untuk menunjang kegiatan pemeliharaan dan perawatan berkala.",
    url: "#",
    showCta: false,
    gradient: "from-emerald-500 via-teal-500 to-emerald-400",
    image: "/images/karya/citra-mockup.webp",
  },
];

export default function KaryaSiswaSection() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const handleScroll = () => {
    const el = trackRef.current;
    if (!el) return;

    let closest = 0;
    let minDist = Infinity;
    Array.from(el.children).forEach((child, i) => {
      const dist = Math.abs((child as HTMLElement).offsetLeft - el.scrollLeft);
      if (dist < minDist) {
        minDist = dist;
        closest = i;
      }
    });

    const nextAtStart = el.scrollLeft <= 6;
    const nextAtEnd = el.scrollLeft >= el.scrollWidth - el.clientWidth - 1;

    setActiveIndex((prev) => (prev === closest ? prev : closest));
    setAtStart((prev) => (prev === nextAtStart ? prev : nextAtStart));
    setAtEnd((prev) => (prev === nextAtEnd ? prev : nextAtEnd));
  };

  useEffect(() => {
    handleScroll();
    window.addEventListener("resize", handleScroll);
    return () => window.removeEventListener("resize", handleScroll);
  }, []);

  const scrollByCards = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    const card = el.firstElementChild as HTMLElement | null;
    const gap = 24;
    const amount = (card ? card.getBoundingClientRect().width : el.clientWidth / 3) + gap;
    el.scrollBy({ left: dir * amount, behavior: "smooth" });
  };

  const goToSlide = (index: number) => {
    const el = trackRef.current;
    if (!el) return;
    const card = el.children[index] as HTMLElement | undefined;
    if (card) {
      el.scrollTo({ left: card.offsetLeft - el.offsetLeft, behavior: "smooth" });
    }
  };

  return (
    <section
      className="py-24 sm:py-28 lg:py-32 px-5 bg-white relative overflow-hidden"
      id="karya-siswa"
    >
      <div className="max-w-6xl mx-auto">
        <div className="karya-header flex flex-col items-center text-center max-w-2xl mx-auto mb-14 sm:mb-16">
          <div className="inline-flex items-center gap-2 mb-4">
            <span className="w-2 h-2 rounded-full bg-orange-500" />
            <span className="font-poppins text-xs font-bold text-slate-500 uppercase tracking-widest">
              Portofolio Siswa
            </span>
          </div>
          <h2 className="font-poppins text-3xl sm:text-4xl font-bold text-slate-900 mb-4 leading-tight">
            Dari Belajar <span className="text-orange-500">Jadi Membangun</span>
          </h2>
          <p className="font-sans text-base sm:text-lg text-slate-600">
            Suatu hari, kami memberikan tugas yang sama ke seluruh siswa,
            membangun website Kursus Matematika, dan mereka mengembangkan
            dengan &lsquo;style&rsquo; yang berbeda-beda. Ada juga seorang
            karyawan non-IT yang telah berhasil membangun beberapa aplikasi
            yang digunakan sebagai internal tool di perusahaannya.
          </p>
        </div>

        <div className="karya-track-wrap relative">
          {/* Floating arrows — desktop/tablet only, mobile relies on swipe */}
          {!atStart && (
            <button
              onClick={() => scrollByCards(-1)}
              aria-label="Sebelumnya"
              className="hidden sm:flex absolute -left-4 lg:-left-5 top-[calc(50%-52px)] -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white border border-slate-200 items-center justify-center shadow-md hover:bg-orange-500 hover:border-orange-500 [&:hover_svg]:stroke-white transition-colors duration-200"
            >
              <ChevronLeft className="w-4 h-4 text-slate-700" />
            </button>
          )}
          {!atEnd && (
            <button
              onClick={() => scrollByCards(1)}
              aria-label="Berikutnya"
              className="hidden sm:flex absolute -right-4 lg:-right-5 top-[calc(50%-52px)] -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white border border-slate-200 items-center justify-center shadow-md hover:bg-orange-500 hover:border-orange-500 [&:hover_svg]:stroke-white transition-colors duration-200"
            >
              <ChevronRight className="w-4 h-4 text-slate-700" />
            </button>
          )}

          <div
            ref={trackRef}
            onScroll={handleScroll}
            className="karya-track flex gap-6 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {projects.map((p) => (
              <a
                key={p.name}
                href={p.url}
                {...(p.url.startsWith("http")
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
                className="group karya-card snap-start shrink-0 basis-[88%] sm:basis-[46%] lg:basis-[calc((100%-48px)/3)] flex flex-col bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-orange-500/40 transition-all duration-300"
              >
                <div className="relative aspect-[16/10] bg-slate-100 overflow-hidden">
                  {p.image ? (
                    <Image
                      src={p.image}
                      alt={`Screenshot ${p.project} oleh ${p.name}`}
                      fill
                      sizes="(max-width: 640px) 88vw, (max-width: 1024px) 46vw, 380px"
                      className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${p.gradient} flex flex-col items-center justify-center gap-2`}
                    >
                      <Code2 className="w-7 h-7 text-white/85" strokeWidth={1.6} />
                      <span className="font-poppins text-xs font-semibold text-white/90 text-center px-6">
                        {p.project}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-3 p-6">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-sans text-sm font-semibold text-slate-700">
                      {p.name}
                    </span>
                    <span className="font-sans text-xs text-slate-500">
                      {p.school}
                    </span>
                  </div>
                  <h3 className="font-poppins text-lg font-bold text-slate-900 leading-snug">
                    {p.project}
                  </h3>
                  <p className="font-sans text-sm text-slate-600 leading-relaxed">
                    {p.desc}
                  </p>
                  {p.showCta !== false && (
                    <span className="mt-1 inline-flex items-center gap-1.5 font-sans text-sm font-semibold text-orange-600">
                      Lihat Website
                      <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                    </span>
                  )}
                </div>
              </a>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 mt-10">
          {projects.map((p, i) => (
            <button
              key={p.name}
              onClick={() => goToSlide(i)}
              aria-label={`Portofolio slide ${i + 1}`}
              className="group flex h-6 min-w-6 items-center justify-center"
            >
              <span
                className={`block h-2 rounded-full transition-all duration-300 ${
                  i === activeIndex
                    ? "w-6 bg-orange-500"
                    : "w-2 bg-slate-300 group-hover:bg-slate-400"
                }`}
              />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
