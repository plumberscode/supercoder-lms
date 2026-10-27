import type { Metadata } from "next";
import { cache } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  BookOpenText,
  CheckCircle2,
  Code2,
  Gift,
  Layers,
  Lock,
  MonitorSmartphone,
  Sparkles,
  Star,
  TreePine,
  Trophy,
} from "lucide-react";
import Navbar from "@/components/homepage/Navbar";
import Footer from "@/components/homepage/Footer";
import JsonLdScript from "@/components/seo/JsonLdScript";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createAdminClient } from "@/utils/supabase/admin";
import { BUSINESS, DEFAULT_OG_IMAGE, SITE_URL } from "@/lib/site";
import {
  characters,
  classFeatures,
  FALLBACK_TOTAL,
  faqs,
  freeFeatures,
  LOGIN_HREF,
  moduleOutcomes,
  PAGE_PATH,
  pageDescription,
  pageTitle,
  parentPoints,
  steps,
  trackOf,
  tracks,
  type Track,
} from "./data";

// Daftar modul gratis berubah hanya saat admin mencentang Teaser; cukup dimuat ulang per jam.
export const revalidate = 3600;

type FreeModule = { title: string; count: number; track: Track };

type ModuleRow = {
  title: string;
  order_index: number;
  subjects: { order_index: number };
  lessons: { id: string }[] | null;
};

const getFreeModules = cache(async (): Promise<FreeModule[]> => {
  try {
    const { data, error } = await createAdminClient()
      .from("modules")
      .select("title, order_index, programs, subjects!inner(is_active, order_index), lessons(id)")
      .contains("programs", ["teaser"])
      .eq("subjects.is_active", true);
    if (error) throw error;
    return ((data ?? []) as unknown as ModuleRow[])
      .sort(
        (a, b) =>
          a.subjects.order_index - b.subjects.order_index || a.order_index - b.order_index,
      )
      .map((m) => ({
        title: m.title,
        count: m.lessons?.length ?? 0,
        track: trackOf(m.title),
      }))
      .filter((m) => m.count > 0);
  } catch (error) {
    console.error("belajar-gratis: gagal memuat modul teaser", error);
    return [];
  }
});

async function getTotals() {
  const modules = await getFreeModules();
  const total = modules.reduce((sum, m) => sum + m.count, 0);
  return { modules, total: total || FALLBACK_TOTAL };
}

export async function generateMetadata(): Promise<Metadata> {
  const { total } = await getTotals();
  const title = pageTitle(total);
  const description = pageDescription(total);
  return {
    // absolute: judul sudah memuat brand, jangan ditambah template "| Supercoder" lagi
    title: { absolute: title },
    description,
    alternates: { canonical: PAGE_PATH },
    robots: { index: true, follow: true },
    openGraph: {
      type: "website",
      locale: "id_ID",
      url: PAGE_PATH,
      siteName: "Supercoder",
      title,
      description,
      images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: "Belajar coding gratis di LMS Supercoder" }],
    },
    twitter: { card: "summary_large_image", title, description, images: [DEFAULT_OG_IMAGE] },
  };
}

const primaryButtonClass =
  "w-full sm:w-auto h-auto py-3.5 px-7 sm:px-8 rounded-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-poppins font-semibold text-sm sm:text-base shadow-lg shadow-red-500/25 hover:shadow-xl hover:shadow-red-500/35 transition-all duration-200 hover:-translate-y-0.5";
const outlineButtonClass =
  "w-full sm:w-auto h-auto py-3.5 px-7 sm:px-8 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-poppins font-semibold text-sm sm:text-base shadow-xs";
const waButtonClass =
  "w-full sm:w-auto h-auto py-3.5 px-7 sm:px-8 rounded-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-poppins font-semibold text-sm sm:text-base shadow-lg shadow-emerald-500/25 transition-all duration-200 hover:-translate-y-0.5";
const h2Class = "font-poppins text-3xl sm:text-4xl font-bold text-slate-900 mb-4 leading-tight";
const leadClass = "font-sans text-base sm:text-lg text-slate-600 leading-relaxed";

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 mb-4">
      <span className="w-2 h-2 rounded-full bg-red-500" />
      <span className="font-poppins text-xs font-bold text-slate-500 uppercase tracking-widest">
        {children}
      </span>
    </div>
  );
}

