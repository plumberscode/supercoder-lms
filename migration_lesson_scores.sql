-- Migration: Update submissions table to allow 'lesson' type for offline grading

-- Drop the existing check constraint
ALTER TABLE submissions DROP CONSTRAINT IF EXISTS submissions_type_check;

-- Add the new check constraint that includes 'lesson'
ALTER TABLE submissions ADD CONSTRAINT submissions_type_check CHECK (type IN ('quiz', 'project', 'lesson'));
