import { Request, Response, Router } from 'express';
import { supabaseAdmin } from '../services/supabaseClient';

const router = Router();

/**
 * Helper: Get category IDs the user has access to from user_category_access table.
 */
async function getUserCategoryIds(userId: string): Promise<string[]> {
    const { data, error } = await supabaseAdmin
        .from('user_category_access')
        .select('category_id')
        .eq('user_id', userId);

    if (error) throw error;
    return (data || []).map((row: any) => row.category_id);
}

/**
 * GET /api/projects
 * List only projects in categories the user has access to.
 */
router.get('/', async (req: Request, res: Response) => {
    try {
        const categoryIds = await getUserCategoryIds(req.userId!);

        if (categoryIds.length === 0) {
            res.json([]);
            return;
        }

        const { data: projects, error: projectsError } = await supabaseAdmin
            .from('projects')
            .select('id, name, description, category_id, status, priority, created_at, updated_at')
            .in('category_id', categoryIds);

        if (projectsError) throw projectsError;

        if (!projects || projects.length === 0) {
            res.json([]);
            return;
        }

        const projectIds = projects.map((p: any) => p.id);

        // Get latest work_log per project for sorting
        const { data: recentLogs } = await supabaseAdmin
            .from('work_logs')
            .select('project_id, created_at')
            .in('project_id', projectIds)
            .order('created_at', { ascending: false });

        // Activity map
        const lastActivityMap: Record<string, string> = {};
        for (const log of (recentLogs || [])) {
            if (log.project_id && !lastActivityMap[log.project_id]) {
                lastActivityMap[log.project_id] = log.created_at;
            }
        }

        // Sort: Priority (starred) first, then by most recently logged, then by created_at
        const sortedProjects = [...projects].sort((a: any, b: any) => {
            // 1. Sort by priority (starred first)
            const aPriority = a.priority || 0;
            const bPriority = b.priority || 0;
            if (aPriority !== bPriority) return bPriority - aPriority;

            // 2. Sort by last activity
            const aTime = lastActivityMap[a.id] || '';
            const bTime = lastActivityMap[b.id] || '';
            if (bTime && !aTime) return 1;
            if (aTime && !bTime) return -1;
            if (aTime && bTime) return bTime.localeCompare(aTime);

            // 3. Fallback to created_at
            return b.created_at.localeCompare(a.created_at);
        });

        res.json(sortedProjects);
    } catch (error: any) {
        console.error('Error fetching projects:', error.message);
        res.status(500).json({ error: 'Failed to fetch projects' });
    }
});

/**
 * GET /api/projects/:id
 * Get a single project by ID (only if user has category access).
 */
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const categoryIds = await getUserCategoryIds(req.userId!);

        const { data, error } = await supabaseAdmin
            .from('projects')
            .select('id, name, description, category_id, status, priority, created_at, updated_at')
            .eq('id', req.params.id)
            .in('category_id', categoryIds)
            .single();

        if (error) throw error;
        if (!data) {
            res.status(404).json({ error: 'Project not found' });
            return;
        }
        res.json(data);
    } catch (error: any) {
        console.error('Error fetching project:', error.message);
        res.status(500).json({ error: 'Failed to fetch project' });
    }
});

/**
 * GET /api/projects/:projectId/tasks
 * List all tasks for a given project (only if user has access to the project's category).
 */
router.get('/:projectId/tasks', async (req: Request, res: Response) => {
    try {
        const categoryIds = await getUserCategoryIds(req.userId!);

        // Verify the project belongs to an accessible category
        const { data: project } = await supabaseAdmin
            .from('projects')
            .select('id, category_id')
            .eq('id', req.params.projectId)
            .in('category_id', categoryIds)
            .single();

        if (!project) {
            res.status(404).json({ error: 'Project not found or access denied' });
            return;
        }

        const { data, error } = await supabaseAdmin
            .from('tasks')
            .select('id, project_id, title, description, status, assignee, due_date, planned_date, created_at')
            .eq('project_id', req.params.projectId)
            .order('created_at', { ascending: true });

        if (error) throw error;
        res.json(data);
    } catch (error: any) {
        console.error('Error fetching tasks:', error.message);
        res.status(500).json({ error: 'Failed to fetch tasks' });
    }
});

/**
 * PATCH /api/tasks/:id
 * Update a task's status.
 */
router.patch('/tasks/:id', async (req: Request, res: Response) => {
    try {
        const { status } = req.body;
        if (!status) {
            res.status(400).json({ error: 'Status is required' });
            return;
        }

        const { data, error } = await supabaseAdmin
            .from('tasks')
            .update({ status, updated_at: new Date().toISOString() })
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) throw error;
        res.json(data);
    } catch (error: any) {
        console.error('Error updating task:', error.message);
        res.status(500).json({ error: 'Failed to update task' });
    }
});

export default router;
