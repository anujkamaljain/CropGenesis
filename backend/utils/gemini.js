const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');

// Initialize model variable
let model = null;
let genAI = null;

// Function to initialize the Gemini AI client and model
const initializeModel = () => {
  // Check if API key is configured
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
    console.warn('⚠️  GEMINI_API_KEY not configured. AI features will use fallback mode.');
    return null;
  }

  try {
    // Initialize the Google Generative AI client
    if (!genAI) {
      genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      console.log('✅ Google Generative AI client initialized');
    }

    // Try the newer model name first
    model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    console.log('✅ Using Gemini model: gemini-1.5-flash');
    return model;
  } catch (error) {
    console.warn('⚠️  gemini-1.5-flash not available, trying gemini-pro...');
    try {
      // Fallback to older model name
      model = genAI.getGenerativeModel({ model: "gemini-pro" });
      console.log('✅ Using Gemini model: gemini-pro');
      return model;
    } catch (fallbackError) {
      console.error('❌ Could not initialize any Gemini model:', fallbackError.message);
      console.warn('Available models can be checked at: https://ai.google.dev/models/gemini');
      return null;
    }
  }
};

// Function to test API connection
const testGeminiConnection = async () => {
  // Initialize model if not already done
  if (!model) {
    model = initializeModel();
  }
  
  if (!model) {
    return { success: false, message: 'Model not initialized' };
  }

  try {
    const testPrompt = 'Hello, this is a test. Please respond with "API connection successful".';
    const result = await model.generateContent(testPrompt);
    const response = await result.response;
    const text = response.text();
    
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
    // Check if API key is configured
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
      console.warn('⚠️  Gemini API key not configured. Using fallback response.');
      return generateFallbackCropPlan(inputs);
    }

    // Initialize model if not already done
    if (!model) {
      console.log('🔄 Initializing Gemini model...');
      model = initializeModel();
      if (!model) {
        console.warn('⚠️  Model initialization failed. Using fallback response.');
        return generateFallbackCropPlan(inputs);
      }
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

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const planText = response.text();

    console.log('✅ Gemini AI successfully generated crop plan');
    return {
      success: true,
      planText,
      language: preferredLanguage,
      source: 'gemini-ai'
    };

  } catch (error) {
    console.error('Error generating crop plan:', error);
    
    // Provide more specific error messages
    if (error.message.includes('API_KEY')) {
      throw new Error('Gemini API key is not configured properly');
    } else if (error.message.includes('quota')) {
      throw new Error('Gemini API quota exceeded');
    } else if (error.message.includes('network')) {
      throw new Error('Network error connecting to Gemini API');
    } else if (error.message.includes('404') || error.message.includes('not found')) {
      console.warn('⚠️  Gemini model not found. Using fallback response.');
      return generateFallbackCropPlan(inputs);
    } else {
      console.warn('⚠️  Gemini API error. Using fallback response.');
      return generateFallbackCropPlan(inputs);
    }
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
    // Check if API key is configured
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
      console.warn('⚠️  Gemini API key not configured. Using fallback response.');
      return generateFallbackFollowUpResponse(question, language);
    }

    // Initialize model if not already done
    if (!model) {
      model = initializeModel();
      if (!model) {
        console.warn('⚠️  Model initialization failed. Using fallback response.');
        return generateFallbackFollowUpResponse(question, language);
      }
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

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const answerText = response.text();

    return {
      success: true,
      answerText,
      language
    };

  } catch (error) {
    console.error('Error generating follow-up response:', error);
    
    if (error.message.includes('404') || error.message.includes('not found')) {
      console.warn('⚠️  Gemini model not found. Using fallback response.');
      return generateFallbackFollowUpResponse(question, language);
    } else {
      console.warn('⚠️  Gemini API error. Using fallback response.');
      return generateFallbackFollowUpResponse(question, language);
    }
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
    // Check if API key is configured
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
      console.warn('⚠️  Gemini API key not configured. Using fallback response.');
      return generateFallbackDiseaseAnalysis(fileType, language);
    }

    // Initialize model if not already done
    if (!model) {
      model = initializeModel();
      if (!model) {
        console.warn('⚠️  Model initialization failed. Using fallback response.');
        return generateFallbackDiseaseAnalysis(fileType, language);
      }
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

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Data,
          mimeType: mimeType
        }
      }
    ]);

    const response = await result.response;
    const diagnosisText = response.text();

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
    
    if (error.message.includes('404') || error.message.includes('not found')) {
      console.warn('⚠️  Gemini model not found. Using fallback response.');
      return generateFallbackDiseaseAnalysis(fileType, language);
    } else {
      console.warn('⚠️  Gemini API error. Using fallback response.');
      return generateFallbackDiseaseAnalysis(fileType, language);
    }
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

