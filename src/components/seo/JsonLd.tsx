import { SITE_URL, BUSINESS } from "@/lib/site";
import { faqs } from "@/components/homepage/faq-data";

export default function JsonLd() {
  const siteUrl = SITE_URL;

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
    telephone: BUSINESS.phone,
    priceRange: "Rp 449.000 - Rp 650.000",
    address: {
      "@type": "PostalAddress",
      streetAddress: BUSINESS.streetAddress,
      addressLocality: BUSINESS.city,
      addressRegion: BUSINESS.region,
      addressCountry: BUSINESS.country,
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: BUSINESS.geo.lat,
      longitude: BUSINESS.geo.lng,
    },
    hasMap: BUSINESS.mapsUrl,
    sameAs: [BUSINESS.instagramUrl, BUSINESS.mapsUrl],
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: "Sunday",
        opens: "09:00",
        closes: "10:30",
      },
    ],
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.a,
      },
    })),
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
