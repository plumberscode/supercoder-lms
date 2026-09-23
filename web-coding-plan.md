# Rencana Implementasi: "Soal Coding Web" (HTML/CSS/JS fleksibel, dinilai AI)

## Context

LMS ini sudah punya 5 kategori materi: Materi, Pengumpulan Tugas, Kuis, Soal Coding (Python/JavaScript/HTML+JS), dan Soal CSS. Kategori "Soal Coding" (mode `html-js`) dan "Soal CSS" sudah masing-masing menangani sebagian dari kebutuhan ini (editor kode + preview + penilaian AI via DeepSeek), tapi keduanya kaku: yang satu tidak punya kolom CSS, yang satu lagi tidak punya kolom JavaScript, dan tidak ada yang punya toggle "kolom mana saja yang wajib diisi siswa".

Guru ingin kategori ke-6 yang fleksibel: satu soal bisa berupa HTML saja, HTML+CSS, atau HTML+CSS+JS — guru memilih mode ini saat membuat soal. Guru juga bisa memberi jawaban referensi per kolom, yang dipakai AI (DeepSeek, provider yang sudah dipakai di seluruh fitur AI-grading LMS ini) sebagai acuan penilaian. Tidak ada penilaian test-case deterministik di fitur ini — 100% dinilai AI, mengikuti pola yang sudah ada di "Soal CSS" dan mode HTML+JS dari "Soal Coding".

Keputusan yang sudah dikonfirmasi ke product owner:
- **Preview**: live, auto-update dengan debounce (gaya CodePen), bukan tombol "Jalankan" manual.
- **Batas percobaan**: maksimal 3 submit yang dinilai AI per siswa per soal (skor terbaik yang disimpan) — konsisten dengan Soal CSS & Soal Coding HTML+JS.
- **Nama kategori**: "Soal Coding Web".

Pola implementasi di LMS ini **tidak** pakai ORM/migration framework — skema di `supabase_schema.sql` + file `.sql` lepas di root yang dijalankan manual di Supabase SQL Editor. Juga **tidak ada satu enum/switch pusat** untuk kategori — setiap kategori "dikabelkan" berulang di ~5 file (form pembuatan, tombol admin, render siswa, gradebook). Fitur baru ini harus mengikuti pola yang sama persis agar konsisten dengan 5 kategori lain.

Catatan AGENTS.md: proyek ini pakai versi Next.js yang sudah dimodifikasi dengan breaking changes — sebelum menulis kode, cek `node_modules/next/dist/docs/` untuk konvensi yang relevan (mis. `params` di Server Component di-`await` — lihat pola di `src/app/admin/css-challenges/[lessonId]/page.tsx` dan `src/app/lessons/[id]/page.tsx`, keduanya sudah pakai `const { lessonId } = await params;`).

**Peringatan penting soal constraint DB**: menelusuri histori commit seluruh file migrasi (`migration_lesson_scores.sql` → `migration_coding_challenges.sql` → `migration_css_challenges.sql`), versi terakhir `lessons_type_check` yang tercatat di repo **tidak pernah** menyertakan kembali `'quiz'` maupun `'project'` setelah di-drop migrasi berikutnya — padahal `LessonForm.tsx`/`ModuleList.tsx` aktif membuat lesson bertipe `quiz` dan `project` sampai sekarang. Ini hanya bisa berjalan di production kalau constraint di Supabase live sudah ditambal manual di luar git. **Sebelum menjalankan migrasi baru, cek dulu constraint aktual di Supabase Dashboard**:
```sql
SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint WHERE conname IN ('lessons_type_check','submissions_type_check');
```
lalu sesuaikan migrasi baru agar mencantumkan SEMUA value yang benar-benar valid saat ini (bukan cuma yang ada di file `.sql` lama), termasuk `'quiz'` dan `'project'` yang tampaknya hilang dari repo tapi hidup di production.

## Skema Database (file baru: `migration_web_challenges.sql`)

