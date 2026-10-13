// Data testimoni dipakai carousel homepage dan halaman /daftar.
export interface Testimonial {
  name: string;
  role: string;
  highlight: string;
  quote: string;
  stars: number;
  program: string;
  initial: string;
  color: string;
  image?: string;
}

export const testimonials: Testimonial[] = [
  {
    name: "Naufal Brata Pratama",
    role: "Siswa SMAN 1 Balikpapan",
    highlight: "Sangat interaktif & ilmunya berguna untuk masa depan.",
    quote:
      "Saya sangat menikmati coding class di Supercoder. Materinya sangat relevan dan pas pertama kali website saya bisa dibuka di browser rasanya bangga sekali. Feedback dari instruktur sangat membantu.",
    stars: 5,
    program: "Weekend Class",
    initial: "NB",
    color: "from-orange-500 to-amber-500",
  },
  {
    name: "Maria Olga",
    role: "Staf ASN",
    highlight: "Belajar dari nol tidak semenakutkan itu 😁",
    quote:
      "Pagi kak...happy poll, jujur belajar hal baru dari nol di coding class supercoder, tidak semenakutkan itu 😁, buat saya yg gaptek hal ini, belajar dengan sistem online tidak sulit. Saya sukai pengajar dapat membawakan materi dengan sederhana, yg saya orang awam bisa memahaminya. Bahkan bisa disesuaikan dengan jadwal saya juga.",
    stars: 5,
    program: "Online Class",
    initial: "MO",
    color: "from-red-500 to-rose-500",
  },
  {
    name: "Muhammad Aslam",
    role: "Siswa Kelas 9 MTS Ibnu Umar",
    highlight: "Tempatnya nyaman, materi gampang masuk ke otak.",
    quote:
      "Gurunya penjelasannya baik dan ramah. Saya belajar dari HTML, CSS hingga Javascript dan sekarang sudah bisa bikin website sendiri.",
    stars: 5,
    program: "Bootcamp",
    initial: "MA",
    color: "from-purple-600 to-indigo-600",
  },
  {
    name: "Muhammad Qadarian",
    role: "Guru, SD Al-Imam Islamic School",
    highlight: "Materi interaktif & desain materinya mantap!",
    quote:
      "Seru banget! Banyak ilmu baru yang didapat, basic-basicnya dapat semua. Sangat membantu saya membuat media pembelajaran digital yang menarik untuk murid.",
    stars: 5,
    program: "Bootcamp",
    initial: "MQ",
    color: "from-cyan-600 to-blue-600",
    image: "/images/rian.webp",
  },
];

// Pinned above the auto-sliding carousel — does not rotate and is not part
// of `testimonials`/the slide logic at all.
export const featuredTestimonial: Testimonial = {
  name: "Riffat Nararya",
  role: "Siswa Kelas 9 SMPIT Al Firdaus, Samarinda",
  highlight: "Ada leaderboard yang membuat kita bersemangat..",
  quote: [
    "Materinya sangat gampang dipahami dan metode koreksinya menggunakan AI yang sangat memudahkan dan membantu memberitahu masalah di code/script yang kita ketik.",
    "Ada leaderboard yang membuat kita bersemangat mengejar peringkat ke-1 dan banyak challenge yang asik.",
    "Belajar di sini sangat asik dan cepat paham, saya sudah belajar selama 2 tahun di Supercoder tanpa ada kendala satu pun.",
  ].join("\n\n"),
  stars: 5,
  program: "Premium Online Class",
  initial: "RN",
  color: "from-amber-500 to-orange-600",
};
