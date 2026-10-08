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
import {
  BUSINESS,
  BUSINESS_MAPS_EMBED_URL,
  DEFAULT_OG_IMAGE,
  ORG_ID,
  SITE_LOGO,
  SITE_URL,
} from "@/lib/site";
import {
  faqs,
  levels,
  partnerLogos,
  PAGE_DESCRIPTION,
  PAGE_PATH,
  PAGE_TITLE,
  programs,
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
        alt: "Kursus komputer coding dan AI di Balikpapan - Supercoder",
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
  const organization = {
    "@context": "https://schema.org",
    "@type": ["EducationalOrganization", "LocalBusiness"],
    "@id": ORG_ID,
    name: BUSINESS.name,
    url: SITE_URL,
    logo: SITE_LOGO,
    telephone: BUSINESS.phone,
    // NAP identik dengan schema homepage (satu @id, jangan bertentangan)
    address: {
      "@type": "PostalAddress",
      streetAddress: BUSINESS.streetAddress,
      addressLocality: BUSINESS.city,
      addressRegion: BUSINESS.region,
      addressCountry: BUSINESS.country,
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: BUSINESS.geo.lat,
      longitude: BUSINESS.geo.lng,
    },
    sameAs: [BUSINESS.instagramUrl],
  };

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
      { "@type": "ListItem", position: 2, name: "Kursus Komputer Balikpapan", item: PAGE_URL },
    ],
  };

  const courses = programs.map((p) => ({
    "@context": "https://schema.org",
    "@type": "Course",
    name: p.title,
    description: p.schemaDescription,
    provider: { "@type": "EducationalOrganization", "@id": ORG_ID, name: BUSINESS.name, url: SITE_URL },
    ...(p.price
      ? {
          offers: {
            "@type": "Offer",
            price: p.price,
            priceCurrency: "IDR",
            url: `${SITE_URL}/daftar?class=${encodeURIComponent(p.title)}`,
          },
        }
      : {}),
  }));

  return [organization, faqPage, breadcrumb, ...courses];
}

const waButtonClass =
  "w-full sm:w-auto h-auto py-3.5 px-7 sm:px-8 rounded-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-poppins font-semibold text-sm sm:text-base shadow-lg shadow-emerald-500/25 transition-all duration-200 hover:-translate-y-0.5";
const daftarButtonClass =
  "w-full sm:w-auto h-auto py-3.5 px-7 sm:px-8 rounded-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-poppins font-semibold text-sm sm:text-base shadow-lg shadow-red-500/25 transition-all duration-200 hover:-translate-y-0.5";
const linkClass = "font-medium text-orange-600 underline underline-offset-2 hover:text-red-600";
const h2Class = "font-poppins text-2xl sm:text-3xl font-bold text-slate-900 mb-5";
const pClass = "font-sans text-base sm:text-lg text-slate-600 leading-relaxed mb-4";

