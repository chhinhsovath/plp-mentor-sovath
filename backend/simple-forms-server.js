const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();
const port = 3000;

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production-cambodia-mentoring-2024';

// Middleware
app.use(cors());
app.use(express.json());

// Store for created forms
const createdForms = [];

// Health check endpoint
app.get('/api/v1/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'mentoring-platform-backend'
  });
});

// Auth endpoints
app.post('/api/v1/auth/login', async (req, res) => {
  const { username, password } = req.body;
  
  // Simple auth for testing
  if (username && password) {
    const token = jwt.sign(
      { 
        id: '1', 
        username: username,
        role: 'administrator' 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({
      success: true,
      data: {
        access_token: token,
        refresh_token: 'refresh-' + token,
        user: {
          id: '1',
          username: username,
          email: username + '@moeys.gov.kh',
          fullName: 'Test User',
          role: {
            id: '3',
            name: 'administrator',
            displayName: 'Administrator'
          }
        }
      }
    });
  } else {
    res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }
});

app.get('/api/v1/auth/profile', (req, res) => {
  res.json({
    success: true,
    data: {
      user: {
        id: '1',
        username: 'admin',
        email: 'admin@moeys.gov.kh',
        fullName: 'Administrator',
        role: {
          id: '3',
          name: 'administrator',
          displayName: 'Administrator'
        }
      }
    }
  });
});

app.post('/api/v1/auth/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

// Forms endpoints
app.get('/api/v1/forms', (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  
  // Return only valid forms (with proper IDs and names)
  const validForms = createdForms.filter(f => 
    f.id && 
    f.id.toString().trim() !== '' && 
    f.name && 
    f.name.toString().trim() !== ''
  );
  
  res.json({
    success: true,
    data: {
      forms: validForms,
      total: validForms.length,
      page: parseInt(page),
      limit: parseInt(limit),
    },
  });
});

app.get('/api/v1/forms/:id', (req, res) => {
  const { id } = req.params;
  
  const form = createdForms.find(f => f.id === id);
  if (form) {
    res.json({
      success: true,
      data: form,
    });
  } else {
    res.status(404).json({
      success: false,
      message: 'Form not found'
    });
  }
});

app.post('/api/v1/forms', (req, res) => {
  const formId = req.body.id || `form-${Date.now()}`;
  
  const newForm = {
    ...req.body,
    id: formId,
    name: req.body.name || 'Untitled Form',
    nameKm: req.body.nameKm || req.body.name || 'ទម្រង់គ្មានចំណងជើង',
    metadata: {
      version: 1,
      createdBy: 'admin',
      createdAt: new Date(),
      updatedAt: new Date(),
      ...req.body.metadata,
    },
    status: req.body.status || 'draft',
  };
  
  createdForms.push(newForm);
  
  res.json({
    success: true,
    data: newForm,
  });
});

app.put('/api/v1/forms/:id', (req, res) => {
  const { id } = req.params;
  const formIndex = createdForms.findIndex(f => f.id === id);
  
  if (formIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Form not found'
    });
  }
  
  createdForms[formIndex] = {
    ...createdForms[formIndex],
    ...req.body,
    id, // Ensure ID doesn't change
    metadata: {
      ...createdForms[formIndex].metadata,
      ...req.body.metadata,
      updatedAt: new Date(),
    },
  };
  
  res.json({
    success: true,
    data: createdForms[formIndex],
  });
});

app.delete('/api/v1/forms/:id', (req, res) => {
  const { id } = req.params;
  
  const index = createdForms.findIndex(f => f.id === id);
  if (index > -1) {
    createdForms.splice(index, 1);
    res.json({
      success: true,
      message: 'Form deleted successfully',
    });
  } else {
    res.status(404).json({
      success: false,
      message: 'Form not found'
    });
  }
});

app.post('/api/v1/forms/:id/publish', (req, res) => {
  const { id } = req.params;
  const form = createdForms.find(f => f.id === id);
  
  if (form) {
    form.status = 'published';
    form.metadata.publishedAt = new Date();
    res.json({
      success: true,
      data: form,
    });
  } else {
    res.status(404).json({
      success: false,
      message: 'Form not found'
    });
  }
});

app.post('/api/v1/forms/:id/archive', (req, res) => {
  const { id } = req.params;
  const form = createdForms.find(f => f.id === id);
  
  if (form) {
    form.status = 'archived';
    form.metadata.archivedAt = new Date();
    res.json({
      success: true,
      data: form,
    });
  } else {
    res.status(404).json({
      success: false,
      message: 'Form not found'
    });
  }
});

app.post('/api/v1/forms/:id/duplicate', (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  const originalForm = createdForms.find(f => f.id === id);
  
  if (originalForm) {
    const newForm = {
      ...originalForm,
      id: `form-${Date.now()}`,
      name: name || `${originalForm.name} (Copy)`,
      nameKm: name || `${originalForm.nameKm || originalForm.name} (ចម្លង)`,
      status: 'draft',
      metadata: {
        ...originalForm.metadata,
        version: 1,
        createdBy: 'admin',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    };
    
    createdForms.push(newForm);
    
    res.json({
      success: true,
      data: newForm,
    });
  } else {
    res.status(404).json({
      success: false,
      message: 'Form not found'
    });
  }
});

app.get('/api/v1/forms/:id/statistics', (req, res) => {
  res.json({
    success: true,
    data: {
      totalSubmissions: 0,
      completedSubmissions: 0,
      draftSubmissions: 0,
      uniqueUsers: 0,
      averageCompletionTime: 0,
      submissionsByDate: [],
      submissionsByUser: [],
    },
  });
});

// Users endpoints (minimal for login)
app.get('/api/v1/users', (req, res) => {
  res.json({
    success: true,
    data: [],
    meta: {
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0
    }
  });
});

// Roles endpoint
app.get('/api/v1/roles', (req, res) => {
  const roles = [
    { id: '1', name: 'teacher', displayName: 'Teacher' },
    { id: '2', name: 'provincial', displayName: 'Provincial' },
    { id: '3', name: 'administrator', displayName: 'Administrator' },
    { id: '4', name: 'zone', displayName: 'Zone' },
    { id: '5', name: 'director', displayName: 'Director' },
  ];
  
  res.json({
    success: true,
    data: roles
  });
});

// Catch all for other endpoints
app.use('/api/v1/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found'
  });
});

app.listen(port, () => {
  console.log(`Simple forms backend running at http://localhost:${port}`);
  console.log(`API endpoints available at http://localhost:${port}/api/v1`);
  console.log(`\nThis server doesn't require database connection.`);
  console.log(`Forms are stored in memory and will be lost on restart.`);
});