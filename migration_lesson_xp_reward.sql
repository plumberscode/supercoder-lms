-- ==========================================
-- Migration: Bobot XP untuk nilai manual (Penilaian Materi)
-- ==========================================

-- Nilai manual tetap berskala 0-100. Kolom ini adalah XP yang didapat siswa
-- sekali, saat nilai manualnya untuk materi ini pertama kali >= 70.
-- Trigger lama yang menambah XP sebesar skor dihapus di migration_fix_lesson_xp_trigger.sql.
ALTER TABLE public.lessons
  ADD COLUMN IF NOT EXISTS xp_reward INTEGER NOT NULL DEFAULT 0
  CHECK (xp_reward >= 0);
