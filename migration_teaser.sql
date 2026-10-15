-- ==========================================
-- Migration: Jalur teaser — pendaftar langsung aktif + batas AI Hint harian
-- Jalankan SETELAH migration_program_access.sql. Aman dijalankan ulang.
-- ==========================================

-- 1. Akun baru langsung aktif. Pendaftar sendiri (email/Google) menjadi teaser dan hanya
-- bisa membuka modul yang dicentang Teaser; admin menaikkannya ke Supercoder setelah
-- bayar (approve_student). Akun MINAS tetap dibuat guru lewat admin API.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_program public.student_program := 'teaser';
BEGIN
  IF new.raw_app_meta_data->>'program' IN ('supercoder', 'minas', 'teaser') THEN
    v_program := (new.raw_app_meta_data->>'program')::public.student_program;
  END IF;

  INSERT INTO public.profiles (id, email, full_name, avatar_url, program, username, status)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    v_program,
    new.raw_app_meta_data->>'username',
    'approved'
  );
  RETURN new;
END;
$$;

-- 2. Akun yang masih menunggu persetujuan menjadi teaser aktif.
UPDATE public.profiles
SET status = 'approved'
WHERE role = 'student' AND status::text = 'pending' AND program = 'teaser';

-- 3. Catatan pemakaian AI Hint. Tanpa policy: klien tidak bisa membaca/menulis langsung,
-- hanya lewat consume_ai_hint().
CREATE TABLE IF NOT EXISTS public.ai_hint_usage (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ai_hint_usage_user_created_idx
  ON public.ai_hint_usage (user_id, created_at);
ALTER TABLE public.ai_hint_usage ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.ai_hint_usage FROM anon, authenticated;

-- 4. Boleh minta hint sekarang? Teaser: maks. 5 per hari (WITA), dan pemakaian dicatat.
-- Program lain tanpa batas. Batas sengaja tidak jadi parameter agar tidak bisa diubah klien;
-- samakan dengan TEASER_DAILY_HINTS di src/lib/lesson-access.ts.
CREATE OR REPLACE FUNCTION public.consume_ai_hint()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_program public.student_program;
  v_used INTEGER;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;

  SELECT program INTO v_program FROM public.profiles WHERE id = auth.uid();
  IF v_program IS DISTINCT FROM 'teaser' THEN
    RETURN TRUE;
  END IF;

  -- Cegah dua permintaan bersamaan sama-sama lolos di hint terakhir.
  PERFORM pg_advisory_xact_lock(hashtext('ai_hint:' || auth.uid()::text));

  SELECT count(*) INTO v_used
  FROM public.ai_hint_usage
  WHERE user_id = auth.uid()
    AND created_at >= (date_trunc('day', now() AT TIME ZONE 'Asia/Makassar')
                       AT TIME ZONE 'Asia/Makassar');

  IF v_used >= 5 THEN
    RETURN FALSE;
  END IF;

  INSERT INTO public.ai_hint_usage (user_id) VALUES (auth.uid());
  RETURN TRUE;
END;
$$;

REVOKE ALL ON FUNCTION public.consume_ai_hint() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.consume_ai_hint() TO authenticated;

-- ------------------------------------------
-- Cek hasil: tidak boleh ada lagi siswa teaser yang pending
-- ------------------------------------------
SELECT role, status, program, count(*) FROM public.profiles GROUP BY 1, 2, 3 ORDER BY 1, 2, 3;
