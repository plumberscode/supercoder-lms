// Ikon & warna yang dipakai bersama halaman siswa, agar kartu kursus di dashboard dan
// halaman mata pelajaran tampil dengan ikon/warna yang sama.

const SUBJECT_ICONS = ["💻", "🎨", "⚡", "🔧", "🌐", "🛠️"];
const SUBJECT_GRADIENTS = [
  "linear-gradient(135deg,#eef2ff,#e0e7ff)",
  "linear-gradient(135deg,#fef3c7,#fde68a)",
  "linear-gradient(135deg,#d1fae5,#a7f3d0)",
  "linear-gradient(135deg,#ffe4e6,#fecdd3)",
  "linear-gradient(135deg,#ede9fe,#ddd6fe)",
  "linear-gradient(135deg,#e0f2fe,#bae6fd)",
];
export const LOCKED_GRADIENT = "#F1F5F9";

/** Tema kursus berdasarkan urutannya di daftar "Materi Belajar" dashboard. */
export function subjectTheme(index: number) {
  const i = Math.max(0, index);
  return {
    icon: SUBJECT_ICONS[i % SUBJECT_ICONS.length],
    gradient: SUBJECT_GRADIENTS[i % SUBJECT_GRADIENTS.length],
  };
}

const LESSON_TYPES: Record<string, { icon: string; label: string; gradient: string }> = {
  video: { icon: "📺", label: "Video", gradient: "linear-gradient(135deg,#ffe4e6,#fecdd3)" },
  pdf: { icon: "📄", label: "PDF", gradient: "linear-gradient(135deg,#e0f2fe,#bae6fd)" },
  link: { icon: "🔗", label: "Link", gradient: "linear-gradient(135deg,#e0f2fe,#bae6fd)" },
  text: { icon: "📖", label: "Materi Teks", gradient: "linear-gradient(135deg,#eef2ff,#e0e7ff)" },
  quiz: { icon: "🧠", label: "Kuis", gradient: "linear-gradient(135deg,#fef3c7,#fde68a)" },
  code: { icon: "💻", label: "Soal Coding", gradient: "linear-gradient(135deg,#d1fae5,#a7f3d0)" },
  "css-challenge": { icon: "🎨", label: "Soal CSS", gradient: "linear-gradient(135deg,#ede9fe,#ddd6fe)" },
  "web-challenge": { icon: "🕸️", label: "Soal Coding Web", gradient: "linear-gradient(135deg,#d1fae5,#a7f3d0)" },
};

export function lessonTypeTheme(type: string) {
  return (
    LESSON_TYPES[type] ?? {
      icon: "📄",
      label: type.toUpperCase(),
      gradient: "linear-gradient(135deg,#f1f5f9,#e2e8f0)",
    }
  );
}
