# Changelog

## [2026-03-18] - Supabase SQL Bootstrap Compatibility (3 fixes)

### Critical SQL Fixes

#### S1. Hosted Supabase trigger permission error (`bennett-backend/supabase/master.sql`)
- **Severity:** CRITICAL
- **Observed error:** `ERROR: 42501: permission denied: "RI_ConstraintTrigger..." is a system trigger`
- **Cause:** Older script versions used `ALTER TABLE ... DISABLE TRIGGER ALL`, which is blocked for RI/system triggers in Supabase SQL Editor.
- **Fix:** Removed trigger-disable/re-enable strategy. Seed now runs without disabling system triggers, and `profiles_user_id_fkey` is re-applied at the end as `NOT VALID`.

#### S2. Invalid placeholder UUID format (`bennett-backend/supabase/master.sql`)
- **Severity:** CRITICAL
- **Observed error:** `ERROR: 22P02: invalid input syntax for type uuid: "t0000000-..."`
- **Cause:** Placeholder IDs used non-hex prefixes (`t`, `s`, `q`) which are not valid UUID characters.
- **Fix:** Replaced all non-hex placeholder prefixes with valid hex-only prefixes across seed data and references:
  - teacher: `t...` -> `b...`
  - students: `s...` -> `d...`
  - questions: `q...` -> `e...`

#### S3. `token_blacklist` RLS alignment (`bennett-backend/supabase/master.sql`)
- **Severity:** HIGH
- **Issue:** Table was created without RLS, making behavior inconsistent with the rest of the security model.
- **Fix:** Enabled RLS on `token_blacklist`.
- **Policy model:** No user-facing policies are defined for this table, so anon/authenticated access is denied by default; backend service-role flows remain functional.

### Verification
- UUID literal scan in `master.sql`: `invalid_count = 0`
- Script no longer contains `DISABLE TRIGGER` / `ENABLE TRIGGER` statements

### Notes
- If a prior SQL run partially applied objects, reset the DB (or clean objects) before rerunning the updated `master.sql`.
- `md files/disable-devtool-guide.md` is documentation-only at this point. The app currently uses custom proctoring heuristics (`services/monitoringService.ts`) and does not install/initialize the `disable-devtool` package.

## [2026-03-17T18:30:00Z] - Cross-Layer Bug Sweep (35 fixes)

Comprehensive analysis and fix pass covering frontend-backend contract mismatches,
security bugs, dead code, and type inconsistencies across the entire codebase.

### Critical Fixes (7)

#### C1. `POST /execute` SSE vs JSON mismatch (`services/executeService.ts`)
- **Severity:** CRITICAL
- **Bug:** `api.post()` called `res.json()` on a `text/event-stream` SSE response — runtime crash on every code execution.
- **Fix:** Rewrote `runCode()` to use raw `fetch()` with SSE stream parsing. Reads `data:` events, accumulates stdout/stderr, captures exit code. `runTests()` remains JSON-based.

#### C2. `GET /submissions/user/:userId` route does not exist (`services/submissionService.ts`)
- **Severity:** CRITICAL
- **Bug:** `getByUser()` called a nonexistent endpoint, returning 404.
- **Fix:** Changed to `GET /submissions?studentId=${userId}` using URLSearchParams.

#### C3. `POST /submissions` body mismatch (`services/submissionService.ts`)
- **Severity:** CRITICAL
- **Bug:** Frontend sent `userId` (not accepted) and omitted `assessmentId` (required by backend Zod). Every submission create call was rejected.
- **Fix:** Replaced `userId` with `assessmentId` (required). Added optional `answer` field for MCQ/short-answer. Backend derives `student_id` from JWT.

#### C4. `SystemLog` type has no field overlap with backend (`types.ts`, `screens/SystemLogs.tsx`)
- **Severity:** CRITICAL
- **Bug:** Frontend expected `level`, `category`, `message`, `userAgent`, `metadata`, `timestamp`. Backend returns `action`, `details`, `userEmail`, `createdAt`. Admin logs screen rendered empty.
- **Fix:** Rewrote `SystemLog` interface to match backend: `{ id, userId, userName, userEmail, action, details, ipAddress, createdAt }`. Rewrote `SystemLogs.tsx` to use action-based filtering, stats, and display.

