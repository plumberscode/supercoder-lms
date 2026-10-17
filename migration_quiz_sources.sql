-- ==========================================
-- Migration: Sumber soal kuis dinamis bisa dipilih admin
-- Jalankan SETELAH migration_question_bank_module.sql dan SEBELUM deploy kode
-- terbaru: kode baru membaca kolom quizzes.sources. Aman dijalankan ulang.
-- ==========================================

-- Daftar sumber soal: [{ "module_id": uuid, "category": text | null, "count": int }].
-- category null = semua kategori di modul itu.
-- NULL = kuis lama: soal diambil dari modul materinya + target_category +
-- question_count, sama seperti sebelumnya.
ALTER TABLE public.quizzes
  ADD COLUMN IF NOT EXISTS sources JSONB;

-- ------------------------------------------
-- Cek hasil
-- ------------------------------------------
SELECT count(*) FILTER (WHERE is_dynamic AND sources IS NULL) AS kuis_dinamis_lama,
       count(*) FILTER (WHERE sources IS NOT NULL) AS kuis_dengan_sumber
FROM public.quizzes;
