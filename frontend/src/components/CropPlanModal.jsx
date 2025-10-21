import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  MessageCircle, 
  Volume2, 
  Loader2,
  CheckCircle,
  Calendar,
  MapPin,
  Droplets,
  Sprout
} from 'lucide-react';
import { cropPlanAPI } from '../utils/api';
import { handleApiSuccess, handleApiError } from '../utils/api';
import AudioPlayer from './AudioPlayer';

const CropPlanModal = ({ isOpen, onClose, plan }) => {
  const [followUpQuestion, setFollowUpQuestion] = useState('');
  const [isGeneratingFollowUp, setIsGeneratingFollowUp] = useState(false);
  const [followUpThread, setFollowUpThread] = useState([]);

  // Initialize follow-up thread from existing questions
  React.useEffect(() => {
    if (plan && plan.followUpQuestions && plan.followUpQuestions.length > 0) {
      const existingThread = plan.followUpQuestions.map(qa => ({
        question: qa.question,
        answer: qa.answer,
        timestamp: qa.timestamp
      }));
      setFollowUpThread(existingThread);
    } else {
      setFollowUpThread([]);
    }
  }, [plan]);

  const handleFollowUp = async () => {
    if (!followUpQuestion.trim() || !plan) return;

    try {
      setIsGeneratingFollowUp(true);

      const response = await cropPlanAPI.followUp({
        planId: plan._id,
        question: followUpQuestion
      });

      if (response.data.success) {
        const newQnA = {
          question: followUpQuestion,
          answer: response.data.data.answer,
          timestamp: new Date().toISOString()
        };
        
        setFollowUpThread(prev => [...prev, newQnA]);
        setFollowUpQuestion('');
        handleApiSuccess('Follow-up response generated!');
      }
    } catch (error) {
      handleApiError(error);
    } finally {
      setIsGeneratingFollowUp(false);
    }
  };

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

  if (!plan) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                  <Sprout className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Crop Plan - {plan.inputs.season} Season
                  </h2>
                  <p className="text-sm text-gray-500">
                    Created {formatDate(plan.createdAt)}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
              <div className="p-6 space-y-6">
                {/* Plan Details */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getSeasonColor(plan.inputs.season)}`}>
                      {plan.inputs.season}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getSoilTypeColor(plan.inputs.soilType)}`}>
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

                {/* Full Plan */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center mb-4">
                    <CheckCircle className="w-6 h-6 text-green-600 mr-2" />
                    <h3 className="text-lg font-semibold text-gray-900">Your Crop Plan</h3>
                  </div>
                  
                  <div className="prose max-w-none">
                    <div className="whitespace-pre-wrap text-gray-700">
                      {plan.planText}
                    </div>
                  </div>

                  {/* Audio Player */}
                  {plan.planAudioURL && (
                    <div className="mt-6">
                      <AudioPlayer audioURL={plan.planAudioURL} />
                    </div>
                  )}
                </div>

                {/* Follow-up Questions Section */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <MessageCircle className="w-5 h-5 text-blue-600 mr-2" />
                    Ask Follow-up Questions
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <textarea
                        value={followUpQuestion}
                        onChange={(e) => setFollowUpQuestion(e.target.value)}
                        placeholder="Ask any questions about your crop plan..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={3}
                      />
                    </div>
                    
                    <button
                      onClick={handleFollowUp}
                      disabled={!followUpQuestion.trim() || isGeneratingFollowUp}
                      className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isGeneratingFollowUp ? (
                        <div className="flex items-center">
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Generating Response...
                        </div>
                      ) : (
                        'Ask Question'
                      )}
                    </button>
                  </div>

                  {/* Follow-up Thread */}
                  {followUpThread.length > 0 && (
                    <div className="mt-6 space-y-4">
                      <h4 className="font-medium text-gray-900 flex items-center">
                        <MessageCircle className="w-5 h-5 text-blue-600 mr-2" />
                        Conversation Thread ({followUpThread.length} {followUpThread.length === 1 ? 'question' : 'questions'})
                      </h4>
                      
                      {followUpThread.map((item, index) => (
                        <div key={index} className="space-y-3">
                          {/* Question */}
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex items-start">
                              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                                Q
                              </div>
                              <div className="ml-3 flex-1">
                                <p className="text-sm font-medium text-blue-900 mb-1">Your Question</p>
                                <p className="text-gray-700">{item.question}</p>
                                <p className="text-xs text-gray-500 mt-2">
                                  {new Date(item.timestamp).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          {/* Answer */}
                          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <div className="flex items-start">
                              <div className="flex-shrink-0 w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                                A
                              </div>
                              <div className="ml-3 flex-1">
                                <p className="text-sm font-medium text-green-900 mb-1">AI Response</p>
                                <div className="text-gray-700 whitespace-pre-wrap">{item.answer}</div>
                                <p className="text-xs text-gray-500 mt-2">
                                  {new Date(item.timestamp).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CropPlanModal;
