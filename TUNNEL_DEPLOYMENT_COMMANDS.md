# CodeQuest Tunnel + Deployment Commands

## Current Status
- Frontend code updated to use tunnel API URL in production
- Code pushed to GitHub: https://github.com/den222708/codequest.git
- Tunnel running on this PC pointing to localhost:3001
- Public API: https://api.codequest.qzz.io

---

## 1) Cloudflare Tunnel Commands (This PC)

### Check tunnel is running
```powershell
Get-Process cloudflared
```

### Start tunnel (if not running)
```powershell
Start-Process cloudflared -ArgumentList "tunnel","run","codequest-api"
```

### Stop tunnel
```powershell
Stop-Process -Name cloudflared -Force
```

### View tunnel config
```powershell
Get-Content "$env:USERPROFILE\.cloudflared\config.yml"
```

### Test tunnel locally
```powershell
curl https://api.codequest.qzz.io/health
curl -H "X-CodeQuest-Demo: true" https://api.codequest.qzz.io/api/v1/execute/provider
```

---

## 2) Backend Commands (This PC)

### Start backend
```bash
cd "C:\Users\Reetam\Downloads\Code Quest\Code Quest\backend"
npm run start
```

### Or run in development
```bash
cd backend
npm run dev
```

### Check backend health
```powershell
curl http://localhost:3001/health
```

### Check Judge0 is running
```powershell
curl http://localhost:2358/languages
```

---

## 3) Frontend Deployment (Vercel Dashboard)

### Steps to redeploy:

1. Go to: https://vercel.com/dashboard
2. Find your CodeQuest project
3. The new commit should auto-trigger a deployment
4. If not, click "Redeploy" on the latest deployment

### Or force new deployment:
1. Go to project Settings -> Git
2. Disconnect and reconnect the GitHub repo
3. Push a new commit

### After deployment, verify:
```powershell
curl https://codequest.qzz.io
```

Then check browser console on https://codequest.qzz.io for API calls going to:
- `https://api.codequest.qzz.io/api/v1` (correct - tunnel)
- NOT `http://localhost:3001/api/v1` (wrong - old)

---

## 4) End-to-End Verification

### Test demo flow:
1. Open https://codequest.qzz.io
2. Click "Try Demo"
3. Start assessment
4. Run code with wrong answer -> should fail
5. Run code with correct answer -> should pass
6. Check Network tab in browser DevTools
   - API calls should go to `api.codequest.qzz.io`
   - NOT to `localhost:3001`

### Test API directly:
```powershell
curl https://api.codequest.qzz.io/health
curl -H "X-CodeQuest-Demo: true" https://api.codequest.qzz.io/api/v1/execute/provider
curl -H "X-CodeQuest-Demo: true" -H "Content-Type: application/json" -X POST https://api.codequest.qzz.io/api/v1/execute/run-tests -d '{"code":"print(1+1)","language":"python","testCases":[{"input":"","expectedOutput":"2"}]}'
```

---

## 5) If Vercel Still Serves Old Bundle

The Vercel deployment may cache. To force update:

1. Go to Vercel Dashboard -> Your Project
2. Settings -> General
3. Scroll to "Build & Development Settings"
4. Add environment variable:
   - Name: `VITE_API_BASE_URL`
   - Value: `https://api.codequest.qzz.io/api/v1`
5. Save
6. Go to Deployments tab
7. Click "Redeploy" on the latest deployment
8. Clear browser cache and reload https://codequest.qzz.io

---

## 6) Quick Reference

- **Frontend URL**: https://codequest.qzz.io
- **API URL (via tunnel)**: https://api.codequest.qzz.io
- **Tunnel config**: `C:\Users\Reetam\.cloudflared\config.yml`
- **Tunnel credentials**: `C:\Users\Reetam\.cloudflared\5bccd732-35cc-4b05-bd37-54d80d79a306.json`
- **Tunnel ID**: `5bccd732-35cc-4b05-bd37-54d80d79a306`
- **GitHub repo**: https://github.com/den222708/codequest.git
