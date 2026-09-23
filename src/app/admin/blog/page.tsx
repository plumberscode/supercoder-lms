import Link from "next/link";
import styles from "../admin.module.css";
import { requireBlogAdminPage } from "@/lib/blog/auth";
import { formatDateId } from "@/lib/blog/text";
import DeletePostButton from "./DeletePostButton";

export const metadata = {
  title: "Blog | Admin Supercoder",
};

type Row = {
  id: string;
  title: string;
  slug: string;
  is_published: boolean;
  published_at: string;
  updated_at: string;
  noindex: boolean;
  meta_description: string | null;
  image_url: string | null;
  category: { name: string } | null;
};

function status(row: Row) {
  if (!row.is_published) return { text: "Draft", cls: "bg-slate-100 text-slate-600" };
  if (new Date(row.published_at) > new Date()) return { text: "Terjadwal", cls: "bg-amber-100 text-amber-700" };
  return { text: "Terbit", cls: "bg-emerald-100 text-emerald-700" };
}

export default async function AdminBlogPage() {
  const { supabase } = await requireBlogAdminPage();
  const { data, error } = await supabase
    .from("blog_posts")
    .select("id, title, slug, is_published, published_at, updated_at, noindex, meta_description, image_url, category:blog_categories(name)")
    .order("updated_at", { ascending: false });

  const posts = (data ?? []) as unknown as Row[];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className={styles.pageTitle} style={{ margin: 0 }}>Blog</h1>
          <p className="text-sm text-slate-500 mt-1">Artikel SEO untuk supercoder.id/blog</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/blog/categories" className="px-4 py-2 rounded-xl border border-slate-300 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50">
            Kategori
          </Link>
          <Link href="/admin/blog/new" className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold">
            + Artikel Baru
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 mb-6 rounded-xl bg-red-50 text-red-800 text-sm">
          Gagal memuat artikel: {error.message}. Pastikan <code>migration_blog.sql</code> sudah dijalankan di Supabase.
        </div>
      )}

      {posts.length === 0 && !error ? (
        <div className="p-10 rounded-2xl border border-dashed border-slate-300 bg-white text-center text-slate-500">
          Belum ada artikel. <Link href="/admin/blog/new" className="text-red-600 font-semibold">Tulis artikel pertama</Link>.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Judul</th>
                <th className="px-4 py-3 font-semibold">Kategori</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Tanggal terbit</th>
                <th className="px-4 py-3 font-semibold">Cek SEO</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {posts.map((p) => {
                const s = status(p);
                const warnings = [
                  !p.meta_description && "meta",
                  !p.image_url && "gambar",
                  p.noindex && "noindex",
                ].filter(Boolean);
                return (
                  <tr key={p.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3">
                      <Link href={`/admin/blog/edit/${p.id}`} className="font-semibold text-slate-900 hover:text-red-600">
                        {p.title}
                      </Link>
                      <div className="text-xs text-slate-400">/blog/{p.slug}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{p.category?.name ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${s.cls}`}>{s.text}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{formatDateId(p.published_at)}</td>
                    <td className="px-4 py-3 text-xs">
                      {warnings.length ? (
                        <span className="text-amber-600">Kurang: {warnings.join(", ")}</span>
                      ) : (
                        <span className="text-emerald-600">OK</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2 whitespace-nowrap">
                        {s.text === "Terbit" ? (
                          <a href={`/blog/${p.slug}`} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-slate-600 hover:text-red-600">
                            Lihat
                          </a>
                        ) : (
                          <Link href={`/admin/blog/preview/${p.id}`} target="_blank" className="text-xs font-semibold text-slate-600 hover:text-red-600">
                            Preview
                          </Link>
                        )}
                        <Link href={`/admin/blog/edit/${p.id}`} className="text-xs font-semibold text-slate-600 hover:text-red-600">
                          Edit
                        </Link>
                        <DeletePostButton id={p.id} title={p.title} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
