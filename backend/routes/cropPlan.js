const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const CropPlan = require('../models/CropPlan');
const { authenticateToken } = require('../middleware/auth');
const { validateCropPlan, validateFollowUp } = require('../middleware/validation');
const { generateCropPlan, generateFollowUpResponse, generateTTS } = require('../utils/gemini');
const { handleCropPlanUpload, validateCropPlanFiles, cleanupFile, getCropPlanFileInfo } = require('../utils/upload');

/**
 * @route   GET /api/cropplan/status
 * @desc    Check AI service status
 * @access  Private
 */
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const hasApiKey = !!(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here');
    
    let connectionStatus = 'not_configured';
    let connectionMessage = 'Gemini API key is not configured';
    
    if (hasApiKey) {
      // Test the connection
      const { testGeminiConnection } = require('../utils/gemini');
      const testResult = await testGeminiConnection();
      
      if (testResult.success) {
        connectionStatus = 'connected';
        connectionMessage = 'Gemini AI is connected and ready';
      } else {
        connectionStatus = 'error';
        connectionMessage = `Gemini AI connection failed: ${testResult.message}`;
      }
    }
    
    res.json({
      success: true,
      data: {
        hasApiKey,
        status: connectionStatus,
        message: connectionMessage
      }
    });
  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check AI service status'
    });
  }
});

/**
 * @route   POST /api/cropplan/generate
 * @desc    Generate a new crop plan
 * @access  Private
 */
