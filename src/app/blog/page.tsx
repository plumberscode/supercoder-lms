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
      />
    </>
  );
}
