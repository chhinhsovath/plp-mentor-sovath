const express = require('express');
const cors = require('cors');
const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/v1/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'mentoring-platform-backend'
  });
});

// Simple login endpoint
app.post('/api/v1/auth/login', (req, res) => {
  const { username, password } = req.body;
  
  if (username && password) {
    const mockUser = {
      id: '1',
      username: username,
      email: `${username}@example.com`,
      fullName: username === 'chhinhs' ? 'Chhinh Sovath' : 'Test User',
      role: {
        id: username === 'chhinhs' || username === 'admin' ? '3' : '1',
        name: username === 'chhinhs' || username === 'admin' ? 'administrator' : 'teacher',
        displayName: username === 'chhinhs' || username === 'admin' ? 'Administrator' : 'Teacher'
      }
    };
    
    res.json({
      success: true,
      data: {
        user: mockUser,
        token: 'mock-jwt-token-' + Date.now()
      }
    });
  } else {
    res.status(400).json({
      success: false,
      message: 'Username and password required'
    });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Simple backend server running at http://localhost:${port}`);
});