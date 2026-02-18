import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface TokenPayload {
    sub: string;
    role?: string;
    email?: string;
}

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    try {
        const header = req.headers.authorization;
        if (!header?.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const token = header.slice(7);
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            return res.status(500).json({ error: 'JWT_SECRET not configured' });
        }
        const decoded = jwt.verify(token, secret) as TokenPayload;
        (req as any).user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
};

export const signAccessToken = (payload: TokenPayload, expiresIn = process.env.JWT_EXPIRES_IN || '15m') => {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET not configured');
    return jwt.sign(payload, secret, { expiresIn });
};

export const signRefreshToken = (
    payload: TokenPayload & { jti: string },
    expiresIn = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d'
) => {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET not configured');
    return jwt.sign(payload, secret, { expiresIn });
};

export const requireRole = (allowed: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const user = (req as any).user as TokenPayload | undefined;
        const role = user?.role;
        if (!role || !allowed.map(r => r.toLowerCase()).includes(role.toLowerCase())) {
            return res.status(403).json({ error: 'Forbidden' });
        }
        next();
    };
};
