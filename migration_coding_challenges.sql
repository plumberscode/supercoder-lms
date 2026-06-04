-- Migration: Coding Challenges Feature
-- Run this in Supabase SQL Editor

-- 1. Add 'code' to lesson type constraint
ALTER TABLE lessons DROP CONSTRAINT IF EXISTS lessons_type_check;
ALTER TABLE lessons ADD CONSTRAINT lessons_type_check 
  CHECK (type IN ('pdf', 'link', 'video', 'text', 'code'));

-- 2. Coding challenges table
CREATE TABLE IF NOT EXISTS coding_challenges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'python',
  starter_code TEXT DEFAULT '',
  solution_code TEXT DEFAULT '',
  hints JSONB DEFAULT '[]',
  max_score INTEGER DEFAULT 100,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Test cases table
CREATE TABLE IF NOT EXISTS test_cases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_id UUID REFERENCES coding_challenges(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  input TEXT DEFAULT '',
  expected_output TEXT NOT NULL,
  is_hidden BOOLEAN DEFAULT false,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Add 'code' to submissions type constraint
ALTER TABLE submissions DROP CONSTRAINT IF EXISTS submissions_type_check;
ALTER TABLE submissions ADD CONSTRAINT submissions_type_check 
  CHECK (type IN ('quiz', 'project', 'lesson', 'code'));

-- 5. RLS policies
ALTER TABLE coding_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_cases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view challenges" ON coding_challenges FOR SELECT USING (true);
CREATE POLICY "Admins can manage challenges" ON coding_challenges FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','teacher'))
);

CREATE POLICY "View test cases" ON test_cases FOR SELECT USING (
  NOT is_hidden OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','teacher'))
);
CREATE POLICY "Admins can manage test cases" ON test_cases FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','teacher'))
);