router.post('/generate', authenticateToken, handleCropPlanUpload, validateCropPlanFiles, validateCropPlan, async (req, res) => {
  try {
    const inputs = req.body;
    const files = req.files;
    
    // Get user ID from authenticated user
    const userId = req.user._id;
    
    // Use user's language preference if not provided in request
    const preferredLanguage = inputs.preferredLanguage || 'en';

    // Get file information if files were uploaded
    const fileInfo = getCropPlanFileInfo(files);
    let imageURL = null;
    let videoURL = null;

    // Generate crop plan using Gemini AI with media files
    const aiResponse = await generateCropPlan({ 
      ...inputs, 
      preferredLanguage,
      imagePath: fileInfo.image ? fileInfo.image.path : null,
      videoPath: fileInfo.video ? fileInfo.video.path : null
    });
    
    if (!aiResponse.success) {
      // Clean up uploaded files if AI generation fails
      if (fileInfo.image) {
        cleanupFile(fileInfo.image.path);
      }
      if (fileInfo.video) {
        cleanupFile(fileInfo.video.path);
      }
      
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

    // Generate audio for the plan (placeholder implementation)
    const audioURL = await generateTTS(planText, preferredLanguage);

    // Set file URLs if files were uploaded
    if (fileInfo.image) {
      imageURL = `/uploads/${fileInfo.image.filename}`;
    }
    if (fileInfo.video) {
      videoURL = `/uploads/${fileInfo.video.filename}`;
    }

    // Save crop plan to database
    const cropPlan = new CropPlan({
      userId,
      planText,
      planAudioURL: audioURL,
      imageURL,
      videoURL,
      inputs: {
        soilType: inputs.soilType,
        landSize: inputs.landSize,
        irrigation: inputs.irrigation,
        season: inputs.season,
        preferredLanguage: preferredLanguage,
        additionalNotes: inputs.additionalNotes || ''
      }
    });

    await cropPlan.save();

    console.log('Crop plan saved with ID:', cropPlan._id);

    res.status(201).json({
      success: true,
      message: 'Crop plan generated successfully',
      data: {
        plan: cropPlan,
        audioURL: audioURL,
        source: aiResponse.source || 'unknown'
      }
    });

  } catch (error) {
    console.error('Generate crop plan error:', error);
    
    // Provide more specific error messages
    let errorMessage = 'Failed to generate crop plan';
    let statusCode = 500;
    
    if (error.message.includes('API key')) {
      errorMessage = 'AI service is not properly configured. Please contact support.';
      statusCode = 503;
    } else if (error.message.includes('quota')) {
      errorMessage = 'AI service quota exceeded. Please try again later.';
      statusCode = 503;
    } else if (error.message.includes('network')) {
      errorMessage = 'Network error. Please check your connection and try again.';
      statusCode = 503;
    } else if (error.message.includes('validation')) {
      errorMessage = 'Invalid input data. Please check your form inputs.';
      statusCode = 400;
    }
    
    res.status(statusCode).json({
      success: false,
      message: errorMessage,
      ...(process.env.NODE_ENV === 'development' && { details: error.message })
    });
  }
});

/**
 * @route   POST /api/cropplan/followup
 * @desc    Ask follow-up question about a crop plan
 * @access  Private
 */
router.post('/followup', authenticateToken, validateFollowUp, async (req, res) => {
  try {
    const { planId, question } = req.body;
    
    console.log('Follow-up request received:', { planId, question: question?.substring(0, 50) + '...' });
    
    // Find crop plan by ID and verify it belongs to the authenticated user
    const cropPlan = await CropPlan.findOne({ _id: planId, userId: req.user._id });
    if (!cropPlan) {
      return res.status(404).json({
        success: false,
        message: 'Crop plan not found'
      });
    }

    // Generate follow-up response using Gemini AI
    const aiResponse = await generateFollowUpResponse(
      planId,
      question,
      cropPlan.planText,
      cropPlan.inputs.preferredLanguage
    );

    if (!aiResponse.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to generate follow-up response'
      });
    }

    // Generate audio for the response
    const audioURL = await generateTTS(aiResponse.answerText, cropPlan.inputs.preferredLanguage);

    // Add follow-up to the crop plan
    await cropPlan.addFollowUp(question, aiResponse.answerText);

    res.json({
      success: true,
      message: 'Follow-up response generated successfully',
      data: {
        answer: aiResponse.answerText,
        audioURL: audioURL,
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

/**
 * @route   GET /api/cropplan/:id
 * @desc    Get a specific crop plan
 * @access  Private
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const cropPlan = await CropPlan.findOne({ _id: id, userId })
      .populate('userId', 'name phone location');

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

/**
 * @route   GET /api/cropplan
 * @desc    Get user's crop plans with pagination
 * @access  Private
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    // Get crop plans with pagination
    const cropPlans = await CropPlan.getUserPlans(userId, page, limit);

    // Get total count for pagination
    const totalCount = await CropPlan.countDocuments({ userId });
    const totalPages = Math.ceil(totalCount / limit);

    res.json({
      success: true,
      data: {
        plans: cropPlans,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get crop plans error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get crop plans'
    });
  }
});

/**
 * @route   DELETE /api/cropplan/:id
 * @desc    Delete a crop plan
 * @access  Private
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const cropPlan = await CropPlan.findOneAndDelete(
      { _id: id, userId }
    );

    if (!cropPlan) {
      return res.status(404).json({
        success: false,
        message: 'Crop plan not found'
      });
    }

    res.json({
      success: true,
      message: 'Crop plan deleted successfully'
    });

  } catch (error) {
    console.error('Delete crop plan error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete crop plan'
    });
  }
});

/**
 * @route   GET /api/cropplan/stats/summary
 * @desc    Get user's crop plan statistics
 * @access  Private
 */
router.get('/stats/summary', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;

    // Get statistics
    const stats = await CropPlan.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          totalPlans: { $sum: 1 },
          totalFollowUps: { $sum: { $size: '$followUpQuestions' } },
          seasons: { $addToSet: '$inputs.season' },
          soilTypes: { $addToSet: '$inputs.soilType' },
          irrigationTypes: { $addToSet: '$inputs.irrigation' }
        }
      }
    ]);

    const result = stats[0] || {
      totalPlans: 0,
      totalFollowUps: 0,
      seasons: [],
      soilTypes: [],
      irrigationTypes: []
    };

    res.json({
      success: true,
      data: {
        stats: result
      }
    });

  } catch (error) {
    console.error('Get crop plan stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get crop plan statistics'
    });
  }
});

module.exports = router;
