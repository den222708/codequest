# TODO (CodeQuest) — Updated 2026-03-14

## Completed

### Auth & Security
- [x] Replace plaintext passwords with hashed storage (bcrypt)
- [x] JWT auth endpoints (login/signup/refresh/forgot/reset) + middleware
- [x] Role-based guards on API routes; 3-role model (student/teacher/admin)
- [x] Password complexity via Zod (8+ chars, uppercase, lowercase, digit, special char)
- [x] Logout endpoint with token blacklisting (persistent in DB)
- [x] Account lockout after 5 failed login attempts (15-min lockout)
- [x] Session inactivity timeout (30 minutes, server-enforced)
- [x] Concurrent session limit (max 2 per user)
- [x] Password history (cannot reuse last 5 passwords)
- [x] Password expiry (90-day enforcement in auth middleware)
- [x] Password change endpoint (POST /auth/change-password)
- [x] CORS env-configurable; localhost-only fallback in dev
- [x] Helmet, global rate limit, auth-specific rate limit
- [x] .gitignore covers **/.env and .env.*
- [x] Rate limits read from env vars (RATE_LIMIT_GLOBAL, RATE_LIMIT_AUTH, RATE_LIMIT_EXECUTE)
- [x] Auth rate limiting on login/signup/forgot-password endpoints

### Backend Data & API
- [x] JSON field parsing/normalization on all reads
- [x] Response envelope ({success, data, error, timestamp}) on all endpoints
- [x] Zod validation on all route inputs
- [x] Assessment clone, attempt creation, publish-via-update
- [x] Backup CRUD endpoints (POST/DELETE /system/backups)
- [x] Plagiarism review endpoint (PUT /system/plagiarism/:id/review)
- [x] Notification CRUD endpoints (GET/PUT/DELETE /notifications)
- [x] System health endpoint (GET /system/health) with real DB + memory metrics
- [x] System stats endpoint (GET /system/stats)
- [x] Activity logs endpoint (GET /system/logs)

### Code Execution
- [x] Programiz WebSocket proxy (primary executor, no API key needed)
- [x] Judge0 fallback for unsupported languages
- [x] Stdin injection per language (Python, C++, C, Java, JavaScript)
- [x] Test runner with strict output matching

### Frontend
- [x] All services wired to backend API (auth, assessments, questions, submissions, execute)
- [x] Role/status enum alignment (frontend professor = backend teacher)
- [x] subadmin/superadmin removed from frontend (3-role model)
- [x] System health wired to real /system/health endpoint
- [x] Plagiarism service: removed fake delay, local comparison functional

### Database & Migrations
- [x] Supabase (Postgres) with full migration SQL
- [x] RLS policies on all tables
- [x] token_blacklist, active_sessions, backups, plagiarism_results tables
- [x] notifications table + RLS
- [x] password_history table + profile password_changed_at column
- [x] Assessment monitoring_mode column ('standard' | 'proctored')
- [x] monitoring_events table + RLS (Phase 6)

### Foundation & Cleanup (Phase 0 — 2026-03-14)
- [x] Deleted dead `data/mockData.ts` (1197 lines, zero imports)
- [x] Split `bennett-backend/src/index.ts` into `app.ts` + `index.ts` (testable app export)
- [x] Fixed hardcoded rate limits → env var driven (RATE_LIMITS constant object)
- [x] Added auth rate limiting to login/signup/forgot-password
- [x] Untracked `.env.production` from git
- [x] Updated `tsconfig.json` exclude (removed stale `backend` reference)
- [x] Installed Vitest + testing libraries (frontend: RTL, jsdom, msw; backend: vitest)
- [x] Created vitest configs and test scripts for both projects
- [x] Created `to-delete.md` for locked backend/ directory

### AppContext Split (Phase 1 — 2026-03-14)
- [x] Split AppContext (916 lines) into 7 domain contexts (Auth, Assessment, Question, Submission, Notification, Admin, UI)
- [x] Bridge migration pattern: AppContext re-exports merged interface via useApp()
- [x] ContextWiring component wires cross-context refs (login callbacks, data refs)
- [x] Zero consumer changes needed — backward-compatible

