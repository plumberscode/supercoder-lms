import Link from "next/link";
import { notFound } from "next/navigation";
import styles from "../../../admin.module.css";
import PostForm from "@/components/blog/admin/PostForm";
import { requireBlogAdminPage } from "@/lib/blog/auth";
import { POST_FIELDS } from "@/lib/blog/queries";
import type { BlogCategory, BlogPost } from "@/lib/blog/types";

export const metadata = { title: "Edit Artikel | Admin Supercoder" };

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, profile } = await requireBlogAdminPage();

  const [{ data: post }, { data: categories }] = await Promise.all([
    supabase.from("blog_posts").select(POST_FIELDS).eq("id", id).maybeSingle(),
    supabase
      .from("blog_categories")
      .select("id, name, slug, description, order_index")
      .order("order_index")
      .order("name"),
  ]);

  if (!post) notFound();

  return (
    <div>
      <Link href="/admin/blog" className="text-sm text-slate-500 hover:text-red-600">← Semua artikel</Link>
      <h1 className={styles.pageTitle} style={{ marginTop: 8 }}>Edit Artikel</h1>
      <PostForm
        key={(post as unknown as BlogPost).updated_at}
        post={post as unknown as BlogPost}
        categories={(categories ?? []) as BlogCategory[]}
        defaultAuthorName={profile?.full_name ?? ""}
      />
    </div>
  );
}
