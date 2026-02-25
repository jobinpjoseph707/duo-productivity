import { Request, Response, Router } from 'express';
import { supabaseAdmin } from '../services/supabaseClient';

const router = Router();

/**
 * GET /api/categories
 * List only categories the user has access to via user_category_access.
 */
router.get('/', async (req: Request, res: Response) => {
    try {
        const userId = req.userId!;

        // Get the user's accessible category IDs
        const { data: accessData, error: accessError } = await supabaseAdmin
            .from('user_category_access')
            .select('category_id')
            .eq('user_id', userId);

        if (accessError) throw accessError;

        const categoryIds = (accessData || []).map((row: any) => row.category_id);

        if (categoryIds.length === 0) {
            res.json([]);
            return;
        }

        const { data, error } = await supabaseAdmin
            .from('categories')
            .select('id, name, color, sort_order')
            .in('id', categoryIds)
            .order('sort_order', { ascending: true });

        if (error) throw error;
        res.json(data);
    } catch (error: any) {
        console.error('Error fetching categories:', error.message);
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
});

export default router;
