# CodeQuest

CodeQuest is a full-stack coding assessment platform for university workflows: author questions, publish assessments, execute and grade submissions, monitor live attempts, and run admin operations from a single system.

This repository contains:

- Frontend app (`React + TypeScript + Vite`) in the project root
- Backend API (`Hono + Supabase + Socket.IO`) in `bennett-backend`
- Canonical Supabase schema + seed script in `bennett-backend/supabase/master.sql`

## Core capabilities

- Role-based access control for `student`, `professor` (backend `teacher`), and `admin`
- Question bank for coding and non-coding formats (`coding`, `mcq`, `short_answer`, `true_false`)
- Assessment lifecycle: draft, publish, attempt tracking, completion, scoring
- Real execution pipeline with Programiz-first execution and optional Judge0 fallback
- Plagiarism scanning with server-side winnowing fingerprints
- Real-time proctoring/monitoring via Socket.IO namespaces (`/proctoring`, `/admin`)
- Notifications, activity logs, backups, system health, and leaderboard endpoints
- Security hardening: JWT auth, lockout, token blacklist, session timeout, password history, RLS

DevTools protection note:

- The app currently uses custom proctoring heuristics in `services/monitoringService.ts` (`devtools_open` violation events).
- `disable-devtool` package integration is not enabled in runtime code yet (guide exists at `md files/disable-devtool-guide.md`).

## Architecture

```text
Browser (Vercel-hosted frontend)
        |
        v
API (Hono, /api/v1) + Socket.IO (/proctoring, /admin)
        |                         |
        |                         +--> Live monitoring sessions/events
        |
        +--> Supabase (Auth + Postgres + RLS)
        |
        +--> Execution backends
              - Programiz proxy (primary)
              - Judge0 (optional fallback)
```

## Repository layout

```text
.
|- README.md
|- package.json                  # frontend scripts
|- .env.example                  # frontend env template
|- bennett-backend/
|  |- src/
|  |  |- routes/                 # auth, users, questions, assessments, submissions, etc.
|  |  |- services/               # execution dispatcher, socket server, notifications, plagiarism
|  |  |- middleware/             # auth, rate limiting
|  |  |- lib/                    # logger, sentry, cache, cleanup jobs
|  |- supabase/
|  |  |- master.sql              # canonical schema + indexes + policies + seed data
|  |- .env.example               # backend env template
|  |- package.json
```

## Local development

### Prerequisites

- Node.js 20+
- npm 10+
- Supabase project (URL + anon + service role keys)
- Optional: Docker (if using Judge0 fallback)

### 1) Install dependencies

```bash
# frontend (repo root)
npm install

# backend
cd bennett-backend
npm install
```

### 2) Configure environment files

Frontend (`.env.local` in repo root):

```env
VITE_API_BASE_URL=http://localhost:3001/api/v1
```

Backend (`bennett-backend/.env`):

```env
PORT=3001
NODE_ENV=development

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

CORS_ORIGINS=http://localhost:5173,http://localhost:3000
FRONTEND_URL=http://localhost:5173

RATE_LIMIT_GLOBAL=100
RATE_LIMIT_AUTH=10
RATE_LIMIT_EXECUTE=20

# Execution backend: programiz or judge0
EXECUTION_BACKEND=programiz

# Optional Judge0 fallback
# JUDGE0_BASE_URL=http://localhost:2358
# JUDGE0_AUTH_TOKEN=
```

### 3) Bootstrap Supabase schema

Run `bennett-backend/supabase/master.sql` in Supabase SQL Editor.

Notes:

- `master.sql` creates the complete schema (17 tables), indexes, triggers, RLS policies, and seed dataset.
- It inserts placeholder UUIDs for auth-linked profile rows because SQL Editor cannot create `auth.users` directly.
- After creating auth users in Supabase Dashboard, update profile mappings:

If you previously downloaded an older `master.sql`, use the latest file from this repo before running. Older variants can fail in hosted Supabase SQL Editor.

```sql
UPDATE profiles
SET user_id = '<real-auth-user-uuid>'
WHERE email = 'admin@bennett.edu.in';

UPDATE profiles
SET user_id = '<real-auth-user-uuid>'
WHERE email = 'sanchit@bennett.edu.in';
```

Common SQL bootstrap errors:

- `ERROR: 42501 permission denied: "RI_ConstraintTrigger..." is a system trigger`
  - Cause: older script version tried `ALTER TABLE ... DISABLE TRIGGER ALL`.
  - Fix: latest `master.sql` removes trigger toggling and re-applies `profiles_user_id_fkey` as `NOT VALID` after seeding.
- `ERROR: 22P02 invalid input syntax for type uuid: "t000..."`
  - Cause: non-hex placeholder UUID prefixes in older script variants.
  - Fix: latest `master.sql` uses valid hex-only placeholder UUIDs for teacher/student/question seeds.
- `token_blacklist` appears with RLS disabled
  - Cause: table was created from an older SQL version.
  - Fix: run `ALTER TABLE public.token_blacklist ENABLE ROW LEVEL SECURITY;`

