# Sistem Blog: Pengamatan Falya & Adaptasi ke Supercoder

Dokumen ini mencatat hasil studi sistem blog Falya (`FALYA/Websites/Website 2026/falya2026`) yang dirancang untuk SEO, lalu memetakan cara sistem itu diterapkan (dan diperbaiki) di Supercoder.

---

## 1. Ringkasan arsitektur Falya

| Aspek | Falya |
|---|---|
| Framework | Next.js **16.3.1**, App Router, React 19 |
| Penyimpanan artikel | **PostgreSQL (Neon)** via **Prisma 7** (`@prisma/adapter-pg` + `pg` Pool). Bukan MDX/file |
| Format konten | **HTML mentah** dari editor **TipTap 3** |
| Gambar | **Cloudinary** (upload bertanda tangan di server, folder `falya-blog`) + `next-cloudinary` |
| Proteksi admin | Cookie JWT HS256 `admin_session`, dicek di `proxy.ts` (nama baru middleware di Next 16) untuk `/admin/:path*` |
| Styling | Tailwind 4, tanpa `@tailwindcss/typography`; kelas `prose` ditulis manual di `app/globals.css` |
| Caching | `export const revalidate = 60` pada `/blog` dan `/blog/[slug]` + `revalidatePath` setelah tulis |

Blog sepenuhnya **database-driven**: penulis membuat artikel di panel admin, bukan menulis file. Ini membuat pipeline AI (agen penulis) dan jadwal terbit menjadi mudah.

---

## 2. Routing

| Rute | File | Catatan |
|---|---|---|
| `/blog` | `app/blog/page.tsx` | Indeks. Filter kategori lewat query string `?category=X`. `revalidate = 60` |
| `/blog/[slug]` | `app/blog/[slug]/page.tsx` | Detail artikel. `generateMetadata`, JSON-LD BlogPosting, `revalidate = 60`. **Tanpa** `generateStaticParams` |
| `/sitemap.xml` | `app/sitemap.ts` | Halaman statis + post published dari DB, dibungkus try/catch (fallback ke halaman statis) |
| `/robots.txt` | `app/robots.ts` | `allow: "/"`, `disallow: ["/admin"]` |
| `/admin/blog` | `app/admin/blog/page.tsx` | Daftar post + badge status + tombol "Minta Artikel Baru (AI)" |
| `/admin/blog/new`, `/admin/blog/edit/[id]` | `app/admin/blog/...` | Form penulisan |
| `/admin/seo`, `/admin/agents` | | Laporan SEO audit & dashboard agen AI |
| API agen | `app/api/admin/content/next-job`, `.../content/draft`, `app/api/admin/seo/audit-report`, `app/api/admin/agents/*` | Auth via header `x-agent-secret` (`AGENT_API_SECRET`) |

Tidak ada: rute tag, author, pagination, search, RSS, `llms.txt`, `opengraph-image.tsx`, `not-found.tsx`/`loading.tsx` khusus blog.

`next.config.ts` Falya berisi redirect non-www → www (301) dan `/*.html` → URL bersih.

---

## 3. Model data `Post` (Prisma)