#### C5. `SystemHealth` type has no field overlap with backend (`types.ts`, `screens/SystemHealth.tsx`)
- **Severity:** CRITICAL
- **Bug:** Frontend expected `services[]`, `cpuUsage`, `diskUsage`, `activeConnections`, `requestsPerMinute`, `recentErrors`. Backend returns `database`, `codeExecution`, `memory`, `cache`, `nodeVersion`. Health dashboard was completely broken.
- **Fix:** Rewrote `SystemHealth` interface to match backend shape. Rewrote `SystemHealth.tsx` to show actual backend data: heap memory gauge, database/code-execution service status, cache stats with hit rate.

#### C6. Token refresh does not update session hash (`bennett-backend/src/routes/auth.ts`)
- **Severity:** CRITICAL (Security)
- **Bug:** After token refresh, `active_sessions.token_hash` still pointed to the old token. Session timeout enforcement stopped working entirely — security bypass.
- **Fix:** Compute old/new token hashes (SHA256) during refresh. Update the `active_sessions` row to the new hash and reset `last_active_at`.

#### C7. `assessment_attempts.time_spent` never calculated (`bennett-backend/src/routes/submissions.ts`)
- **Severity:** CRITICAL (Data Loss)
- **Bug:** `time_spent` was set to `0` on creation and never updated. All analytics relying on time tracking showed zeroes.
- **Fix:** On attempt completion, fetch `started_at`, compute elapsed seconds, include in the UPDATE payload.

### Medium Fixes (11)

#### M1. TOCTOU race in `enforceSessionLimit` (`bennett-backend/src/routes/auth.ts`)
- **Severity:** MEDIUM (Security)
- **Bug:** Insert-then-count-then-delete pattern allowed concurrent logins to bypass the 2-session limit.
- **Fix:** Reversed to delete-first pattern: count existing sessions, delete oldest excess, then insert new.

#### M2. Notification `read` vs `isRead` field — mapping verified
- **Severity:** MEDIUM
- **Status:** `NotificationContext.mapApiNotification()` already maps backend `isRead` → frontend `read`. Frontend type kept as `read: boolean`. No fix needed — verified correct.

#### M4. User filter `role=professor` returns zero results (`services/userService.ts`)
- **Severity:** MEDIUM
- **Bug:** DB stores `teacher`, frontend sends `professor` as query param. Query returned nothing.
- **Fix:** Added translation: `filters.role === 'professor' ? 'teacher' : filters.role` before sending.

#### M5. Bulk user create returns `password` not `generatedPassword` (`bennett-backend/src/routes/admin.ts`)
- **Severity:** MEDIUM
- **Bug:** Frontend reads `r.generatedPassword` → undefined. Admins couldn't see temporary passwords.
- **Fix:** Changed response field from `password` to `generatedPassword`.

#### M6. No server-side check against assessment `end_date` (`bennett-backend/src/routes/submissions.ts`)
- **Severity:** MEDIUM (Assessment Integrity)
- **Bug:** Students could submit code after the assessment officially ended.
- **Fix:** POST submission handler now fetches the assessment and rejects with 403 if `end_date` has passed.

#### M7. Leaderboard counts rejected/error submissions (`bennett-backend/src/routes/system.ts`)
- **Severity:** MEDIUM
- **Bug:** `/system/stats` leaderboard included all submissions regardless of status, inflating scores.
- **Fix:** Added `.in("status", ["accepted", "partial"])` filter to leaderboard query.

#### M8. `token_blacklist` upsert missing `onConflict` (`bennett-backend/src/routes/auth.ts`, `middleware/auth.ts`)
- **Severity:** MEDIUM
- **Bug:** Concurrent logout+timeout for the same token caused unique constraint errors.
- **Fix:** Added `{ onConflict: 'token_hash' }` to both `.upsert()` calls.