### Programiz Proxy Hardening (Phase 2 — 2026-03-14)
- [x] Circuit breaker with 3 health states (GOOD/DEGRADED/BAD), SEB TransmissionSpooler-inspired
- [x] ConcurrencyLimiter semaphore (default 6 connections)
- [x] Endpoint pool rotation + retry with exponential backoff
- [x] Judge0 Docker executor + admin toggle (GET/PUT /system/execution-backend)
- [x] ExecutionDispatcher routing layer (all routes import from dispatcher)

### Testing Infrastructure (Phase 3 — 2026-03-14)
- [x] Backend: 65 tests across 7 files (circuitBreaker, fingerprint, languages, cache, rateLimit, executionDispatcher, judge0Executor)
- [x] Frontend: 66 tests across 5 files (UIContext, NotificationContext, draftService, apiClient, types/ROLE_PERMISSIONS)
- [x] Total: 131 tests, all passing
- [x] Fixed NotificationContext.test.tsx Date.now() ID collision bug

### Notifications Full Stack Wiring (Phase 4 — 2026-03-14)
- [x] Created notificationService.ts with fire-and-forget helpers (create, bulk, assessmentPublished, submissionGraded, attemptCompleted, accountCreated, notifyAdmins)
- [x] Backend triggers: assessments (publish), submissions (graded + attempt complete), admin (user create), system (backup create)
- [x] Expanded Notification type to include assessment/submission/system
- [x] Updated Notifications screen with icons/colors for new types
- [x] Rewrote NotificationContext — hybrid client+server, 30s polling, maps isRead→read, optimistic updates
- [x] Fixed provider order (NotificationProvider inside AuthProvider)
- [x] Added unreadCount, deleteNotification, refreshNotifications to bridge interface
- [x] Total: 132 tests, all green

### Server-Side Plagiarism Detection (Phase 5 — 2026-03-14)
- [x] Created winnowing algorithm service (plagiarismDetector.ts) — MOSS paper implementation
- [x] Pipeline: comment/string strip → identifier normalization → k-gram rolling hash → winnowing → pairwise comparison
- [x] Added POST /system/plagiarism/scan/:assessmentId and GET /system/plagiarism/:assessmentId endpoints
- [x] Added submission_id, question_id columns + RLS policies to plagiarism_results table
- [x] Rewrote frontend plagiarismService.ts — thin API client replacing 289-line client-side Jaccard engine
- [x] Wired AdminContext with scanPlagiarism, loadPlagiarismResults, plagiarismSummary, plagiarismScanning
- [x] Updated AppContext bridge with new plagiarism functions
- [x] 34 tests for plagiarism detector (all passing)
- [x] Total: 166 tests, all green

### WebSocket Real-Time Monitoring & Proctoring (Phase 6 — 2026-03-14)
- [x] Created monitoringTypes.ts — comprehensive shared types (client/server/admin event maps, ViolationType, MonitoringSessionState, MonitoringEventRow)
- [x] Created socketServer.ts — Socket.IO server with /proctoring (student) and /admin (teacher/admin) namespaces
- [x] SEB-inspired patterns: heartbeat with sequential counter + gap detection, instruction queue + ack, event batch persistence every 5s, auto-warn at 3 violations, disconnected session 5-min retention
- [x] Updated index.ts — node:http createServer + getRequestListener for Hono/Socket.IO coexistence on same port
- [x] Extracted CORS_ORIGINS constant from app.ts (shared between Hono CORS and Socket.IO)
- [x] Added monitoring_events table to migration.sql (6 event types, 4 indexes, RLS for teacher/admin/student)
- [x] Created monitoringService.ts (frontend) — SEB-inspired client-side detector: visibilitychange, paste, copy/cut, fullscreen, offline/online, blur, devtools heuristic
- [x] Rewrote realtimeService.ts — Socket.IO client with StudentMonitoringClient (/proctoring) and AdminMonitoringClient (/admin), backward-compatible RealtimeService facade
- [x] Added 4 monitoring REST endpoints: GET events (paginated), POST events (standard mode fallback), GET sessions (live), GET summary (aggregated)
- [x] 14 backend tests (monitoringTypes contracts, socketServer helpers, event row structure)
- [x] 17 frontend tests (monitoring lifecycle, violation detection, listener cleanup, ViolationType coverage)
- [x] Total: 197 tests, all green

