# Bennett CodeQuest — Subdomain & Deployment Setup Guide

Complete guide to setting up the `bennett.codequest.qzz.io` (frontend) and `bennett-api.codequest.qzz.io` (backend API) subdomains using Cloudflare DNS, Cloudflare Tunnel, Vercel, and Supabase.

---

## Architecture Overview

```
┌─────────────────────────────┐
│  Frontend (Vercel)          │
│  bennett.codequest.qzz.io   │
│  React + Vite               │
└─────────┬───────────────────┘
          │ HTTPS API calls
          ▼
┌─────────────────────────────────┐
│  Cloudflare Tunnel              │
│  bennett-api.codequest.qzz.io   │
└─────────┬───────────────────────┘
          │ localhost:3001
          ▼
┌─────────────────────────────┐
│  Backend (Hono + Node.js)   │
│  Your PC / Raspberry Pi     │
│  Port 3001                  │
└─────────┬───────────────────┘
          │ Supabase client
          ▼
┌─────────────────────────────┐
│  Supabase (Hosted)          │
│  PostgreSQL + Auth          │
│  rxmrxhjqianvcenhutjl       │
└─────────────────────────────┘
```

---

## Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | 20+ | Runtime |
| npm | 10+ | Package manager |
| Git | Any | Version control |
| cloudflared | Latest | Cloudflare Tunnel client |
| Cloudflare account | Free tier | DNS + Tunnel |
| Vercel account | Free tier | Frontend hosting |
| Supabase project | Free tier | Database + Auth |

### Install cloudflared

**Windows (winget):**
```powershell
winget install Cloudflare.cloudflared
```

**Windows (manual):**
Download from https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/

**Linux / Raspberry Pi:**
```bash
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64.deb -o cloudflared.deb
sudo dpkg -i cloudflared.deb
```

### Verify installation
```powershell
cloudflared --version
node --version
npm --version
```

---

## Step 1 — Domain Setup in Cloudflare

### 1.1 Add domain to Cloudflare (if not done)

1. Go to https://dash.cloudflare.com
2. Click **Add a Site** → enter `qzz.io`
3. Select the **Free** plan
4. Cloudflare will scan existing DNS records
5. Update your domain registrar's nameservers to the ones Cloudflare provides:
   ```
   ns1.cloudflare.com  (example — use your assigned pair)
   ns2.cloudflare.com
   ```
6. Wait for nameserver propagation (can take up to 24 hours, usually < 1 hour)

### 1.2 Verify domain is active

In Cloudflare dashboard → `qzz.io` → **Overview** → Status should show **Active**.

---

## Step 2 — Supabase Project Setup

### 2.1 Create project (if not done)

