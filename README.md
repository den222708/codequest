<div align="center">
<img width="1200" height="475" alt="CodeQuest Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# CodeQuest

A university coding assessment platform with Monaco Editor, role-based access (Student / Professor / Admin), and real-time code execution.

## Stack

- **Frontend** — React 19, TypeScript, Vite, Monaco Editor, React Router v7, Recharts
- **Backend** — Node.js, Express, Prisma (SQLite dev / PostgreSQL prod), JWT auth
- **Code Execution** — [Programiz](https://www.programiz.com/online-compiler/) WebSocket proxy (primary, no API key required) with optional Judge0 fallback

---

## Prerequisites

- Node.js 20+
- npm

---

## Setup

### 1. Frontend

```bash
npm install
```

Create `.env.local` in the project root:

```env
VITE_API_BASE_URL=http://localhost:3001/api/v1
```

Start the dev server (runs on port 3000):

```bash
npm run dev
```

---

### 2. Backend

```bash
cd backend
npm install
```

Create `backend/.env`:

```env
PORT=3001
JWT_SECRET=your-secret-here
DATABASE_URL=file:./prisma/dev.db

# Execution provider: programiz | auto | self-host | rapidapi
# Defaults to "auto" (Programiz first, Judge0 fallback if configured)
EXECUTOR_PROVIDER=programiz

# Optional Judge0 fallback (for languages Programiz doesn't support)
# JUDGE0_BASE_URL=http://localhost:2358
# JUDGE0_RAPIDAPI_KEY=your-rapidapi-key
```

Run migrations and seed:

```bash
npm run db:migrate
npm run db:seed
```

Start the backend:

```bash
npm run dev
```

---

## Code Execution

Programiz is the primary executor — it requires no API key or Docker setup. It supports:

| Language   | Supported |
|------------|-----------|
| Python     | Yes       |
| JavaScript | Yes       |
| Java       | Yes       |
| C++        | Yes       |
| C          | Yes       |
| TypeScript | Judge0 only |
| Go         | Judge0 only |
| Rust       | Judge0 only |
| Ruby       | Judge0 only |

For languages outside the Programiz set, configure a Judge0 instance via `JUDGE0_BASE_URL` (self-hosted Docker) or `JUDGE0_RAPIDAPI_KEY` (RapidAPI).

---

## Roles

| Role      | Access                                                   |
|-----------|----------------------------------------------------------|
| Student   | Dashboard, assessments, code editor, submission history  |
| Professor | Create assessments/questions, view results, analytics    |
| Admin     | User management, system health, course management        |

---

## Build

```bash
# Frontend
npm run build

# Backend
cd backend && npm run build
```