#### M9. No validation `startDate < endDate` (`bennett-backend/src/routes/assessments.ts`)
- **Severity:** MEDIUM
- **Bug:** Teachers could create assessments with impossible date ranges.
- **Fix:** Added `.refine()` to Zod schema validating `startDate < endDate`.

#### M10. `monitoring_mode` column unreachable via API (`bennett-backend/src/routes/assessments.ts`)
- **Severity:** MEDIUM (Feature Gap)
- **Bug:** DB column `monitoring_mode` existed but had no API read/write path. Proctored mode couldn't be enabled.
- **Fix:** Added `monitoringMode` to Zod schema, INSERT/UPDATE payloads, and `mapAssessment` response.

#### M11+M12. StudentProfile update broken (`screens/StudentProfile.tsx`)
- **Severity:** MEDIUM
- **Bug (M11):** `updateUser()` called without `await` — success toast fired before server confirmed.
- **Bug (M12):** Student used admin-scoped `updateUser` from `AdminContext` — likely 403.
- **Fix:** Imported `api` directly, call `await api.put('/users/${id}', formData)` which hits `PUT /users/:id` (allows self-update).

#### M13. Edit assessment doesn't navigate back (`screens/CreateAssessment.tsx`)
- **Severity:** MEDIUM
- **Bug:** After editing an assessment, `onBack()` was not called — user stranded on edit page.
- **Fix:** Added `onBack()` call after `onUpdate()` in the edit branch.

#### M14. Submission status type diverges (`types.ts`)
- **Severity:** MEDIUM
- **Bug:** Frontend type had `'running'` (unreachable) and missed DB values `'accepted'`, `'rejected'`, `'wrong_answer'`.
- **Fix:** Expanded `Submission.status` to include both raw DB values and mapped frontend values. Updated `mapSubmissionStatus` to map `accepted`/`rejected`/`wrong_answer` to themselves.

#### M17. Teacher queries bypass RLS (`bennett-backend/src/routes/submissions.ts`)
- **Severity:** MEDIUM (Defense-in-Depth)
- **Bug:** Teacher-scoped queries used `getSupabaseAdmin()`, bypassing RLS.
- **Fix:** Teachers now use `createSupabaseClient(token)`. Only admins use the admin client.

### Low Fixes (7)

- **L1:** Removed dead destructured variables `cloneAssessment`, `reviewPlagiarism` from `routes/index.tsx`
- **L2:** Removed unused `View` import from `screens/CreateQuestion.tsx`
- **L10:** Removed dead double-escaping of `%`/`_` in `bennett-backend/src/routes/questions.ts` (first regex already stripped them)
- **L12:** Removed unused `cacheStats` import from `bennett-backend/src/routes/analytics.ts`
- **L13:** Removed unused `getMonitoringSession` import from `bennett-backend/src/routes/system.ts`

### Files Changed (23)

**Frontend (13):**
- `types.ts` — SystemLog, SystemHealth, Submission status types rewritten
- `services/executeService.ts` — SSE stream parser
- `services/submissionService.ts` — Fixed endpoints and body shape
- `services/userService.ts` — Role translation for query params
- `screens/SystemLogs.tsx` — Rewrote for new SystemLog type
- `screens/SystemHealth.tsx` — Rewrote for new SystemHealth type
- `screens/StudentProfile.tsx` — Direct API call, added await
- `screens/CreateAssessment.tsx` — onBack() after edit
- `screens/CreateQuestion.tsx` — Removed unused import
- `routes/index.tsx` — Removed dead variables
- `store/AdminContext.tsx` — synced SystemHealth/SystemLog contracts with backend
- `store/AppContext.tsx` — updated `addSystemLog` typing (`createdAt`)
- `store/SubmissionContext.tsx` — aligned submission create payload (`assessmentId`)

