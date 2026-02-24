import { Request, Response, Router } from 'express';
import { createUserClient } from '../services/supabaseClient';

const router = Router();

/**
 * GET /api/categories
 * List all categories.
 */
router.get('/', async (req: Request, res: Response) => {
    try {
        const supabase = createUserClient(req.userToken!);
        const { data, error } = await supabase
            .from('categories')
            .select('id, name, color, sort_order')
            .order('sort_order', { ascending: true });

        if (error) throw error;
        res.json(data);
    } catch (error: any) {
        console.error('Error fetching categories:', error.message);
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
});

export default router;
