# CodeQuest Deployment Setup (Vercel + Raspberry Pi + Cloudflare Tunnel)

This guide matches the current codebase pipeline:

- Frontend -> Backend `/api/v1/execute`
- Backend -> Judge0 (self-hosted)
- Demo mode execute requests can run without auth/rate limit (demo-only header)

## 1) Target Architecture

- Frontend: Vercel (React/Vite)
- Backend API: Raspberry Pi (Node/Express) on port `3001`
- Judge0: Docker on Raspberry Pi (local only, usually `http://localhost:2358`)
- Public ingress: Cloudflare Tunnel

Recommended public hostnames:

- `codequest.qzz.io` -> Vercel frontend
- `api.codequest.qzz.io` -> Cloudflare Tunnel -> Pi backend `http://localhost:3001`

Do **not** expose Judge0 directly to internet.

## 2) Frontend (Vercel) Setup

In Vercel Project Settings -> Environment Variables:

- `VITE_API_BASE_URL=https://api.codequest.qzz.io/api/v1`

Then deploy frontend.

For custom domain in Vercel:

1. Add `codequest.qzz.io` in Vercel domains.
2. In Cloudflare DNS, create/update DNS record as Vercel instructs (usually CNAME).

## 3) Raspberry Pi Prerequisites

- Raspberry Pi OS 64-bit preferred
- Node.js 20+
- npm
- Docker + Docker Compose plugin
- cloudflared

## 4) Run Judge0 on Raspberry Pi

From Pi terminal:

```bash
git clone https://github.com/judge0/judge0.git
cd judge0
cp .env.example .env
docker compose up -d
```

Verify Judge0:

```bash
curl http://localhost:2358/languages
```

If Judge0 images fail on your Pi architecture, use an arm64-compatible Judge0 setup or run Judge0 on another host and point backend `JUDGE0_BASE_URL` there.

## 5) Backend Setup on Raspberry Pi

Copy backend code to Pi and run:

```bash
cd backend
npm install
npm run build
```

Create `backend/.env`:

```env
NODE_ENV=production
PORT=3001
DATABASE_URL="file:./dev.db"

JWT_SECRET=CHANGE_THIS_TO_A_LONG_RANDOM_SECRET
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

FRONTEND_URL=https://codequest.qzz.io

RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
DISABLE_RATE_LIMIT=false
DISABLE_AUTH_LOCKOUT=false

DEMO_MODE=true

EXECUTOR_PROVIDER=self-host
JUDGE0_BASE_URL=http://localhost:2358
JUDGE0_AUTH_TOKEN=
JUDGE0_RAPIDAPI_KEY=
JUDGE0_RAPIDAPI_HOST=judge0-ce.p.rapidapi.com
```

Start backend:

```bash
npm run start
```

Verify backend:

```bash
curl http://localhost:3001/health
curl http://localhost:3001/api/v1/execute/provider
```

## 6) Cloudflare Tunnel Setup (for `api.codequest.qzz.io`)

Install and login:

```bash
cloudflared tunnel login
```

Create tunnel:

```bash
cloudflared tunnel create codequest-api
```

Create config at `~/.cloudflared/config.yml`:

```yml
tunnel: codequest-api
credentials-file: /home/pi/.cloudflared/<TUNNEL-UUID>.json

ingress:
  - hostname: api.codequest.qzz.io
    service: http://localhost:3001
  - service: http_status:404
```

Route DNS:

```bash
cloudflared tunnel route dns codequest-api api.codequest.qzz.io
```

Run tunnel:

```bash
cloudflared tunnel run codequest-api
```

Optional system service:

```bash
sudo cloudflared service install
sudo systemctl enable cloudflared
sudo systemctl restart cloudflared
sudo systemctl status cloudflared
```

## 7) Demo-Mode Behavior (Current Code)

- Frontend adds `X-CodeQuest-Demo: true` only when demo mode is active.
- Backend allows `/api/v1/execute*` without auth/rate-limit only when:
  - `DEMO_MODE=true`, and
  - request header `X-CodeQuest-Demo: true` is present.

All non-demo execute requests still require auth in production mode.

## 8) Final End-to-End Verification

1. Open `https://codequest.qzz.io`
2. Click **Try Demo**
3. Start demo assessment
4. Run wrong code and confirm it fails test cases
5. Run correct code and confirm pass
6. Confirm output includes real compile/runtime diagnostics

## 9) Troubleshooting

- `502` from API domain:
  - backend not running on Pi `:3001`
  - tunnel ingress hostname mismatch
- CORS blocked:
  - `FRONTEND_URL` in backend `.env` missing `https://codequest.qzz.io`
- Execute errors:
  - Judge0 not running on `localhost:2358`
  - check `curl http://localhost:2358/languages`
- Demo execute unauthorized:
  - ensure frontend is in demo mode
  - ensure `DEMO_MODE=true` on backend
