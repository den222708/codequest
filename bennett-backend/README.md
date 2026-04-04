# Bennett CodeQuest Backend

Hono-based API backend for `bennett.codequest.qzz.io` with Supabase auth, Programiz code execution proxy, and anti-ban fingerprint rotation.

## Update log

- `2026-04-04T20:10:00Z`: Added typed SSE execution events (`stdout`/`stderr`/`exit`), optional Redis-backed distributed rate limiting (`REDIS_URL`), optional Socket.IO Redis adapter for multi-instance monitoring, and finalized `/api/v1` route-prefix documentation.

## Architecture

```
Frontend (Vercel)  →  Cloudflare Tunnel  →  VPS/Pi (Hono on :3001)
                                                ↓
                                         Supabase (Auth + DB)
                                                ↓
                                     Programiz WebSocket Proxy
```

## Quick Start

```bash
# Install dependencies
npm install

# Copy env vars
cp .env.example .env
# Fill in your Supabase credentials

# Run Supabase bootstrap SQL
# Go to Supabase Dashboard -> SQL Editor -> paste supabase/master.sql -> Run

# Start dev server
npm run dev
```

## Environment Variables

| Variable | Description |
|---|---|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (server-side only) |
| `SUPABASE_ANON_KEY` | Anon/public key |
| `PORT` | Server port (default: 3001) |
| `CORS_ORIGINS` | Comma-separated allowed origins |
| `FRONTEND_URL` | Frontend URL for password reset redirects |
| `REDIS_URL` | Optional Redis URL for distributed rate limiting and Socket.IO adapter |

## API Routes

All endpoints are mounted under `/api/v1`.
Example: `/auth/login` below is served at `/api/v1/auth/login`.

### Auth (`/auth`)
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/login` | No | Email/password login |
| POST | `/auth/signup` | No | Create account |
| POST | `/auth/logout` | Yes | Log out |
| POST | `/auth/refresh` | No | Refresh JWT |
| POST | `/auth/forgot-password` | No | Reset password email |

### Users (`/users`)
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/users` | Teacher/Admin | List users |
| GET | `/users/:id` | Yes | Get user profile |
| PUT | `/users/:id` | Yes | Update profile |
| DELETE | `/users/:id` | Admin | Delete user |

### Questions (`/questions`)
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/questions` | Yes | List questions |
| GET | `/questions/:id` | Yes | Get question |
| POST | `/questions` | Teacher/Admin | Create question |
| PUT | `/questions/:id` | Teacher/Admin | Update question |
| DELETE | `/questions/:id` | Teacher/Admin | Delete question |
| PATCH | `/questions/:id/visibility` | Teacher/Admin | Toggle visibility |

### Assessments (`/assessments`)
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/assessments` | Yes | List assessments |
| GET | `/assessments/:id` | Yes | Get assessment |
| POST | `/assessments` | Teacher/Admin | Create assessment |
| PUT | `/assessments/:id` | Teacher/Admin | Update assessment |
| DELETE | `/assessments/:id` | Teacher/Admin | Delete assessment |
| POST | `/assessments/:id/clone` | Teacher/Admin | Clone assessment |
| POST | `/assessments/:id/attempts` | Student | Start attempt |

### Execute (`/execute`)
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/execute/languages` | Yes | Supported languages |
| POST | `/execute` | Yes | Run code (SSE stream) |
| POST | `/execute/run-tests` | Yes | Run test cases |

### Submissions (`/submissions`)
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/submissions` | Student | Submit code |
| GET | `/submissions` | Yes | List submissions |
| GET | `/submissions/:id` | Yes | Get submission |
| POST | `/submissions/:attemptId/complete` | Student | Complete attempt |

### Analytics (`/analytics`)
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/analytics/dashboard` | Teacher/Admin | Dashboard stats |
| GET | `/analytics/leaderboard` | Yes | Leaderboard |
| GET | `/analytics/student/:id` | Yes | Student stats |
| GET | `/analytics/assessment/:id` | Teacher/Admin | Assessment stats |

### System (`/system`)
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/system/health` | No | Health check |
| GET | `/system/logs` | Admin | Activity logs |
| GET | `/system/stats` | Admin | System stats |

## Supported Languages

| Language | Key | Programiz Subdomain |
|---|---|---|
| C++ | `cpp` | `cpp` |
| C | `c` | `c` |
| Python | `python` | `python3` |
| Java | `java` | `java` |
| JavaScript | `javascript` | `javascript` |

## Anti-Ban Strategy

- 30+ User-Agent rotation (Chrome, Firefox, Safari, Edge across OS variants)
- Random UUID per request
- Session ID randomization
- Accept-Language variation
- Referrer rotation
- 50–300ms jitter delays between requests

## Deployment

### VPS/Pi with Cloudflare Tunnel

```bash
# Build
npm run build

# Start production
npm start

# Or use PM2
pm2 start dist/index.js --name bennett-api

# Setup Cloudflare Tunnel
cloudflared tunnel --url http://localhost:3001
```

## Database

Run `supabase/master.sql` in Supabase SQL Editor. It creates:
- 17 tables (full production schema)
- Indexes on FK and high-frequency query columns
- RLS policies and helper functions
- Trigger-based `updated_at` maintenance
- Seed data (admin, teacher, 113 students, 12 questions, class/enrollment/assignment)

Common SQL Editor issues:
- `ERROR 42501` about `RI_ConstraintTrigger...` -> use latest `master.sql` (no trigger-disabling statements)
- `ERROR 22P02` invalid UUID like `t000...` -> use latest `master.sql` (hex-only placeholder UUIDs)
- `token_blacklist` shows RLS disabled -> run `ALTER TABLE public.token_blacklist ENABLE ROW LEVEL SECURITY;`
