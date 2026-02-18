import { Router } from 'express';
import prisma from '../lib/prisma';
import { sendSuccess, sendError } from '../utils/response';
import { requireRole } from '../middleware/auth';
import { z } from 'zod';

const router = Router();

// Write-guard: only professors/admins can create/edit/delete
const writeGuard = requireRole(['professor', 'admin', 'superadmin']);

const formatAssessment = (a: any) => ({
    ...a,
    status: typeof a.status === 'string' ? a.status.toLowerCase() : a.status,
    type: typeof a.type === 'string' ? a.type.toLowerCase() : a.type,
    difficulty: typeof a.difficulty === 'string' ? a.difficulty.toLowerCase() : a.difficulty,
    settings: typeof a.settings === 'string' ? JSON.parse(a.settings) : a.settings,
});

const createSchema = z.object({
    title: z.string(),
    description: z.string(),
    type: z.string().optional(),
    difficulty: z.string().optional(),
    duration: z.number().optional(),
    passingScore: z.number().optional(),
    totalPoints: z.number().optional(),
    startDate: z.string(),
    endDate: z.string(),
    settings: z.any().optional(),
    courseCode: z.string().optional(),
    courseName: z.string().optional(),
    professorName: z.string().optional(),
    createdById: z.string().optional(),
    questionIds: z.array(z.string()).optional(),
    status: z.string().optional(),
});

const updateSchema = createSchema.partial();

