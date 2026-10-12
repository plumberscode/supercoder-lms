# Integrasi Pembayaran Mayar.id

Pendaftar **Weekend Coding Class (Rp399.000)** dan **Premium Online Class (Rp449.000)** di `/daftar` langsung diarahkan untuk membayar biaya **bulan pertama** secara online lewat Mayar. Bulan berikutnya tetap ditagih manual. **Custom Project Class tidak berubah**: isi form, muncul layar terima kasih, lalu admin menghubungi via WhatsApp.

## Status (12 Oktober 2026)

| Bagian | Status |
|---|---|
| Kode integrasi | ✅ **LIVE di production** sejak 12 Oktober 2026 (commit `3e9d662` di `main`) |
| Env di Vercel (Production) | ✅ `MAYAR_API_KEY`, `MAYAR_API_BASE_URL=https://api.mayar.id/hl/v2`, `MAYAR_WEBHOOK_TOKEN`, `SUPABASE_SERVICE_ROLE_KEY`, lalu redeploy |
| Migration database (`migration_mayar_payments.sql`) | ✅ Sudah dijalankan di Supabase |
| Typecheck, lint, unit test, `next build` | ✅ Lolos |
| Akun Mayar | ✅ Terverifikasi, API key **production** sudah dibuat |
| Uji end-to-end | ✅ Lolos di **production** dengan transaksi nyata (lihat di bawah) |
| Webhook Mayar | ✅ Didaftarkan (`https://www.supercoder.id/api/webhooks/mayar?token=…`), route hidup (token salah → 401). ⏳ Belum ada webhook pembayaran asli yang diterima |
| Notifikasi Telegram | ⏳ Belum teruji (env Telegram tidak ada di `.env.local`), email ✅ |

### Hasil uji production (12 Oktober 2026)

Sandbox web.mayar.io tidak bisa dipakai (login gagal: `InternalOAuthError` di server Mayar), jadi uji dilakukan di production dari `localhost:3000`, dengan harga Weekend diturunkan **sementara** ke Rp10.000 (tidak di-commit).

- ✅ **Weekend**: redirect ke Mayar, bayar Rp10.000, `/daftar/status` menampilkan "Pembayaran Berhasil", admin menandai **Lunas**, dana masuk di Mayar.
- ✅ Email admin: satu "pendaftaran baru" + satu "Pembayaran Diterima". Refresh halaman status tidak mengirim notifikasi ganda.
- ✅ **Premium**: nominal Rp449.000 di halaman Mayar, tidak dibayar → **Belum bayar**.
- ✅ **Custom Project**: layar terima kasih tanpa redirect.
- Penandaan lunas terjadi lewat pengecekan dari `/daftar/status`, bukan webhook. Field ID di payload webhook (`candidateIds()`) **masih belum dipastikan**. Cek log `[MAYAR WEBHOOK]` setelah transaksi production pertama.

## Alur pembayaran

1. User mengisi form `/daftar` dan memilih Weekend atau Premium. Tombol berubah menjadi **"Daftar & Bayar Rp399.000"** (atau Rp449.000).
2. Server action (`src/app/daftar/actions.ts`) menjalankan langkah berikut:
   - membuat ID pendaftaran;
   - menghitung nominal **di server** dari `src/lib/pricing.ts`;
   - meminta link pembayaran ke Mayar (berlaku 3 hari);
   - menyimpan pendaftaran dengan `payment_status = 'unpaid'`;
   - mengirim notifikasi admin ("menunggu pembayaran").
3. Browser langsung diarahkan ke halaman bayar Mayar (QRIS, VA, e-wallet).
4. Setelah membayar, Mayar mengarahkan user ke **`/daftar/status?id=…`**. Halaman ini menampilkan "Pembayaran Berhasil" atau "Menunggu Pembayaran" dengan tombol "Bayar Sekarang". Kalau webhook belum masuk, halaman ini mengecek status langsung ke Mayar.
5. Mayar mengirim webhook `payment.received` ke **`/api/webhooks/mayar?token=…`**. Server mengecek ulang status ke API Mayar, menandai pendaftaran `paid`, lalu admin mendapat notifikasi **"💰 Pembayaran Diterima"** lewat Telegram dan email.

**Fallback:** kalau Mayar error saat membuat link, pendaftaran **tetap tersimpan** (`unpaid`, tanpa link). User melihat layar terima kasih dengan pesan bahwa link pembayaran akan dikirim via WhatsApp, dan admin mendapat peringatan "link Mayar gagal dibuat — kirim tagihan manual".

## Keputusan teknis

