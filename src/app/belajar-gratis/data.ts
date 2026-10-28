export const PAGE_PATH = "/belajar-gratis";

// Angka cadangan bila data modul gagal dimuat; angka sebenarnya dihitung dari modul teaser.
export const FALLBACK_TOTAL = 63;

export const LOGIN_HREF = "/login?gratis=1";

export const pageTitle = (total: number) =>
  `Belajar Coding Gratis: ${total} Latihan HTML, CSS & JS | Supercoder`;

export const pageDescription = (total: number) =>
  `Coba LMS Supercoder gratis: ${total} latihan interaktif HTML, CSS, dan JavaScript untuk pelajar SMP–SMA. Kerjakan di browser, dinilai otomatis, dapat XP.`;

export type Track = "html" | "css" | "js";

export const tracks: Record<Track, { label: string; title: string; badge: string }> = {
  html: { label: "HTML", title: "Struktur Web", badge: "bg-emerald-500 text-white" },
  css: { label: "CSS", title: "Tampilan & Layout", badge: "bg-blue-600 text-white" },
  js: {
    label: "JavaScript",
    title: "Logika",
    badge: "bg-gradient-to-r from-orange-500 to-red-500 text-white",
  },
};

export function trackOf(moduleTitle: string): Track {
  if (/javascript/i.test(moduleTitle)) return "js";
  if (/^css/i.test(moduleTitle)) return "css";
  return "html";
}

// Hasil belajar per modul, dicocokkan dengan judul modul di LMS.
export const moduleOutcomes: Record<string, string> = {
  "Ponda di Hutan HTML":
    "Menyusun halaman pertamamu: heading, paragraf, link, gambar, list, tabel, dan formulir.",
  "CSS Box Model": "Mengatur jarak, ukuran, dan bingkai setiap elemen.",
  "CSS Flexbox": "Menyusun elemen sejajar dan rapi dalam satu baris atau kolom.",
  "CSS Grid": "Membuat layout baris dan kolom sekaligus.",
  "Jojo Javascript Variabel": "Menyimpan data di variabel dan mengenal tipe data.",
  "Jojo Javascript Operator": "Berhitung, menyusun teks, dan mengubah tipe data.",
  "Jojo Javascript Percabangan": "Membuat program yang bisa mengambil keputusan.",
  "Jojo Javascript Perulangan": "Mengotomatiskan pekerjaan yang berulang.",
  "Jojo Javascript Fungsi": "Membuat “mesin” kode yang bisa dipakai berulang kali.",
  "Jojo Javascript Array": "Mengolah daftar data: mencari, menyaring, dan menghitung.",
};

export const steps = [
  {
    title: "Baca & kenali",
    body: "Teori singkat, contoh kode, dan cerita seru. Selesai dibaca kurang dari 2 menit.",
  },
  {
    title: "Tulis kodemu",
    body: "Editor langsung di browser. Hasilnya muncul di Console atau live preview.",
  },
  {
    title: "Nilai Kodeku",
    body: "Kodemu dinilai otomatis, lengkap dengan feedback dan XP. Macet? Minta petunjuk dari Kakak AI. AI memberi arah, bukan jawaban.",
  },
];

export const characters = [
  {
    name: "Ponda",
    role: "Petualang Hutan HTML",
    body: "Menjelajahi Hutan HTML, menyusun papan penunjuk jalan, sampai merapikan kebun bibit dengan CSS Grid.",
  },
  {
    name: "Jojo",
    role: "Panitia Class Meeting",
    body: "Memakai JavaScript untuk mencatat skor lomba, menghitung harga tiket, dan mengundi doorprize.",
  },
];

export const parentPoints = [
  "Kurikulum disusun untuk siswa SMP–SMA, dari Level Junior ke Level Builder.",
  "AI dipakai sebagai tutor yang memberi petunjuk, bukan memberikan jawaban.",
  "Progres, nilai, dan XP setiap latihan tercatat di LMS.",
  "Tanpa iklan dan tanpa biaya tersembunyi.",
];

export const freeFeatures = (total: number) => [
  `${total} latihan Web Development`,
  "Nilai otomatis, feedback, dan XP",
  "AI Hint 5× per hari",
  "Masuk leaderboard",
];

export const classFeatures = [
  "Semua materi: CSS lanjutan, JavaScript Fundamentals, Website Portofolio, Code with AI",
  "Bimbingan langsung dari instruktur",
  "Proyek nyata untuk portofolio",
  "AI Hint tanpa batas",
];

export const faqs = (total: number) => [
  {
    q: "Benar-benar gratis?",
    a: `Ya. ${total} latihan Web Development bisa kamu kerjakan tanpa biaya apa pun.`,
  },
  {
    q: "Perlu install aplikasi?",
    a: "Tidak. Semua latihan berjalan di browser. Laptop atau komputer lebih nyaman dipakai untuk menulis kode.",
  },
  {
    q: "Untuk umur berapa?",
    a: "Dirancang untuk siswa SMP dan SMA, termasuk pemula yang belum pernah coding sama sekali.",
  },
  {
    q: "Bagaimana cara daftarnya?",
    a: "Klik “Masuk & Mulai Gratis”, lalu masuk dengan akun Google. Akunmu langsung aktif dan bisa dipakai belajar.",
  },
];