```sql
-- Migration: "Soal Coding Web" (HTML+CSS+JS) Feature
-- Jalankan di Supabase SQL Editor.
-- PENTING: verifikasi dulu constraint lessons_type_check / submissions_type_check
-- yang aktif di Supabase Dashboard sebelum menjalankan ini — daftar value di bawah
-- direkonstruksi dari histori file migration_*.sql di repo dan bisa saja berbeda
-- dari DB live yang sudah ditambal manual. Selaraskan dulu kalau berbeda.

-- 1. Constraint lengkap untuk lessons.type (5 kategori lama + 1 kategori baru)
ALTER TABLE lessons DROP CONSTRAINT IF EXISTS lessons_type_check;
ALTER TABLE lessons ADD CONSTRAINT lessons_type_check
  CHECK (type IN ('text', 'video', 'pdf', 'link', 'project', 'quiz', 'code', 'css-challenge', 'web-challenge'));

-- 2. Tabel web_challenges — 1:1 dengan lessons, mirror css_challenges + mode + kolom JS
CREATE TABLE IF NOT EXISTS web_challenges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  mode TEXT NOT NULL DEFAULT 'html-css-js'
    CHECK (mode IN ('html', 'html-css', 'html-css-js')),
  starter_html TEXT DEFAULT '',
  starter_css TEXT DEFAULT '',
  starter_js TEXT DEFAULT '',
  reference_html TEXT DEFAULT '',
  reference_css TEXT DEFAULT '',
  reference_js TEXT DEFAULT '',
  max_score INTEGER DEFAULT 100,
  max_attempts INTEGER DEFAULT 3,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. RLS policies (identik dengan css_challenges)
ALTER TABLE web_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view web challenges" ON web_challenges FOR SELECT USING (true);
CREATE POLICY "Teachers can manage web challenges" ON web_challenges FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','teacher'))
);

-- 4. Constraint lengkap untuk submissions.type
ALTER TABLE submissions DROP CONSTRAINT IF EXISTS submissions_type_check;
ALTER TABLE submissions ADD CONSTRAINT submissions_type_check
  CHECK (type IN ('quiz', 'project', 'lesson', 'code', 'css', 'web'));
```

Penamaan mengikuti pola pasangan yang sudah ada (`code` ↔ `coding_challenges`; `css-challenge` ↔ `css_challenges`/type `css`): `lessons.type = 'web-challenge'`, tabel satelit `web_challenges`, `submissions.type = 'web'`.

## Bentuk `submissions.data` (type = `'web'`)

```jsonc
{
  "html": "<div>...</div>",
  "css": "",               // "" saat mode tidak melibatkan CSS
  "js": "",                 // "" saat mode tidak melibatkan JS
  "attempts": [
    { "score": 82, "feedback": "...", "at": "2026-09-20T10:00:00.000Z" }
  ]
}
```
Ketiga key selalu disimpan (string kosong, bukan dihilangkan) supaya bentuknya stabil terlepas dari `mode`, konsisten dengan pola `existingSubmission?.data?.css || challenge.starter_css || ""` di `CssChallenge.tsx:30-33`.

## Backend penilaian AI (file baru: `src/app/lessons/web-challenge-actions.ts`)

Mirror hampir persis `src/app/lessons/css-actions.ts` (`submitCssSolution`/`getCssHint`), digabung pola `html-js-actions.ts`. **Catatan penting**: kolom FK di tabel `submissions` bernama `student_id`, bukan `user_id` — semua query filter pakai `.eq("student_id", user.id)`.

```ts
export async function submitWebChallengeSolution(params: {
  challengeId: string;
  lessonId: string;
  mode: "html" | "html-css" | "html-css-js";
  html: string;
  css: string;
  js: string;
  referenceHtml: string;
  referenceCss: string;
  referenceJs: string;
  description: string;
  maxScore: number;
}) { ... }

export async function getWebChallengeHint(params: {
  description: string;
  mode: "html" | "html-css" | "html-css-js";
  studentHtml: string;
  studentCss: string;
  studentJs: string;
  attemptNumber: number;
}): Promise<string> { ... }
```

