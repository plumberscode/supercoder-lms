-- Migration: HTML/DOM IDE Mode
-- Run this in Supabase SQL Editor AFTER the coding challenges migration

-- Add starter_html column for HTML+JS challenges
ALTER TABLE coding_challenges ADD COLUMN IF NOT EXISTS starter_html TEXT DEFAULT '';
