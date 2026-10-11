-- ==========================================
-- Migration: Nonaktifkan / aktifkan kembali siswa tanpa menghapus record
-- Jalankan SETELAH migration_parent_contact.sql
-- ==========================================

-- Status baru 'inactive': siswa yang berhenti. Semua query yang menyaring status = 'approved'
-- (dashboard, leaderboard, draf rapor) otomatis mengecualikan siswa nonaktif.
ALTER TYPE user_status ADD VALUE IF NOT EXISTS 'inactive';

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMPTZ;

-- RLS profiles hanya mengizinkan "update own profile", jadi perubahan status dari admin
-- lewat fungsi ini: hanya admin/guru, hanya baris siswa, hanya status & deactivated_at.
CREATE OR REPLACE FUNCTION public.set_student_active(
  p_student_id UUID,
  p_active BOOLEAN
)
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
    RAISE EXCEPTION 'Hanya admin atau guru yang boleh mengubah status siswa';
  END IF;

  IF p_active THEN
    UPDATE public.profiles
    SET status = 'approved', deactivated_at = NULL
    WHERE id = p_student_id AND role = 'student' AND status::text = 'inactive';
  ELSE
    UPDATE public.profiles
    SET status = 'inactive', deactivated_at = now()
    WHERE id = p_student_id AND role = 'student' AND status::text = 'approved';
  END IF;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Siswa tidak ditemukan atau statusnya sudah berubah';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.set_student_active(UUID, BOOLEAN) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_student_active(UUID, BOOLEAN) TO authenticated;
