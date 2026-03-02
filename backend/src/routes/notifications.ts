import express, { Request, Response } from 'express';
import { createUserClient, supabaseAdmin } from '../services/supabaseClient';

const router = express.Router();

// GET /api/notifications
// Fetch all notifications for the user
router.get('/', async (req: Request, res: Response) => {
    try {
        const supabase = createUserClient(req.userToken!);
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', req.userId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching notifications:', error.message);
            res.status(500).json({ error: 'Failed to fetch notifications' });
            return;
        }

        res.json(data);
    } catch (err: any) {
        console.error('Unexpected error fetching notifications:', err.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/notifications
// Log a new notification (e.g. from local push sync)
router.post('/', async (req: Request, res: Response) => {
    const { type, title, message, external_id } = req.body;

    if (!type || !title || !message) {
        res.status(400).json({ error: 'Type, title, and message are required' });
        return;
    }

    try {
        // If an external_id is provided, prevent duplicates
        if (external_id) {
            const { data: existing } = await supabaseAdmin
                .from('notifications')
                .select('id')
                .eq('user_id', req.userId)
                .eq('external_id', external_id)
                .single();

            if (existing) {
                // Already logged
                res.status(200).json(existing);
                return;
            }
        }

        const { data, error } = await supabaseAdmin
            .from('notifications')
            .insert({
                user_id: req.userId,
                type,
                title,
                message,
                external_id
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating notification:', error.message);
            res.status(500).json({ error: 'Failed to create notification' });
            return;
        }

        res.status(201).json(data);
    } catch (err: any) {
        console.error('Unexpected error creating notification:', err.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PUT /api/notifications/:id/read
// Mark a notification as read
router.put('/:id/read', async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        const supabase = createUserClient(req.userToken!);
        const { data, error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', id)
            .eq('user_id', req.userId)
            .select()
            .single();

        if (error) {
            console.error('Error marking notification read:', error.message);
            res.status(500).json({ error: 'Failed to update notification' });
            return;
        }

        res.json(data);
    } catch (err: any) {
        console.error('Unexpected error updating notification:', err.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PUT /api/notifications/read-all
// Mark all notifications as read
router.put('/read-all', async (req: Request, res: Response) => {
    try {
        const supabase = createUserClient(req.userToken!);
        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('user_id', req.userId)
            .eq('is_read', false);

        if (error) {
            console.error('Error marking all notifications read:', error.message);
            res.status(500).json({ error: 'Failed to update notifications' });
            return;
        }

        res.json({ success: true });
    } catch (err: any) {
        console.error('Unexpected error updating notifications:', err.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