// GET /api/v1/assessments - Get all assessments
router.get('/', async (req, res, next) => {
    try {
        const { status, type, createdBy } = req.query;

        const assessments = await prisma.assessment.findMany({
            where: {
                ...(status && { status: status as any }),
                ...(type && { type: type as any }),
                ...(createdBy && { createdById: createdBy as string }),
            },
            include: {
                createdBy: {
                    select: { id: true, name: true, avatar: true },
                },
                questions: {
                    include: {
                        question: {
                            select: { id: true, title: true, difficulty: true, points: true },
                        },
                    },
                    orderBy: { order: 'asc' },
                },
                _count: {
                    select: { attempts: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        return sendSuccess(res, assessments.map(formatAssessment));
    } catch (error) {
        next(error);
    }
});

// GET /api/v1/assessments/:id - Get assessment by ID
router.get('/:id', async (req, res, next) => {
    try {
        const assessment = await prisma.assessment.findUnique({
            where: { id: req.params.id },
            include: {
                createdBy: {
                    select: { id: true, name: true, avatar: true },
                },
                questions: {
                    include: {
                        question: {
                            include: {
                                testCases: {
                                    where: { isHidden: false }, // Only show visible test cases
                                },
                            },
                        },
                    },
                    orderBy: { order: 'asc' },
                },
            },
        });

        if (!assessment) {
            return sendError(res, 404, 'Assessment not found');
        }

        return sendSuccess(res, formatAssessment(assessment));
    } catch (error) {
        next(error);
    }
});

// POST /api/v1/assessments - Create assessment
router.post('/', writeGuard, async (req, res, next) => {
    try {
        const {
            title,
            description,
            type,
            difficulty,
            duration,
            passingScore,
            totalPoints,
            startDate,
            endDate,
            settings,
            courseCode,
            courseName,
            professorName,
            createdById,
            questionIds,
            status,
        } = createSchema.parse(req.body);

        const requesterId = createdById || (req as any).user?.sub;
        if (!requesterId) return sendError(res, 400, 'createdById is required');

        const assessment = await prisma.assessment.create({
            data: {
                title,
                description,
                type: type?.toUpperCase() || 'QUIZ',
                difficulty: difficulty?.toUpperCase() || 'MEDIUM',
                duration: duration || 60,
                passingScore: passingScore || 60,
                totalPoints: totalPoints || 100,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                settings: JSON.stringify(settings || {}),
                status: status?.toUpperCase() || 'DRAFT',
                courseCode,
                courseName,
                professorName,
                createdById: requesterId,
                questions: questionIds ? {
                    create: questionIds.map((qId: string, index: number) => ({
                        questionId: qId,
                        order: index + 1,
                    })),
                } : undefined,
            },
            include: {
                questions: true,
            },
        });

        return sendSuccess(res, formatAssessment(assessment), 201);
    } catch (error) {
        next(error);
    }
});

// PUT /api/v1/assessments/:id - Update assessment
router.put('/:id', writeGuard, async (req, res, next) => {
    try {
        const { title, description, type, difficulty, duration, passingScore, startDate, endDate, status, settings } = updateSchema.parse(req.body);

        const assessment = await prisma.assessment.update({
            where: { id: req.params.id },
            data: {
                ...(title && { title }),
                ...(description && { description }),
                ...(type && { type: type.toUpperCase() }),
                ...(difficulty && { difficulty: difficulty.toUpperCase() }),
                ...(duration && { duration }),
                ...(passingScore && { passingScore }),
                ...(startDate && { startDate: new Date(startDate) }),
                ...(endDate && { endDate: new Date(endDate) }),
                ...(status && { status: status.toUpperCase() }),
                ...(settings && { settings: JSON.stringify(settings) }),
            },
        });

        return sendSuccess(res, formatAssessment(assessment));
    } catch (error) {
        next(error);
    }
});

// POST /api/v1/assessments/:id/clone - Clone assessment
router.post('/:id/clone', writeGuard, async (req, res, next) => {
    try {
        const original = await prisma.assessment.findUnique({
            where: { id: req.params.id },
            include: { questions: true },
        });
        if (!original) return sendError(res, 404, 'Assessment not found');

        const cloned = await prisma.assessment.create({
            data: {
                title: `${original.title} (Copy)`,
                description: original.description,
                type: original.type,
                difficulty: original.difficulty,
                duration: original.duration,
                passingScore: original.passingScore,
                totalPoints: original.totalPoints,
                startDate: original.startDate,
                endDate: original.endDate,
                status: 'DRAFT',
                settings: original.settings,
                courseCode: original.courseCode,
                courseName: original.courseName,
                professorName: original.professorName,
                createdById: original.createdById,
                questions: original.questions.length
                    ? {
                        create: original.questions.map((q, idx) => ({
                            questionId: q.questionId,
                            order: idx + 1,
                        })),
                    }
                    : undefined,
            },
        });

        return sendSuccess(res, formatAssessment(cloned), 201);
    } catch (error) {
        next(error);
    }
});

// POST /api/v1/assessments/:id/attempts - start attempt for current user
router.post('/:id/attempts', async (req, res, next) => {
    try {
        const user = (req as any).user;
        if (!user?.sub) return sendError(res, 401, 'Unauthorized');

        const assessment = await prisma.assessment.findUnique({ where: { id: req.params.id } });
        if (!assessment) return sendError(res, 404, 'Assessment not found');

        const attempt = await prisma.assessmentAttempt.upsert({
            where: { userId_assessmentId: { userId: user.sub, assessmentId: req.params.id } },
            create: {
                assessmentId: req.params.id,
                userId: user.sub,
                status: 'IN_PROGRESS',
            },
            update: { status: 'IN_PROGRESS', startedAt: new Date() },
        });

        return sendSuccess(res, {
            ...attempt,
            status: attempt.status?.toLowerCase(),
        }, 201);
    } catch (error) {
        next(error);
    }
});

// POST /api/v1/assessments/:id/publish - Publish assessment
router.post('/:id/publish', writeGuard, async (req, res, next) => {
    try {
        const assessment = await prisma.assessment.update({
            where: { id: req.params.id },
            data: { status: 'PUBLISHED' },
        });

        return sendSuccess(res, formatAssessment(assessment));
    } catch (error) {
        next(error);
    }
});

// DELETE /api/v1/assessments/:id - Delete assessment
router.delete('/:id', writeGuard, async (req, res, next) => {
    try {
        await prisma.assessment.delete({
            where: { id: req.params.id },
        });

        return sendSuccess(res, { message: 'Assessment deleted successfully' });
    } catch (error) {
        next(error);
    }
});

export default router;
