
-- Migration for Question Bank and Dynamic Quizzes

-- 1. Create Question Bank Table
CREATE TABLE IF NOT EXISTS question_bank (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  question_text TEXT NOT NULL,
  options JSONB NOT NULL, -- Array of strings: ["Option A", "Option B", ...]
  correct_option_index INTEGER NOT NULL,
  points INTEGER DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Update Quizzes Table to support Dynamic Logic
ALTER TABLE quizzes 
ADD COLUMN IF NOT EXISTS is_dynamic BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS target_category TEXT,
ADD COLUMN IF NOT EXISTS question_count INTEGER DEFAULT 10;

-- 3. Enable RLS for Question Bank
ALTER TABLE question_bank ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins/Teachers can manage question bank" 
ON question_bank 
FOR ALL 
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher'))
);

CREATE POLICY "Students can view questions (filtered by quiz logic)" 
ON question_bank 
FOR SELECT 
USING (true); -- Usually students don't browse the bank directly, but need select access for the quiz runner.
