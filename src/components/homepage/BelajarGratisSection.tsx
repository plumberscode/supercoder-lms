import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  CheckCircle2,
  Code2,
  Gift,
  Layers,
  MonitorSmartphone,
} from "lucide-react";
import { FALLBACK_TOTAL, PAGE_PATH, tracks, type Track } from "@/app/belajar-gratis/data";

const points = [
  "Rp 0, tanpa iklan dan tanpa biaya tersembunyi.",
  "AI berperan sebagai tutor: memberi petunjuk, bukan jawaban.",
  "Nilai, feedback, dan XP setiap latihan tercatat, jadi perkembangannya terlihat.",
  "Disusun untuk siswa SMP–SMA, bisa dimulai dari nol.",
];

const stats = [
  { value: String(FALLBACK_TOTAL), label: "latihan interaktif", icon: Code2 },
  { value: "10", label: "modul berurutan", icon: Layers },
  { value: "Rp 0", label: "tanpa biaya", icon: Gift },
  { value: "0", label: "install, cukup browser", icon: MonitorSmartphone },
];

export default function BelajarGratisSection() {
  return (
    <section className="cv-auto bg-slate-50 pt-4 pb-16 sm:pb-20 px-5">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xl shadow-slate-900/5 p-6 sm:p-10 lg:p-14 grid grid-cols-1 lg:grid-cols-[1.15fr_1fr] gap-10 lg:gap-14 items-center">
          {/* Kiri: ajakan untuk orang tua */}
          <div className="flex flex-col items-start">
            <div className="inline-flex items-center gap-2 mb-5">
              <span className="w-2 h-2 rounded-full bg-orange-500" />
              <span className="font-poppins text-xs font-bold text-slate-500 uppercase tracking-widest">
                Coba Gratis Dulu
              </span>
            </div>

            <h2 className="font-poppins text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 leading-snug mb-4">
              Anak Anda Cocok Belajar Coding?{" "}
              <span className="bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
                Coba {FALLBACK_TOTAL} Latihannya Gratis.
              </span>
            </h2>

            <p className="font-sans text-base sm:text-lg text-slate-600 leading-relaxed mb-6">
              Biarkan anak Anda mencoba langsung LMS yang dipakai siswa Supercoder setiap
              hari: {FALLBACK_TOTAL} latihan singkat HTML, CSS, dan JavaScript, 3–10 menit
              per latihan, dikerjakan langsung di browser.
            </p>

            <ul className="space-y-3 mb-8">
              {points.map((p) => (
                <li key={p} className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="font-sans text-sm sm:text-base text-slate-700 leading-relaxed">{p}</span>
                </li>
              ))}
            </ul>

            <Button
              asChild
              size="lg"
              className="w-full sm:w-auto h-auto py-3.5 px-7 sm:px-8 rounded-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-poppins font-semibold text-sm sm:text-base shadow-lg shadow-red-500/25 hover:shadow-xl hover:shadow-red-500/35 transition-all duration-200 hover:-translate-y-0.5"
            >
              <Link
                href={PAGE_PATH}
                className="inline-flex items-center justify-center gap-2 !py-3.5 !px-6 sm:!px-8 text-white no-underline"
              >
                <span className="font-semibold">Coba Gratis Sekarang</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
            <p className="font-sans text-sm text-slate-500 mt-3">
              Cukup masuk dengan akun Google. Tanpa install aplikasi.
            </p>
          </div>

          {/* Kanan: angka & jalur belajar */}
          <div className="rounded-2xl bg-slate-50/70 border border-slate-100 p-4 sm:p-6">
            <ul className="grid grid-cols-2 gap-3 sm:gap-4">
              {stats.map((s) => (
                <li key={s.label} className="rounded-2xl border border-slate-200/80 bg-white shadow-sm p-4 sm:p-5">
                  <span className="flex w-10 h-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600 mb-3">
                    <s.icon className="w-5 h-5" />
                  </span>
                  <p className="font-poppins text-2xl sm:text-3xl font-black text-slate-900 leading-none">{s.value}</p>
                  <p className="font-sans text-xs sm:text-sm text-slate-500 mt-1.5">{s.label}</p>
                </li>
              ))}
            </ul>

            <p className="font-poppins text-xs font-bold text-slate-500 uppercase tracking-widest mt-6 mb-3">
              Jalur belajarnya
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {(Object.keys(tracks) as Track[]).map((t, i) => (
                <div key={t} className="flex items-center gap-2">
                  {i > 0 && <ArrowRight className="w-3.5 h-3.5 text-slate-400" />}
                  <Badge className={`${tracks[t].badge} border-0 px-3 py-1 rounded-full text-xs font-bold`}>
                    {tracks[t].label}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
