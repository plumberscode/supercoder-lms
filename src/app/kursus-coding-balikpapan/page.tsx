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
import { BUSINESS, BUSINESS_MAPS_EMBED_URL, DEFAULT_OG_IMAGE, SITE_URL } from "@/lib/site";
import {
  buildCourseJsonLd,
  buildLocalBusinessJsonLd,
  levels,
  programs,
} from "@/app/kursus-komputer-balikpapan/data";
import {
  audiences,
  faqs,
  PAGE_DESCRIPTION,
  PAGE_H1_LEAD,
  PAGE_H1_REST,
  PAGE_PATH,
  PAGE_TITLE,
  topics,
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
        alt: "Kursus coding dan AI di Balikpapan - Supercoder",
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
      { "@type": "ListItem", position: 2, name: "Kursus Coding Balikpapan", item: PAGE_URL },
    ],
  };

  return [buildLocalBusinessJsonLd(), faqPage, breadcrumb, ...buildCourseJsonLd()];
}

// Karya siswa (sama dengan KaryaSiswaSection homepage)
const portfolios = [
  {
    name: "Rig, kelas 8 SMP KPS",
    project: "Website kursus matematika bergaya Modern Playful UI",
    url: "https://rig-porto01-supercoder.netlify.app",
    image: "/images/karya/rig-mockup.webp",
    alt: "Website kursus matematika buatan Rig, siswa kursus coding Supercoder Balikpapan",
  },
  {
    name: "Maha, kelas 9 SMP AISBA",
    project: "Website kursus matematika bergaya premium",
    url: "https://maha-porto01-supercoder.netlify.app",
    image: "/images/karya/mahadria-mockup.webp",
    alt: "Website bergaya premium buatan Mahadria, siswa kursus coding Supercoder Balikpapan",
  },
  {
    name: "Naufal, mahasiswa ITEKA",
    project: "Website bergaya landing page SaaS",
    url: "https://naufal-porto01-supercoder.netlify.app",
    image: "/images/karya/naufal-mockup.webp",
    alt: "Website landing page SaaS buatan Naufal, alumni kursus coding Supercoder Balikpapan",
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

export default function KursusCodingBalikpapanPage() {
  return (
    <>
      <JsonLdScript data={buildJsonLd()} />
      <Navbar />
      <main className="bg-white" style={{ paddingTop: "88px" }}>
        {/* Hero */}
        <section className="px-5 pt-6 pb-14 bg-gradient-to-b from-white via-slate-50/50 to-slate-50">
          <div className="max-w-6xl mx-auto">
            <Breadcrumbs items={[{ name: "Beranda", href: "/" }, { name: "Kursus Coding Balikpapan" }]} />
            <div className="mt-8 flex flex-col lg:flex-row items-center gap-10 lg:gap-14">
              <div className="w-full lg:w-[55%]">
                <h1 className="font-poppins text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-[1.15] mb-6">
                  {PAGE_H1_LEAD}{" "}
                  <span className="bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
                    {PAGE_H1_REST}
                  </span>
                </h1>
                <p className={pClass}>
                  Supercoder adalah kursus coding Balikpapan untuk siswa SMP, SMA, mahasiswa, dan
                  umum yang ingin bisa membuat website dan aplikasi sendiri. Belajarnya dari nol:
                  mulai dari HTML dan CSS, lanjut ke logika JavaScript, sampai membangun aplikasi
                  web lengkap dengan bantuan AI.
                </p>
                <p className={pClass}>
                  Kelas tatap muka berlangsung setiap Minggu di {BUSINESS.fullAddress}, dengan maksimal 6 siswa per sesi. Bagi yang
                  jadwalnya padat atau tinggal di luar kota, ada kelas online privat 1-on-1.
                </p>
                <p className={`${pClass} mb-8`}>
                  Hasil akhirnya bukan sekadar sertifikat, tapi karya: website dan aplikasi nyata
                  yang bisa dibuka di browser dan dijadikan portofolio.
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
                      <span className="text-white font-semibold">Konsultasi</span>
                    </a>
                  </Button>
                  <Button asChild size="lg" className={daftarButtonClass}>
                    <Link href="/daftar" className="inline-flex items-center justify-center !py-3.5 !px-6 sm:!px-8 text-white no-underline">
                      <span className="text-white font-semibold">Daftar Kelas</span>
                    </Link>
                  </Button>
                </div>
              </div>
              <div className="w-full lg:w-[45%]">
                {/* Gambar di atas fold: tidak lazy-load */}
                <Image
                  src="/images/gallery/coding class balikpapan two.webp"
                  alt="Siswa praktik coding bersama mentor di kelas tatap muka kursus coding Supercoder Balikpapan"
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
          {/* Kenapa sekarang */}
          <section>
            <h2 className={h2Class}>Kenapa Belajar Coding di Balikpapan Sekarang?</h2>
            <p className={pClass}>
              Balikpapan tumbuh sebagai kota industri dan jasa sekaligus kota penyangga Ibu Kota
              Nusantara. Hampir semua sektor di Kalimantan Timur, dari energi, logistik, sampai
              pendidikan, kini bergantung pada sistem digital. Orang yang bisa membangun sistem itu,
              bukan hanya memakainya, akan selalu dicari.
            </p>
            <p className={pClass}>
              Coding juga melatih cara berpikir: memecah masalah besar menjadi langkah kecil,
              mencari penyebab error, dan menguji solusi. Kemampuan ini berguna di jurusan dan
              profesi apa pun, termasuk bagi yang nantinya tidak bekerja sebagai programmer.
            </p>
            <p className={pClass}>
              Di era AI, belajar coding justru makin penting. AI bisa menulis kode dengan cepat,
              tapi yang memahami fundamental coding-lah yang bisa mengarahkan AI, memeriksa
              hasilnya, dan memperbaikinya ketika salah.
            </p>
          </section>

          {/* Materi */}
          <section>
            <h2 className={h2Class}>Apa yang Dipelajari di Kursus Coding Ini?</h2>
            <p className={pClass}>
              Kurikulum disusun bertahap dalam tiga level, dari {levels[0].title} sampai{" "}
              {levels[levels.length - 1].title}. Berikut empat bagian utama yang dilalui setiap siswa.
            </p>
            <div className="space-y-8 mt-8">
              {topics.map((t) => (
                <div key={t.title}>
                  <h3 className={h3Class}>{t.title}</h3>
                  <p className={pClass}>{t.body}</p>
                </div>
              ))}
            </div>
            <p className={pClass}>
              Rincian tiap level, termasuk tools yang dipakai, juga dibahas di halaman{" "}
              <Link href="/kursus-komputer-balikpapan" className={linkClass}>
                Kursus Komputer Balikpapan
              </Link>
              .
            </p>
          </section>

          {/* Program & biaya */}
          <section>
            <h2 className={h2Class}>Pilihan Kelas dan Biaya Kursus</h2>
            <p className={pClass}>
              Semua kelas berdurasi 90 menit per sesi. Pilih format yang paling cocok dengan jadwal
              dan gaya belajar.
            </p>

            {/* Tabel di desktop */}
            <div className="hidden md:block overflow-x-auto my-8 rounded-2xl border border-slate-200">
              <table className="w-full text-left font-sans text-sm sm:text-base">
                <thead className="bg-slate-50 text-slate-700">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-semibold">Kelas</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Format</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Jadwal</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Biaya</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600">
                  {programs.map((p) => (
                    <tr key={p.title}>
                      <th scope="row" className="px-4 py-4 font-semibold text-slate-900">
                        <Link href={`/daftar?class=${encodeURIComponent(p.title)}`} className="hover:text-red-600">
                          {p.title}
                        </Link>
                      </th>
                      <td className="px-4 py-4">{p.format}</td>
                      <td className="px-4 py-4">{p.schedule}</td>
                      <td className="px-4 py-4 font-semibold text-slate-800">{p.priceLabel}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Card di mobile */}
            <ul className="md:hidden my-8 space-y-4">
              {programs.map((p) => (
                <li key={p.title} className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5">
                  <p className="font-poppins text-lg font-bold text-slate-900 mb-3">{p.title}</p>
                  <dl className="font-sans text-sm text-slate-600 space-y-1.5 mb-4">
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
              (QRIS, transfer bank, atau e-wallet). Untuk Custom Project Class, tim kami menghubungi
              Anda dulu untuk membahas ide dan biayanya. Lihat alurnya di halaman{" "}
              <Link href="/daftar" className={linkClass}>Daftar Kelas</Link>.
            </p>
          </section>

          {/* Untuk siapa */}
          <section>
            <h2 className={h2Class}>Kursus Ini Cocok untuk Siapa?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {audiences.map((a) => (
                <div key={a.title} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
                  <h3 className="font-poppins text-base sm:text-lg font-semibold text-slate-900 mb-2">{a.title}</h3>
                  <p className="font-sans text-sm sm:text-base text-slate-600 leading-relaxed">{a.body}</p>
                </div>
              ))}
            </div>
            <p className={`${pClass} mt-6`}>
              Untuk orang tua, ada{" "}
              <Link href="/blog/belajar-coding-untuk-anak-smp-sma" className={linkClass}>
                panduan belajar coding untuk SMP &amp; SMA
              </Link>{" "}
              yang membahas kapan anak siap mulai dan apa yang perlu diperhatikan.
            </p>
          </section>

          {/* Kenapa Supercoder */}
          <section>
            <h2 className={h2Class}>Kenapa Memilih Supercoder di Balikpapan?</h2>
            <ul className="font-sans text-base sm:text-lg text-slate-600 leading-relaxed space-y-3 list-disc pl-6 mb-8">
              <li>
                <strong className="text-slate-900">Ada kelas tatap muka di Balikpapan.</strong> Bukan
                hanya online: siswa belajar langsung bersama mentor dan teman sekelas, maksimal 6
                orang per sesi, sehingga setiap error bisa dibimbing satu per satu.
              </li>
              <li>
                <strong className="text-slate-900">Kurikulum berbasis praktik.</strong> Sejak pertemuan
                awal siswa langsung menulis kode dan membangun proyek, didukung latihan soal di
                portal belajar dengan penilaian otomatis dan leaderboard.
              </li>
              <li>
                <strong className="text-slate-900">Prestasi tingkat internasional.</strong> Rig, siswa
                kelas 8 SMP, meraih Bronze Medal di International Coding Olympiad 2026. Baca kisahnya
                di{" "}
                <Link href="/blog/rig-raih-medali-olimpiade-coding-internasional" className={linkClass}>
                  prestasi siswa Supercoder
                </Link>
                .
              </li>
              <li>
                <strong className="text-slate-900">Karya yang bisa dilihat.</strong> Portofolio siswa
                bukan tugas di atas kertas, tapi website yang online. Beberapa contohnya:
              </li>
            </ul>
            <ul className="grid grid-cols-1 sm:grid-cols-3 gap-5">
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
            <h2 className={h2Class}>Lokasi dan Jadwal Kelas</h2>
            <p className={pClass}>
              Kelas coding tatap muka Supercoder ada di {BUSINESS.fullAddress}. Kelas online bisa diikuti dari mana saja.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              <address className="not-italic">
                <ul className="font-sans text-base text-slate-600 space-y-3 list-disc pl-6">
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
                  <li>
                    <strong className="text-slate-900">Instagram:</strong>{" "}
                    <a href={BUSINESS.instagramUrl} target="_blank" rel="noopener noreferrer" className={linkClass}>
                      @supercoder_id
                    </a>
                  </li>
                  <li>
                    <strong className="text-slate-900">Peta:</strong>{" "}
                    <a href={BUSINESS.mapsUrl} target="_blank" rel="noopener noreferrer" className={linkClass}>
                      Buka di Google Maps
                    </a>
                  </li>
                </ul>
                <Image
                  src="/images/gallery/coding class balikpapan three.webp"
                  alt="Suasana kelas kursus coding tatap muka Supercoder di Balikpapan"
                  width={800}
                  height={800}
                  sizes="(min-width: 768px) 420px, 100vw"
                  className="w-full h-auto rounded-2xl object-cover mt-6"
                />
              </address>
              <iframe
                src={BUSINESS_MAPS_EMBED_URL}
                title="Peta lokasi kursus coding Supercoder di Kompleks Masjid An-Nasa'i, Jl. Syarifuddin Yoes, Balikpapan"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="w-full h-72 md:h-96 rounded-2xl border border-slate-200"
              />
            </div>
          </section>

          {/* FAQ: <details> agar jawaban sudah ada di HTML sejak load awal */}
          <section id="faq" className="scroll-mt-28">
            <h2 className={h2Class}>Pertanyaan yang Sering Ditanyakan</h2>
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
                Mulai dari Satu Sesi
              </h2>
              <p className="font-sans text-base sm:text-lg text-white/90 leading-relaxed mb-10">
                Aplikasi pertama selalu dimulai dari satu baris kode. Konsultasikan dulu level yang
                cocok untuk Anda atau anak Anda, gratis, lalu mulai belajar coding di Balikpapan
                bersama{" "}
                <Link href="/" className="text-white font-semibold underline underline-offset-2">
                  Kursus Coding &amp; AI Balikpapan
                </Link>{" "}
                Supercoder.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <Button asChild size="lg" className="h-auto py-3 px-6 rounded-full bg-white hover:bg-slate-50 text-red-600 font-poppins font-semibold text-sm shadow-xl">
                  <a href={BUSINESS.whatsappUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 text-red-600 no-underline">
                    <Image src="/images/whatsapp.svg" alt="WhatsApp" width={20} height={20} className="w-4 h-4 shrink-0" />
                    <span>Konsultasi gratis via WhatsApp</span>
                  </a>
                </Button>
                <Button asChild size="lg" className="h-auto py-3 px-6 rounded-full bg-white/15 hover:bg-white/25 border border-white/40 text-white font-poppins font-semibold text-sm">
                  <Link href="/daftar" className="text-white no-underline">Daftar Kelas</Link>
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
