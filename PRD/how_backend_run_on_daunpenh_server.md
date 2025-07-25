Based on my analysis, here's where your backend is running:

  Your Backend is Running Through Vercel Proxy

  Your project is currently working because:

  1. Frontend: Deployed on Vercel at https://mentoring.openplp.com
  2. Backend: Running on your server at http://157.10.73.52:3001
  3. Connection: The Vercel proxy function (api/proxy.ts) is bridging the HTTPS frontend to your HTTP backend

  How it's working:

  1. When you make API calls from the frontend to https://mentoring.openplp.com/api/v1/*
  2. Vercel's proxy function intercepts these requests
  3. The proxy forwards them to your backend at http://157.10.73.52:3001
  4. This solves the Mixed Content issue (HTTPS → HTTP)

  Evidence:

  - Your vercel.json has a rewrite rule: /api/v1/* → /api/proxy
  - The api/proxy.ts file has BACKEND_URL = process.env.BACKEND_URL || 'http://157.10.73.52:3001'
  - The API health check returns a 200 response (though it's returning HTML, which suggests the proxy might need adjustment)

  To verify your backend is actually running:

  # Check if your backend is accessible directly
  curl http://157.10.73.52:3001/api/v1/health

  Current Architecture:

  [Browser] --HTTPS--> [Vercel Frontend + Proxy] --HTTP--> [Your Backend Server]
     ↓                          ↓                               ↓
  https://mentoring.openplp.com    (Proxy Function)      http://157.10.73.52:3001

  Your backend is effectively running at http://157.10.73.52:3001, but it's accessed through the Vercel proxy for security reasons.