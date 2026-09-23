import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BlogListing from "@/components/blog/BlogListing";
import JsonLdScript from "@/components/seo/JsonLdScript";
import {
  getCategoriesWithPosts,
  getCategoryBySlug,
  getPublishedPosts,
} from "@/lib/blog/queries";
import {
  buildBlogListJsonLd,
  buildBreadcrumbJsonLd,
  categoryUrl,
} from "@/lib/blog/jsonld";
import { SITE_URL } from "@/lib/site";

export const revalidate = 60;
export const dynamicParams = true;

export async function generateStaticParams() {
  const categories = await getCategoriesWithPosts();
  return categories.map((c) => ({ slug: c.slug }));
}

type Props = { params: Promise<{ slug: string }> };

function describe(name: string, description: string | null) {
  return (
    description?.trim() ||
    `Kumpulan artikel ${name} dari Supercoder: tips, panduan, dan insight seputar coding & AI.`
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) {
    return { title: "Kategori Tidak Ditemukan", robots: { index: false, follow: false } };
  }
  const description = describe(category.name, category.description);
  const url = categoryUrl(category.slug);
  return {
    title: `Artikel ${category.name}`,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url,
      title: `Artikel ${category.name} | Supercoder`,
      description,
      siteName: "Supercoder",
      locale: "id_ID",
      images: [{ url: "/images/hero-image-supercoder.webp", width: 1200, height: 630 }],
    },
  };
}

export default async function BlogCategoryPage({ params }: Props) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const [posts, categories] = await Promise.all([
    getPublishedPosts({ categoryId: category.id, limit: 60 }),
    getCategoriesWithPosts(),
  ]);

  return (
    <>
      <JsonLdScript
        data={[
          buildBlogListJsonLd(posts, category),
          buildBreadcrumbJsonLd([
            { name: "Beranda", url: SITE_URL },
            { name: "Blog", url: `${SITE_URL}/blog` },
            { name: category.name, url: categoryUrl(category.slug) },
          ]),
        ]}
      />
      <BlogListing
        title={`Artikel ${category.name}`}
        description={describe(category.name, category.description)}
        breadcrumbs={[
          { name: "Beranda", href: "/" },
          { name: "Blog", href: "/blog" },
          { name: category.name },
        ]}
        posts={posts}
        categories={categories}
        activeCategory={category.slug}
      />
    </>
  );
}
