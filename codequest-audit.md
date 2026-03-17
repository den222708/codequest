# CodeQuest Audit Findings (2026-02-09)

## Critical backend gaps
- **Authentication missing**: No JWT/session middleware anywhere; every endpoint under `/api/v1/*` is publicly writable (e.g., `backend/src/server.ts`, route files).
- **Plaintext credentials**: User creation stores raw passwords and even defaults to `default123`; seeding also inserts `password123` without hashing (`backend/src/routes/users.ts`, `backend/src/seed.ts`).
- **Casing/enum mismatch with UI**: API stores roles/status in uppercase (e.g., `role: 'STUDENT'`, `status: 'ACTIVE'`) but the React app uses lowercase strings everywhere (`types.ts`, `store/AppContext.tsx`). Filters/updates will silently fail once wired to the API.
- **JSON fields returned as strings**: `settings`, `tags`, `boilerplateCode`, `includes`, and submission `results` are stored stringified but not parsed on reads (see `backend/src/routes/{questions,assessments,system}.ts`). Clients will receive string blobs instead of objects/arrays.
- **BigInt serialization crash**: `GET /api/v1/system/backups` returns Prisma `BigInt` values; `res.json(backups)` will throw `TypeError: Do not know how to serialize a BigInt` (already worked around only for create). File: `backend/src/routes/system.ts` line ~70.
- **CORS origin mismatch**: Server allows `http://localhost:3000` but the Vite app runs on `http://localhost:5173` by default (`backend/src/server.ts`). Cross-origin calls will be blocked in local/dev.

## High-risk functionality holes
- **Frontend not connected to backend**: All data/state comes from `data/mockData.ts`; no API calls or persistence. Actions mutate in-memory context only (`store/AppContext.tsx`).
- **Login is a stub**: Auth accepts any password ≥6 chars if email exists in mock list; no backend check, no tokens, no refresh logic (`store/AppContext.tsx`).
- **Route protection is client-only**: `ProtectedRoute`/`RoleBasedRoute` gate solely on context state; without server-side auth an attacker can bypass by editing local storage.
- **Execution/grading is simulated**: `/api/v1/execute` returns canned output; `/api/v1/submissions` randomly assigns scores asynchronously after responding. No isolation, no Judge0/Piston integration, no safety limits.
- **Assessment/question status drift**: UI uses lowercase statuses (`draft`, `active`, `published`) while backend expects uppercase (`DRAFT`, `ACTIVE`, `PUBLISHED`). Data written by UI will not match backend filters.
<div align="right"><sub>Updated: Feb 10, 2026 — see “Progress since initial audit” for resolved items.</sub></div>

## Progress since initial audit (Feb 10, 2026)
- Added JWT auth endpoints (login/signup/refresh/forgot/reset/logout), bcrypt hashing for create/update/seed, and role-based route guards; login lockout and refresh rotation (in-memory) implemented.
- CORS now allows localhost:5173; helmet added; global and auth-specific rate limits enabled.
- JSON parsing/casing normalization applied to users, questions, assessments, submissions; backup serialization fixed with sizeBytes/sizeMB; response envelope helper added and used across major routes.
- Assessment clone and attempt creation endpoints added; question `type` scaffolding (MCQ/short/TF/file-upload ready) added to schema; QuestionTypeMeta model introduced.
- Zod validation added for auth, users, questions, assessments, submissions, execute, analytics, system logs.
- Build now passes after type shims and schema updates.

## Remaining gaps (priority) — Updated 2026-03-11
- ~~Persist lockout/refresh blacklist and enforce session timeout~~ — **DONE** (token blacklist, 30-min timeout, lockout after 5 attempts, concurrent session limit)
- ~~Align role/status enums end-to-end~~ — **DONE** (3-role model: student/teacher|professor/admin)
- ~~Replace simulated executor~~ — **DONE** (Programiz primary, Judge0 fallback)
- ~~Notification backend~~ — **DONE** (CRUD endpoints in bennett-backend)
- ~~Password history + expiry~~ — **DONE** (cannot reuse last 5, 90-day expiry)
- Flesh out question type behavior (MCQ/short/TF/file upload) and assessment status enums.
- Add real plagiarism detection (MOSS/Dolos integration).
- Add WebSocket live-monitor pipeline.
- Add structured logging, error tracking, email service, observability.

