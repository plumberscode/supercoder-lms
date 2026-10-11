-- ==========================================
-- Migration: Admin/guru boleh mengisi kontak orang tua siswa
-- Jalankan SETELAH migration_monthly_reports.sql
-- ==========================================

-- RLS profiles hanya mengizinkan "update own profile", jadi update dari admin ke baris siswa
-- tidak mengubah apa pun. Fungsi ini membuka akses sempit: hanya admin/guru, hanya baris siswa,
-- dan hanya dua kolom kontak orang tua.
CREATE OR REPLACE FUNCTION public.set_parent_contact(
  p_student_id UUID,
  p_parent_name TEXT,
  p_parent_whatsapp TEXT
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
    RAISE EXCEPTION 'Hanya admin atau guru yang boleh mengubah kontak orang tua';
  END IF;

  UPDATE public.profiles
  SET parent_name = NULLIF(TRIM(p_parent_name), ''),
      parent_whatsapp = NULLIF(TRIM(p_parent_whatsapp), '')
  WHERE id = p_student_id AND role = 'student';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Siswa tidak ditemukan';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.set_parent_contact(UUID, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_parent_contact(UUID, TEXT, TEXT) TO authenticated;