1. Go to https://supabase.com/dashboard
2. Click **New Project**
3. Fill in:
   - **Name:** `bennett-codequest`
   - **Database Password:** (save this — you'll need it)
   - **Region:** Pick closest to your users
4. Wait for project to provision

### 2.2 Get credentials

Go to **Project Settings → API** and copy:

| Key | Where to find |
|-----|----------------|
| `SUPABASE_URL` | Project URL (e.g., `https://rxmrxhjqianvcenhutjl.supabase.co`) |
| `SUPABASE_ANON_KEY` | `anon` / `public` key |
| `SUPABASE_SERVICE_ROLE_KEY` | `service_role` key (keep secret!) |

### 2.3 Run database migrations

1. Go to **SQL Editor** in the Supabase dashboard
2. Open and paste the contents of `supabase/migration.sql`
3. Click **Run** — this creates all tables, indexes, RLS policies, and triggers
4. Then paste and run `supabase/seed.sql` — this inserts demo questions and the demo practice assessment

### 2.4 Verify tables

In **Table Editor**, confirm these 10 tables exist:
- `profiles`
- `questions`
- `assessments`
- `assessment_questions`
- `assessment_attempts`
- `submissions`
- `activity_logs`
- `classes`
- `class_enrollments`
- `assessment_assignments`

---

## Step 3 — Backend Setup

### 3.1 Install dependencies

```powershell
cd "C:\Users\Reetam\Downloads\Code Quest\Code Quest\bennett-backend"
npm install
```

### 3.2 Create `.env` file

Copy the example and fill in your values:

```powershell
copy .env.example .env
```

Edit `.env`:

```env
# Server
PORT=3001
NODE_ENV=production

# Supabase
SUPABASE_URL=https://rxmrxhjqianvcenhutjl.supabase.co
SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>

# CORS — must include your frontend subdomain
CORS_ORIGINS=http://localhost:3000,http://localhost:5173,https://bennett.codequest.qzz.io

# Rate Limiting
RATE_LIMIT_GLOBAL=100
RATE_LIMIT_AUTH=10
RATE_LIMIT_EXECUTE=20

# Cache TTL (seconds)
CACHE_TTL_DEFAULT=300
CACHE_TTL_ASSESSMENTS=120
```

> **Important:** `CORS_ORIGINS` must include `https://bennett.codequest.qzz.io` exactly. If your frontend is deployed at a different subdomain, update accordingly.

### 3.3 Build the backend

```powershell
npm run build
```

Expect zero errors. The compiled output goes to `dist/`.

### 3.4 Start the backend

**Development:**
```powershell
npm run dev
```

**Production:**
```powershell
node dist/index.js
```

### 3.5 Verify backend is running

```powershell
curl http://localhost:3001/
```

Expected response:
```json
{
  "name": "Bennett CodeQuest API",
  "version": "1.0.0",
  "status": "running",
  "docs": "/system/health"
}
```

---

## Step 4 — Cloudflare Tunnel (Backend API Subdomain)

This exposes your local backend (`localhost:3001`) at `bennett-api.codequest.qzz.io` without opening router ports.

### 4.1 Authenticate cloudflared

```powershell
cloudflared tunnel login
```

- A browser window opens
- Select `qzz.io` domain
- Click **Authorize**
- A certificate is saved to `C:\Users\Reetam\.cloudflared\cert.pem`

### 4.2 Create the tunnel

```powershell
cloudflared tunnel create bennett-api
```

Output:
```
Created tunnel bennett-api with id <TUNNEL_UUID>
```

**Save the Tunnel UUID** — you'll need it for the config file.

A credentials JSON file is created at:
```
C:\Users\Reetam\.cloudflared\<TUNNEL_UUID>.json
```

### 4.3 Create tunnel config

Create/edit `C:\Users\Reetam\.cloudflared\config.yml`:

```yaml
tunnel: <TUNNEL_UUID>
credentials-file: C:/Users/Reetam/.cloudflared/<TUNNEL_UUID>.json

ingress:
  - hostname: bennett-api.codequest.qzz.io
    service: http://localhost:3001
    originRequest:
      noTLSVerify: true
  - service: http_status:404
```

Replace `<TUNNEL_UUID>` with your actual tunnel ID (e.g., `5bccd732-35cc-4b05-bd37-54d80d79a306`).

### 4.4 Route DNS

This creates a CNAME record in Cloudflare DNS pointing `bennett-api.codequest.qzz.io` to your tunnel:

```powershell
cloudflared tunnel route dns bennett-api bennett-api.codequest.qzz.io
```

### 4.5 Validate the config

```powershell
cloudflared tunnel ingress validate
```

Expected: `OK`

### 4.6 Start the tunnel

**Foreground (for testing):**
```powershell
cloudflared tunnel run bennett-api
```

**Background (detached):**
```powershell
Start-Process cloudflared -ArgumentList "tunnel","run","bennett-api" -WindowStyle Hidden
```

### 4.7 Verify tunnel is working

```powershell
curl https://bennett-api.codequest.qzz.io/
```

Should return the same JSON as `localhost:3001/`.

### 4.8 (Optional) Install as Windows service

To auto-start the tunnel on boot:

```powershell
# Run as Administrator
cloudflared service install
```

Or create a scheduled task:

```powershell
$action = New-ScheduledTaskAction -Execute "cloudflared" -Argument "tunnel run bennett-api"
$trigger = New-ScheduledTaskTrigger -AtStartup
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
Register-ScheduledTask -TaskName "CloudflaredTunnel" -Action $action -Trigger $trigger -Settings $settings -RunLevel Highest -User "SYSTEM"
```

### 4.9 (Optional) Linux/Pi — systemd service

```bash
sudo cloudflared service install
sudo systemctl enable cloudflared
sudo systemctl start cloudflared
sudo systemctl status cloudflared
```

---

## Step 5 — Frontend Subdomain (Vercel)

### 5.1 Deploy frontend to Vercel

1. Push your code to GitHub
2. Go to https://vercel.com/dashboard
3. Click **Add New → Project**
4. Import your GitHub repo
5. Configure:
   - **Framework Preset:** Vite
   - **Root Directory:** `./` (project root, not `bennett-backend`)
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
6. Add Environment Variable:
   - **Name:** `VITE_API_BASE_URL`
   - **Value:** `https://bennett-api.codequest.qzz.io`
7. Click **Deploy**

### 5.2 Add custom subdomain in Vercel

1. In your Vercel project → **Settings → Domains**
2. Add: `bennett.codequest.qzz.io`
3. Vercel will show you the required DNS record (usually a CNAME)

### 5.3 Add DNS record in Cloudflare

Go to Cloudflare dashboard → `qzz.io` → **DNS → Records → Add Record**:

| Type | Name | Target | Proxy |
|------|------|--------|-------|
| CNAME | `bennett` | `cname.vercel-dns.com` | **DNS only** (grey cloud) |

> **Critical:** Set proxy status to **DNS only** (grey cloud icon), NOT **Proxied** (orange cloud). Vercel handles its own SSL — Cloudflare proxying will cause certificate conflicts.

### 5.4 Verify frontend

Wait 1–5 minutes for DNS propagation, then visit:

```
https://bennett.codequest.qzz.io
```

---

## Step 6 — Verify DNS Records

In Cloudflare → `qzz.io` → **DNS**, you should have these records:

| Type | Name | Content | Proxy Status |
|------|------|---------|-------------|
| CNAME | `bennett` | `cname.vercel-dns.com` | DNS only |
| CNAME | `bennett-api` | `<TUNNEL_UUID>.cfargotunnel.com` | Proxied |

The tunnel CNAME (`bennett-api`) is automatically created by `cloudflared tunnel route dns` and should be **Proxied** (orange cloud).

The Vercel CNAME (`bennett`) must be **DNS only** (grey cloud).

---

## Step 7 — End-to-End Verification

### 7.1 Backend health check

```powershell
curl https://bennett-api.codequest.qzz.io/
curl https://bennett-api.codequest.qzz.io/system/health
```

### 7.2 Frontend loads

Open `https://bennett.codequest.qzz.io` in a browser and verify the app renders.

### 7.3 API connectivity

Open browser DevTools → Network tab → verify API calls go to `bennett-api.codequest.qzz.io` and return `200 OK`.

### 7.4 Auth flow

1. Sign up a test account
2. Log in
3. Verify JWT is issued and stored

### 7.5 Full assessment flow

1. Log in as a student
2. Open the Demo Practice assessment
3. Write and run code
4. Verify test cases run and results return

---

## Daily Startup Commands

Run these every time you restart your machine:

```powershell
# 1. Start backend
cd "C:\Users\Reetam\Downloads\Code Quest\Code Quest\bennett-backend"
node dist/index.js

# 2. Start tunnel (in a separate terminal)
cloudflared tunnel run bennett-api
```

### One-liner (starts both in background)

```powershell
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'C:\Users\Reetam\Downloads\Code Quest\Code Quest\bennett-backend'; node dist/index.js"
Start-Sleep -Seconds 3
Start-Process cloudflared -ArgumentList "tunnel","run","bennett-api" -WindowStyle Hidden
```

---

## Troubleshooting

### `502 Bad Gateway` on API subdomain
- Backend is not running on port 3001
- Run `curl http://localhost:3001/` to confirm local access
- Restart cloudflared: `cloudflared tunnel run bennett-api`

### `ERR_SSL_VERSION_OR_CIPHER_MISMATCH` on frontend
- Cloudflare SSL mode is wrong. Go to Cloudflare → `qzz.io` → **SSL/TLS** → set mode to **Full (strict)**
- If using Vercel: make sure the `bennett` CNAME is set to **DNS only** (grey cloud)

### CORS errors in browser console
- Verify `CORS_ORIGINS` in `.env` includes `https://bennett.codequest.qzz.io`
- Rebuild and restart: `npm run build && node dist/index.js`

### `404 Not Found` on API routes
- The backend has no `/api/v1/` prefix — routes are at root level (e.g., `/auth/login`, `/assessments`)
- Update `VITE_API_BASE_URL` to `https://bennett-api.codequest.qzz.io` (no trailing path)

### Tunnel shows `connection refused`
- Backend must be running before tunnel connects
- Check port in `.env` matches tunnel config (`3001`)

### DNS not resolving
- Run `nslookup bennett-api.codequest.qzz.io` to check DNS propagation
- Check Cloudflare DNS records exist
- Wait up to 5 minutes for changes to propagate

### Supabase connection errors
- Verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are correct in `.env`
- Check Supabase dashboard → **Settings → API** for the correct values
- Ensure Supabase project is not paused (free tier pauses after inactivity)

---

## API Route Reference

All routes are served at `https://bennett-api.codequest.qzz.io`:

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/login` | No | User login |
| POST | `/auth/signup` | No | User registration |
| POST | `/auth/refresh` | No | Refresh JWT |
| GET | `/users` | Yes | List users |
| GET | `/questions` | Yes | List questions |
| POST | `/questions` | Teacher/Admin | Create question |
| GET | `/assessments` | Yes | List assessments |
| POST | `/assessments` | Teacher/Admin | Create assessment |
| POST | `/assessments/:id/attempts` | Student | Start attempt |
| GET | `/submissions` | Yes | List submissions |
| POST | `/execute` | Yes | Run code |
| GET | `/classes` | Yes | List classes |
| POST | `/classes` | Admin | Create class |
| POST | `/classes/:id/enroll` | Admin | Enroll students |
| POST | `/classes/:id/assessments` | Teacher/Admin | Assign assessment |
| POST | `/admin/users` | Admin | Create single user |
| POST | `/admin/users/bulk` | Admin | Bulk create users |
| GET | `/analytics/*` | Teacher/Admin | Analytics data |
| GET | `/system/health` | No | Health check |

---

## Environment Variable Summary

| Variable | Required | Example | Description |
|----------|----------|---------|-------------|
| `PORT` | Yes | `3001` | Backend listen port |
| `NODE_ENV` | No | `production` | Environment mode |
| `SUPABASE_URL` | Yes | `https://xxx.supabase.co` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Yes | `eyJ...` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | `eyJ...` | Supabase service role key |
| `CORS_ORIGINS` | Yes | `https://bennett.codequest.qzz.io` | Comma-separated allowed origins |
| `RATE_LIMIT_GLOBAL` | No | `100` | Global rate limit per minute |
| `RATE_LIMIT_AUTH` | No | `10` | Auth endpoint rate limit |
| `RATE_LIMIT_EXECUTE` | No | `20` | Execute endpoint rate limit |
| `CACHE_TTL_DEFAULT` | No | `300` | Default cache TTL in seconds |
| `CACHE_TTL_ASSESSMENTS` | No | `120` | Assessment cache TTL in seconds |