/**
 * Generate fallback crop plan when Gemini API is not available
 * @param {Object} inputs - User inputs for crop planning
 * @returns {Object} Fallback plan
 */
const generateFallbackCropPlan = async (inputs) => {
  const {
    soilType,
    landSize,
    irrigation,
    season,
    preferredLanguage,
    additionalNotes
  } = inputs;

  // Language mapping
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

  // Generate a basic crop plan based on inputs
  const planText = `
# Crop Plan for ${season} Season

## Farm Details
- **Soil Type**: ${soilType}
- **Land Size**: ${landSize} acres
- **Irrigation**: ${irrigation}
- **Season**: ${season}
- **Additional Notes**: ${additionalNotes || 'None'}

## Recommended Crops
Based on your ${soilType} soil and ${season} season, here are some suitable crops:

1. **Rice** - Excellent for ${soilType} soil during ${season} season
2. **Wheat** - Good choice for ${irrigation} irrigation system
3. **Maize** - Suitable for your land size of ${landSize} acres
4. **Sugarcane** - Thrives in ${soilType} soil conditions

## Planting Schedule
- **Preparation**: Start soil preparation 2-3 weeks before planting
- **Planting**: Begin planting in early ${season} season
- **Spacing**: Maintain proper spacing between plants for optimal growth

## Soil Preparation
1. Plow the field to a depth of 15-20 cm
2. Add organic manure (5-10 tons per acre)
3. Level the field for proper water distribution
4. Test soil pH and adjust if necessary

## Fertilizer Requirements
- **Organic**: 5-10 tons of farmyard manure per acre
- **NPK**: 120:60:40 kg per acre (adjust based on soil test)
- **Micronutrients**: Apply zinc and boron as needed

## Irrigation Schedule
- **Frequency**: Water every 3-5 days during dry periods
- **Method**: Use ${irrigation} irrigation system
- **Amount**: 2-3 inches of water per application

## Pest Management
- Monitor for common pests regularly
- Use organic pest control methods first
- Apply chemical treatments only when necessary
- Maintain field hygiene to prevent pest buildup

## Harvest Timeline
- **Rice**: 120-150 days after planting
- **Wheat**: 100-120 days after planting
- **Maize**: 80-100 days after planting
- **Sugarcane**: 12-18 months after planting

## Expected Yield
- **Rice**: 3-4 tons per acre
- **Wheat**: 2-3 tons per acre
- **Maize**: 2-3 tons per acre
- **Sugarcane**: 40-50 tons per acre

## Cost Estimation
- **Seeds**: ₹2,000-5,000 per acre
- **Fertilizers**: ₹3,000-6,000 per acre
- **Pesticides**: ₹1,000-3,000 per acre
- **Labor**: ₹5,000-10,000 per acre
- **Total**: ₹11,000-24,000 per acre

## Tips for Success
1. Regular monitoring of crop health
2. Timely irrigation and fertilization
3. Proper pest and disease management
4. Maintain soil health with organic matter
5. Keep records of all farming activities

*Note: This is a basic crop plan. For detailed recommendations, please consult with local agricultural experts or extension officers.*

**⚠️ AI Service Notice**: This plan was generated using fallback data as the AI service is currently unavailable. For more accurate and personalized recommendations, please ensure the Gemini API key is properly configured.
`;

  return {
    success: true,
    planText,
    language: preferredLanguage,
    source: 'fallback'
  };
};