function StartButton({ className = primaryButtonClass }: { className?: string }) {
  return (
    <Button asChild size="lg" className={className}>
      <Link href={LOGIN_HREF} className="inline-flex items-center justify-center !py-3.5 !px-6 sm:!px-8 no-underline">
        <span className="font-semibold">Masuk &amp; Mulai Gratis</span>
      </Link>
    </Button>
  );
}

// Cuplikan soal "Hitung Mundur Pembukaan" (Jojo Javascript Perulangan) sebagai visual hero.
function ExercisePreview() {
  const blank = "rounded bg-orange-500/20 text-orange-300 px-1 ring-1 ring-orange-400/40";
  const countdown = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
  return (
    <div className="relative w-full max-w-md mx-auto">
      <div className="rounded-3xl bg-[#1E1E1E] shadow-2xl shadow-slate-900/20 ring-1 ring-slate-900/10 overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-3 border-b border-white/10">
          <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
          <span className="ml-2 font-mono text-xs text-slate-400">Hitung Mundur Pembukaan · script.js</span>
        </div>
        <pre className="px-5 py-4 font-mono text-[13px] sm:text-sm leading-relaxed text-slate-200 overflow-x-auto">
          <code>
            <span className="text-sky-400">for</span> (<span className="text-sky-400">let</span> i ={" "}
            <span className={blank}>10</span>; i <span className={blank}>&gt;=</span> 1; i
            <span className={blank}>--</span>) {"{"}
            {"\n"}
            {"  "}console.<span className="text-amber-300">log</span>(i);
            {"\n"}
            {"}"}
            {"\n"}
            console.<span className="text-amber-300">log</span>(
            <span className="text-emerald-300">&apos;Class Meeting dimulai!&apos;</span>);
          </code>
        </pre>
        <div className="border-t border-white/10 bg-black/30 px-5 py-3">
          <p className="font-mono text-[11px] uppercase tracking-widest text-slate-500 mb-1.5">Console</p>
          <p className="font-mono text-xs sm:text-[13px] text-slate-300 leading-relaxed">
            {countdown.join("  ")}
            <br />
            Class Meeting dimulai!
          </p>
        </div>
      </div>
      <div className="absolute -bottom-5 -right-2 sm:-right-5 flex items-center gap-2 rounded-2xl bg-white px-4 py-3 shadow-xl ring-1 ring-slate-200/80">
        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
        <div>
          <p className="font-poppins text-sm font-bold text-slate-900 leading-tight">Nilai 100</p>
          <p className="font-sans text-xs font-semibold text-orange-600">+10 XP</p>
        </div>
      </div>
      <div className="absolute -top-4 -left-2 sm:-left-5 flex items-center gap-1.5 rounded-full bg-white px-3.5 py-2 shadow-lg ring-1 ring-slate-200/80">
        <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
        <span className="font-poppins text-xs font-bold text-slate-700">Latihan 1 dari 6</span>
      </div>
    </div>
  );
}

