import Link from "next/link";
import styles from "../../admin.module.css";
import { requireBlogAdminPage } from "@/lib/blog/auth";
import type { BlogCategory } from "@/lib/blog/types";
import CategoryManager from "./CategoryManager";

export const metadata = { title: "Kategori Blog | Admin Supercoder" };

export default async function BlogCategoriesPage() {
  const { supabase } = await requireBlogAdminPage();
  const { data } = await supabase
    .from("blog_categories")
    .select("id, name, slug, description, order_index")
    .order("order_index")
    .order("name");

  return (
    <div className="max-w-3xl">
      <Link href="/admin/blog" className="text-sm text-slate-500 hover:text-red-600">← Semua artikel</Link>
      <h1 className={styles.pageTitle} style={{ marginTop: 8 }}>Kategori Blog</h1>
      <p className="text-sm text-slate-500 mb-6">
        Setiap kategori punya halaman sendiri di <code>/blog/kategori/[slug]</code>. Deskripsi dipakai sebagai
        meta description halaman kategori.
      </p>
      <CategoryManager categories={(data ?? []) as BlogCategory[]} />
    </div>
  );
}
