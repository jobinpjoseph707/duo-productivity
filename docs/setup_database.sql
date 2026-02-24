-- ============================================================
-- DuoProductivity — Full Database Setup Script
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ============================================================

-- 1. CATEGORIES (if not already existing)
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    color TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. PROJECTS (if not already existing)
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    owner TEXT NOT NULL,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    target_path TEXT,
    staging_repo TEXT,
    vercel_deployed_link TEXT,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ
);

-- 3. TASKS (if not already existing)
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'todo',
    assignee TEXT,
    due_date TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ
);

-- 4. USER PROFILES — gamification data
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT,
    avatar_url TEXT,
    total_xp INTEGER DEFAULT 0,
    streak_count INTEGER DEFAULT 0,
    last_activity_date DATE,
    level INTEGER DEFAULT 1,
    streak_frozen BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own profile" ON user_profiles
FOR ALL USING (id = auth.uid());

-- 5. USER CATEGORY ACCESS — maps users to categories
CREATE TABLE IF NOT EXISTS user_category_access (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    granted_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (user_id, category_id)
);

ALTER TABLE user_category_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own access" ON user_category_access
FOR SELECT USING (user_id = auth.uid());

-- 6. TIME ALLOCATIONS — daily time buckets per category
CREATE TABLE IF NOT EXISTS time_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    category_name TEXT NOT NULL,
    allocated_minutes INTEGER NOT NULL,
    spent_minutes INTEGER DEFAULT 0,
    date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE time_allocations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own allocations" ON time_allocations
FOR ALL USING (user_id = auth.uid());

-- 7. WORK LOGS — ledger of all work updates
CREATE TABLE IF NOT EXISTS work_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
    log_text TEXT NOT NULL,
    xp_awarded INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE work_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own logs" ON work_logs
FOR ALL USING (user_id = auth.uid());

-- 8. AUTO-CREATE PROFILE ON SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, display_name)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'display_name');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if it already exists, then re-create
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- Done! All tables, RLS policies, and triggers are set up.
-- ============================================================
