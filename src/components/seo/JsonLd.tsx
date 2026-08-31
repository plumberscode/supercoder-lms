export default function JsonLd() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://supercoder.id";

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": ["EducationalOrganization", "LocalBusiness"],
    "@id": `${siteUrl}/#organization`,
    name: "Supercoder",
    alternateName: ["Supercoder Balikpapan", "Supercoder Coding School"],
    url: siteUrl,
    logo: `${siteUrl}/images/Logo%20transparent%20orange.webp`,
    image: `${siteUrl}/images/hero-image-supercoder.webp`,
    description:
      "Tempat generasi muda memahami teknologi, menguasai coding fundamentals, dan menggunakan AI untuk mengubah ide menjadi produk digital nyata di Balikpapan.",
    telephone: "+6287788931919",
    priceRange: "Rp 499.000 - Rp 650.000",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Balikpapan",
      addressRegion: "Kalimantan Timur",
      addressCountry: "ID",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: -1.2379,
      longitude: 116.8529,
    },
    sameAs: ["https://www.instagram.com/supercoder.id"],
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday",
        ],
        opens: "09:00",
        closes: "18:00",
      },
    ],
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Apakah anak/pemula yang belum pernah coding bisa ikut?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Tentu bisa. Materi kami dirancang khusus dengan kurikulum berjenjang dari level dasar (fundamental) hingga mahir, dipandu langsung secara intensif oleh mentor berpengalaman.",
        },
      },
      {
        "@type": "Question",
        name: "Apa bedanya Supercoder dengan tempat les coding biasa?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Supercoder mengintegrasikan fondasi coding murni (HTML, CSS, JavaScript) dengan Modern AI Workflow (Antigravity). Siswa tidak hanya tahu teori, tetapi mampu membangun aplikasi web nyata dan portofolio mandiri.",
        },
      },
      {
        "@type": "Question",
        name: "Apakah siswa perlu membawa laptop sendiri?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Ya, disarankan membawa laptop pribadi (spesifikasi standar Windows / Mac / Linux) agar project dan file latihan dapat langsung tersimpan dan dilanjutkan belajar di rumah.",
        },
      },
      {
        "@type": "Question",
        name: "Bahasa pemrograman dan tools apa saja yang dipelajari?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Mulai dari HTML5, CSS3, JavaScript ES6+, Tailwind CSS, Next.js Framework, Serverless Database, VS Code, Git/GitHub, hingga AI Tools seperti Antigravity.",
        },
      },
      {
        "@type": "Question",
        name: "Apakah ada pilihan kelas offline dan online?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Ya, kami menyediakan kelas offline (tatap muka kelompok kecil di Balikpapan) dan kelas online privat 1-on-1 bersama mentor yang dapat diikuti dari mana saja secara fleksibel.",
        },
      },
      {
        "@type": "Question",
        name: "Berapa jumlah siswa maksimal untuk kelas offline dan online?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Untuk menjaga efektivitas bimbingan, kelas offline dibatasi maksimal 6 orang per sesi, sedangkan kelas online bersifat privat 1-on-1 (1 siswa bersama 1 mentor).",
        },
      },
    ],
  };

  const coursesSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: [
      {
        "@type": "Course",
        name: "Supercoder Junior: Web Fundamental",
        description:
          "Membangun fondasi logika berpikir komputasional, struktur HTML5, styling modern CSS3, serta pengenalan dasar interaktivitas web.",
        provider: {
          "@type": "Organization",
          name: "Supercoder",
          sameAs: siteUrl,
        },
      },
      {
        "@type": "Course",
        name: "Supercoder Builder: Interactive Apps",
        description:
          "Penguasaan logika JavaScript mendalam, manipulasi DOM, integrasi AI workflow, dan pembuatan aplikasi web interaktif nyata.",
        provider: {
          "@type": "Organization",
          name: "Supercoder",
          sameAs: siteUrl,
        },
      },
      {
        "@type": "Course",
        name: "Supercoder Elite: AI-Powered Fullstack",
        description:
          "Puncak kurikulum hybrid: Next.js Framework, Serverless Database, integrasi modern AI tools, dan showcase portofolio aplikasi mandiri.",
        provider: {
          "@type": "Organization",
          name: "Supercoder",
          sameAs: siteUrl,
        },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(coursesSchema) }}
      />
    </>
  );
}
