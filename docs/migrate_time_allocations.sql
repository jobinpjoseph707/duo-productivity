-- 1. Add routine_id to work_logs
ALTER TABLE work_logs ADD COLUMN IF NOT EXISTS routine_id UUID REFERENCES routines(id) ON DELETE SET NULL;

-- 2. Drop the redundant time_allocations table
DROP TABLE IF EXISTS time_allocations CASCADE;

-- 3. Update increment_spent_minutes RPC (which used time_allocations) to either be dropped or do nothing
DROP FUNCTION IF EXISTS increment_spent_minutes(UUID, DATE, INTEGER, TEXT);
