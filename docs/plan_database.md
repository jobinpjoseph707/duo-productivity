# Database Plan: Supabase (Shared with TouchFlow)

## Strategy
Use the **same Supabase instance** as TouchFlow. The existing `projects`, `tasks`, and `categories` tables are reused as-is. We only **add new tables** for gamification and access control.

---

## Existing Tables (TouchFlow — No Changes)

```sql
-- Already exists
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    color TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE projects (
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

CREATE TABLE tasks (
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
```

---

## New Tables (DuoProductivity Extensions)

### 1. `user_category_access`
Maps users to the categories they can see.

```sql
CREATE TABLE user_category_access (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    granted_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (user_id, category_id)
);

ALTER TABLE user_category_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own access" ON user_category_access
FOR SELECT USING (user_id = auth.uid());
```

### 2. `user_profiles`
Extended profile for gamification data.

```sql
CREATE TABLE user_profiles (
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
```

### 3. `time_allocations`
Daily time "buckets" per category.

```sql
CREATE TABLE time_allocations (
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
```

### 4. `work_logs`
Ledger of all work updates (manual + AI agent).

```sql
CREATE TABLE work_logs (
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
```

---

## RLS Policies for Existing Tables

> [!IMPORTANT]
> These policies must be added carefully so they don't break the existing TouchFlow Node.js app. TouchFlow uses the **service_role key** (which bypasses RLS), so these policies only affect the new .NET Core API using the **anon key** with user JWTs.

### Projects — Category-based Access
```sql
-- Drop existing permissive policy first (if needed)
-- DROP POLICY IF EXISTS "Allow all for projects" ON projects;

CREATE POLICY "DuoProd: category-based read" ON projects
FOR SELECT
USING (
    category_id IN (
        SELECT category_id FROM user_category_access
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "DuoProd: category-based update" ON projects
FOR UPDATE
USING (
    category_id IN (
        SELECT category_id FROM user_category_access
        WHERE user_id = auth.uid()
    )
);
```

### Tasks — Inherit from Project Access
```sql
CREATE POLICY "DuoProd: task read via project" ON tasks
FOR SELECT
USING (
    project_id IN (
        SELECT id FROM projects WHERE category_id IN (
            SELECT category_id FROM user_category_access
            WHERE user_id = auth.uid()
        )
    )
);
```

---

## Supabase Auth Setup

### 1. Enable Email/Password Auth
In Supabase Dashboard → Authentication → Providers → Enable **Email**.

### 2. Create a Trigger for Auto Profile Creation
```sql
-- Auto-create user_profiles row on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, display_name)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'display_name');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### 3. Seed Initial Category Access (Admin Task)
```sql
-- Grant user access to specific categories
INSERT INTO user_category_access (user_id, category_id)
VALUES
    ('user-uuid-here', 'category-uuid-here');
```

---

## Migration Order

Run these SQL scripts in this order in the Supabase SQL Editor:

1. `user_profiles` table + RLS
2. `user_category_access` table + RLS
3. `time_allocations` table + RLS
4. `work_logs` table + RLS
5. RLS policies for `projects` and `tasks`
6. Auth trigger for auto profile creation

> [!WARNING]
> Before adding restrictive RLS policies on `projects` and `tasks`, ensure the TouchFlow app uses the **service_role key** (which bypasses RLS). Verify this in the TouchFlow `.env` file to avoid breaking existing functionality.
