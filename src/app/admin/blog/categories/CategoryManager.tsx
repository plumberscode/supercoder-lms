"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteCategory, saveCategory } from "../actions";
import { slugify } from "@/lib/blog/text";
import type { BlogCategory } from "@/lib/blog/types";

type Draft = { id?: string; name: string; slug: string; description: string; orderIndex: number };

const empty: Draft = { name: "", slug: "", description: "", orderIndex: 0 };
const input =
  "w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20";

export default function CategoryManager({ categories }: { categories: BlogCategory[] }) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft>(empty);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await saveCategory({ ...draft, slug: draft.slug || slugify(draft.name) });
    setBusy(false);
    if (!res.success) return setError(res.error ?? "Gagal menyimpan.");
    setDraft(empty);
    router.refresh();
  };

  const remove = async (c: BlogCategory) => {
    if (!confirm(`Hapus kategori "${c.name}"? Artikel di dalamnya menjadi tanpa kategori.`)) return;
    const res = await deleteCategory(c.id);
    if (!res.success) return setError(res.error ?? "Gagal menghapus.");
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <form onSubmit={submit} className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
        <p className="font-bold text-slate-900">{draft.id ? "Edit kategori" : "Tambah kategori"}</p>
        <div className="grid sm:grid-cols-[1fr_1fr_100px] gap-3">
          <input
            className={input}
            placeholder="Nama (mis. Tips Belajar Coding)"
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            required
          />
          <input
            className={input}
            placeholder={slugify(draft.name) || "slug"}
            value={draft.slug}
            onChange={(e) => setDraft({ ...draft, slug: e.target.value })}
          />
          <input
            type="number"
            className={input}
            title="Urutan"
            value={draft.orderIndex}
            onChange={(e) => setDraft({ ...draft, orderIndex: Number(e.target.value) || 0 })}
          />
        </div>
        <textarea
          className={input}
          rows={2}
          placeholder="Deskripsi kategori (meta description halaman kategori, 120–160 karakter)"
          value={draft.description}
          onChange={(e) => setDraft({ ...draft, description: e.target.value })}
        />
        {error && <p className="text-sm text-red-700">{error}</p>}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={busy}
            className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold disabled:opacity-60 cursor-pointer"
          >
            {draft.id ? "Simpan perubahan" : "Tambah"}
          </button>
          {draft.id && (
            <button type="button" onClick={() => setDraft(empty)} className="px-4 py-2 rounded-lg border border-slate-300 text-sm cursor-pointer">
              Batal
            </button>
          )}
        </div>
      </form>

      <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100">
        {categories.length === 0 && <p className="p-5 text-sm text-slate-500">Belum ada kategori.</p>}
        {categories.map((c) => (
          <div key={c.id} className="p-4 flex items-start gap-4">
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-900">{c.name}</p>
              <p className="text-xs text-slate-400">/blog/kategori/{c.slug} · urutan {c.order_index}</p>
              {c.description && <p className="text-sm text-slate-600 mt-1">{c.description}</p>}
            </div>
            <button
              type="button"
              onClick={() =>
                setDraft({
                  id: c.id,
                  name: c.name,
                  slug: c.slug,
                  description: c.description ?? "",
                  orderIndex: c.order_index,
                })
              }
              className="text-xs font-semibold text-slate-600 hover:text-red-600 cursor-pointer"
            >
              Edit
            </button>
            <button type="button" onClick={() => remove(c)} className="text-xs font-semibold text-red-600 cursor-pointer">
              Hapus
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