## Medium issues / polish
- **SQLite default for production**: `DATABASE_URL` points to a local SQLite file; lacks migrations/setup for Postgres/MySQL if needed.
- **Rate limiting coarse**: Global limiter on `/api` only; no per-user/IP differentiation for sensitive routes like auth or execute.
- **Missing input validation**: Routes accept request bodies directly into Prisma without schema/validation; risk of invalid data or oversized payloads.
- **Backup size units inconsistent**: Seeder writes `size` as Int KB/MB, routes return BigInt bytes; standardize and document units.
- **Dev secrets in repo**: `.env` committed with JWT secrets and DB path; should use env vars and gitignore.

## Spec & PRD alignment gaps (from md files)
- **Auth/security requirements unmet**: PRD and production checklist call for MFA option, password policy (8+ chars with complexity, rotation/history), session timeout/lockout, and JWT-based auth; none exist in code.
- **Required auth endpoints missing**: No `/auth/login/signup/refresh/forgot/reset` APIs; only basic `/users` CRUD present (`Production-Checklist.md`, PRD §7.2, §6.1).
- **Role model mismatch**: PRD uses numeric role IDs and limited roles (student/prof/admin), while app mixes string roles including subadmin/superadmin; no mapping layer to spec (Roles & Permissions spec vs `types.ts`/Prisma schema).
- **Response contract not followed**: PRD expects `{success,data,error,timestamp}` envelope; current APIs return raw Prisma objects or errors.
- **Question/assessment features incomplete**: No MCQ/short-answer/file-upload question types; no negative marking, partial scoring flags, or IP restriction enforcement (PRD §6.3.3, §6.3.2).
- **Assessment lifecycle gaps**: Checklist requires `/assessments/:id/clone` and publish/attempt endpoints; clone is missing, attempts not exposed, status enums diverge.
- **Analytics scope narrow**: PRD specifies system/class/student analytics with exports; backend only exposes basic dashboard/student/assessment and no CSV/PDF export.
- **Plagiarism requirements unmet**: Spec calls for similarity highlighting, queue, MOSS integration; current plagiarism service is mock-only and backend lacks endpoints.
- **Real-time monitoring absent**: Production checklist requires WebSocket events for live monitor/proctoring; frontend uses mock `mockActiveSessions` with no socket client.
- **Code execution requirements unmet**: PRD demands sandboxed Docker/Judge, time/memory enforcement, test-case scoring; backend just simulates output without queues/limits.
- **Backup/restore UX vs API**: Spec calls for restore approvals and history; API returns backups but restore endpoint is stubbed with static response and BigInt issues.
- **Email flows missing**: Checklist lists welcome/reset/invite emails; no email service or templates exist.
- **Monitoring/observability missing**: No structured logging, APM, Sentry, or health metrics beyond a simple `/health`.
- **Accessibility & UX tokens not applied**: UI/UX doc defines color/typography tokens and a11y checklist (WCAG, focus rings, skip links), but global styles use ad-hoc Tailwind-esque classes and no token variables; many components lack aria labels.

## Recommended next steps
1) Add real auth: hash passwords (bcrypt), issue JWT/refresh tokens, middleware + role guards; implement `/auth` endpoints per PRD and enforce password/MFA policies.
2) Normalize enums/roles/status: single source of truth mapping spec ↔ UI ↔ DB; store lowercase or uppercase consistently and migrate existing data.
3) Parse/serialize JSON fields properly (Prisma `Json` type) and fix backup BigInt serialization; standardize size units.
4) Implement question/assessment features per PRD: MCQ/short-answer types, partial/negative scoring flags, IP restriction enforcement, clone endpoint, attempt tracking.
5) Replace mock frontend state with real API client; wire login/signup, assessments, questions, submissions, notifications, backups to backend.
6) Integrate real executor (Judge0/Piston or Docker sandbox) with limits/queue; implement plagiarism pipeline and live-monitor WebSocket events.
7) Add request validation (Zod/express-validator), rate limiting per route, structured logging + APM, email service, and align responses to `{success,data,error,timestamp}`.
8) Apply UI/UX tokens and accessibility checklist globally (colors, typography, focus states, aria labels); add Storybook or design-token export.
9) Move to production DB (Postgres), add migrations/seed parity, and remove committed secrets; ensure backup/restore flows meet checklist.
