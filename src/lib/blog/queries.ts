import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { BlogCategory, BlogPost, BlogPostSummary } from "./types";

/**
 * Client Supabase TANPA cookie untuk halaman publik blog.
 * Tidak membaca cookies() sehingga /blog tetap statis (ISR). Ini memperbaiki
 * masalah di Falya, di mana halaman post menjadi dinamis di setiap request.
 * RLS memastikan anon hanya bisa membaca artikel yang sudah terbit.
 */
let publicClient: SupabaseClient | null | undefined;

function getPublicClient(): SupabaseClient | null {
  if (publicClient !== undefined) return publicClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  publicClient =
    url && key
      ? createClient(url, key, {
          auth: { persistSession: false, autoRefreshToken: false },
        })
      : null;
  return publicClient;
}

const CATEGORY_FIELDS = "id, name, slug, description, order_index";
export const SUMMARY_FIELDS = `id, title, slug, headline, excerpt, meta_description, image_url, image_alt, author_name, published_at, updated_at, category:blog_categories(${CATEGORY_FIELDS})`;
export const POST_FIELDS = `${SUMMARY_FIELDS}, content, category_id, faq, noindex, is_published, created_at`;

/** Filter publik: sudah terbit & tanggal terbit sudah lewat. */
function nowIso() {
  return new Date().toISOString();
}

export async function getPublishedPosts(
  options: { categoryId?: string; limit?: number } = {},
): Promise<BlogPostSummary[]> {
  const supabase = getPublicClient();
  if (!supabase) return [];

  let query = supabase
    .from("blog_posts")
    .select(SUMMARY_FIELDS)
    .eq("is_published", true)
    .lte("published_at", nowIso())
    .order("published_at", { ascending: false })
    .limit(options.limit ?? 100);

  if (options.categoryId) query = query.eq("category_id", options.categoryId);

  const { data, error } = await query;
  if (error) {
    console.error("getPublishedPosts:", error.message);
    return [];
  }
  return (data ?? []) as unknown as BlogPostSummary[];
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  const supabase = getPublicClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("blog_posts")
    .select(POST_FIELDS)
    .eq("slug", slug)
    .eq("is_published", true)
    .lte("published_at", nowIso())
    .maybeSingle();

  if (error) {
    console.error("getPostBySlug:", error.message);
    return null;
  }
  return data as unknown as BlogPost | null;
}

/** Untuk generateStaticParams, sitemap, dan RSS. */
export async function getPublishedPostIndex(): Promise<
  { slug: string; updated_at: string; noindex: boolean; category_id: string | null }[]
> {
  const supabase = getPublicClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("blog_posts")
    .select("slug, updated_at, noindex, category_id")
    .eq("is_published", true)
    .lte("published_at", nowIso())
    .order("published_at", { ascending: false });

  if (error) {
    console.error("getPublishedPostIndex:", error.message);
    return [];
  }
  return data ?? [];
}

/** Hanya kategori yang punya minimal satu artikel terbit. */
export async function getCategoriesWithPosts(): Promise<BlogCategory[]> {
  const supabase = getPublicClient();
  if (!supabase) return [];

  const [{ data: categories }, posts] = await Promise.all([
    supabase
      .from("blog_categories")
      .select(CATEGORY_FIELDS)
      .order("order_index")
      .order("name"),
    getPublishedPostIndex(),
  ]);

  const used = new Set(posts.map((p) => p.category_id).filter(Boolean));
  return ((categories ?? []) as BlogCategory[]).filter((c) => used.has(c.id));
}

export async function getCategoryBySlug(
  slug: string,
): Promise<BlogCategory | null> {
  const supabase = getPublicClient();
  if (!supabase) return null;

  const { data } = await supabase
    .from("blog_categories")
    .select(CATEGORY_FIELDS)
    .eq("slug", slug)
    .maybeSingle();
  return (data as BlogCategory | null) ?? null;
}

/** Artikel terkait: kategori sama dulu, lalu dilengkapi artikel terbaru. */
export async function getRelatedPosts(
  post: Pick<BlogPost, "id" | "category_id">,
  limit = 3,
): Promise<BlogPostSummary[]> {
  const sameCategory = post.category_id
    ? await getPublishedPosts({ categoryId: post.category_id, limit: limit + 1 })
    : [];
  const related = sameCategory.filter((p) => p.id !== post.id).slice(0, limit);
  if (related.length >= limit) return related;

  const latest = await getPublishedPosts({ limit: limit + related.length + 1 });
  const seen = new Set([post.id, ...related.map((p) => p.id)]);
  for (const p of latest) {
    if (related.length >= limit) break;
    if (!seen.has(p.id)) related.push(p);
  }
  return related;
}
