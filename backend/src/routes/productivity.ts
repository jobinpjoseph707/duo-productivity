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

        // Use supabaseAdmin to bypass RLS for profile/routines/logs
        const [profileResult, routinesResult, logsResult] = await Promise.all([
            supabaseAdmin
                .from('user_profiles')
                .select('*')
                .eq('id', userId)
                .single(),
            supabaseAdmin
                .from('routines')
                .select('*')
                .eq('user_id', userId)
                .eq('is_active', true),
            supabaseAdmin
                .from('work_logs')
                .select('id, log_text, xp_awarded, created_at, routine_id')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(50), // grab more to aggregate today's time accurately
        ]);

        const profile = profileResult.data;
        const routines = routinesResult.data || [];
        const recentLogs = logsResult.data || [];

        // Aggregate today's time spent per routine
        const todayStr = getLocalDateString();
        const spentMinutesMap: Record<string, number> = {};
        for (const log of recentLogs) {
            // only count logs from today
            if (log.created_at.startsWith(todayStr) && log.routine_id) {
                // Approximate time spent from logs (if we eventually store duration in logs, use that)
                // For now, let's assume each log without explicit time is 30 mins, or read from a future `duration_minutes` column if added.
                // We will add `duration_minutes` to work_logs in the future, for now mock it to 30.
                spentMinutesMap[log.routine_id] = (spentMinutesMap[log.routine_id] || 0) + 30;
            }
        }

        const timeAllocations = routines.map((r: any) => {
            // Calculate allocated time from start_time to end_time
            const startStr = r.start_time; // "09:00:00"
            const endStr = r.end_time;     // "10:30:00"

            let allocatedMinutes = 0;
            if (startStr && endStr) {
                const [sh, sm] = startStr.split(':').map(Number);
                const [eh, em] = endStr.split(':').map(Number);
                allocatedMinutes = (eh * 60 + (em || 0)) - (sh * 60 + (sm || 0));

                // Handle midnight wraparound (e.g. 23:00 to 01:00)
                if (allocatedMinutes < 0) {
                    allocatedMinutes += 24 * 60;
                }
            }

            return {
                id: r.id,
                categoryName: r.title,
                color: r.color,
                allocatedMinutes: allocatedMinutes > 0 ? allocatedMinutes : 60,
                spentMinutes: spentMinutesMap[r.id] || 0,
            };
        });

        // If no profile yet, return defaults
        const levelProgress = GamificationEngine.levelProgress(profile?.total_xp || 0);

        res.json({
            totalXP: profile?.total_xp || 0,
            level: levelProgress.level,
            levelProgress: levelProgress.progress,
            xpForNextLevel: levelProgress.nextLevelXP,
            streak: profile?.streak_count || 0,
            streakFrozen: profile?.streak_frozen || false,
            timeAllocations: timeAllocations,
            recentLogs: recentLogs.slice(0, 10).map((l: any) => ({
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
 * GET /api/productivity/daily-quests
 * Returns tasks planned for today, or suggestions based on priority.
 */
router.get('/daily-quests', async (req: Request, res: Response) => {
    try {
        const userId = req.userId!;
        const today = getLocalDateString();
        console.log(`[DailyQuests] Fetching for user ${userId}, today=${today}`);

        // 1. Get user's accessible categories
        const { data: accessData } = await supabaseAdmin
            .from('user_category_access')
            .select('category_id')
            .eq('user_id', userId);

        const categoryIds = (accessData || []).map((r: any) => r.category_id);
        if (categoryIds.length === 0) {
            console.log(`[DailyQuests] No categories found for user ${userId}`);
            res.json([]);
            return;
        }

        // 2. Get planned tasks for today
        const { data: plannedTasks } = await supabaseAdmin
            .from('tasks')
            .select('*, projects!inner(name, priority)')
            .eq('planned_date', today)
            .in('projects.category_id', categoryIds)
            .neq('status', 'completed');

        console.log(`[DailyQuests] Found ${plannedTasks?.length || 0} planned tasks for ${today}`);

        let results = (plannedTasks || []).map((t: any) => ({
            id: t.id,
            title: t.title,
            projectId: t.project_id,
            projectName: t.projects.name,
            status: t.status,
            isPlanned: true,
            priority: t.projects.priority || 0
        }));

        // 3. If fewer than 3, suggest some from priority projects
        if (results.length < 3) {
            const { data: suggestions } = await supabaseAdmin
                .from('tasks')
                .select('*, projects!inner(name, priority)')
                .in('projects.category_id', categoryIds)
                .neq('status', 'completed')
                .is('planned_date', null)
                .order('priority', { foreignTable: 'projects', ascending: false })
                .order('created_at', { ascending: true })
                .limit(3 - results.length);

            if (suggestions) {
                const mappedSuggestions = suggestions.map((t: any) => ({
                    id: t.id,
                    title: t.title,
                    projectId: t.project_id,
                    projectName: t.projects.name,
                    status: t.status,
                    isPlanned: false,
                    priority: t.projects.priority || 0
                }));
                results = [...results, ...mappedSuggestions];
            }
        }

        res.json(results);
    } catch (error: any) {
        console.error('Error fetching daily quests:', error.message);
        res.status(500).json({ error: 'Failed to fetch daily quests' });
    }
});

/**
 * POST /api/productivity/daily-quests/plan
 * Plan a task for a specific date or set project priority.
 */
router.post('/daily-quests/plan', async (req: Request, res: Response) => {
    try {
        const { taskId, plannedDate, projectId, priority } = req.body;

        if (taskId) {
            const { error } = await supabaseAdmin
                .from('tasks')
                .update({ planned_date: plannedDate || null, updated_at: new Date().toISOString() })
                .eq('id', taskId);
            if (error) throw error;
        }

        if (projectId && priority !== undefined) {
            const { error } = await supabaseAdmin
                .from('projects')
                .update({ priority, updated_at: new Date().toISOString() })
                .eq('id', projectId);
            if (error) throw error;
        }

        res.json({ success: true });
    } catch (error: any) {
        console.error('Error planning quest:', error.message);
        res.status(500).json({ error: 'Failed to update plan' });
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
        const { projectId, taskId, routineId, logText, timeSpentMinutes } = req.body;

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

        // Calculate quest bonus
        let questBonus = 0;
        if (taskId) {
            const today = getLocalDateString();
            const { data: task } = await supabaseAdmin
                .from('tasks')
                .select('planned_date, status')
                .eq('id', taskId)
                .single();

            if (task && task.planned_date === today) {
                questBonus = GamificationEngine.calculateQuestBonus();
            }

            // Update task status if completed
            if (req.body.completed) {
                await supabaseAdmin
                    .from('tasks')
                    .update({ status: 'completed', updated_at: new Date().toISOString() })
                    .eq('id', taskId);
            }
        }

        // Calculate streak
        const streakResult = GamificationEngine.evaluateStreak(lastActivity, currentStreak);

        // Calculate XP
        const xpCalc = GamificationEngine.calculateWorkLogXP(!!taskId, streakResult.streakCount);
        const totalXPToAward = xpCalc.total + questBonus;
        const xpResult = GamificationEngine.awardXP(currentXP, totalXPToAward);

        // Insert work log
        const { data: workLog, error: logError } = await supabaseAdmin
            .from('work_logs')
            .insert({
                user_id: userId,
                project_id: projectId || null,
                task_id: taskId || null,
                routine_id: routineId || null,
                duration_minutes: timeSpentMinutes || 30, // Default to 30 mins if not provided
                log_text: logText,
                xp_awarded: totalXPToAward,
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
 * GET /api/productivity/stats
 * Returns activity grid data and streak statistics.
 */
router.get('/stats', async (req: Request, res: Response) => {
    try {
        const userId = req.userId!;
        const days = 90;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        const startDateStr = startDate.toISOString();

        // 1. Get XP per day for the grid
        const { data: logs, error: logsError } = await supabaseAdmin
            .from('work_logs')
            .select('xp_awarded, created_at')
            .eq('user_id', userId)
            .gte('created_at', startDateStr);

        if (logsError) throw logsError;

        const activityMap: Record<string, number> = {};
        logs?.forEach((log: any) => {
            const date = log.created_at.split('T')[0];
            activityMap[date] = (activityMap[date] || 0) + log.xp_awarded;
        });

        // 2. Get profile for streak
        const { data: profile, error: profileError } = await supabaseAdmin
            .from('user_profiles')
            .select('streak_count, total_xp, level')
            .eq('id', userId)
            .single();

        if (profileError && profileError.code !== 'PGRST116') throw profileError;

        res.json({
            activityGrid: activityMap,
            streak: profile?.streak_count || 0,
            totalXp: profile?.total_xp || 0,
            level: profile?.level || 1,
        });
    } catch (error: any) {
        console.error('Error fetching stats:', error.message);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

/**
 * GET /api/productivity/logs
 * Get work logs for current user. ?limit=N to control count.
 */
router.get('/logs', async (req: Request, res: Response) => {
    try {
        const userId = req.userId!;
        const limit = parseInt(req.query.limit as string) || 50;
        const dateParam = req.query.date as string; // Optional YYYY-MM-DD

        let q = supabaseAdmin
            .from('work_logs')
            .select('id, project_id, task_id, routine_id, log_text, xp_awarded, created_at, tasks(title)')
            .eq('user_id', userId);

        if (dateParam) {
            // Filter strictly for the given local date
            const startOfDay = new Date(`${dateParam}T00:00:00`).toISOString();
            const endOfDay = new Date(`${dateParam}T23:59:59.999`).toISOString();
            q = q.gte('created_at', startOfDay).lte('created_at', endOfDay);
        }

        const { data, error } = await q
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) throw error;

        // Map to camelCase to match frontend expectations
        const mapped = (data || []).map((l: any) => ({
            id: l.id,
            projectId: l.project_id,
            taskId: l.task_id,
            taskTitle: l.tasks?.title || null,
            routineId: l.routine_id,
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