If you hit any of these issues after a partial run, reset the Supabase database (or drop created objects) and rerun the latest `master.sql` from the start.

### 4) Start services

```bash
# backend (terminal 1)
cd bennett-backend
npm run dev

# frontend (terminal 2, repo root)
npm run dev
```

Frontend default URL: `http://localhost:5173`

## Build, typecheck, tests

```bash
# frontend
npx tsc --noEmit
npm run test:run
npm run build

# backend
cd bennett-backend
npx tsc --noEmit
npm run test:run
npm run build
```

## API surface (high-level)

- `/api/v1/auth` - login/signup/refresh/logout/password flows
- `/api/v1/users` - profile operations
- `/api/v1/questions` - question CRUD + visibility
- `/api/v1/assessments` - assessment CRUD + clone + attempt start
- `/api/v1/submissions` - submission create/list + complete attempt
- `/api/v1/execute` - run code, run tests, list languages
- `/api/v1/analytics` - dashboard/assessment/student analytics
- `/api/v1/system` - health, stats, logs, backups, plagiarism, monitoring
- `/api/v1/classes` - class and enrollment operations
- `/api/v1/admin` - admin-specific user/course flows
- `/api/v1/notifications` - notification list/read/delete

## Production deployment (Vercel + Raspberry Pi + Cloudflare Tunnel)

This section replaces the old standalone deployment markdown guides.

### A) Raspberry Pi prerequisites

```bash
node --version
npm --version
docker --version
cloudflared --version
```

Install cloudflared on Pi (arm64 example):

```bash
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64.deb -o cloudflared.deb
sudo dpkg -i cloudflared.deb
```

### B) Clone and install on Pi

```bash
git clone https://github.com/den222708/codequest.git
cd codequest
npm install
cd bennett-backend
npm install
```

### C) Run Judge0 on Pi (optional fallback backend)

```bash
git clone https://github.com/judge0/judge0.git
cd judge0
cp .env.example .env
docker compose up -d
curl http://localhost:2358/languages
```

### D) Configure backend on Pi

```bash
cd ~/codequest/bennett-backend
cp .env.example .env
```

Set production values in `bennett-backend/.env`:

```env
PORT=3001
NODE_ENV=production

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

CORS_ORIGINS=https://codequest.qzz.io,http://localhost:5173
FRONTEND_URL=https://codequest.qzz.io

RATE_LIMIT_GLOBAL=100
RATE_LIMIT_AUTH=10
RATE_LIMIT_EXECUTE=20

EXECUTION_BACKEND=programiz
# Optional Judge0 fallback
# JUDGE0_BASE_URL=http://localhost:2358
# JUDGE0_AUTH_TOKEN=

LOG_LEVEL=info
```

### E) Build and run backend on Pi

```bash
cd ~/codequest/bennett-backend
npm run build
npm start
```

Optional PM2:

```bash
pm2 start dist/index.js --name codequest-api
pm2 save
pm2 startup
```

### F) Cloudflare Tunnel setup

1) Authenticate:

```bash
cloudflared tunnel login
```

2) Create tunnel:

```bash
cloudflared tunnel create codequest-api
```

3) Create `~/.cloudflared/config.yml`:

```yaml
tunnel: <TUNNEL_UUID>
credentials-file: /home/pi/.cloudflared/<TUNNEL_UUID>.json

ingress:
  - hostname: api.codequest.qzz.io
    service: http://localhost:3001
  - service: http_status:404
```

4) Bind DNS route:

```bash
cloudflared tunnel route dns codequest-api api.codequest.qzz.io
```

5) Run tunnel:

```bash
cloudflared tunnel run codequest-api
```

Optional as a service:

```bash
sudo cloudflared service install
sudo systemctl enable cloudflared
sudo systemctl restart cloudflared
sudo systemctl status cloudflared
```

### G) Frontend on Vercel

Set project env var in Vercel:

```env
VITE_API_BASE_URL=https://api.codequest.qzz.io/api/v1
```

Deploy and attach your frontend domain (example: `codequest.qzz.io`).

### H) Production verification

```bash
curl https://api.codequest.qzz.io/
curl https://api.codequest.qzz.io/api/v1/system/health
```

Authenticated endpoint check (replace `<JWT_ACCESS_TOKEN>`):

```bash
curl -H "Authorization: Bearer <JWT_ACCESS_TOKEN>" \
  https://api.codequest.qzz.io/api/v1/execute/languages
```

Then verify end-to-end from browser:

- login/signup
- start an assessment attempt
- run code and submit
- open admin dashboard for logs/health/stats

## Troubleshooting

- `401` on frontend calls: check `VITE_API_BASE_URL`, token refresh flow, and backend `CORS_ORIGINS`
- CORS blocked: ensure deployed frontend domain is present in `CORS_ORIGINS`
- Execution failures: verify Programiz connectivity; if using Judge0, validate `JUDGE0_BASE_URL`
- Empty admin stats: verify admin role and seeded profile/auth UUID mapping
- Session issues: check `active_sessions` and `token_blacklist` tables in Supabase
