import { Router } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma';
import { z } from 'zod';
import { sendSuccess, sendError } from '../utils/response';

const router = Router();

const formatUser = (u: any) => ({
    ...u,
    role: typeof u.role === 'string' ? u.role.toLowerCase() : u.role,
    status: typeof u.status === 'string' ? u.status.toLowerCase() : u.status,
});

const userCreateSchema = z.object({
    email: z.string().email(),
    name: z.string().min(2),
    password: z.string().min(8),
    role: z.string().optional(),
    avatar: z.string().optional(),
    department: z.string().optional(),
    enrollmentId: z.string().optional(),
    employeeId: z.string().optional(),
    status: z.string().optional(),
});

const userUpdateSchema = z.object({
    name: z.string().min(2).optional(),
    email: z.string().email().optional(),
    role: z.string().optional(),
    department: z.string().optional(),
    enrollmentId: z.string().optional(),
    employeeId: z.string().optional(),
    status: z.string().optional(),
    password: z.string().min(8).optional(),
});

const passwordStrong = (pwd: string) => /[A-Z]/.test(pwd) && /[a-z]/.test(pwd) && /\d/.test(pwd) && /[^A-Za-z0-9]/.test(pwd);

// GET /api/v1/users - Get all users
router.get('/', async (req, res, next) => {
    try {
        const { role, status, search } = req.query;

        const users = await prisma.user.findMany({
            where: {
                ...(role && { role: role as any }),
                ...(status && { status: status as any }),
                ...(search && {
                    OR: [
                        { name: { contains: search as string } },
                        { email: { contains: search as string } },
                    ],
                }),
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                avatar: true,
                department: true,
                enrollmentId: true,
                employeeId: true,
                status: true,
                createdAt: true,
                lastLogin: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        return sendSuccess(res, users.map(formatUser));
    } catch (error) {
        next(error);
    }
});

// GET /api/v1/users/:id - Get user by ID
router.get('/:id', async (req, res, next) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.params.id },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                avatar: true,
                department: true,
                enrollmentId: true,
                employeeId: true,
                status: true,
                createdAt: true,
                lastLogin: true,
            },
        });

        if (!user) {
            return sendError(res, 404, 'User not found');
        }

        return sendSuccess(res, formatUser(user));
    } catch (error) {
        next(error);
    }
});

// POST /api/v1/users - Create user
router.post('/', async (req, res, next) => {
    try {
        const { email, name, password, role, avatar, department, enrollmentId, employeeId, status } = req.body;
        const parsed = userCreateSchema.parse(req.body);
        if (!passwordStrong(parsed.password)) {
            return sendError(res, 400, 'Password must include upper, lower, number, and symbol');
        }

        // Check if email exists
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            return res.status(400).json({ error: 'Email already exists' });
        }

        const hashed = await bcrypt.hash(parsed.password || 'ChangeMe123!', 12);

        const user = await prisma.user.create({
            data: {
                email: parsed.email,
                name: parsed.name,
                password: hashed,
                role: parsed.role?.toUpperCase() || 'STUDENT',
                avatar: parsed.avatar || parsed.name.split(' ').map((n: string) => n[0]).join('').toUpperCase(),
                department: parsed.department,
                enrollmentId: parsed.enrollmentId,
                employeeId: parsed.employeeId,
                status: parsed.status?.toUpperCase() || 'ACTIVE',
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                avatar: true,
                department: true,
                status: true,
                createdAt: true,
            },
        });

        return sendSuccess(res, formatUser(user), 201);
    } catch (error) {
        next(error);
    }
});

// PUT /api/v1/users/:id - Update user
router.put('/:id', async (req, res, next) => {
    try {
        const { name, email, role, department, enrollmentId, employeeId, status, password } = userUpdateSchema.parse(req.body);

        const user = await prisma.user.update({
            where: { id: req.params.id },
            data: {
                ...(name && { name }),
                ...(email && { email }),
                ...(role && { role: role.toUpperCase() }),
                ...(department && { department }),
                ...(enrollmentId !== undefined && { enrollmentId }),
                ...(employeeId !== undefined && { employeeId }),
                ...(status && { status: status.toUpperCase() }),
                ...(password && password.length >= 8 && passwordStrong(password) && { password: await bcrypt.hash(password, 12) }),
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                avatar: true,
                department: true,
                status: true,
                updatedAt: true,
            },
        });

        return sendSuccess(res, formatUser(user));
    } catch (error) {
        next(error);
    }
});

// DELETE /api/v1/users/:id - Delete user
router.delete('/:id', async (req, res, next) => {
    try {
        await prisma.user.delete({
            where: { id: req.params.id },
        });

        return sendSuccess(res, { message: 'User deleted successfully' });
    } catch (error) {
        next(error);
    }
});

export default router;
