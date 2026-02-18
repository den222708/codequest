import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { signAccessToken, signRefreshToken } from '../middleware/auth';
import crypto from 'crypto';
import { sendSuccess, sendError } from '../utils/response';

const router = Router();

const normalizeRole = (role?: string) => role?.toUpperCase() || 'STUDENT';
const passwordStrong = (pwd: string) => /[A-Z]/.test(pwd) && /[a-z]/.test(pwd) && /\d/.test(pwd) && /[^A-Za-z0-9]/.test(pwd);
const failedLogins = new Map<string, { count: number; lockUntil: number }>();
const refreshJtis = new Map<string, string>(); // userId -> jti
const now = () => Date.now();
const newJti = () => crypto.randomBytes(16).toString('hex');
const disableAuthLockout = process.env.DISABLE_AUTH_LOCKOUT === 'true' || process.env.NODE_ENV !== 'production';

const incrementFail = (key: string) => {
    const current = failedLogins.get(key) || { count: 0, lockUntil: 0 };
    const count = current.count + 1;
    const lockUntil = count >= 5 ? now() + 15 * 60 * 1000 : current.lockUntil;
    failedLogins.set(key, { count, lockUntil });
};

const clearFail = (key: string) => failedLogins.delete(key);

// POST /api/v1/auth/login
const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
});

router.post('/login', async (req, res, next) => {
    try {
        const { email, password } = loginSchema.parse(req.body);

        if (!disableAuthLockout) {
            const lock = failedLogins.get(email);
            if (lock && lock.lockUntil > now()) {
                return sendError(res, 429, 'Account locked. Try again later.');
            }
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.password) {
            if (!disableAuthLockout) incrementFail(email);
            return sendError(res, 401, 'Invalid credentials');
        }

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) {
            if (!disableAuthLockout) incrementFail(email);
            return sendError(res, 401, 'Invalid credentials');
        }

        if (!disableAuthLockout) clearFail(email);
        const jti = newJti();
        refreshJtis.set(user.id, jti);
        const accessToken = signAccessToken({ sub: user.id, role: user.role.toLowerCase(), email: user.email });
        const refreshToken = signRefreshToken({ sub: user.id, role: user.role.toLowerCase(), email: user.email, jti });

        return sendSuccess(res, {
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role.toLowerCase(),
                status: user.status?.toLowerCase(),
                avatar: user.avatar,
            },
            tokens: {
                accessToken,
                refreshToken,
            },
        });
    } catch (error) {
        next(error);
    }
});

// POST /api/v1/auth/signup
const signupSchema = z.object({
    email: z.string().email(),
    name: z.string().min(2),
    password: z.string().min(8),
    role: z.string().optional(),
});

router.post('/signup', async (req, res, next) => {
    try {
        const { email, name, password, role } = signupSchema.parse(req.body);
        if (!passwordStrong(password)) {
            return sendError(res, 400, 'Password must include upper, lower, number, and symbol');
        }

        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            return sendError(res, 400, 'Email already exists');
        }

        const hashed = await bcrypt.hash(password, 12);
        const created = await prisma.user.create({
            data: {
                email,
                name,
                password: hashed,
                role: normalizeRole(role),
                status: 'ACTIVE',
                avatar: name.split(' ').map((n: string) => n[0]).join('').toUpperCase(),
            },
        });

        const jti = newJti();
        refreshJtis.set(created.id, jti);
        const accessToken = signAccessToken({ sub: created.id, role: created.role.toLowerCase(), email: created.email });
        const refreshToken = signRefreshToken({ sub: created.id, role: created.role.toLowerCase(), email: created.email, jti });

        return sendSuccess(res, {
            user: {
                id: created.id,
                email: created.email,
                name: created.name,
                role: created.role.toLowerCase(),
                status: created.status?.toLowerCase(),
                avatar: created.avatar,
            },
            tokens: { accessToken, refreshToken },
        }, 201);
    } catch (error) {
        next(error);
    }
});

// POST /api/v1/auth/refresh
router.post('/refresh', async (req, res, next) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return sendError(res, 400, 'refreshToken is required');
        }
        // Lightweight: reuse signAccessToken after verifying refresh
        const secret = process.env.JWT_SECRET;
        if (!secret) return sendError(res, 500, 'JWT_SECRET not configured');
        const decoded = jwt.verify(refreshToken, secret) as any;
        const currentJti = refreshJtis.get(decoded.sub);
        if (!currentJti || decoded.jti !== currentJti) {
            return sendError(res, 401, 'Invalid refresh token');
        }
        const newRefreshJti = newJti();
        refreshJtis.set(decoded.sub, newRefreshJti);
        const accessToken = signAccessToken({ sub: decoded.sub, role: decoded.role, email: decoded.email });
        const newRefresh = signRefreshToken({ sub: decoded.sub, role: decoded.role, email: decoded.email, jti: newRefreshJti });
        return sendSuccess(res, { accessToken, refreshToken: newRefresh });
    } catch (error) {
        next(error);
    }
});

// POST /api/v1/auth/logout - revoke current refresh
router.post('/logout', async (req, res, next) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) return sendError(res, 400, 'refreshToken is required');
        const secret = process.env.JWT_SECRET;
        if (!secret) return sendError(res, 500, 'JWT_SECRET not configured');
        try {
            const decoded = jwt.verify(refreshToken, secret) as any;
            const currentJti = refreshJtis.get(decoded.sub);
            if (currentJti && decoded.jti === currentJti) {
                refreshJtis.delete(decoded.sub);
            }
        } catch {
            // ignore invalid refresh
        }
        return sendSuccess(res, { message: 'Logged out' });
    } catch (error) {
        next(error);
    }
});

// Simple in-memory reset token store (replace with persistent store/email in prod)
const resetStore = new Map<string, { userId: string; expires: number }>();

const forgotSchema = z.object({
    email: z.string().email(),
});

router.post('/forgot', async (req, res, next) => {
    try {
        const { email } = forgotSchema.parse(req.body);
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            // Do not leak existence
            return sendSuccess(res, { message: 'If the account exists, a reset link was sent.' });
        }
        const token = crypto.randomBytes(32).toString('hex');
        resetStore.set(token, { userId: user.id, expires: Date.now() + 15 * 60 * 1000 });
        // In production, send email with token link
        return sendSuccess(res, { message: 'If the account exists, a reset link was sent.', resetToken: token });
    } catch (error) {
        next(error);
    }
});

const resetSchema = z.object({
    token: z.string().min(10),
    password: z.string().min(8),
});

router.post('/reset', async (req, res, next) => {
    try {
        const { token, password } = resetSchema.parse(req.body);
        if (!passwordStrong(password)) {
            return sendError(res, 400, 'Password must include upper, lower, number, and symbol');
        }
        const entry = resetStore.get(token);
        if (!entry || entry.expires < Date.now()) {
            return sendError(res, 400, 'Invalid or expired token');
        }
        const hashed = await bcrypt.hash(password, 12);
        await prisma.user.update({ where: { id: entry.userId }, data: { password: hashed } });
        resetStore.delete(token);
        return sendSuccess(res, { message: 'Password updated successfully' });
    } catch (error) {
        next(error);
    }
});

export default router;
