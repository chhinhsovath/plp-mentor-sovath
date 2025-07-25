# Backend Deployment Options

Your frontend is deployed and working, but it needs a backend API to connect to. Here are your options:

## Option 1: Deploy Backend on Subdomain (Recommended)

1. **Set up a subdomain** like `api.mentoring.openplp.com`
2. **Point it to your server** (157.10.73.52)
3. **Configure HTTPS** using Let's Encrypt
4. **Update frontend environment**:
   ```
   VITE_API_URL=https://api.mentoring.openplp.com/api/v1
   ```

### Steps:
```bash
# 1. Add DNS A record for api.mentoring.openplp.com → 157.10.73.52

# 2. On your server, set up nginx:
sudo nano /etc/nginx/sites-available/api-mentoring

# Add this configuration:
server {
    listen 80;
    server_name api.mentoring.openplp.com;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# 3. Enable the site
sudo ln -s /etc/nginx/sites-available/api-mentoring /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# 4. Get SSL certificate
sudo certbot --nginx -d api.mentoring.openplp.com
```

## Option 2: Use Vercel Functions as Proxy

Create a Vercel function to proxy requests to your backend:

1. **Create `api/[...path].ts`**:
```typescript
import { VercelRequest, VercelResponse } from '@vercel/node';

const BACKEND_URL = process.env.BACKEND_URL || 'http://157.10.73.52:3001';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  const { path } = req.query;
  const apiPath = Array.isArray(path) ? path.join('/') : path;
  
  try {
    const response = await fetch(`${BACKEND_URL}/api/${apiPath}`, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        ...req.headers as any
      },
      body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined
    });
    
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Proxy error' });
  }
}
```

2. **Update `vercel.json`**:
```json
{
  "functions": {
    "api/[...path].ts": {
      "maxDuration": 30
    }
  },
  "rewrites": [
    {
      "source": "/api/v1/:path*",
      "destination": "/api/:path*"
    }
  ]
}
```

3. **Set environment variable on Vercel**:
   - `BACKEND_URL`: Your backend server URL (needs to be accessible from Vercel's servers)

## Option 3: Deploy Backend on Vercel

Deploy your NestJS backend as Vercel Functions:

1. **Create `api/index.ts`**:
```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../backend/src/app.module';

let app;

async function getApp() {
  if (!app) {
    app = await NestFactory.create(AppModule);
    await app.init();
  }
  return app;
}

export default async function handler(req, res) {
  const app = await getApp();
  const instance = app.getHttpAdapter().getInstance();
  instance(req, res);
}
```

2. **Update `vercel.json`** to handle all API routes

## Option 4: Use a Backend-as-a-Service

Consider using services like:
- Supabase
- Railway
- Render
- Fly.io

These services can host your NestJS backend with HTTPS out of the box.

## Current Status

- ✅ Frontend is deployed at https://mentoring.openplp.com
- ❌ Backend is not accessible via HTTPS
- ❌ Frontend is trying to call `/api/v1/*` on itself

## Quick Fix for Testing

For immediate testing, you can:

1. **Use your backend directly** (if accessible):
   - Check if http://157.10.73.52:3001 is accessible from your location
   - If yes, temporarily disable Mixed Content blocking in your browser
   - This is NOT for production!

2. **Use ngrok for temporary HTTPS**:
   ```bash
   # On your server
   ngrok http 3001
   # This will give you an HTTPS URL like https://abc123.ngrok.io
   ```

## Recommended Next Steps

1. **Set up subdomain** `api.mentoring.openplp.com`
2. **Configure HTTPS** on your backend server
3. **Update environment variables** on Vercel:
   ```
   VITE_API_URL=https://api.mentoring.openplp.com/api/v1
   ```
4. **Redeploy** on Vercel