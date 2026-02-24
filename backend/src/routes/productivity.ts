import { Request, Response, Router } from 'express';
import { GamificationEngine } from '../services/gamificationEngine';
import { createUserClient, supabaseAdmin } from '../services/supabaseClient';

const router = Router();

/**
 * GET /api/productivity/dashboard
 * Returns XP, streak, level, time allocations, and recent logs.
 */
router.get('/dashboard', async (req: Request, res: Response) => {
    try {
        const userId = req.userId!;
        const supabase = createUserClient(req.userToken!);

        // Fetch profile, allocations, and recent logs in parallel
        const [profileResult, allocationsResult, logsResult] = await Promise.all([
            supabase
                .from('user_profiles')
                .select('*')
                .eq('id', userId)
                .single(),
            supabase
                .from('time_allocations')
                .select('*')
                .eq('user_id', userId)
                .eq('date', new Date().toISOString().split('T')[0]),
            supabase
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
 * POST /api/productivity/log
 * Log work, award XP, update streak.
 */
router.post('/log', async (req: Request, res: Response) => {
    try {
        const userId = req.userId!;
        const { projectId, taskId, logText, timeSpentMinutes } = req.body;

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
                last_activity_date: new Date().toISOString().split('T')[0],
            });

        if (profileError) throw profileError;

        // If time tracking, update spent_minutes on allocations
        if (timeSpentMinutes) {
            const today = new Date().toISOString().split('T')[0];
            try {
                const { error: rpcError } = await supabaseAdmin.rpc('increment_spent_minutes', {
                    p_user_id: userId,
                    p_date: today,
                    p_minutes: timeSpentMinutes,
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

        const today = new Date().toISOString().split('T')[0];

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
        const supabase = createUserClient(req.userToken!);

        const { data, error } = await supabase
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
        const supabase = createUserClient(req.userToken!);

        const { data, error } = await supabase
            .from('work_logs')
            .select('id, project_id, task_id, log_text, xp_awarded, created_at')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) throw error;
        res.json(data);
    } catch (error: any) {
        console.error('Error fetching work logs:', error.message);
        res.status(500).json({ error: 'Failed to fetch work logs' });
    }
});

export default router;
