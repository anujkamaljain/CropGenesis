import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Camera, 
  AlertTriangle, 
  MoreVertical, 
  Trash2, 
  Eye,
  Volume2,
  FileImage,
  FileVideo,
  Loader2
} from 'lucide-react';
import AudioPlayer from './AudioPlayer';

const DiagnosisCard = ({ diagnosis, onDelete, onView, isDeleting = false }) => {
  const [showActions, setShowActions] = useState(false);
  const [showAudio, setShowAudio] = useState(false);

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getSeverityColor = (severity) => {
    const colors = {
      'low': 'bg-green-100 text-green-800',
      'medium': 'bg-yellow-100 text-yellow-800',
      'high': 'bg-orange-100 text-orange-800',
      'critical': 'bg-red-100 text-red-800'
    };
    return colors[severity] || 'bg-gray-100 text-gray-800';
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 80) return 'text-green-600';
    if (confidence >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-hover"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
            <Camera className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">
              {diagnosis.diseaseName || 'Disease Diagnosis'}
            </h3>
            <p className="text-sm text-gray-500">
              Created {formatDate(diagnosis.createdAt)}
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
                  onView(diagnosis);
                  setShowActions(false);
                }}
                className="flex items-center space-x-2 w-full px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors duration-200"
              >
                <Eye className="w-4 h-4" />
                <span>View Details</span>
              </button>
              <button
                onClick={() => {
                  onDelete(diagnosis._id);
                  setShowActions(false);
                }}
                disabled={isDeleting}
                className="flex items-center space-x-2 w-full px-4 py-2 text-red-600 hover:bg-red-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Delete</span>
                  </>
                )}
              </button>
            </motion.div>
          )}
        </div>
      </div>

      {/* Diagnosis Details */}
      <div className="space-y-3 mb-4">
        <div className="flex flex-wrap gap-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(diagnosis.severity)}`}>
            {diagnosis.severity} severity
          </span>
          {diagnosis.confidence && (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(diagnosis.confidence)}`}>
              {diagnosis.confidence}% confidence
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            {diagnosis.fileType === 'image' ? (
              <FileImage className="w-4 h-4 text-gray-500" />
            ) : (
              <FileVideo className="w-4 h-4 text-gray-500" />
            )}
            <span className="text-gray-600 capitalize">{diagnosis.fileType}</span>
          </div>
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-gray-500" />
            <span className="text-gray-600 capitalize">{diagnosis.affectedArea}</span>
          </div>
        </div>
      </div>

      {/* Diagnosis Preview */}
      <div className="mb-4">
        <p className="text-gray-700 text-sm line-clamp-3">
          {diagnosis.diagnosisText}
        </p>
      </div>

      {/* Remedy Preview */}
      {diagnosis.remedy && (
        <div className="mb-4 p-3 bg-green-50 rounded-lg">
          <h4 className="text-sm font-medium text-green-800 mb-1">Remedy</h4>
          <p className="text-sm text-green-700 line-clamp-2">
            {diagnosis.remedy}
          </p>
        </div>
      )}

      {/* Audio Player */}
      {diagnosis.audioURL && (
        <div className="mb-4">
          <button
            onClick={() => setShowAudio(!showAudio)}
            className="flex items-center space-x-2 text-primary-600 hover:text-primary-700 transition-colors duration-200"
          >
            <Volume2 className="w-4 h-4" />
            <span className="text-sm font-medium">
              {showAudio ? 'Hide Audio' : 'Listen to Diagnosis'}
            </span>
          </button>
          
          {showAudio && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3"
            >
              <AudioPlayer audioURL={diagnosis.audioURL} />
            </motion.div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex justify-between items-center pt-4 border-t border-gray-200">
        <div className="flex items-center space-x-4 text-sm text-gray-500">
          <span className="flex items-center space-x-1">
            <Camera className="w-4 h-4" />
            <span>{formatDate(diagnosis.createdAt)}</span>
          </span>
        </div>
        
        <button
          onClick={() => onView(diagnosis)}
          className="text-primary-600 hover:text-primary-700 text-sm font-medium transition-colors duration-200"
        >
          View Full Diagnosis →
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

export default DiagnosisCard;