export default async function BelajarGratisPage() {
  const { modules, total } = await getTotals();
  const moduleCount = modules.length;
  const faqList = faqs(total);

  const stats = [
    { value: String(total), label: "latihan interaktif", icon: Code2 },
    { value: moduleCount ? String(moduleCount) : "10", label: "modul berurutan", icon: Layers },
    { value: "Rp 0", label: "tanpa biaya", icon: Gift },
    { value: "0", label: "install, cukup browser", icon: MonitorSmartphone },
  ];

  const grouped = (Object.keys(tracks) as Track[])
    .map((track) => ({ track, items: modules.filter((m) => m.track === track) }))
    .filter((g) => g.items.length > 0);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${SITE_URL}${PAGE_PATH}#faq`,
    mainEntity: faqList.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <>
      <JsonLdScript data={[jsonLd]} />
      <Navbar />
      <main className="bg-white">
        {/* Hero */}
        <section className="relative overflow-hidden pt-32 sm:pt-36 pb-20 px-5 bg-gradient-to-b from-white via-slate-50/50 to-slate-50">
          <div
            className="absolute top-0 left-10 w-[500px] h-[350px] pointer-events-none -translate-x-1/4 -translate-y-1/2"
            style={{ backgroundImage: "radial-gradient(circle, rgba(241,245,249,0.8), transparent 70%)" }}
          />
          <div
            className="absolute top-20 right-0 w-[450px] h-[350px] pointer-events-none translate-x-1/4"
            style={{ backgroundImage: "radial-gradient(circle, rgba(255,247,237,0.5), transparent 70%)" }}
          />
          <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-14 relative z-10">
            <div className="w-full lg:w-[52%] flex flex-col items-start text-left">
              <h1 style={{ animationDelay: "0ms" }} className="hero-elem font-poppins text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.15] mb-5">
                <span className="flex items-center gap-2 mb-6 text-xs font-bold text-slate-500 uppercase tracking-widest leading-normal">
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  Akses Gratis LMS Supercoder
                </span>
                {total} Latihan Coding,{" "}
                <span className="bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
                  Gratis
                </span>{" "}
                untuk Kamu Coba
              </h1>
              <p style={{ animationDelay: "60ms" }} className="hero-elem font-sans text-base sm:text-lg lg:text-xl text-slate-600 leading-relaxed mb-8 max-w-lg">
                Mulai dari HTML, CSS, sampai logika JavaScript. Tulis kode langsung di browser,
                langsung dinilai, dan kumpulkan XP setiap kali berhasil.
              </p>
              <div style={{ animationDelay: "120ms" }} className="hero-elem flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 sm:gap-4 w-full sm:w-auto">
                <StartButton />
                <Button asChild size="lg" className={outlineButtonClass}>
                  <a href="#materi" className="inline-flex items-center justify-center !py-3.5 !px-6 sm:!px-8 no-underline">
                    Lihat materinya ↓
                  </a>
                </Button>
              </div>
              <p style={{ animationDelay: "180ms" }} className="hero-elem font-sans text-sm text-slate-500 mt-4">
                Cukup masuk dengan akun Google. Tanpa biaya, tanpa install aplikasi.
              </p>
            </div>
            <div style={{ animationDelay: "120ms" }} className="hero-elem w-full lg:w-[44%] pt-4 pb-6 px-2">
              <ExercisePreview />
            </div>
          </div>
        </section>

        {/* Strip angka */}
        <section className="px-5 -mt-8 relative z-10">
          <ul className="max-w-6xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
            {stats.map((s) => (
              <li key={s.label} className="rounded-2xl border border-slate-200/80 bg-white shadow-md p-5 sm:p-6 flex items-center gap-4">
                <span className="hidden sm:flex w-11 h-11 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                  <s.icon className="w-5 h-5" />
                </span>
                <div>
                  <p className="font-poppins text-2xl sm:text-3xl font-black text-slate-900 leading-none">{s.value}</p>
                  <p className="font-sans text-xs sm:text-sm text-slate-500 mt-1.5">{s.label}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Materi */}
        {grouped.length > 0 && (
          <section id="materi" className="scroll-mt-24 py-24 px-5">
            <div className="max-w-6xl mx-auto">
              <div className="text-center max-w-2xl mx-auto mb-14">
                <Eyebrow>Apa yang akan kamu pelajari</Eyebrow>
                <h2 className={h2Class}>
                  Dari Halaman Pertama sampai <span className="text-red-500">Logika Pertamamu</span>
                </h2>
                <p className={leadClass}>
                  {total} latihan singkat 3–10 menit, disusun bertahap. Setiap latihan berisi satu
                  konsep, satu cerita, dan satu tantangan.
                </p>
              </div>

              <div className="space-y-12">
                {grouped.map(({ track, items }) => (
                  <div key={track}>
                    <div className="flex flex-wrap items-center gap-3 mb-5">
                      <Badge className={`${tracks[track].badge} border-0 px-3 py-1 rounded-full text-xs font-bold`}>
                        {tracks[track].label}
                      </Badge>
                      <h3 className="font-poppins text-lg sm:text-xl font-bold text-slate-900">{tracks[track].title}</h3>
                      <span className="font-sans text-sm text-slate-500">
                        {items.reduce((sum, m) => sum + m.count, 0)} latihan
                      </span>
                    </div>
                    <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {items.map((m) => (
                        <li key={m.title} className="group rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <p className="font-poppins text-base sm:text-lg font-bold text-slate-900 group-hover:text-red-600 transition-colors">
                              {m.title}
                            </p>
                            <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 font-sans text-xs font-semibold text-slate-600">
                              {m.count} latihan
                            </span>
                          </div>
                          {moduleOutcomes[m.title] && (
                            <p className="font-sans text-sm text-slate-600 leading-relaxed">{moduleOutcomes[m.title]}</p>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Cara belajar */}
        <section className="py-24 px-5 bg-slate-50">
          <div className="max-w-6xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <Eyebrow>Cara belajarnya</Eyebrow>
              <h2 className={h2Class}>
                Tiga Langkah di <span className="text-red-500">Setiap Latihan</span>
              </h2>
            </div>
            <ol className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {steps.map((s, i) => (
                <li key={s.title} className="rounded-3xl border border-slate-200/80 bg-white p-7 shadow-sm">
                  <span className="flex w-11 h-11 items-center justify-center rounded-2xl bg-gradient-to-r from-orange-500 to-red-500 font-poppins text-lg font-black text-white shadow-md shadow-red-500/20 mb-5">
                    {i + 1}
                  </span>
                  <h3 className="font-poppins text-lg font-bold text-slate-900 mb-2">{s.title}</h3>
                  <p className="font-sans text-sm sm:text-base text-slate-600 leading-relaxed">{s.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Cerita */}
        <section className="py-24 px-5">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-12 items-center">
            <div>
              <Eyebrow>Belajar lewat cerita</Eyebrow>
              <h2 className={h2Class}>
                Kenalan dengan <span className="text-red-500">Ponda</span> dan{" "}
                <span className="text-red-500">Jojo</span>
              </h2>
              <p className={leadClass}>
                Setiap soal adalah bagian dari cerita, jadi belajar coding terasa seperti
                menyelesaikan misi, bukan menghafal rumus.
              </p>
            </div>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {characters.map((c, i) => {
                const Icon = i === 0 ? TreePine : Trophy;
                return (
                  <li key={c.name} className="rounded-3xl border border-slate-200/80 bg-gradient-to-b from-orange-50/60 to-white p-7 shadow-sm">
                    <span className="flex w-12 h-12 items-center justify-center rounded-2xl bg-white text-orange-600 shadow-sm ring-1 ring-orange-100 mb-5">
                      <Icon className="w-6 h-6" />
                    </span>
                    <p className="font-poppins text-xl font-bold text-slate-900">{c.name}</p>
                    <p className="font-sans text-xs font-bold text-orange-600 uppercase tracking-wider mt-1 mb-3">{c.role}</p>
                    <p className="font-sans text-sm sm:text-base text-slate-600 leading-relaxed">{c.body}</p>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        {/* Orang tua */}
        <section className="py-24 px-5 bg-slate-50">
          <div className="max-w-4xl mx-auto text-center">
            <Eyebrow>Untuk orang tua</Eyebrow>
            <h2 className={h2Class}>Aman dan Terarah untuk Anak Anda</h2>
            <ul className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
              {parentPoints.map((p) => (
                <li key={p} className="flex items-start gap-3 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="font-sans text-sm sm:text-base text-slate-700 font-medium leading-relaxed">{p}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Gratis vs Kelas */}
        <section className="py-24 px-5">
          <div className="max-w-5xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <Eyebrow>Mulai gratis, lanjut kapan saja</Eyebrow>
              <h2 className={h2Class}>
                Akses Gratis vs <span className="text-red-500">Kelas Supercoder</span>
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="rounded-3xl border border-slate-200/80 bg-white p-7 sm:p-8 shadow-sm flex flex-col">
                <p className="font-poppins text-xl font-bold text-slate-900">Akses Gratis</p>
                <p className="font-sans text-sm text-slate-500 mt-1 mb-6">Rp 0, langsung aktif</p>
                <ul className="space-y-3 mb-8 flex-1">
                  {freeFeatures(total).map((f) => (
                    <li key={f} className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                      <span className="font-sans text-sm sm:text-base text-slate-700">{f}</span>
                    </li>
                  ))}
                </ul>
                <StartButton className={`${primaryButtonClass} sm:w-full`} />
              </div>
              <div className="relative rounded-3xl bg-slate-900 p-7 sm:p-8 shadow-xl flex flex-col">
                <Badge className="absolute -top-3 right-6 bg-gradient-to-r from-orange-500 to-red-500 text-white border-0 px-3 py-1 rounded-full text-xs font-bold">
                  Paling lengkap
                </Badge>
                <p className="font-poppins text-xl font-bold text-white">Kelas Supercoder</p>
                <p className="font-sans text-sm text-slate-400 mt-1 mb-6">Dibimbing instruktur</p>
                <ul className="space-y-3 mb-8 flex-1">
                  {classFeatures.map((f) => (
                    <li key={f} className="flex items-start gap-2.5">
                      <Lock className="w-5 h-5 text-orange-400 shrink-0" />
                      <span className="font-sans text-sm sm:text-base text-slate-200">{f}</span>
                    </li>
                  ))}
                </ul>
                <Button asChild size="lg" className={`${waButtonClass} sm:w-full`}>
                  <a
                    href={BUSINESS.whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2.5 !py-3.5 !px-6 text-white no-underline"
                  >
                    <Image src="/images/whatsapp.svg" alt="WhatsApp" width={22} height={22} className="w-5 h-5 shrink-0" />
                    <span className="text-white font-semibold">Konsultasi Kelas</span>
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ: <details> agar jawaban sudah ada di HTML sejak load awal */}
        <section id="faq" className="scroll-mt-28 py-20 px-5 bg-slate-50">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-10">
              <Eyebrow>FAQ</Eyebrow>
              <h2 className={h2Class}>Pertanyaan yang Sering Ditanyakan</h2>
            </div>
            <div className="space-y-3">
              {faqList.map((f) => (
                <details key={f.q} className="group rounded-2xl border border-slate-200 bg-white px-5 py-4 open:shadow-md">
                  <summary className="cursor-pointer list-none flex items-center justify-between gap-4">
                    <h3 className="font-poppins text-base sm:text-lg font-semibold text-slate-900">{f.q}</h3>
                    <span aria-hidden className="text-orange-600 text-xl transition-transform group-open:rotate-45">+</span>
                  </summary>
                  <p className="font-sans text-base text-slate-600 leading-relaxed mt-3">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* CTA penutup */}
        <section className="py-20 sm:py-24 px-5 bg-white">
          <div className="cta-card max-w-6xl mx-auto relative rounded-3xl sm:rounded-[36px] bg-gradient-to-r from-orange-500 via-red-500 to-rose-600 p-8 sm:p-14 lg:p-16 text-center text-white shadow-2xl shadow-red-500/25 overflow-hidden">
            <div
              className="absolute top-0 right-0 w-80 h-80 pointer-events-none translate-x-1/3 -translate-y-1/3"
              style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.1), transparent 70%)" }}
            />
            <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center">
              <Badge className="mb-6 px-4 py-1.5 rounded-full bg-white/20 text-white border-white/30 backdrop-blur-md font-bold text-xs tracking-wider">
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                GRATIS
              </Badge>
              <h2 className="font-poppins text-2xl sm:text-4xl lg:text-5xl font-black text-white leading-tight mb-6">
                Satu Soal Hari Ini, Satu Langkah Jadi Digital Builder.
              </h2>
              <p className="font-sans text-base sm:text-lg text-white/90 leading-relaxed max-w-2xl mb-10">
                {total} latihan sudah menunggumu. Masuk sekarang dan selesaikan soal pertamamu
                dalam 5 menit.
              </p>
              <StartButton className="w-full sm:w-auto h-auto py-3.5 px-7 sm:px-8 rounded-full bg-white hover:bg-slate-50 text-red-600 font-poppins font-semibold text-sm sm:text-base shadow-xl shadow-black/15 hover:shadow-2xl hover:scale-105 transition-all duration-200" />
              <p className="font-sans text-sm text-white/80 mt-5 inline-flex items-center gap-1.5">
                <BookOpenText className="w-4 h-4" />
                Sudah punya akun? Langsung masuk dengan akun yang sama.
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
