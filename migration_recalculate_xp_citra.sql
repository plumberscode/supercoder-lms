-- ============================================================
-- XP Recalculation Script for User "Citra"
-- ============================================================
-- Langsung jalankan seluruh script ini (tekan Run / Ctrl+Enter)
-- ============================================================

WITH correct_xp AS (
  SELECT DISTINCT ON (s.student_id, s.content_id, s.type)
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
  ORDER BY s.student_id, s.content_id, s.type, s.score DESC
),
total AS (
  SELECT 
    student_id,
    COALESCE(SUM(xp_award), 0) AS correct_xp
  FROM correct_xp
  GROUP BY student_id
)
UPDATE profiles p
SET 
  xp = t.correct_xp,
  level = floor(1 + sqrt(t.correct_xp / 100))::integer
FROM total t
WHERE p.id = t.student_id
RETURNING 
  p.full_name, 
  p.email, 
  p.xp AS new_xp, 
  p.level AS new_level;
