import { Request, Response, Router } from 'express';
import { createUserClient } from '../services/supabaseClient';

const router = Router();

/**
 * GET /api/projects
 * List all projects the user has access to (RLS filters by category access).
 */
router.get('/', async (req: Request, res: Response) => {
    try {
        const supabase = createUserClient(req.userToken!);
        const { data, error } = await supabase
            .from('projects')
            .select('id, name, description, category_id, status, created_at, updated_at')
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json(data);
    } catch (error: any) {
        console.error('Error fetching projects:', error.message);
        res.status(500).json({ error: 'Failed to fetch projects' });
    }
});

/**
 * GET /api/projects/:id
 * Get a single project by ID.
 */
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const supabase = createUserClient(req.userToken!);
        const { data, error } = await supabase
            .from('projects')
            .select('id, name, description, category_id, status, created_at, updated_at')
            .eq('id', req.params.id)
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
 * List all tasks for a given project.
 */
router.get('/:projectId/tasks', async (req: Request, res: Response) => {
    try {
        const supabase = createUserClient(req.userToken!);
        const { data, error } = await supabase
            .from('tasks')
            .select('id, project_id, title, description, status, assignee, due_date, created_at')
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

        const supabase = createUserClient(req.userToken!);
        const { data, error } = await supabase
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
