const mongoose = require('mongoose');

const cropPlanSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  planText: {
    type: String,
    required: [true, 'Plan text is required'],
    maxlength: [10000, 'Plan text cannot exceed 10000 characters']
  },
  planAudioURL: {
    type: String,
    default: null
  },
  inputs: {
    soilType: {
      type: String,
      required: [true, 'Soil type is required'],
      enum: ['clay', 'sandy', 'loamy', 'silty', 'peaty', 'chalky', 'unknown']
    },
    landSize: {
      type: Number,
      required: [true, 'Land size is required'],
      min: [0.1, 'Land size must be at least 0.1 acres'],
      max: [1000, 'Land size cannot exceed 1000 acres']
    },
    irrigation: {
      type: String,
      required: [true, 'Irrigation type is required'],
      enum: ['drip', 'sprinkler', 'flood', 'manual', 'rainfed', 'mixed']
    },
    season: {
      type: String,
      required: [true, 'Season is required'],
      enum: ['kharif', 'rabi', 'zaid', 'year-round']
    },
    preferredLanguage: {
      type: String,
      required: [true, 'Preferred language is required'],
      enum: ['en', 'hi', 'te', 'ta', 'bn', 'mr', 'gu', 'kn', 'ml', 'or', 'pa', 'as']
    },
    additionalNotes: {
      type: String,
      maxlength: [1000, 'Additional notes cannot exceed 1000 characters'],
      default: ''
    }
  },
  followUpQuestions: [{
    question: {
      type: String,
      required: true
    },
    answer: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  tags: [{
    type: String,
    trim: true
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
cropPlanSchema.index({ userId: 1, createdAt: -1 });
cropPlanSchema.index({ 'inputs.season': 1 });
cropPlanSchema.index({ 'inputs.soilType': 1 });
cropPlanSchema.index({ tags: 1 });

// Virtual for plan summary
cropPlanSchema.virtual('summary').get(function() {
  return {
    id: this._id,
    soilType: this.inputs.soilType,
    landSize: this.inputs.landSize,
    irrigation: this.inputs.irrigation,
    season: this.inputs.season,
    hasAudio: !!this.planAudioURL,
    followUpCount: this.followUpQuestions.length,
    createdAt: this.createdAt
  };
});

// Method to add follow-up question
cropPlanSchema.methods.addFollowUp = function(question, answer) {
  this.followUpQuestions.push({
    question,
    answer,
    timestamp: new Date()
  });
  return this.save();
};

// Static method to get user's crop plans with pagination
cropPlanSchema.statics.getUserPlans = function(userId, page = 1, limit = 10) {
  const skip = (page - 1) * limit;
  
  return this.find({ userId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('userId', 'name phone location')
    .lean();
};

module.exports = mongoose.model('CropPlan', cropPlanSchema);
