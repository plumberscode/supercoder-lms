import "highlight.js/styles/github-dark.css";
import Link from "next/link";
import { notFound } from "next/navigation";
import ArticleView from "@/components/blog/ArticleView";
import { requireBlogAdminPage } from "@/lib/blog/auth";
import { processArticleHtml } from "@/lib/blog/html";
import { postUrl } from "@/lib/blog/jsonld";
import { POST_FIELDS } from "@/lib/blog/queries";
import type { BlogPost } from "@/lib/blog/types";

export const metadata = {
  title: "Preview Artikel | Admin Supercoder",
  robots: { index: false, follow: false },
};

/**
 * Preview draft/terjadwal memakai client dengan cookie (RLS admin).
 * Dipisah dari /blog/[slug] agar halaman publik tetap statis.
 */
export default async function PreviewPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireBlogAdminPage();
  const { data } = await supabase.from("blog_posts").select(POST_FIELDS).eq("id", id).maybeSingle();
  if (!data) notFound();

  const post = data as unknown as BlogPost;
  const article = processArticleHtml(post.content, post.headline || post.title);
  const scheduled = post.is_published && new Date(post.published_at) > new Date();

  return (
    <div className="bg-white rounded-2xl -m-2">
      <ArticleView
        post={post}
        article={article}
        related={[]}
        url={postUrl(post.slug)}
        banner={
          <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm flex flex-wrap items-center gap-3">
            <strong>
              Mode preview: {!post.is_published ? "Draft" : scheduled ? "Terjadwal" : "Terbit"}
            </strong>
            <span>Halaman ini hanya bisa dilihat admin.</span>
            <Link href={`/admin/blog/edit/${post.id}`} className="ml-auto font-semibold underline">
              Kembali ke editor
            </Link>
          </div>
        }
      />
    </div>
  );
}
