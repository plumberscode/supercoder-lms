import Link from "next/link";
import { MapPin, MessageCircle, Quote } from "lucide-react";
import { BUSINESS } from "@/lib/site";
import { levels, programs } from "@/app/kursus-komputer-balikpapan/data";
import { featuredTestimonial, testimonials } from "@/components/homepage/testimoni-data";
import { daftarFaqs, steps } from "./data";

const h2Class = "font-poppins text-2xl sm:text-3xl font-bold text-slate-900 mb-5";
const pClass = "font-sans text-base text-slate-600 leading-relaxed";

// Testimoni yang ditampilkan: pilihan unggulan + dua dari carousel homepage
const quotes = [featuredTestimonial, ...testimonials.slice(0, 2)];

/**
 * Informasi pendukung di bawah formulir: biaya, jadwal, alur daftar, kurikulum,
 * testimoni, dan FAQ. Server Component agar seluruh teks ada di HTML awal.
 */
export default function DaftarInfo() {
  return (
    <div className="bg-white border-t border-slate-200/80 px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
      <div className="max-w-3xl mx-auto space-y-16">
        <section>
          <h2 className={h2Class}>Pilihan Kelas, Jadwal &amp; Biaya</h2>
          <p className={`${pClass} mb-6`}>
            Supercoder adalah kursus coding &amp; AI di Balikpapan untuk siswa SMP, SMA, dan umum.
            Pilih format yang paling cocok dengan jadwal dan gaya belajar Anda:
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            {programs.map((p) => (
              <div key={p.title} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
                <h3 className="font-poppins font-bold text-slate-900 mb-2">{p.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{p.format}</p>
                <p className="text-sm text-slate-600 leading-relaxed">{p.schedule}</p>
                <p className="mt-3 font-poppins font-bold text-orange-600">{p.priceLabel}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className={h2Class}>Cara Daftar Kelas Supercoder</h2>
          <ol className="space-y-5">
            {steps.map((s, i) => (
              <li key={s.title} className="flex gap-4">
                <span className="w-9 h-9 shrink-0 rounded-full bg-gradient-to-br from-orange-500 to-red-500 text-white font-poppins font-bold flex items-center justify-center">
                  {i + 1}
                </span>
                <div>
                  <h3 className="font-poppins font-semibold text-slate-900">{s.title}</h3>
                  <p className={pClass}>{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section>
          <h2 className={h2Class}>Apa yang Dipelajari?</h2>
          <p className={`${pClass} mb-6`}>
            Kurikulum dibagi menjadi tiga level, dari memahami web sampai membangun aplikasi dengan
            bantuan AI. Detail lengkapnya ada di halaman{" "}
            <Link href="/kursus-komputer-balikpapan" className="font-medium text-orange-600 underline underline-offset-2 hover:text-red-600">
              kursus komputer Balikpapan
            </Link>
            .
          </p>
          <div className="space-y-4">
            {levels.map((l) => (
              <div key={l.title}>
                <h3 className="font-poppins font-semibold text-slate-900">
                  {l.title} <span className="font-normal text-slate-500">· {l.subtitle}</span>
                </h3>
                <p className={pClass}>{l.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className={h2Class}>Kata Siswa Supercoder</h2>
          <div className="space-y-4">
            {quotes.map((t) => (
              <figure key={t.name} className="rounded-2xl border border-slate-200 p-5 sm:p-6">
                <Quote className="w-5 h-5 text-orange-500 mb-2" aria-hidden />
                <blockquote className={`${pClass} whitespace-pre-line`}>{t.quote}</blockquote>
                <figcaption className="mt-3 text-sm">
                  <span className="font-semibold text-slate-900">{t.name}</span>
                  <span className="text-slate-500"> · {t.role}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        {/* FAQ: <details> agar jawaban sudah ada di HTML sejak load awal */}
        <section id="faq" className="scroll-mt-28">
          <h2 className={h2Class}>Pertanyaan Seputar Pendaftaran</h2>
          <div className="space-y-3">
            {daftarFaqs.map((f) => (
              <details key={f.q} className="group rounded-2xl border border-slate-200 bg-white px-5 py-4 open:shadow-md">
                <summary className="cursor-pointer list-none flex items-center justify-between gap-4">
                  <h3 className="font-poppins text-base sm:text-lg font-semibold text-slate-900">{f.q}</h3>
                  <span aria-hidden className="text-orange-600 text-xl transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className={`${pClass} mt-3`}>{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="rounded-3xl bg-slate-50 border border-slate-200 p-6 sm:p-8">
          <h2 className="font-poppins text-xl sm:text-2xl font-bold text-slate-900 mb-3">Masih Ada Pertanyaan?</h2>
          <p className={`${pClass} mb-5 flex items-start gap-2`}>
            <MapPin className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" aria-hidden />
            <span>
              Kelas tatap muka: {BUSINESS.shortAddress}, {BUSINESS.city}.{" "}
              <a href={BUSINESS.mapsUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-orange-600 underline underline-offset-2 hover:text-red-600">
                Lihat di Google Maps
              </a>
            </span>
          </p>
          <a
            href={BUSINESS.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2.5 px-6 py-3 rounded-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-poppins font-semibold text-sm sm:text-base shadow-lg shadow-emerald-500/25 transition-all"
          >
            <MessageCircle className="w-5 h-5" />
            Konsultasi via WhatsApp ({BUSINESS.phoneDisplay})
          </a>
        </section>
      </div>
    </div>
  );
}