**Backend (8):**
- `bennett-backend/src/routes/auth.ts` — Token refresh session update, session limit race fix, upsert onConflict
- `bennett-backend/src/routes/submissions.ts` — time_spent calculation, end_date check, teacher RLS
- `bennett-backend/src/routes/assessments.ts` — Date validation, monitoring_mode API path
- `bennett-backend/src/routes/system.ts` — Leaderboard filter, dead import cleanup
- `bennett-backend/src/routes/admin.ts` — generatedPassword field name
- `bennett-backend/src/routes/questions.ts` — Dead escaping code removed
- `bennett-backend/src/routes/analytics.ts` — Dead import removed
- `bennett-backend/src/middleware/auth.ts` — upsert onConflict

---

## [2026-03-17] - Post-Review Fixes (2 fixes)

#### Atomic Publish Transition (`bennett-backend/routes/assessments.ts`)
- **Severity:** MEDIUM
- **Fix:** Replaced separate read-then-update with a single atomic update using `.neq("status", "published")`. Only the request that actually transitions status to "published" fires the notification. Concurrent requests that lose the race skip the notification and apply only non-status updates.

#### Leaderboard & Active Sessions in /system/stats (`bennett-backend/routes/system.ts`, `store/AdminContext.tsx`)
- **Severity:** MEDIUM
- **Fix:** `/system/stats` now returns `leaderboard` (top 20 students by aggregated submission score) and `activeSessions` (from `active_sessions` table). AdminContext loader updated with `Array.isArray` guards.

### Verification
- `npx tsc --noEmit` (frontend): PASS
- `npx tsc --noEmit` (backend): PASS

---

## [2026-03-17] - Deep Bug Sweep (16 fixes)

### Critical Fixes

#### Named Import from Default Export (`plagiarismService.ts`, `AdminContext.tsx`)
- **Severity:** CRITICAL
- **Fix:** Both files used `import { api } from './apiClient'` but `apiClient.ts` uses `export default`. Changed to default import. All plagiarism and admin backup/health API calls were silently broken (api was `undefined`).

#### Submission Notification Title Mismatch (`bennett-backend/routes/submissions.ts`)
- **Severity:** CRITICAL
- **Fix:** `notifySubmissionGraded()` passed `question.title` for both `assessmentTitle` and `questionTitle` parameters. Now fetches actual assessment title from DB.

#### Dead Notification Ref Wired (`QuestionContext.tsx`)
- **Severity:** CRITICAL
- **Fix:** `addNotificationRef` was a local ref never connected to the notification system. Replaced with `_addNotification` from `useAuth()`. Question create/delete notifications now fire correctly.

#### Admin State Variables Always Empty (`AdminContext.tsx`)
- **Severity:** CRITICAL
- **Fix:** `systemLogs`, `leaderboard`, and `activeSessions` had no setter functions. Added setters and wired API loading on admin login.

### High Fixes

#### `.toFixed()` on Undefined (`exportService.ts`)
- **Severity:** HIGH
- **Fix:** Added `?? 0` guards before `.toFixed()` calls on optional `executionTime` and `memoryUsed` fields in CSV and HTML export paths.

#### Async Logout Typed as Sync (`AuthContext.tsx`, `AppContext.tsx`)
- **Severity:** HIGH
- **Fix:** `logout: () => void` changed to `logout: () => Promise<void>` to match async implementation. Callers can now properly await logout.

#### Missing Assessment Type/Status Fallbacks (`assessmentService.ts`)
- **Severity:** HIGH
- **Fix:** `raw.type?.toLowerCase()` and `raw.status?.toLowerCase()` could return `undefined`. Added `|| 'quiz'` and `|| 'draft'` fallbacks.

### Medium Fixes

#### LIKE Wildcards Not Escaped (`bennett-backend/routes/questions.ts`)
- **Severity:** MEDIUM
- **Fix:** Search query now escapes `%` and `_` LIKE metacharacters after sanitization.

#### TOCTOU Race on Publish Transition (`bennett-backend/routes/assessments.ts`)
- **Severity:** MEDIUM
- **Fix:** Added post-update guard to verify publish transition before firing notification.

#### Fire-and-Forget Session Update (`bennett-backend/middleware/auth.ts`)
- **Severity:** MEDIUM
- **Fix:** Session `last_active_at` update now awaited instead of fire-and-forget, ensuring accurate inactivity timeout checks.

