-- ==========================================
-- Migration: Student Testimonials Table
-- ==========================================

-- 1. Create table for testimonials
CREATE TABLE IF NOT EXISTS public.testimonials (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  student_name TEXT NOT NULL,
  student_email TEXT,
  what_learned TEXT NOT NULL,
  learning_process TEXT NOT NULL,
  motivation TEXT NOT NULL,
  improvement_suggestions TEXT NOT NULL,
  overall_impression TEXT NOT NULL,
  rating INTEGER DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Grant permissions to PostgreSQL roles
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON TABLE public.testimonials TO anon, authenticated, service_role;

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

-- 4. Drop existing policies if already defined
DROP POLICY IF EXISTS "Allow authenticated students to insert testimonials" ON public.testimonials;
DROP POLICY IF EXISTS "Allow students to view their own testimonials" ON public.testimonials;
DROP POLICY IF EXISTS "Allow admin and teacher to view all testimonials" ON public.testimonials;
DROP POLICY IF EXISTS "Allow admin and teacher to delete testimonials" ON public.testimonials;

-- 5. Create RLS Policies

-- Allow authenticated students to submit testimonials
CREATE POLICY "Allow authenticated students to insert testimonials" 
ON public.testimonials 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = student_id);

-- Allow students to view their own testimonials
CREATE POLICY "Allow students to view their own testimonials" 
ON public.testimonials 
FOR SELECT 
TO authenticated 
USING (auth.uid() = student_id);

-- Allow admins & teachers to view all testimonials
CREATE POLICY "Allow admin and teacher to view all testimonials" 
ON public.testimonials 
FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'teacher')
  )
);

-- Allow admins & teachers to delete testimonials
CREATE POLICY "Allow admin and teacher to delete testimonials" 
ON public.testimonials 
FOR DELETE 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'teacher')
  )
);
