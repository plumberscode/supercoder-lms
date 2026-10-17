-- ==========================================
-- Migration: XP kuis tepat sekali per siswa per kuis
-- submitQuiz menandai submission yang memberi XP dengan data.xp_awarded. Index ini
-- menolak penanda kedua untuk kuis yang sama, sehingga dua kiriman bersamaan tidak
-- sama-sama mendapat XP. Boleh dijalankan sebelum atau sesudah deploy kode.
-- Aman dijalankan ulang.
-- ==========================================

CREATE UNIQUE INDEX IF NOT EXISTS submissions_quiz_xp_once
  ON public.submissions (student_id, content_id)
  WHERE type = 'quiz' AND data ? 'xp_awarded';

-- ------------------------------------------
-- Cek hasil
-- ------------------------------------------
SELECT indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public' AND indexname = 'submissions_quiz_xp_once';
