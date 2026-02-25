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
SELECT
    'DuoProductivity App',
    'The productivity gamification mobile app',
    'jobin',
    (SELECT id FROM categories WHERE name = 'Main'),
    'active'
WHERE NOT EXISTS (
    SELECT 1 FROM projects WHERE name = 'DuoProductivity App'
);

-- Step 3: Seed sample tasks for the project
INSERT INTO tasks (project_id, title, description, status, assignee)
SELECT
    (SELECT id FROM projects WHERE name = 'DuoProductivity App'),
    'Set up authentication flow',
    'Implement login and registration with Supabase Auth',
    'completed',
    'jobin'
WHERE NOT EXISTS (
    SELECT 1 FROM tasks WHERE title = 'Set up authentication flow'
);

INSERT INTO tasks (project_id, title, description, status, assignee)
SELECT
    (SELECT id FROM projects WHERE name = 'DuoProductivity App'),
    'Build dashboard UI',
    'Create the main dashboard with XP, streaks, and time allocations',
    'in-progress',
    'jobin'
WHERE NOT EXISTS (
    SELECT 1 FROM tasks WHERE title = 'Build dashboard UI'
);

INSERT INTO tasks (project_id, title, description, status, assignee)
SELECT
    (SELECT id FROM projects WHERE name = 'DuoProductivity App'),
    'Implement work logging',
    'Add ability to log work and award XP',
    'todo',
    'jobin'
WHERE NOT EXISTS (
    SELECT 1 FROM tasks WHERE title = 'Implement work logging'
);

-- Step 4: Grant YOUR user access to the "Main" category
-- ⚠️  REPLACE 'YOUR_USER_ID_HERE' with your actual user UUID
--     Find it: Supabase Dashboard → Authentication → Users → copy the UUID
INSERT INTO user_category_access (user_id, category_id)
VALUES (
    'YOUR_USER_ID_HERE'::uuid,
    (SELECT id FROM categories WHERE name = 'Main')
)
ON CONFLICT (user_id, category_id) DO NOTHING;

-- Step 5: Create your user profile (if not auto-created by trigger)
-- ⚠️  REPLACE 'YOUR_USER_ID_HERE' with the same UUID
INSERT INTO user_profiles (id, display_name, total_xp, streak_count, level)
VALUES (
    'YOUR_USER_ID_HERE'::uuid,
    'Jobin',
    250,
    3,
    1
)
ON CONFLICT (id) DO UPDATE SET
    total_xp = 250,
    streak_count = 3,
    last_activity_date = CURRENT_DATE;

-- Step 6: Seed work log entries for the dashboard
-- ⚠️  REPLACE 'YOUR_USER_ID_HERE' with the same UUID
INSERT INTO work_logs (user_id, project_id, task_id, log_text, xp_awarded, created_at)
VALUES
    (
        'YOUR_USER_ID_HERE'::uuid,
        (SELECT id FROM projects WHERE name = 'DuoProductivity App'),
        (SELECT id FROM tasks WHERE title = 'Set up authentication flow'),
        'Implemented Supabase Auth with email/password login and registration',
        75,
        now() - interval '2 days'
    ),
    (
        'YOUR_USER_ID_HERE'::uuid,
        (SELECT id FROM projects WHERE name = 'DuoProductivity App'),
        (SELECT id FROM tasks WHERE title = 'Set up authentication flow'),
        'Added JWT token refresh and session persistence',
        50,
        now() - interval '1 day 18 hours'
    ),
    (
        'YOUR_USER_ID_HERE'::uuid,
        (SELECT id FROM projects WHERE name = 'DuoProductivity App'),
        (SELECT id FROM tasks WHERE title = 'Build dashboard UI'),
        'Created dashboard layout with stats cards and XP progress',
        60,
        now() - interval '1 day'
    ),
    (
        'YOUR_USER_ID_HERE'::uuid,
        (SELECT id FROM projects WHERE name = 'DuoProductivity App'),
        (SELECT id FROM tasks WHERE title = 'Build dashboard UI'),
        'Fixed broken component styling — migrated from Tailwind to StyleSheet',
        40,
        now() - interval '6 hours'
    ),
    (
        'YOUR_USER_ID_HERE'::uuid,
        (SELECT id FROM projects WHERE name = 'DuoProductivity App'),
        NULL,
        'Reviewed project architecture and planned gamification features',
        25,
        now() - interval '3 hours'
    );

-- Step 7: Seed a time allocation for today
-- ⚠️  REPLACE 'YOUR_USER_ID_HERE' with the same UUID
INSERT INTO time_allocations (user_id, category_name, allocated_minutes, spent_minutes, date)
VALUES
    (
        'YOUR_USER_ID_HERE'::uuid,
        'Main',
        120,
        45,
        CURRENT_DATE
    )
ON CONFLICT DO NOTHING;
