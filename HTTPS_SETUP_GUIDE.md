# HTTPS Setup Guide for Backend Server

## Current Issue
The frontend at `https://mentoring.openplp.com` cannot connect to the backend at `http://157.10.73.52:3000` due to Mixed Content security restrictions.

## Solution Options

### Option 1: Setup HTTPS on Backend Server (Recommended)

1. **Install Certbot for Let's Encrypt SSL**:
```bash
sudo apt update
sudo apt install certbot python3-certbot-nginx
```

2. **Configure Nginx for your backend**:
```bash
sudo nano /etc/nginx/sites-available/plp-backend
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name api.mentoring.openplp.com;  # Or use a subdomain

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

3. **Enable the site**:
```bash
sudo ln -s /etc/nginx/sites-available/plp-backend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

4. **Get SSL certificate**:
```bash
sudo certbot --nginx -d api.mentoring.openplp.com
```

5. **Update frontend environment**:
```bash
# In frontend/.env.production
VITE_API_URL=https://api.mentoring.openplp.com/api/v1
```

### Option 2: Use Vercel Functions as API Proxy

1. **Create API proxy function**:
Create `api/proxy.ts`:
```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';

const BACKEND_URL = 'http://157.10.73.52:3001';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { method, url, headers, body } = req;
  const path = url?.replace('/api/proxy', '');
  
  try {
    const response = await axios({
      method: method as any,
      url: `${BACKEND_URL}${path}`,
      headers: {
        ...headers,
        host: undefined,
      },
      data: body,
    });
    
    res.status(response.status).json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({
      error: error.message,
    });
  }
}
```

2. **Update vercel.json**:
```json
{
  "functions": {
    "api/proxy.ts": {
      "maxDuration": 30
    }
  },
  "rewrites": [
    {
      "source": "/api/v1/(.*)",
      "destination": "/api/proxy?path=/api/v1/$1"
    }
  ]
}
```

3. **Update frontend to use relative API path**:
```bash
# In frontend/.env.production
VITE_API_URL=/api/v1
```

### Option 3: Use Cloudflare Tunnel (Free HTTPS)

1. **Install Cloudflare Tunnel**:
```bash
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o cloudflared
chmod +x cloudflared
sudo mv cloudflared /usr/local/bin/
```

2. **Login to Cloudflare**:
```bash
cloudflared tunnel login
```

3. **Create tunnel**:
```bash
cloudflared tunnel create plp-backend
```

4. **Configure tunnel**:
```yaml
# ~/.cloudflared/config.yml
tunnel: YOUR_TUNNEL_ID
credentials-file: /home/user/.cloudflared/YOUR_TUNNEL_ID.json

ingress:
  - hostname: api.mentoring.openplp.com
    service: http://localhost:3001
  - service: http_status:404
```

5. **Run tunnel**:
```bash
cloudflared tunnel run plp-backend
```

## Quick Fix for Testing

If you need a quick fix for testing, you can:

1. **Access the site via HTTP instead**:
   - Use `http://157.10.73.52` instead of `https://mentoring.openplp.com`
   - This will allow HTTP-to-HTTP communication

2. **Disable Mixed Content blocking (NOT for production)**:
   - In Chrome: Click the lock icon → Site settings → Insecure content → Allow
   - This is only for testing and should never be used in production

## Recommended Approach

For production, use **Option 1** with Let's Encrypt SSL. It's free, automatic, and provides proper HTTPS security.

## Update Backend CORS

Ensure your backend allows the HTTPS frontend:

```javascript
// In backend/src/config/security.config.ts
const allowedOrigins = [
  'https://mentoring.openplp.com',
  'https://plp-mentor-sovath.vercel.app',
  // ... other origins
];
```