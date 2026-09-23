-- ==========================================
-- Migration: Blog (artikel SEO)
-- ==========================================
-- Tabel: blog_categories, blog_posts, blog_media
-- Publik (anon) hanya bisa membaca artikel yang sudah terbit.
-- Hanya role 'admin' yang bisa menulis/mengubah/menghapus.

-- 0. Helper: cek apakah user saat ini admin (SECURITY DEFINER agar tidak
--    terkena RLS tabel profiles)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- 1. Kategori
CREATE TABLE IF NOT EXISTS public.blog_categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Artikel
CREATE TABLE IF NOT EXISTS public.blog_posts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,                 -- <title> SEO (bukan H1)
  slug TEXT NOT NULL UNIQUE,
  headline TEXT,                       -- H1; fallback ke title
  content TEXT NOT NULL DEFAULT '',    -- HTML (sudah disanitasi saat simpan)
  excerpt TEXT,                        -- ringkasan di bawah H1
  meta_description TEXT,               -- meta/OG/Twitter description
  category_id UUID REFERENCES public.blog_categories(id) ON DELETE SET NULL,
  image_url TEXT,                      -- gambar unggulan / OG (Cloudinary)
  image_alt TEXT,
  author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  author_name TEXT,                    -- disalin saat simpan agar publik tidak perlu baca profiles
  faq JSONB NOT NULL DEFAULT '[]'::jsonb, -- [{ "q": "...", "a": "..." }]
  noindex BOOLEAN NOT NULL DEFAULT FALSE,
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL, -- masa depan = terjadwal
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS blog_posts_published_idx
  ON public.blog_posts (is_published, published_at DESC);
CREATE INDEX IF NOT EXISTS blog_posts_category_idx
  ON public.blog_posts (category_id);

CREATE OR REPLACE FUNCTION public.blog_posts_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS blog_posts_updated_at ON public.blog_posts;
CREATE TRIGGER blog_posts_updated_at
  BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW EXECUTE FUNCTION public.blog_posts_set_updated_at();

-- 3. Media library (aset Cloudinary)
CREATE TABLE IF NOT EXISTS public.blog_media (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  public_id TEXT,
  url TEXT NOT NULL UNIQUE,
  name TEXT,
  width INTEGER,
  height INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 4. Grants
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON TABLE public.blog_categories TO anon;
GRANT SELECT ON TABLE public.blog_posts TO anon;
GRANT ALL ON TABLE public.blog_categories TO authenticated, service_role;
GRANT ALL ON TABLE public.blog_posts TO authenticated, service_role;
GRANT ALL ON TABLE public.blog_media TO authenticated, service_role;

-- 5. RLS
ALTER TABLE public.blog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_media ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read blog categories" ON public.blog_categories;
DROP POLICY IF EXISTS "Admin can manage blog categories" ON public.blog_categories;
DROP POLICY IF EXISTS "Public can read published blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Admin can manage blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Admin can manage blog media" ON public.blog_media;

CREATE POLICY "Public can read blog categories"
ON public.blog_categories FOR SELECT
TO anon, authenticated
USING (TRUE);

CREATE POLICY "Admin can manage blog categories"
ON public.blog_categories FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Public can read published blog posts"
ON public.blog_posts FOR SELECT
TO anon, authenticated
USING (is_published = TRUE AND published_at <= NOW());

-- Admin: baca semua (termasuk draft & terjadwal) + tulis
CREATE POLICY "Admin can manage blog posts"
ON public.blog_posts FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Admin can manage blog media"
ON public.blog_media FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());
