import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import Navbar from "@/components/homepage/Navbar";
import Footer from "@/components/homepage/Footer";
import Breadcrumbs from "@/components/blog/Breadcrumbs";
import JsonLdScript from "@/components/seo/JsonLdScript";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BUSINESS, DEFAULT_OG_IMAGE, SITE_URL } from "@/lib/site";
import {
  buildCourseJsonLd,
  buildLocalBusinessJsonLd,
  levels,
  programs,
} from "@/app/kursus-komputer-balikpapan/data";
import {
  faqs,
  PAGE_DESCRIPTION,
  PAGE_H1_LEAD,
  PAGE_H1_REST,
  PAGE_PATH,
  PAGE_TITLE,
  parentBenefits,
  whySmp,
} from "./data";

export const metadata: Metadata = {
  // absolute: judul sudah memuat brand, jangan ditambah template "| Supercoder" lagi
  title: { absolute: PAGE_TITLE },
  description: PAGE_DESCRIPTION,
  alternates: { canonical: PAGE_PATH },
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: PAGE_PATH,
    siteName: "Supercoder",
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    images: [
      {
        url: DEFAULT_OG_IMAGE,
        width: 1200,
        height: 630,
        alt: "Kursus coding untuk anak SMP di Balikpapan - Supercoder",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    images: [DEFAULT_OG_IMAGE],
  },
};

const PAGE_URL = `${SITE_URL}${PAGE_PATH}`;

// Anak SMP cukup dua kelas reguler; Custom Project Class lebih cocok untuk siswa yang sudah punya ide project.
const smpPrograms = programs.filter((p) => p.price !== null);

// Level yang realistis dicapai di bangku SMP; Elite disebut sebagai lanjutan.
const smpLevels = levels.slice(0, 2);
const nextLevel = levels[2];

function buildJsonLd() {
  const faqPage = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${PAGE_URL}#faq`,
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Beranda", item: `${SITE_URL}/` },
      { "@type": "ListItem", position: 2, name: "Kursus Coding Balikpapan", item: `${SITE_URL}/kursus-coding-balikpapan` },
      { "@type": "ListItem", position: 3, name: "Kursus Coding SMP", item: PAGE_URL },
    ],
  };

  const courses = buildCourseJsonLd()
    .filter((c) => smpPrograms.some((p) => p.title === c.name))
    .map((c) => ({
      ...c,
      educationalLevel: "Sekolah Menengah Pertama (SMP)",
      audience: { "@type": "EducationalAudience", educationalRole: "student", audienceType: "Siswa SMP" },
    }));

  return [buildLocalBusinessJsonLd(), faqPage, breadcrumb, ...courses];
}

// Karya siswa SMP (data sama dengan KaryaSiswaSection homepage)
const portfolios = [
  {
    name: "Rig, kelas 8 SMP KPS",
    project: "Landing page kursus matematika bergaya Modern Playful UI",
    url: "https://rig-porto01-supercoder.netlify.app",
    image: "/images/karya/rig-mockup.webp",
    alt: "Landing page matematika buatan Rig, siswa SMP kursus coding Supercoder",
  },
  {
    name: "Maha, kelas 9 SMP AISBA",
    project: "Website kursus matematika bergaya premium",
    url: "https://maha-porto01-supercoder.netlify.app",
    image: "/images/karya/mahadria-mockup.webp",
    alt: "Website bergaya premium buatan Mahadria, siswa SMP kursus coding Supercoder",
  },
  {
    name: "Riffat, kelas 9 SMP IT Al-Firdaus",
    project: "Website sekolah, diikutkan lomba M-One Telkomsel Coding Competition",
    url: "https://smpit-al-firdaus.vercel.app/",
    image: "/images/karya/riffat-mockup.webp",
    alt: "Website sekolah buatan Riffat, siswa SMP kursus coding Supercoder",
  },
];

const waButtonClass =
  "w-full sm:w-auto h-auto py-3.5 px-7 sm:px-8 rounded-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-poppins font-semibold text-sm sm:text-base shadow-lg shadow-emerald-500/25 transition-all duration-200 hover:-translate-y-0.5";
const daftarButtonClass =
  "w-full sm:w-auto h-auto py-3.5 px-7 sm:px-8 rounded-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-poppins font-semibold text-sm sm:text-base shadow-lg shadow-red-500/25 transition-all duration-200 hover:-translate-y-0.5";