### Backend Hardening & Observability (Phase 7 — 2026-03-14)
- [x] Created Pino structured logger (logger.ts) — env-aware config (JSON prod, pretty dev), ISO timestamps, createChildLogger factory
- [x] Created Sentry integration (sentry.ts) — only active when SENTRY_DSN set, suppresses non-production, captureException/captureMessage wrappers
- [x] Created cleanup jobs (cleanupJobs.ts) — purgeExpiredTokens, purgeStaleActiveSessions, purgeOldMonitoringEvents, configurable intervals via env vars
- [x] Replaced all 28 console.* calls with Pino logger across 10 files (index.ts, app.ts, socketServer.ts, executionDispatcher.ts, circuitBreaker.ts, notificationService.ts, auth.ts, admin.ts, system.ts, auth middleware)
- [x] Added RLS policies for backups table (admin-only SELECT/INSERT/UPDATE/DELETE)
- [x] Wired Sentry + cleanup jobs + graceful shutdown into index.ts (SIGTERM/SIGINT handlers)
- [x] Updated .env.example with all new env vars (LOG_LEVEL, SENTRY_DSN, SENTRY_TRACES_SAMPLE_RATE, APP_VERSION, CLEANUP_INTERVAL_MINUTES, TOKEN_MAX_AGE_HOURS, SESSION_STALE_HOURS, MONITORING_RETENTION_DAYS, FRONTEND_URL)
- [x] 7 logger tests + 10 cleanupJobs tests (all passing)
- [x] Total: 214 tests (130 backend across 11 files + 84 frontend across 6 files), all green

## Remaining — Master Improvement Plan

### Phase 7: Backend Hardening & Observability (COMPLETE)
- [x] Pino structured logging (replace console.log/error)
- [x] Sentry error tracking (frontend + backend)
- [x] Cleanup jobs for expired token_blacklist and stale active_sessions
- [x] RLS policies for backups table (plagiarism_results RLS done in Phase 5)

### Phase 8: Frontend Polish (MEDIUM)
- [ ] MFA (optional TOTP via Supabase Auth MFA)
- [ ] Question types beyond code (MCQ, short-answer, true/false, file upload)
- [ ] Proctoring UI components
- [ ] Analytics CSV/PDF export

### Phase 9: Accessibility & Documentation (LOW)
- [ ] WCAG 2.1 AA audit (aria labels, focus rings, skip-link, design tokens)
- [ ] OpenAPI spec generation
- [ ] Updated README with architecture diagrams

## Judge0 Docker Setup (Self-Host)
1. Install Docker Desktop and make sure Docker is running.
2. Clone the official Judge0 repository in a separate folder:
   - `git clone https://github.com/judge0/judge0.git`
   - `cd judge0`
3. Copy env template and start Judge0 services:
   - `cp .env.example .env` (or duplicate manually on Windows)
   - `docker compose up -d`
4. Wait until containers are healthy, then verify Judge0 API:
   - `curl http://localhost:2358/languages`
5. Configure this project backend (`bennett-backend/.env`):
   - `EXECUTOR_PROVIDER=self-host`
   - `JUDGE0_BASE_URL=http://localhost:2358`
   - `JUDGE0_AUTH_TOKEN=` (set only if your Judge0 instance requires it)
6. Restart backend and verify project integration:
   - `curl http://localhost:3001/api/v1/execute/provider`
