import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Camera, 
  AlertTriangle, 
  CheckCircle, 
  DollarSign, 
  Clock, 
  MessageCircle, 
  Volume2, 
  Loader2,
  FileImage,
  FileVideo
} from 'lucide-react';
import { diagnosisAPI } from '../utils/api';
import { handleApiSuccess, handleApiError } from '../utils/api';
import AudioPlayer from '../components/AudioPlayer';
import LoadingSpinner from '../components/LoadingSpinner';

const DiagnosisDisplay = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [diagnosis, setDiagnosis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [followUpQuestion, setFollowUpQuestion] = useState('');
  const [isGeneratingFollowUp, setIsGeneratingFollowUp] = useState(false);
  const [followUpThread, setFollowUpThread] = useState([]);

  useEffect(() => {
    if (id) {
      fetchDiagnosis();
    }
  }, [id]);

  const fetchDiagnosis = async () => {
    try {
      setLoading(true);
      console.log('Fetching diagnosis with ID:', id);
      const response = await diagnosisAPI.getById(id);
      
      console.log('Diagnosis response:', response.data);
      
      if (response.data.success) {
        setDiagnosis(response.data.data.diagnosis);
        
        // Load existing follow-up questions if any
        if (response.data.data.diagnosis.followUpQuestions && response.data.data.diagnosis.followUpQuestions.length > 0) {
          const existingThread = response.data.data.diagnosis.followUpQuestions.map(qa => ({
            question: qa.question,
            answer: qa.answer,
            timestamp: qa.timestamp
          }));
          setFollowUpThread(existingThread);
        }
      }
    } catch (error) {
      console.error('Error fetching diagnosis:', error);
      handleApiError(error);
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleFollowUp = async () => {
    if (!followUpQuestion.trim() || !diagnosis) return;

    try {
      setIsGeneratingFollowUp(true);
      console.log('Sending follow-up request:', {
        diagnosisId: diagnosis.id,
        question: followUpQuestion
      });
      console.log('Type of diagnosis.id:', typeof diagnosis.id);
      console.log('Full diagnosis object:', diagnosis);

      const response = await diagnosisAPI.followUp({
        diagnosisId: diagnosis.id,
        question: followUpQuestion
      });

      console.log('Follow-up response:', response.data);

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
      console.error('Follow-up error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      handleApiError(error);
    } finally {
      setIsGeneratingFollowUp(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!diagnosis) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Diagnosis Not Found</h2>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Dashboard</span>
              </button>
              <div className="h-6 w-px bg-gray-300" />
              <h1 className="text-2xl font-bold text-gray-900">
                Disease Diagnosis
              </h1>
            </div>
            <div className="text-sm text-gray-500">
              {formatDate(diagnosis.createdAt)}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Diagnosis Summary */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <Camera className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {diagnosis.diseaseName || 'Disease Diagnosis'}
                  </h2>
                  <p className="text-gray-600">
                    {diagnosis.fileType === 'image' ? 'Image Analysis' : 'Video Analysis'}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getSeverityColor(diagnosis.severity)}`}>
                  {diagnosis.severity} severity
                </span>
                {diagnosis.confidence && (
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getConfidenceColor(diagnosis.confidence)}`}>
                    {diagnosis.confidence}% confidence
                  </span>
                )}
              </div>
            </div>

            {/* Diagnosis Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="flex items-center space-x-3">
                {diagnosis.fileType === 'image' ? (
                  <FileImage className="w-5 h-5 text-gray-500" />
                ) : (
                  <FileVideo className="w-5 h-5 text-gray-500" />
                )}
                <div>
                  <p className="text-sm text-gray-600">File Type</p>
                  <p className="font-medium text-gray-900 capitalize">{diagnosis.fileType}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <AlertTriangle className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-600">Affected Area</p>
                  <p className="font-medium text-gray-900 capitalize">{diagnosis.affectedArea}</p>
                </div>
              </div>

              {diagnosis.estimatedCost && (
                <div className="flex items-center space-x-3">
                  <DollarSign className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-600">Estimated Cost</p>
                    <p className="font-medium text-green-600">
                      ₹{diagnosis.estimatedCost.toLocaleString()}/acre
                    </p>
                  </div>
                </div>
              )}

              {diagnosis.estimatedTime && (
                <div className="flex items-center space-x-3">
                  <Clock className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-600">Treatment Time</p>
                    <p className="font-medium text-gray-900">{diagnosis.estimatedTime}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Diagnosis Text */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <CheckCircle className="w-6 h-6 text-green-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Disease Diagnosis</h3>
            </div>
            
            <div className="prose max-w-none">
              <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
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

          {/* Remedy Section */}
          {diagnosis.remedy && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center mb-4">
                <CheckCircle className="w-6 h-6 text-blue-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Treatment & Remedy</h3>
              </div>
              
              <div className="prose max-w-none">
                <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                  {diagnosis.remedy}
                </div>
              </div>
            </div>
          )}

          {/* Follow-up Questions Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <MessageCircle className="w-5 h-5 text-blue-600 mr-2" />
              Ask Follow-up Questions
            </h3>
            
            <div className="space-y-4">
              <div>
                <textarea
                  value={followUpQuestion}
                  onChange={(e) => setFollowUpQuestion(e.target.value)}
                  placeholder="Ask any questions about your diagnosis or treatment..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                />
              </div>
              
              <button
                onClick={handleFollowUp}
                disabled={!followUpQuestion.trim() || isGeneratingFollowUp}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isGeneratingFollowUp ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Generating Response...</span>
                  </>
                ) : (
                  <span>Ask Question</span>
                )}
              </button>
            </div>

            {/* Follow-up Thread */}
            {followUpThread.length > 0 && (
              <div className="mt-8 space-y-6">
                <h4 className="text-md font-semibold text-gray-900">Previous Questions & Answers</h4>
                {followUpThread.map((qa, index) => (
                  <div key={index} className="border-l-4 border-blue-200 pl-4 space-y-3">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-900">Your Question:</span>
                        <span className="text-xs text-gray-500">
                          {formatDate(qa.timestamp)}
                        </span>
                      </div>
                      <p className="text-gray-700">{qa.question}</p>
                    </div>
                    
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-blue-900">AI Response:</span>
                      </div>
                      <p className="text-blue-800 whitespace-pre-wrap">{qa.answer}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default DiagnosisDisplay;
