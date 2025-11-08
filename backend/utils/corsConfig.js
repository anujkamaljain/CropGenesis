/**
 * Dynamic CORS Configuration
 * Automatically handles localhost and production environments
 */

const isDevelopment = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
const isProduction = process.env.NODE_ENV === 'production';

/**
 * Get allowed origins based on environment
 * @returns {string[]} Array of allowed origin URLs
 */
const getAllowedOrigins = () => {
  const origins = [];

  // In development, always allow common localhost ports
  if (isDevelopment) {
    origins.push(
      'http://localhost:5173',  // Vite default
      'http://localhost:3000',  // React default
      'http://localhost:5174',  // Vite alternate
      'http://127.0.0.1:5173',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5174'
    );
  }

  // Get production origins from environment variable
  const frontendUrl = process.env.FRONTEND_URL;
  if (frontendUrl) {
    // Support comma-separated list of URLs
    const envOrigins = frontendUrl
      .split(',')
      .map(url => url.trim())
      .filter(Boolean)
      .map(url => {
        // Remove trailing slashes for consistency
        return url.replace(/\/+$/, '');
      });
    
    origins.push(...envOrigins);
  } else if (isProduction) {
    // Warn in production if FRONTEND_URL is not set
    console.warn('⚠️  WARNING: FRONTEND_URL not set in production. CORS will block all origins!');
  }

  // Remove duplicates and filter empty strings
  const uniqueOrigins = [...new Set(origins.filter(Boolean))];

  // Log allowed origins (only in development for security)
  if (isDevelopment) {
    console.log('🌐 CORS Allowed Origins:', uniqueOrigins);
  } else if (isProduction && uniqueOrigins.length > 0) {
    // In production, log count only (not full URLs for security)
    console.log(`🌐 CORS configured for ${uniqueOrigins.length} allowed origin(s)`);
  }

  return uniqueOrigins;
};

/**
 * Check if origin is allowed
 * @param {string} origin - The origin to check
 * @param {string[]} allowedOrigins - Array of allowed origins
 * @returns {boolean}
 */
const isOriginAllowed = (origin, allowedOrigins) => {
  if (!origin) return false;

  // Exact match
  if (allowedOrigins.includes(origin)) {
    return true;
  }

  // In development, allow any localhost origin
  if (isDevelopment) {
    try {
      const url = new URL(origin);
      if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
        return true;
      }
    } catch (e) {
      // Invalid URL, reject
      return false;
    }
  }

  // In production, check for Vercel preview URLs if configured
  if (isProduction && process.env.ALLOW_VERCEL_PREVIEWS === 'true') {
    // Allow any *.vercel.app subdomain if any vercel.app domain is in allowed origins
    const vercelPattern = /^https:\/\/.*\.vercel\.app$/;
    if (vercelPattern.test(origin)) {
      // Check if any vercel.app domain is in allowed origins
      if (allowedOrigins.some(allowed => allowed.includes('.vercel.app'))) {
        return true;
      }
    }
  }

  return false;
};

/**
 * CORS configuration options
 */
const getCorsOptions = () => {
  const allowedOrigins = getAllowedOrigins();

  return {
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      // Note: When credentials: true, browser requests MUST have a valid origin
      // Non-browser requests (no origin) are allowed but won't send credentials
      if (!origin) {
        return callback(null, true);
      }

      // Check if origin is allowed
      // When credentials: true, we must validate specific origins (not wildcards)
      if (isOriginAllowed(origin, allowedOrigins)) {
        return callback(null, true);
      }

      // Log blocked origins in development for debugging
      if (isDevelopment) {
        console.warn(`⚠️  CORS blocked origin: ${origin}`);
        console.warn(`   Allowed origins: ${allowedOrigins.join(', ')}`);
      }

      // Reject origin
      callback(new Error(`Not allowed by CORS. Origin: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin'
    ],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    maxAge: 86400, // 24 hours - cache preflight requests
    optionsSuccessStatus: 200 // Some legacy browsers (IE11) choke on 204
  };
};

module.exports = {
  getCorsOptions,
  getAllowedOrigins,
  isOriginAllowed
};

