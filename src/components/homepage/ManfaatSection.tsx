import { Badge } from "@/components/ui/badge";
import UnderstandTechVisual from "@/components/manfaat/UnderstandTechVisual";
import LogicVisual from "@/components/manfaat/LogicVisual";
import BuildWithAIVisual from "@/components/manfaat/BuildWithAIVisual";
import { Globe2, Brain, Sparkles } from "lucide-react";

const rows = [
  {
    badge: "01. UNDERSTAND TECH",
    icon: Globe2,
    badgeColor: "border-blue-200 bg-blue-50 text-blue-600",
    title: "Paham Teknologi, Bukan Sekadar Memakai",
    text: "AI bisa membuatkan kode, tapi fundamental membuatmu paham cara kerjanya, bisa mengevaluasi hasilnya, dan memperbaiki error sendiri.",
    Visual: UnderstandTechVisual,
    imageLeft: false,
  },
  {
    badge: "02. CRITICAL THINKING",
    icon: Brain,
    badgeColor: "border-orange-200 bg-orange-50 text-orange-700",
    title: "Melatih Logika dan Problem Solving",
    text: "Coding melatih cara memecah masalah besar menjadi langkah-langkah kecil, mencari sumber error, dan merancang solusi yang teruji.",
    Visual: LogicVisual,
    imageLeft: true,
  },
  {
    badge: "03. BUILD WITH AI",
    icon: Sparkles,
    badgeColor: "border-red-200 bg-red-50 text-red-700",
    title: "Ide Jadi Project Nyata, Lebih Cepat",
    text: "Setiap konsep langsung dipraktikkan. Dengan fondasi yang kuat dan AI sebagai partner, siswa bisa membuat prototype dan membangun portofolio sendiri.",
    Visual: BuildWithAIVisual,
    imageLeft: false,
  },
];

export default function ManfaatSection() {
  return (
    <section
      className="cv-auto py-24 px-5 bg-white relative overflow-hidden"
      id="manfaat"
    >
      {/* Background Subtle Gradient Accents */}
      <div
        className="absolute top-1/4 right-0 w-96 h-96 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(241,245,249,0.7), transparent 70%)",
        }}
      />
      <div
        className="absolute bottom-1/4 left-0 w-96 h-96 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(241,245,249,0.7), transparent 70%)",
        }}
      />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Title Header */}
        <div className="text-center max-w-2xl mx-auto mb-14 sm:mb-20">
          <div className="inline-flex items-center gap-2 mb-4">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <span className="font-poppins text-xs font-bold text-slate-500 uppercase tracking-widest">
              Kenapa Supercoder
            </span>
          </div>
          <h2 className="font-poppins text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
            Kenapa Belajar Coding &amp; AI{" "}
            <span className="text-red-500">di Supercoder?</span>
          </h2>
          <p className="font-sans text-base sm:text-lg text-slate-600">
            Siswa SMP, SMA, dan pemula belajar coding fundamentals sekaligus
            memakai AI secara terarah, lalu langsung mempraktikkannya untuk
            membangun website dan aplikasi nyata.
          </p>
        </div>

        {/* 3 Showcase Rows */}
        <div className="space-y-16 lg:space-y-28">
          {rows.map((row, idx) => {
            const Icon = row.icon;
            const Visual = row.Visual;

            return (
              <div
                key={row.title}
                className={`group flex flex-col lg:flex-row items-center gap-8 lg:gap-16 ${
                  row.imageLeft ? "lg:flex-row-reverse" : ""
                }`}
              >
                {/* Text Content */}
                <div className="w-full lg:w-1/2 flex flex-col items-start">
                  <div className="flex items-center gap-2.5 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
                      <Icon className="w-4 h-4" />
                    </div>
                    <Badge
                      variant="outline"
                      className={`px-3 py-1 font-bold text-xs ${row.badgeColor}`}
                    >
                      {row.badge}
                    </Badge>
                  </div>

                  <h3 className="font-poppins text-2xl sm:text-3xl font-bold text-slate-900 mb-4 leading-tight">
                    {row.title}
                  </h3>

                  <p className="font-sans text-base sm:text-lg text-slate-600 leading-relaxed">
                    {row.text}
                  </p>
                </div>

                {/* Visual (Mini UI berbasis ikon) */}
                <div className="w-full lg:w-1/2">
                  <Visual />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
