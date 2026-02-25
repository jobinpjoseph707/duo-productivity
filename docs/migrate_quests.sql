-- Migration script to add Daily Quests support to existing tables

-- Add priority to projects
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='priority') THEN
        ALTER TABLE projects ADD COLUMN priority INTEGER DEFAULT 0;
    END IF;
END $$;

-- Add planned_date to tasks
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='planned_date') THEN
        ALTER TABLE tasks ADD COLUMN planned_date DATE DEFAULT NULL;
    END IF;
END $$;
