import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import { 
  Camera, 
  ArrowLeft, 
  Upload, 
  FileImage, 
  FileVideo,
  Loader2,
  CheckCircle,
  AlertTriangle,
  X
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { diagnosisAPI } from '../utils/api';
import { handleApiSuccess, handleApiError } from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';
import AudioPlayer from '../components/AudioPlayer';

const DiagnosisUpload = () => {
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setUploadedFile(file);
      setAnalysisResult(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragReject } = useDropzone({
    onDrop: (acceptedFiles) => {
      setDragActive(false);
      onDrop(acceptedFiles);
    },
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png'],
      'video/*': ['.mp4', '.avi', '.mov']
    },
    maxFiles: 1,
    maxSize: 50 * 1024 * 1024, // 50MB
    onDragEnter: () => setDragActive(true),
    onDragLeave: () => setDragActive(false)
  });

  const handleAnalyze = async () => {
    if (!uploadedFile) return;

    try {
      setIsAnalyzing(true);
      setAnalysisResult(null);

      const formData = new FormData();
      formData.append('file', uploadedFile);

      const response = await diagnosisAPI.upload(formData);
      
      if (response.data.success) {
        setAnalysisResult(response.data.data);
        handleApiSuccess('Disease analysis completed successfully!');
      }
    } catch (error) {
      handleApiError(error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    setAnalysisResult(null);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link
            to="/dashboard"
            className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-4 transition-colors duration-200"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
          
          <div className="flex items-center">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mr-4">
              <Camera className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Disease Diagnosis</h1>
              <p className="text-gray-600">Upload images or videos of your crops for AI-powered disease analysis</p>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upload Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Upload Media</h2>
              
              {/* Dropzone */}
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors duration-200 ${
                  dragActive
                    ? 'border-primary-500 bg-primary-50'
                    : isDragReject
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
                }`}
              >
                <input {...getInputProps()} />
                
                {uploadedFile ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-center">
                      {uploadedFile.type.startsWith('image/') ? (
                        <FileImage className="w-12 h-12 text-primary-600" />
                      ) : (
                        <FileVideo className="w-12 h-12 text-primary-600" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{uploadedFile.name}</p>
                      <p className="text-sm text-gray-500">{formatFileSize(uploadedFile.size)}</p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveFile();
                      }}
                      className="inline-flex items-center px-3 py-1 border border-red-300 text-red-600 rounded-md hover:bg-red-50 transition-colors duration-200"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-center">
                      <Upload className="w-12 h-12 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-lg font-medium text-gray-900">
                        {isDragReject ? 'Invalid file type' : 'Drop your file here'}
                      </p>
                      <p className="text-sm text-gray-500">
                        or click to browse
                      </p>
                    </div>
                    <div className="text-xs text-gray-400">
                      <p>Supports: JPEG, PNG, MP4, AVI, MOV</p>
                      <p>Max size: 50MB</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Analyze Button */}
              {uploadedFile && (
                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  className="w-full btn-primary flex items-center justify-center py-3 mt-6"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Camera className="w-5 h-5 mr-2" />
                      Analyze Disease
                    </>
                  )}
                </motion.button>
              )}
            </div>

            {/* Tips */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="card mt-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Tips for Better Results</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start">
                  <div className="w-1.5 h-1.5 bg-primary-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  Take clear, well-lit photos of affected plant parts
                </li>
                <li className="flex items-start">
                  <div className="w-1.5 h-1.5 bg-primary-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  Include both close-up and wider shots for context
                </li>
                <li className="flex items-start">
                  <div className="w-1.5 h-1.5 bg-primary-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  Capture leaves, stems, and any visible symptoms
                </li>
                <li className="flex items-start">
                  <div className="w-1.5 h-1.5 bg-primary-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  Avoid blurry or heavily shadowed images
                </li>
              </ul>
            </motion.div>
          </motion.div>

          {/* Results Section */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            {isAnalyzing && (
              <div className="card text-center">
                <LoadingSpinner size="lg" className="mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Analyzing Your Image</h3>
                <p className="text-gray-600">Our AI is examining your crop for signs of disease...</p>
              </div>
            )}

            {analysisResult && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Analysis Summary */}
                <div className="card">
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
                  </div>
                </div>

                {/* Diagnosis Details */}
                <div className="card">
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
                  <div className="card">
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
              </motion.div>
            )}

            {!isAnalyzing && !analysisResult && (
              <div className="card text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Camera className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to Analyze</h3>
                <p className="text-gray-600">Upload an image or video of your crop to get started</p>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default DiagnosisUpload;
