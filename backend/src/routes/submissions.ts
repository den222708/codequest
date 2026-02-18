import { Router } from 'express';
import prisma from '../lib/prisma';
import { sendSuccess, sendError } from '../utils/response';
import { z } from 'zod';

const router = Router();

const mapStatus = (status: string) => {
    const normalized = status?.toUpperCase();
    switch (normalized) {
        case 'ACCEPTED': return 'passed';
        case 'WRONG_ANSWER': return 'failed';
        case 'TIME_LIMIT': return 'failed';
        case 'MEMORY_LIMIT': return 'failed';
        case 'RUNTIME_ERROR': return 'error';
        case 'COMPILE_ERROR': return 'error';
        default: return status?.toLowerCase();
    }
};

const listQuerySchema = z.object({
    userId: z.string().optional(),
    questionId: z.string().optional(),
    status: z.string().optional(),
});

const createSchema = z.object({
    code: z.string().min(1),
    language: z.string().min(1),
    userId: z.string().min(1),
    questionId: z.string().min(1),
    attemptId: z.string().optional(),
    status: z.string().optional(),
    score: z.number().optional(),
    results: z.any().optional(),
    executionTime: z.number().optional(),
    memoryUsed: z.number().optional(),
});

// GET /api/v1/submissions - Get all submissions
router.get('/', async (req, res, next) => {
    try {
        const { userId, questionId, status } = listQuerySchema.parse(req.query);

        const submissions = await prisma.submission.findMany({
            where: {
                ...(userId && { userId: userId as string }),
                ...(questionId && { questionId: questionId as string }),
                ...(status && { status: status as any }),
            },
            include: {
                user: {
                    select: { id: true, name: true, avatar: true },
                },
                question: {
                    select: { id: true, title: true, difficulty: true },
                },
            },
            orderBy: { submittedAt: 'desc' },
            take: 100,
        });

        return sendSuccess(res, submissions.map(s => ({
            ...s,
            status: mapStatus(s.status),
            results: s.results ? JSON.parse(s.results as any) : null,
        })));
    } catch (error) {
        next(error);
    }
});

// GET /api/v1/submissions/:id - Get submission by ID
router.get('/:id', async (req, res, next) => {
    try {
        const submission = await prisma.submission.findUnique({
            where: { id: req.params.id },
            include: {
                user: {
                    select: { id: true, name: true, avatar: true },
                },
                question: true,
            },
        });

        if (!submission) {
            return sendError(res, 404, 'Submission not found');
        }

        return sendSuccess(res, {
            ...submission,
            status: mapStatus(submission.status),
            results: submission.results ? JSON.parse(submission.results as any) : null,
        });
    } catch (error) {
        next(error);
    }
});

// GET /api/v1/submissions/user/:userId - Get submissions by user
router.get('/user/:userId', async (req, res, next) => {
    try {
        const submissions = await prisma.submission.findMany({
            where: { userId: req.params.userId },
            include: {
                question: {
                    select: { id: true, title: true, difficulty: true, topic: true },
                },
            },
            orderBy: { submittedAt: 'desc' },
        });

        return sendSuccess(res, submissions.map(s => ({
            ...s,
            status: mapStatus(s.status),
            results: s.results ? JSON.parse(s.results as any) : null,
        })));
    } catch (error) {
        next(error);
    }
});

// POST /api/v1/submissions - Create submission
router.post('/', async (req, res, next) => {
    try {
        const { code, language, userId, questionId, attemptId, status, score, results, executionTime, memoryUsed } = createSchema.parse(req.body);

        const normalizedStatus = status ? status.toUpperCase() : 'PENDING';

        const submission = await prisma.submission.create({
            data: {
                code,
                language,
                status: normalizedStatus,
                userId,
                questionId,
                attemptId,
                ...(score !== undefined && { score }),
                ...(executionTime !== undefined && { executionTime }),
                ...(memoryUsed !== undefined && { memoryUsed }),
                ...(results !== undefined && { results: JSON.stringify(results) }),
            },
        });

        return sendSuccess(res, {
            ...submission,
            status: mapStatus(submission.status),
        }, 201);
    } catch (error) {
        next(error);
    }
});

export default router;
