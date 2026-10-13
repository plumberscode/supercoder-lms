import RegistrationForm from "./RegistrationForm";
import DaftarInfo from "./DaftarInfo";
import JsonLdScript from "@/components/seo/JsonLdScript";
import { SITE_URL } from "@/lib/site";
import { buildCourseJsonLd } from "@/app/kursus-komputer-balikpapan/data";
import { DAFTAR_PATH, daftarFaqs } from "./data";

type SearchParams = Promise<{ class?: string; program?: string }>;

const PAGE_URL = `${SITE_URL}${DAFTAR_PATH}`;

function buildJsonLd() {
  const faqPage = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${PAGE_URL}#faq`,
    mainEntity: daftarFaqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Beranda", item: `${SITE_URL}/` },
      { "@type": "ListItem", position: 2, name: "Daftar Kelas", item: PAGE_URL },
    ],
  };

  return [faqPage, breadcrumb, ...buildCourseJsonLd()];
}

// Server Component: parameter dibaca di sini agar seluruh form (termasuk H1) ada di HTML awal.
export default async function RegistrationPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  return (
    <>
      <JsonLdScript data={buildJsonLd()} />
      <RegistrationForm initialClassParam={params.class || params.program || ""} />
      <DaftarInfo />
    </>
  );
}
