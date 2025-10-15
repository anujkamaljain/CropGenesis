import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { 
  Sprout, 
  ArrowLeft, 
  Loader2,
  CheckCircle,
  Volume2,
  MessageCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cropPlanAPI } from '../utils/api';
import { handleApiSuccess, handleApiError } from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';
import AudioPlayer from '../components/AudioPlayer';

const CropPlanForm = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState(null);
  const [followUpQuestion, setFollowUpQuestion] = useState('');
  const [isGeneratingFollowUp, setIsGeneratingFollowUp] = useState(false);
  const [followUpResponse, setFollowUpResponse] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm();

  const onSubmit = async (data) => {
    try {
      setIsGenerating(true);
      setGeneratedPlan(null);
      setFollowUpResponse(null);

      const response = await cropPlanAPI.generate(data);
      
      if (response.data.success) {
        setGeneratedPlan(response.data.data);
        handleApiSuccess('Crop plan generated successfully!');
        reset(); // Clear form
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

      const response = await cropPlanAPI.followUp({
        planId: generatedPlan.plan._id,
        question: followUpQuestion
      });

      if (response.data.success) {
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

  const soilTypes = [
    { value: 'clay', label: 'Clay' },
    { value: 'sandy', label: 'Sandy' },
    { value: 'loamy', label: 'Loamy' },
    { value: 'silty', label: 'Silty' },
    { value: 'peaty', label: 'Peaty' },
    { value: 'chalky', label: 'Chalky' },
    { value: 'unknown', label: 'Unknown' }
  ];

  const irrigationTypes = [
    { value: 'drip', label: 'Drip Irrigation' },
    { value: 'sprinkler', label: 'Sprinkler' },
    { value: 'flood', label: 'Flood Irrigation' },
    { value: 'manual', label: 'Manual Watering' },
    { value: 'rainfed', label: 'Rainfed' },
    { value: 'mixed', label: 'Mixed' }
  ];

  const seasons = [
    { value: 'kharif', label: 'Kharif (Monsoon)' },
    { value: 'rabi', label: 'Rabi (Winter)' },
    { value: 'zaid', label: 'Zaid (Summer)' },
    { value: 'year-round', label: 'Year Round' }
  ];

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
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mr-4">
              <Sprout className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Crop Plan Generator</h1>
              <p className="text-gray-600">Get AI-powered crop recommendations based on your farm conditions</p>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Farm Details</h2>
              
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Soil Type */}
                <div>
                  <label htmlFor="soilType" className="block text-sm font-medium text-gray-700 mb-2">
                    Soil Type *
                  </label>
                  <select
                    {...register('soilType', { required: 'Soil type is required' })}
                    id="soilType"
                    className="input-field"
                  >
                    <option value="">Select soil type</option>
                    {soilTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                  {errors.soilType && (
                    <p className="mt-1 text-sm text-red-600">{errors.soilType.message}</p>
                  )}
                </div>

                {/* Land Size */}
                <div>
                  <label htmlFor="landSize" className="block text-sm font-medium text-gray-700 mb-2">
                    Land Size (acres) *
                  </label>
                  <input
                    {...register('landSize', {
                      required: 'Land size is required',
                      min: { value: 0.1, message: 'Minimum 0.1 acres' },
                      max: { value: 1000, message: 'Maximum 1000 acres' }
                    })}
                    type="number"
                    step="0.1"
                    id="landSize"
                    className="input-field"
                    placeholder="Enter land size in acres"
                  />
                  {errors.landSize && (
                    <p className="mt-1 text-sm text-red-600">{errors.landSize.message}</p>
                  )}
                </div>

                {/* Irrigation */}
                <div>
                  <label htmlFor="irrigation" className="block text-sm font-medium text-gray-700 mb-2">
                    Irrigation Type *
                  </label>
                  <select
                    {...register('irrigation', { required: 'Irrigation type is required' })}
                    id="irrigation"
                    className="input-field"
                  >
                    <option value="">Select irrigation type</option>
                    {irrigationTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                  {errors.irrigation && (
                    <p className="mt-1 text-sm text-red-600">{errors.irrigation.message}</p>
                  )}
                </div>

                {/* Season */}
                <div>
                  <label htmlFor="season" className="block text-sm font-medium text-gray-700 mb-2">
                    Season *
                  </label>
                  <select
                    {...register('season', { required: 'Season is required' })}
                    id="season"
                    className="input-field"
                  >
                    <option value="">Select season</option>
                    {seasons.map((season) => (
                      <option key={season.value} value={season.value}>
                        {season.label}
                      </option>
                    ))}
                  </select>
                  {errors.season && (
                    <p className="mt-1 text-sm text-red-600">{errors.season.message}</p>
                  )}
                </div>

                {/* Language Preference */}
                <div>
                  <label htmlFor="preferredLanguage" className="block text-sm font-medium text-gray-700 mb-2">
                    Language Preference
                  </label>
                  <select
                    {...register('preferredLanguage')}
                    id="preferredLanguage"
                    className="input-field"
                  >
                    <option value="">Use account default</option>
                    <option value="en">English</option>
                    <option value="hi">Hindi</option>
                    <option value="te">Telugu</option>
                    <option value="ta">Tamil</option>
                    <option value="bn">Bengali</option>
                    <option value="mr">Marathi</option>
                    <option value="gu">Gujarati</option>
                    <option value="kn">Kannada</option>
                    <option value="ml">Malayalam</option>
                    <option value="or">Odia</option>
                    <option value="pa">Punjabi</option>
                    <option value="as">Assamese</option>
                  </select>
                  {errors.preferredLanguage && (
                    <p className="mt-1 text-sm text-red-600">{errors.preferredLanguage.message}</p>
                  )}
                </div>

                {/* Additional Notes */}
                <div>
                  <label htmlFor="additionalNotes" className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Notes
                  </label>
                  <textarea
                    {...register('additionalNotes')}
                    id="additionalNotes"
                    rows={4}
                    className="input-field"
                    placeholder="Any specific requirements, previous crops, or additional information..."
                  />
                </div>

                {/* Submit Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isGenerating}
                  className="w-full btn-primary flex items-center justify-center py-3"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Generating Plan...
                    </>
                  ) : (
                    <>
                      <Sprout className="w-5 h-5 mr-2" />
                      Generate Crop Plan
                    </>
                  )}
                </motion.button>
              </form>
            </div>
          </motion.div>

          {/* Results */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            {isGenerating && (
              <div className="card text-center">
                <LoadingSpinner size="lg" className="mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Generating Your Crop Plan</h3>
                <p className="text-gray-600">Our AI is analyzing your farm conditions and creating a personalized plan...</p>
              </div>
            )}

            {generatedPlan && (
              <div className="space-y-6">
                {/* Generated Plan */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="card"
                >
                  <div className="flex items-center mb-4">
                    <CheckCircle className="w-6 h-6 text-green-600 mr-2" />
                    <h3 className="text-lg font-semibold text-gray-900">Your Crop Plan</h3>
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
                </motion.div>

                {/* Follow-up Questions */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="card"
                >
                  <div className="flex items-center mb-4">
                    <MessageCircle className="w-5 h-5 text-primary-600 mr-2" />
                    <h3 className="text-lg font-semibold text-gray-900">Ask a Follow-up Question</h3>
                  </div>
                  
                  <div className="space-y-4">
                    <textarea
                      value={followUpQuestion}
                      onChange={(e) => setFollowUpQuestion(e.target.value)}
                      placeholder="Ask any question about your crop plan..."
                      className="input-field"
                      rows={3}
                    />
                    
                    <button
                      onClick={handleFollowUp}
                      disabled={!followUpQuestion.trim() || isGeneratingFollowUp}
                      className="btn-primary w-full flex items-center justify-center"
                    >
                      {isGeneratingFollowUp ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Generating Response...
                        </>
                      ) : (
                        'Ask Question'
                      )}
                    </button>
                  </div>

                  {/* Follow-up Response */}
                  {followUpResponse && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-6 p-4 bg-gray-50 rounded-lg"
                    >
                      <h4 className="font-medium text-gray-900 mb-2">Response:</h4>
                      <div className="whitespace-pre-wrap text-gray-700 mb-4">
                        {followUpResponse.answer}
                      </div>
                      
                      {followUpResponse.audioURL && (
                        <AudioPlayer audioURL={followUpResponse.audioURL} />
                      )}
                    </motion.div>
                  )}
                </motion.div>
              </div>
            )}

            {!isGenerating && !generatedPlan && (
              <div className="card text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sprout className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to Generate</h3>
                <p className="text-gray-600">Fill in your farm details on the left to get started</p>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default CropPlanForm;
