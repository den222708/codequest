import { Router } from 'express';
import prisma from '../lib/prisma';
import { sendSuccess, sendError } from '../utils/response';
import { requireRole } from '../middleware/auth';
import { z } from 'zod';

const router = Router();
const writeGuard = requireRole(['professor', 'admin', 'superadmin']);

const createSchema = z.object({
    title: z.string(),
    description: z.string(),
    difficulty: z.string().optional(),
    topic: z.string(),
    tags: z.array(z.string()).optional(),
    points: z.number().optional(),
    timeLimit: z.number().optional(),
    memoryLimit: z.number().optional(),
    type: z.string().optional(),
    boilerplateCode: z.record(z.string()).optional(),
    createdById: z.string().optional(),
    testCases: z.array(z.any()).optional(),
    isVisible: z.boolean().optional(),
});

const updateSchema = createSchema.partial();

// GET /api/v1/questions - Get all questions
router.get('/', async (req, res, next) => {
    try {
        const { difficulty, topic, isVisible } = req.query;

        const questions = await prisma.question.findMany({
            where: {
                ...(difficulty && { difficulty: difficulty as any }),
                ...(topic && { topic: topic as string }),
                ...(isVisible !== undefined && { isVisible: isVisible === 'true' }),
            },
            include: {
                createdBy: {
                    select: { id: true, name: true },
                },
                _count: {
                    select: { testCases: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        return sendSuccess(res, questions.map(q => ({
            ...q,
            difficulty: typeof q.difficulty === 'string' ? q.difficulty.toLowerCase() : q.difficulty,
            tags: typeof q.tags === 'string' ? JSON.parse(q.tags) : q.tags,
            boilerplateCode: typeof q.boilerplateCode === 'string'
                ? JSON.parse(q.boilerplateCode)
                : q.boilerplateCode,
        })));
    } catch (error) {
        next(error);
    }
});

// GET /api/v1/questions/:id - Get question by ID
router.get('/:id', async (req, res, next) => {
    try {
        const question = await prisma.question.findUnique({
            where: { id: req.params.id },
            include: {
                createdBy: {
                    select: { id: true, name: true },
                },
                testCases: true,
            },
        });

        if (!question) {
            return res.status(404).json({ error: 'Question not found' });
        }

        return sendSuccess(res, question ? {
            ...question,
            difficulty: typeof question.difficulty === 'string' ? question.difficulty.toLowerCase() : question.difficulty,
            tags: typeof question.tags === 'string' ? JSON.parse(question.tags) : question.tags,
            boilerplateCode: typeof question.boilerplateCode === 'string'
                ? JSON.parse(question.boilerplateCode)
                : question.boilerplateCode,
        } : question);
    } catch (error) {
        next(error);
    }
});

// POST /api/v1/questions - Create question
router.post('/', writeGuard, async (req, res, next) => {
    try {
        const {
            title,
            description,
            difficulty,
            topic,
            tags,
            points,
            timeLimit,
            memoryLimit,
            boilerplateCode,
            createdById,
            testCases,
        } = createSchema.parse(req.body);

        const requesterId = createdById || (req as any).user?.sub;
        if (!requesterId) {
            return sendError(res, 400, 'createdById is required');
        }

        const question = await prisma.question.create({
            data: {
                title,
                description,
                difficulty: difficulty?.toUpperCase() || 'MEDIUM',
                topic,
                tags: JSON.stringify(tags || []),
                points: points || 100,
                timeLimit: timeLimit || 5,
                memoryLimit: memoryLimit || 256,
                boilerplateCode: JSON.stringify(boilerplateCode || {}),
                createdById: requesterId,
                testCases: testCases ? {
                    create: testCases.map((tc: any) => ({
                        input: tc.input,
                        expectedOutput: tc.expectedOutput,
                        isHidden: tc.isHidden || false,
                        points: tc.points || 10,
                        timeLimit: tc.timeLimit || 2000,
                    })),
                } : undefined,
            } as any,
            include: {
                testCases: true,
            },
        });

        return sendSuccess(res, question, 201);
    } catch (error) {
        next(error);
    }
});

// PUT /api/v1/questions/:id - Update question
router.put('/:id', writeGuard, async (req, res, next) => {
    try {
        const { title, description, difficulty, topic, tags, points, timeLimit, memoryLimit, boilerplateCode, isVisible } = updateSchema.parse(req.body);

        const question = await prisma.question.update({
            where: { id: req.params.id },
            data: {
                ...(title && { title }),
                ...(description && { description }),
                ...(difficulty && { difficulty: difficulty.toUpperCase() }),
                ...(topic && { topic }),
                ...(tags && { tags: JSON.stringify(tags) }),
                ...(points && { points }),
                ...(timeLimit && { timeLimit }),
                ...(memoryLimit && { memoryLimit }),
                ...(boilerplateCode && { boilerplateCode: JSON.stringify(boilerplateCode) }),
                ...(isVisible !== undefined && { isVisible }),
            } as any,
        });

        return sendSuccess(res, question);
    } catch (error) {
        next(error);
    }
});

// PUT /api/v1/questions/:id/visibility - Toggle visibility
router.put('/:id/visibility', writeGuard, async (req, res, next) => {
    try {
        const question = await prisma.question.findUnique({
            where: { id: req.params.id },
        });

        if (!question) {
            return res.status(404).json({ error: 'Question not found' });
        }

        const updated = await prisma.question.update({
            where: { id: req.params.id },
            data: { isVisible: !question.isVisible },
        });

        return sendSuccess(res, updated);
    } catch (error) {
        next(error);
    }
});

// DELETE /api/v1/questions/:id - Delete question
router.delete('/:id', writeGuard, async (req, res, next) => {
    try {
        await prisma.question.delete({
            where: { id: req.params.id },
        });

        return sendSuccess(res, { message: 'Question deleted successfully' });
    } catch (error) {
        next(error);
    }
});

export default router;
