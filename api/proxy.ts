import type { VercelRequest, VercelResponse } from '@vercel/node';

// Backend URL - update this to your actual backend
const BACKEND_URL = process.env.BACKEND_URL || 'http://157.10.73.52:3001';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Get the path after /api/
  const { url, method, headers, body } = req;
  const path = url?.replace('/api/proxy', '') || '';
  
  console.log(`Proxying ${method} request to: ${BACKEND_URL}${path}`);
  
  try {
    // Build headers
    const proxyHeaders: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    // Forward authorization header if present
    if (headers.authorization) {
      proxyHeaders['Authorization'] = headers.authorization;
    }
    
    // Make the request to backend
    const response = await fetch(`${BACKEND_URL}${path}`, {
      method: method as any,
      headers: proxyHeaders,
      body: method !== 'GET' && method !== 'HEAD' ? JSON.stringify(body) : undefined,
    });
    
    // Get response data
    const data = await response.text();
    
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Handle OPTIONS requests
    if (method === 'OPTIONS') {
      return res.status(200).end();
    }
    
    // Return the response
    res.status(response.status);
    
    // Try to parse as JSON, otherwise return as text
    try {
      const jsonData = JSON.parse(data);
      res.json(jsonData);
    } catch {
      res.send(data);
    }
  } catch (error: any) {
    console.error('Proxy error:', error);
    res.status(500).json({
      error: 'Proxy error',
      message: error.message,
      backend: BACKEND_URL,
    });
  }
}