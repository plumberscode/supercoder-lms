import JsonLdScript from "@/components/seo/JsonLdScript";
import { faqs } from "@/components/homepage/faq-data";
import { BUSINESS, SITE_URL, SITE_NAME } from "@/lib/site";

// Konten /daftar untuk SEO: form saja terlalu tipis. Harga mengikuti ProgramSection di homepage.
const classes = [
  {
    name: "Weekend Coding Class",
    mode: "Tatap muka",
    price: "Rp 449.000 / bulan",
    schedule: "1x seminggu, hari Minggu pukul 09.00 - 10.30 WITA (90 menit per sesi)",
    place: `${BUSINESS.streetAddress}, ${BUSINESS.city}`,
    desc: "Kelas kelompok kecil (maksimal 6 siswa) bersama mentor. Cocok untuk pelajar SMP, SMA, maupun umum yang ingin belajar coding dari nol: logika pemrograman, HTML, CSS, JavaScript, lalu memakai AI sebagai partner untuk mengerjakan project nyata. Suasana belajar langsung membuat siswa lebih mudah bertanya dan saling berbagi ide.",
  },
  {
    name: "Premium Online Class",
    mode: "Online privat 1-on-1",
    price: "Rp 499.000 / bulan",
    schedule: "1x seminggu, jadwal fleksibel (90 menit per sesi) lewat Google Meet",
    place: "Online, dapat diikuti dari mana saja",
    desc: "Pembelajaran privat satu siswa dengan satu mentor dengan kurikulum adaptif yang menyesuaikan kecepatan belajar. Ideal bagi siswa dengan jadwal padat atau yang tinggal di luar Balikpapan. Fokus pada fondasi coding yang kuat sekaligus cara menggunakan AI secara efektif untuk mempercepat pembuatan project digital.",
  },
  {
    name: "Custom Project Class",
    mode: "Mentorship project (online)",
    price: "Menyesuaikan project",
    schedule: "2x seminggu (90 menit per sesi) lewat Google Meet",
    place: "Online",
    desc: "Untuk siswa yang sudah punya ide website atau aplikasi. Fundamental yang dibutuhkan dipelajari sambil membangun project secara bertahap bersama mentor, dengan bantuan coding dan AI. Skala project ringan hingga sedang; biaya didiskusikan setelah ide dan target project jelas.",
  },
] as const;

const steps = [
  "Pilih kelas yang sesuai pada formulir di atas, lalu isi data siswa dan kontak orang tua.",
  "Tim Supercoder menghubungi Anda lewat WhatsApp untuk konfirmasi jadwal dan ketersediaan seat.",
  "Siswa mulai belajar di sesi pertama; mentor menyesuaikan materi dengan tingkat kemampuan siswa.",
];

export default function ClassInfoSection() {
  const url = `${SITE_URL}/daftar`;
  const provider = { "@type": "Organization", name: SITE_NAME, sameAs: SITE_URL };

  const jsonLd = [
    ...classes.map((c) => ({
      "@context": "https://schema.org",
      "@type": "Course",
      name: `${c.name} Balikpapan`,
      description: c.desc,
      provider,
      hasCourseInstance: {
        "@type": "CourseInstance",
        courseMode: c.mode.startsWith("Tatap") ? "onsite" : "online",
        courseWorkload: "PT1H30M",
      },
    })),
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Beranda", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Daftar Kelas Coding", item: url },
      ],
    },
  ];

  return (
    <section className="bg-white px-4 py-14 sm:px-6 lg:px-8">
      <JsonLdScript data={jsonLd} />
      <div className="mx-auto max-w-2xl text-slate-700">
        <h2 className="font-poppins text-2xl font-bold text-slate-900">
          Pilihan Kelas Coding di Balikpapan
        </h2>
        <p className="mt-3 leading-relaxed">
          Supercoder adalah kursus coding dan AI di {BUSINESS.city} untuk pelajar SMP, SMA, dan umum.
          Setiap kelas berdurasi 90 menit per sesi dan dirancang agar siswa tidak hanya bisa memakai
          AI, tetapi juga paham logika di balik kode yang dihasilkan. Berikut perbandingan tiga kelas
          yang bisa Anda daftar.
        </p>

        <div className="mt-8 space-y-6">
          {classes.map((c) => (
            <article key={c.name} className="rounded-2xl border border-slate-200 p-5">
              <h3 className="font-poppins text-lg font-bold text-slate-900">{c.name}</h3>
              <p className="mt-1 text-sm font-semibold text-orange-700">
                {c.mode} · {c.price}
              </p>
              <p className="mt-3 leading-relaxed">{c.desc}</p>
              <dl className="mt-3 space-y-1 text-sm">
                <div><dt className="inline font-semibold">Jadwal: </dt><dd className="inline">{c.schedule}</dd></div>
                <div><dt className="inline font-semibold">Lokasi: </dt><dd className="inline">{c.place}</dd></div>
              </dl>
            </article>
          ))}
        </div>

        <h2 className="mt-12 font-poppins text-2xl font-bold text-slate-900">Cara Mendaftar</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 leading-relaxed">
          {steps.map((s) => <li key={s}>{s}</li>)}
        </ol>

        <h2 className="mt-12 font-poppins text-2xl font-bold text-slate-900">
          Pertanyaan yang Sering Diajukan
        </h2>
        <div className="mt-3 space-y-5">
          {faqs.map((f) => (
            <div key={f.q}>
              <h3 className="font-semibold text-slate-900">{f.q}</h3>
              <p className="mt-1 leading-relaxed">{f.a}</p>
            </div>
          ))}
        </div>

        <p className="mt-10 text-sm">
          Masih ragu memilih kelas? Hubungi kami di{" "}
          <a className="font-semibold text-orange-700 underline" href={BUSINESS.whatsappUrl}>
            WhatsApp {BUSINESS.phoneDisplay}
          </a>
          .
        </p>
      </div>
    </section>
  );
}
