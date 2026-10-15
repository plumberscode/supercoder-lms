-- ==========================================
-- Migration: Skor & XP hanya dari server, kunci jawaban tidak bisa dibaca siswa
-- Jalankan SETELAH migration_teaser.sql, dan DEPLOY kode terbaru bersamaan:
-- kode lama (yang menulis jawaban kuis/proyek langsung dari browser) akan gagal
-- setelah migration ini. Aman dijalankan ulang.
-- ==========================================

-- 1. XP hanya bisa ditambah oleh server (service role), lewat awardXp() di
-- src/lib/xp.ts. Sebelumnya siswa bisa memanggil increment_xp dari browser untuk
-- dirinya sendiri dengan jumlah bebas.
CREATE OR REPLACE FUNCTION public.increment_xp(user_id UUID, amount INTEGER)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF amount < 0 THEN
    RAISE EXCEPTION 'Jumlah XP tidak valid';
  END IF;

  UPDATE public.profiles
  SET xp = xp + amount,
      level = floor(1 + sqrt((xp + amount) / 100))::integer
  WHERE id = user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.increment_xp(UUID, INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_xp(UUID, INTEGER) TO service_role;

-- 2. Siswa tidak boleh menulis tabel submissions langsung (mis. mengubah skornya
-- sendiri lewat API). Semua jawaban siswa disimpan server action lewat service role
-- setelah dinilai di server. Admin/guru tetap boleh (Penilaian Materi, nilai proyek).
CREATE OR REPLACE FUNCTION public.guard_submission_access()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF current_user NOT IN ('authenticated', 'anon') THEN
    RETURN NEW;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'teacher')
  ) THEN
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'Jawaban hanya bisa dikirim lewat aplikasi';
END;
$$;

-- Hapus juga dijaga: tanpa ini siswa bisa menghapus kirimannya sendiri untuk mereset
-- batas percobaan (CSS/Web maks. 3x). Fungsi terpisah karena trigger DELETE harus
-- mengembalikan OLD.
CREATE OR REPLACE FUNCTION public.guard_submission_delete()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF current_user NOT IN ('authenticated', 'anon') OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'teacher')
  ) THEN
    RETURN OLD;
  END IF;
  RAISE EXCEPTION 'Jawaban hanya bisa dihapus oleh admin atau guru';
END;
$$;

DROP TRIGGER IF EXISTS guard_submission_access ON public.submissions;
CREATE TRIGGER guard_submission_access
  BEFORE INSERT OR UPDATE ON public.submissions
  FOR EACH ROW EXECUTE FUNCTION public.guard_submission_access();

DROP TRIGGER IF EXISTS guard_submission_delete ON public.submissions;
CREATE TRIGGER guard_submission_delete
  BEFORE DELETE ON public.submissions
  FOR EACH ROW EXECUTE FUNCTION public.guard_submission_delete();

-- 3. Tabel soal berisi kunci jawaban (correct_option_index, reference_*): hanya staf
-- yang boleh membaca/mengubah. Siswa menerima soal tanpa kunci lewat server
-- (quiz-actions.ts, halaman lesson). Semua policy lama di tabel ini dihapus — termasuk
-- yang mungkin dibuat langsung di dashboard — lalu diganti satu policy khusus staf.
DO $$
DECLARE
  t TEXT;
  p RECORD;
BEGIN
  FOREACH t IN ARRAY ARRAY['quiz_questions', 'question_bank', 'css_challenges', 'web_challenges']
  LOOP
    FOR p IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = t
    LOOP
      EXECUTE format('DROP POLICY %I ON public.%I', p.policyname, t);
    END LOOP;

    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format(
      'CREATE POLICY "Staff manage %s" ON public.%I FOR ALL
         USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN (''admin'', ''teacher'')))
         WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN (''admin'', ''teacher'')))',
      t, t
    );
  END LOOP;
END $$;

-- ------------------------------------------
-- Cek hasil
-- ------------------------------------------
-- Harus 4 baris, masing-masing satu policy "Staff manage ..."
SELECT tablename, policyname, cmd FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('quiz_questions', 'question_bank', 'css_challenges', 'web_challenges')
ORDER BY tablename;
