-- ==========================================
-- Migration: reset jatah penilaian soal coding (CSS, Web, HTML+JS)
-- Admin bisa memberi siswa jatah penilaian baru dari Buku Nilai. Riwayat percobaan
-- (data.attempts) tetap utuh; jatah terpakai dihitung dari percobaan SETELAH
-- attempts_reset_at. Kolom terpisah (bukan di dalam data) supaya penilaian yang
-- sedang berjalan tidak menimpa reset.
-- WAJIB dijalankan SEBELUM deploy kode yang memakai kolom ini.
-- Aman dijalankan ulang.
-- ==========================================

ALTER TABLE public.submissions
  ADD COLUMN IF NOT EXISTS attempts_reset_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS attempts_reset_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS attempts_reset_count INTEGER NOT NULL DEFAULT 0;

-- ------------------------------------------
-- Cek hasil
-- ------------------------------------------
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'submissions'
  AND column_name LIKE 'attempts_reset%';
