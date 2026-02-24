import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

// Extend Express Request to include user info
declare global {
    namespace Express {
        interface Request {
            userId?: string;
            userToken?: string;
        }
    }
}

/**
 * Middleware to verify Supabase JWT tokens.
 * Extracts user ID from the token and attaches it to req.userId.
 * Also stores the raw token in req.userToken for creating per-request Supabase clients.
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Missing or invalid authorization header' });
        return;
    }

    const token = authHeader.split(' ')[1];
    const jwtSecret = process.env.SUPABASE_JWT_SECRET;

    if (!jwtSecret) {
        console.error('SUPABASE_JWT_SECRET is not configured');
        res.status(500).json({ error: 'Server configuration error' });
        return;
    }

    try {
        const decoded = jwt.verify(token, jwtSecret) as jwt.JwtPayload;

        if (!decoded.sub) {
            res.status(401).json({ error: 'Invalid token: missing subject' });
            return;
        }

        req.userId = decoded.sub;
        req.userToken = token;
        next();
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            res.status(401).json({ error: 'Token expired' });
            return;
        }
        res.status(401).json({ error: 'Invalid token' });
        return;
    }
}
