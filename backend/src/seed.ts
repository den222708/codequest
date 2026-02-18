import prisma from './lib/prisma';
import bcrypt from 'bcryptjs';

async function main() {
    console.log('🌱 Seeding database...');

    // Create users
    const users = await Promise.all([
        prisma.user.upsert({
            where: { email: 'alex@university.edu' },
            update: {},
            create: {
                email: 'alex@university.edu',
                name: 'Alex Johnson',
                password: await bcrypt.hash('password123', 12),
                role: 'STUDENT',
                avatar: 'AJ',
                department: 'Computer Science',
                enrollmentId: 'CS2024001',
                status: 'ACTIVE',
            },
        }),
        prisma.user.upsert({
            where: { email: 'turing@university.edu' },
            update: {},
            create: {
                email: 'turing@university.edu',
                name: 'Prof. Alan Turing',
                password: await bcrypt.hash('password123', 12),
                role: 'PROFESSOR',
                avatar: 'AT',
                department: 'Computer Science',
                employeeId: 'EMP001',
                status: 'ACTIVE',
            },
        }),
        prisma.user.upsert({
            where: { email: 'admin@university.edu' },
            update: {},
            create: {
                email: 'admin@university.edu',
                name: 'Admin Sarah',
                password: await bcrypt.hash('password123', 12),
                role: 'ADMIN',
                avatar: 'AS',
                department: 'IT Department',
                employeeId: 'ADM001',
                status: 'ACTIVE',
            },
        }),
        prisma.user.upsert({
            where: { email: 'subadmin@university.edu' },
            update: {},
            create: {
                email: 'subadmin@university.edu',
                name: 'Sub Admin Mike',
                password: await bcrypt.hash('password123', 12),
                role: 'SUBADMIN',
                avatar: 'SM',
                department: 'IT Department',
                employeeId: 'SADM001',
                status: 'ACTIVE',
            },
        }),
        prisma.user.upsert({
            where: { email: 'superadmin@university.edu' },
            update: {},
            create: {
                email: 'superadmin@university.edu',
                name: 'Super Admin Grace',
                password: await bcrypt.hash('password123', 12),
                role: 'SUPERADMIN',
                avatar: 'SG',
                department: 'IT Department',
                employeeId: 'SUPADM001',
                status: 'ACTIVE',
            },
        }),
    ]);

    console.log(`✅ Created ${users.length} users`);

    // Find professor for questions/assessments
    const professor = users.find(u => u.role === 'PROFESSOR')!;
    const student = users.find(u => u.role === 'STUDENT')!;

    // Create questions
    const question1 = await prisma.question.upsert({
        where: { id: 'q-two-sum' },
        update: {},
        create: {
            id: 'q-two-sum',
            title: 'Two Sum',
            description: `Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.

You may assume that each input would have exactly one solution, and you may not use the same element twice.

**Example 1:**
Input: nums = [2,7,11,15], target = 9
Output: [0,1]

**Example 2:**
Input: nums = [3,2,4], target = 6
Output: [1,2]`,
            difficulty: 'EASY',
            topic: 'Arrays',
            tags: JSON.stringify(['arrays', 'hash-table', 'two-pointers']),
            points: 50,
            timeLimit: 2,
            memoryLimit: 256,
            boilerplateCode: JSON.stringify({
                python: 'def twoSum(nums: list[int], target: int) -> list[int]:\n    # Write your solution here\n    pass',
                javascript: 'function twoSum(nums, target) {\n    // Write your solution here\n}',
            }),
            createdById: professor.id,
            testCases: {
                create: [
                    { input: '[2,7,11,15]\n9', expectedOutput: '[0,1]', isHidden: false, points: 25, timeLimit: 2000 },
                    { input: '[3,2,4]\n6', expectedOutput: '[1,2]', isHidden: false, points: 25, timeLimit: 2000 },
                    { input: '[3,3]\n6', expectedOutput: '[0,1]', isHidden: true, points: 25, timeLimit: 2000 },
                    { input: '[1,2,3,4,5]\n9', expectedOutput: '[3,4]', isHidden: true, points: 25, timeLimit: 2000 },
                ],
            },
        },
    });

    const question2 = await prisma.question.upsert({
        where: { id: 'q-valid-parens' },
        update: {},
        create: {
            id: 'q-valid-parens',
            title: 'Valid Parentheses',
            description: `Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.

An input string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.

**Example 1:**
Input: s = "()"
Output: true

**Example 2:**
Input: s = "()[]{}"
Output: true`,
            difficulty: 'EASY',
            topic: 'Stacks',
            tags: JSON.stringify(['stack', 'string']),
            points: 50,
            timeLimit: 2,
            memoryLimit: 256,
            boilerplateCode: JSON.stringify({
                python: 'def isValid(s: str) -> bool:\n    # Write your solution here\n    pass',
                javascript: 'function isValid(s) {\n    // Write your solution here\n}',
            }),
            createdById: professor.id,
            testCases: {
                create: [
                    { input: '()', expectedOutput: 'true', isHidden: false, points: 25, timeLimit: 2000 },
                    { input: '()[]{}', expectedOutput: 'true', isHidden: false, points: 25, timeLimit: 2000 },
                    { input: '(]', expectedOutput: 'false', isHidden: true, points: 25, timeLimit: 2000 },
                    { input: '([)]', expectedOutput: 'false', isHidden: true, points: 25, timeLimit: 2000 },
                ],
            },
        },
    });

    console.log('✅ Created 2 questions');

    // Create assessments
    await prisma.assessment.upsert({
        where: { id: 'assess-1' },
        update: {},
        create: {
            id: 'assess-1',
            title: 'Data Structures Midterm',
            description: 'Comprehensive assessment covering arrays, linked lists, stacks, and queues.',
            type: 'EXAM',
            difficulty: 'MEDIUM',
            duration: 90,
            passingScore: 70,
            totalPoints: 100,
            startDate: new Date('2026-01-15T10:00:00Z'),
            endDate: new Date('2026-01-15T12:00:00Z'),
            status: 'PUBLISHED',
            settings: JSON.stringify({
                randomizeQuestions: true,
                showCorrectAnswers: false,
                allowRetakes: false,
            }),
            courseCode: 'CS-201',
            courseName: 'Data Structures',
            professorName: 'Prof. Alan Turing',
            createdById: professor.id,
            questions: {
                create: [
                    { questionId: question1.id, order: 1 },
                    { questionId: question2.id, order: 2 },
                ],
            },
        },
    });

    await prisma.assessment.upsert({
        where: { id: 'assess-2' },
        update: {},
        create: {
            id: 'assess-2',
            title: 'Python Basics Quiz',
            description: 'Practice quiz on Python fundamentals.',
            type: 'QUIZ',
            difficulty: 'EASY',
            duration: 45,
            passingScore: 60,
            totalPoints: 50,
            startDate: new Date('2026-01-10T14:00:00Z'),
            endDate: new Date('2026-01-20T23:59:00Z'),
            status: 'ACTIVE',
            settings: JSON.stringify({
                randomizeQuestions: false,
                showCorrectAnswers: true,
                allowRetakes: true,
                maxAttempts: 3,
            }),
            courseCode: 'CS-101',
            courseName: 'Introduction to Programming',
            professorName: 'Prof. Alan Turing',
            createdById: professor.id,
            questions: {
                create: [
                    { questionId: question1.id, order: 1 },
                ],
            },
        },
    });

    console.log('✅ Created 2 assessments');

    // Create some system logs (one by one)
    await prisma.systemLog.create({
        data: { level: 'INFO', category: 'auth', message: 'User logged in successfully', userId: student.id, ipAddress: '192.168.1.100' },
    });
    await prisma.systemLog.create({
        data: { level: 'INFO', category: 'submission', message: 'Code submitted for Two Sum', userId: student.id, ipAddress: '192.168.1.100' },
    });
    await prisma.systemLog.create({
        data: { level: 'WARNING', category: 'security', message: 'Multiple failed login attempts detected', ipAddress: '192.168.1.200' },
    });
    await prisma.systemLog.create({
        data: { level: 'INFO', category: 'assessment', message: 'New assessment created: Data Structures Midterm', userId: professor.id, ipAddress: '192.168.1.50' },
    });

    console.log('✅ Created system logs');

    // Create leaderboard entry
    await prisma.leaderboardEntry.upsert({
        where: { userId: student.id },
        update: {},
        create: {
            rank: 1,
            totalScore: 2850,
            problemsSolved: 45,
            avgTime: 12.5,
            streak: 15,
            userId: student.id,
            userName: student.name,
            userAvatar: student.avatar,
            department: student.department
        },
    });

    console.log('✅ Created leaderboard entries');
    console.log('🎉 Database seeding completed!');
}

main()
    .catch((e) => {
        console.error('❌ Seeding failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
