/**
 * Dynamic Frontend Configuration
 * Automatically handles localhost and production environments
 */

/**
 * Get the API base URL based on environment
 * @returns {string} API base URL
 */
export const getApiUrl = () => {
  // Check if we're in development mode
  const isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development';
  const isProduction = import.meta.env.PROD || import.meta.env.MODE === 'production';

  // Get API URL from environment variable
  const envApiUrl = import.meta.env.VITE_API_URL;

  // If VITE_API_URL is explicitly set, use it (works for both dev and prod)
  if (envApiUrl) {
    // Remove trailing slashes for consistency
    return envApiUrl.replace(/\/+$/, '');
  }

  // Fallback: In development, use localhost
  if (isDevelopment) {
    return 'http://localhost:5000/api';
  }

  // In production, if no URL is set, warn and use a sensible default
  if (isProduction) {
    console.warn('⚠️  VITE_API_URL not set in production. Using default backend URL.');
    console.warn('   Please set VITE_API_URL in your environment variables.');
    // Default production backend URL (should be overridden by env var)
    return 'https://cropgenesis-c9ee.onrender.com/api';
  }

  // Ultimate fallback (shouldn't reach here, but just in case)
  return 'http://localhost:5000/api';
};

/**
 * Get app configuration from environment variables
 */
export const getAppConfig = () => {
  return {
    apiUrl: getApiUrl(),
    appName: import.meta.env.VITE_APP_NAME || 'CropGenesis',
    appVersion: import.meta.env.VITE_APP_VERSION || '1.0.0',
    nodeEnv: import.meta.env.MODE || import.meta.env.NODE_ENV || 'development',
    isDevelopment: import.meta.env.DEV || import.meta.env.MODE === 'development',
    isProduction: import.meta.env.PROD || import.meta.env.MODE === 'production',
  };
};

/**
 * Log configuration (only in development for security)
 */
export const logConfig = () => {
  const config = getAppConfig();
  
  if (config.isDevelopment) {
    console.log('🔧 Frontend Configuration:', {
      apiUrl: config.apiUrl,
      appName: config.appName,
      appVersion: config.appVersion,
      environment: config.nodeEnv,
    });
  } else if (config.isProduction) {
    // In production, log minimal info (no sensitive URLs)
    console.log('🔧 Frontend Configuration:', {
      appName: config.appName,
      appVersion: config.appVersion,
      environment: config.nodeEnv,
      apiUrlConfigured: !!import.meta.env.VITE_API_URL,
    });
  }
};

// Export default config object
export const config = getAppConfig();

// Auto-log config on module load (only in browser)
if (typeof window !== 'undefined') {
  logConfig();
}

export default config;

