const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const CropPlan = require('../models/CropPlan');
const Diagnosis = require('../models/Diagnosis');
const { authenticateToken } = require('../middleware/auth');
const { validatePagination } = require('../middleware/validation');

/**
 * @route   GET /api/history/get
 * @desc    Get user's complete history (crop plans and diagnoses)
 * @access  Private
 */
router.get('/get', authenticateToken, validatePagination, async (req, res) => {
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const type = req.query.type; // 'crop-plans', 'diagnoses', or undefined for all
    const skip = (page - 1) * limit;

    let history = [];
    let totalCount = 0;

    if (type === 'crop-plans') {
      // Get only crop plans
      const cropPlans = await CropPlan.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'name phone location')
        .lean();

      totalCount = await CropPlan.countDocuments({ userId });

      history = cropPlans.map(plan => ({
        id: plan._id,
        type: 'crop-plan',
        title: `Crop Plan - ${plan.inputs.season} Season`,
        description: plan.planText.substring(0, 200) + '...',
        date: plan.createdAt,
        data: plan
      }));

    } else if (type === 'diagnoses') {
      // Get only diagnoses
      const diagnoses = await Diagnosis.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'name phone location')
        .lean();

      totalCount = await Diagnosis.countDocuments({ userId });

      history = diagnoses.map(diagnosis => ({
        id: diagnosis._id,
        type: 'diagnosis',
        title: diagnosis.diseaseName || 'Disease Diagnosis',
        description: diagnosis.diagnosisText.substring(0, 200) + '...',
        date: diagnosis.createdAt,
        data: diagnosis
      }));

    } else {
      // Get both crop plans and diagnoses
      const [cropPlans, diagnoses] = await Promise.all([
        CropPlan.find({ userId })
          .sort({ createdAt: -1 })
          .populate('userId', 'name phone location')
          .lean(),
        Diagnosis.find({ userId })
          .sort({ createdAt: -1 })
          .populate('userId', 'name phone location')
          .lean()
      ]);

      // Combine and sort by date
      const combinedHistory = [
        ...cropPlans.map(plan => ({
          id: plan._id,
          type: 'crop-plan',
          title: `Crop Plan - ${plan.inputs.season} Season`,
          description: plan.planText.substring(0, 200) + '...',
          date: plan.createdAt,
          data: plan
        })),
        ...diagnoses.map(diagnosis => ({
          id: diagnosis._id,
          type: 'diagnosis',
          title: diagnosis.diseaseName || 'Disease Diagnosis',
          description: diagnosis.diagnosisText.substring(0, 200) + '...',
          date: diagnosis.createdAt,
          data: diagnosis
        }))
      ];

      // Sort by date (newest first)
      combinedHistory.sort((a, b) => new Date(b.date) - new Date(a.date));

      totalCount = combinedHistory.length;
      history = combinedHistory.slice(skip, skip + limit);
    }

    const totalPages = Math.ceil(totalCount / limit);

    res.json({
      success: true,
      data: {
        history: history,
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
    console.error('Get history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get history'
    });
  }
});

/**
 * @route   DELETE /api/history/delete/:type/:id
 * @desc    Delete a specific history item
 * @access  Private
 */
router.delete('/delete/:type/:id', authenticateToken, async (req, res) => {
  try {
    const { type, id } = req.params;
    const userId = req.user._id;

    let result;

    if (type === 'crop-plan') {
      result = await CropPlan.findOneAndDelete({ _id: id, userId });
    } else if (type === 'diagnosis') {
      const diagnosis = await Diagnosis.findOne({ _id: id, userId });
      if (diagnosis) {
        // Clean up associated files
        if (diagnosis.imageURL) {
          const { cleanupFile } = require('../utils/upload');
          cleanupFile(diagnosis.imageURL);
        }
        if (diagnosis.videoURL) {
          const { cleanupFile } = require('../utils/upload');
          cleanupFile(diagnosis.videoURL);
        }
        
        result = await Diagnosis.findByIdAndDelete(id);
      }
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid type. Must be "crop-plan" or "diagnosis"'
      });
    }

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'History item not found'
      });
    }

    res.json({
      success: true,
      message: `${type === 'crop-plan' ? 'Crop plan' : 'Diagnosis'} deleted successfully`
    });

  } catch (error) {
    console.error('Delete history item error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete history item'
    });
  }
});

/**
 * @route   DELETE /api/history/clear
 * @desc    Clear all user history
 * @access  Private
 */
router.delete('/clear', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const { type } = req.body; // 'crop-plans', 'diagnoses', or undefined for all

    if (type === 'crop-plans') {
      await CropPlan.deleteMany({ userId });
    } else if (type === 'diagnoses') {
      // Get all diagnoses to clean up files
      const diagnoses = await Diagnosis.find({ userId });
      const { cleanupFile } = require('../utils/upload');
      
      for (const diagnosis of diagnoses) {
        if (diagnosis.imageURL) cleanupFile(diagnosis.imageURL);
        if (diagnosis.videoURL) cleanupFile(diagnosis.videoURL);
      }
      
      await Diagnosis.deleteMany({ userId });
    } else {
      // Clear both
      const diagnoses = await Diagnosis.find({ userId });
      const { cleanupFile } = require('../utils/upload');
      
      for (const diagnosis of diagnoses) {
        if (diagnosis.imageURL) cleanupFile(diagnosis.imageURL);
        if (diagnosis.videoURL) cleanupFile(diagnosis.videoURL);
      }
      
      await Promise.all([
        CropPlan.deleteMany({ userId }),
        Diagnosis.deleteMany({ userId })
      ]);
    }

    res.json({
      success: true,
      message: 'History cleared successfully'
    });

  } catch (error) {
    console.error('Clear history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear history'
    });
  }
});

/**
 * @route   GET /api/history/stats
 * @desc    Get user's history statistics
 * @access  Private
 */
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;

    // Get statistics for both crop plans and diagnoses
    const [cropPlanStats, diagnosisStats] = await Promise.all([
      CropPlan.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(userId) } },
        {
          $group: {
            _id: null,
            totalPlans: { $sum: 1 },
            totalFollowUps: { $sum: { $size: '$followUpQuestions' } },
            seasons: { $addToSet: '$inputs.season' },
            soilTypes: { $addToSet: '$inputs.soilType' }
          }
        }
      ]),
      Diagnosis.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(userId) } },
        {
          $group: {
            _id: null,
            totalDiagnoses: { $sum: 1 },
            highSeverity: {
              $sum: { $cond: [{ $eq: ['$severity', 'high'] }, 1, 0] }
            },
            criticalSeverity: {
              $sum: { $cond: [{ $eq: ['$severity', 'critical'] }, 1, 0] }
            },
            avgConfidence: { $avg: '$confidence' }
          }
        }
      ])
    ]);

    const cropPlanResult = cropPlanStats[0] || {
      totalPlans: 0,
      totalFollowUps: 0,
      seasons: [],
      soilTypes: []
    };

    const diagnosisResult = diagnosisStats[0] || {
      totalDiagnoses: 0,
      highSeverity: 0,
      criticalSeverity: 0,
      avgConfidence: 0
    };

    res.json({
      success: true,
      data: {
        cropPlans: cropPlanResult,
        diagnoses: diagnosisResult,
        total: {
          items: cropPlanResult.totalPlans + diagnosisResult.totalDiagnoses,
          lastActivity: new Date() // This would be calculated from actual data
        }
      }
    });

  } catch (error) {
    console.error('Get history stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get history statistics'
    });
  }
});

module.exports = router;