| Keputusan | Alasan |
|---|---|
| **Mayar API V2** (`/hl/v2`) | V1 deprecated sejak 1 Oktober 2026. |
| **Single Payment Request** (`POST /payments/create`) | Tidak perlu membuat produk di dashboard. Nominal, nama, dan email dikirim dari server, dan respons berisi `id` + `link`. |
| **Status webhook selalu dicek ulang** ke `GET /payments/{id}` | Mayar tidak mendokumentasikan signature webhook, jadi isi webhook tidak dipercaya mentah-mentah. |
| **Token rahasia di URL webhook** | Penyaring awal agar request acak langsung ditolak (401). Dibandingkan dengan `timingSafeEqual`. |
| **Supabase service role** (`src/utils/supabase/admin.ts`) | RLS tabel `registrations` hanya mengizinkan admin membaca/mengubah. Webhook dan halaman status tidak punya sesi login. |
| **Update idempoten** (`WHERE payment_status <> 'paid'`) | Webhook yang terkirim ulang, ditambah pengecekan dari halaman status, tidak membuat notifikasi admin terkirim dua kali. |
| **Nominal dihitung di server** | Nominal tidak bisa dimanipulasi dari browser. |
| **Status pembayaran terpisah dari `status`** | `status` (pending/contacted/enrolled/cancelled) tetap untuk follow-up admin. |

## File

### Baru

| File | Fungsi |
|---|---|
| `src/lib/pricing.ts` | Harga bulan pertama per kelas (`CLASS_PRICES`), `getClassPrice()`, `formatRupiah()` |
| `src/lib/mayar.ts` | Klien Mayar: `createPaymentRequest()`, `getPaymentRequest()`. Body `statusCode` dijadikan acuan, timeout 15 detik, tidak melempar error |
| `src/lib/payments.ts` | `markRegistrationPaid()`: cek ulang ke Mayar, update idempoten, kirim notifikasi pembayaran |
| `src/utils/supabase/admin.ts` | Supabase client service role (khusus server) |
| `src/app/api/webhooks/mayar/route.ts` | Penerima webhook Mayar |
| `src/app/daftar/status/page.tsx` | Halaman hasil pembayaran (noindex) |
| `src/lib/__tests__/mayar.test.ts` | Unit test klien Mayar (5 test) |
| `migration_mayar_payments.sql` | Kolom pembayaran di `registrations` |

### Diubah

| File | Perubahan |
|---|---|
| `src/app/daftar/actions.ts` | Membuat link Mayar untuk Weekend/Premium, menyimpan field pembayaran, mengembalikan `paymentUrl`. Sisa logika voucher Promo 9.9 dihapus |
| `src/app/daftar/RegistrationForm.tsx` | Tombol "Daftar & Bayar Rp…", catatan Mayar di bawah tombol, redirect ke Mayar, pesan fallback di layar terima kasih |
| `src/lib/telegram.ts`, `src/lib/email.ts` | Baris info pembayaran di notifikasi pendaftaran, notifikasi baru "Pembayaran Diterima". Pengiriman email dipisah ke `deliverAdminEmail()` |
| `src/app/admin/registrations/page.tsx` + `.module.css` | Chip **Lunas** / **Belum bayar** (bisa diklik untuk membuka link Mayar). KPI "Voucher Promo 9.9" diganti **"Sudah Bayar"** |
| `src/lib/__tests__/telegram.test.ts` | Data test disesuaikan dengan field pembayaran |
| `.env.example` | Variabel Mayar dan service role |

## Database

Kolom baru di `public.registrations` (✅ sudah dijalankan):

| Kolom | Tipe | Isi |
|---|---|---|
| `payment_status` | TEXT | `NULL` (Custom Project), `unpaid`, `paid` |
| `payment_amount` | INTEGER | Nominal rupiah |
| `mayar_payment_id` | TEXT UNIQUE | ID Single Payment Request Mayar |
| `mayar_payment_link` | TEXT | Link bayar (bisa dikirim ulang ke siswa) |
| `paid_at` | TIMESTAMPTZ | Waktu ditandai lunas |

## Environment variables

Isi di `.env.local` (lokal) **dan** di hosting (produksi). Jangan pernah memberi awalan `NEXT_PUBLIC_` pada key-key ini.

| Variabel | Sumber | Sandbox | Produksi |
|---|---|---|---|
| `MAYAR_API_KEY` | Dashboard Mayar → API Keys, akses **Read & Write** | web.mayar.io/api-keys | web.mayar.id/api-keys |
| `MAYAR_API_BASE_URL` | — | `https://api.mayar.io/hl/v2` | `https://api.mayar.id/hl/v2` |
| `MAYAR_WEBHOOK_TOKEN` | String acak panjang buatan sendiri | bebas | **beda** dari sandbox |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API | sama | sama |

## ⚠️ Jangan hapus env Mayar di Vercel