Alur `submitWebChallengeSolution` (persis `submitCssSolution`):
1. `createClient()` → `supabase.auth.getUser()` → `{error:"Not authenticated"}` jika kosong.
2. Fetch submission existing: `.from("submissions").select("id, score, data").eq("student_id", user.id).eq("content_id", params.lessonId).eq("type", "web").maybeSingle()`.
3. `existingAttempts.length >= 3` → `{ error: "Batas submit sudah tercapai (3/3)" }`.
4. Bentuk client `new OpenAI({ baseURL: "https://api.deepseek.com", apiKey: process.env.DEEPSEEK_API_KEY })` — dibuat lokal di file ini (dikonfirmasi: client ini **diduplikasi per file**, bukan di-share dari satu factory — `css-actions.ts`, `html-js-actions.ts`, `ai-hints.ts` semuanya bikin instance sendiri-sendiri).
5. Prompt (Bahasa Indonesia), **hanya menyertakan bagian yang relevan dengan `mode`**:

```
Kamu adalah penilai proyek Web (HTML[+ CSS][+ JavaScript]) untuk siswa pemula.

## Soal / Deskripsi
${description}

## Mode Soal
${mode === 'html' ? 'HTML saja' : mode === 'html-css' ? 'HTML + CSS' : 'HTML + CSS + JavaScript'}

## Jawaban HTML Siswa
```html
${html}
```

[## Jawaban CSS Siswa   -- hanya jika mode includes css
```css
${css}
```]

[## Jawaban JavaScript Siswa   -- hanya jika mode includes js
```javascript
${js}
```]

## Referensi Jawaban HTML (dari guru)
```html
${referenceHtml}
```

[## Referensi Jawaban CSS (dari guru)   -- hanya jika mode includes css
```css
${referenceCss}
```]

[## Referensi Jawaban JavaScript (dari guru)   -- hanya jika mode includes js
```javascript
${referenceJs}
```]

## Instruksi Penilaian
1. HANYA nilai bagian yang sesuai mode soal (${mode}). Jangan kurangi nilai karena CSS/JS tidak ada jika mode tidak memintanya.
2. Bandingkan jawaban siswa dengan referensi guru dari sisi hasil visual dan/atau fungsional, bukan kesamaan kode literal.
3. Untuk HTML: struktur elemen dan semantik yang relevan dengan soal.
[4. Untuk CSS: fokus pada apakah CSS MENGHASILKAN VISUAL YANG SAMA, bukan kode identik. -- hanya jika mode includes css]
[5. Untuk JavaScript: periksa apakah logika benar dan interaksi berjalan sesuai soal. -- hanya jika mode includes js]
6. Berikan skor 0-100:
   - 90-100: Sempurna atau hampir sempurna
   - 70-89: Sebagian besar benar, ada minor issue
   - 50-69: Konsep dasar benar tapi ada error signifikan
   - 0-49: Jawaban salah atau sangat tidak lengkap

Balas HANYA dengan JSON valid:
{"score": <number>, "feedback": "<feedback mendidik dalam Bahasa Indonesia>"}
```

6. `model: "deepseek-chat"`, `response_format: { type: "json_object" }`, parse dengan fallback markdown-fence sama seperti `css-actions.ts:90-104`.
7. Upsert `submissions`: `data: { html, css, js, attempts: newAttempts }`, `type: "web"`, `bestScore = Math.max(score, existing?.score || 0)`.
8. Award XP: `score >= 70 && (!existing || (existing.score||0) < 70)` → RPC `increment_xp(user_id, amount: maxScore)` (signature dikonfirmasi di `supabase_schema.sql:138`).
9. `revalidatePath` 4 path yang sama seperti `css-actions.ts` (`/lessons/${lessonId}`, `/leaderboard`, `/dashboard`, `/admin/gradebook`).

