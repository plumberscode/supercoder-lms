-- ============================================================
-- XP Recalculation Script for User "Citra"
-- ============================================================
-- Jalankan di Supabase SQL Editor
-- Script ini menghitung ulang XP berdasarkan submissions yang valid
-- ============================================================

-- STEP 1: Lihat data Citra saat ini
SELECT 
  id, 
  full_name, 
  email, 
  xp AS current_xp, 
  level AS current_level
FROM profiles 
WHERE full_name ILIKE '%citra%';

-- STEP 2: Lihat semua submissions Citra yang memberikan XP (score >= 70)
-- Setiap (content_id, type) hanya dihitung SEKALI
SELECT 
  p.full_name,
  s.content_id,
  s.type,
  s.score,
  CASE 
    WHEN s.type = 'code' THEN COALESCE(cc.max_score, 100)
    WHEN s.type = 'css' THEN COALESCE(cssc.max_score, 100)
    WHEN s.type = 'quiz' THEN 50
    WHEN s.type = 'project' THEN 100
    WHEN s.type = 'lesson' THEN 0
    ELSE 0
  END AS xp_should_be_awarded
FROM submissions s
JOIN profiles p ON s.student_id = p.id
LEFT JOIN coding_challenges cc ON cc.lesson_id = s.content_id AND s.type = 'code'
LEFT JOIN css_challenges cssc ON cssc.lesson_id = s.content_id AND s.type = 'css'
WHERE p.full_name ILIKE '%citra%'
  AND s.score >= 70
ORDER BY s.type, s.content_id;

-- STEP 3: Hitung total XP yang seharusnya
-- Gunakan DISTINCT ON untuk menghitung hanya satu kali per (content_id, type)
WITH correct_xp AS (
  SELECT DISTINCT ON (s.content_id, s.type)
    s.student_id,
    s.content_id,
    s.type,
    s.score,
    CASE 
      WHEN s.type = 'code' THEN COALESCE(cc.max_score, 100)
      WHEN s.type = 'css' THEN COALESCE(cssc.max_score, 100)
      WHEN s.type = 'quiz' THEN 50
      WHEN s.type = 'project' THEN 100
      WHEN s.type = 'lesson' THEN 0
      ELSE 0
    END AS xp_award
  FROM submissions s
  JOIN profiles p ON s.student_id = p.id
  LEFT JOIN coding_challenges cc ON cc.lesson_id = s.content_id AND s.type = 'code'
  LEFT JOIN css_challenges cssc ON cssc.lesson_id = s.content_id AND s.type = 'css'
  WHERE p.full_name ILIKE '%citra%'
    AND s.score >= 70
  ORDER BY s.content_id, s.type, s.score DESC
)
SELECT 
  p.full_name,
  p.xp AS current_xp,
  p.level AS current_level,
  COALESCE(SUM(cx.xp_award), 0) AS correct_xp,
  floor(1 + sqrt(COALESCE(SUM(cx.xp_award), 0) / 100))::integer AS correct_level,
  p.xp - COALESCE(SUM(cx.xp_award), 0) AS xp_difference
FROM profiles p
LEFT JOIN correct_xp cx ON cx.student_id = p.id
WHERE p.full_name ILIKE '%citra%'
GROUP BY p.id, p.full_name, p.xp, p.level;

-- STEP 4: UPDATE XP Citra ke nilai yang benar
-- ⚠️ UNCOMMENT BLOK DI BAWAH INI SETELAH MEMVERIFIKASI STEP 3
/*
WITH correct_xp AS (
  SELECT DISTINCT ON (s.content_id, s.type)
    s.student_id,
    CASE 
      WHEN s.type = 'code' THEN COALESCE(cc.max_score, 100)
      WHEN s.type = 'css' THEN COALESCE(cssc.max_score, 100)
      WHEN s.type = 'quiz' THEN 50
      WHEN s.type = 'project' THEN 100
      WHEN s.type = 'lesson' THEN 0
      ELSE 0
    END AS xp_award
  FROM submissions s
  JOIN profiles p ON s.student_id = p.id
  LEFT JOIN coding_challenges cc ON cc.lesson_id = s.content_id AND s.type = 'code'
  LEFT JOIN css_challenges cssc ON cssc.lesson_id = s.content_id AND s.type = 'css'
  WHERE p.full_name ILIKE '%citra%'
    AND s.score >= 70
  ORDER BY s.content_id, s.type, s.score DESC
),
total AS (
  SELECT 
    student_id,
    COALESCE(SUM(xp_award), 0) AS correct_xp
  FROM correct_xp
  GROUP BY student_id
)
UPDATE profiles
SET 
  xp = t.correct_xp,
  level = floor(1 + sqrt(t.correct_xp / 100))::integer
FROM total t
WHERE profiles.id = t.student_id;
*/