Pembayaran online sudah live. Kalau env di Vercel dihapus atau salah:
- Tanpa `MAYAR_API_KEY`, atau dengan `MAYAR_API_BASE_URL` yang mengarah ke sandbox (`api.mayar.io`): tombol tetap bertuliskan "Daftar & Bayar Rp…", tapi link pembayaran gagal dibuat. User melihat layar terima kasih ("link pembayaran akan dikirim via WhatsApp"), dan admin harus menagih manual. Pendaftaran **tidak hilang**.
- Tanpa `SUPABASE_SERVICE_ROLE_KEY`: halaman `/daftar/status` dan webhook error.
- `MAYAR_WEBHOOK_TOKEN` di Vercel harus **sama** dengan token di URL webhook dashboard Mayar. Kalau berbeda, webhook ditolak 401 dan pendaftaran hanya ditandai lunas saat siswa membuka `/daftar/status`.

Setiap kali env diubah di Vercel, lakukan **Redeploy** agar nilainya terbaca.

## Belum pasti (dipastikan dari transaksi production pertama)

- **Field ID di payload webhook.** Dokumentasi Mayar tidak menyebut field mana di data webhook yang berisi ID payment request. Untuk sementara, `candidateIds()` di `route.ts` mencocokkan `paymentLinkId`, `productId`, `paymentRequestId`, `id`, dan `transactionId` ke kolom `mayar_payment_id`. Kalau tidak ada yang cocok, payload lengkap dicatat ke log (`No registration matched`). Setelah field yang benar diketahui, sederhanakan menjadi satu field saja.
- **Retry webhook.** Dokumentasi tidak menjelaskan apakah Mayar mengirim ulang webhook yang gagal. Route membalas 500 hanya saat error database, supaya bisa di-retry. Halaman `/daftar/status` juga mengecek status langsung ke Mayar sebagai cadangan.

## Rencana ke depan

### 1. Uji end-to-end (✅ selesai 12 Oktober 2026)
Dilakukan di production dari localhost, bukan sandbox (lihat "Hasil uji production" di atas).
- [x] Weekend: redirect ke `*.myr.id`, bayar nyata, `/daftar/status` "Pembayaran Berhasil", admin **Lunas**.
- [x] Notifikasi "Pembayaran Diterima" hanya **sekali** walau halaman status di-refresh.
- [x] Premium: nominal 449000. Custom Project: tanpa redirect.
- [x] Webhook dengan token salah: 401 (dicek di production).
- [ ] Kosongkan `MAYAR_API_KEY`: pendaftaran tetap tersimpan, pesan fallback tampil.
- [ ] Cek `/daftar/status` dan halaman admin di layar HP.

### 2. Go-live produksi (✅ live 12 Oktober 2026)
- [x] API key produksi dari web.mayar.id/api-keys.
- [x] Env di Vercel (Production): `MAYAR_API_KEY`, `MAYAR_API_BASE_URL=https://api.mayar.id/hl/v2`, `MAYAR_WEBHOOK_TOKEN`, `SUPABASE_SERVICE_ROLE_KEY`, lalu redeploy.
- [x] Webhook produksi didaftarkan: `https://www.supercoder.id/api/webhooks/mayar?token=<token produksi>`.
- [x] Deploy (`main` → Vercel, commit `3e9d662`). `/daftar` menampilkan "Daftar & Bayar Rp399.000".
- [ ] Transaksi production pertama: cek log Vercel `[MAYAR WEBHOOK]`. Kalau muncul "No registration matched", catat field ID dari payload lalu perbaiki `candidateIds()`. Kalau cocok, sederhanakan `candidateIds()` menjadi satu field.
- [ ] Pastikan `TELEGRAM_BOT_TOKEN` dan `TELEGRAM_CHAT_ID` ada di Vercel, lalu cek notifikasi "💰 Pembayaran Diterima" di Telegram.
- [ ] Hapus baris uji (TEST …) di `/admin/registrations` dan link Premium uji yang belum dibayar di dashboard Mayar.

### 3. Opsional / berikutnya
- **Feature flag `MAYAR_ENABLED`** untuk menyalakan/mematikan pembayaran online tanpa deploy ulang kode.
- **Satu sumber harga:** label harga di `ProgramSection.tsx`, `kursus-komputer-balikpapan/data.ts`, `faq-data.ts`, dan `JsonLd.tsx` diambil dari `src/lib/pricing.ts`.
- **Tagihan bulan ke-2 dan seterusnya:** link Mayar manual dari admin, atau fitur Membership Mayar.
- **Kuota Weekend (maks. 6 siswa):** saat ini kasus kelas penuh setelah bayar ditangani admin secara manual (refund/jadwal lain).

## Referensi

- Mayar API V2: https://docs.mayar.id/api-reference-v2/introduction
- Migrasi V1 → V2: https://docs.mayar.id/api-reference-v2/migration-from-v1
- Buat payment request: https://docs.mayar.id/api-reference-v2/reqpayment/create
- Detail payment request: https://docs.mayar.id/api-reference-v2/reqpayment/detail
- Webhook: https://docs.mayar.id/integration/webhook
