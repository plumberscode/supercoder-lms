-- Migration: Student Registrations Table
-- 1. Create table
CREATE TABLE IF NOT EXISTS public.registrations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  student_name TEXT NOT NULL,
  address TEXT NOT NULL,
  whatsapp_number TEXT NOT NULL,
  email TEXT NOT NULL,
  selected_class TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'contacted', 'enrolled', 'cancelled'
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Grant permissions to PostgreSQL roles
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON TABLE public.registrations TO anon, authenticated, service_role;

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;

-- 4. Drop existing policies if already defined to avoid duplicate policy error
DROP POLICY IF EXISTS "Allow public insert to registrations" ON public.registrations;
DROP POLICY IF EXISTS "Allow admin and teacher to view registrations" ON public.registrations;
DROP POLICY IF EXISTS "Allow admin and teacher to update registrations" ON public.registrations;
DROP POLICY IF EXISTS "Allow admin and teacher to delete registrations" ON public.registrations;

-- 5. Create RLS Policies

-- Allow anyone (public / anonymous / authenticated) to submit registration forms
CREATE POLICY "Allow public insert to registrations" 
ON public.registrations 
FOR INSERT 
WITH CHECK (true);

-- Allow admins & teachers to view registrations
CREATE POLICY "Allow admin and teacher to view registrations" 
ON public.registrations 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'teacher')
  )
);

-- Allow admins & teachers to update registrations
CREATE POLICY "Allow admin and teacher to update registrations" 
ON public.registrations 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'teacher')
  )
);

-- Allow admins & teachers to delete registrations
CREATE POLICY "Allow admin and teacher to delete registrations" 
ON public.registrations 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'teacher')
  )
);
