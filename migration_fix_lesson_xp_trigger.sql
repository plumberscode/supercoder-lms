-- ==========================================
-- Migration: Hapus trigger XP nilai manual & tarik kembali XP ganda
-- ==========================================
-- Trigger on_submission_score_change (fungsi sync_submission_xp) dibuat langsung di
-- Supabase sejak 26 Mei: setiap nilai manual (type = 'lesson') menambah XP sebesar
-- skornya (selisih skor saat diperbarui). Sejak ada bobot XP per materi
-- (migration_lesson_xp_reward.sql), aplikasi juga memberi bobot XP, sehingga satu
-- penilaian memberi XP dua kali (mis. skor 90 + bobot 40 = 130).
--
-- Mulai sekarang XP nilai manual hanya dari aplikasi (bobot, sekali per siswa per materi).
-- XP dari nilai manual lama (sebelum ada bobot) tetap dipertahankan.
-- Aman dijalankan ulang: submission yang sudah dikoreksi diberi penanda trigger_xp_reverted.

-- 0. Sebelum: siswa yang terdampak
SELECT p.full_name, p.xp, p.level, s.score AS xp_trigger_ditarik
FROM public.submissions s
JOIN public.profiles p ON p.id = s.student_id
WHERE s.type = 'lesson' AND s.data ? 'xp_awarded' AND NOT s.data ? 'trigger_xp_reverted'
ORDER BY p.full_name;

BEGIN;

-- 1. Hapus trigger dulu agar koreksi di bawah tidak memicunya
DROP TRIGGER IF EXISTS on_submission_score_change ON public.submissions;
DROP FUNCTION IF EXISTS public.sync_submission_xp();

-- 2. Tarik kembali XP dari trigger untuk submission yang sudah diberi bobot XP oleh aplikasi.
--    Total kontribusi trigger per submission = skor terakhirnya (jumlah semua selisih).
WITH dup AS (
  SELECT id, student_id, COALESCE(score, 0) AS score
  FROM public.submissions
  WHERE type = 'lesson' AND data ? 'xp_awarded' AND NOT data ? 'trigger_xp_reverted'
),
fixed_profiles AS (
  UPDATE public.profiles p
  SET xp = GREATEST(0, p.xp - t.total),
      level = floor(1 + sqrt(GREATEST(0, p.xp - t.total) / 100.0))::integer
  FROM (SELECT student_id, SUM(score) AS total FROM dup GROUP BY student_id) t
  WHERE p.id = t.student_id
  RETURNING p.id
)
UPDATE public.submissions s
SET data = s.data || '{"trigger_xp_reverted": true}'::jsonb
FROM dup
WHERE s.id = dup.id;

COMMIT;

-- 3. Sesudah: cek hasil koreksi
SELECT p.full_name, p.xp, p.level
FROM public.profiles p
WHERE p.id IN (
  SELECT student_id FROM public.submissions
  WHERE type = 'lesson' AND data ? 'trigger_xp_reverted'
)
ORDER BY p.full_name;

-- 4. Pastikan trigger sudah tidak ada (harus 0 baris)
SELECT tgname FROM pg_trigger
WHERE tgrelid = 'public.submissions'::regclass AND NOT tgisinternal;