`getWebChallengeHint` mirror `getCssHint`: 3 tingkat hint berdasar `attemptNumber`, instruksi "SINGKAT maks 2-3 kalimat, JANGAN berikan jawaban langsung", hanya sertakan kolom kode siswa sesuai `mode`.

## Live preview gabungan (file baru: `src/lib/web-preview.ts`)

Karena preview di-regenerate penuh tiap debounce tick (sama seperti `buildCssPreview`), **tidak perlu** arsitektur postMessage ala `iframe-runner.ts` (itu dibuat untuk menyuntik JS ke iframe yang *sudah* berjalan, khusus tombol "Jalankan" manual). Cukup satu dokumen HTML utuh dengan `<style>` + `<script>` inline, dibungkus try/catch supaya error runtime tidak merusak preview (muncul sebagai overlay merah, bukan blank).

```ts
export function buildWebPreview(html: string, css: string, js: string): string {
  const safeCss = css.replace(/<\/style/gi, "<\\/style");
  const safeJs = js.replace(/<\/script/gi, "<\\/script");
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
body { font-family: Inter, sans-serif; margin: 16px; color: #1E293B; }
${safeCss}
</style>
</head>
<body>
${html}
<script>
window.addEventListener('error', function(e) {
  var el = document.createElement('div');
  el.style.cssText = 'position:fixed;bottom:0;left:0;right:0;background:#FEE2E2;color:#991B1B;padding:8px 12px;font:12px monospace;white-space:pre-wrap;z-index:99999;border-top:2px solid #EF4444;max-height:40%;overflow:auto;';
  el.textContent = '⚠ JS Error: ' + e.message;
  document.body.appendChild(el);
});
try {
${safeJs}
} catch (err) {
  window.dispatchEvent(new ErrorEvent('error', { message: err.message }));
}
<\/script>
</body>
</html>`;
}
```

Dipakai lewat `iframe.srcDoc`, `sandbox="allow-scripts"` saja (sama seperti `css-preview.ts`, tanpa `allow-modals`), debounce 300ms — identik pola `CssChallenge.tsx:56-67`. Catatan: karena tanpa `allow-modals`, `alert()`/`confirm()`/`prompt()` di kode siswa akan silently no-op di preview — batasan yang disengaja, konsisten dengan `css-preview.ts` yang sudah ada; sebaiknya soal tidak meminta siswa memakai `alert()`. Escaping `</script>`/`</style>` perlu ditambahkan di sini (gap yang sama juga ada di `css-preview.ts` lama, tapi itu di luar scope fitur ini). Tidak ada panel console output di v1 — hanya overlay error runtime; bisa ditambah belakangan kalau diperlukan.

## UI Siswa (file baru: `src/components/WebChallenge.tsx` + `WebChallenge.module.css`)

Mirror struktur `CssChallenge.tsx` (panel deskripsi kiri + panel editor/preview kanan) digabung elemen dari `HtmlJsChallenge.tsx`:
- Props: `challenge: { id, lesson_id, title, description, mode, starter_html, starter_css, starter_js, reference_html, reference_css, reference_js, max_score, max_attempts }`, `existingSubmission?: { score, data } | null`.
- State per kolom: `existingSubmission?.data?.html || challenge.starter_html || ""` (sama untuk css/js).
- Tab bar dinamis sesuai `challenge.mode`: `'html'` → tanpa tab (editor HTML tunggal) atau 1 tab; `'html-css'` → tab HTML/CSS; `'html-css-js'` → tab HTML/CSS/JS. Reuse class `styles.tabBar`/`.tab`/`.tabActive`.
- `useEffect` debounce 300ms → `iframeRef.current.srcdoc = buildWebPreview(htmlCode, cssEnabled ? cssCode : "", jsEnabled ? jsCode : "")`.
- `handleSubmit`: guard "kode belum diubah sejak submit terakhir" (bandingkan ketiga field ke snapshot terakhir, pola `HtmlJsChallenge.tsx:123-128`), panggil `submitWebChallengeSolution`, update `gradeResult`/`bestScore`/`attemptsUsed`.
- `handleGetHint`, `handleReset`, `remainingAttempts`/`isMaxedOut`, kelas skor, panel hint, panel sukses — copy verbatim dari `CssChallenge.tsx` (boilerplate identik di kedua komponen existing).
- `CodeEditor` (`src/components/CodeEditor.tsx`) dipakai apa adanya untuk ketiga bahasa (`language="html"|"css"|"javascript"`, semua sudah didukung).
- `WebChallenge.module.css`: copy `CssChallenge.module.css`, class-name sudah cukup generik untuk 3 tab.

## Editor guru (file baru, mirror `src/app/admin/css-challenges/[lessonId]/`)

**`src/app/admin/web-challenges/[lessonId]/page.tsx`** — server component:
```tsx
const { lessonId } = await params; // konvensi async params, sama seperti css-challenges/[lessonId]/page.tsx
const { data: lesson } = await supabase.from("lessons").select("*, module_id(subject_id, title)").eq("id", lessonId).single();
const { data: challenge } = await supabase.from("web_challenges").select("*").eq("lesson_id", lessonId).maybeSingle();
```
Render `<WebChallengeEditor lessonId={lessonId} existingChallenge={challenge} />` dalam shell yang sama seperti halaman css-challenges.

**`src/app/admin/web-challenges/[lessonId]/WebChallengeEditor.tsx`** — client form, copy `CssChallengeEditor.tsx` + tambahan:
- `<select name="mode" defaultValue={existingChallenge?.mode || "html-css-js"}>` opsi `html` / `html-css` / `html-css-js` (pola sama seperti `<select name="language">` di `ChallengeEditor.tsx:141-150`).
- `useState` untuk `mode` guna show/hide field CSS (starter+reference) saat `mode !== 'html'`, dan field JS (starter+reference) saat `mode === 'html-css-js'`.
- Field: `title`, `maxScore`, `description`, `starterHtml`, `referenceHtml` (selalu tampil), `starterCss`/`referenceCss` (kondisional), `starterJs`/`referenceJs` (kondisional) — pakai `monoInputStyle` dark textarea sama seperti `CssChallengeEditor.tsx:64-71,130-179`.
- Submit memanggil `saveWebChallenge(lessonId, formData)`, pola `showToast` + `window.location.reload()` sama seperti `CssChallengeEditor.tsx:19-32`.

**`src/app/admin/web-challenges/[lessonId]/actions.ts`** — `"use server"`, copy `saveCssChallenge`, rename `saveWebChallenge(lessonId, formData)`:
- Baca `title, description, mode, starterHtml, starterCss, starterJs, referenceHtml, referenceCss, referenceJs, maxScore` dari `formData`.
- Upsert-by-`lesson_id` ke `web_challenges` (select existing `.eq("lesson_id", lessonId).single()`, lalu `.update()` atau `.insert({..., created_by: user.id})`).
- `revalidatePath(`/admin/web-challenges/${lessonId}`)`.

## Wiring ke titik integrasi yang sudah ada

Setiap kategori lama disebut berulang di beberapa file — kategori baru harus ditambahkan di titik yang sama persis. Catatan: "redirect" ke editor bukan navigasi otomatis — ini tombol `<Link>` yang muncul di baris lesson setelah dibuat (pola `ModuleList.tsx:550-573`), bukan `redirect()` server-side.

**1. `src/app/admin/subjects/[id]/ModuleList.tsx`**
- ~Baris 562-573 (blok link `lesson.type === "css-challenge"`): tambah blok paralel untuk `"web-challenge"` → `<Link href={`/admin/web-challenges/${lesson.id}`}>🕸️ Kelola Soal Coding Web</Link>`.
- ~Baris 748-780 (tombol TAMBAH "🎨 Soal CSS"): tambah tombol ke-6 `🕸️ Soal Coding Web` yang men-set `activeAddForm = {moduleId, type: "web-challenge"}`, copy pola active/inactive style branching.

**2. `src/app/admin/subjects/[id]/LessonForm.tsx`**
- Header judul (~112-122): tambah case `type === "web-challenge" ? "Konfigurasi Soal Coding Web Baru"`.
- Grid kolom & pengecualian dropdown "Tipe Materi" (~137-142, 183-186): tambah `type !== "web-challenge"` ke kondisi yang sudah ada.
- Label & placeholder judul (~148-173): tambah case `"Soal Coding Web"` / `"Contoh: To-Do List Interaktif"`.
- Blok "SUMBER KONTEN" (tepat setelah panel css-challenge ~417-451): tambah panel info baru (icon 🕸️, teks: "Siswa akan menulis HTML/CSS/JS dengan live preview mirip CodePen. Setelah membuat lesson ini, atur mode soal (HTML saja / HTML+CSS / HTML+CSS+JS), boilerplate, dan referensi jawaban dari halaman detail materi.").
- Label tombol submit (~469-471): tambah case `"Soal Coding Web"`.
- **Tidak perlu** ubah `src/app/admin/subjects/[id]/actions.ts` (`createLesson`) — kategori baru tidak butuh insert tabel satelit saat create, sama seperti `code`/`css-challenge` (satelit diisi lewat editor page terpisah).

**3. `src/app/lessons/[id]/page.tsx`**
- Import `WebChallenge from "@/components/WebChallenge"`.
- Tambah fetch `webSubmission` (submissions `type='web'`, filter `.eq("student_id", user.id)`, mirror blok `cssSub` ~52-61).
- Tambah fetch `webChallenge` dari `web_challenges` saat `lesson.type === "web-challenge"` (mirror ~84-93).
- `isCodingLesson` (baris 97): tambah `|| lesson.type === "web-challenge"` supaya dapat layout IDE full-viewport (konsisten dengan sifat CodePen-like fitur ini).
- Di dalam blok IDE body (~171-182): tambah render kondisional `WebChallenge` + placeholder "Soal Coding Web untuk materi ini belum dibuat oleh guru." bila `webChallenge` null.
- **Tidak menyentuh** `lesson.is_project_required` di baris 401 — bug pre-existing, di luar scope.

**4. `src/app/admin/gradebook/page.tsx`**
- Baris ~64: `.in("type", ["code","css","quiz","lesson"])` → tambah `"web"`.
- `typeIcon` map (~98-105): tambah key `"web-challenge": "🕸️"` — **penting**: map ini di-key oleh `lessons.type` (dipakai sebagai `typeIcon[lesson.type]` di baris 441), bukan `submissions.type`. Key-nya harus `"web-challenge"`, bukan `"web"` — kalau salah, akan mereproduksi bug mismatch yang sudah ada antara `css-challenge` (lesson type) vs `css` (submission type) yang membuat CSS challenge selalu fallback ke ikon 📄 di gradebook hari ini.

## Yang TIDAK disentuh (dicatat sebagai isu pre-existing, di luar scope)

- Bug `lesson.is_project_required` yang selalu falsy di `src/app/lessons/[id]/page.tsx:401` (field ini tidak ada di skema manapun).
- Gradebook query `submissions` yang tidak menyertakan `type='project'` — pre-existing.
- Bug mismatch `typeIcon['css']` vs `lesson.type==='css-challenge'` di gradebook — sudah ada sebelum fitur ini, tidak diperbaiki (tapi fitur baru sengaja tidak mereproduksi pola bug yang sama).
- Constraint DB yang mungkin sudah divergen dari file `.sql` di repo — ditangani dengan instruksi verifikasi manual sebelum migrasi.
- Gap escaping `</style>` yang sama juga ada di `css-preview.ts` lama — tidak diperbaiki di sini, di luar scope fitur ini.

## Urutan Build

1. **Skema**: tulis & verifikasi manual `migration_web_challenges.sql` terhadap constraint live di Supabase, baru jalankan.
2. **Preview lib**: `src/lib/web-preview.ts` (`buildWebPreview`) — berdiri sendiri, bisa dites terpisah (buka string HTML hasil generate untuk cek overlay error + escaping).
3. **Editor guru**: `src/app/admin/web-challenges/[lessonId]/{page.tsx,WebChallengeEditor.tsx,actions.ts}` — bisa dites manual dengan insert baris `lessons` (`type='web-challenge'`) langsung ke DB sebelum UI pembuatan lesson selesai.
4. **Wiring pembuatan lesson**: `ModuleList.tsx` + `LessonForm.tsx`, supaya guru bisa benar-benar membuat lesson lewat UI dan menjangkau editor.
5. **UI siswa**: `WebChallenge.tsx` + `WebChallenge.module.css`, sambungkan `buildWebPreview` ke debounced effect — verifikasi preview live & tab gating per mode dulu sebelum menyambung grading AI (boleh stub `handleSubmit` sementara).
6. **Backend penilaian AI**: `src/app/lessons/web-challenge-actions.ts`, sambungkan `submitWebChallengeSolution`/`getWebChallengeHint` ke `WebChallenge.tsx`; tes dengan `DEEPSEEK_API_KEY` aktif, verifikasi fallback parse JSON & batas 3 percobaan.
7. **Wiring render siswa**: `src/app/lessons/[id]/page.tsx` (fetch + render branch + `isCodingLesson`).
8. **Wiring gradebook**: `src/app/admin/gradebook/page.tsx` (filter type + icon map).

## Verifikasi End-to-End

1. Sebagai guru: buat lesson baru kategori "Soal Coding Web" dari `ModuleList.tsx`, klik link ke `/admin/web-challenges/[id]`, isi mode `html-css-js` dengan starter + reference code contoh, simpan.
2. Ulangi buat 2 soal lain dengan mode `html` dan `html-css` — pastikan tab editor & preview menyesuaikan (kolom yang tidak dipakai tidak muncul ke siswa).
3. Sebagai siswa: buka masing-masing lesson, ketik kode, pastikan preview iframe ter-update otomatis (~300ms debounce) termasuk eksekusi JS (test: `document.getElementById(...).textContent=...` harus muncul di preview) dan error JS tidak merusak preview (muncul sebagai overlay merah, bukan blank).
4. Submit jawaban benar → skor AI ≥70, XP masuk (cek dashboard/leaderboard), baris `submissions` type `'web'` tersimpan dengan bentuk data yang benar.
5. Submit 3x untuk mode apa pun → percobaan ke-4 diblokir "Batas submit sudah tercapai (3/3)".
6. Cek `/admin/gradebook` menampilkan ikon 🕸️ untuk lesson `web-challenge` dan skornya ikut teragregasi ke nilai siswa.
7. Cek tombol hint AI memberi petunjuk tanpa memakan kuota percobaan submit.
8. Konfirmasi `DEEPSEEK_API_KEY` di `.env` sudah aktif (reuse, tidak perlu key baru) — kalau kosong, alur submit harus menampilkan "AI grading belum dikonfigurasi" (bukan crash), sama seperti fallback di `css-actions.ts:37-39`.

### File Kunci
- `migration_web_challenges.sql` (baru)
- `src/lib/web-preview.ts` (baru)
- `src/app/lessons/web-challenge-actions.ts` (baru)
- `src/components/WebChallenge.tsx` + `WebChallenge.module.css` (baru)
- `src/app/admin/web-challenges/[lessonId]/{page.tsx,WebChallengeEditor.tsx,actions.ts}` (baru)
- `src/app/admin/subjects/[id]/ModuleList.tsx` (ubah)
- `src/app/admin/subjects/[id]/LessonForm.tsx` (ubah)
- `src/app/lessons/[id]/page.tsx` (ubah)
- `src/app/admin/gradebook/page.tsx` (ubah)