#### Over-Broad Dependency Array (`AppContext.tsx`)
- **Severity:** MEDIUM
- **Fix:** Logout-reset effect narrowed from `[auth.isAuthenticated, questions, assessments, submissions]` to `[auth.isAuthenticated]`.

### Low Fixes

- `ClassStudent.status` narrowed from `string` to `'active' | 'inactive'` (`types.ts`)
- Removed unused `_addNotification` from `startAssessment` and `submitCode` dependency arrays (`AssessmentContext.tsx`, `SubmissionContext.tsx`)
- Added empty-name guard for avatar generation (`AdminManagement.tsx`)
- Removed unused `_onUpdate` parameter from `useRealtimeUpdates()` (`realtimeService.ts`)

### Verification
- `npx tsc --noEmit`: PASS (0 errors)

---

## [2026-03-17] - Frontend/DB Contract Alignment

### Contract Fixes

#### Canonical User ID Field (`types.ts`, `userService.ts`, `authService.ts`, `AdminContext.tsx`, `UserManagement.tsx`, `AdminManagement.tsx`)
- **Severity:** HIGH
- **Fix:** Removed frontend-only `employeeId` from the `User` contract. Frontend now uses one canonical field (`enrollmentId`) for all roles to match backend `profiles.enrollment_id`. UI labels still show "Employee ID" for professor/admin forms.

#### User Status Enum Alignment (`types.ts`, `UserManagement.tsx`)
- **Severity:** HIGH
- **Fix:** Removed unsupported `'pending'` from frontend `User.status`. Frontend now matches backend `profiles.status` constraint (`'active' | 'inactive'`).

#### Assessment Attempt Status Alignment (`types.ts`, `AssessmentContext.tsx`)
- **Severity:** HIGH
- **Fix:** Updated frontend attempt statuses to backend contract (`'in-progress' | 'completed' | 'timed-out'`). `submitAssessment()` now marks attempts as `'completed'`.

#### Submission Status Mapping Hardened (`submissionService.ts`)
- **Severity:** HIGH
- **Fix:** Added `wrong_answer -> failed` mapping in `mapSubmissionStatus()`. Previously this backend status defaulted to `'pending'` in the UI.

#### Optional Runtime Metrics in Submission Type (`types.ts`)
- **Severity:** MEDIUM
- **Fix:** Marked `executionTime` and `memoryUsed` as optional in `Submission` type to reflect that they are runtime execution metrics and not guaranteed persisted DB columns.

### Verification

- `npx tsc --noEmit`: PASS (0 errors)

## [2026-03-15] - Audit Bug Fixes & Security Hardening

Fixes identified during comprehensive repository audit on 2026-03-15.

### Security Fixes

#### Token Invalidation on Password Change (`auth.ts`)
- **Severity:** HIGH
- **Fix:** After password change, all active sessions are now blacklisted in `token_blacklist` and deleted from `active_sessions`, forcing re-login with the new password.

#### Session Eviction Now Blacklists Tokens (`auth.ts`)
- **Severity:** HIGH
- **Fix:** When concurrent session limit (2) is exceeded, evicted session tokens are now added to `token_blacklist` so old sessions can no longer make API calls.

#### Case-Insensitive Email Matching (`auth.ts`)
- **Severity:** HIGH
- **Fix:** Login and signup now lowercase emails before all DB queries, preventing lockout bypass via casing variations (e.g., `User@X.com` vs `user@x.com`).

#### Teacher Ownership Check on Question Visibility (`questions.ts`)
- **Severity:** MEDIUM
- **Fix:** `PATCH /questions/:id/visibility` now enforces ownership — teachers can only toggle visibility on their own questions. Admins can toggle any.

### Validation Fixes

#### Question Type Transition Validation on PUT (`questions.ts`)
- **Severity:** MEDIUM
- **Fix:** Changing `questionType` via PUT now validates required fields for the new type (e.g., MCQ requires options, coding requires test cases). Previously, type could be changed without providing required fields.