```prisma
model Post {
  id              String   @id @default(cuid())
  title           String            // <title> (+ " | Blog Falya"), basis slug. BUKAN H1
  slug            String   @unique
  content         String   @db.Text // HTML dari TipTap
  headline        String?  @db.Text // H1; fallback ke title
  metaDescription String?  @db.Text // meta/OG/Twitter description
  excerpt         String?  @db.Text // tampil di bawah H1; fallback ke metaDescription
  category        String?
  imageUrl        String?           // URL Cloudinary; juga dipakai sebagai OG image
  isPublished     Boolean  @default(true)
  publishedAt     DateTime @default(now())   // tanggal masa depan = terjadwal
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

Keputusan desain yang penting untuk SEO:
- **Judul SEO (`title`) dipisah dari H1 (`headline`).** `<title>` bisa dioptimasi untuk keyword/CTR di SERP, sementara H1 bisa lebih natural untuk pembaca.
- **`excerpt` dipisah dari `metaDescription`.** Meta description ditulis untuk SERP (120–160 karakter), excerpt untuk pembaca.
- **`publishedAt` di masa depan = artikel terjadwal.** Tidak perlu cron; query publik cukup memfilter `publishedAt <= now`.

Model pendukung: `Media` (library aset Cloudinary), `ContentJobRequest` (antrean artikel AI), `SeoAuditReport`, `SeoProposedFix`, `AgentRunLog`, `AgentTaskRequest`, `AgentRoadmapNote`.

Field yang **tidak** ada: tags, keywords, author, canonical override, FAQ, flag noindex, reading time, alt gambar unggulan, OG title override.

---

## 4. Data layer (`app/actions/blog.ts`, `"use server"`)

- `getAllPosts(includeScheduled = false, category?)`: `isPublished: true, publishedAt: { lte: now + 60s }`, urut `publishedAt desc`.
- `getPostBySlug(slug, allowScheduled)`: filter sama, kecuali admin sedang login (untuk preview).
- `getPostById`, `getAllCategories()`: kategori distinct. **Tidak** memfilter draft, jadi kategori yang hanya dipakai draft ikut tampil sebagai filter publik.
- `createPost` / `updatePost` / `deletePost` (wajib sesi admin):
  - Slugify: `.toLowerCase().trim().replace(/[^\w\s-]/g,"").replace(/[\s_-]+/g,"-").replace(/^-+|-+$/g,"")`.
  - Meta description kosong → `cleanExcerpt(content)` (strip HTML, 155 karakter pertama, `lib/utils.ts`).
  - `headline` kosong → `title`; `excerpt` kosong → meta description.
  - `revalidatePath("/blog")`, `/blog/${slug}`, `/admin/blog`, `/sitemap.xml`.

---

## 5. SEO on-page

### 5.1 `generateMetadata` di `/blog/[slug]`

```ts
const session = await getAdminSession();            // membaca cookies()
const post = await getPostBySlug(slug, !!session);
const canonicalUrl = `${siteUrl}/blog/${slug}`;
if (!post) return { title: "Artikel Tidak Ditemukan | Blog Falya", robots: { index: false, follow: false } };
const description = post.metaDescription?.trim() || cleanExcerpt(post.content);
const ogImage = post.imageUrl?.trim() || DEFAULT_OG_IMAGE;
return {
  title: `${post.title} | Blog Falya`,
  description,
  robots: !post.isPublished ? { index: false, follow: false } : undefined,
  alternates: { canonical: canonicalUrl },
  openGraph: {
    title: post.title, description, url: canonicalUrl, siteName: "Falya Risol", locale: "id_ID",
    type: "article",
    publishedTime: (post.publishedAt || post.createdAt).toISOString(),
    modifiedTime: (post.updatedAt || post.createdAt).toISOString(),
    images: [{ url: ogImage, width: 1200, height: 630, alt: post.title }],
  },
  twitter: { card: "summary_large_image", title: post.title, description, images: [ogImage] },
};
```

Poin kuat: canonical absolut per artikel, OG `type: article` dengan tanggal terbit/ubah, fallback OG image, draft diberi `noindex`, metadata khusus untuk 404.

### 5.2 JSON-LD `BlogPosting`

```ts
{
  "@context": "https://schema.org", "@type": "BlogPosting",
  headline, description, image: [ogImage], datePublished, dateModified,
  author:    { "@type": "Organization", name: "Falya Risol", url: "https://www.falyarisol.com" },
  publisher: { "@type": "Organization", name: "Falya Risol",
               logo: { "@type": "ImageObject", url: ".../images/logo-risol-mayo.webp" } },
  mainEntityOfPage: { "@type": "WebPage", "@id": "https://www.falyarisol.com/blog/<slug>" }
}
```

Schema situs (`FoodEstablishment` + `aggregateRating` + `review`) ada di `app/layout.tsx`. Builder FAQPage/Product yang dapat dipakai ulang ada di `lib/seo/*JsonLd.ts` (mis. `buildSnackboxFaqJsonLd()`), tetapi **tidak** dipakai untuk artikel blog.

### 5.3 Indeks `/blog`
Metadata statis: canonical `/blog`, OG + Twitter. Tanpa JSON-LD (Blog/CollectionPage/ItemList). Semua variasi `?category=` ber-canonical `/blog`, jadi halaman kategori tidak bisa di-rank.

### 5.4 Sitemap & robots
- Statis: `/` (1.0), `/menu`, `/snackbox`, `/nasi-liwet` (0.9), `/faq` (0.7), `/blog` (0.8, daily).
- Dinamis: `prisma.post.findMany({ where: { isPublished: true, publishedAt: { lte: now + 60s } }, select: { slug, updatedAt } })` → `/blog/<slug>`, `lastModified: updatedAt`, weekly, 0.8.
- Robots: disallow `/admin`, menaut ke sitemap.

---

## 6. Pipeline konten & UI

### 6.1 Editor (`components/blog/RichTextEditor.tsx`)
- TipTap 3: `starter-kit` (heading dibatasi **H2 & H3** "untuk hierarki SEO", karena H1 = `headline`), `extension-link`, `extension-image`, ekstensi tabel.
- Link dipaksa `target="_blank" rel="noopener noreferrer"` untuk **semua** link, termasuk link internal.
- Gambar dirender sebagai `<img>` biasa.
- Tidak ada MDX/remark/rehype. Konten dirender dengan `dangerouslySetInnerHTML` **tanpa sanitasi**.

### 6.2 Halaman artikel
Satu file (`app/blog/[slug]/page.tsx`): banner preview draft/terjadwal untuk admin, chip kategori (→ `/blog?category=`), tanggal terbit (tanggal "diperbarui" tidak ditampilkan), H1, excerpt, gambar unggulan (`priority`), isi HTML, footer dengan teks "Bagikan artikel ini" (tombol share belum berfungsi).

`components/blog/BlogImage.tsx`: `CldImage` untuk public ID Cloudinary, selain itu `next/image` (`unoptimized` untuk URL `http…`).

Tidak ada: TOC, anchor heading, breadcrumb, related posts, author box, CTA dalam artikel, reading time, syntax highlighting.

### 6.3 Form authoring admin
- Judul SEO + H1 terpisah, slug otomatis, kategori.
- Gambar unggulan/OG (1200×630) dari `MediaLibraryModal` (library Cloudinary) + `CldUploadButton`.
- Editor TipTap.
- Mode publikasi: **sekarang / jadwal / draft**.
- Meta description dengan **penghitung karakter (target 120–160)** + tombol auto-generate dari isi.
- Excerpt.
- **Preview SERP Google** dan **preview kartu OG** secara langsung.

### 6.4 Pipeline AI ("Karyawan AI", repo `plumberscode/falya-crew`)
1. Admin klik "Minta Artikel Baru (AI)" → `requestContentJob(instruction?)` membuat `ContentJobRequest` (dedup bila masih ada job pending) → `triggerAgentWorkflow("content_writer_dispatch")`.
2. `lib/github-dispatch.ts` mengirim `repository_dispatch` ke GitHub (`GITHUB_DISPATCH_TOKEN`).
3. Agen memanggil `GET /api/admin/content/next-job` → `{ job_id, instruction }`.
4. Agen mengirim `POST /api/admin/content/draft` `{ title, headline, content, meta_description?, excerpt?, category?, job_id? }`.
5. Route membuat Post `isPublished: false`, retry slug `-2`…`-5`, menandai job selesai. Admin meninjau lalu menerbitkan.
6. **SEO Auditor** mingguan: crawl link rusak, isu meta, diff sitemap, PageSpeed, data Search Console → `SeoAuditReport`; mengusulkan `SeoProposedFix` untuk meta description kosong, disetujui admin di `/admin/seo`.
7. Biaya/token dicatat di `AgentRunLog`, tampil di `/admin/agents`.

### 6.5 Analytics
Hanya Ahrefs Web Analytics (`<Script strategy="lazyOnload">`). Tidak ada event khusus blog.

---

## 7. Kekurangan & risiko yang ditemukan di Falya

1. Tidak ada TOC, anchor heading, breadcrumb (UI & schema), related posts, tag, author/Person, FAQ per artikel, reading time, RSS, route OG image, `generateStaticParams`.
2. **ISR kemungkinan tidak berjalan**: halaman post dan `generateMetadata` membaca `cookies()` (via `getAdminSession()`), sehingga rute menjadi dinamis di setiap request.
3. HTML artikel dirender **tanpa sanitasi**.
4. Semua link dalam konten membuka tab baru, termasuk link internal (buruk untuk UX dan alur internal linking).
5. Gambar di dalam konten memakai `<img>` tanpa alt wajib.
6. Kategori berupa query string yang canonical-nya `/blog`, jadi tidak ada halaman kategori yang bisa diindeks.
7. `getAllCategories` menampilkan kategori yang hanya dipakai draft.
8. Empty state publik `/blog` menaut ke `/admin/blog/new`.
9. Navbar tidak punya link Blog (hanya footer).
10. Tombol share masih placeholder.
11. `/kue-nampan-balikpapan` tidak ada di sitemap.
12. Fallback JWT secret di-hardcode bila `JWT_SECRET_KEY` tidak diset.

---

## 8. Pemetaan Falya → Supercoder

| Aspek | Falya | Supercoder |
|---|---|---|
| Database | Prisma + Neon | **Supabase** (SQL migration manual + RLS) |
| Auth admin | JWT cookie sendiri | **Supabase Auth + `profiles.role = 'admin'`** (teacher tidak boleh) |
| Kategori | String di Post | Tabel **`blog_categories`** + halaman `/blog/kategori/[slug]` |
| Styling | Tailwind 4 + prose manual | Tailwind 3 + **`@tailwindcss/typography`** |
| Gambar | Cloudinary | **Cloudinary** (folder `supercoder-blog`) |
| Editor | TipTap (H2/H3, link, image, table) | TipTap + **code block dengan syntax highlighting** (blog coding) |
| Pipeline AI | falya-crew | **Ditunda** ke fase berikutnya |

### Perbaikan yang diterapkan di Supercoder
- Halaman publik membaca data lewat **client Supabase tanpa cookie** + `generateStaticParams` + `revalidate`, sehingga benar-benar statis/ISR. Preview draft dipindah ke rute admin terpisah.
- HTML **disanitasi** saat simpan dan saat render.
- **Anchor heading + TOC** otomatis dari H2/H3; **reading time**.
- Link internal tanpa `_blank`; link eksternal `_blank` + `noopener`.
- Alt gambar unggulan wajib; gambar dalam konten diberi fallback alt.
- JSON-LD: **BlogPosting** (author Person bila ada, publisher = Organization `@id` situs), **BreadcrumbList**, **FAQPage** per artikel, **Blog + ItemList** di indeks.
- **Halaman kategori** dengan canonical sendiri; hanya kategori yang punya artikel terbit yang ditampilkan.
- **RSS** di `/blog/rss.xml`, **OG image dinamis** sebagai fallback.
- Flag **noindex** per artikel.
- Tombol **share** yang berfungsi, **related posts**, **CTA** ke `/daftar` di setiap artikel.
- Link **Blog** di navbar & footer; anchor `#section` diubah menjadi `/#section` agar berfungsi dari halaman blog.
- Sitemap memuat blog, kategori, dan artikel; entri `#hash` dihapus.

---

## 9. Status implementasi di Supercoder

### Setup (sekali saja)
1. Jalankan `migration_blog.sql` di Supabase SQL Editor (tabel `blog_categories`, `blog_posts`, `blog_media`, fungsi `is_admin()`, RLS).
2. Isi env `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` (lokal & Vercel).
3. Login sebagai **admin**, lalu buka **/admin/blog** (menu "Blog" di sidebar hanya muncul untuk admin).

