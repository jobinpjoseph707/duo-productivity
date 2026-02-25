import { Request, Response, Router } from 'express';
import { GamificationEngine } from '../services/gamificationEngine';
import { supabaseAdmin } from '../services/supabaseClient';

const router = Router();

/** Get today's date as YYYY-MM-DD in the server's local timezone (not UTC). */
function getLocalDateString(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

/**
 * GET /api/productivity/dashboard
 * Returns XP, streak, level, time allocations, and recent logs.
 */
router.get('/dashboard', async (req: Request, res: Response) => {
    try {
        const userId = req.userId!;

        // Use supabaseAdmin to bypass RLS for profile/allocations/logs
        const [profileResult, allocationsResult, logsResult] = await Promise.all([
            supabaseAdmin
                .from('user_profiles')
                .select('*')
                .eq('id', userId)
                .single(),
            supabaseAdmin
                .from('time_allocations')
                .select('*')
                .eq('user_id', userId)
                .eq('date', getLocalDateString()),
            supabaseAdmin
                .from('work_logs')
                .select('id, log_text, xp_awarded, created_at')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(10),
        ]);

        const profile = profileResult.data;
        const allocations = allocationsResult.data || [];
        const recentLogs = logsResult.data || [];

        // If no profile yet, return defaults
        const levelProgress = GamificationEngine.levelProgress(profile?.total_xp || 0);

        res.json({
            totalXP: profile?.total_xp || 0,
            level: levelProgress.level,
            levelProgress: levelProgress.progress,
            xpForNextLevel: levelProgress.nextLevelXP,
            streak: profile?.streak_count || 0,
            streakFrozen: profile?.streak_frozen || false,
            timeAllocations: allocations.map((a: any) => ({
                categoryName: a.category_name,
                allocatedMinutes: a.allocated_minutes,
                spentMinutes: a.spent_minutes,
            })),
            recentLogs: recentLogs.map((l: any) => ({
                id: l.id,
                logText: l.log_text,
                xpAwarded: l.xp_awarded,
                createdAt: l.created_at,
            })),
        });
    } catch (error: any) {
        console.error('Error fetching dashboard:', error.message);
        res.status(500).json({ error: 'Failed to fetch dashboard' });
    }
});

/**
 * GET /api/productivity/path
 * Returns tasks from all user-accessible projects for the Duolingo-style path.
 */
router.get('/path', async (req: Request, res: Response) => {
    try {
        const userId = req.userId!;

        // Get user's accessible categories
        const { data: accessData } = await supabaseAdmin
            .from('user_category_access')
            .select('category_id')
            .eq('user_id', userId);

        const categoryIds = (accessData || []).map((r: any) => r.category_id);
        if (categoryIds.length === 0) {
            res.json([]);
            return;
        }

        // Get active projects in those categories
        const { data: projects } = await supabaseAdmin
            .from('projects')
            .select('id, name, status')
            .in('category_id', categoryIds)
            .in('status', ['active', 'in-progress']);

        if (!projects || projects.length === 0) {
            res.json([]);
            return;
        }

        const projectIds = projects.map((p: any) => p.id);

        // Get tasks for all those projects
        const { data: tasks } = await supabaseAdmin
            .from('tasks')
            .select('id, project_id, title, status, created_at')
            .in('project_id', projectIds)
            .order('created_at', { ascending: true });

        // Get latest work_log per project to sort by most recent activity
        const { data: recentLogs } = await supabaseAdmin
            .from('work_logs')
            .select('project_id, created_at')
            .in('project_id', projectIds)
            .order('created_at', { ascending: false });

        // Build a map of project_id -> latest log timestamp
        const lastActivityMap: Record<string, string> = {};
        for (const log of (recentLogs || [])) {
            if (log.project_id && !lastActivityMap[log.project_id]) {
                lastActivityMap[log.project_id] = log.created_at;
            }
        }

        // Sort projects: most recently logged first, then by name
        const sortedProjects = [...projects].sort((a: any, b: any) => {
            const aTime = lastActivityMap[a.id] || '';
            const bTime = lastActivityMap[b.id] || '';
            if (bTime && !aTime) return 1;
            if (aTime && !bTime) return -1;
            if (aTime && bTime) return bTime.localeCompare(aTime);
            return a.name.localeCompare(b.name);
        });

        // Group tasks by project
        const pathGroups = sortedProjects.map((project: any) => {
            const projectTasks = (tasks || []).filter((t: any) => t.project_id === project.id);
            return {
                projectId: project.id,
                projectName: project.name,
                tasks: projectTasks.map((t: any, idx: number) => ({
                    id: t.id,
                    title: t.title,
                    status: t.status,
                    nodeNumber: idx + 1,
                })),
            };
        }).filter((g: any) => g.tasks.length > 0);

        res.json(pathGroups);
    } catch (error: any) {
        console.error('Error fetching path:', error.message);
        res.status(500).json({ error: 'Failed to fetch path' });
    }
});

/**
 * POST /api/productivity/log
 * Log work, award XP, update streak.
 */
router.post('/log', async (req: Request, res: Response) => {
    try {
        const userId = req.userId!;
        const { projectId, taskId, logText, timeSpentMinutes, categoryName } = req.body;

        if (!logText) {
            res.status(400).json({ error: 'logText is required' });
            return;
        }

        // Get current profile for XP/streak calculation
        const { data: profile } = await supabaseAdmin
            .from('user_profiles')
            .select('*')
            .eq('id', userId)
            .single();

        const currentXP = profile?.total_xp || 0;
        const currentStreak = profile?.streak_count || 0;
        const lastActivity = profile?.last_activity_date || null;

        // Calculate streak
        const streakResult = GamificationEngine.evaluateStreak(lastActivity, currentStreak);

        // Calculate XP
        const xpCalc = GamificationEngine.calculateWorkLogXP(!!taskId, streakResult.streakCount);
        const xpResult = GamificationEngine.awardXP(currentXP, xpCalc.total);

        // Insert work log
        const { data: workLog, error: logError } = await supabaseAdmin
            .from('work_logs')
            .insert({
                user_id: userId,
                project_id: projectId || null,
                task_id: taskId || null,
                log_text: logText,
                xp_awarded: xpCalc.total,
            })
            .select()
            .single();

        if (logError) throw logError;

        // Update user profile with new XP, streak, level
        const { error: profileError } = await supabaseAdmin
            .from('user_profiles')
            .upsert({
                id: userId,
                total_xp: xpResult.newTotalXP,
                level: xpResult.newLevel,
                streak_count: streakResult.streakCount,
                last_activity_date: getLocalDateString(),
            });

        if (profileError) throw profileError;

        // If time tracking, update spent_minutes on allocations
        if (timeSpentMinutes && categoryName) {
            const today = getLocalDateString();
            try {
                const { error: rpcError } = await supabaseAdmin.rpc('increment_spent_minutes', {
                    p_user_id: userId,
                    p_date: today,
                    p_minutes: timeSpentMinutes,
                    p_category_name: categoryName,
                });
                if (rpcError) {
                    console.warn('increment_spent_minutes RPC not available:', rpcError.message);
                }
            } catch (e: any) {
                console.warn('increment_spent_minutes RPC not available:', e.message);
            }
        }

        res.json({
            workLog: {
                id: workLog.id,
                logText: workLog.log_text,
                xpAwarded: workLog.xp_awarded,
                createdAt: workLog.created_at,
            },
            xp: {
                awarded: xpCalc.total,
                baseXP: xpCalc.baseXP,
                streakBonus: xpCalc.streakBonus,
                totalXP: xpResult.newTotalXP,
                level: xpResult.newLevel,
                leveledUp: xpResult.leveledUp,
            },
            streak: streakResult,
        });
    } catch (error: any) {
        console.error('Error logging work:', error.message);
        res.status(500).json({ error: 'Failed to log work' });
    }
});

/**
 * POST /api/productivity/allocations
 * Set or update today's time allocation for a category.
 */
router.post('/allocations', async (req: Request, res: Response) => {
    try {
        const userId = req.userId!;
        const { categoryName, allocatedMinutes } = req.body;

        if (!categoryName || allocatedMinutes === undefined) {
            res.status(400).json({ error: 'categoryName and allocatedMinutes are required' });
            return;
        }

        const today = getLocalDateString();

        // Upsert: update if exists for today, insert if not
        const { data: existing } = await supabaseAdmin
            .from('time_allocations')
            .select('id')
            .eq('user_id', userId)
            .eq('category_name', categoryName)
            .eq('date', today)
            .single();

        let result;
        if (existing) {
            result = await supabaseAdmin
                .from('time_allocations')
                .update({ allocated_minutes: allocatedMinutes })
                .eq('id', existing.id)
                .select()
                .single();
        } else {
            result = await supabaseAdmin
                .from('time_allocations')
                .insert({
                    user_id: userId,
                    category_name: categoryName,
                    allocated_minutes: allocatedMinutes,
                    date: today,
                })
                .select()
                .single();
        }

        if (result.error) throw result.error;
        res.json(result.data);
    } catch (error: any) {
        console.error('Error updating allocation:', error.message);
        res.status(500).json({ error: 'Failed to update time allocation' });
    }
});

/**
 * GET /api/productivity/profile
 * Get the user's gamification profile.
 */
router.get('/profile', async (req: Request, res: Response) => {
    try {
        const userId = req.userId!;

        const { data, error } = await supabaseAdmin
            .from('user_profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows

        if (!data) {
            // Return defaults if profile doesn't exist yet
            res.json({
                id: userId,
                display_name: null,
                avatar_url: null,
                total_xp: 0,
                streak_count: 0,
                last_activity_date: null,
                level: 1,
                streak_frozen: false,
            });
            return;
        }

        res.json(data);
    } catch (error: any) {
        console.error('Error fetching profile:', error.message);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});

/**
 * GET /api/productivity/logs
 * Get work logs for current user. ?limit=N to control count.
 */
router.get('/logs', async (req: Request, res: Response) => {
    try {
        const userId = req.userId!;
        const limit = parseInt(req.query.limit as string) || 10;

        const { data, error } = await supabaseAdmin
            .from('work_logs')
            .select('id, project_id, task_id, log_text, xp_awarded, created_at')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) throw error;

        // Map to camelCase to match frontend expectations
        const mapped = (data || []).map((l: any) => ({
            id: l.id,
            projectId: l.project_id,
            taskId: l.task_id,
            logText: l.log_text,
            xpAwarded: l.xp_awarded,
            createdAt: l.created_at,
        }));

        res.json(mapped);
    } catch (error: any) {
        console.error('Error fetching work logs:', error.message);
        res.status(500).json({ error: 'Failed to fetch work logs' });
    }
});

export default router;
