import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { 
  Upload, 
  Camera,
  ArrowLeft, 
  Loader2,
  CheckCircle,
  Volume2,
  MessageCircle
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { cropPlanAPI } from '../utils/api';
import { handleApiSuccess, handleApiError } from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';
import AudioPlayer from '../components/AudioPlayer';
import { useAuth } from '../context/AuthContext';

const CropPlanForm = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState(null);
  const [followUpQuestion, setFollowUpQuestion] = useState('');
  const [isGeneratingFollowUp, setIsGeneratingFollowUp] = useState(false);
  const [followUpResponse, setFollowUpResponse] = useState(null);
  const [followUpThread, setFollowUpThread] = useState([]);
  const [selectedImages, setSelectedImages] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [irrigationMethod, setIrrigationMethod] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm();

  // Check authentication and redirect if not logged in
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login', { 
        state: { 
          message: 'Please login to create crop plans',
          redirectTo: '/crop-plan'
        }
      });
    }
  }, [isAuthenticated, isLoading, navigate]);

  const onSubmit = async (data) => {
    console.log('Form submitted with data:', data);
    console.log('Current irrigation method:', irrigationMethod);
    console.log('Form errors:', errors);
    
    // Manual validation for custom irrigation
    if (irrigationMethod === 'other' && (!data.customIrrigation || data.customIrrigation.trim() === '')) {
      alert('Please specify the irrigation method when "Other" is selected.');
      return;
    }
    
    try {
      setIsGenerating(true);
      setGeneratedPlan(null);
      setFollowUpResponse(null);

      // Prepare data according to backend expectations
      const requestData = {
        soilType: data.soilType,
        landSize: parseFloat(data.landSize) || 0,
        irrigation: data.irrigation === 'other' ? data.customIrrigation : data.irrigation,
        season: data.season,
        preferredLanguage: data.language || 'en',
        additionalNotes: data.description || ''
      };

      console.log('Sending data to API:', requestData);

      const response = await cropPlanAPI.generate(requestData);
      
       if (response.data.success) {
         setGeneratedPlan(response.data.data);
         
         // Load existing follow-up questions if any
         if (response.data.data.plan.followUpQuestions && response.data.data.plan.followUpQuestions.length > 0) {
           const existingThread = response.data.data.plan.followUpQuestions.map(qa => ({
             question: qa.question,
             answer: qa.answer,
             timestamp: qa.timestamp
           }));
           setFollowUpThread(existingThread);
         }
         
         handleApiSuccess('Crop plan generated successfully!');
         reset(); // Clear form
         setSelectedImages([]);
         setSelectedVideo(null);
         setIrrigationMethod('');
       }
    } catch (error) {
      handleApiError(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFollowUp = async () => {
    if (!followUpQuestion.trim() || !generatedPlan) return;

    try {
      setIsGeneratingFollowUp(true);
      setFollowUpResponse(null);

      console.log('Generated plan object:', generatedPlan);
      console.log('Plan ID being sent:', generatedPlan.plan.id);

      const response = await cropPlanAPI.followUp({
        planId: generatedPlan.plan.id,
        question: followUpQuestion
      });

       if (response.data.success) {
         const newQnA = {
           question: followUpQuestion,
           answer: response.data.data.answer,
           timestamp: new Date().toISOString()
         };
         
         setFollowUpThread(prev => [...prev, newQnA]);
         setFollowUpResponse(response.data.data);
         setFollowUpQuestion('');
         handleApiSuccess('Follow-up response generated!');
       }
    } catch (error) {
      handleApiError(error);
    } finally {
      setIsGeneratingFollowUp(false);
    }
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    setSelectedImages(prev => [...prev, ...files]);
  };

  const handleVideoUpload = (e) => {
    const file = e.target.files[0];
    setSelectedVideo(file);
  };

  const removeImage = (index) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeVideo = () => {
    setSelectedVideo(null);
  };

   const handleBackToForm = () => {
     setGeneratedPlan(null);
     setFollowUpQuestion('');
     setFollowUpResponse(null);
     setFollowUpThread([]);
     setSelectedImages([]);
     setSelectedVideo(null);
     setIrrigationMethod('');
     reset();
   };

  const languages = [
    { value: 'en', label: 'English' },
    { value: 'hi', label: 'Hindi' },
    { value: 'te', label: 'Telugu' },
    { value: 'ta', label: 'Tamil' },
    { value: 'bn', label: 'Bengali' },
    { value: 'mr', label: 'Marathi' },
    { value: 'gu', label: 'Gujarati' },
    { value: 'kn', label: 'Kannada' },
    { value: 'ml', label: 'Malayalam' },
    { value: 'or', label: 'Odia' },
    { value: 'pa', label: 'Punjabi' },
    { value: 'as', label: 'Assamese' }
  ];

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Don't render anything if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
        </motion.div>

        {/* Form Card - Only show when no plan is generated */}
        {!generatedPlan && (
          <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          className="bg-white rounded-lg shadow-lg p-8"
        >
          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800">
              Agricultural Planning Input Form
            </h1>
          </div>
              
          <form onSubmit={handleSubmit(
            (data) => {
              console.log('Form validation passed, submitting:', data);
              onSubmit(data);
            },
            (errors) => {
              console.log('Form validation failed:', errors);
              console.log('Validation errors details:', errors);
            }
          )} className="space-y-6">
            {/* Preferred Language */}
            <div>
              <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-2">
                Preferred language for explanation
              </label>
              <select
                {...register('language')}
                id="language"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                defaultValue="en"
              >
                {languages.map((lang) => (
                  <option key={lang.value} value={lang.value}>
                    {lang.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Location */}
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                Location <span className="text-red-500">*</span>
              </label>
              <input
                {...register('location', { required: 'Location is required' })}
                type="text"
                id="location"
                placeholder="Enter location"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {errors.location && (
                <p className="mt-1 text-sm text-red-600">{errors.location.message}</p>
              )}
            </div>

                {/* Soil Type */}
                <div>
                  <label htmlFor="soilType" className="block text-sm font-medium text-gray-700 mb-2">
                Soil Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    {...register('soilType', { required: 'Soil type is required' })}
                    id="soilType"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select soil type</option>
                <option value="clay">Clay</option>
                <option value="sandy">Sandy</option>
                <option value="loamy">Loamy</option>
                <option value="silty">Silty</option>
                <option value="peaty">Peaty</option>
                <option value="chalky">Chalky</option>
                <option value="unknown">Unknown</option>
                  </select>
                  {errors.soilType && (
                    <p className="mt-1 text-sm text-red-600">{errors.soilType.message}</p>
                  )}
                </div>

                {/* Land Size */}
                <div>
                  <label htmlFor="landSize" className="block text-sm font-medium text-gray-700 mb-2">
                Land Size <span className="text-red-500">*</span>
                  </label>
                  <input
                {...register('landSize', { required: 'Land size is required' })}
                type="text"
                    id="landSize"
                placeholder="Enter land size"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {errors.landSize && (
                    <p className="mt-1 text-sm text-red-600">{errors.landSize.message}</p>
              )}
            </div>

            {/* Last Crop */}
            <div>
              <label htmlFor="lastCrop" className="block text-sm font-medium text-gray-700 mb-2">
                Last Crop <span className="text-red-500">*</span>
              </label>
              <input
                {...register('lastCrop', { required: 'Last crop is required' })}
                type="text"
                id="lastCrop"
                placeholder="Enter last crop"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {errors.lastCrop && (
                <p className="mt-1 text-sm text-red-600">{errors.lastCrop.message}</p>
                  )}
                </div>

                {/* Irrigation */}
                <div>
                  <label htmlFor="irrigation" className="block text-sm font-medium text-gray-700 mb-2">
                Irrigation <span className="text-red-500">*</span>
                  </label>
                  <select
                {...register('irrigation', { required: 'Irrigation method is required' })}
                    id="irrigation"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onChange={(e) => setIrrigationMethod(e.target.value)}
              >
                <option value="">Select irrigation method</option>
                <option value="drip">Drip Irrigation</option>
                <option value="sprinkler">Sprinkler Irrigation</option>
                <option value="flood">Flood Irrigation</option>
                <option value="manual">Manual Watering</option>
                <option value="rainfed">Rain-fed</option>
                <option value="mixed">Mixed</option>
                <option value="other">Other</option>
                  </select>
                  {errors.irrigation && (
                    <p className="mt-1 text-sm text-red-600">{errors.irrigation.message}</p>
                  )}
              
              {/* Custom irrigation method input */}
              {irrigationMethod === 'other' && (
                <div className="mt-3">
                  <label htmlFor="customIrrigation" className="block text-sm font-medium text-gray-700 mb-2">
                    Specify irrigation method <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('customIrrigation')}
                    type="text"
                    id="customIrrigation"
                    placeholder="Enter your irrigation method"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {errors.customIrrigation && (
                    <p className="mt-1 text-sm text-red-600">{errors.customIrrigation.message}</p>
                  )}
                </div>
                  )}
                </div>

                {/* Season */}
                <div>
                  <label htmlFor="season" className="block text-sm font-medium text-gray-700 mb-2">
                Season <span className="text-red-500">*</span>
                  </label>
                  <select
                    {...register('season', { required: 'Season is required' })}
                    id="season"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select season</option>
                <option value="kharif">Kharif (Monsoon - June to October)</option>
                <option value="rabi">Rabi (Winter - October to March)</option>
                <option value="zaid">Zaid (Summer - March to June)</option>
                <option value="spring">Spring (March to May)</option>
                <option value="summer">Summer (May to July)</option>
                <option value="monsoon">Monsoon (July to September)</option>
                <option value="autumn">Autumn (September to November)</option>
                <option value="winter">Winter (November to February)</option>
                <option value="year-round">Year Round</option>
                  </select>
                  {errors.season && (
                    <p className="mt-1 text-sm text-red-600">{errors.season.message}</p>
                  )}
                </div>

            {/* Additional Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Additional Description
              </label>
              <textarea
                {...register('description')}
                id="description"
                rows={4}
                placeholder="Enter description (optional)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Upload Images */}
                <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Images (optional)
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center bg-gray-50">
                <input
                  type="file"
                  id="images"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <label
                  htmlFor="images"
                  className="cursor-pointer flex flex-col items-center"
                >
                  <Upload className="w-8 h-8 text-gray-400 mb-2" />
                  <span className="text-gray-600">Click to upload images</span>
                  </label>
              </div>
              {selectedImages.length > 0 && (
                <div className="mt-2">
                  {selectedImages.map((image, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-100 p-2 rounded mb-1">
                      <span className="text-sm text-gray-700">{image.name}</span>
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
                  )}
                </div>

            {/* Upload Video */}
                <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Video (optional)
                  </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center bg-gray-50">
                <input
                  type="file"
                  id="video"
                  accept="video/*"
                  onChange={handleVideoUpload}
                  className="hidden"
                />
                <label
                  htmlFor="video"
                  className="cursor-pointer flex flex-col items-center"
                >
                  <Camera className="w-8 h-8 text-gray-400 mb-2" />
                  <span className="text-gray-600">Click to upload video</span>
                </label>
              </div>
              {selectedVideo && (
                <div className="mt-2">
                  <div className="flex items-center justify-between bg-gray-100 p-2 rounded">
                    <span className="text-sm text-gray-700">{selectedVideo.name}</span>
                    <button
                      type="button"
                      onClick={removeVideo}
                      className="text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}
                </div>

                {/* Submit Button */}
            <div className="pt-4">
              <button
                  type="submit"
                  disabled={isGenerating}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGenerating ? (
                  <div className="flex items-center justify-center">
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Generating Plan...
                  </div>
                  ) : (
                  'Submit Form'
                  )}
              </button>
            </div>
          </form>
          </motion.div>
        )}

        {/* Results Section */}
        {isGenerating && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 bg-white rounded-lg shadow-lg p-8 text-center"
          >
                <LoadingSpinner size="lg" className="mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Generating Your Crop Plan</h3>
                <p className="text-gray-600">Our AI is analyzing your farm conditions and creating a personalized plan...</p>
          </motion.div>
            )}

            {generatedPlan && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
            className="mt-8 space-y-6"
                >
            {/* Back to Form Button */}
            <div className="flex justify-start mb-4">
              <button
                onClick={handleBackToForm}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Form
              </button>
            </div>

            {/* Generated Plan */}
            <div className="bg-white rounded-lg shadow-lg p-8">
                  <div className="flex items-center mb-4">
                    <CheckCircle className="w-6 h-6 text-green-600 mr-2" />
                    <h3 className="text-lg font-semibold text-gray-900">Your Crop Plan</h3>
                  </div>
                  
                  <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-green-800 font-medium">✅ Crop plan generated successfully!</p>
                    <p className="text-green-700 text-sm mt-1">Your personalized agricultural plan is ready below.</p>
                  </div>
                  
                  <div className="prose max-w-none">
                    <div className="whitespace-pre-wrap text-gray-700">
                      {generatedPlan.plan.planText}
                    </div>
                  </div>

                  {/* Audio Player */}
                  {generatedPlan.audioURL && (
                    <div className="mt-6">
                      <AudioPlayer audioURL={generatedPlan.audioURL} />
                    </div>
                  )}
            </div>

                {/* Follow-up Questions */}
            <div className="bg-white rounded-lg shadow-lg p-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Ask Follow-up Questions</h3>
                  
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
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default CropPlanForm;