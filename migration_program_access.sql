-- ==========================================
-- Migration: Jalur program (Supercoder, MINAS, teaser) + pengamanan profil & XP
-- Jalankan SETELAH migration_student_active.sql. Aman dijalankan ulang.
-- ==========================================

-- ------------------------------------------
-- BAGIAN A — Pengamanan (Tahap 0)
-- ------------------------------------------

-- A1. Kolom penting di profiles hanya boleh diubah admin/guru atau kode server.
-- Policy "Users can update own profile" tidak membatasi kolom, sehingga siswa bisa
-- mengubah role/status/xp miliknya sendiri lewat supabase-js di browser.
-- Fungsi SECURITY DEFINER (increment_xp, set_student_active, dst.) berjalan sebagai
-- pemilik fungsi, dan service role sebagai 'service_role', sehingga keduanya lolos.
CREATE OR REPLACE FUNCTION public.guard_profile_columns()
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

  IF NEW.role IS DISTINCT FROM OLD.role
     OR NEW.status IS DISTINCT FROM OLD.status
     OR NEW.xp IS DISTINCT FROM OLD.xp
     OR NEW.level IS DISTINCT FROM OLD.level
     OR NEW.email IS DISTINCT FROM OLD.email
     OR NEW.deactivated_at IS DISTINCT FROM OLD.deactivated_at
     OR NEW.program IS DISTINCT FROM OLD.program
     OR NEW.username IS DISTINCT FROM OLD.username
  THEN
    RAISE EXCEPTION 'Kolom ini hanya boleh diubah oleh admin atau guru';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_profile_columns ON public.profiles;
CREATE TRIGGER guard_profile_columns
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.guard_profile_columns();

-- A2. increment_xp: hanya untuk diri sendiri, atau oleh admin/guru (penilaian manual).
-- Sebelumnya siapa pun bisa menambah XP akun mana pun.
CREATE OR REPLACE FUNCTION public.increment_xp(user_id UUID, amount INTEGER)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Harus login';
  END IF;

  IF user_id <> auth.uid() AND NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'teacher')
  ) THEN
    RAISE EXCEPTION 'Tidak boleh menambah XP akun lain';
  END IF;

  IF amount < 0 THEN
    RAISE EXCEPTION 'Jumlah XP tidak valid';
  END IF;

  UPDATE public.profiles
  SET xp = xp + amount,
      level = floor(1 + sqrt((xp + amount) / 100))::integer
  WHERE id = user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.increment_xp(UUID, INTEGER) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.increment_xp(UUID, INTEGER) TO authenticated;

-- ------------------------------------------
-- BAGIAN B — Program & akses materi (Tahap 1)
-- ------------------------------------------

-- B1. Jenis program siswa
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'student_program') THEN
    CREATE TYPE public.student_program AS ENUM ('supercoder', 'minas', 'teaser');
  END IF;
END $$;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS program public.student_program NOT NULL DEFAULT 'teaser';

-- Username untuk login MINAS (tanpa email). NULL untuk akun email/Google.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_key
  ON public.profiles (lower(username)) WHERE username IS NOT NULL;

-- Semua akun yang sudah disetujui/nonaktif, serta admin & guru, adalah Supercoder.
-- Akun pending tetap 'teaser' dan menjadi 'supercoder' saat di-approve (approve_student).
UPDATE public.profiles
SET program = 'supercoder'
WHERE program = 'teaser'
  AND (role IN ('admin', 'teacher') OR status::text IN ('approved', 'inactive'));

-- B2. Modul dicentang untuk program mana saja. Modul lama otomatis Supercoder.
ALTER TABLE public.modules
  ADD COLUMN IF NOT EXISTS programs public.student_program[] NOT NULL DEFAULT '{supercoder}';

-- B3. Akun baru: program dibaca dari app_metadata (hanya bisa diisi service role,
-- mis. saat guru membuat akun MINAS), BUKAN user_metadata yang bisa diisi pendaftar.
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

  INSERT INTO public.profiles (id, email, full_name, avatar_url, program, username)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    v_program,
    new.raw_app_meta_data->>'username'
  );
  RETURN new;
END;
$$;

-- B4. Approve siswa pending = jadikan siswa Supercoder.
-- Lewat fungsi karena RLS profiles hanya mengizinkan update profil sendiri.
CREATE OR REPLACE FUNCTION public.approve_student(p_student_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'teacher')
  ) THEN
    RAISE EXCEPTION 'Hanya admin atau guru yang boleh menyetujui siswa';
  END IF;

  UPDATE public.profiles
  SET status = 'approved', program = 'supercoder'
  WHERE id = p_student_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pengguna tidak ditemukan';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.approve_student(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.approve_student(UUID) TO authenticated;

-- B5. Apakah pengguna yang login boleh mengerjakan materi ini?
CREATE OR REPLACE FUNCTION public.can_access_lesson(p_lesson_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND (
        p.role IN ('admin', 'teacher')
        OR (
          p.status::text = 'approved'
          AND EXISTS (
            SELECT 1 FROM public.lessons l
            JOIN public.modules m ON m.id = l.module_id
            WHERE l.id = p_lesson_id AND p.program = ANY (m.programs)
          )
        )
      )
  );
$$;

REVOKE ALL ON FUNCTION public.can_access_lesson(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_access_lesson(UUID) TO authenticated;

-- B6. Siswa hanya boleh mengumpulkan jawaban untuk dirinya sendiri dan untuk materi
-- program-nya. Kuis dan proyek dikirim langsung dari browser, jadi pengecekan di
-- halaman saja tidak cukup. content_id = id kuis untuk type 'quiz', selain itu id materi.
CREATE OR REPLACE FUNCTION public.guard_submission_access()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_lesson_id UUID;
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

  IF NEW.student_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Tidak boleh mengirim jawaban atas nama siswa lain';
  END IF;

  IF NEW.type = 'quiz' THEN
    SELECT lesson_id INTO v_lesson_id FROM public.quizzes WHERE id = NEW.content_id;
  ELSE
    v_lesson_id := NEW.content_id;
  END IF;

  IF v_lesson_id IS NULL OR NOT public.can_access_lesson(v_lesson_id) THEN
    RAISE EXCEPTION 'Materi ini tidak tersedia untuk akunmu';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_submission_access ON public.submissions;
CREATE TRIGGER guard_submission_access
  BEFORE INSERT OR UPDATE ON public.submissions
  FOR EACH ROW EXECUTE FUNCTION public.guard_submission_access();

-- ------------------------------------------
-- Cek hasil
-- ------------------------------------------
-- Jumlah per program (siswa lama harus 'supercoder', pending 'teaser')
SELECT role, status, program, count(*) FROM public.profiles GROUP BY 1, 2, 3 ORDER BY 1, 2, 3;
-- Semua modul lama harus {supercoder}
SELECT programs, count(*) FROM public.modules GROUP BY 1;
