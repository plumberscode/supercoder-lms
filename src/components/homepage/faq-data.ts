import { BUSINESS } from "@/lib/site";

type Faq = {
  q: string;
  a: string;
  /** Link internal opsional; `text` harus berupa potongan persis dari `a` dan dirender sebagai anchor. */
  link?: { text: string; href: string };
};

// Dipakai oleh FAQSection (tampilan) dan JsonLd (schema FAQPage) supaya isinya selalu sama.
export const faqs: Faq[] = [
  {
    q: "Anak saya belum pernah belajar coding sama sekali, apakah bisa ikut kelas ini?",
    a: "Bisa sekali. Kurikulum di SuperCoder dirancang ramah untuk pemula total. Siswa akan dibimbing dari pemahaman dasar langkah demi langkah, sehingga tidak perlu khawatir tertinggal.",
  },
  {
    q: "Apakah dengan adanya AI, anak tetap perlu belajar coding?",
    a: "Sangat perlu. AI mempercepat proses pembuatan, tetapi pemahaman coding fundamentals membuat siswa paham logika di baliknya, mampu mengevaluasi hasil AI, menemukan kesalahan kode, dan memiliki kendali penuh atas project yang dibangun. Pembahasan lengkapnya ada di panduan belajar coding untuk anak SMP & SMA.",
    link: {
      text: "panduan belajar coding untuk anak SMP & SMA",
      href: "/blog/belajar-coding-untuk-anak-smp-sma",
    },
  },
  {
    q: "Apakah siswa harus sudah mengerti AI sebelum bergabung?",
    a: "Tidak perlu. Pembelajaran disusun secara bertahap. Siswa membangun dasar logika dan coding terlebih dahulu, lalu diajarkan cara menggunakan AI secara terarah sebagai partner belajar dan development.",
  },
  {
    q: "Apakah ada Kelas Online dan Offline?",
    a: "Ya, kami menyediakan kelas offline (tatap muka kelompok kecil di Balikpapan) dan kelas online privat 1-on-1 bersama mentor yang dapat diikuti dari mana saja secara fleksibel.",
  },
  {
    q: "Berapa jumlah siswa maksimal untuk kelas offline dan online?",
    a: "Untuk menjaga efektivitas bimbingan, kelas offline dibatasi maksimal 6 orang per sesi, sedangkan kelas online bersifat privat 1-on-1 (1 siswa bersama 1 mentor).",
  },
  {
    q: "Di mana lokasi kelas coding Supercoder di Balikpapan?",
    a: `Kelas tatap muka Supercoder berlokasi di ${BUSINESS.fullAddress}. Weekend Coding Class berlangsung setiap Minggu pukul 09.00 - 10.30 WITA.`,
  },
  {
    q: "Berapa biaya kursus coding di Supercoder?",
    a: "Weekend Coding Class (tatap muka di Balikpapan) Rp 399.000 per bulan dan Premium Online Class 1-on-1 Rp 449.000 per bulan, masing-masing 1x seminggu 90 menit. Biaya Custom Project Class menyesuaikan project yang ingin dibangun.",
  },
  {
    q: "Mulai usia berapa anak bisa ikut kelas Supercoder?",
    a: "Program Supercoder ditujukan untuk siswa SMP dan SMA. Materinya disusun bertahap dari dasar, sehingga siswa yang belum pernah belajar coding pun bisa mengikutinya.",
  },
  {
    q: "Apakah siswa mendapat sertifikat?",
    a: "Ya, siswa mendapat sertifikat dari Supercoder.",
  },
];
