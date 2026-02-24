-- ============================================================
-- DuoProductivity — Seed Data
-- Run AFTER setup_database.sql
-- 
-- IMPORTANT: Replace YOUR_USER_ID_HERE with your actual Supabase
-- user UUID. Find it in Supabase Dashboard → Authentication → Users
-- ============================================================

-- Step 1: Create the "Main" category
INSERT INTO categories (id, name, color, sort_order)
VALUES (
    gen_random_uuid(),
    'Main',
    '#6366f1',
    1
)
ON CONFLICT (name) DO NOTHING;

-- Step 2: Seed a sample project under "Main"
INSERT INTO projects (name, description, owner, category_id, status)
VALUES (
    'DuoProductivity App',
    'The productivity gamification mobile app',
    'jobin',
    (SELECT id FROM categories WHERE name = 'Main'),
    'active'
);

-- Step 3: Seed sample tasks for the project
INSERT INTO tasks (project_id, title, description, status, assignee)
VALUES
    (
        (SELECT id FROM projects WHERE name = 'DuoProductivity App'),
        'Set up authentication flow',
        'Implement login and registration with Supabase Auth',
        'completed',
        'jobin'
    ),
    (
        (SELECT id FROM projects WHERE name = 'DuoProductivity App'),
        'Build dashboard UI',
        'Create the main dashboard with XP, streaks, and time allocations',
        'in-progress',
        'jobin'
    ),
    (
        (SELECT id FROM projects WHERE name = 'DuoProductivity App'),
        'Implement work logging',
        'Add ability to log work and award XP',
        'todo',
        'jobin'
    );

-- Step 4: Grant YOUR user access to the "Main" category
-- ⚠️  REPLACE 'YOUR_USER_ID_HERE' with your actual user UUID
--     Find it: Supabase Dashboard → Authentication → Users → copy the UUID
INSERT INTO user_category_access (user_id, category_id)
VALUES (
    'YOUR_USER_ID_HERE'::uuid,
    (SELECT id FROM categories WHERE name = 'Main')
);

-- Step 5: Create your user profile (if not auto-created by trigger)
-- ⚠️  REPLACE 'YOUR_USER_ID_HERE' with the same UUID
INSERT INTO user_profiles (id, display_name, total_xp, streak_count, level)
VALUES (
    'YOUR_USER_ID_HERE'::uuid,
    'Jobin',
    0,
    0,
    1
)
ON CONFLICT (id) DO NOTHING;
