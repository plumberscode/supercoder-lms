import { BUSINESS } from "@/lib/site";

export const PAGE_PATH = "/kursus-coding-balikpapan";

export const PAGE_TITLE = "Kursus Coding Balikpapan | SMP, SMA & Umum – Supercoder";

export const PAGE_DESCRIPTION =
  "Kursus coding Balikpapan untuk SMP, SMA & umum. Belajar coding & AI dari nol sampai bikin aplikasi nyata. Tatap muka & online. Daftar sekarang.";

export const PAGE_H1_LEAD = "Kursus Coding Balikpapan:";
export const PAGE_H1_REST = "Belajar Coding & AI dari Nol sampai Bikin Aplikasi";

// Halaman ini fokus coding (HTML/CSS/JS → aplikasi). /kursus-komputer-balikpapan membahas
// "kursus komputer" yang lebih luas; isi keduanya sengaja tidak sama agar tidak bersaing.
export const topics = [
  {
    title: "Coding Dasar: HTML, CSS, dan JavaScript",
    body: "Siswa mulai dari fondasi web. HTML untuk struktur halaman, CSS untuk tampilan (Flexbox, Grid, dan desain responsif agar rapi di HP), lalu JavaScript untuk logika: variabel, if-else, function, array, dan event. Setiap konsep langsung dipraktikkan di code editor, bukan hanya dibaca dari slide.",
  },
  {
    title: "Membuat Website dan Aplikasi Nyata",
    body: "Setelah dasarnya kuat, siswa merakit konsep-konsep itu menjadi produk utuh: landing page, web app interaktif, sampai aplikasi dengan framework Next.js dan database serverless. Latihan soal coding di portal belajar Supercoder dinilai otomatis, jadi siswa tahu langsung bagian mana yang sudah benar dan mana yang perlu diperbaiki.",
  },
  {
    title: "Dasar AI dan Cara Memakainya dengan Benar",
    body: "AI coding assistant diperkenalkan sejak level pertama, tapi sebagai partner, bukan pengganti berpikir. Siswa belajar meminta bantuan AI untuk eksplorasi ide dan debugging, lalu membaca dan memahami kode yang dihasilkan. Tujuannya: bisa memakai AI secepat profesional tanpa kehilangan kendali atas kodenya sendiri.",
  },
  {
    title: "Proyek Akhir untuk Portofolio",
    body: "Di level Super Coder Elite, siswa membangun web application sendiri lalu menampilkannya sebagai portofolio. Hasilnya bisa dibuka siapa saja di browser, jadi bisa ditunjukkan untuk lomba, pendaftaran sekolah atau kuliah, maupun melamar kerja.",
  },
];

export const audiences = [
  {
    title: "Siswa SMP dan SMA",
    body: "Usia yang pas untuk belajar logika pemrograman. Banyak siswa Supercoder datang dari sekolah partner di Balikpapan dan membangun website pertama mereka di bangku SMP.",
  },
  {
    title: "Mahasiswa dan umum yang ingin ganti karier",
    body: "Tidak perlu latar belakang IT. Peserta dewasa, termasuk karyawan dan ASN, belajar dari nol dengan jadwal yang bisa menyesuaikan pekerjaan.",
  },
  {
    title: "Orang tua yang mencari les coding anak",
    body: "Kelas tatap muka kecil (maksimal 6 siswa) di Balikpapan, rapor bulanan, dan mentor yang memantau perkembangan anak dari pertemuan ke pertemuan.",
  },
];

export const faqs = [
  {
    q: "Berapa biaya kursus coding di Balikpapan di Supercoder?",
    a: "Weekend Coding Class (tatap muka di Balikpapan) Rp 399.000 per bulan, Premium Online Class (privat 1-on-1) Rp 449.000 per bulan. Keduanya 1x seminggu, 90 menit per sesi. Biaya Custom Project Class menyesuaikan project yang dibangun.",
  },
  {
    q: "Apakah kursus coding ini bisa untuk pemula yang belum pernah coding?",
    a: "Bisa. Materi dimulai dari dasar HTML dan CSS, dan siswa dibimbing langkah demi langkah. Tidak perlu pengalaman coding atau pemahaman AI sebelumnya.",
  },
  {
    q: "Apakah ada kelas coding online?",
    a: "Ada. Premium Online Class berlangsung privat 1-on-1 lewat Google Meet dengan jadwal fleksibel, sehingga bisa diikuti dari luar Balikpapan. Custom Project Class juga berjalan online lewat Google Meet.",
  },
  {
    q: "Berapa lama sampai bisa membuat aplikasi sendiri?",
    a: "Tergantung kecepatan belajar dan konsistensi tiap siswa. Website pertama dibuat di level Super Coder Junior, aplikasi web interaktif di level Builder, dan aplikasi dengan Next.js serta database di level Elite. Mentor akan memberi gambaran yang lebih tepat setelah konsultasi.",
  },
  {
    q: "Di mana lokasi kelas coding tatap mukanya?",
    a: `Di ${BUSINESS.fullAddress}. Weekend Coding Class berlangsung setiap Minggu pukul 09.00–10.30 WITA.`,
  },
  {
    q: "Bahasa pemrograman apa saja yang dipelajari?",
    a: "HTML dan CSS untuk tampilan web, JavaScript untuk logika dan interaksi, lalu framework Next.js dan database untuk membangun aplikasi web yang utuh.",
  },
];