#### Assessment Date Range Validation (`assessments.ts`)
- **Severity:** MEDIUM
- **Fix:** Added Zod `.refine()` to enforce `endDate > startDate` when creating assessments.

#### Assessment Question Link Update Error Handling (`assessments.ts`)
- **Severity:** MEDIUM
- **Fix:** When updating assessment question links, insert failure now returns an error instead of silently losing all question associations.

### Bug Fixes

#### Submission Timestamp Mapping (`submissionService.ts`)
- **Severity:** MEDIUM
- **Fix:** `submittedAt` now correctly maps from `s.submittedAt` (falling back to `s.createdAt`), instead of always using `createdAt`.

#### Silent Error Swallowing in Contexts (`AssessmentContext.tsx`, `SubmissionContext.tsx`)
- **Severity:** LOW
- **Fix:** `.catch(() => {})` blocks now log errors to console instead of silently discarding them.

#### onViewSubmission Placeholder (`routes/index.tsx`)
- **Severity:** LOW
- **Fix:** Replaced `console.log` placeholder with actual navigation to assessment results page.

#### Unhandled Promise Rejection (`middleware/auth.ts`)
- **Severity:** LOW
- **Fix:** Added `.catch()` to fire-and-forget session update to prevent unhandled promise rejections.

### Cleanup

- Deleted empty `nul` file (Windows artifact from `/dev/null` redirect)
- Added `nul` to `.gitignore` to prevent re-creation

---

## [Unreleased] - Code Review Fixes

Comprehensive security, correctness, and performance fixes identified during a full-codebase code review.

### CRITICAL Fixes

#### 1. Exposed API Key Removed (`.env.local`)
- **Severity:** CRITICAL (Secret Exposure)
- **File:** `.env.local`
- **Fix:** Removed `VITE_JUDGE0_API_KEY` line containing a real RapidAPI key.
- **Action Required:** The key was previously committed and should be considered compromised. **Rotate this key immediately on RapidAPI.**

#### 2-3. Socket.IO Authentication & Input Validation (`socketServer.ts`)
- **Severity:** CRITICAL (Authentication Bypass + Injection)
- **File:** `bennett-backend/src/services/socketServer.ts`
- **Fix:** Added JWT authentication middleware to both `/proctoring` and `/admin` namespaces. All Socket.IO event payloads now undergo input validation. Admin namespace enforces `role === 'admin'` check. Token blacklist is verified on connection.

#### 4. Plaintext Passwords in Bulk API Response (`admin.ts`)
- **Severity:** CRITICAL (Information Disclosure)
- **File:** `bennett-backend/src/routes/admin.ts`
- **Fix:** Bulk-create endpoint now strips plaintext passwords from the response body using destructuring (`{ password: _pw, ...rest }`). Passwords are still stored in the `profiles` table for Supabase dashboard visibility (see Post-Review Changes below).

#### 5. XSS in Printable Reports (`exportService.ts`)
- **Severity:** CRITICAL (Cross-Site Scripting)
- **File:** `services/exportService.ts`
- **Fix:** Added `escapeHtml()` helper. All user-controlled data (title, metadata keys/values, table cells with user names, question titles) are now sanitized before HTML injection in `generatePrintableReport`.

#### 6. Missing Submission Status in CHECK Constraint (`migration.sql`)
- **Severity:** CRITICAL (Data Integrity)
- **File:** `bennett-backend/supabase/migration.sql`
- **Fix:** Added `'wrong_answer'` to the submissions status CHECK constraint enum.

#### 7. Plagiarism Detector Bugs (`plagiarismDetector.ts`)
- **Severity:** CRITICAL (Incorrect Results)
- **File:** `bennett-backend/src/services/plagiarismDetector.ts`
- **Fix (a):** Fixed operator precedence in Rabin-Karp hash: added explicit parentheses around `(text.charCodeAt(i - 1) * basePow)`.
- **Fix (b):** Changed line-join from `.join('')` to `.join(' ')` to prevent false fingerprint matches when adjacent lines merge into matching substrings.