export default function KursusKomputerBalikpapanPage() {
  return (
    <>
      <JsonLdScript data={buildJsonLd()} />
      <Navbar />
      <main className="bg-white" style={{ paddingTop: "calc(var(--promo-bar-height, 0px) + 88px)" }}>
        {/* Hero */}
        <section className="px-5 pt-6 pb-14 bg-gradient-to-b from-white via-slate-50/50 to-slate-50">
          <div className="max-w-6xl mx-auto">
            <Breadcrumbs
              items={[{ name: "Beranda", href: "/" }, { name: "Kursus Komputer Balikpapan" }]}
            />
            <div className="mt-8 flex flex-col lg:flex-row items-center gap-10 lg:gap-14">
              <div className="w-full lg:w-[55%]">
                <h1 className="font-poppins text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-[1.15] mb-6">
                  Kursus Komputer Balikpapan:{" "}
                  <span className="bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
                    Belajar Coding &amp; AI dari Nol sampai Bikin Aplikasi
                  </span>
                </h1>
                <p className={pClass}>
                  Mencari kursus komputer di Balikpapan untuk anak atau untuk diri sendiri? Di
                  Supercoder, &quot;belajar komputer&quot; artinya belajar membuat sesuatu dengan
                  komputer: website, aplikasi web, sampai tools kerja sendiri, dengan bantuan AI.
                </p>
                <p className={pClass}>
                  Kelas tatap muka berlangsung setiap Minggu di Jl. Syarifuddin Yoes (Kompleks
                  Masjid An-Nasa&apos;i), Balikpapan. Ada juga kelas online privat 1-on-1 yang
                  jadwalnya fleksibel. Pesertanya mulai dari siswa SMP, SMA, mahasiswa, sampai
                  karyawan yang sama sekali belum pernah coding.
                </p>
                <p className={`${pClass} mb-8`}>
                  Artikel ini membahas apa yang dipelajari, pilihan kelas dan biayanya, untuk siapa
                  kelas ini cocok, dan cara memilih kursus komputer yang tepat di Balikpapan.
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
                      <span className="text-white font-semibold">Daftar</span>
                    </Link>
                  </Button>
                </div>
              </div>
              <div className="w-full lg:w-[45%]">
                {/* Gambar di atas fold: tidak lazy-load */}
                <Image
                  src="/images/gallery/coding class balikpapan one.webp"
                  alt="Siswa belajar coding di kelas tatap muka Supercoder, kursus komputer di Balikpapan"
                  width={800}
                  height={600}
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
          {/* Kursus komputer zaman sekarang */}
          <section>
            <h2 className={h2Class}>Kursus Komputer Zaman Sekarang: Bukan Lagi Sekadar Mengetik dan Office</h2>
            <p className={pClass}>
              Dulu, kursus komputer identik dengan belajar mengetik, Microsoft Word, dan Excel.
              Sekarang hampir semua anak SMP sudah lancar memakai laptop dan HP, jadi skill yang
              membedakan bukan lagi &quot;bisa pakai komputer&quot;, tapi &quot;bisa membuat
              sesuatu dengan komputer&quot;.
            </p>
            <p className={pClass}>
              Supercoder tidak mengajarkan Microsoft Office atau kelas mengetik. Kalau itu yang
              kamu butuhkan, kursus komputer umum lebih cocok. Tapi kalau tujuannya memahami cara
              kerja teknologi dan membangun website atau aplikasi sendiri, di sinilah tempatnya.
            </p>
            <p className={pClass}>
              Bedanya dengan sekadar meminta AI membuatkan kode: siswa belajar coding fundamentals
              dulu. Dengan begitu mereka paham logika di balik kode hasil AI, bisa memperbaiki error
              sendiri, dan memegang kendali penuh atas project yang dibangun. AI dipakai sebagai
              partner, bukan pengganti berpikir.
            </p>
          </section>

          {/* Kurikulum */}
          <section>
            <h2 className={h2Class}>Apa yang Dipelajari di Kursus Ini?</h2>
            <p className={pClass}>
              Kurikulum Supercoder dibagi tiga level berurutan, dari memahami web sampai membangun
              aplikasi nyata dengan AI (
              <Link href="/#journey" className={linkClass}>lihat Coding Journey</Link>).
            </p>
            <ol className="grid grid-cols-1 md:grid-cols-3 gap-5 my-8">
              {levels.map((lv, i) => (
                <li key={lv.title} className="rounded-3xl border border-slate-200/80 bg-white shadow-md overflow-hidden flex flex-col">
                  <div className="relative w-full h-40 bg-slate-100">
                    <Image src={lv.image} alt={lv.alt} fill sizes="(min-width: 768px) 300px, 100vw" className="object-cover" />
                  </div>
                  <div className="p-5">
                    <p className="font-poppins text-xs font-bold text-orange-600 uppercase tracking-widest mb-1">
                      Level {i + 1}
                    </p>
                    <p className="font-poppins text-lg font-bold text-slate-900 mb-2">
                      {lv.title}: {lv.subtitle}
                    </p>
                    <p className="font-sans text-sm sm:text-base text-slate-600 leading-relaxed">{lv.body}</p>
                  </div>
                </li>
              ))}
            </ol>
            <p className={pClass}>
              Tools yang dipakai adalah standar industri: VS Code sebagai code editor, Figma untuk
              merancang tampilan, AI coding assistant untuk eksplorasi dan debugging, serta
              database Postgres berbasis cloud.
            </p>
            <p className={pClass}>
              Hasilnya bukan sertifikat saja, tapi karya. Contohnya website kursus matematika buatan{" "}
              <a href="https://rig-porto01-supercoder.netlify.app" target="_blank" rel="noopener" className={linkClass}>
                Rig, kelas 8 SMP KPS
              </a>{" "}
              dan{" "}
              <a href="https://maha-porto01-supercoder.netlify.app" target="_blank" rel="noopener" className={linkClass}>
                Maha, kelas 9 SMP AISBA
              </a>
              : tugasnya sama, gayanya berbeda total.
            </p>
          </section>

          {/* Program & biaya */}
          <section>
            <h2 className={h2Class}>Pilihan Kelas dan Biaya Kursus</h2>
            <p className={pClass}>
              Ada tiga format kelas, semuanya 90 menit per sesi. Biaya kursus komputer (coding) di
              Supercoder mulai Rp 449.000 per bulan.
            </p>

            {/* Tabel di desktop */}
            <div className="hidden md:block overflow-x-auto my-8 rounded-2xl border border-slate-200">
              <table className="w-full text-left font-sans text-sm sm:text-base">
                <thead className="bg-slate-50 text-slate-700">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-semibold">Program</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Format</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Jadwal</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Biaya</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Daftar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600">
                  {programs.map((p) => (
                    <tr key={p.title}>
                      <th scope="row" className="px-4 py-4 font-semibold text-slate-900">{p.title}</th>
                      <td className="px-4 py-4">{p.format}</td>
                      <td className="px-4 py-4">{p.schedule}</td>
                      <td className="px-4 py-4 font-semibold text-slate-800">{p.priceLabel}</td>
                      <td className="px-4 py-4">
                        <Link href={`/daftar?class=${encodeURIComponent(p.title)}`} className={linkClass}>
                          {p.cta}
                        </Link>
                      </td>
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

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              {programs.map((p) => (
                <div key={p.title} className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-slate-100">
                  <Image src={p.image} alt={p.alt} fill sizes="(min-width: 640px) 260px, 100vw" className="object-cover" />
                </div>
              ))}
            </div>

            <p className={pClass}>
              Weekend Coding Class cocok untuk yang ingin suasana kelas dan teman belajar. Premium
              Online Class cocok untuk yang jadwalnya padat atau tinggal di luar Balikpapan; salah
              satu siswanya dari Samarinda sudah belajar 2 tahun secara online. Custom Project Class
              untuk yang sudah punya ide website atau aplikasi dan ingin langsung membangunnya
              bersama mentor.
            </p>
          </section>

          {/* Cocok untuk siapa */}
          <section>
            <h2 className={h2Class}>Kursus Ini Cocok untuk Siapa?</h2>
            <p className={pClass}>
              Kurikulumnya dirancang untuk pemula total, jadi tidak perlu pengalaman coding atau
              pemahaman AI sebelumnya.
            </p>
            <ul className="font-sans text-base sm:text-lg text-slate-600 leading-relaxed space-y-3 list-disc pl-6 mb-6">
              <li>
                <strong className="text-slate-900">Siswa SMP.</strong> Usia yang pas untuk mulai
                memahami logika dan membuat website pertama. Orang tua bisa membaca{" "}
                <Link href="/blog/belajar-coding-untuk-anak-smp-sma" className={linkClass}>
                  panduan belajar coding untuk anak SMP &amp; SMA
                </Link>{" "}
                sebelum memilih kelas.
              </li>
              <li>
                <strong className="text-slate-900">Siswa SMA dan mahasiswa.</strong> Bekal portofolio
                nyata untuk kuliah, lomba, atau kerja. Naufal, alumni SMAN 1 Balikpapan yang kini
                kuliah Bisnis Digital di ITEKA, sudah membangun{" "}
                <a href="https://naufal-porto01-supercoder.netlify.app" target="_blank" rel="noopener" className={linkClass}>
                  website bergaya landing page SaaS
                </a>
                .
              </li>
              <li>
                <strong className="text-slate-900">Karyawan dan umum.</strong> Banyak pekerja di
                Balikpapan butuh tools kerja yang tidak dijual di pasaran. Citra, karyawan swasta
                sektor pertambangan tanpa latar IT, membangun sendiri aplikasi web internal untuk
                pemeliharaan dan perawatan berkala di perusahaannya.
              </li>
            </ul>
            <p className={pClass}>
              Siswa Supercoder datang dari berbagai sekolah partner di Balikpapan, di antaranya
              Islamic Global School, Al-Azhar Syifa Budi (AISBA), SMP Nasional KPS, SMA Negeri 3
              Balikpapan, dan SD Cahaya Ilmu.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12 py-6">
              {partnerLogos.map((logo) => (
                <Image
                  key={logo.src}
                  src={logo.src}
                  alt={logo.alt}
                  width={logo.width}
                  height={logo.height}
                  sizes="(min-width: 640px) 160px, 120px"
                  className="h-[46px] w-auto"
                />
              ))}
            </div>
          </section>

          {/* Cara memilih */}
          <section>
            <h2 className={h2Class}>Cara Memilih Kursus Komputer di Balikpapan</h2>
            <p className={pClass}>Sebelum mendaftar di mana pun, cek lima hal ini.</p>
            <ol className="font-sans text-base sm:text-lg text-slate-600 leading-relaxed space-y-3 list-decimal pl-6">
              <li>
                <strong className="text-slate-900">Tujuan belajarnya jelas.</strong> Mau bisa Office,
                desain grafis, atau membuat aplikasi? Pilih kursus yang kurikulumnya memang mengarah
                ke sana.
              </li>
              <li>
                <strong className="text-slate-900">Ada hasil karya yang bisa dilihat.</strong> Minta
                contoh portofolio siswa, bukan hanya daftar materi. Website yang bisa dibuka di
                browser adalah bukti paling jujur.
              </li>
              <li>
                <strong className="text-slate-900">Jumlah siswa per kelas kecil.</strong> Coding
                banyak berurusan dengan error, dan error butuh dibimbing satu per satu. Di
                Supercoder, kelas tatap muka maksimal 6 orang dan kelas online 1-on-1.
              </li>
              <li>
                <strong className="text-slate-900">AI diajarkan dengan benar.</strong> Hindari dua
                ekstrem: kursus yang melarang AI sama sekali, atau yang hanya mengajarkan cara
                menyuruh AI tanpa paham hasilnya.
              </li>
              <li>
                <strong className="text-slate-900">Lokasi dan jadwal masuk akal.</strong> Kelas akhir
                pekan atau online fleksibel lebih mudah dijalani konsisten oleh pelajar maupun
                pekerja.
              </li>
            </ol>
          </section>

          {/* Lokasi */}
          <section id="lokasi" className="scroll-mt-28">
            <h2 className={h2Class}>Lokasi dan Jadwal Kelas</h2>
            <p className={pClass}>
              Kelas tatap muka Supercoder ada di Kompleks Masjid An-Nasa&apos;i, Jl. Syarifuddin
              Yoes, Balikpapan, Kalimantan Timur. Di lantai bawah ada Falya Risol, jadi siswa dan
              orang tua yang menunggu bisa jajan saat jeda.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              <address className="not-italic">
                <ul className="font-sans text-base text-slate-600 space-y-3 list-disc pl-6">
                  <li>
                    <strong className="text-slate-900">Weekend Class (tatap muka):</strong> Minggu,
                    09.00–10.30 WITA
                  </li>
                  <li>
                    <strong className="text-slate-900">Online Class:</strong> jadwal fleksibel, dari
                    mana saja
                  </li>
                  <li>
                    <strong className="text-slate-900">WhatsApp:</strong>{" "}
                    <a href={BUSINESS.whatsappUrl} target="_blank" rel="noopener noreferrer" className={linkClass}>
                      {BUSINESS.phoneDisplay}
                    </a>
                  </li>
                  <li>
                    <strong className="text-slate-900">Peta:</strong>{" "}
                    <a href={BUSINESS.mapsUrl} target="_blank" rel="noopener noreferrer" className={linkClass}>
                      Buka di Google Maps
                    </a>
                  </li>
                </ul>
              </address>
              <iframe
                src={BUSINESS_MAPS_EMBED_URL}
                title="Peta lokasi kelas Supercoder di Kompleks Masjid An-Nasa'i, Jl. Syarifuddin Yoes, Balikpapan"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="w-full h-72 rounded-2xl border border-slate-200"
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
                Kursus komputer terbaik adalah yang membuatmu bisa menciptakan sesuatu, bukan hanya
                memakai. Kalau kamu atau anakmu ingin mulai membangun website dan aplikasi sendiri
                di Balikpapan, konsultasikan dulu levelnya, gratis.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <Button asChild size="lg" className="h-auto py-3 px-6 rounded-full bg-white hover:bg-slate-50 text-red-600 font-poppins font-semibold text-sm shadow-xl">
                  <a href={BUSINESS.whatsappUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 text-red-600 no-underline">
                    <Image src="/images/whatsapp.svg" alt="WhatsApp" width={20} height={20} className="w-4 h-4 shrink-0" />
                    <span>Konsultasi gratis via WhatsApp</span>
                  </a>
                </Button>
                <Button asChild size="lg" className="h-auto py-3 px-6 rounded-full bg-white/15 hover:bg-white/25 border border-white/40 text-white font-poppins font-semibold text-sm">
                  <Link href="/daftar" className="text-white no-underline">Daftar kelas sekarang</Link>
                </Button>
                <Button asChild size="lg" className="h-auto py-3 px-6 rounded-full bg-white/15 hover:bg-white/25 border border-white/40 text-white font-poppins font-semibold text-sm">
                  <Link href="/#program" className="text-white no-underline">Lihat semua program</Link>
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
