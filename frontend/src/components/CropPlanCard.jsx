import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Sprout, 
  Calendar, 
  Droplets, 
  MapPin, 
  MoreVertical, 
  Trash2, 
  Eye,
  MessageCircle,
  Volume2
} from 'lucide-react';
import AudioPlayer from './AudioPlayer';

const CropPlanCard = ({ plan, onDelete, onView }) => {
  const [showActions, setShowActions] = useState(false);
  const [showAudio, setShowAudio] = useState(false);

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getSeasonColor = (season) => {
    const colors = {
      'kharif': 'bg-green-100 text-green-800',
      'rabi': 'bg-blue-100 text-blue-800',
      'zaid': 'bg-yellow-100 text-yellow-800',
      'year-round': 'bg-purple-100 text-purple-800'
    };
    return colors[season] || 'bg-gray-100 text-gray-800';
  };

  const getSoilTypeColor = (soilType) => {
    const colors = {
      'clay': 'bg-red-100 text-red-800',
      'sandy': 'bg-yellow-100 text-yellow-800',
      'loamy': 'bg-green-100 text-green-800',
      'silty': 'bg-blue-100 text-blue-800',
      'peaty': 'bg-brown-100 text-brown-800',
      'chalky': 'bg-gray-100 text-gray-800',
      'unknown': 'bg-gray-100 text-gray-800'
    };
    return colors[soilType] || 'bg-gray-100 text-gray-800';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-hover"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
            <Sprout className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">
              Crop Plan - {plan.inputs.season} Season
            </h3>
            <p className="text-sm text-gray-500">
              Created {formatDate(plan.createdAt)}
            </p>
          </div>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowActions(!showActions)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          >
            <MoreVertical className="w-4 h-4 text-gray-500" />
          </button>

          {showActions && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10"
            >
              <button
                onClick={() => {
                  onView(plan);
                  setShowActions(false);
                }}
                className="flex items-center space-x-2 w-full px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors duration-200"
              >
                <Eye className="w-4 h-4" />
                <span>View Details</span>
              </button>
              <button
                onClick={() => {
                  onDelete(plan._id);
                  setShowActions(false);
                }}
                className="flex items-center space-x-2 w-full px-4 py-2 text-red-600 hover:bg-red-50 transition-colors duration-200"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </button>
            </motion.div>
          )}
        </div>
      </div>

      {/* Plan Details */}
      <div className="space-y-3 mb-4">
        <div className="flex flex-wrap gap-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeasonColor(plan.inputs.season)}`}>
            {plan.inputs.season}
          </span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSoilTypeColor(plan.inputs.soilType)}`}>
            {plan.inputs.soilType}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <MapPin className="w-4 h-4 text-gray-500" />
            <span className="text-gray-600">{plan.inputs.landSize} acres</span>
          </div>
          <div className="flex items-center space-x-2">
            <Droplets className="w-4 h-4 text-gray-500" />
            <span className="text-gray-600 capitalize">{plan.inputs.irrigation}</span>
          </div>
        </div>
      </div>

      {/* Plan Preview */}
      <div className="mb-4">
        <p className="text-gray-700 text-sm line-clamp-3">
          {plan.planText}
        </p>
      </div>

      {/* Follow-up Questions */}
      {plan.followUpQuestions && plan.followUpQuestions.length > 0 && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <MessageCircle className="w-4 h-4 text-primary-600" />
            <span className="text-sm font-medium text-gray-700">
              {plan.followUpQuestions.length} Follow-up Question{plan.followUpQuestions.length > 1 ? 's' : ''}
            </span>
          </div>
        </div>
      )}

      {/* Audio Player */}
      {plan.planAudioURL && (
        <div className="mb-4">
          <button
            onClick={() => setShowAudio(!showAudio)}
            className="flex items-center space-x-2 text-primary-600 hover:text-primary-700 transition-colors duration-200"
          >
            <Volume2 className="w-4 h-4" />
            <span className="text-sm font-medium">
              {showAudio ? 'Hide Audio' : 'Listen to Plan'}
            </span>
          </button>
          
          {showAudio && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3"
            >
              <AudioPlayer audioURL={plan.planAudioURL} />
            </motion.div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex justify-between items-center pt-4 border-t border-gray-200">
        <div className="flex items-center space-x-4 text-sm text-gray-500">
          <span className="flex items-center space-x-1">
            <Calendar className="w-4 h-4" />
            <span>{formatDate(plan.createdAt)}</span>
          </span>
        </div>
        
        <button
          onClick={() => onView(plan)}
          className="text-primary-600 hover:text-primary-700 text-sm font-medium transition-colors duration-200"
        >
          View Full Plan →
        </button>
      </div>

      {/* Overlay for actions dropdown */}
      {showActions && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowActions(false)}
        />
      )}
    </motion.div>
  );
};

export default CropPlanCard;
