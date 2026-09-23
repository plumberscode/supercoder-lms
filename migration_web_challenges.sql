-- Migration: "Soal Coding Web" (HTML+CSS+JS) Feature
-- Jalankan di Supabase SQL Editor.
--
-- Diverifikasi 2026-09-20 terhadap constraint live di Supabase Dashboard:
--   lessons_type_check (live):     ('pdf','link','video','text','code','css-challenge')
--   submissions_type_check (live): ('quiz','project','lesson','code','css')
-- 'quiz' dan 'project' TIDAK ADA di lessons_type_check live — artinya lesson baru
-- bertipe quiz/project seharusnya gagal disimpan dengan constraint violation di
-- production saat ini (bug pre-existing, di luar scope fitur ini), meskipun
-- LessonForm.tsx/ModuleList.tsx aktif menawarkan opsi tersebut. Atas persetujuan
-- eksplisit, constraint di bawah ini SEKALIGUS menambahkan kembali 'quiz' dan
-- 'project' (memperbaiki bug itu) selain menambah 'web-challenge' untuk fitur baru.

-- 1. Constraint lengkap untuk lessons.type (live + project & quiz yang hilang + kategori baru)
ALTER TABLE lessons DROP CONSTRAINT IF EXISTS lessons_type_check;
ALTER TABLE lessons ADD CONSTRAINT lessons_type_check
  CHECK (type IN ('text', 'video', 'pdf', 'link', 'project', 'quiz', 'code', 'css-challenge', 'web-challenge'));

-- 2. Tabel web_challenges — 1:1 dengan lessons, mirror css_challenges + mode + kolom JS
CREATE TABLE IF NOT EXISTS web_challenges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  mode TEXT NOT NULL DEFAULT 'html-css-js'
    CHECK (mode IN ('html', 'html-css', 'html-css-js')),
  starter_html TEXT DEFAULT '',
  starter_css TEXT DEFAULT '',
  starter_js TEXT DEFAULT '',
  reference_html TEXT DEFAULT '',
  reference_css TEXT DEFAULT '',
  reference_js TEXT DEFAULT '',
  max_score INTEGER DEFAULT 100,
  max_attempts INTEGER DEFAULT 3,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. RLS policies (identik dengan css_challenges)
ALTER TABLE web_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view web challenges" ON web_challenges FOR SELECT USING (true);
CREATE POLICY "Teachers can manage web challenges" ON web_challenges FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','teacher'))
);

-- 4. Constraint lengkap untuk submissions.type
ALTER TABLE submissions DROP CONSTRAINT IF EXISTS submissions_type_check;
ALTER TABLE submissions ADD CONSTRAINT submissions_type_check
  CHECK (type IN ('quiz', 'project', 'lesson', 'code', 'css', 'web'));
