-- ==========================================
-- Migration: Bank soal dikelompokkan per Modul (bukan Mata Pelajaran)
-- Jalankan SETELAH migration_xp_integrity.sql, dan DEPLOY kode terbaru bersamaan:
-- kode baru menyimpan module_id dan kuis dinamis mengambil soal dari modul
-- materinya. Aman dijalankan ulang.
-- ==========================================

-- 1. Soal milik satu modul. Modul dihapus → soalnya ikut terhapus, sama seperti
-- materi di modul tersebut.
ALTER TABLE public.question_bank
  ADD COLUMN IF NOT EXISTS module_id UUID REFERENCES public.modules(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS question_bank_module_id_idx
  ON public.question_bank (module_id);

-- 2. subject_id tidak dipakai lagi oleh aplikasi (mata pelajaran mengikuti modul).
-- Kolomnya dibiarkan agar migration ini tidak menghapus data; cukup pastikan opsional.
ALTER TABLE public.question_bank ALTER COLUMN subject_id DROP NOT NULL;

-- 3. Kuis dinamis kini mengambil soal dari modul materinya; kategori hanya penyaring
-- tambahan dan boleh kosong.
ALTER TABLE public.quizzes ALTER COLUMN target_category DROP NOT NULL;

-- ------------------------------------------
-- Cek hasil
-- ------------------------------------------
-- Soal yang belum punya modul. Harus 0 (bank soal masih kosong saat migration ini
-- dibuat); soal tanpa modul tidak akan pernah muncul di kuis dinamis.
SELECT count(*) AS soal_tanpa_modul FROM public.question_bank WHERE module_id IS NULL;