/**
 * Generate fallback follow-up response when Gemini API is not available
 * @param {string} question - User's question
 * @param {string} language - Preferred language
 * @returns {Object} Fallback response
 */
const generateFallbackFollowUpResponse = async (question, language) => {
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

  // Generate a basic response based on common questions
  let answerText = '';

  if (question.toLowerCase().includes('fertilizer') || question.toLowerCase().includes('fertiliser')) {
    answerText = `
## Fertilizer Recommendations

Based on your crop plan, here are some general fertilizer guidelines:

### Organic Fertilizers
- **Farmyard Manure**: 5-10 tons per acre
- **Compost**: 2-3 tons per acre
- **Vermicompost**: 1-2 tons per acre

### Chemical Fertilizers
- **NPK Ratio**: 120:60:40 kg per acre
- **Urea**: 50-60 kg per acre
- **DAP**: 30-40 kg per acre
- **Potash**: 20-30 kg per acre

### Application Schedule
1. **Basal Application**: Apply 50% of fertilizers at planting
2. **Top Dressing**: Apply remaining 50% in 2-3 splits
3. **Timing**: Apply during active growth periods

*Note: This is general advice. For specific recommendations, please consult with local agricultural experts or get your soil tested.*

**⚠️ AI Service Notice**: This response was generated using fallback data as the AI service is currently unavailable.
`;
  } else if (question.toLowerCase().includes('irrigation') || question.toLowerCase().includes('water')) {
    answerText = `
## Irrigation Guidelines

Here are some irrigation recommendations for your crops:

### Water Requirements
- **Rice**: 1000-1500 mm per season
- **Wheat**: 400-600 mm per season
- **Maize**: 500-800 mm per season
- **Sugarcane**: 1500-2000 mm per season

### Irrigation Schedule
- **Frequency**: Every 3-5 days during dry periods
- **Timing**: Early morning or evening
- **Amount**: 2-3 inches per application

### Water Management Tips
1. Monitor soil moisture regularly
2. Use mulching to conserve water
3. Implement drip irrigation for water efficiency
4. Avoid over-irrigation to prevent waterlogging

*Note: Water requirements may vary based on soil type, weather conditions, and crop variety.*

**⚠️ AI Service Notice**: This response was generated using fallback data as the AI service is currently unavailable.
`;
  } else if (question.toLowerCase().includes('pest') || question.toLowerCase().includes('disease')) {
    answerText = `
## Pest and Disease Management

Here are some general pest and disease management strategies:

### Common Pests
- **Aphids**: Use neem oil or insecticidal soap
- **Whiteflies**: Yellow sticky traps and neem oil
- **Caterpillars**: Bacillus thuringiensis (Bt)
- **Mites**: Sulfur-based pesticides

### Common Diseases
- **Fungal Diseases**: Use copper-based fungicides
- **Bacterial Diseases**: Practice crop rotation
- **Viral Diseases**: Control vector insects

### Prevention Strategies
1. Use disease-resistant varieties
2. Practice crop rotation
3. Maintain field hygiene
4. Monitor crops regularly
5. Use organic methods first

### Treatment Options
- **Organic**: Neem oil, garlic extract, baking soda
- **Chemical**: Use only when necessary and follow label instructions
- **Biological**: Beneficial insects and microorganisms

*Note: Always identify the specific pest or disease before treatment. Consult with local agricultural experts for accurate diagnosis.*

**⚠️ AI Service Notice**: This response was generated using fallback data as the AI service is currently unavailable.
`;
  } else {
    answerText = `
## General Agricultural Advice

Thank you for your question: "${question}"

Here are some general guidelines that might help:

### Best Practices
1. **Soil Health**: Regular soil testing and organic matter addition
2. **Crop Rotation**: Rotate crops to prevent soil depletion
3. **Water Management**: Efficient irrigation and drainage
4. **Pest Management**: Integrated pest management approach
5. **Record Keeping**: Maintain detailed farming records

### Resources
- Contact your local agricultural extension office
- Consult with experienced farmers in your area
- Use government agricultural helplines
- Attend agricultural workshops and training programs

### Important Notes
- Always verify information with local experts
- Consider your specific soil and climate conditions
- Follow recommended safety practices
- Keep updated with latest agricultural research

*For more specific advice related to your question, please consult with local agricultural experts or extension officers.*

**⚠️ AI Service Notice**: This response was generated using fallback data as the AI service is currently unavailable. For more accurate and personalized recommendations, please ensure the Gemini API key is properly configured.
`;
  }

  return {
    success: true,
    answerText,
    language
  };
};

