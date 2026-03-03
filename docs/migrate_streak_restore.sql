-- ============================================================
-- Migration: Add Streak Restoration Support
-- ============================================================

-- 1. Add the column to store the lost streak
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS last_streak_count INTEGER DEFAULT 0;

-- 2. Migrate existing users whose streak is already broken
--    If last_activity_date is older than yesterday, the streak is broken.
--    We move their current streak_count to last_streak_count, and set streak_count to 0.

UPDATE user_profiles
SET 
    last_streak_count = streak_count,
    streak_count = 0
WHERE 
    streak_count > 0 
    AND last_activity_date IS NOT NULL
    AND last_activity_date < (CURRENT_DATE - INTERVAL '1 day')::date;

-- Done! User streaks that were broken but still displaying their old values are now correctly flagged as lost/restorable.
