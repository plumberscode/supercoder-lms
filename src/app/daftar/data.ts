import { BUSINESS } from "@/lib/site";

export const DAFTAR_PATH = "/daftar";

export const DAFTAR_TITLE = "Daftar Kelas Coding Balikpapan";

// 120–160 karakter agar tidak terpotong di hasil Google
export const DAFTAR_DESCRIPTION =
  "Daftar kelas coding & AI Supercoder Balikpapan: tatap muka Rp399rb/bln atau online privat Rp449rb/bln. Bayar online, jadwal dikonfirmasi via WhatsApp.";

export const steps = [
  {
    title: "Isi formulir",
    body: "Tulis nama calon siswa, alamat, nomor WhatsApp aktif, email, lalu pilih program kelas. Hanya butuh sekitar 2 menit.",
  },
  {
    title: "Bayar bulan pertama",
    body: "Untuk Weekend Coding Class dan Premium Online Class, Anda langsung diarahkan ke halaman pembayaran aman Mayar: QRIS, transfer bank/virtual account, atau e-wallet.",
  },
  {
    title: "Konfirmasi via WhatsApp",
    body: "Tim Supercoder menghubungi Anda lewat WhatsApp untuk mengonfirmasi jadwal, menjawab pertanyaan, dan mengirim detail kelas.",
  },
  {
    title: "Mulai belajar",
    body: "Siswa mendapat akun belajar Supercoder dan mulai dari level yang sesuai, didampingi mentor di setiap pertemuan.",
  },
];

export const daftarFaqs = [
  {
    q: "Berapa biaya yang dibayar saat mendaftar?",
    a: "Yang dibayar saat mendaftar adalah biaya bulan pertama: Rp 399.000 untuk Weekend Coding Class (tatap muka) dan Rp 449.000 untuk Premium Online Class (privat 1-on-1). Masing-masing 1x seminggu selama 90 menit.",
  },
  {
    q: "Metode pembayaran apa saja yang bisa dipakai?",
    a: "Pembayaran diproses oleh Mayar dan mendukung QRIS, transfer bank atau virtual account, serta e-wallet. Link pembayaran berlaku 3 hari sejak formulir dikirim.",
  },
  {
    q: "Bagaimana dengan Custom Project Class?",
    a: "Custom Project Class tidak dibayar saat mendaftar karena biayanya menyesuaikan project. Setelah formulir dikirim, tim kami menghubungi Anda via WhatsApp untuk mendiskusikan ide, jadwal, dan biayanya.",
  },
  {
    q: "Setelah mendaftar, kapan kelas dimulai?",
    a: `Tim kami menghubungi Anda via WhatsApp untuk konfirmasi jadwal. Weekend Coding Class berlangsung setiap Minggu pukul 09.00–10.30 WITA di ${BUSINESS.shortAddress}, Balikpapan. Jadwal kelas online disepakati bersama mentor.`,
  },
  {
    q: "Anak saya belum pernah coding, apakah bisa ikut?",
    a: "Bisa. Kurikulum Supercoder dirancang untuk pemula total, dimulai dari dasar HTML dan CSS. Kelas terbuka untuk siswa SMP, SMA, mahasiswa, dan umum.",
  },
  {
    q: "Bisa konsultasi dulu sebelum mendaftar?",
    a: `Tentu. Hubungi kami via WhatsApp di ${BUSINESS.phoneDisplay} untuk bertanya soal program, jadwal, atau level yang cocok sebelum mengisi formulir.`,
  },
];
