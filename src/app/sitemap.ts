import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { getCategoriesWithPosts, getPublishedPostIndex } from "@/lib/blog/queries";

export const revalidate = 300;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // URL #anchor tidak dimasukkan: Google mengabaikan fragment, jadi hanya menjadi duplikat "/"
  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: now, changeFrequency: "weekly", priority: 1.0 },
    { url: `${SITE_URL}/daftar`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/kursus-komputer-balikpapan`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/blog`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
  ];

  try {
    const [posts, categories] = await Promise.all([
      getPublishedPostIndex(),
      getCategoriesWithPosts(),
    ]);

    const categoryPages: MetadataRoute.Sitemap = categories.map((c) => ({
      url: `${SITE_URL}/blog/kategori/${c.slug}`,
      changeFrequency: "weekly",
      priority: 0.6,
    }));

    const postPages: MetadataRoute.Sitemap = posts
      .filter((p) => !p.noindex)
      .map((p) => ({
        url: `${SITE_URL}/blog/${p.slug}`,
        lastModified: new Date(p.updated_at),
        changeFrequency: "weekly",
        priority: 0.7,
      }));

    return [...staticPages, ...categoryPages, ...postPages];
  } catch (error) {
    console.error("sitemap: gagal memuat data blog", error);
    return staticPages;
  }
}
