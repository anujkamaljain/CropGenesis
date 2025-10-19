const { GoogleGenAI } = require('@google/genai');
const fs = require('fs');

// Initialize Gemini AI only if API key is available
let genAI = null;
if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here') {
  try {
    genAI = new GoogleGenAI(process.env.GEMINI_API_KEY);
    console.log('✅ Gemini AI initialized successfully');
  } catch (error) {
    console.warn('⚠️ Failed to initialize Gemini AI:', error.message);
    genAI = null;
  }
} else {
  console.warn('⚠️ GEMINI_API_KEY not configured, using fallback mode');
}

// Retry function for Gemini API calls with exponential backoff
async function retryGeminiCall(apiCall, maxRetries = 3, baseDelay = 1000) {
  console.log(`🚀 Starting Gemini API call with ${maxRetries} max retries`);
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Gemini API attempt ${attempt}/${maxRetries}`);
      console.log(`🔑 API Key check - exists: ${!!process.env.GEMINI_API_KEY}, length: ${process.env.GEMINI_API_KEY?.length || 0}`);
      
      const result = await apiCall();
      console.log(`✅ Gemini API call successful on attempt ${attempt}`);
      return result;
    } catch (error) {
      console.log(`⚠️ Gemini API attempt ${attempt} failed:`);
      console.log(`   📝 Error message: ${error.message}`);
      console.log(`   🔢 Error code: ${error.code}`);
      console.log(`   📊 Error status: ${error.status}`);
      console.log(`   🏷️ Error name: ${error.name}`);
      
      if (attempt === maxRetries) {
        console.log(`❌ All ${maxRetries} attempts failed, throwing error`);
        throw error; // Re-throw on final attempt
      }
      
      // Check if it's a retryable error (503, 429, 500)
      if (error.status === 503 || error.status === 429 || error.status === 500) {
        const delay = baseDelay * Math.pow(2, attempt - 1); // Exponential backoff
        console.log(`⏳ Retryable error detected, waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        console.log(`❌ Non-retryable error detected, stopping retries`);
        throw error; // Don't retry for non-retryable errors
      }
    }
  }
}

// Function to test API connection
const testGeminiConnection = async () => {
  if (!genAI) {
    return { success: false, message: 'Gemini AI not initialized - check API key' };
  }
  
  try {
    const testPrompt = 'Hello, this is a test. Please respond with "API connection successful".';
    
    const result = await retryGeminiCall(() => 
      genAI.models.generateContent({
        model: "gemini-2.5-flash-lite",
        contents: testPrompt,
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 100
        }
      })
    );
    
    const text = result.candidates[0].content.parts[0].text;
    console.log('✅ Gemini API connection test successful');
    return { success: true, message: 'API connection successful', response: text };
  } catch (error) {
    console.error('❌ Gemini API connection test failed:', error.message);
    return { success: false, message: error.message };
  }
};

/**
 * Generate crop plan using Gemini AI
 * @param {Object} inputs - User inputs for crop planning
 * @returns {Object} Generated plan with text and audio
 */
