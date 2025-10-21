const mongoose = require('mongoose');

const diagnosisSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  imageURL: {
    type: String,
    required: [true, 'Image URL is required']
  },
  videoURL: {
    type: String,
    default: null
  },
  fileType: {
    type: String,
    required: [true, 'File type is required'],
    enum: ['image', 'video']
  },
  fileName: {
    type: String,
    required: [true, 'File name is required']
  },
  fileSize: {
    type: Number,
    required: [true, 'File size is required']
  },
  diagnosisText: {
    type: String,
    required: [true, 'Diagnosis text is required'],
    maxlength: [15000, 'Diagnosis text cannot exceed 15000 characters']
  },
  remedy: {
    type: String,
    required: [true, 'Remedy is required'],
    maxlength: [15000, 'Remedy text cannot exceed 15000 characters']
  },
  audioURL: {
    type: String,
    default: null
  },
  confidence: {
    type: Number,
    min: [0, 'Confidence cannot be less than 0'],
    max: [100, 'Confidence cannot exceed 100'],
    default: null
  },
  diseaseName: {
    type: String,
    trim: true,
    maxlength: [500, 'Disease name cannot exceed 500 characters']
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  affectedArea: {
    type: String,
    enum: ['leaves', 'stems', 'roots', 'fruits', 'flowers', 'whole-plant', 'unknown'],
    default: 'unknown'
  },
  treatmentType: {
    type: String,
    enum: ['organic', 'chemical', 'biological', 'cultural', 'mixed'],
    default: 'organic'
  },
  estimatedCost: {
    type: Number,
    min: [0, 'Cost cannot be negative'],
    default: null
  },
  estimatedTime: {
    type: String,
    default: null
  },
  tags: [{
    type: String,
    trim: true
  }],
  followUpQuestions: [{
    question: {
      type: String,
      required: true,
      maxlength: [1000, 'Question cannot exceed 1000 characters']
    },
    answer: {
      type: String,
      required: true,
      maxlength: [2000, 'Answer cannot exceed 2000 characters']
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// Indexes for better query performance
diagnosisSchema.index({ userId: 1, createdAt: -1 });
diagnosisSchema.index({ diseaseName: 1 });
diagnosisSchema.index({ severity: 1 });
diagnosisSchema.index({ affectedArea: 1 });
diagnosisSchema.index({ tags: 1 });

// Virtual for diagnosis summary
diagnosisSchema.virtual('summary').get(function() {
  return {
    id: this._id,
    diseaseName: this.diseaseName,
    severity: this.severity,
    affectedArea: this.affectedArea,
    confidence: this.confidence,
    hasAudio: !!this.audioURL,
    fileType: this.fileType,
    createdAt: this.createdAt
  };
});

// Static method to get user's diagnoses with pagination
diagnosisSchema.statics.getUserDiagnoses = function(userId, page = 1, limit = 10) {
  const skip = (page - 1) * limit;
  
  return this.find({ userId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('userId', 'name phone location')
    .lean();
};

// Static method to get diagnosis statistics
diagnosisSchema.statics.getUserStats = function(userId) {
  return this.aggregate([
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
  ]);
};

module.exports = mongoose.model('Diagnosis', diagnosisSchema);
