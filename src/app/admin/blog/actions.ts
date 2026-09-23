"use server";

import { revalidatePath } from "next/cache";
import { requireBlogAdmin } from "@/lib/blog/auth";
import { sanitizeArticleHtml } from "@/lib/blog/html";
import { cleanExcerpt, slugify } from "@/lib/blog/text";
import type { FaqItem } from "@/lib/blog/types";

export type PublishMode = "now" | "schedule" | "draft";

export type PostInput = {
  title: string;
  headline: string;
  slug: string;
  content: string;
  excerpt: string;
  metaDescription: string;
  categoryId: string | null;
  imageUrl: string;
  imageAlt: string;
  authorName: string;
  faq: FaqItem[];
  noindex: boolean;
  publishMode: PublishMode;
  scheduledAt: string | null; // ISO
};

type Result = { success: true; id: string; slug: string } | { success: false; error: string };

// Segmen statis di bawah /blog yang tidak boleh dipakai sebagai slug artikel
const RESERVED_SLUGS = new Set(["kategori", "rss-xml", "rssxml", "page"]);

function revalidateBlog() {
  // Semua halaman di bawah /blog: indeks, kategori, artikel, RSS, OG image
  revalidatePath("/blog", "layout");
  revalidatePath("/sitemap.xml");
  revalidatePath("/admin/blog");
}

async function uniqueSlug(
  supabase: Awaited<ReturnType<typeof requireBlogAdmin>>["supabase"],
  wanted: string,
  excludeId?: string,
) {
  let base = slugify(wanted) || "artikel";
  if (RESERVED_SLUGS.has(base)) base = `${base}-artikel`;

  for (let i = 1; i <= 20; i++) {
    const candidate = i === 1 ? base : `${base}-${i}`;
    let query = supabase.from("blog_posts").select("id").eq("slug", candidate);
    if (excludeId) query = query.neq("id", excludeId);
    const { data } = await query.maybeSingle();
    if (!data) return candidate;
  }
  return `${base}-${Date.now()}`;
}

function buildRow(input: PostInput, existingPublishedAt?: string | null) {
  const content = sanitizeArticleHtml(input.content);
  const metaDescription = input.metaDescription.trim() || cleanExcerpt(content);

  let isPublished = input.publishMode !== "draft";
  let publishedAt = existingPublishedAt ?? new Date().toISOString();

  if (input.publishMode === "schedule") {
    if (!input.scheduledAt) throw new Error("Tanggal jadwal terbit wajib diisi.");
    publishedAt = new Date(input.scheduledAt).toISOString();
  } else if (input.publishMode === "now") {
    // Pertahankan tanggal terbit asli bila artikel sudah pernah terbit
    const keep = existingPublishedAt && new Date(existingPublishedAt) <= new Date();
    publishedAt = keep ? existingPublishedAt! : new Date().toISOString();
  } else {
    isPublished = false;
  }

  return {
    title: input.title.trim(),
    headline: input.headline.trim() || input.title.trim(),
    content,
    excerpt: input.excerpt.trim() || null,
    meta_description: metaDescription,
    category_id: input.categoryId || null,
    image_url: input.imageUrl.trim() || null,
    image_alt: input.imageAlt.trim() || null,
    author_name: input.authorName.trim() || null,
    faq: input.faq
      .map((f) => ({ q: f.q.trim(), a: f.a.trim() }))
      .filter((f) => f.q && f.a),
    noindex: input.noindex,
    is_published: isPublished,
    published_at: publishedAt,
  };
}

function validate(input: PostInput): string | null {
  if (!input.title.trim()) return "Judul SEO wajib diisi.";
  if (!sanitizeArticleHtml(input.content).replace(/<[^>]+>/g, "").trim()) {
    return "Konten artikel masih kosong.";
  }
  if (input.imageUrl.trim() && !input.imageAlt.trim()) {
    return "Alt text gambar unggulan wajib diisi (penting untuk SEO & aksesibilitas).";
  }
  return null;
}

export async function createPost(input: PostInput): Promise<Result> {
  try {
    const { supabase, user } = await requireBlogAdmin();
    const invalid = validate(input);
    if (invalid) return { success: false, error: invalid };

    const slug = await uniqueSlug(supabase, input.slug || input.title);
    const { data, error } = await supabase
      .from("blog_posts")
      .insert({ ...buildRow(input), slug, author_id: user.id })
      .select("id, slug")
      .single();

    if (error) return { success: false, error: error.message };
    revalidateBlog();
    return { success: true, id: data.id, slug: data.slug };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Gagal menyimpan artikel." };
  }
}

export async function updatePost(id: string, input: PostInput): Promise<Result> {
  try {
    const { supabase } = await requireBlogAdmin();
    const invalid = validate(input);
    if (invalid) return { success: false, error: invalid };

    const { data: existing } = await supabase
      .from("blog_posts")
      .select("slug, published_at")
      .eq("id", id)
      .single();
    if (!existing) return { success: false, error: "Artikel tidak ditemukan." };

    const slug =
      slugify(input.slug) === existing.slug
        ? existing.slug
        : await uniqueSlug(supabase, input.slug || input.title, id);

    const { data, error } = await supabase
      .from("blog_posts")
      .update({ ...buildRow(input, existing.published_at), slug })
      .eq("id", id)
      .select("id, slug")
      .single();

    if (error) return { success: false, error: error.message };
    revalidateBlog();
    return { success: true, id: data.id, slug: data.slug };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Gagal menyimpan artikel." };
  }
}

export async function deletePost(id: string) {
  const { supabase } = await requireBlogAdmin();
  const { error } = await supabase.from("blog_posts").delete().eq("id", id);
  if (error) throw new Error(`Gagal menghapus artikel: ${error.message}`);
  revalidateBlog();
  return { success: true };
}

// ---------- Kategori ----------

export async function saveCategory(input: {
  id?: string;
  name: string;
  slug?: string;
  description?: string;
  orderIndex?: number;
}) {
  const { supabase } = await requireBlogAdmin();
  const name = input.name.trim();
  if (!name) return { success: false, error: "Nama kategori wajib diisi." };

  const row = {
    name,
    slug: slugify(input.slug || name),
    description: input.description?.trim() || null,
    order_index: input.orderIndex ?? 0,
  };

  const { error } = input.id
    ? await supabase.from("blog_categories").update(row).eq("id", input.id)
    : await supabase.from("blog_categories").insert(row);

  if (error) {
    return {
      success: false,
      error: error.code === "23505" ? "Slug kategori sudah dipakai." : error.message,
    };
  }
  revalidateBlog();
  revalidatePath("/admin/blog/categories");
  return { success: true };
}

export async function deleteCategory(id: string) {
  const { supabase } = await requireBlogAdmin();
  const { error } = await supabase.from("blog_categories").delete().eq("id", id);
  if (error) return { success: false, error: error.message };
  revalidateBlog();
  revalidatePath("/admin/blog/categories");
  return { success: true };
}