const generateCropPlan = async (inputs) => {
  try {
    // Check if genAI is available
    if (!genAI) {
      throw new Error('Gemini API key is not configured');
    }

    console.log('🤖 Using Gemini AI to generate crop plan...');
    
    const {
      soilType,
      landSize,
      irrigation,
      season,
      preferredLanguage,
      additionalNotes
    } = inputs;

    // Language mapping for prompts
    const languageMap = {
      'en': 'English',
      'hi': 'Hindi',
      'te': 'Telugu',
      'ta': 'Tamil',
      'bn': 'Bengali',
      'mr': 'Marathi',
      'gu': 'Gujarati',
      'kn': 'Kannada',
      'ml': 'Malayalam',
      'or': 'Odia',
      'pa': 'Punjabi',
      'as': 'Assamese'
    };

    const language = languageMap[preferredLanguage] || 'English';

    const prompt = `
You are an expert agricultural advisor helping farmers in India. Generate a comprehensive crop plan based on the following inputs:

Soil Type: ${soilType}
Land Size: ${landSize} acres
Irrigation: ${irrigation}
Season: ${season}
Additional Notes: ${additionalNotes || 'None'}

Please provide a detailed crop plan in ${language} that includes:

1. **Recommended Crops**: Suggest 3-5 suitable crops for the given conditions
2. **Planting Schedule**: When to plant each crop
3. **Soil Preparation**: How to prepare the soil
4. **Fertilizer Requirements**: Organic and chemical fertilizer recommendations
5. **Irrigation Schedule**: Watering frequency and methods
6. **Pest Management**: Common pests and organic control methods
7. **Harvest Timeline**: Expected harvest periods
8. **Expected Yield**: Approximate yield per acre
9. **Cost Estimation**: Rough cost breakdown for inputs
10. **Tips**: Additional farming tips and best practices

Make the response practical, easy to understand, and suitable for Indian farming conditions. Use simple language that farmers can easily follow.

Format the response in clear sections with headings. Keep the total response under 2000 words.
`;

    const result = await retryGeminiCall(() => 
      genAI.models.generateContent({
        model: "gemini-2.5-flash-lite",
        contents: prompt,
        generationConfig: {
          temperature: 0.6,
          maxOutputTokens: 1200, // keep under DB limit comfortably
          topP: 0.9,
          topK: 40
        }
      })
    );

    const planText = result.candidates[0].content.parts[0].text;

    console.log('✅ Gemini AI successfully generated crop plan');
    return {
      success: true,
      planText,
      language: preferredLanguage,
      source: 'gemini-ai'
    };

  } catch (error) {
    console.error('Error generating crop plan:', error);
    // Normalize and rethrow
    if (error.message?.toLowerCase().includes('quota')) {
      throw new Error('Gemini API quota exceeded');
    }
    if (error.message?.toLowerCase().includes('network')) {
      throw new Error('Network error connecting to Gemini API');
    }
    if (error.status === 401 || error.status === 403) {
      throw new Error('Gemini authentication failed - check API key');
    }
    throw error;
  }
};

/**
 * Generate follow-up response for crop plan questions
 * @param {string} planId - ID of the original plan
 * @param {string} question - User's follow-up question
 * @param {string} originalPlan - Original crop plan text
 * @param {string} language - Preferred language
 * @returns {Object} Follow-up response
 */
const generateFollowUpResponse = async (planId, question, originalPlan, language) => {
  try {
    // Check if genAI is available
    if (!genAI) {
      throw new Error('Gemini API key is not configured');
    }

    const languageMap = {
      'en': 'English',
      'hi': 'Hindi',
      'te': 'Telugu',
      'ta': 'Tamil',
      'bn': 'Bengali',
      'mr': 'Marathi',
      'gu': 'Gujarati',
      'kn': 'Kannada',
      'ml': 'Malayalam',
      'or': 'Odia',
      'pa': 'Punjabi',
      'as': 'Assamese'
    };

    const lang = languageMap[language] || 'English';

    const prompt = `
You are an expert agricultural advisor. A farmer has a follow-up question about their crop plan.

Original Crop Plan:
${originalPlan}

Farmer's Question: ${question}

Please provide a detailed, helpful answer in ${lang}. Make sure to:
1. Address the specific question directly
2. Provide practical, actionable advice
3. Reference the original plan when relevant
4. Use simple language suitable for farmers
5. Include specific recommendations if applicable

Keep the response concise but comprehensive (under 500 words).
`;

    const result = await retryGeminiCall(() => 
      genAI.models.generateContent({
        model: "gemini-2.5-flash-lite",
        contents: prompt,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 500,
          topP: 0.9,
          topK: 40
        }
      })
    );

    const answerText = result.candidates[0].content.parts[0].text;

    return {
      success: true,
      answerText,
      language
    };

  } catch (error) {
    console.error('Error generating follow-up response:', error);
    throw error;
  }
};

/**
 * Analyze crop disease from image/video
 * @param {string} filePath - Path to the uploaded file
 * @param {string} fileType - Type of file (image/video)
 * @param {string} language - Preferred language for response
 * @returns {Object} Disease diagnosis and remedy
 */
