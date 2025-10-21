const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Diagnosis = require('../models/Diagnosis');
const { authenticateToken } = require('../middleware/auth');
const { handleUpload, validateFile, cleanupFile, getFileInfo } = require('../utils/upload');
const { analyzeDisease, generateTTS } = require('../utils/gemini');

/**
 * @route   POST /api/diagnosis/upload
 * @desc    Upload image/video for disease diagnosis
 * @access  Private
 */
router.post('/upload', authenticateToken, handleUpload, validateFile, async (req, res) => {
  let filePath = null;
  
  try {
    const userId = req.user._id;
    const userLanguage = req.user.language || 'en';
    
    // Get file information
    const fileInfo = getFileInfo(req.file);
    filePath = fileInfo.path;

    // Analyze disease using Gemini AI
    const aiResponse = await analyzeDisease(filePath, fileInfo.type, userLanguage);
    
    if (!aiResponse.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to analyze disease'
      });
    }

    // Generate audio for the diagnosis
    const audioURL = await generateTTS(aiResponse.diagnosisText, userLanguage);

    // Truncate text fields to fit database limits
    const truncateText = (text, maxLength) => {
      if (!text) return text;
      return text.length > maxLength ? text.substring(0, maxLength - 3) + '...' : text;
    };

    // Save diagnosis to database
    const diagnosis = new Diagnosis({
      userId,
      imageURL: fileInfo.type === 'image' ? filePath : null,
      videoURL: fileInfo.type === 'video' ? filePath : null,
      fileType: fileInfo.type,
      fileName: fileInfo.originalName,
      fileSize: fileInfo.size,
      diagnosisText: truncateText(aiResponse.diagnosisText, 15000),
      remedy: truncateText(aiResponse.diagnosisText, 15000), // The full diagnosis text includes treatment information
      audioURL: audioURL,
      confidence: aiResponse.confidence,
      diseaseName: truncateText(aiResponse.diseaseName, 500),
      severity: aiResponse.severity,
      affectedArea: aiResponse.affectedArea,
      treatmentType: aiResponse.treatmentType || 'organic',
      estimatedCost: aiResponse.estimatedCost,
      estimatedTime: aiResponse.estimatedTime
    });

    await diagnosis.save();

    res.status(201).json({
      success: true,
      message: 'Disease diagnosis completed successfully',
      data: {
        diagnosis: diagnosis,
        audioURL: audioURL
      }
    });

  } catch (error) {
    console.error('Disease diagnosis error:', error);
    
    // Clean up uploaded file on error
    if (filePath) {
      cleanupFile(filePath);
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to analyze disease'
    });
  }
});

/**
 * @route   GET /api/diagnosis/:id
 * @desc    Get a specific diagnosis
 * @access  Private
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const diagnosis = await Diagnosis.findOne({ _id: id, userId })
      .populate('userId', 'name phone location');

    if (!diagnosis) {
      return res.status(404).json({
        success: false,
        message: 'Diagnosis not found'
      });
    }

    res.json({
      success: true,
      data: {
        diagnosis: diagnosis
      }
    });

  } catch (error) {
    console.error('Get diagnosis error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get diagnosis'
    });
  }
});

/**
 * @route   GET /api/diagnosis
 * @desc    Get user's diagnoses with pagination
 * @access  Private
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    // Get diagnoses with pagination
    const diagnoses = await Diagnosis.getUserDiagnoses(userId, page, limit);

    // Get total count for pagination
    const totalCount = await Diagnosis.countDocuments({ userId });
    const totalPages = Math.ceil(totalCount / limit);

    res.json({
      success: true,
      data: {
        diagnoses: diagnoses,
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
    console.error('Get diagnoses error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get diagnoses'
    });
  }
});

/**
 * @route   DELETE /api/diagnosis/:id
 * @desc    Delete a diagnosis
 * @access  Private
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const diagnosis = await Diagnosis.findOne({ _id: id, userId });
    if (!diagnosis) {
      return res.status(404).json({
        success: false,
        message: 'Diagnosis not found'
      });
    }

    // Clean up associated files
    if (diagnosis.imageURL) {
      cleanupFile(diagnosis.imageURL);
    }
    if (diagnosis.videoURL) {
      cleanupFile(diagnosis.videoURL);
    }

    // Delete the diagnosis
    await Diagnosis.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Diagnosis deleted successfully'
    });

  } catch (error) {
    console.error('Delete diagnosis error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete diagnosis'
    });
  }
});

/**
 * @route   GET /api/diagnosis/stats/summary
 * @desc    Get user's diagnosis statistics
 * @access  Private
 */
router.get('/stats/summary', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;

    // Get statistics
    const stats = await Diagnosis.getUserStats(userId);

    const result = stats[0] || {
      totalDiagnoses: 0,
      highSeverity: 0,
      criticalSeverity: 0,
      avgConfidence: 0
    };

    res.json({
      success: true,
      data: {
        stats: result
      }
    });

  } catch (error) {
    console.error('Get diagnosis stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get diagnosis statistics'
    });
  }
});

/**
 * @route   POST /api/diagnosis/followup
 * @desc    Generate follow-up response for diagnosis questions
 * @access  Private
 */
router.post('/followup', authenticateToken, async (req, res) => {
  try {
    const { diagnosisId, question } = req.body;
    const userId = req.user._id;
    const userLanguage = req.user.language || 'en';

    if (!diagnosisId || !question) {
      return res.status(400).json({
        success: false,
        message: 'Diagnosis ID and question are required'
      });
    }

    // Get the original diagnosis
    const diagnosis = await Diagnosis.findOne({ _id: diagnosisId, userId });
    if (!diagnosis) {
      return res.status(404).json({
        success: false,
        message: 'Diagnosis not found'
      });
    }

    // Generate follow-up response using Gemini AI
    const { generateFollowUpResponse } = require('../utils/gemini');
    const aiResponse = await generateFollowUpResponse(
      diagnosisId,
      question,
      diagnosis.diagnosisText,
      userLanguage
    );

    if (!aiResponse.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to generate follow-up response'
      });
    }

    // Add follow-up question to the diagnosis
    if (!diagnosis.followUpQuestions) {
      diagnosis.followUpQuestions = [];
    }

    diagnosis.followUpQuestions.push({
      question: question,
      answer: aiResponse.answerText,
      timestamp: new Date()
    });

    await diagnosis.save();

    res.json({
      success: true,
      data: {
        answer: aiResponse.answerText,
        language: userLanguage
      }
    });

  } catch (error) {
    console.error('Follow-up diagnosis error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate follow-up response'
    });
  }
});

/**
 * @route   GET /api/diagnosis/diseases/list
 * @desc    Get list of diseases found in user's diagnoses
 * @access  Private
 */
router.get('/diseases/list', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;

    // Get unique diseases
    const diseases = await Diagnosis.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId), diseaseName: { $ne: null } } },
      {
        $group: {
          _id: '$diseaseName',
          count: { $sum: 1 },
          severity: { $first: '$severity' },
          lastOccurrence: { $max: '$createdAt' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        diseases: diseases
      }
    });

  } catch (error) {
    console.error('Get diseases list error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get diseases list'
    });
  }
});

module.exports = router;
