import type { Metadata } from "next";
import BlogListing from "@/components/blog/BlogListing";
import JsonLdScript from "@/components/seo/JsonLdScript";
import { getCategoriesWithPosts, getPublishedPosts } from "@/lib/blog/queries";
import { buildBlogListJsonLd, buildBreadcrumbJsonLd } from "@/lib/blog/jsonld";
import { SITE_URL } from "@/lib/site";

export const revalidate = 60;

const TITLE = "Blog Coding & AI";
const DESCRIPTION =
  "Tips belajar coding, web development, dan AI untuk pelajar & orang tua. Panduan praktis dari mentor Supercoder Balikpapan.";

const INTRO = [
  "Blog Supercoder berisi panduan praktis seputar belajar coding, pengembangan web, dan pemanfaatan AI untuk pelajar SMP, SMA, dan umum di Balikpapan maupun seluruh Indonesia. Setiap artikel ditulis oleh mentor yang mengajar langsung di kelas, sehingga contoh dan sarannya berangkat dari pengalaman nyata siswa.",
  "Orang tua dapat menemukan tips memilih kursus coding, cara mendampingi anak belajar, dan gambaran kemampuan yang realistis di setiap tahap. Siswa dapat menemukan kisah prestasi, ide project, serta langkah belajar yang bisa langsung dipraktikkan. Pilih kategori di bawah untuk mempersempit topik, atau mulai dari artikel terbaru.",
];

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: "/blog",
    types: { "application/rss+xml": "/blog/rss.xml" },
  },
  openGraph: {
    type: "website",
    url: "/blog",
    title: `${TITLE} | Supercoder`,
    description: DESCRIPTION,
    siteName: "Supercoder",
    locale: "id_ID",
    images: [{ url: "/images/hero-image-supercoder.webp", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${TITLE} | Supercoder`,
    description: DESCRIPTION,
    images: ["/images/hero-image-supercoder.webp"],
  },
};

export default async function BlogIndexPage() {
  const [posts, categories] = await Promise.all([
    getPublishedPosts({ limit: 60 }),
    getCategoriesWithPosts(),
  ]);

  return (
    <>
      <JsonLdScript
        data={[
          buildBlogListJsonLd(posts),
          buildBreadcrumbJsonLd([
            { name: "Beranda", url: SITE_URL },
            { name: "Blog", url: `${SITE_URL}/blog` },
          ]),
        ]}
      />
      <BlogListing
        title={TITLE}
        description={DESCRIPTION}
        breadcrumbs={[{ name: "Beranda", href: "/" }, { name: "Blog" }]}
        posts={posts}
        categories={categories}
        intro={INTRO}
      />
    </>
  );
}