#### 8. Component Remount on Every Render (`routes/index.tsx`)
- **Severity:** CRITICAL (Performance / State Loss)
- **File:** `routes/index.tsx`
- **Fix:** Moved `StudentInstructionsPage`, `StudentEditorPage`, and `StudentResultsPage` wrapper components outside the `AppRoutes` component body. They were being redefined on every render, causing full remounts and state loss. They now use `useApp()` internally.

#### 9. Password History — Plaintext Storage (`auth.ts`)
- **Severity:** INFO (Reverted — Development Phase)
- **File:** `bennett-backend/src/routes/auth.ts`
- **Previous fix:** Added salted SHA-256 hashing to password history.
- **Reverted:** Salted hashing removed by request. Password history now stores plaintext passwords for direct comparison. The `hashPassword()` function and `node:crypto` import (`createHash`, `randomBytes`) have been removed. The `salt` column is no longer written to `password_history`. Reuse prevention still works via direct string comparison against the last 5 passwords.

#### 10. Cache Poisoning & Input Validation (`assessments.ts`, `questions.ts`)
- **Severity:** CRITICAL (Authorization Bypass)
- **Files:** `bennett-backend/src/routes/assessments.ts`, `bennett-backend/src/routes/questions.ts`
- **Fix (a):** Added user role to cache keys (`assessments:{id}:{role}`, `questions:{id}:{role}`) to prevent cross-role cache poisoning.
- **Fix (b):** In assessments, replaced raw `body?.status` with Zod enum validation.
- **Fix (c):** In questions PUT handler, changed truthiness checks to `!== undefined` for `title`, `description`, `difficulty`, `questionType`, `topic` to allow empty-string updates.

#### 11. Unstable Context Value References (`AuthContext.tsx`)
- **Severity:** CRITICAL (Performance / Cascade Re-renders)
- **File:** `store/AuthContext.tsx`
- **Fix:** Wrapped `login`, `signup`, `logout`, `setRole`, `startDemoMode`, and `hasPermission` in `useCallback` to provide stable references and prevent unnecessary re-renders of all consumers.

#### 12. Dead Notification Ref (`QuestionContext.tsx`)
- **Severity:** CRITICAL (Silent Failures)
- **File:** `store/QuestionContext.tsx`
- **Fix:** `addNotificationRef` was a local ref never connected to the notification system. Wired it to `_addNotification` from AuthContext. Removed unused `useRef` import.

---

### WARNING Fixes

#### 13. Rate Limit Interval Leak (`rateLimit.ts`)
- **Severity:** WARNING (Resource Leak)
- **File:** `bennett-backend/src/middleware/rateLimit.ts`
- **Fix:** Wrapped `setInterval` cleanup timer in a named function and exported `stopRateLimitCleanup()` for graceful server shutdown.

#### 14. NaN Config Values Crash Server (`cleanupJobs.ts`)
- **Severity:** WARNING (Runtime Error)
- **File:** `bennett-backend/src/lib/cleanupJobs.ts`
- **Fix:** Added `|| defaultValue` NaN guards and `Math.max(1, ...)` floor on all four `parseInt` config values.

#### 15. Empty CORS Origins & NaN Rate Limit (`app.ts`)
- **Severity:** WARNING (Misconfiguration)
- **File:** `bennett-backend/src/app.ts`
- **Fix:** Added `.filter(Boolean)` to `CORS_ORIGINS` split to remove empty strings from trailing commas. Added `|| 100` NaN guard on `globalMax` rate limit.

#### 16. Dev Server Bound to 0.0.0.0 (`vite.config.ts`)
- **Severity:** WARNING (Network Exposure)
- **File:** `vite.config.ts`
- **Fix:** Changed `host: '0.0.0.0'` to `host: 'localhost'` to prevent exposing the dev server on all network interfaces.

#### 17. Unnecessary TypeScript Flags (`tsconfig.json`)
- **Severity:** WARNING (Build Config)
- **File:** `tsconfig.json`
- **Fix:** Removed `experimentalDecorators: true` (no decorators in codebase). Changed `useDefineForClassFields: false` to `true` (aligns with modern ES standard).

