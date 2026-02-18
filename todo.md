# TODO (CodeQuest) – 2026-02-09

## Auth & Security
- ✅ Replace plaintext passwords with hashed storage (bcrypt) in creation/seed and updates.
- ✅ Add JWT auth endpoints (login/signup/refresh/forgot/reset) and auth middleware; still need session timeout & persistent lockout + refresh persistence/blacklist (currently in-memory).
- ✅ Wire role-based guards on API routes; align role/status enums across frontend/backend remains.
- ✅ Enforce basic password complexity via zod validation.
- ✅ Add logout endpoint that revokes current refresh jti.

## Backend Data & API
- ✅ Parse/return JSON fields (settings/tags/boilerplateCode/includes/results) for reads; normalize enums to lowercase on responses.
- ✅ Fix BigInt serialization for backups; standardize backup size units. (serialization done; units still TODO)
- ✅ Add clone endpoint and attempt creation for assessments; still need status enums and question type scaffolding (MCQ/short/TF/file upload).
- ✅ Implement request validation + envelope on auth/users/questions/assessments/submissions/execute/analytics/system; remaining: roles/status alignments, backup size units.
- ✅ Update CORS to include Vite dev origin (5173) + env override.
- ✅ Add helmet, global rate limit, and auth-specific rate limit.

## Execution, Plagiarism, Realtime
- Integrate real code executor (Judge0/Piston) with limits & queue; remove random scoring.
- Add plagiarism pipeline + endpoints; hook to submissions.
- Add WebSocket layer for live monitor/proctor events.

## Frontend Integration
- Replace mock AppContext data with API client; move login/signup to backend; persist sessions.
- Normalize role/status casing; handle JSON fields; apply response envelope handling.
- Apply design tokens/a11y checklist globally; add focus/aria improvements.

## DevOps & Observability
- Move DB to Postgres + migrations; remove committed secrets; env handling.
- Add structured logging, error tracking, health metrics; email service for notifications.

## Quick wins (start here)
- ✅ Fix CORS origin, BigInt backup response, JSON parsing, enum casing consistency.
- ✅ Add minimal auth hashing + tokens (login/signup/refresh). Middleware exists; still need forgot/reset + guards.

---

# Update Log – 2026-02-18

## Demo Mode + Assessment Flow
- ✅ Fixed demo bootstrap race and stuck loader behavior by making `startDemoMode()` idempotent (promise-guarded).
- ✅ Updated `/demo` loading flow to run bootstrap + progress animation together with timeout protection.
- ✅ Switched demo auth reset to direct token clear (no logout API dependency during demo bootstrap).
- ✅ Added explicit empty-state handling in editor when question payload is missing (no fake fallback problem data).
- ✅ Auto-collapse problem sidebar when assessment starts.

## Secure Fullscreen / Proctoring UX
- ✅ Added secure-mode grace window + in-progress fullscreen request guard to avoid false immediate violations.
- ✅ Added small transition delay after entering fullscreen from instructions before moving to editor.

## Real Code Execution (Judge0) – No Fake Results
- ✅ Replaced legacy simulated executor path in `backend/src/routes/execute.ts` with Judge0-only execution.
- ✅ Removed simulator fallback from backend provider flow (self-host / rapidapi / auto only).
- ✅ Removed frontend demo fallback result generation from editor run/submit paths.
- ✅ Removed randomized score/status backfill in `backend/src/routes/submissions.ts`.
- ✅ Deleted legacy simulated frontend service `services/codeExecutionService.ts` and export wiring.

## Execution Output Fidelity (Compiler/Runtime Diagnostics)
- ✅ Extended execute API payload to include real Judge0 fields:
  - `stdout`, `stderr`, `compileOutput`, `message`
  - `status { id, description }`, `token`, `exitCode`, `exitSignal`
  - `executionTime`, `wallTime`, `memoryUsed`
- ✅ Extended run-tests payload to return per-test rich diagnostics (`status`, `token`, `stderr`, `compileOutput`, `message`, timings, memory).
- ✅ Tightened testcase comparison to strict output matching (newline normalization only; no contains/loose match).
- ✅ Updated frontend console + test-result UI to render separate formatted sections for stdout/stderr/compile output/message.

## Verified Today
- ✅ Frontend build passes (`npm run build`).
- ✅ Backend build passes (`npm run build` in `backend/`).
- ✅ Provider endpoint confirms active self-host Judge0.
- ✅ Runtime errors return real traceback with line numbers.
- ✅ Compilation errors return real compiler diagnostics (Java/C++ line+caret output).
- ✅ Wrong solutions (e.g., `print("Hello World")`) correctly fail unrelated testcases.
- ✅ Strict output check verified (`"1, 2"` vs `"1,2"` now fails).

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
5. Configure this project backend (`backend/.env`):
   - `EXECUTOR_PROVIDER=self-host`
   - `JUDGE0_BASE_URL=http://localhost:2358`
   - `JUDGE0_AUTH_TOKEN=` (set only if your Judge0 instance requires it)
6. Restart backend and verify project integration:
   - `curl http://localhost:3001/api/v1/execute/provider`
   - `curl -X POST http://localhost:3001/api/v1/execute -H "Content-Type: application/json" -d "{\"code\":\"print('ok')\",\"language\":\"python\"}"`

### Optional Ops Commands
- Stop Judge0: `docker compose down`
- Stop + remove volumes: `docker compose down -v`
- View logs: `docker compose logs -f`