const analyzeDisease = async (filePath, fileType, language) => {
  try {
    // Check if genAI is available
    if (!genAI) {
      throw new Error('Gemini API key is not configured');
    }

    const languageMap = {
      'en': 'English',
      'hi': 'Hindi',
      'te': 'Telugu',
      'ta': 'Tamil',
      'bn': 'Bengali',
      'mr': 'Marathi',
      'gu': 'Gujarati',
      'kn': 'Kannada',
      'ml': 'Malayalam',
      'or': 'Odia',
      'pa': 'Punjabi',
      'as': 'Assamese'
    };

    const lang = languageMap[language] || 'English';

    // Read file data
    const fileData = fs.readFileSync(filePath);
    const mimeType = fileType === 'image' ? 'image/jpeg' : 'video/mp4';

    // Convert to base64
    const base64Data = fileData.toString('base64');

    const prompt = `
You are an expert plant pathologist. Analyze this ${fileType} of a crop and provide a comprehensive disease diagnosis.

Please provide your analysis in ${lang} with the following information:

1. **Disease Identification**: Name of the disease (if identifiable)
2. **Confidence Level**: Your confidence in the diagnosis (0-100%)
3. **Symptoms**: Detailed description of visible symptoms
4. **Affected Area**: Which part of the plant is affected (leaves, stems, roots, fruits, etc.)
5. **Severity**: Rate the severity (low, medium, high, critical)
6. **Cause**: What causes this disease
7. **Treatment Options**: 
   - Organic remedies (preferred)
   - Chemical treatments (if necessary)
   - Cultural practices
8. **Prevention**: How to prevent this disease in the future
9. **Timeline**: How long treatment might take
10. **Cost Estimation**: Rough cost of treatment per acre

Make the response practical and suitable for Indian farming conditions. Use simple language that farmers can understand.

If the image is unclear or you cannot identify a specific disease, please mention this and provide general plant health advice.
`;

    const result = await retryGeminiCall(() => 
      genAI.models.generateContent({
        model: "gemini-2.5-flash-lite",
        contents: [
          prompt,
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType
            }
          }
        ],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 1000,
          topP: 0.9,
          topK: 40
        }
      })
    );

    const diagnosisText = result.candidates[0].content.parts[0].text;

    // Extract structured information from the response
    const diagnosis = parseDiagnosisResponse(diagnosisText);

    return {
      success: true,
      diagnosisText,
      ...diagnosis,
      language
    };

  } catch (error) {
    console.error('Error analyzing disease:', error);
    throw error;
  }
};

/**
 * Parse diagnosis response to extract structured data
 * @param {string} responseText - Raw response from Gemini
 * @returns {Object} Structured diagnosis data
 */
const parseDiagnosisResponse = (responseText) => {
  const diagnosis = {
    diseaseName: 'Unknown',
    confidence: null,
    severity: 'medium',
    affectedArea: 'unknown',
    treatmentType: 'organic'
  };

  // Extract disease name
  const diseaseMatch = responseText.match(/disease[:\s]+([^\n]+)/i);
  if (diseaseMatch) {
    diagnosis.diseaseName = diseaseMatch[1].trim();
  }

  // Extract confidence
  const confidenceMatch = responseText.match(/confidence[:\s]+(\d+)%/i);
  if (confidenceMatch) {
    diagnosis.confidence = parseInt(confidenceMatch[1]);
  }

  // Extract severity
  const severityMatch = responseText.match(/severity[:\s]+(low|medium|high|critical)/i);
  if (severityMatch) {
    diagnosis.severity = severityMatch[1].toLowerCase();
  }

  // Extract affected area
  const areaMatch = responseText.match(/affected[:\s]+(leaves|stems|roots|fruits|flowers|whole-plant)/i);
  if (areaMatch) {
    diagnosis.affectedArea = areaMatch[1].toLowerCase();
  }

  return diagnosis;
};

/**
 * Generate text-to-speech audio URL (placeholder - would integrate with actual TTS service)
 * @param {string} text - Text to convert to speech
 * @param {string} language - Language code
 * @returns {string|null} Audio URL or null if TTS is not available
 */
const generateTTS = async (text, language) => {
  // This is a placeholder implementation
  // In a real application, you would integrate with a TTS service
  // For now, we'll return null to avoid broken audio URLs
  console.log(`TTS requested for ${language}: ${text.substring(0, 100)}...`);
  
  // Simulate TTS generation delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Return null instead of fake URL to prevent audio errors
  return null;
};

// Fallback generation removed

/**
 * Generate fallback follow-up response when Gemini API is not available
 * @param {string} question - User's question
 * @param {string} language - Preferred language
 * @returns {Object} Fallback response
 */
// Fallback follow-up removed

/**
 * Generate fallback disease analysis when Gemini API is not available
 * @param {string} fileType - Type of file (image/video)
 * @param {string} language - Preferred language
 * @returns {Object} Fallback diagnosis
 */
// Fallback disease analysis removed

module.exports = {
  generateCropPlan,
  generateFollowUpResponse,
  analyzeDisease,
  generateTTS,
  testGeminiConnection,
  // fallbacks removed
};
