const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const app = express();

// Security middleware
app.use(helmet());
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'CropGenesis API is running',
    timestamp: new Date().toISOString()
  });
});

// Mock auth routes for testing
app.post('/api/auth/register', (req, res) => {
  console.log('Register request received:', req.body);
  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user: {
        id: 'mock-user-id-' + Date.now(),
        name: req.body.name,
        email: req.body.email || req.body.phone + '@cropgenesis.com',
        phone: req.body.phone,
        location: req.body.location,
        language: req.body.language
      },
      token: 'mock-jwt-token-' + Date.now()
    }
  });
});

app.post('/api/auth/login', (req, res) => {
  console.log('Login request received:', req.body);
  
  // Mock user data based on login credentials
  let userData = {
    id: 'mock-user-id',
    name: 'Test User',
    email: 'test@example.com',
    phone: '1234567890'
  };
  
  // If logging in with phone number, return appropriate user data
  if (req.body.phone) {
    userData = {
      id: 'mock-user-id-anshika',
      name: 'Anshika',
      email: 'anshika@cropgenesis.com',
      phone: req.body.phone,
      location: 'Jaipur',
      language: 'en'
    };
  }
  
  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      user: userData,
      token: 'mock-jwt-token-' + Date.now()
    }
  });
});

// Mock crop plan route
app.post('/api/cropplan/generate', (req, res) => {
  console.log('Crop plan request received:', req.body);
  res.status(200).json({
    success: true,
    message: 'Crop plan generated successfully',
    data: {
      plan: {
        id: 'mock-plan-id',
        soilType: req.body.soilType,
        landSize: req.body.landSize,
        irrigation: req.body.irrigation,
        season: req.body.season,
        preferredLanguage: req.body.preferredLanguage,
        recommendations: [
          'Plant corn in rows with 30cm spacing',
          'Use drip irrigation for water efficiency',
          'Apply organic fertilizer before planting',
          'Monitor soil moisture regularly'
        ],
        createdAt: new Date().toISOString()
      }
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'API endpoint not found' 
  });
});

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 CropGenesis API server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🌱 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`⚠️  Running in MOCK mode - no database required`);
});

module.exports = app;
