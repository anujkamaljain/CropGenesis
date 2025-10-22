import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Upload, 
  Image as ImageIcon,
  HelpCircle,
  MessageCircle,
  Building2,
  FileImage,
  Camera,
  Loader2,
  CheckCircle,
  AlertTriangle,
  X
} from 'lucide-react';
import { diagnosisAPI } from '../utils/api';
import { handleApiSuccess, handleApiError } from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';
import AudioPlayer from '../components/AudioPlayer';

const Dashboard = () => {
  const navigate = useNavigate();
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [followUpQuestion, setFollowUpQuestion] = useState('');
  const [isGeneratingFollowUp, setIsGeneratingFollowUp] = useState(false);
  const [followUpThread, setFollowUpThread] = useState([]);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setAnalysisResult(null);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;

    try {
      setIsAnalyzing(true);
      setAnalysisResult(null);

      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await diagnosisAPI.upload(formData);
      
      if (response.data.success) {
        // Redirect to diagnosis display page
        const diagnosisId = response.data.data.diagnosis.id;
        navigate(`/diagnosis/${diagnosisId}`);
        handleApiSuccess('Disease analysis completed successfully!');
      }
    } catch (error) {
      handleApiError(error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setAnalysisResult(null);
    setFollowUpQuestion('');
    setFollowUpThread([]);
  };

  const handleFollowUp = async () => {
    if (!followUpQuestion.trim() || !analysisResult) return;

    try {
      setIsGeneratingFollowUp(true);

      const response = await diagnosisAPI.followUp({
        diagnosisId: analysisResult.diagnosis._id,
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

  const getSeverityColor = (severity) => {
    const colors = {
      'low': 'text-green-600 bg-green-100',
      'medium': 'text-yellow-600 bg-yellow-100',
      'high': 'text-orange-600 bg-orange-100',
      'critical': 'text-red-600 bg-red-100'
    };
    return colors[severity] || 'text-gray-600 bg-gray-100';
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 80) return 'text-green-600';
    if (confidence >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Main Content */}
      <div className="w-full">
        {/* Dashboard Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white min-h-screen p-8 flex flex-col items-center justify-center"
        >
          {/* Dashboard Tag */}
          <div className="mb-6 text-center">
            <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
              Dashboard
            </span>
          </div>

          {/* Title and Subtitle */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Crop Analysis Center
            </h1>
            <p className="text-gray-600 text-lg">
              Manage your crops, analyze using images and videos in one place
            </p>
          </div>

          {/* Plant Village Model Button */}
          <div className="mb-8 text-center">
            <button className="flex items-center space-x-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors duration-200 mx-auto">
              <Building2 className="w-4 h-4" />
              <span className="font-medium">Plant Village Model</span>
            </button>
          </div>

          {/* Image Manager Section */}
          <div className="mb-6 text-center w-full max-w-2xl">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <h2 className="text-xl font-bold text-gray-800">Image Manager</h2>
              <HelpCircle className="w-5 h-5 text-gray-400 cursor-pointer hover:text-gray-600" />
            </div>

            {/* Upload Area */}
            <div
              className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors duration-200 ${
                dragActive 
                  ? 'border-blue-400 bg-blue-50' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              {/* Upload Icon */}
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <FileImage className="w-8 h-8 text-blue-600" />
                </div>
              </div>

              {/* Upload Text */}
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Upload Image or Video
              </h3>
              <p className="text-gray-600 mb-6">
                Drag and drop your image or video file here, or click to browse your files
              </p>

              {/* File Input */}
              <div className="mb-4">
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  accept="image/*,video/*"
                  onChange={handleFileSelect}
                />
                <label
                  htmlFor="file-upload"
                  className="inline-flex items-center space-x-2 bg-white border border-blue-300 text-blue-600 px-6 py-2 rounded-lg hover:bg-blue-50 transition-colors duration-200 cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <span className="font-medium">Choose File</span>
                </label>
              </div>

              {/* File Size Info */}
              <p className="text-sm text-gray-500">
                Maximum file size: 5MB
              </p>

              {/* Selected File Display */}
              {selectedFile && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <ImageIcon className="w-5 h-5 text-green-600" />
                      <span className="text-green-800 font-medium">{selectedFile.name}</span>
                      <span className="text-green-600 text-sm">
                        ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </div>
                    <button
                      onClick={handleRemoveFile}
                      className="text-red-600 hover:text-red-800 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Analyze Button - Always visible */}
              <div className="mt-6">
                <button
                  onClick={handleAnalyze}
                  disabled={!selectedFile || isAnalyzing}
                  className={`w-full font-medium py-4 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center shadow-lg text-lg ${
                    selectedFile && !isAnalyzing
                      ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
                      : 'bg-gray-400 text-gray-200 cursor-not-allowed'
                  }`}
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                      Analyzing Disease...
                    </>
                  ) : (
                    <>
                      <Camera className="w-6 h-6 mr-3" />
                      {selectedFile ? 'Analyze Disease' : 'Upload Media First'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Analysis Results Section */}
        {isAnalyzing && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-8 mt-8 max-w-4xl mx-auto"
          >
            <div className="text-center">
              <LoadingSpinner size="lg" className="mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Analyzing Your Image</h3>
              <p className="text-gray-600">Our AI is examining your crop for signs of disease...</p>
            </div>
          </motion.div>
        )}

        {analysisResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-8 mt-8 max-w-4xl mx-auto"
          >
            {/* Analysis Summary */}
            <div className="mb-8">
              <div className="flex items-center mb-4">
                <CheckCircle className="w-6 h-6 text-green-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Analysis Complete</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-sm text-gray-600">Disease</p>
                  <p className="font-medium text-gray-900">
                    {analysisResult.diagnosis.diseaseName || 'Unknown'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Severity</p>
                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(analysisResult.diagnosis.severity)}`}>
                    {analysisResult.diagnosis.severity}
                  </span>
                </div>
                {analysisResult.diagnosis.confidence && (
                  <div>
                    <p className="text-sm text-gray-600">Confidence</p>
                    <p className={`font-medium ${getConfidenceColor(analysisResult.diagnosis.confidence)}`}>
                      {analysisResult.diagnosis.confidence}%
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-600">Affected Area</p>
                  <p className="font-medium text-gray-900 capitalize">
                    {analysisResult.diagnosis.affectedArea}
                  </p>
                </div>
                {analysisResult.diagnosis.estimatedCost && (
                  <div>
                    <p className="text-sm text-gray-600">Estimated Cost</p>
                    <p className="font-medium text-green-600">
                      ₹{analysisResult.diagnosis.estimatedCost.toLocaleString()}/acre
                    </p>
                  </div>
                )}
                {analysisResult.diagnosis.estimatedTime && (
                  <div>
                    <p className="text-sm text-gray-600">Treatment Time</p>
                    <p className="font-medium text-gray-900">
                      {analysisResult.diagnosis.estimatedTime}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Diagnosis Details */}
            <div className="mb-8">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Diagnosis</h4>
              <div className="prose max-w-none">
                <div className="whitespace-pre-wrap text-gray-700">
                  {analysisResult.diagnosis.diagnosisText}
                </div>
              </div>

              {/* Audio Player */}
              {analysisResult.audioURL && (
                <div className="mt-6">
                  <AudioPlayer audioURL={analysisResult.audioURL} />
                </div>
              )}
            </div>

            {/* Remedy */}
            {analysisResult.diagnosis.remedy && (
              <div className="mb-8">
                <div className="flex items-center mb-4">
                  <AlertTriangle className="w-5 h-5 text-orange-600 mr-2" />
                  <h4 className="text-lg font-semibold text-gray-900">Treatment & Prevention</h4>
                </div>
                <div className="prose max-w-none">
                  <div className="whitespace-pre-wrap text-gray-700">
                    {analysisResult.diagnosis.remedy}
                  </div>
                </div>
              </div>
            )}

            {/* Follow-up Questions */}
            <div className="mb-8">
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
          </motion.div>
        )}
      </div>

      {/* Chat Button */}
      <motion.button
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5 }}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center"
      >
        <MessageCircle className="w-6 h-6" />
      </motion.button>
    </div>
  );
};

export default Dashboard;