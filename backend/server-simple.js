const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

// Import models
const CropPlan = require('./models/CropPlan');

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

// Crop plan route with real Gemini integration
app.post('/api/cropplan/generate', async (req, res) => {
  try {
    console.log('Crop plan request received:', req.body);
    
    const { generateCropPlan } = require('./utils/gemini');
    
    // Generate crop plan using Gemini AI (with fallback)
    const aiResponse = await generateCropPlan(req.body);
    
    if (!aiResponse.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to generate crop plan'
      });
    }

    // Normalize and cap plan text to avoid DB validation errors/timeouts
    let planText = (aiResponse.planText || '').toString().trim();
    const MAX_PLAN_CHARS = 10000;
    if (planText.length > MAX_PLAN_CHARS) {
      const followUpSuggestion = '\n\n💡 Have more questions about this plan? Use the "Ask Follow-up Questions" section below to get detailed answers about any specific aspect of your crop plan.';
      const budget = MAX_PLAN_CHARS - followUpSuggestion.length;
      planText = planText.slice(0, Math.max(0, budget)) + followUpSuggestion;
    }

    // Create a mock user ID for simple server (in real app, this would come from authentication)
    const mockUserId = new mongoose.Types.ObjectId();

    // Save crop plan to database
    const cropPlan = new CropPlan({
      userId: mockUserId,
      planText,
      planAudioURL: null, // TTS not implemented in simple server
      inputs: {
        soilType: req.body.soilType,
        landSize: req.body.landSize,
        irrigation: req.body.irrigation,
        season: req.body.season,
        preferredLanguage: req.body.preferredLanguage || 'en',
        additionalNotes: req.body.additionalNotes || ''
      }
    });

    await cropPlan.save();

    res.status(201).json({
      success: true,
      message: 'Crop plan generated successfully',
      data: {
        plan: cropPlan,
        audioURL: null, // TTS not implemented in simple server
        source: aiResponse.source || 'unknown'
      }
    });
  } catch (error) {
    console.error('Error generating crop plan:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Follow-up question route (simple implementation)
app.post('/api/cropplan/followup', async (req, res) => {
  try {
    console.log('Follow-up question received:', req.body);
    
    const { planId, question } = req.body;
    
    // Basic validation
    if (!planId || !question || question.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Plan ID and question are required'
      });
    }
    
    // Validate planId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(planId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid plan ID format'
      });
    }
    
    // Validate question length
    if (question.trim().length > 500) {
      return res.status(400).json({
        success: false,
        message: 'Question must be 500 characters or less'
      });
    }
    
    // Find the crop plan in the database
    const cropPlan = await CropPlan.findById(planId);
    if (!cropPlan) {
      return res.status(404).json({
        success: false,
        message: 'Crop plan not found'
      });
    }
    
    const { generateFollowUpResponse } = require('./utils/gemini');
    
    // Generate follow-up response using Gemini AI with the actual plan context
    const aiResponse = await generateFollowUpResponse(
      planId,
      question,
      cropPlan.planText,
      cropPlan.inputs.preferredLanguage || 'en'
    );
    
    if (!aiResponse.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to generate follow-up response'
      });
    }
    
    // Add follow-up question and answer to the crop plan document
    await cropPlan.addFollowUp(question, aiResponse.answerText);
    
    res.json({
      success: true,
      message: 'Follow-up response generated successfully',
      data: {
        answer: aiResponse.answerText,
        audioURL: null, // TTS not implemented in simple server
        followUpCount: cropPlan.followUpQuestions.length
      }
    });
    
  } catch (error) {
    console.error('Follow-up error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate follow-up response'
    });
  }
});

// Get specific crop plan with follow-up questions
app.get('/api/cropplan/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate planId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid plan ID format'
      });
    }
    
    const cropPlan = await CropPlan.findById(id);
    if (!cropPlan) {
      return res.status(404).json({
        success: false,
        message: 'Crop plan not found'
      });
    }
    
    res.json({
      success: true,
      data: {
        plan: cropPlan
      }
    });
    
  } catch (error) {
    console.error('Get crop plan error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get crop plan'
    });
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'API endpoint not found' 
  });
});

// Connect to MongoDB
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cropgenesis';
    await mongoose.connect(mongoURI);
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

// Start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  
  app.listen(PORT, () => {
    console.log(`🚀 CropGenesis API server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`🌱 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`💾 Database: MongoDB connected`);
  });
};

startServer();

module.exports = app;
