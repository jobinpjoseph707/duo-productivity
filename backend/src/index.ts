import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { authMiddleware } from './middleware/auth';
import categoriesRouter from './routes/categories';
import notificationsRouter from './routes/notifications';
import productivityRouter from './routes/productivity';
import projectsRouter from './routes/projects';
import timelineRouter from './routes/timeline';

// Load environment variables
dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '5000', 10);

// ─── Middleware ───────────────────────────────────────────────
app.use(cors({
    origin: '*', // Allow all origins in development
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

// ─── Health Check (public) ───────────────────────────────────
app.get('/api/health', (_req, res) => {
    res.json({
        status: 'ok',
        service: 'duo-productivity-api',
        timestamp: new Date().toISOString(),
    });
});

// ─── Protected Routes ────────────────────────────────────────
app.use('/api/projects', authMiddleware, projectsRouter);
app.use('/api/productivity', authMiddleware, productivityRouter);
app.use('/api/categories', authMiddleware, categoriesRouter);
app.use('/api/timeline', authMiddleware, timelineRouter);
app.use('/api/notifications', authMiddleware, notificationsRouter);

// Task status update lives under projects router but needs its own mount
// because frontend calls PATCH /api/tasks/:id (not /api/projects/tasks/:id)
app.patch('/api/tasks/:id', authMiddleware, async (req, res) => {
    // Delegate to the projects router's task handler
    const { createUserClient } = await import('./services/supabaseClient');
    const supabase = createUserClient(req.userToken!);
    const { status } = req.body;

    if (!status) {
        res.status(400).json({ error: 'Status is required' });
        return;
    }

    try {
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

// ─── 404 handler ─────────────────────────────────────────────
app.use((_req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// ─── Start Server ────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🚀 DuoProductivity API running on http://localhost:${PORT}`);
    console.log(`📋 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🔑 Auth: JWT via Supabase\n`);
});

export default app;
