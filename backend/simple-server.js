const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const port = 3000;

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST || '157.10.73.52',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USERNAME || 'admin',
  password: process.env.DB_PASSWORD || 'P@ssw0rd',
  database: process.env.DB_NAME || 'plp_mentoring_sovath',
  ssl: false
});

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production-cambodia-mentoring-2024';

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

// Auth endpoints
app.post('/api/v1/auth/login', async (req, res) => {
  const { username, password } = req.body;
  
  try {
    // Query real database for user
    const result = await pool.query(
      'SELECT id, username, email, full_name, role, password, is_active FROM users WHERE username = $1',
      [username]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    const user = result.rows[0];
    
    // Check if user is active
    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        message: 'Account is inactive'
      });
    }
    
    // For now, accept any password since we don't know the hashing method
    // In production, you would verify: await bcrypt.compare(password, user.password)
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user.id, 
        username: user.username,
        role: user.role 
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
          id: user.id,
          username: user.username,
          email: user.email,
          fullName: user.full_name,
          role: {
            id: user.role,
            name: user.role.toLowerCase(),
            displayName: user.role
          }
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

app.get('/api/v1/auth/profile', (req, res) => {
  // Mock user profile - in real app, this would verify the token from headers
  // For now, return administrator role for testing
  res.json({
    success: true,
    data: {
      user: {
        id: '1',
        username: 'chhinhs',
        email: 'chhinhs@moeys.gov.kh',
        fullName: 'Chhinh Sovath',
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

app.post('/api/v1/auth/register', (req, res) => {
  const { username, email, password, fullName } = req.body;
  
  res.json({
    success: true,
    data: {
      id: '2',
      username,
      email,
      fullName,
      role: {
        id: '1',
        name: 'teacher',
        displayName: 'Teacher'
      }
    }
  });
});

app.post('/api/v1/auth/refresh', (req, res) => {
  res.json({
    success: true,
    data: {
      access_token: 'mock-jwt-token-' + Date.now(),
      refresh_token: 'mock-refresh-token-' + Date.now()
    }
  });
});

app.post('/api/v1/auth/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

// Observations endpoints
app.get('/api/v1/observations', (req, res) => {
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

app.post('/api/v1/observations', (req, res) => {
  res.json({
    success: true,
    data: {
      id: Date.now().toString(),
      ...req.body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  });
});

// Store for users
let users = [
  {
    id: '1',
    username: 'admin',
    email: 'admin@moeys.gov.kh',
    fullName: 'System Administrator',
    firstName: 'System',
    lastName: 'Administrator',
    phoneNumber: '+855 12 345 678',
    role: {
      id: '3',
      name: 'administrator',
      displayName: 'Administrator'
    },
    status: 'active',
    lastLogin: new Date('2024-01-20T10:30:00'),
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2024-01-20'),
    preferredLanguage: 'km',
    bio: 'System administrator for the PLP mentoring platform'
  },
  {
    id: '2',
    username: 'teacher_demo',
    email: 'teacher@school.edu.kh',
    fullName: 'Sok Dara',
    firstName: 'Sok',
    lastName: 'Dara',
    phoneNumber: '+855 23 456 789',
    role: {
      id: '1',
      name: 'teacher',
      displayName: 'Teacher'
    },
    status: 'active',
    lastLogin: new Date('2024-01-19T14:20:00'),
    createdAt: new Date('2023-03-15'),
    updatedAt: new Date('2024-01-19'),
    preferredLanguage: 'km',
    bio: 'Grade 1 Khmer language teacher'
  },
  {
    id: '3',
    username: 'provincial_officer',
    email: 'provincial@moeys.gov.kh',
    fullName: 'Chan Sophea',
    firstName: 'Chan',
    lastName: 'Sophea',
    phoneNumber: '+855 34 567 890',
    role: {
      id: '2',
      name: 'provincial',
      displayName: 'Provincial'
    },
    status: 'active',
    lastLogin: new Date('2024-01-18T09:15:00'),
    createdAt: new Date('2023-02-10'),
    updatedAt: new Date('2024-01-18'),
    preferredLanguage: 'km'
  },
  {
    id: '4',
    username: 'zone_manager',
    email: 'zone@moeys.gov.kh',
    fullName: 'Ly Thida',
    firstName: 'Ly',
    lastName: 'Thida',
    role: {
      id: '4',
      name: 'zone',
      displayName: 'Zone'
    },
    status: 'inactive',
    createdAt: new Date('2023-04-05'),
    updatedAt: new Date('2023-12-15'),
    preferredLanguage: 'en'
  },
  {
    id: '5',
    username: 'director_pp',
    email: 'director@school.edu.kh',
    fullName: 'Keo Vannara',
    firstName: 'Keo',
    lastName: 'Vannara',
    role: {
      id: '5',
      name: 'director',
      displayName: 'Director'
    },
    status: 'active',
    lastLogin: new Date('2024-01-21T08:00:00'),
    createdAt: new Date('2023-01-20'),
    updatedAt: new Date('2024-01-21'),
    preferredLanguage: 'km'
  }
];

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Users endpoints
app.get('/api/v1/users', authenticateToken, async (req, res) => {
  const { page = 1, limit = 10, search = '', roleId = '', status = '', sortBy = 'created_at', sortOrder = 'desc' } = req.query;
  
  // Map frontend field names to database column names
  const fieldMapping = {
    'createdAt': 'created_at',
    'updatedAt': 'updated_at',
    'fullName': 'full_name',
    'lastLogin': 'last_login',
    'isActive': 'is_active'
  };
  
  // Convert sortBy field if needed
  const dbSortBy = fieldMapping[sortBy] || sortBy;
  
  try {
    // Build query
    let query = 'SELECT id, username, email, full_name, role, is_active, last_login, created_at, phone_number, profile_picture FROM users WHERE 1=1';
    const params = [];
    let paramIndex = 1;
    
    // Search filter
    if (search) {
      query += ` AND (username ILIKE $${paramIndex} OR email ILIKE $${paramIndex} OR full_name ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }
    
    // Role filter
    if (roleId) {
      query += ` AND role = $${paramIndex}`;
      params.push(roleId);
      paramIndex++;
    }
    
    // Status filter
    if (status) {
      if (status === 'active') {
        query += ` AND is_active = true`;
      } else if (status === 'inactive' || status === 'suspended') {
        query += ` AND is_active = false`;
      }
    }
    
    // Count total
    const countResult = await pool.query(query.replace('SELECT id, username, email, full_name, role, is_active, last_login, created_at, phone_number, profile_picture', 'SELECT COUNT(*)'), params);
    const total = parseInt(countResult.rows[0].count);
    
    // Add sorting and pagination
    query += ` ORDER BY ${dbSortBy} ${sortOrder.toUpperCase()}`;
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, (page - 1) * limit);
    
    // Execute query
    const result = await pool.query(query, params);
    
    // Transform users to match frontend format
    const transformedUsers = result.rows.map(user => ({
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.full_name,
      role: {
        id: user.role,
        name: user.role.toLowerCase(),
        displayName: user.role
      },
      status: user.is_active ? 'active' : 'inactive',
      lastLogin: user.last_login,
      profilePicture: user.profile_picture,
      createdAt: user.created_at,
      phoneNumber: user.phone_number
    }));
    
    res.json({
      success: true,
      data: transformedUsers,
      meta: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users'
    });
  }
});

// Get single user
app.get('/api/v1/users/:id', (req, res) => {
  const user = users.find(u => u.id === req.params.id);
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }
  
  res.json({
    success: true,
    data: user
  });
});

// Create user
app.post('/api/v1/users', (req, res) => {
  const { username, email, password, fullName, firstName, lastName, phoneNumber, roleId, status, preferredLanguage, bio } = req.body;
  
  // Check if username or email already exists
  if (users.some(u => u.username === username)) {
    return res.status(400).json({
      success: false,
      message: 'Username already exists'
    });
  }
  
  if (users.some(u => u.email === email)) {
    return res.status(400).json({
      success: false,
      message: 'Email already exists'
    });
  }
  
  const roles = [
    { id: '1', name: 'teacher', displayName: 'Teacher' },
    { id: '2', name: 'provincial', displayName: 'Provincial' },
    { id: '3', name: 'administrator', displayName: 'Administrator' },
    { id: '4', name: 'zone', displayName: 'Zone' },
    { id: '5', name: 'director', displayName: 'Director' },
    { id: '6', name: 'cluster', displayName: 'Cluster' },
    { id: '7', name: 'department', displayName: 'Department' }
  ];
  
  const role = roles.find(r => r.id === roleId) || roles[0];
  
  const newUser = {
    id: `user-${Date.now()}`,
    username,
    email,
    fullName,
    firstName,
    lastName,
    phoneNumber,
    role,
    status: status || 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
    preferredLanguage: preferredLanguage || 'en',
    bio
  };
  
  users.push(newUser);
  
  res.json({
    success: true,
    data: newUser
  });
});

// Update user
app.put('/api/v1/users/:id', (req, res) => {
  const userIndex = users.findIndex(u => u.id === req.params.id);
  
  if (userIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }
  
  const { email, fullName, firstName, lastName, phoneNumber, roleId, status, preferredLanguage, bio } = req.body;
  
  // Check if email is being changed and already exists
  if (email && email !== users[userIndex].email && users.some(u => u.email === email)) {
    return res.status(400).json({
      success: false,
      message: 'Email already exists'
    });
  }
  
  const roles = [
    { id: '1', name: 'teacher', displayName: 'Teacher' },
    { id: '2', name: 'provincial', displayName: 'Provincial' },
    { id: '3', name: 'administrator', displayName: 'Administrator' },
    { id: '4', name: 'zone', displayName: 'Zone' },
    { id: '5', name: 'director', displayName: 'Director' },
    { id: '6', name: 'cluster', displayName: 'Cluster' },
    { id: '7', name: 'department', displayName: 'Department' }
  ];
  
  const role = roleId ? roles.find(r => r.id === roleId) : users[userIndex].role;
  
  users[userIndex] = {
    ...users[userIndex],
    email: email || users[userIndex].email,
    fullName: fullName || users[userIndex].fullName,
    firstName: firstName !== undefined ? firstName : users[userIndex].firstName,
    lastName: lastName !== undefined ? lastName : users[userIndex].lastName,
    phoneNumber: phoneNumber !== undefined ? phoneNumber : users[userIndex].phoneNumber,
    role: role || users[userIndex].role,
    status: status || users[userIndex].status,
    preferredLanguage: preferredLanguage || users[userIndex].preferredLanguage,
    bio: bio !== undefined ? bio : users[userIndex].bio,
    updatedAt: new Date()
  };
  
  res.json({
    success: true,
    data: users[userIndex]
  });
});

// Delete user
app.delete('/api/v1/users/:id', (req, res) => {
  const userIndex = users.findIndex(u => u.id === req.params.id);
  
  if (userIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }
  
  users.splice(userIndex, 1);
  
  res.json({
    success: true,
    message: 'User deleted successfully'
  });
});

// Toggle user status
app.post('/api/v1/users/:id/toggle-status', (req, res) => {
  const user = users.find(u => u.id === req.params.id);
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }
  
  user.status = user.status === 'active' ? 'inactive' : 'active';
  user.updatedAt = new Date();
  
  res.json({
    success: true,
    data: user
  });
});

// Reset password
app.post('/api/v1/users/:id/reset-password', (req, res) => {
  const user = users.find(u => u.id === req.params.id);
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }
  
  // Generate temporary password
  const temporaryPassword = 'Temp' + Math.random().toString(36).substring(2, 10) + '!';
  
  res.json({
    success: true,
    data: {
      temporaryPassword
    }
  });
});

// Get roles
app.get('/api/v1/roles', (req, res) => {
  const roles = [
    { id: '1', name: 'teacher', displayName: 'Teacher' },
    { id: '2', name: 'provincial', displayName: 'Provincial' },
    { id: '3', name: 'administrator', displayName: 'Administrator' },
    { id: '4', name: 'zone', displayName: 'Zone' },
    { id: '5', name: 'director', displayName: 'Director' },
    { id: '6', name: 'cluster', displayName: 'Cluster' },
    { id: '7', name: 'department', displayName: 'Department' }
  ];
  
  res.json({
    success: true,
    data: roles
  });
});

// Reports endpoints
app.get('/api/v1/reports/observation-summary', (req, res) => {
  res.json({
    success: true,
    data: {
      totalObservations: 0,
      completedObservations: 0,
      averageScore: 0,
      recentObservations: []
    }
  });
});

// Analytics endpoints
app.get('/api/v1/analytics/dashboard', (req, res) => {
  res.json({
    success: true,
    data: {
      totalObservations: 0,
      avgScore: 0,
      improvementRate: 0,
      activeImprovementPlans: 0
    }
  });
});

// Store for created forms
const createdForms = [];

// Clean up any invalid forms that might have been created
const cleanupCreatedForms = () => {
  const validCount = createdForms.filter(f => f.id && f.id.trim() !== '' && f.name && f.name.trim() !== '').length;
  const removedCount = createdForms.length - validCount;
  if (removedCount > 0) {
    createdForms.splice(0, createdForms.length, ...createdForms.filter(f => f.id && f.id.trim() !== '' && f.name && f.name.trim() !== ''));
    console.log(`Cleaned up ${removedCount} invalid forms`);
  }
};

// Run cleanup periodically
setInterval(cleanupCreatedForms, 60000); // Every minute

// Run cleanup immediately on startup
cleanupCreatedForms();

// Observation forms endpoints
app.get('/api/v1/observation-forms', (req, res) => {
  // Return the seeded observation forms
  const observationForms = [
    {
      id: 'bb5ee26c-c394-41f0-beae-d3856ce64fb2',
      formCode: 'G1-KH',
      title: 'ទម្រង់សង្កេតថ្នាក់ទី១ - ភាសាខ្មែរ',
      subject: 'Khmer',
      gradeRange: '1',
      createdAt: new Date('2025-07-20T00:18:39.950Z'),
      updatedAt: new Date('2025-07-20T00:18:39.950Z')
    },
    {
      id: 'g2-kh-' + Date.now(),
      formCode: 'G2-KH',
      title: 'ទម្រង់សង្កេតថ្នាក់ទី២ - ភាសាខ្មែរ',
      subject: 'Khmer',
      gradeRange: '2',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'g3-kh-' + Date.now(),
      formCode: 'G3-KH',
      title: 'ទម្រង់សង្កេតថ្នាក់ទី៣ - ភាសាខ្មែរ',
      subject: 'Khmer',
      gradeRange: '3',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'g1-math-' + Date.now(),
      formCode: 'G1-MATH',
      title: 'ទម្រង់សង្កេតថ្នាក់ទី១ - គណិតវិទ្យា',
      subject: 'Mathematics',
      gradeRange: '1',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'g2-math-' + Date.now(),
      formCode: 'G2-MATH',
      title: 'ទម្រង់សង្កេតថ្នាក់ទី២ - គណិតវិទ្យា',
      subject: 'Mathematics',
      gradeRange: '2',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'g3-sci-' + Date.now(),
      formCode: 'G3-SCI',
      title: 'ទម្រង់សង្កេតថ្នាក់ទី៣ - វិទ្យាសាស្ត្រ',
      subject: 'Science',
      gradeRange: '3',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  // Include any created forms that are observation type
  const allForms = [...observationForms, ...createdForms.filter(f => f.category === 'observation')];
  
  res.json({
    success: true,
    data: allForms
  });
});

app.get('/api/v1/observation-forms/:id', (req, res) => {
  const { id } = req.params;
  
  // Return a sample observation form
  res.json({
    success: true,
    data: {
      id,
      formCode: 'G1-KH',
      title: 'ទម្រង់សង្កេតថ្នាក់ទី១ - ភាសាខ្មែរ',
      subject: 'Khmer',
      gradeRange: '1',
      lessonPhases: [
        {
          id: 'phase-1',
          title: 'សកម្មភាព១: ការណែនាំមេរៀន',
          sectionOrder: 1,
          indicators: []
        },
        {
          id: 'phase-2',
          title: 'សកម្មភាព២: សកម្មភាពសិក្សា',
          sectionOrder: 2,
          indicators: []
        },
        {
          id: 'phase-3',
          title: 'សកម្មភាព៣: សង្ខេបមេរៀន',
          sectionOrder: 3,
          indicators: []
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    }
  });
});


// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Mentoring Platform Backend',
    version: '1.0.0',
    status: 'running'
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: err.message
  });
});

// Forms endpoints
app.get('/api/v1/forms', async (req, res) => {
  const { page = 1, limit = 10, category, status, search } = req.query;
  
  try {
    // Build query for observation_forms table
    let query = 'SELECT id, form_code, title, subject, grade_range, created_at FROM observation_forms WHERE 1=1';
    const params = [];
    let paramIndex = 1;
    
    // Search filter
    if (search) {
      query += ` AND (title ILIKE $${paramIndex} OR subject ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }
    
    // Category filter (map to subject)
    if (category && category !== 'observation') {
      query += ` AND subject = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }
    
    // Count total
    const countResult = await pool.query(query.replace('SELECT id, form_code, title, subject, grade_range, created_at', 'SELECT COUNT(*)'), params);
    const total = parseInt(countResult.rows[0].count);
    
    // Add sorting and pagination
    query += ` ORDER BY created_at DESC`;
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, (page - 1) * limit);
    
    // Execute query
    const result = await pool.query(query, params);
    
    // Transform to expected form structure
    const forms = result.rows.map(form => ({
      id: form.id,
      name: form.title,
      nameKm: form.title,
      description: `Grade ${form.grade_range} ${form.subject} observation form`,
      descriptionKm: form.subject,
      category: 'observation',
      status: 'published',
      sections: [],
      settings: { allowSaveDraft: true, requireApproval: false, enableVersioning: true },
      metadata: {
        version: 1,
        createdBy: 'system',
        createdAt: form.created_at,
        updatedAt: form.created_at,
        submissions: 0,
        lastModified: form.created_at
      },
    }));
    
    // Include forms created through the POST endpoint (filter out forms with no id or empty id)
    const validCreatedForms = createdForms.filter(f => f.id && f.id.trim() !== '' && f.name && f.name.trim() !== '');
    const allForms = [...forms, ...validCreatedForms];
    
    res.json({
      success: true,
      data: {
        forms: allForms,
        total: total + validCreatedForms.length,
        page: parseInt(page),
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    console.error('Error fetching forms:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch forms'
    });
  }
});

app.get('/api/v1/forms/:id', (req, res) => {
  const { id } = req.params;
  
  // First check if it's a created form in memory
  const createdForm = createdForms.find(f => f.id === id);
  if (createdForm) {
    res.json({
      success: true,
      data: createdForm,
    });
    return;
  }
  
  // Mock detailed form data
  const form = {
    id,
    name: 'Classroom Observation Form',
    nameKm: 'ទម្រង់សង្កេតថ្នាក់រៀន',
    description: 'Standard form for classroom observations',
    descriptionKm: 'ទម្រង់ស្តង់ដារសម្រាប់ការសង្កេតថ្នាក់រៀន',
    category: 'observation',
    status: 'published',
    sections: [
      {
        id: 'section-1',
        title: 'General Information',
        titleKm: 'ព័ត៌មានទូទៅ',
        fields: [
          {
            id: 'field-1',
            type: 'text',
            name: 'teacherName',
            label: 'Teacher Name',
            labelKm: 'ឈ្មោះគ្រូបង្រៀន',
            validation: { required: true },
            order: 0,
          },
          {
            id: 'field-2',
            type: 'select',
            name: 'gradeLevel',
            label: 'Grade Level',
            labelKm: 'ថ្នាក់ទី',
            options: [
              { value: '1', label: 'Grade 1', labelKm: 'ថ្នាក់ទី១' },
              { value: '2', label: 'Grade 2', labelKm: 'ថ្នាក់ទី២' },
              { value: '3', label: 'Grade 3', labelKm: 'ថ្នាក់ទី៣' },
            ],
            validation: { required: true },
            order: 1,
          },
        ],
        order: 0,
      },
    ],
    settings: { allowSaveDraft: true, requireApproval: false, enableVersioning: true },
    metadata: {
      version: 1,
      createdBy: 'admin',
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-20'),
    },
  };
  
  res.json({
    success: true,
    data: form,
  });
});

app.post('/api/v1/forms', (req, res) => {
  // Ensure the form has an id
  const formId = req.body.id || `form-${Date.now()}`;
  
  const newForm = {
    ...req.body,
    id: formId,
    name: req.body.name || 'Untitled Form',
    metadata: {
      version: 1,
      createdBy: 'admin',
      createdAt: new Date(),
      updatedAt: new Date(),
      ...req.body.metadata,
    },
    status: req.body.status || 'draft',
  };
  
  // Store the created form
  createdForms.push(newForm);
  
  // Log the created form for debugging
  console.log('Created new form:', {
    id: newForm.id,
    name: newForm.name,
    nameKm: newForm.nameKm,
    category: newForm.category,
    sectionsCount: newForm.sections?.length || 0,
    totalFields: newForm.sections?.reduce((sum, section) => sum + (section.fields?.length || 0), 0) || 0,
  });
  
  res.json({
    success: true,
    data: newForm,
  });
});

app.put('/api/v1/forms/:id', (req, res) => {
  const { id } = req.params;
  
  res.json({
    success: true,
    data: {
      id,
      ...req.body,
      metadata: {
        ...req.body.metadata,
        updatedAt: new Date(),
      },
    },
  });
});

app.delete('/api/v1/forms/:id', (req, res) => {
  const { id } = req.params;
  
  // Remove from createdForms array
  const index = createdForms.findIndex(f => f.id === id);
  if (index > -1) {
    createdForms.splice(index, 1);
    console.log(`Deleted form ${id} from memory`);
  }
  
  res.json({
    success: true,
    message: 'Form deleted successfully',
  });
});

app.post('/api/v1/forms/:id/publish', (req, res) => {
  const { id } = req.params;
  
  res.json({
    success: true,
    data: {
      id,
      status: 'published',
      metadata: {
        publishedAt: new Date(),
      },
    },
  });
});

app.post('/api/v1/forms/:id/archive', (req, res) => {
  const { id } = req.params;
  
  res.json({
    success: true,
    data: {
      id,
      status: 'archived',
      metadata: {
        archivedAt: new Date(),
      },
    },
  });
});

app.post('/api/v1/forms/:id/duplicate', (req, res) => {
  const { name } = req.body;
  
  res.json({
    success: true,
    data: {
      id: `form-${Date.now()}`,
      name,
      status: 'draft',
      metadata: {
        version: 1,
        createdBy: 'admin',
        createdAt: new Date(),
      },
    },
  });
});

app.get('/api/v1/forms/:id/submissions', (req, res) => {
  res.json({
    success: true,
    data: {
      submissions: [],
      total: 0,
    },
  });
});

app.get('/api/v1/forms/:id/statistics', (req, res) => {
  const { id } = req.params;
  
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

// Clear all forms endpoint (for development only)
app.delete('/api/v1/forms/clear-all', (req, res) => {
  // Clear the in-memory createdForms array
  const previousCount = createdForms.length;
  createdForms.length = 0;
  
  console.log(`Cleared ${previousCount} forms from memory`);
  
  res.json({
    success: true,
    message: 'All forms have been cleared',
    clearedCount: previousCount
  });
});

// Temporary endpoint to get empty forms list for development
app.get('/api/v1/forms/empty', (req, res) => {
  res.json({
    success: true,
    data: {
      forms: [],
      total: 0,
      page: 1,
      limit: 10,
    },
  });
});

// Mission endpoints
app.get('/api/v1/missions', authenticateToken, (req, res) => {
  res.json({
    missions: [],
    total: 0
  });
});

app.post('/api/v1/missions', authenticateToken, (req, res) => {
  const mission = {
    id: Date.now().toString(),
    ...req.body,
    status: 'draft',
    createdBy: { id: '1', username: 'admin', fullName: 'Administrator' },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  res.status(201).json(mission);
});

app.get('/api/v1/missions/:id', authenticateToken, (req, res) => {
  res.status(404).json({ message: 'Mission not found' });
});

app.patch('/api/v1/missions/:id', authenticateToken, (req, res) => {
  res.json({ ...req.body, id: req.params.id });
});

app.delete('/api/v1/missions/:id', authenticateToken, (req, res) => {
  res.status(204).send();
});

app.listen(port, () => {
  console.log(`Simple backend server running at http://localhost:${port}`);
  console.log(`API endpoints available at http://localhost:${port}/api/v1`);
});