#### 18. Negative Limit Bypass (`notifications.ts`)
- **Severity:** WARNING (Input Validation)
- **File:** `bennett-backend/src/routes/notifications.ts`
- **Fix:** Changed limit parsing to `Math.max(1, Math.min(parseInt(...) || 50, 200))` to clamp negative and NaN values.

#### 19. Dashboard Interval Leak & Reconnection Race (`socketServer.ts`)
- **Severity:** WARNING (Resource Leak + Race Condition)
- **File:** `bennett-backend/src/services/socketServer.ts`
- **Fix (a):** Stored dashboard stats broadcast interval in `dashboardTimer` variable, cleared in `shutdown()`.
- **Fix (b):** Reconnection grace-period timeout now checks that `socketId` matches before deleting the session, preventing deletion of a reconnected user's new session.

#### 20. Token Blacklist TTL Mismatch (`auth.ts`)
- **Severity:** WARNING (Security Gap)
- **File:** `bennett-backend/src/routes/auth.ts`
- **Fix:** Changed token blacklist TTL from 1 hour to 24 hours to match the JWT token lifetime, preventing reuse of "logged out" tokens.

#### 21. DevTools Detection setTimeout Leak (`monitoringService.ts`)
- **Severity:** WARNING (Resource Leak)
- **File:** `services/monitoringService.ts`
- **Fix:** Inner `setTimeout` calls created inside the devtools detection `setInterval` callback were never tracked or cleared when `stop()` was called. Added a `devtoolsTimeouts` Set to track all pending timeouts; they are now all cleared in `stop()`.

#### 22. Heatmap Flicker & Broken Edit Modal (`StudentProfile.tsx`)
- **Severity:** WARNING (UX Bug)
- **File:** `screens/StudentProfile.tsx`
- **Fix (a):** Replaced inline `Math.random()` in the submission heatmap with a `useMemo`-cached grid using a seeded PRNG (mulberry32). The heatmap no longer re-randomizes on every render.
- **Fix (b):** Edit Profile modal "Save" button previously just called `setIsEditing(false)` without persisting. Now uses controlled inputs (`editFormData` state), initializes from `currentUser` when opened, and calls `updateUser(currentUser.id, { name })` before closing.

---

### Post-Review Changes

#### 23. Plaintext Password Storage in Profiles (`auth.ts`, `admin.ts`, `migration.sql`)
- **Type:** Feature (Development Phase)
- **Files:** `bennett-backend/src/routes/auth.ts`, `bennett-backend/src/routes/admin.ts`, `bennett-backend/supabase/migration.sql`
- **Change:** Passwords are now stored in plaintext in the `profiles` table so they are visible in the Supabase dashboard.
  - **`migration.sql`**: Added `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS password TEXT;`
  - **`auth.ts` signup flow**: Profile insert now includes the plaintext `password` field.
  - **`auth.ts` change-password flow**: Profile update now writes the new plaintext password alongside `password_changed_at`.
  - **`admin.ts` single-user create**: Profile insert now includes the plaintext `password` field.
  - **`admin.ts` bulk-create**: Profile insert now includes the plaintext `password` field per user.
  - **`password_history` table**: Now stores plaintext passwords instead of salted SHA-256 hashes. Reuse prevention still active (direct string comparison).
- **Note:** Bulk-create API response still strips passwords (fix #4 intact) — passwords are only visible in the Supabase dashboard, not returned in API responses.
- **Rationale:** Development-phase decision for easier debugging and credential management. Should be revisited before production deployment.

---

### Notes

- The old `backend/` directory is being replaced by `bennett-backend/`.
- Notification merge order in `NotificationContext.tsx` (client-first) was reviewed and confirmed intentional.
- Skills, languages, achievements, and activity data in `StudentProfile.tsx` are static/hardcoded — this is by design for the current UI prototype.
- **Reminder:** The RapidAPI key removed from `.env.local` (fix #1) was previously committed and should be rotated.
