import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  MessageCircle, 
  Volume2, 
  Loader2,
  CheckCircle,
  Calendar,
  AlertTriangle,
  Camera,
  DollarSign,
  Clock
} from 'lucide-react';
import { diagnosisAPI } from '../utils/api';
import { handleApiSuccess, handleApiError } from '../utils/api';
import AudioPlayer from './AudioPlayer';

const DiagnosisModal = ({ isOpen, onClose, diagnosis }) => {
  const [followUpQuestion, setFollowUpQuestion] = useState('');
  const [isGeneratingFollowUp, setIsGeneratingFollowUp] = useState(false);
  const [followUpThread, setFollowUpThread] = useState([]);

  // Initialize follow-up thread from existing questions
  React.useEffect(() => {
    if (diagnosis && diagnosis.followUpQuestions && diagnosis.followUpQuestions.length > 0) {
      const existingThread = diagnosis.followUpQuestions.map(qa => ({
        question: qa.question,
        answer: qa.answer,
        timestamp: qa.timestamp
      }));
      setFollowUpThread(existingThread);
    } else {
      setFollowUpThread([]);
    }
  }, [diagnosis]);

  const handleFollowUp = async () => {
    if (!followUpQuestion.trim() || !diagnosis) return;

    try {
      setIsGeneratingFollowUp(true);

      const response = await diagnosisAPI.followUp({
        diagnosisId: diagnosis._id,
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

  if (!diagnosis) return null;

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
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <Camera className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Disease Diagnosis
                  </h2>
                  <p className="text-sm text-gray-500">
                    Created {formatDate(diagnosis.createdAt)}
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
                {/* Diagnosis Summary */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600">Disease</p>
                      <p className="font-medium text-gray-900">
                        {diagnosis.diseaseName || 'Unknown'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Severity</p>
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(diagnosis.severity)}`}>
                        {diagnosis.severity}
                      </span>
                    </div>
                    {diagnosis.confidence && (
                      <div>
                        <p className="text-sm text-gray-600">Confidence</p>
                        <p className={`font-medium ${getConfidenceColor(diagnosis.confidence)}`}>
                          {diagnosis.confidence}%
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-gray-600">Affected Area</p>
                      <p className="font-medium text-gray-900 capitalize">
                        {diagnosis.affectedArea}
                      </p>
                    </div>
                    {diagnosis.estimatedCost && (
                      <div>
                        <p className="text-sm text-gray-600">Estimated Cost</p>
                        <p className="font-medium text-green-600 flex items-center">
                          <DollarSign className="w-4 h-4 mr-1" />
                          ₹{diagnosis.estimatedCost.toLocaleString()}/acre
                        </p>
                      </div>
                    )}
                    {diagnosis.estimatedTime && (
                      <div>
                        <p className="text-sm text-gray-600">Treatment Time</p>
                        <p className="font-medium text-gray-900 flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {diagnosis.estimatedTime}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Full Diagnosis */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center mb-4">
                    <CheckCircle className="w-6 h-6 text-green-600 mr-2" />
                    <h3 className="text-lg font-semibold text-gray-900">Disease Diagnosis</h3>
                  </div>
                  
                  <div className="prose max-w-none">
                    <div className="whitespace-pre-wrap text-gray-700">
                      {diagnosis.diagnosisText}
                    </div>
                  </div>

                  {/* Audio Player */}
                  {diagnosis.audioURL && (
                    <div className="mt-6">
                      <AudioPlayer audioURL={diagnosis.audioURL} />
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
                        placeholder="Ask any questions about this diagnosis or treatment..."
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

export default DiagnosisModal;