/**
 * Generate fallback disease analysis when Gemini API is not available
 * @param {string} fileType - Type of file (image/video)
 * @param {string} language - Preferred language
 * @returns {Object} Fallback diagnosis
 */
const generateFallbackDiseaseAnalysis = async (fileType, language) => {
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

  const diagnosisText = `
# Plant Disease Analysis

## Image/Video Analysis
I've received your ${fileType} for analysis. While I cannot provide a specific diagnosis without AI analysis, here are some general guidelines for plant health assessment:

## Common Plant Health Issues

### Visual Symptoms to Look For:
1. **Leaf Spots**: Circular or irregular spots on leaves
2. **Yellowing**: Chlorosis or yellowing of leaves
3. **Wilting**: Drooping or wilting of plant parts
4. **Stunted Growth**: Reduced plant size or development
5. **Abnormal Growth**: Distorted or deformed plant parts

### Common Diseases:
- **Fungal Diseases**: Powdery mildew, rust, leaf spot
- **Bacterial Diseases**: Bacterial blight, canker
- **Viral Diseases**: Mosaic patterns, stunting
- **Nutritional Deficiencies**: Yellowing, poor growth

## General Treatment Recommendations

### Organic Treatments:
1. **Neem Oil**: Effective against many fungal and bacterial diseases
2. **Copper Fungicide**: For fungal infections
3. **Baking Soda Solution**: For powdery mildew
4. **Garlic Extract**: Natural antifungal properties

### Cultural Practices:
1. **Proper Spacing**: Ensure adequate air circulation
2. **Water Management**: Avoid overhead watering
3. **Sanitation**: Remove infected plant parts
4. **Crop Rotation**: Prevent disease buildup

### Prevention:
1. **Healthy Soil**: Maintain soil fertility and pH
2. **Resistant Varieties**: Use disease-resistant cultivars
3. **Regular Monitoring**: Check plants frequently
4. **Proper Nutrition**: Balanced fertilization

## Next Steps

1. **Consult Local Expert**: Contact your agricultural extension office
2. **Soil Testing**: Get your soil tested for nutrients and pH
3. **Plant Clinic**: Visit a plant disease clinic if available
4. **Online Resources**: Use government agricultural websites

## Important Notes

- This is general advice and not a specific diagnosis
- Always verify with local agricultural experts
- Consider your specific growing conditions
- Follow recommended safety practices when using treatments

**⚠️ AI Service Notice**: This analysis was generated using fallback data as the AI service is currently unavailable. For accurate disease identification, please ensure the Gemini API key is properly configured or consult with local agricultural experts.
`;

  return {
    success: true,
    diagnosisText,
    diseaseName: 'General Plant Health Assessment',
    confidence: 50,
    severity: 'medium',
    affectedArea: 'unknown',
    treatmentType: 'organic',
    language
  };
};

module.exports = {
  generateCropPlan,
  generateFollowUpResponse,
  analyzeDisease,
  generateTTS,
  testGeminiConnection,
  generateFallbackCropPlan,
  generateFallbackFollowUpResponse,
  generateFallbackDiseaseAnalysis
};
