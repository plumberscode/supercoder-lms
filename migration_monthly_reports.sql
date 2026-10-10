-- ==========================================
-- Migration: Rapor Bulanan untuk Orang Tua
-- ==========================================

-- 1. Kontak orang tua di profil siswa
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS parent_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS parent_whatsapp TEXT;

-- 2. Tabel rapor bulanan (satu baris per siswa per bulan)
CREATE TABLE IF NOT EXISTS public.monthly_reports (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  period DATE NOT NULL, -- selalu tanggal 1 pada bulan rapor
  status TEXT CHECK (status IN ('draft', 'published')) DEFAULT 'draft' NOT NULL,
  strengths TEXT,
  improvements TEXT,
  parent_advice TEXT,
  snapshot JSONB, -- data nilai yang dibekukan saat rapor diterbitkan
  public_token TEXT UNIQUE, -- dibuat saat terbit, dipakai untuk link orang tua
  published_at TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE (student_id, period)
);

-- 3. Permissions (anon tidak mendapat akses tabel; hanya lewat fungsi di bawah)
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON TABLE public.monthly_reports TO authenticated, service_role;

-- 4. Row Level Security
ALTER TABLE public.monthly_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow admin and teacher to manage monthly reports" ON public.monthly_reports;

CREATE POLICY "Allow admin and teacher to manage monthly reports"
ON public.monthly_reports
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'teacher')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'teacher')
  )
);

-- 5. Akses publik untuk orang tua: hanya rapor yang sudah terbit, dicari lewat token
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
