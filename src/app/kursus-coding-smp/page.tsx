import type { Metadata } from "next";
import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/homepage/Navbar";
import Footer from "@/components/homepage/Footer";
import Breadcrumbs from "@/components/blog/Breadcrumbs";
import JsonLdScript from "@/components/seo/JsonLdScript";
import { Button } from "@/components/ui/button";
import { BUSINESS, BUSINESS_MAPS_EMBED_URL, DEFAULT_OG_IMAGE, ORG_ID, SITE_URL } from "@/lib/site";
import {
  comparison,
  faqs,
  FREE_HREF,
  FREE_LABEL,
  OFFLINE_CLASS,
  ONLINE_CLASS,
  PAGE_DESCRIPTION,
  PAGE_H1,
  PAGE_PATH,
  PAGE_TITLE,
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
        alt: "Kursus coding SMP di Balikpapan - Supercoder",
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
const DAFTAR_URL = `${SITE_URL}/daftar`;
const daftarHref = (cls: string) => `/daftar?class=${encodeURIComponent(cls)}`;

function buildJsonLd() {
  const course = {
    "@context": "https://schema.org",
    "@type": "Course",
    "@id": `${PAGE_URL}#course`,
    name: PAGE_H1,
    description:
      "Kursus coding untuk anak SMP usia 12-15 tahun di Balikpapan. Kelas tatap muka akhir pekan atau online one-on-one dengan mentor. Belajar HTML, CSS, dan JavaScript sampai membuat website sendiri.",
    url: PAGE_URL,
    inLanguage: "id",
    educationalLevel: "SMP",
    provider: { "@type": "Organization", "@id": ORG_ID, name: BUSINESS.name, url: SITE_URL },
    offers: {
      "@type": "Offer",
      price: "399000",
      priceCurrency: "IDR",
      category: "Paid",
      availability: "https://schema.org/InStock",
      url: DAFTAR_URL,
    },
    hasCourseInstance: [
      {
        "@type": "CourseInstance",
        courseMode: "Onsite",
        courseSchedule: {
          "@type": "Schedule",
          repeatFrequency: "P1W",
          byDay: ["https://schema.org/Saturday", "https://schema.org/Sunday"],
          duration: "PT90M",
          scheduleTimezone: "Asia/Makassar",
        },
        location: {
          "@type": "Place",
          name: "Kompleks Masjid An-Nasa'i",
          address: {
            "@type": "PostalAddress",
            streetAddress: "Jl. Syarifuddin Yoes",
            addressLocality: BUSINESS.city,
            addressRegion: BUSINESS.region,
            addressCountry: BUSINESS.country,
          },
        },
      },
      {
        "@type": "CourseInstance",
        courseMode: "Online",
        description: "Kelas online one-on-one dengan mentor, jadwal fleksibel.",
        offers: { "@type": "Offer", price: "449000", priceCurrency: "IDR", category: "Paid", url: DAFTAR_URL },
      },
    ],
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
      { "@type": "ListItem", position: 2, name: "Kursus Coding Balikpapan", item: `${SITE_URL}/kursus-coding-balikpapan` },
      { "@type": "ListItem", position: 3, name: "Kursus Coding SMP", item: PAGE_URL },
    ],
  };

  return [course, faqPage, breadcrumb];
}

const waButtonClass =
  "w-full sm:w-auto h-auto py-3.5 px-7 sm:px-8 rounded-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-poppins font-semibold text-sm sm:text-base shadow-lg shadow-emerald-500/25 transition-all duration-200 hover:-translate-y-0.5";
const daftarButtonClass =
  "w-full sm:w-auto h-auto py-3.5 px-7 sm:px-8 rounded-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-poppins font-semibold text-sm sm:text-base shadow-lg shadow-red-500/25 transition-all duration-200 hover:-translate-y-0.5";
