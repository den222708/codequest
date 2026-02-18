import { Router } from 'express';
import prisma from '../lib/prisma';
import { sendSuccess, sendError } from '../utils/response';
import { z } from 'zod';

const router = Router();

// GET /api/v1/analytics/dashboard - Get dashboard analytics
router.get('/dashboard', async (req, res, next) => {
    try {
        const [
            totalUsers,
            totalAssessments,
            totalSubmissions,
            activeAssessments,
            usersByRole,
            recentSubmissions,
        ] = await Promise.all([
            prisma.user.count(),
            prisma.assessment.count(),
            prisma.submission.count(),
            prisma.assessment.count({ where: { status: 'ACTIVE' } }),
            prisma.user.groupBy({
                by: ['role'],
                _count: true,
            }),
            prisma.submission.findMany({
                take: 10,
                orderBy: { submittedAt: 'desc' },
                include: {
                    user: { select: { name: true } },
                    question: { select: { title: true } },
                },
            }),
        ]);

        return sendSuccess(res, {
            overview: {
                totalUsers,
                totalAssessments,
                totalSubmissions,
                activeAssessments,
            },
            usersByRole: usersByRole.reduce((acc, item) => {
                acc[item.role.toLowerCase()] = item._count;
                return acc;
            }, {} as Record<string, number>),
            recentSubmissions: recentSubmissions.map(s => ({
                id: s.id,
                userName: s.user.name,
                questionTitle: s.question.title,
                status: s.status,
                score: s.score,
                submittedAt: s.submittedAt,
            })),
            // Simulated chart data
            performanceTrend: [
                { month: 'Jan', avgScore: 72 },
                { month: 'Feb', avgScore: 75 },
                { month: 'Mar', avgScore: 78 },
                { month: 'Apr', avgScore: 74 },
                { month: 'May', avgScore: 82 },
                { month: 'Jun', avgScore: 85 },
            ],
            submissionsByLanguage: [
                { language: 'Python', count: 450 },
                { language: 'JavaScript', count: 320 },
                { language: 'Java', count: 180 },
                { language: 'C++', count: 120 },
            ],
        });
    } catch (error) {
        next(error);
    }
});

// GET /api/v1/analytics/student/:studentId - Get student analytics
const studentSchema = z.object({
    studentId: z.string(),
});

router.get('/student/:studentId', async (req, res, next) => {
    try {
        const { studentId } = studentSchema.parse(req.params);

        const [user, submissions, attempts] = await Promise.all([
            prisma.user.findUnique({
                where: { id: studentId },
                select: { id: true, name: true, email: true, department: true },
            }),
            prisma.submission.findMany({
                where: { userId: studentId },
                include: {
                    question: { select: { title: true, difficulty: true, topic: true } },
                },
                orderBy: { submittedAt: 'desc' },
            }),
            prisma.assessmentAttempt.findMany({
                where: { userId: studentId },
                include: {
                    assessment: { select: { title: true, type: true } },
                },
            }),
        ]);

        if (!user) {
            return res.status(404).json({ error: 'Student not found' });
        }

        const totalSubmissions = submissions.length;
        const acceptedSubmissions = submissions.filter(s => s.status === 'ACCEPTED').length;
        const avgScore = submissions.reduce((acc, s) => acc + (s.score || 0), 0) / (totalSubmissions || 1);

        return sendSuccess(res, {
            student: user,
            stats: {
                totalSubmissions,
                acceptedSubmissions,
                acceptanceRate: totalSubmissions ? Math.round((acceptedSubmissions / totalSubmissions) * 100) : 0,
                avgScore: Math.round(avgScore),
                totalAttempts: attempts.length,
                completedAttempts: attempts.filter(a => a.status === 'SUBMITTED' || a.status === 'GRADED').length,
            },
            recentSubmissions: submissions.slice(0, 10),
            assessmentHistory: attempts,
            // Simulated progress data
            progressByTopic: [
                { topic: 'Arrays', solved: 12, total: 15, percentage: 80 },
                { topic: 'Strings', solved: 8, total: 12, percentage: 67 },
                { topic: 'Dynamic Programming', solved: 5, total: 20, percentage: 25 },
                { topic: 'Graphs', solved: 3, total: 10, percentage: 30 },
            ],
        });
    } catch (error) {
        next(error);
    }
});

// GET /api/v1/analytics/assessment/:assessmentId - Get assessment analytics
const assessmentSchema = z.object({
    assessmentId: z.string(),
});

router.get('/assessment/:assessmentId', async (req, res, next) => {
    try {
        const { assessmentId } = assessmentSchema.parse(req.params);

        const assessment = await prisma.assessment.findUnique({
            where: { id: assessmentId },
            include: {
                attempts: {
                    include: {
                        user: { select: { name: true } },
                    },
                },
                _count: { select: { attempts: true } },
            },
        });

        if (!assessment) {
            return sendError(res, 404, 'Assessment not found');
        }

        const scoredAttempts = assessment.attempts.filter(a => a.score !== null);
        const avgScore = scoredAttempts.reduce((acc, a) => acc + (a.score || 0), 0) / (scoredAttempts.length || 1);

        return sendSuccess(res, {
            assessment: {
                id: assessment.id,
                title: assessment.title,
                type: assessment.type,
                difficulty: assessment.difficulty,
            },
            stats: {
                totalAttempts: assessment._count.attempts,
                completedAttempts: scoredAttempts.length,
                avgScore: Math.round(avgScore),
                passRate: Math.round((scoredAttempts.filter(a => (a.score || 0) >= assessment.passingScore).length / (scoredAttempts.length || 1)) * 100),
            },
            attempts: assessment.attempts.map(a => ({
                id: a.id,
                studentName: a.user.name,
                score: a.score,
                status: a.status,
                startedAt: a.startedAt,
                submittedAt: a.submittedAt,
            })),
            // Simulated distribution
            scoreDistribution: [
                { range: '0-20', count: 2 },
                { range: '21-40', count: 5 },
                { range: '41-60', count: 12 },
                { range: '61-80', count: 25 },
                { range: '81-100', count: 18 },
            ],
        });
    } catch (error) {
        next(error);
    }
});

export default router;
