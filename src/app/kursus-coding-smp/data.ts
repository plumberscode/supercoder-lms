import { FALLBACK_TOTAL, PAGE_PATH as FREE_PATH } from "@/app/belajar-gratis/data";

export const PAGE_PATH = "/kursus-coding-smp";

// Target: "kursus coding smp", "coding anak smp", "coding untuk anak smp" (niat komersial).
// Artikel /blog/belajar-coding-untuk-anak-smp-sma menjawab niat informasional; jangan salin isinya ke sini.
// Jadwal & harga mengikuti revisi pemilik 9 Nov 2026: tatap muka Sabtu/Minggu 90 menit Rp 399.000,
// online one-on-one fleksibel Rp 449.000.
export const PAGE_TITLE = "Kursus Coding SMP Balikpapan – Kelas Tatap Muka | Supercoder";

export const PAGE_DESCRIPTION = `Kursus coding untuk anak SMP di Balikpapan. Belajar bikin website & aplikasi nyata, kelas tatap muka akhir pekan. Rp 399.000/bulan, coba ${FALLBACK_TOTAL} latihan gratis.`;

export const PAGE_H1 = "Kursus Coding SMP di Balikpapan";

export const FREE_HREF = FREE_PATH;
export const FREE_LABEL = `${FALLBACK_TOTAL} latihan coding gratis`;

export const OFFLINE_CLASS = "Weekend Coding Class";
export const ONLINE_CLASS = "Premium Online Class";

export const comparison = [
  {
    label: "Cocok untuk",
    offline: "Anak yang lebih fokus jika didampingi langsung",
    online: "Anak yang butuh perhatian penuh atau jadwalnya padat",
  },
  {
    label: "Interaksi",
    offline: "Bertanya dan dibantu langsung di samping laptop",
    online: "One-on-one: satu anak, satu mentor",
  },
  {
    label: "Teman belajar",
    offline: "Belajar bersama teman sebaya di kelas",
    online: "Belajar dari rumah, materi mengikuti kecepatan anak",
  },
  { label: "Lokasi", offline: "Balikpapan, Jl. Syarifuddin Yoes", online: "Dari mana saja" },
  {
    label: "Jadwal",
    offline: "Sabtu atau Minggu, 90 menit per pertemuan",
    online: "Fleksibel, disepakati bersama mentor",
  },
  { label: "Biaya", offline: "Rp 399.000 per bulan", online: "Rp 449.000 per bulan" },
];

// Teks `a` dipakai apa adanya di halaman dan FAQPage JSON-LD (harus identik).
// `link` opsional: potongan teks di dalam `a` yang dijadikan tautan di halaman.
export const faqs: { q: string; a: string; link?: { text: string; href: string } }[] = [
  {
    q: "Berapa biaya les coding anak SMP di Supercoder?",
    a: `Rp 399.000 per bulan untuk kelas tatap muka di akhir pekan (Sabtu atau Minggu), 90 menit per pertemuan. Kelas online one-on-one dengan mentor Rp 449.000 per bulan, jadwal fleksibel. Sebelum mendaftar, anak bisa mencoba ${FREE_LABEL}.`,
    link: { text: FREE_LABEL, href: FREE_PATH },
  },
  {
    q: "Les coding SMP mulai umur berapa?",
    a: "Kelas ini dirancang untuk anak SMP, sekitar usia 12–15 tahun atau kelas 7 sampai 9. Di usia ini anak sudah siap belajar bahasa pemrograman sungguhan, seperti HTML, CSS, dan JavaScript.",
  },
  {
    q: "Apakah anak SMP sudah bisa belajar coding dari nol?",
    a: "Bisa. Tidak ada syarat pengalaman coding sebelumnya. Yang dibutuhkan hanya kemampuan dasar memakai komputer dan rasa ingin tahu.",
  },
  {
    q: "Apa manfaat les coding untuk anak SMP?",
    a: "Coding melatih logika, ketelitian, dan cara memecahkan masalah langkah demi langkah. Kemampuan ini membantu di pelajaran matematika dan IPA. Anak juga belajar membuat karya nyata, bukan hanya memakai teknologi.",
  },
  {
    q: "Bagaimana cara mendaftar kursus coding SMP di Balikpapan?",
    a: "Hubungi WhatsApp 0816-331-126 atau isi formulir di halaman Daftar. Tim kami akan mengonfirmasi jadwal dan kelas yang paling cocok untuk anak Anda.",
    link: { text: "Daftar", href: "/daftar" },
  },
];