const linkClass = "font-medium text-orange-600 underline underline-offset-2 hover:text-red-600";
const h2Class = "font-poppins text-2xl sm:text-3xl font-bold text-slate-900 mb-5";
const pClass = "font-sans text-base sm:text-lg text-slate-600 leading-relaxed mb-4";
const tableWrapClass = "overflow-x-auto rounded-2xl border border-slate-200 my-6";
const tableClass = "w-full min-w-[560px] text-left font-sans text-sm sm:text-base text-slate-600";
const thClass = "bg-slate-50 px-4 py-3 font-poppins font-semibold text-slate-900 align-top";
const tdClass = "px-4 py-3 border-t border-slate-200 align-top";

function FreeLink() {
  return (
    <Link href={FREE_HREF} className={linkClass}>
      {FREE_LABEL}
    </Link>
  );
}

function WhatsAppButton({ label }: { label: string }) {
  return (
    <Button asChild size="lg" className={waButtonClass}>
      <a
        href={BUSINESS.whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center justify-center gap-2.5 !py-3.5 !px-6 sm:!px-8 text-white no-underline"
      >
        <Image src="/images/whatsapp.svg" alt="" width={22} height={22} className="w-5 h-5 shrink-0" />
        <span className="text-white font-semibold">{label}</span>
      </a>
    </Button>
  );
}

function DaftarButton() {
  return (
    <Button asChild size="lg" className={daftarButtonClass}>
      <Link
        href={daftarHref(OFFLINE_CLASS)}
        className="inline-flex items-center justify-center !py-3.5 !px-6 sm:!px-8 text-white no-underline"
      >
        <span className="text-white font-semibold">Daftarkan Anak</span>
      </Link>
    </Button>
  );
}

/** Menjadikan `link.text` di dalam jawaban FAQ sebagai tautan, tanpa mengubah teksnya. */
function FaqAnswer({ a, link }: (typeof faqs)[number]): ReactNode {
  if (!link) return a;
  const i = a.indexOf(link.text);
  if (i < 0) return a;
  return (
    <>
      {a.slice(0, i)}
      <Link href={link.href} className={linkClass}>
        {link.text}
      </Link>
      {a.slice(i + link.text.length)}
    </>
  );
}

export default function KursusCodingSmpPage() {
  return (
    <>
      <JsonLdScript data={buildJsonLd()} />
      <Navbar />
      <main className="bg-white" style={{ paddingTop: "88px" }}>
        {/* Pembuka */}
        <section className="px-5 pt-6 pb-14 bg-gradient-to-b from-white via-slate-50/50 to-slate-50">
          <div className="max-w-4xl mx-auto">
            <Breadcrumbs
              items={[
                { name: "Beranda", href: "/" },
                { name: "Kursus Coding Balikpapan", href: "/kursus-coding-balikpapan" },
                { name: "Kursus Coding SMP" },
              ]}
            />
            <h1 className="mt-8 font-poppins text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-[1.15] mb-6">
              Kursus Coding SMP di{" "}
              <span className="bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
                Balikpapan
              </span>
            </h1>
            <p className={pClass}>
              Supercoder membuka kursus coding SMP di Balikpapan untuk anak usia 12–15 tahun. Di
              kelas ini, anak Anda belajar membuat website sendiri, mulai dari HTML dan CSS sampai
              JavaScript. Kelas tatap muka diadakan di akhir pekan (Sabtu atau Minggu), 90 menit per
              pertemuan, di Kompleks Masjid An-Nasa&apos;i, Jl. Syarifuddin Yoes. Biayanya{" "}
              <strong className="text-slate-900">Rp 399.000 per bulan</strong>. Tersedia juga kelas
              online one-on-one dengan mentor, jadwal fleksibel,{" "}
              <strong className="text-slate-900">Rp 449.000 per bulan</strong>.
            </p>
            <p className={pClass}>
              Banyak orang tua mencari kelas coding anak SMP karena ingin waktu layar anaknya lebih
              bermanfaat. Bukan hanya main game atau menonton video, tapi membuat sesuatu yang bisa
              dipakai orang lain. Itulah inti belajar coding untuk anak SMP di Supercoder: anak paham
              cara kerja teknologi yang ia pakai setiap hari.
            </p>
            <p className={`${pClass} mb-8`}>
              Ingin melihat cara belajarnya dulu? Anak Anda bisa mencoba <FreeLink /> sebelum
              mendaftar.
            </p>
            <div className="flex flex-col sm:flex-row gap-3.5 sm:gap-4">
              <WhatsAppButton label={`Tanya Jadwal: ${BUSINESS.phoneDisplay}`} />
              <DaftarButton />
            </div>
            {/* Bisa terlihat di layar pertama desktop: jangan lazy-load */}
            <Image
              src="/images/kursus-coding-smp-balikpapan.webp"
              alt="Siswa SMP belajar coding di laptop pada kelas tatap muka Supercoder Balikpapan"
              width={1920}
              height={1080}
              sizes="(min-width: 896px) 856px, 100vw"
              loading="eager"
              className="mt-10 w-full h-auto rounded-3xl object-cover shadow-xl"
            />
          </div>
        </section>

        <div className="max-w-4xl mx-auto px-5 py-14 space-y-16">
          <section>
            <h2 className={h2Class}>Kenapa Anak SMP Cocok Belajar Coding Sekarang</h2>
            <p className={pClass}>
              Usia SMP adalah waktu yang pas untuk mulai coding dengan serius. Di usia 12–15 tahun,
              kemampuan berpikir abstrak anak sedang berkembang pesat. Anak mulai bisa memahami
              aturan, pola, dan sebab-akibat yang bertingkat. Itu persis cara berpikir yang
              dibutuhkan untuk menulis program.
            </p>
            <p className={pClass}>
              Coding melatih anak memecah masalah besar menjadi langkah-langkah kecil. Kalau
              programnya error, anak harus mencari sendiri di mana salahnya. Prosesnya mirip
              mengerjakan soal cerita matematika: baca masalahnya, susun langkah, lalu cek hasilnya.
            </p>
            <p className={pClass}>
              Manfaatnya juga terasa di sekolah. Logika <em>if–else</em> dan perulangan dekat dengan
              materi pola bilangan dan aljabar. Saat membuat website, anak terbiasa bekerja teliti dan
              runtut, seperti saat praktikum IPA.
            </p>
            <p className={pClass}>
              Satu hal lagi: anak SMP sudah cukup mandiri untuk mengerjakan proyek di rumah. Mereka
              bisa melanjutkan latihan sendiri di antara pertemuan, sehingga kemajuannya lebih cepat
              dibanding anak yang lebih kecil.
            </p>
          </section>

          <section>
            <h2 className={h2Class}>Apa yang Dipelajari di Kelas Coding SMP</h2>
            <p className={pClass}>
              Target akhirnya jelas: anak bisa membuat dan mempublikasikan website buatannya sendiri.
              Materinya disusun bertahap. Anak mulai dari HTML dan CSS untuk menyusun dan mempercantik
              halaman. Lalu belajar JavaScript agar halamannya bisa merespons klik dan input. Terakhir,
              semuanya digabung menjadi proyek website sendiri.
            </p>
            <p className={pClass}>
              Setiap pertemuan selalu ada praktik langsung, bukan hanya teori. Anak menulis kode
              sendiri di laptop, lalu melihat hasilnya saat itu juga. Cara ini membuat anak cepat
              paham dan tidak mudah bosan.
            </p>
            <p className={pClass}>
              Kalau anak Anda belum pernah coding sama sekali, tidak masalah. Kelas dimulai dari nol,
              dan latihan bisa diulang di rumah. Untuk gambaran lebih umum tentang tahapan belajar,
              baca juga{" "}
              <Link href="/blog/belajar-coding-untuk-anak-smp-sma" className={linkClass}>
                panduan belajar coding untuk anak SMP dan SMA
              </Link>
              .
            </p>
          </section>

          <section>
            <h2 className={h2Class}>Jadwal &amp; Biaya Kursus Coding SMP Balikpapan</h2>
            <p className={pClass}>
              Biaya les coding SMP di Supercoder adalah Rp 399.000 per bulan untuk kelas offline akhir
              pekan, dan Rp 449.000 per bulan untuk kelas online one-on-one.
            </p>
            <div className={tableWrapClass}>
              <table className={tableClass}>
                <thead>
                  <tr>
                    <th scope="col" className={thClass}>Keterangan</th>
                    <th scope="col" className={thClass}>Detail</th>
                  </tr>
                </thead>
                <tbody>
                  {(
                    [
                      ["Kelas", "Weekend Class (tatap muka) atau online one-on-one"],
                      ["Jadwal", "Tatap muka: Sabtu atau Minggu (akhir pekan) · Online: fleksibel"],
                      ["Durasi per pertemuan", "90 menit"],
                      ["Biaya", "Rp 399.000 per bulan (tatap muka) · Rp 449.000 per bulan (online one-on-one)"],
                      ["Lokasi", "Kompleks Masjid An-Nasa'i, Jl. Syarifuddin Yoes, Balikpapan"],
                      ["Coba dulu", <FreeLink key="free" />],
                      [
                        "Pendaftaran",
                        <span key="daftar">
                          WhatsApp {BUSINESS.phoneDisplay} atau halaman{" "}
                          <Link href="/daftar" className={linkClass}>Daftar</Link>
                        </span>,
                      ],
                    ] as [string, ReactNode][]
                  ).map(([k, v]) => (
                    <tr key={k}>
                      <th scope="row" className={`${tdClass} font-semibold text-slate-900 whitespace-nowrap`}>{k}</th>
                      <td className={tdClass}>{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className={pClass}>
              Jadwal akhir pekan tidak bentrok dengan jam sekolah maupun les pelajaran lain di hari
              kerja.
            </p>
            <p className={pClass}>
              Supercoder juga membuka kelas untuk jenjang lain. Lihat semua pilihan di halaman{" "}
              <Link href="/kursus-coding-balikpapan" className={linkClass}>kursus coding Balikpapan</Link>{" "}
              dan{" "}
              <Link href="/kursus-komputer-balikpapan" className={linkClass}>kursus komputer Balikpapan</Link>.
            </p>
          </section>

          <section>
            <h2 className={h2Class}>Belajar Coding SMP: Tatap Muka atau Online?</h2>
            <p className={pClass}>
              Supercoder menyediakan dua pilihan. Mana yang cocok tergantung gaya belajar anak dan
              kesibukan keluarga Anda.
            </p>
            <div className={tableWrapClass}>
              <table className={tableClass}>
                <thead>
                  <tr>
                    <td className={thClass} />
                    <th scope="col" className={thClass}>Tatap muka</th>
                    <th scope="col" className={thClass}>Online</th>
                  </tr>
                </thead>
                <tbody>
                  {comparison.map((r) => (
                    <tr key={r.label}>
                      <th scope="row" className={`${tdClass} font-semibold text-slate-900 whitespace-nowrap`}>{r.label}</th>
                      <td className={tdClass}>{r.offline}</td>
                      <td className={tdClass}>{r.online}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className={pClass}>
              Kelas tatap muka cocok untuk anak yang lebih semangat belajar bersama teman. Error kecil
              di awal sering membuat anak menyerah. Dengan pendamping di sebelahnya, masalah itu cepat
              selesai dan anak tetap semangat.
            </p>
            <p className={pClass}>
              Kelas online one-on-one pas untuk keluarga di luar Balikpapan, atau anak yang akhir
              pekannya sudah padat. Mentor fokus pada satu anak, jadi materi bisa disesuaikan dengan
              kecepatan dan minatnya.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <Link href={daftarHref(OFFLINE_CLASS)} className={linkClass}>
                Daftar kelas tatap muka →
              </Link>
              <Link href={daftarHref(ONLINE_CLASS)} className={linkClass}>
                Daftar kelas online one-on-one →
              </Link>
            </div>
          </section>

          <section>
            <h2 className={h2Class}>Prestasi Siswa Supercoder</h2>
            <p className={pClass}>
              Rig, siswa Supercoder, meraih medali perunggu di International Coding Olympiad 2026.
            </p>
            <p className={pClass}>
              Kami tidak menjanjikan setiap anak akan ikut olimpiade. Tapi prestasi Rig menunjukkan
              bahwa anak Balikpapan bisa bersaing di tingkat internasional, asalkan dasarnya kuat dan
              latihannya konsisten.
            </p>
            <p className={pClass}>
              Baca kisah lengkapnya:{" "}
              <Link href="/blog/rig-raih-medali-olimpiade-coding-internasional" className={linkClass}>
                Rig raih medali olimpiade coding internasional
              </Link>
              .
            </p>
          </section>

          {/* FAQ: <details> agar jawaban sudah ada di HTML sejak load awal; teks identik dengan FAQPage JSON-LD */}
          <section id="faq" className="scroll-mt-28">
            <h2 className={h2Class}>Pertanyaan yang Sering Diajukan</h2>
            <div className="space-y-3">
              {faqs.map((f) => (
                <details key={f.q} className="group rounded-2xl border border-slate-200 bg-white px-5 py-4 open:shadow-md">
                  <summary className="cursor-pointer list-none flex items-center justify-between gap-4">
                    <h3 className="font-poppins text-base sm:text-lg font-semibold text-slate-900">{f.q}</h3>
                    <span aria-hidden className="text-orange-600 text-xl transition-transform group-open:rotate-45">+</span>
                  </summary>
                  <p className="font-sans text-base text-slate-600 leading-relaxed mt-3">
                    <FaqAnswer {...f} />
                  </p>
                </details>
              ))}
            </div>
          </section>

          <section id="lokasi" className="scroll-mt-28">
            <h2 className={h2Class}>Mulai Kursus Coding SMP di Balikpapan</h2>
            <p className={pClass}>
              Akhir pekan ini, anak Anda bisa mulai membangun website pertamanya. Tanya jadwal dulu
              lewat WhatsApp, kami bantu pilihkan kelas yang pas untuk anak Anda.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start mt-6">
              <address className="not-italic">
                <p className="font-poppins font-semibold text-slate-900 mb-3">Daftar sekarang:</p>
                <ul className="font-sans text-base sm:text-lg text-slate-600 space-y-3 list-disc pl-6">
                  <li>
                    WhatsApp:{" "}
                    <a href={BUSINESS.whatsappUrl} target="_blank" rel="noopener noreferrer" className={linkClass}>
                      {BUSINESS.phoneDisplay}
                    </a>
                  </li>
                  <li>
                    Formulir online:{" "}
                    <Link href="/daftar" className={linkClass}>supercoder.id/daftar</Link>
                  </li>
                  <li>
                    Alamat: Kompleks Masjid An-Nasa&apos;i, Jl. Syarifuddin Yoes, Balikpapan (
                    <a href={BUSINESS.mapsUrl} target="_blank" rel="noopener noreferrer" className={linkClass}>
                      Google Maps
                    </a>
                    )
                  </li>
                  <li>Jadwal: kelas offline Sabtu atau Minggu (90 menit), kelas online fleksibel</li>
                </ul>
              </address>
              <iframe
                src={BUSINESS_MAPS_EMBED_URL}
                title="Peta lokasi kursus coding SMP Supercoder di Kompleks Masjid An-Nasa'i, Jl. Syarifuddin Yoes, Balikpapan"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="w-full h-72 md:h-80 rounded-2xl border border-slate-200"
              />
            </div>
            <p className={`${pClass} mt-8`}>
              Masih ragu? Coba dulu <FreeLink /> bersama anak Anda. Dari situ Anda bisa melihat
              sendiri apakah anak menikmati prosesnya.
            </p>
            <div className="flex flex-col sm:flex-row gap-3.5 sm:gap-4 mt-6">
              <WhatsAppButton label="Tanya Jadwal via WhatsApp" />
              <DaftarButton />
            </div>
          </section>
        </div>
      </main>
      <Footer showLocalLinks />
    </>
  );
}
