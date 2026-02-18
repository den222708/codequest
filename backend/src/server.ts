import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import routes
import userRoutes from './routes/users';
import assessmentRoutes from './routes/assessments';
import questionRoutes from './routes/questions';
import submissionRoutes from './routes/submissions';
import executeRoutes from './routes/execute';
import analyticsRoutes from './routes/analytics';
import systemRoutes from './routes/system';
import authRoutes from './routes/auth';
import { requireAuth, requireRole } from './middleware/auth';

const app = express();
const PORT = process.env.PORT || 3001;
const disableRateLimit = process.env.DISABLE_RATE_LIMIT === 'true' || process.env.NODE_ENV !== 'production';
const demoModeEnabled = process.env.DEMO_MODE === 'true' || process.env.NODE_ENV !== 'production';
const isDemoExecuteRequest = (req: express.Request) =>
    demoModeEnabled &&
    req.path.startsWith('/v1/execute') &&
    req.header('x-codequest-demo') === 'true';

// Middleware
app.use(helmet());
app.use(cors({
    origin: process.env.FRONTEND_URL?.split(',') || [
        'http://localhost:5173',
        'http://localhost:3000',
        'https://codequest.qzz.io',
    ],
    credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));

// Rate limiting (disabled for local demo/dev)
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'),
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
    message: { error: 'Too many requests, please try again later.' },
});
if (!disableRateLimit) {
    app.use('/api', (req, res, next) => {
        if (isDemoExecuteRequest(req)) {
            return next();
        }

        return limiter(req, res, next);
    });
}

const authLimiter = disableRateLimit
    ? (req: express.Request, res: express.Response, next: express.NextFunction) => next()
    : rateLimit({
        windowMs: 60 * 1000,
        max: 10,
        message: { error: 'Too many auth attempts, please try again later.' },
    });

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/v1/auth', authLimiter, authRoutes);
app.use('/api/v1/users', requireAuth, requireRole(['admin', 'superadmin', 'subadmin']), userRoutes);
// Assessments & questions: all authenticated users can read, role-based write is handled in routes
app.use('/api/v1/assessments', requireAuth, assessmentRoutes);
app.use('/api/v1/questions', requireAuth, questionRoutes);
app.use('/api/v1/submissions', requireAuth, submissionRoutes); // all authenticated roles
if (demoModeEnabled) {
    app.use('/api/v1/execute', (req, res, next) => {
        if (req.header('x-codequest-demo') === 'true') {
            return next();
        }

        return requireAuth(req, res, next);
    }, executeRoutes);
} else {
    app.use('/api/v1/execute', requireAuth, executeRoutes);
}
app.use('/api/v1/analytics', requireAuth, requireRole(['professor', 'admin', 'superadmin', 'subadmin']), analyticsRoutes);
app.use('/api/v1/system', requireAuth, requireRole(['admin', 'superadmin', 'subadmin']), systemRoutes);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        error: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
});

// Start server
app.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════════╗
║                                              ║
║   🚀 CodeQuest API Server                    ║
║                                              ║
║   Server running at:                         ║
║   http://localhost:${PORT}                       ║
║                                              ║
║   Environment: ${process.env.NODE_ENV || 'development'}              ║
║                                              ║
╚══════════════════════════════════════════════╝
  `);
});

export default app;
