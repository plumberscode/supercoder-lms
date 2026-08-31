import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Globe2, Brain, Sparkles, CheckCircle2 } from "lucide-react";

const rows = [
  {
    badge: "01. UNDERSTAND TECH",
    icon: Globe2,
    badgeColor: "border-blue-200 bg-blue-50 text-blue-600",
    title: "Memahami Teknologi, Bukan Sekadar Memakai",
    text: "AI bisa membantu membuatkan sesuatu, tetapi coding fundamentals membuatmu paham cara kerjanya. Kamu tahu apa yang dibangun, bisa mengevaluasi hasil, dan tidak bergantung sepenuhnya pada teknologi.",
    points: [
      "Memahami logika di balik kode hasil AI",
      "Mampu mengevaluasi dan memperbaiki error secara mandiri",
      "Memegang kendali penuh atas produk teknologi yang dibuat",
    ],
    image: "/images/coding-future.webp",
    imageLeft: false,
  },
  {
    badge: "02. CRITICAL THINKING",
    icon: Brain,
    badgeColor: "border-orange-200 bg-orange-50 text-orange-600",
    title: "Melatih Logika dan Problem Solving",
    text: "Coding mengajarkan cara memecah masalah besar menjadi langkah-langkah terstruktur yang logis, mencari sumber error, dan merancang solusi yang sistematis dan teruji.",
    points: [
      "Problem solving bertahap dan sistematis",
      "Meningkatkan fokus dan ketelitian berpikir",
      "Terbiasa mencari solusi saat menemui error/kegagalan",
    ],
    image: "/images/sistematis.webp",
    imageLeft: true,
  },
  {
    badge: "03. BUILD WITH AI",
    icon: Sparkles,
    badgeColor: "border-red-200 bg-red-50 text-red-600",
    title: "Mengubah Ide Menjadi Nyata Lebih Cepat",
    text: "Kombinasi coding fundamentals dan AI membuka kekuatan penuh seorang Digital Builder. Kamu bisa mengeksplorasi ide, membuat prototype, dan membangun project nyata jauh lebih cepat.",
    points: [
      "Eksplorasi ide dan prototyping jauh lebih cepat",
      "Menggabungkan fondasi solid dengan modern AI tools",
      "Membangun portofolio karya digital nyata yang membanggakan",
    ],
    image: "/images/belajar-seru.webp",
    imageLeft: false,
  },
];

export default function ManfaatSection() {
  return (
    <section
      className="py-24 px-5 bg-white relative overflow-hidden"
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
        <div className="text-center max-w-2xl mx-auto mb-20">
          <div className="inline-flex items-center gap-2 mb-4">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <span className="font-poppins text-xs font-bold text-slate-500 uppercase tracking-widest">
              Manfaat Utama
            </span>
          </div>
          <h2 className="font-poppins text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
            Mengapa Harus Belajar <br />
            <span className="text-red-500">Coding &amp; AI?</span>
          </h2>
          <p className="font-sans text-base sm:text-lg text-slate-600">
            Investasi skill esensial yang mempersiapkan generasi muda menjadi
            Digital Builder unggul.
          </p>
        </div>

        {/* 3 Showcase Rows */}
        <div className="space-y-20 lg:space-y-28">
          {rows.map((row, idx) => {
            const Icon = row.icon;

            return (
              <div
                key={row.title}
                className={`group flex flex-col lg:flex-row items-center gap-10 lg:gap-16 ${
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

                  <p className="font-sans text-base sm:text-lg text-slate-600 leading-relaxed mb-6">
                    {row.text}
                  </p>

                  {/* Bullet points */}
                  <div className="space-y-2.5 w-full pt-2">
                    {row.points.map((point) => (
                      <div key={point} className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                        <span className="font-sans text-sm text-slate-700 font-medium">
                          {point}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Image Container */}
                <div className="w-full lg:w-1/2">
                  <div className="relative w-full h-[280px] sm:h-[360px] rounded-3xl overflow-hidden shadow-xl ring-1 ring-slate-200/80 bg-slate-100">
                    <Image
                      src={row.image}
                      alt={row.title}
                      fill
                      sizes="(max-width: 1024px) 100vw, 550px"
                      className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
