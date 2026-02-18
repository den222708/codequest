# CodeQuest Complete Deployment Guide

## Overview
- Frontend: Vercel (https://codequest.qzz.io)
- Backend API: Local PC via Cloudflare Tunnel (https://api.codequest.qzz.io)
- Judge0: Docker on local PC (http://localhost:2358)

---

## 1) Prerequisites

### Windows PC Requirements
- Windows 10/11
- Node.js 20+ (https://nodejs.org)
- Git (https://git-scm.com)
- Docker Desktop (https://www.docker.com/products/docker-desktop)
- cloudflared (https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/)

### Verify installations
```powershell
node --version
npm --version
git --version
docker --version
cloudflared --version
```

---

## 2) Clone and Setup Project

### Clone repository
```powershell
cd C:\Users\Reetam\Downloads\Code Quest
git clone https://github.com/den222708/codequest.git
cd codequest
```

### Install frontend dependencies
```powershell
npm install
```

### Install backend dependencies
```powershell
cd backend
npm install
cd ..
```

---

## 3) Setup Judge0 Docker

### Pull and start Judge0
```powershell
# Clone Judge0
cd C:\Users\Reetam\Downloads\Code Quest
git clone https://github.com/judge0/judge0.git
cd judge0

# Copy environment file
copy .env.example .env

# Start Judge0 containers (this may take 10-15 minutes first time)
docker compose up -d
```

### Verify Judge0 is running
```powershell
# Check containers are running
docker compose ps

# Test Judge0 API
curl http://localhost:2358/languages
```

### If Judge0 fails to start
```powershell
# Check logs
docker compose logs

# Restart containers
docker compose restart

# Full reset
docker compose down
docker compose up -d
```

---

## 4) Setup Backend

### Create backend .env file
```powershell
cd C:\Users\Reetam\Downloads\Code Quest\Code Quest\backend
```

Create `.env` file with this content:
```env
# Environment
NODE_ENV=development
PORT=3001

# Database
DATABASE_URL="file:./dev.db"

# JWT
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

# CORS (include your Vercel domain)
FRONTEND_URL=http://localhost:5173,http://localhost:3000,https://codequest.qzz.io

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
DISABLE_RATE_LIMIT=true
DISABLE_AUTH_LOCKOUT=true
DEMO_MODE=true

# Execution Provider
EXECUTOR_PROVIDER=self-host
JUDGE0_BASE_URL=http://localhost:2358
JUDGE0_AUTH_TOKEN=
JUDGE0_RAPIDAPI_KEY=
JUDGE0_RAPIDAPI_HOST=judge0-ce.p.rapidapi.com
```

### Build backend
```powershell
cd backend
npm run build
```

### Run database migrations
```powershell
cd backend
npx prisma migrate dev
npx prisma generate
```

### Start backend (development)
```powershell
cd backend
npm run dev
```

### Start backend (production)
```powershell
cd backend
node dist/server.js
```

### Verify backend
```powershell
curl http://localhost:3001/health
```

---

## 5) Setup Cloudflare Tunnel

### Login to Cloudflare
```powershell
cloudflared tunnel login
```
- A browser window will open
- Select your domain (qzz.io)
- Authorize the application

### Create tunnel
```powershell
cloudflared tunnel create codequest-api
```
- Note the tunnel ID (e.g., `5bccd732-35cc-4b05-bd37-54d80d79a306`)

### Create tunnel config file
Location: `C:\Users\Reetam\.cloudflared\config.yml`

```yaml
tunnel: <YOUR_TUNNEL_ID>
credentials-file: C:/Users/Reetam/.cloudflared/<YOUR_TUNNEL_ID>.json

ingress:
  - hostname: api.codequest.qzz.io
    service: http://localhost:3001
  - service: http_status:404
```

Replace `<YOUR_TUNNEL_ID>` with your actual tunnel ID.

### Route DNS
```powershell
cloudflared tunnel route dns codequest-api api.codequest.qzz.io
```

### Validate config
```powershell
cloudflared tunnel ingress validate
```

### Start tunnel
```powershell
# Foreground (for testing)
cloudflared tunnel run codequest-api

# Background
powershell -Command "Start-Process cloudflared -ArgumentList 'tunnel','run','codequest-api'"
```

### Verify tunnel
```powershell
curl https://api.codequest.qzz.io/health
curl -H "X-CodeQuest-Demo: true" https://api.codequest.qzz.io/api/v1/execute/provider
```

---

## 6) Setup Frontend (Vercel)

### Create .env.production
Location: `C:\Users\Reetam\Downloads\Code Quest\Code Quest\.env.production`

```env
VITE_API_BASE_URL=https://api.codequest.qzz.io/api/v1
```

### Push to GitHub
```powershell
cd "C:\Users\Reetam\Downloads\Code Quest\Code Quest"
git add .
git commit -m "Your commit message"
git push
```

### Deploy on Vercel
1. Go to https://vercel.com/dashboard
2. Import project from GitHub: `den222708/codequest`
3. Framework Preset: Vite
4. Root Directory: `./`
5. Build Command: `npm run build`
6. Output Directory: `dist`
7. Add Environment Variable:
   - Name: `VITE_API_BASE_URL`
   - Value: `https://api.codequest.qzz.io/api/v1`
8. Deploy

### Configure custom domain
1. In Vercel project settings, go to Domains
2. Add domain: `codequest.qzz.io`
3. Update DNS in Cloudflare as instructed by Vercel

---

## 7) Daily Startup Commands

### Start everything in order

```powershell
# 1. Start Judge0 (if not running)
cd "C:\Users\Reetam\Downloads\Code Quest\judge0"
docker compose up -d

# 2. Start Backend
cd "C:\Users\Reetam\Downloads\Code Quest\Code Quest\backend"
node dist/server.js

# 3. Start Tunnel (if not running)
powershell -Command "Start-Process cloudflared -ArgumentList 'tunnel','run','codequest-api'"
```

### Or use this one-liner (run in PowerShell)
```powershell
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'C:\Users\Reetam\Downloads\Code Quest\judge0'; docker compose up -d"
Start-Sleep -Seconds 5
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'C:\Users\Reetam\Downloads\Code Quest\Code Quest\backend'; node dist/server.js"
Start-Sleep -Seconds 3
Start-Process cloudflared -ArgumentList "tunnel","run","codequest-api"
```

---

## 8) Status Check Commands

### Check all services
```powershell
# Check Judge0
curl http://localhost:2358/languages

# Check Backend
curl http://localhost:3001/health

# Check Tunnel
curl https://api.codequest.qzz.io/health

# Check processes
Get-Process docker -ErrorAction SilentlyContinue
Get-Process node -ErrorAction SilentlyContinue
Get-Process cloudflared -ErrorAction SilentlyContinue

# Check Docker containers
docker ps

# Check port usage
netstat -ano | findstr :3001
netstat -ano | findstr :2358
```

---

## 9) Stop Commands

### Stop services
```powershell
# Stop Tunnel
Stop-Process -Name cloudflared -Force

# Stop Backend
Stop-Process -Name node -Force

# Stop Judge0
cd "C:\Users\Reetam\Downloads\Code Quest\judge0"
docker compose down
```

---

## 10) Troubleshooting

### Backend won't start (port in use)
```powershell
# Find process on port 3001
netstat -ano | findstr :3001

# Kill process by PID (replace XXXX with actual PID)
Stop-Process -Id XXXX -Force

# Or kill all node processes
Stop-Process -Name node -Force
```

### Judge0 not responding
```powershell
# Check container logs
cd "C:\Users\Reetam\Downloads\Code Quest\judge0"
docker compose logs

# Restart Judge0
docker compose restart

# Full reset
docker compose down
docker compose up -d
```

### Tunnel not working
```powershell
# Check tunnel status
cloudflared tunnel list

# Check tunnel info
cloudflared tunnel info codequest-api

# Restart tunnel
Stop-Process -Name cloudflared -Force
cloudflared tunnel run codequest-api
```

### CORS errors
```powershell
# Verify CORS headers
curl -X OPTIONS -H "Origin: https://codequest.qzz.io" -H "Access-Control-Request-Method: POST" -i https://api.codequest.qzz.io/api/v1/execute/run-tests

# Check backend .env has FRONTEND_URL with your domain
# Check backend/src/server.ts has cors origin with your domain
# Restart backend after changes
```

### 404 on page refresh (frontend)
- Ensure `vercel.json` exists in project root
- Redeploy on Vercel

### Demo execute not working
```powershell
# Test demo header
curl -H "X-CodeQuest-Demo: true" -H "Content-Type: application/json" -X POST https://api.codequest.qzz.io/api/v1/execute/run-tests -d "{\"code\":\"print(1+1)\",\"language\":\"python\",\"testCases\":[{\"input\":\"\",\"expectedOutput\":\"2\"}]}"
```

---

## 11) File Locations

### Frontend
- Project: `C:\Users\Reetam\Downloads\Code Quest\Code Quest`
- Config: `C:\Users\Reetam\Downloads\Code Quest\Code Quest\.env.production`
- Vercel Config: `C:\Users\Reetam\Downloads\Code Quest\Code Quest\vercel.json`

### Backend
- Project: `C:\Users\Reetam\Downloads\Code Quest\Code Quest\backend`
- Config: `C:\Users\Reetam\Downloads\Code Quest\Code Quest\backend\.env`
- Database: `C:\Users\Reetam\Downloads\Code Quest\Code Quest\backend\prisma\dev.db`

### Judge0
- Project: `C:\Users\Reetam\Downloads\Code Quest\judge0`
- Config: `C:\Users\Reetam\Downloads\Code Quest\judge0\.env`

### Cloudflare Tunnel
- Config: `C:\Users\Reetam\.cloudflared\config.yml`
- Certificate: `C:\Users\Reetam\.cloudflared\cert.pem`
- Credentials: `C:\Users\Reetam\.cloudflared\<TUNNEL_ID>.json`

---

## 12) URLs Reference

- Frontend: https://codequest.qzz.io
- API: https://api.codequest.qzz.io
- API Health: https://api.codequest.qzz.io/health
- API Provider Info: https://api.codequest.qzz.io/api/v1/execute/provider
- GitHub: https://github.com/den222708/codequest
- Vercel Dashboard: https://vercel.com/dashboard
- Cloudflare Dashboard: https://dash.cloudflare.com

---

## 13) Quick Reference

| Service | Local Port | Public URL | Start Command |
|---------|-----------|------------|---------------|
| Judge0 | 2358 | - | `docker compose up -d` |
| Backend | 3001 | api.codequest.qzz.io | `node dist/server.js` |
| Tunnel | - | api.codequest.qzz.io | `cloudflared tunnel run codequest-api` |
| Frontend | 3000 | codequest.qzz.io | `npm run dev` (or Vercel) |