### Peta file
| Bagian | File |
|---|---|
| Konstanta situs | `src/lib/site.ts` |
| Data publik (tanpa cookie) | `src/lib/blog/queries.ts` |
| Sanitasi, TOC, anchor, link, highlight | `src/lib/blog/html.ts` |
| Slug, excerpt, reading time | `src/lib/blog/text.ts` |
| JSON-LD & metadata | `src/lib/blog/jsonld.ts`, `src/lib/blog/seo.ts` |
| Guard admin | `src/lib/blog/auth.ts` |
| Rute publik | `src/app/blog/` (indeks, `[slug]`, `kategori/[slug]`, `rss.xml`, `opengraph-image`) |
| Komponen publik | `src/components/blog/` |
| Admin | `src/app/admin/blog/` + `src/components/blog/admin/` (PostForm, RichTextEditor, MediaLibraryModal) |
| Test | `src/lib/__tests__/blog.test.ts` |

### Catatan
- `/blog/[slug]` di-prerender (SSG, `revalidate = 60`). Setiap simpan/hapus memanggil `revalidatePath("/blog", "layout")` sehingga perubahan langsung tampil.
- Upload gambar maksimal 4MB (batas body request Vercel), lewat server action ke folder Cloudinary `supercoder-blog`.
- OG image: artikel dengan gambar unggulan memakai gambar itu (dikonversi JPG 1200×630 oleh Cloudinary). Tanpa gambar, dibuat kartu brand otomatis.
- Slug `kategori` dicadangkan (bentrok dengan `/blog/kategori/...`).
- Belum dikerjakan (fase berikutnya): pipeline AI (kompatibel falya-crew), SEO auditor, tag, pagination, analytics.
