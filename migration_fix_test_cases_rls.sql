-- Fix: Allow all authenticated users to view ALL test cases (including hidden)
-- Hidden test cases are only hidden in the UI, not at database level
-- This is needed because grading runs client-side and requires all test cases

-- Drop the restrictive policy
DROP POLICY IF EXISTS "View test cases" ON test_cases;

-- Create permissive policy: all authenticated users can view all test cases
CREATE POLICY "Anyone can view test cases" ON test_cases FOR SELECT USING (true);
