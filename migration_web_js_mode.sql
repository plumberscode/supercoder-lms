-- ==========================================
-- Migration: Mode "JavaScript saja" untuk Soal Coding Web
-- Jalankan sebelum admin menyimpan soal dengan mode JavaScript saja. Kode baru aman
-- dideploy lebih dulu. Aman dijalankan ulang.
-- ==========================================

ALTER TABLE public.web_challenges
  DROP CONSTRAINT IF EXISTS web_challenges_mode_check;

ALTER TABLE public.web_challenges
  ADD CONSTRAINT web_challenges_mode_check
  CHECK (mode IN ('html', 'html-css', 'html-css-js', 'js'));

-- ------------------------------------------
-- Cek hasil
-- ------------------------------------------
SELECT conname, pg_get_constraintdef(oid) AS definisi
FROM pg_constraint
WHERE conrelid = 'public.web_challenges'::regclass AND contype = 'c';
