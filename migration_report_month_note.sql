-- ==========================================
-- Migration: Catatan "Kegiatan Bulan Ini" pada rapor bulanan
-- Jalankan SETELAH migration_monthly_reports.sql
-- ==========================================

-- Penjelasan guru tentang kegiatan siswa bulan itu (mis. fokus persiapan lomba
-- sehingga tidak ada tugas LMS). Tampil di atas statistik rapor.
ALTER TABLE public.monthly_reports ADD COLUMN IF NOT EXISTS month_note TEXT;

CREATE OR REPLACE FUNCTION public.get_public_report(p_token TEXT)
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'period', r.period,
    'snapshot', r.snapshot,
    'month_note', r.month_note,
    'strengths', r.strengths,
    'improvements', r.improvements,
    'parent_advice', r.parent_advice,
    'published_at', r.published_at,
    'parent_name', p.parent_name
  )
  FROM public.monthly_reports r
  JOIN public.profiles p ON p.id = r.student_id
  WHERE r.public_token = p_token
    AND r.status = 'published'
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_public_report(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_report(TEXT) TO anon, authenticated;
