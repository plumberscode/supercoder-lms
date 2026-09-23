"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ImageIcon, Loader2, Plus, Sparkles, Trash2, X } from "lucide-react";
import { useToast } from "@/components/ToastProvider";
import { createPost, updatePost, type PostInput, type PublishMode } from "@/app/admin/blog/actions";
import { cleanExcerpt, slugify } from "@/lib/blog/text";
import type { BlogCategory, BlogPost, FaqItem } from "@/lib/blog/types";
import { SITE_URL } from "@/lib/site";
import RichTextEditor from "./RichTextEditor";
import MediaLibraryModal from "./MediaLibraryModal";

type Props = {
  post?: BlogPost;
  categories: BlogCategory[];
  defaultAuthorName: string;
};

function toLocalInput(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function initialMode(post?: BlogPost): PublishMode {
  if (!post) return "now";
  if (!post.is_published) return "draft";
  return new Date(post.published_at) > new Date() ? "schedule" : "now";
}

const input =
  "w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400";
const label = "block text-sm font-semibold text-slate-800 mb-1.5";
const hint = "text-xs text-slate-500 mt-1";
const card = "bg-white rounded-2xl border border-slate-200 p-5 space-y-4";

function Counter({ value, min, max }: { value: string; min: number; max: number }) {
  const n = value.trim().length;
  const color = n === 0 ? "text-slate-400" : n < min || n > max ? "text-amber-600" : "text-emerald-600";
  return (
    <span className={`text-xs font-semibold ${color}`}>
      {n} / {min}–{max}
    </span>
  );
}

export default function PostForm({ post, categories, defaultAuthorName }: Props) {
  const router = useRouter();
  const { showToast } = useToast();

  const [title, setTitle] = useState(post?.title ?? "");
  const [headline, setHeadline] = useState(post?.headline ?? "");
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(!!post);
  const [content, setContent] = useState(post?.content ?? "");
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "");
  const [metaDescription, setMetaDescription] = useState(post?.meta_description ?? "");
  const [categoryId, setCategoryId] = useState(post?.category_id ?? "");
  const [imageUrl, setImageUrl] = useState(post?.image_url ?? "");
  const [imageAlt, setImageAlt] = useState(post?.image_alt ?? "");
  const [authorName, setAuthorName] = useState(post?.author_name ?? defaultAuthorName);
  const [faq, setFaq] = useState<FaqItem[]>(post?.faq ?? []);
  const [noindex, setNoindex] = useState(post?.noindex ?? false);
  const [publishMode, setPublishMode] = useState<PublishMode>(initialMode(post));
  const [scheduledAt, setScheduledAt] = useState(
    post && initialMode(post) === "schedule" ? toLocalInput(post.published_at) : "",
  );
  const [showMedia, setShowMedia] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const effectiveSlug = slugTouched ? slugify(slug) : slugify(title);
  const serpDescription = metaDescription.trim() || cleanExcerpt(content);
  const serpUrl = useMemo(
    () => `${SITE_URL.replace(/^https?:\/\//, "")} › blog › ${effectiveSlug || "slug-artikel"}`,
    [effectiveSlug],
  );

  /** "# Judul" dari Markdown mengisi Headline & Judul SEO yang masih kosong. */
  const applyMarkdownTitle = (h1: string) => {
    setHeadline((prev) => prev.trim() || h1);
    setTitle((prev) => {
      if (prev.trim()) return prev;
      if (h1.length <= 60) return h1;
      const cut = h1.slice(0, 60);
      const space = cut.lastIndexOf(" ");
      return (space > 30 ? cut.slice(0, space) : cut).replace(/[\s,.;:–-]+$/, "");
    });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (publishMode === "schedule" && !scheduledAt) {
      setError("Isi tanggal & jam terbit untuk mode jadwal.");
      return;
    }

    const payload: PostInput = {
      title,
      headline,
      slug: effectiveSlug,
      content,
      excerpt,
      metaDescription,
      categoryId: categoryId || null,
      imageUrl,
      imageAlt,
      authorName,
      faq,
      noindex,
      publishMode,
      scheduledAt: publishMode === "schedule" ? new Date(scheduledAt).toISOString() : null,
    };

    setSaving(true);
    const res = post ? await updatePost(post.id, payload) : await createPost(payload);
    setSaving(false);

    if (!res.success) {
      setError(res.error);
      showToast(res.error, "error");
      return;
    }
    showToast(
      publishMode === "draft" ? "Draft tersimpan." : publishMode === "schedule" ? "Artikel dijadwalkan." : "Artikel diterbitkan.",
      "success",
    );
    setSlug(res.slug);
    setSlugTouched(true);
    if (!post) router.push(`/admin/blog/edit/${res.id}`);
    else router.refresh();
  };

  return (
    <form onSubmit={submit} className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-6 items-start">
      {/* Kolom utama */}
      <div className="space-y-6 min-w-0">
        <div className={card}>
          <div>
            <label className={label} htmlFor="title">
              Judul SEO (&lt;title&gt;) <span className="text-red-600">*</span>
            </label>
            <input
              id="title"
              className={input}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Cara Belajar Coding untuk Anak SD: Panduan Orang Tua"
              required
            />
            <div className="flex justify-between">
              <p className={hint}>Tampil di tab browser & hasil Google. Letakkan keyword utama di depan.</p>
              <Counter value={title} min={30} max={60} />
            </div>
          </div>
          <div>
            <label className={label} htmlFor="headline">Headline (H1)</label>
            <input
              id="headline"
              className={input}
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="Kosongkan untuk memakai judul SEO"
            />
            <p className={hint}>Judul besar di halaman artikel. Boleh lebih natural/panjang dari judul SEO.</p>
          </div>
          <div>
            <label className={label} htmlFor="slug">Slug URL</label>
            <div className="flex items-center rounded-xl border border-slate-300 overflow-hidden focus-within:ring-2 focus-within:ring-red-500/20">
              <span className="px-3 text-sm text-slate-400 bg-slate-50 border-r border-slate-300 py-2.5 whitespace-nowrap">/blog/</span>
              <input
                id="slug"
                className="flex-1 px-3 py-2.5 text-sm focus:outline-none"
                value={slugTouched ? slug : effectiveSlug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setSlug(e.target.value);
                }}
                onBlur={() => setSlug(slugify(slug))}
              />
            </div>
            {post && slugify(slug) !== post.slug && (
              <p className="text-xs text-amber-600 mt-1">
                Mengubah slug membuat URL lama 404. Hindari untuk artikel yang sudah terindeks.
              </p>
            )}
          </div>
        </div>

        <div>
          <p className={label}>Konten Artikel <span className="text-red-600">*</span></p>
          <RichTextEditor content={content} onChange={setContent} onMarkdownTitle={applyMarkdownTitle} />
          <p className={hint}>
            Bisa langsung paste Markdown (<code># Judul</code>, <code>## Subjudul</code>, list, <strong>**tebal**</strong>,
            tabel, blok kode <code>```</code>). Gunakan H2 untuk bagian utama dan H3 untuk sub-bagian (otomatis jadi
            Daftar Isi). Tautkan ke artikel lain atau <code>/daftar</code> untuk internal linking.
          </p>
        </div>

        <div className={card}>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-slate-900">FAQ Artikel</p>
              <p className={hint}>Tampil di akhir artikel dan sebagai schema FAQPage.</p>
            </div>
            <button
              type="button"
              onClick={() => setFaq([...faq, { q: "", a: "" }])}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 text-sm font-semibold hover:bg-slate-50 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Tambah
            </button>
          </div>
          {faq.map((item, i) => (
            <div key={i} className="rounded-xl border border-slate-200 p-3 space-y-2 relative">
              <button
                type="button"
                onClick={() => setFaq(faq.filter((_, j) => j !== i))}
                className="absolute top-2 right-2 p-1 text-slate-400 hover:text-red-600 cursor-pointer"
                aria-label="Hapus pertanyaan"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <input
                className={input}
                placeholder="Pertanyaan"
                value={item.q}
                onChange={(e) => setFaq(faq.map((f, j) => (j === i ? { ...f, q: e.target.value } : f)))}
              />
              <textarea
                className={input}
                rows={3}
                placeholder="Jawaban"
                value={item.a}
                onChange={(e) => setFaq(faq.map((f, j) => (j === i ? { ...f, a: e.target.value } : f)))}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Sidebar */}
      <div className="space-y-6 xl:sticky xl:top-6">
        <div className={card}>
          <p className="font-bold text-slate-900">Publikasi</p>
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                ["now", "Terbit"],
                ["schedule", "Jadwal"],
                ["draft", "Draft"],
              ] as const
            ).map(([value, text]) => (
              <label
                key={value}
                className={`text-center text-sm font-semibold py-2 rounded-xl border cursor-pointer transition ${
                  publishMode === value ? "border-red-500 bg-red-50 text-red-700" : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <input
                  type="radio"
                  name="publishMode"
                  value={value}
                  checked={publishMode === value}
                  onChange={() => setPublishMode(value)}
                  className="sr-only"
                />
                {text}
              </label>
            ))}
          </div>
          {publishMode === "schedule" && (
            <input
              type="datetime-local"
              className={input}
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              required
            />
          )}
          <label className="flex items-start gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={noindex} onChange={(e) => setNoindex(e.target.checked)} className="mt-0.5" />
            <span>
              <strong>Noindex</strong>: jangan tampilkan di Google (dan keluarkan dari sitemap)
            </span>
          </label>

          {error && <p className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</p>}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 inline-flex justify-center items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm disabled:opacity-60 cursor-pointer"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {publishMode === "draft" ? "Simpan Draft" : publishMode === "schedule" ? "Jadwalkan" : post?.is_published ? "Perbarui" : "Terbitkan"}
            </button>
            {post && (
              <Link
                href={`/admin/blog/preview/${post.id}`}
                target="_blank"
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Preview
              </Link>
            )}
          </div>
        </div>

        <div className={card}>
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-sm font-semibold text-slate-800" htmlFor="meta">Meta Description</label>
              <Counter value={metaDescription} min={120} max={160} />
            </div>
            <textarea
              id="meta"
              rows={4}
              className={input}
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
              placeholder="Ringkasan untuk hasil pencarian Google"
            />
            <button
              type="button"
              onClick={() => setMetaDescription(cleanExcerpt(content, 155))}
              className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:underline cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" /> Buat otomatis dari isi artikel
            </button>
          </div>
          <div>
            <label className={label} htmlFor="excerpt">Excerpt (ringkasan di bawah H1)</label>
            <textarea
              id="excerpt"
              rows={3}
              className={input}
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="Kosongkan untuk memakai meta description"
            />
          </div>

          <div className="rounded-xl border border-slate-200 p-3 bg-slate-50">
            <p className="text-[11px] font-semibold text-slate-500 mb-2 uppercase tracking-wide">Pratinjau Google</p>
            <p className="text-xs text-slate-600 truncate">{serpUrl}</p>
            <p className="text-[#1a0dab] text-lg leading-snug truncate">{title ? `${title} | Supercoder` : "Judul SEO | Supercoder"}</p>
            <p className="text-sm text-slate-600 line-clamp-2">{serpDescription || "Meta description akan tampil di sini."}</p>
          </div>
        </div>

        <div className={card}>
          <div>
            <label className={label} htmlFor="category">Kategori</label>
            <select id="category" className={input} value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">— Tanpa kategori —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <Link href="/admin/blog/categories" className="text-xs text-red-600 hover:underline mt-1 inline-block">
              Kelola kategori
            </Link>
          </div>
          <div>
            <label className={label} htmlFor="author">Nama penulis</label>
            <input id="author" className={input} value={authorName} onChange={(e) => setAuthorName(e.target.value)} />
            <p className={hint}>Tampil di artikel & schema (author). Kosongkan untuk atas nama Supercoder.</p>
          </div>
        </div>

        <div className={card}>
          <p className="font-bold text-slate-900">Gambar Unggulan / OG</p>
          {imageUrl ? (
            <div className="relative rounded-xl overflow-hidden border border-slate-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageUrl} alt="" className="w-full aspect-[1200/630] object-cover" />
              <button
                type="button"
                onClick={() => setImageUrl("")}
                className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/90 text-red-600 cursor-pointer"
                aria-label="Hapus gambar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <p className="text-xs text-slate-500">
              Tanpa gambar, OG image dibuat otomatis dari judul. Rekomendasi 1200×630 px.
            </p>
          )}
          <button
            type="button"
            onClick={() => setShowMedia(true)}
            className="w-full inline-flex justify-center items-center gap-2 px-4 py-2 rounded-xl border border-slate-300 text-sm font-semibold hover:bg-slate-50 cursor-pointer"
          >
            <ImageIcon className="w-4 h-4" /> {imageUrl ? "Ganti gambar" : "Pilih gambar"}
          </button>
          {imageUrl && (
            <div>
              <label className={label} htmlFor="alt">
                Alt text <span className="text-red-600">*</span>
              </label>
              <input
                id="alt"
                className={input}
                value={imageAlt}
                onChange={(e) => setImageAlt(e.target.value)}
                placeholder="Deskripsikan isi gambar"
                required
              />
            </div>
          )}
        </div>
      </div>

      <MediaLibraryModal
        isOpen={showMedia}
        onClose={() => setShowMedia(false)}
        title="Pilih gambar unggulan"
        onSelect={(m) => {
          setImageUrl(m.url);
          setShowMedia(false);
        }}
      />
    </form>
  );
}
