-- ==========================================
-- Migration: SEO Agent (admin)
-- ==========================================
-- Tabel: seo_settings, seo_conversations, seo_messages, seo_reports, seo_cache
-- Semua hanya bisa diakses role 'admin' (fungsi public.is_admin() dari migration_blog.sql).

-- 1. Pengaturan (satu baris, id = 1)
CREATE TABLE IF NOT EXISTS public.seo_settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  site_url TEXT NOT NULL DEFAULT 'https://supercoder.id',
  location TEXT NOT NULL DEFAULT 'Balikpapan, East Kalimantan, Indonesia',
  language TEXT NOT NULL DEFAULT 'id',
  competitors TEXT[] NOT NULL DEFAULT '{}',
  seed_keywords TEXT[] NOT NULL DEFAULT '{}',
  gsc_property TEXT,                   -- mis. 'sc-domain:supercoder.id'
  gsc_links JSONB NOT NULL DEFAULT '[]'::jsonb, -- impor CSV "Top linking sites" dari GSC
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Isi awal dari audit 27 Sept 2026 (bisa diubah di /admin/seo/settings)
INSERT INTO public.seo_settings (id, competitors, seed_keywords, gsc_property)
VALUES (
  1,
  ARRAY['timedooracademy.com', 'kodekiddo.com', 'lauwba.com'],
  ARRAY[
    'kursus coding balikpapan',
    'coding class balikpapan',
    'belajar coding balikpapan',
    'les coding anak balikpapan',
    'kursus programming balikpapan',
    'kursus komputer balikpapan',
    'les coding balikpapan',
    'kursus web programming balikpapan',
    'supercoder balikpapan'
  ],
  'sc-domain:supercoder.id'
)
ON CONFLICT (id) DO NOTHING;

-- 2. Percakapan
CREATE TABLE IF NOT EXISTS public.seo_conversations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL DEFAULT 'Percakapan baru',
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 3. Pesan (format OpenAI chat: user / assistant (+tool_calls) / tool)
CREATE TABLE IF NOT EXISTS public.seo_messages (
  id BIGSERIAL PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.seo_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'tool')),
  content TEXT,
  tool_calls JSONB,
  tool_call_id TEXT,
  meta JSONB,                          -- untuk UI: { name, ok, summary, event } pada pesan tool
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS seo_messages_conversation_idx
  ON public.seo_messages (conversation_id, id);

-- 4. Laporan
CREATE TABLE IF NOT EXISTS public.seo_reports (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  conversation_id UUID REFERENCES public.seo_conversations(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('audit', 'competitor', 'keyword_gap', 'serp', 'opportunities', 'backlinks', 'other')),
  title TEXT NOT NULL,
  summary_md TEXT NOT NULL DEFAULT '',
  data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS seo_reports_created_idx
  ON public.seo_reports (created_at DESC);

-- 5. Cache hasil provider (hemat kredit API)
CREATE TABLE IF NOT EXISTS public.seo_cache (
  key TEXT PRIMARY KEY,
  provider TEXT NOT NULL,
  payload JSONB NOT NULL,
  fetched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- 6. Grants
GRANT ALL ON TABLE public.seo_settings TO authenticated, service_role;
GRANT ALL ON TABLE public.seo_conversations TO authenticated, service_role;
GRANT ALL ON TABLE public.seo_messages TO authenticated, service_role;
GRANT ALL ON TABLE public.seo_reports TO authenticated, service_role;
GRANT ALL ON TABLE public.seo_cache TO authenticated, service_role;
GRANT USAGE, SELECT ON SEQUENCE public.seo_messages_id_seq TO authenticated, service_role;

-- 7. RLS: admin saja
ALTER TABLE public.seo_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin can manage seo settings" ON public.seo_settings;
DROP POLICY IF EXISTS "Admin can manage seo conversations" ON public.seo_conversations;
DROP POLICY IF EXISTS "Admin can manage seo messages" ON public.seo_messages;
DROP POLICY IF EXISTS "Admin can manage seo reports" ON public.seo_reports;
DROP POLICY IF EXISTS "Admin can manage seo cache" ON public.seo_cache;

CREATE POLICY "Admin can manage seo settings" ON public.seo_settings
FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Admin can manage seo conversations" ON public.seo_conversations
FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Admin can manage seo messages" ON public.seo_messages
FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Admin can manage seo reports" ON public.seo_reports
FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Admin can manage seo cache" ON public.seo_cache
FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
