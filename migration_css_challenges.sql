-- Migration: CSS Challenge Feature
-- Run this in Supabase SQL Editor

-- 1. Tambah 'css-challenge' ke lesson type constraint
ALTER TABLE lessons DROP CONSTRAINT IF EXISTS lessons_type_check;
ALTER TABLE lessons ADD CONSTRAINT lessons_type_check 
  CHECK (type IN ('pdf', 'link', 'video', 'text', 'code', 'css-challenge'));

-- 2. Tabel css_challenges
CREATE TABLE IF NOT EXISTS css_challenges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  starter_html TEXT DEFAULT '',
  starter_css TEXT DEFAULT '',
  reference_css TEXT DEFAULT '',
  max_score INTEGER DEFAULT 100,
  max_attempts INTEGER DEFAULT 3,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. RLS policies
ALTER TABLE css_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view css challenges" ON css_challenges FOR SELECT USING (true);
CREATE POLICY "Teachers can manage css challenges" ON css_challenges FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','teacher'))
);

-- 4. Tambah 'css' ke submissions type constraint  
ALTER TABLE submissions DROP CONSTRAINT IF EXISTS submissions_type_check;
ALTER TABLE submissions ADD CONSTRAINT submissions_type_check 
  CHECK (type IN ('quiz', 'project', 'lesson', 'code', 'css'));
