const express = require('express');
const cors = require('cors');
const app = express();

// Enable CORS for all origins during development
app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json());

// Mock login endpoint
app.post('/api/v1/auth/login', (req, res) => {
  const { username, password } = req.body;
  
  console.log('Login attempt:', { username, password });
  
  // Check for test user
  if (username === 'chhinhs' && password === 'password') {
    res.json({
      user: {
        id: 1,
        username: 'chhinhs',
        fullName: 'Chhinhhs Test User',
        email: 'chhinhs@example.com',
        role: {
          id: 1,
          name: 'administrator',
          displayName: 'Administrator'
        }
      },
      tokens: {
        accessToken: 'mock-access-token-' + Date.now(),
        refreshToken: 'mock-refresh-token-' + Date.now()
      }
    });
  } else {
    res.status(401).json({
      message: 'Invalid credentials',
      statusCode: 401
    });
  }
});

// Mock refresh endpoint
app.post('/api/v1/auth/refresh', (req, res) => {
  res.json({
    accessToken: 'mock-access-token-' + Date.now(),
    refreshToken: 'mock-refresh-token-' + Date.now()
  });
});

// Mock user endpoint
app.get('/api/v1/auth/me', (req, res) => {
  res.json({
    id: 1,
    username: 'chhinhs',
    fullName: 'Chhinhhs Test User',
    email: 'chhinhs@example.com',
    role: {
      id: 1,
      name: 'administrator',
      displayName: 'Administrator'
    }
  });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Mock server running on http://localhost:${PORT}`);
  console.log('Test credentials: username=chhinhs, password=password');
});