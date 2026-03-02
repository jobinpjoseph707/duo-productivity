-- ============================================================
-- DuoProductivity — Notifications Table Setup Script
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ============================================================

-- NOTIFICATIONS — In-app notification feed
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,         -- e.g. 'routine_start', 'streak_warning', 'level_up'
    title TEXT NOT NULL,        -- e.g. 'Time for Reading!'
    message TEXT NOT NULL,      -- e.g. 'Your Reading routine has started.'
    is_read BOOLEAN DEFAULT false,
    external_id TEXT,           -- Optional: To prevent duplicate logs for the same local notification trigger
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own notifications" ON notifications
FOR ALL USING (user_id = auth.uid());

-- Optional: Index to speed up fetching user's feed
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
-- Optional: Index on unread status for badge count
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read);

-- ============================================================
-- Done! The notifications table and RLS policies are set up.
-- ============================================================
