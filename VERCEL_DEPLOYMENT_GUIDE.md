# Vercel Deployment Guide for PLP Mentoring

## Current Setup
- Frontend: Vercel (HTTPS) - `https://mentoring.openplp.com`
- Backend: Your server (HTTP) - `http://157.10.73.52:3001`

## Problem
HTTPS pages cannot make HTTP API requests due to browser security (Mixed Content).

## Solution: Vercel Proxy

### 1. Configuration Files Created

#### `vercel.json`
This file configures Vercel to proxy API requests to your backend:
- `/api/*` requests → `http://157.10.73.52:3001/api/*`

#### `.env.production`
Updated to use relative API path:
- `VITE_API_URL=/api/v1`

### 2. Deployment Steps

```bash
# 1. Build the frontend
cd frontend
npm install
npm run build

# 2. Commit and push changes
cd ..
git add .
git commit -m "Configure Vercel proxy for HTTP backend"
git push

# 3. Vercel will auto-deploy from your GitHub repo
```

### 3. Verify Deployment

After Vercel deploys:
1. Visit: https://mentoring.openplp.com
2. Check browser console for errors
3. Try logging in with:
   - Username: `chhinhs`
   - Password: `password`

### 4. Troubleshooting

If it doesn't work:

#### Check API is accessible:
```bash
# From Vercel's perspective
curl https://mentoring.openplp.com/api/v1/health

# Direct to your server
curl http://157.10.73.52:3001/api/v1/health
```

#### Alternative Solutions:

**Option A: Use Cloudflare (Free HTTPS)**
1. Add your domain to Cloudflare
2. Create A record: `api.mentoring.openplp.com` → `157.10.73.52`
3. Enable "Flexible SSL" mode
4. Update frontend: `VITE_API_URL=https://api.mentoring.openplp.com/api/v1`

**Option B: Deploy Backend on Vercel**
- Move your NestJS backend to Vercel using serverless functions

**Option C: Use a different proxy service**
- Deploy a simple proxy on a free HTTPS service (Render, Railway, etc.)

### 5. Backend CORS Update

Make sure your backend allows requests from Vercel:

```typescript
// backend/src/config/security.config.ts
const allowedOrigins = [
  'https://mentoring.openplp.com',
  'https://plp-mentor-sovath.vercel.app',
  'https://plp-mentor-sovath-*.vercel.app' // Preview deployments
];
```

### 6. Environment Variables on Vercel

In your Vercel project settings, add:
- `VITE_API_URL` = `/api/v1`

This ensures all deployments use the proxy configuration.

## Important Notes

1. **Vercel Proxy Limitations**:
   - Timeout: 10 seconds for hobby plan
   - May add slight latency
   - Check Vercel's proxy documentation for limits

2. **Security**:
   - Your backend is still HTTP-only
   - Consider adding API key authentication
   - Monitor for unusual traffic

3. **Long-term Solution**:
   - Add SSL to your server
   - Or move backend to a service with HTTPS

## Quick Test

After deployment, test the API proxy:
```javascript
// Run in browser console
fetch('/api/v1/health')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error)
```

Should return your backend health check!