-- ============================================================
-- DuoProductivity — Enable RLS on Projects & Tasks
-- Run AFTER setup_database.sql and seed_data.sql
-- 
-- This restricts project/task visibility to only categories
-- the user has been granted access to via user_category_access.
-- ============================================================

-- 1. Enable RLS on projects table
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- 2. Enable RLS on tasks table
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- 3. Enable RLS on categories table
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- 4. Category-based read access for projects
CREATE POLICY "Users read projects by category access" ON projects
FOR SELECT
USING (
    category_id IN (
        SELECT category_id FROM user_category_access
        WHERE user_id = auth.uid()
    )
);

-- 5. Category-based update access for projects
CREATE POLICY "Users update projects by category access" ON projects
FOR UPDATE
USING (
    category_id IN (
        SELECT category_id FROM user_category_access
        WHERE user_id = auth.uid()
    )
);

-- 6. Task read access inherited from project's category
CREATE POLICY "Users read tasks via project category" ON tasks
FOR SELECT
USING (
    project_id IN (
        SELECT id FROM projects WHERE category_id IN (
            SELECT category_id FROM user_category_access
            WHERE user_id = auth.uid()
        )
    )
);

-- 7. Task update access inherited from project's category
CREATE POLICY "Users update tasks via project category" ON tasks
FOR UPDATE
USING (
    project_id IN (
        SELECT id FROM projects WHERE category_id IN (
            SELECT category_id FROM user_category_access
            WHERE user_id = auth.uid()
        )
    )
);

-- 8. Categories — users can only see categories they have access to
CREATE POLICY "Users read accessible categories" ON categories
FOR SELECT
USING (
    id IN (
        SELECT category_id FROM user_category_access
        WHERE user_id = auth.uid()
    )
);

-- ============================================================
-- Done! Now only projects/tasks in categories the user has
-- been granted access to will be visible.
-- ============================================================
