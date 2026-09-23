import Link from "next/link";
import styles from "../../admin.module.css";
import PostForm from "@/components/blog/admin/PostForm";
import { requireBlogAdminPage } from "@/lib/blog/auth";
import type { BlogCategory } from "@/lib/blog/types";

export const metadata = { title: "Artikel Baru | Admin Supercoder" };

export default async function NewPostPage() {
  const { supabase, profile } = await requireBlogAdminPage();
  const { data: categories } = await supabase
    .from("blog_categories")
    .select("id, name, slug, description, order_index")
    .order("order_index")
    .order("name");

  return (
    <div>
      <Link href="/admin/blog" className="text-sm text-slate-500 hover:text-red-600">← Semua artikel</Link>
      <h1 className={styles.pageTitle} style={{ marginTop: 8 }}>Artikel Baru</h1>
      <PostForm
        categories={(categories ?? []) as BlogCategory[]}
        defaultAuthorName={profile?.full_name ?? ""}
      />
    </div>
  );
}
