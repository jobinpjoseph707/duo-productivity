import express, { Request, Response } from 'express';
import { createUserClient } from '../services/supabaseClient';

const router = express.Router();

// GET /api/timeline/routines
// Fetch all routines for the user
router.get('/routines', async (req: Request, res: Response) => {
    try {
        const supabase = createUserClient(req.userToken!);
        const { data, error } = await supabase
            .from('routines')
            .select('*')
            .eq('user_id', req.userId)
            .order('start_time', { ascending: true });

        if (error) {
            console.error('Error fetching routines:', error.message);
            res.status(500).json({ error: 'Failed to fetch routines' });
            return;
        }

        res.json(data);
    } catch (err: any) {
        console.error('Unexpected error fetching routines:', err.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/timeline/daily
// Fetch routines active for a specific day of the week (0-6)
router.get('/daily', async (req: Request, res: Response) => {
    const { dayOfWeek } = req.query; // e.g. 1 for Monday

    try {
        if (dayOfWeek === undefined) {
            res.status(400).json({ error: 'dayOfWeek query parameter is required (0-6)' });
            return;
        }

        const day = parseInt(dayOfWeek as string, 10);

        const supabase = createUserClient(req.userToken!);
        const { data, error } = await supabase
            .from('routines')
            .select('*')
            .eq('user_id', req.userId)
            .eq('is_active', true)
            .contains('days_of_week', [day]) // Supabase array contains operator
            .order('start_time', { ascending: true });

        if (error) {
            console.error('Error fetching daily routines:', error.message);
            res.status(500).json({ error: 'Failed to fetch daily routines' });
            return;
        }

        res.json(data);
    } catch (err: any) {
        console.error('Unexpected error fetching daily routines:', err.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/timeline/routines
// Create a new routine
router.post('/routines', async (req: Request, res: Response) => {
    const { title, color, start_time, end_time, days_of_week } = req.body;

    if (!title || !start_time || !end_time) {
        res.status(400).json({ error: 'Title, start_time, and end_time are required' });
        return;
    }

    try {
        const supabase = createUserClient(req.userToken!);
        const { data, error } = await supabase
            .from('routines')
            .insert({
                user_id: req.userId,
                title,
                color: color || '#58CC02', // Ensure default green if not provided
                start_time,
                end_time,
                days_of_week: days_of_week || [1, 2, 3, 4, 5, 6, 0] // Default every day
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating routine:', error.message);
            res.status(500).json({ error: 'Failed to create routine' });
            return;
        }

        res.status(201).json(data);
    } catch (err: any) {
        console.error('Unexpected error creating routine:', err.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PUT /api/timeline/routines/:id
// Update an existing routine
router.put('/routines/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    const { title, color, start_time, end_time, days_of_week, is_active } = req.body;

    try {
        const supabase = createUserClient(req.userToken!);
        const { data, error } = await supabase
            .from('routines')
            .update({
                title,
                color,
                start_time,
                end_time,
                days_of_week,
                is_active,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .eq('user_id', req.userId) // Ensure user owns the routine
            .select()
            .single();

        if (error) {
            console.error('Error updating routine:', error);
            res.status(500).json({ error: 'Failed to update routine' });
            return;
        }

        res.json(data);
    } catch (err: any) {
        console.error('Unexpected error updating routine:', err.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE /api/timeline/routines/:id
// Delete a routine
router.delete('/routines/:id', async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        const supabase = createUserClient(req.userToken!);
        const { error } = await supabase
            .from('routines')
            .delete()
            .eq('id', id)
            .eq('user_id', req.userId); // Ensure user owns the routine

        if (error) {
            console.error('Error deleting routine:', error.message);
            res.status(500).json({ error: 'Failed to delete routine' });
            return;
        }

        res.status(204).send();
    } catch (err: any) {
        console.error('Unexpected error deleting routine:', err.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