const linkClass = "font-medium text-orange-600 underline underline-offset-2 hover:text-red-600";
const h2Class = "font-poppins text-2xl sm:text-3xl font-bold text-slate-900 mb-5";
const h3Class = "font-poppins text-lg sm:text-xl font-semibold text-slate-900 mb-2";
const pClass = "font-sans text-base sm:text-lg text-slate-600 leading-relaxed mb-4";
const cardClass = "rounded-2xl border border-slate-200 bg-slate-50/60 p-5";
const cardTitleClass = "font-poppins text-base sm:text-lg font-semibold text-slate-900 mb-2";
const cardBodyClass = "font-sans text-sm sm:text-base text-slate-600 leading-relaxed";

export default function KursusCodingSmpPage() {
  return (
    <>
      <JsonLdScript data={buildJsonLd()} />
      <Navbar />
      <main className="bg-white" style={{ paddingTop: "88px" }}>
        {/* Hero */}
        <section className="px-5 pt-6 pb-14 bg-gradient-to-b from-white via-slate-50/50 to-slate-50">
          <div className="max-w-6xl mx-auto">
            <Breadcrumbs
              items={[
                { name: "Beranda", href: "/" },
                { name: "Kursus Coding Balikpapan", href: "/kursus-coding-balikpapan" },
                { name: "Kursus Coding SMP" },
              ]}
            />
            <div className="mt-8 flex flex-col lg:flex-row items-center gap-10 lg:gap-14">
              <div className="w-full lg:w-[55%]">
                <h1 className="font-poppins text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-[1.15] mb-6">
                  {PAGE_H1_LEAD}{" "}
                  <span className="bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
                    {PAGE_H1_REST}
                  </span>
                </h1>
                <p className={pClass}>
                  Supercoder membuka kelas coding untuk anak SMP di Balikpapan. Anak belajar dari
                  nol: menyusun halaman dengan HTML, mempercantiknya dengan CSS, lalu membuatnya
                  interaktif dengan JavaScript, sampai punya website buatan sendiri yang bisa
                  dibuka di browser.
                </p>
                <p className={pClass}>
                  Kelas tatap muka berlangsung setiap Minggu pagi di {BUSINESS.fullAddress}, maksimal
                  6 siswa per sesi. Untuk yang di luar Balikpapan, ada kelas online privat 1-on-1.
                </p>
                <p className={`${pClass} mb-8`}>
                  <strong className="text-slate-900">Mulai Rp 399.000/bulan</strong>, 1x seminggu
                  90 menit, dengan rapor bulanan untuk orang tua.
                </p>
                <div className="flex flex-col sm:flex-row gap-3.5 sm:gap-4">
                  <Button asChild size="lg" className={waButtonClass}>
                    <a
                      href={BUSINESS.whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2.5 !py-3.5 !px-6 sm:!px-8 text-white no-underline"
                    >
                      <Image src="/images/whatsapp.svg" alt="WhatsApp" width={22} height={22} className="w-5 h-5 shrink-0" />
                      <span className="text-white font-semibold">Konsultasi Gratis</span>
                    </a>
                  </Button>
                  <Button asChild size="lg" className={daftarButtonClass}>
                    <Link
                      href={`/daftar?class=${encodeURIComponent(smpPrograms[0].title)}`}
                      className="inline-flex items-center justify-center !py-3.5 !px-6 sm:!px-8 text-white no-underline"
                    >
                      <span className="text-white font-semibold">Daftarkan Anak</span>
                    </Link>
                  </Button>
                </div>
              </div>
              <div className="w-full lg:w-[45%]">
                {/* Gambar di atas fold: tidak lazy-load */}
                <Image
                  src="/images/gallery/coding class balikpapan one.webp"
                  alt="Siswa SMP praktik coding bersama mentor di kelas tatap muka Supercoder Balikpapan"
                  width={800}
                  height={800}
                  sizes="(min-width: 1024px) 480px, 100vw"
                  loading="eager"
                  fetchPriority="high"
                  className="w-full h-auto rounded-3xl object-cover shadow-xl"
                />
              </div>
            </div>
          </div>
        </section>

        <div className="max-w-4xl mx-auto px-5 py-14 space-y-16">
          {/* Kenapa usia SMP */}
          <section>
            <h2 className={h2Class}>Kenapa Usia SMP Pas untuk Mulai Belajar Coding?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {whySmp.map((w) => (
                <div key={w.title} className={cardClass}>
                  <h3 className={cardTitleClass}>{w.title}</h3>
                  <p className={cardBodyClass}>{w.body}</p>
                </div>
              ))}
            </div>
            <p className={`${pClass} mt-6`}>
              Masih menimbang? Baca{" "}
              <Link href="/blog/belajar-coding-untuk-anak-smp-sma" className={linkClass}>
                panduan orang tua tentang belajar coding untuk anak SMP &amp; SMA
              </Link>{" "}
              yang membahas bahasa pertama, lama belajar, dan cara memilih kursus.
            </p>
          </section>

          {/* Materi */}
          <section>
            <h2 className={h2Class}>Apa yang Dipelajari Anak SMP?</h2>
            <p className={pClass}>
              Kurikulum Supercoder bertahap. Di bangku SMP, anak umumnya menempuh dua level
              pertama:
            </p>
            <div className="space-y-8 mt-8">
              {smpLevels.map((l) => (
                <div key={l.title}>
                  <h3 className={h3Class}>
                    {l.title}: {l.subtitle}
                  </h3>
                  <p className={pClass}>{l.body}</p>
                </div>
              ))}
            </div>
            <p className={pClass}>
              Setelah itu anak bisa lanjut ke {nextLevel.title} ({nextLevel.subtitle}): membangun
              aplikasi web dengan Next.js, database, dan workflow AI. Kecepatan tiap anak berbeda;
              yang terpenting adalah belajar rutin setiap minggu.
            </p>
          </section>

          {/* Program & biaya */}
          <section>
            <h2 className={h2Class}>Jadwal dan Biaya Kursus Coding SMP</h2>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-5 my-8">
              {smpPrograms.map((p) => (
                <li key={p.title} className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5 flex flex-col">
                  <h3 className="font-poppins text-lg font-bold text-slate-900 mb-3">{p.title}</h3>
                  <dl className="font-sans text-sm sm:text-base text-slate-600 space-y-1.5 mb-5 flex-1">
                    <div><dt className="inline font-medium text-slate-500">Format: </dt><dd className="inline">{p.format}</dd></div>
                    <div><dt className="inline font-medium text-slate-500">Jadwal: </dt><dd className="inline">{p.schedule}</dd></div>
                    <div><dt className="inline font-medium text-slate-500">Biaya: </dt><dd className="inline font-semibold text-slate-800">{p.priceLabel}</dd></div>
                  </dl>
                  <Button asChild className="w-full h-11 rounded-2xl bg-gradient-to-r from-orange-500 to-red-500 text-white font-poppins font-semibold">
                    <Link href={`/daftar?class=${encodeURIComponent(p.title)}`}>{p.cta}</Link>
                  </Button>
                </li>
              ))}
            </ul>
            <p className={pClass}>
              Biaya yang dibayar saat mendaftar adalah biaya bulan pertama, lewat pembayaran online
              (QRIS, transfer bank, atau e-wallet). Ingin anak mencoba dulu? Ada{" "}
              <Link href="/belajar-gratis" className={linkClass}>latihan coding gratis</Link>{" "}
              yang bisa dikerjakan langsung di browser.
            </p>
          </section>

          {/* Untuk orang tua */}
          <section>
            <h2 className={h2Class}>Yang Didapat Orang Tua</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {parentBenefits.map((b) => (
                <div key={b.title} className={cardClass}>
                  <h3 className={cardTitleClass}>{b.title}</h3>
                  <p className={cardBodyClass}>{b.body}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Karya siswa SMP */}
          <section>
            <h2 className={h2Class}>Karya Siswa SMP Supercoder</h2>
            <p className={pClass}>
              Bukti paling jujur kualitas sebuah kelas adalah karya siswanya. Ini website yang
              dibuat siswa SMP Supercoder dan bisa dibuka siapa saja. Rig bahkan meraih Bronze
              Medal di International Coding Olympiad 2026; baca{" "}
              <Link href="/blog/rig-raih-medali-olimpiade-coding-internasional" className={linkClass}>
                kisah prestasinya
              </Link>
              .
            </p>
            <ul className="grid grid-cols-1 sm:grid-cols-3 gap-5 mt-6">
              {portfolios.map((p) => (
                <li key={p.url} className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                  <a href={p.url} target="_blank" rel="noopener" className="block group">
                    <div className="relative aspect-[4/3] bg-slate-100">
                      <Image src={p.image} alt={p.alt} fill sizes="(min-width: 640px) 280px, 100vw" className="object-cover" />
                    </div>
                    <div className="p-4">
                      <p className="font-poppins font-semibold text-slate-900 group-hover:text-red-600">{p.name}</p>
                      <p className="font-sans text-sm text-slate-600">{p.project}</p>
                    </div>
                  </a>
                </li>
              ))}
            </ul>
          </section>

          {/* Lokasi */}
          <section id="lokasi" className="scroll-mt-28">
            <h2 className={h2Class}>Lokasi Kelas di Balikpapan</h2>
            <address className="not-italic">
              <ul className="font-sans text-base sm:text-lg text-slate-600 space-y-3 list-disc pl-6">
                <li>
                  <strong className="text-slate-900">Alamat:</strong> {BUSINESS.fullAddress} (
                  <a href={BUSINESS.mapsUrl} target="_blank" rel="noopener noreferrer" className={linkClass}>
                    Google Maps
                  </a>
                  )
                </li>
                {BUSINESS.schedule.map((s) => (
                  <li key={s.label}>
                    <strong className="text-slate-900">{s.label}:</strong> {s.value}
                  </li>
                ))}
                <li>
                  <strong className="text-slate-900">WhatsApp:</strong>{" "}
                  <a href={BUSINESS.whatsappUrl} target="_blank" rel="noopener noreferrer" className={linkClass}>
                    {BUSINESS.phoneDisplay}
                  </a>
                </li>
              </ul>
            </address>
            <p className={`${pClass} mt-6`}>
              Supercoder juga menerima siswa SMA, mahasiswa, dan umum. Lihat semua kelas di halaman{" "}
              <Link href="/kursus-coding-balikpapan" className={linkClass}>Kursus Coding Balikpapan</Link>.
            </p>
          </section>

          {/* FAQ: <details> agar jawaban sudah ada di HTML sejak load awal */}
          <section id="faq" className="scroll-mt-28">
            <h2 className={h2Class}>Pertanyaan Orang Tua</h2>
            <div className="space-y-3">
              {faqs.map((f) => (
                <details key={f.q} className="group rounded-2xl border border-slate-200 bg-white px-5 py-4 open:shadow-md">
                  <summary className="cursor-pointer list-none flex items-center justify-between gap-4">
                    <h3 className="font-poppins text-base sm:text-lg font-semibold text-slate-900">{f.q}</h3>
                    <span aria-hidden className="text-orange-600 text-xl transition-transform group-open:rotate-45">+</span>
                  </summary>
                  <p className="font-sans text-base text-slate-600 leading-relaxed mt-3">{f.a}</p>
                </details>
              ))}
            </div>
          </section>
        </div>

        {/* CTA penutup */}
        <section className="py-16 px-5 bg-white">
          <div className="max-w-6xl mx-auto rounded-3xl sm:rounded-[36px] bg-gradient-to-r from-orange-500 via-red-500 to-rose-600 p-8 sm:p-14 text-center text-white shadow-2xl shadow-red-500/25">
            <div className="max-w-3xl mx-auto flex flex-col items-center">
              <Badge className="mb-6 px-4 py-1.5 rounded-full bg-white/20 text-white border-white/30 font-bold text-xs tracking-wider">
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                KONSULTASI GRATIS
              </Badge>
              <h2 className="font-poppins text-2xl sm:text-4xl font-black text-white leading-tight mb-6">
                Website Pertama Anak Dimulai dari Satu Sesi
              </h2>
              <p className="font-sans text-base sm:text-lg text-white/90 leading-relaxed mb-10">
                Ceritakan minat dan kelas anak Anda, mentor kami bantu menentukan level yang pas.
                Gratis, tanpa kewajiban mendaftar.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <Button asChild size="lg" className="h-auto py-3 px-6 rounded-full bg-white hover:bg-slate-50 text-red-600 font-poppins font-semibold text-sm shadow-xl">
                  <a href={BUSINESS.whatsappUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 text-red-600 no-underline">
                    <Image src="/images/whatsapp.svg" alt="WhatsApp" width={20} height={20} className="w-4 h-4 shrink-0" />
                    <span>Konsultasi gratis via WhatsApp</span>
                  </a>
                </Button>
                <Button asChild size="lg" className="h-auto py-3 px-6 rounded-full bg-white/15 hover:bg-white/25 border border-white/40 text-white font-poppins font-semibold text-sm">
                  <Link href={`/daftar?class=${encodeURIComponent(smpPrograms[0].title)}`} className="text-white no-underline">
                    Daftarkan Anak
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer showLocalLinks />
    </>
  );
}
