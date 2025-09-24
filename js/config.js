/**
 * ================================================================================
 * API CONFIGURATION & ENVIRONMENT MANAGEMENT
 * Streamline Dumpsters Ltd. - Secure Configuration System
 * ================================================================================
 *
 * PURPOSE:
 * - Centralized environment-aware configuration management
 * - Secure API credential handling with proper separation
 * - Third-party service integration setup
 * - Environment detection and switching
 *
 * SECURITY NOTES:
 * - Never expose production API tokens in client-side code
 * - Use server-side proxy for sensitive API calls
 * - All sensitive operations should go through backend endpoints
 * - Client-side tokens should be public/sandbox keys only
 *
 * DEPENDENCIES:
 * - None (standalone configuration module)
 *
 * USAGE:
 * import CONFIG from './config.js';
 * console.log(CONFIG.square.appId); // Current environment's Square app ID
 *
 * ================================================================================
 */

// Environment configuration with proper separation
const ENV_CONFIG = {
  development: {
    // Square Payment Integration (Sandbox)
    square: {
      appId: 'sandbox-sq0idb-DEVELOPMENT_APP_ID', // Replace with actual sandbox app ID
      locationId: 'DEVELOPMENT_LOCATION_ID', // Replace with actual sandbox location ID
      environment: 'sandbox'
    },

    // Airtable Database Integration
    airtable: {
      baseId: 'appVWTrDeIEKyRP47', // Your actual development base ID
      apiToken: 'patHviyzeY7J0TaHh', // Your actual development token
      rateLimitDelay: 200 // Milliseconds between requests
    },

    // Cloudinary Image Upload
    cloudinary: {
      cloudName: 'PLACEHOLDER_CLOUD_NAME', // Replace with actual cloud name
      uploadPreset: 'PLACEHOLDER_PRESET' // Unsigned upload preset for public uploads
    },

    // Google Calendar Integration
    googleCalendar: {
      calendarId: 'PLACEHOLDER_CALENDAR_ID@group.calendar.google.com' // Development calendar
    },

    // API Base URLs
    api: {
      baseUrl: 'http://localhost:3000/api',
      timeout: 30000 // 30 second timeout
    },

    // Feature Flags
    features: {
      realTimeBooking: true,
      photoUpload: true,
      smsNotifications: false, // Disabled in development
      emailNotifications: true
    },

    // Debug Settings
    debug: {
      enableLogging: true,
      mockPayments: true,
      skipValidation: false
    }
  },

  production: {
    // Square Payment Integration (Production)
    square: {
      appId: 'PRODUCTION_APP_ID', // Replace with actual production app ID
      locationId: 'PRODUCTION_LOCATION_ID', // Replace with actual production location ID
      environment: 'production'
    },

    // Airtable Database Integration
    airtable: {
      baseId: 'appVWTrDeIEKyRP47', // Your actual production base ID
      apiToken: 'patHviyzeY7J0TaHh', // Your actual production token (consider server-side proxy for security)
      rateLimitDelay: 200
    },

    // Cloudinary Image Upload
    cloudinary: {
      cloudName: 'PRODUCTION_CLOUD_NAME', // Replace with actual cloud name
      uploadPreset: 'PRODUCTION_PRESET' // Production upload preset
    },

    // Google Calendar Integration
    googleCalendar: {
      calendarId: 'PRODUCTION_CALENDAR_ID@group.calendar.google.com' // Production calendar
    },

    // API Base URLs
    api: {
      baseUrl: 'https://api.streamlinedumpsters.com/api', // Replace with actual domain
      timeout: 30000
    },

    // Feature Flags
    features: {
      realTimeBooking: true,
      photoUpload: true,
      smsNotifications: true,
      emailNotifications: true
    },

    // Debug Settings
    debug: {
      enableLogging: false,
      mockPayments: false,
      skipValidation: false
    }
  }
};

// Environment detection with fallbacks
function detectEnvironment() {
  // Check for explicit environment variable
  if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV) {
    return process.env.NODE_ENV === 'production' ? 'production' : 'development';
  }

  // Check hostname and protocol
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;

  // Development indicators
  const isDevelopment = hostname === 'localhost' ||
                       hostname === '127.0.0.1' ||
                       hostname.startsWith('192.168.') ||
                       hostname.includes('dev.') ||
                       hostname.includes('staging.') ||
                       protocol === 'file:';

  if (isDevelopment) {
    console.warn('🏠 Running in development mode - CORS issues may occur');
    console.warn('💡 If you see CORS errors, add headers to your Google Apps Script');
    console.warn('📍 Current origin:', window.location.origin);
    return 'development';
  }

  // Production by default
  return 'production';
}

// Current environment and configuration
const CURRENT_ENV = detectEnvironment();
const CONFIG = ENV_CONFIG[CURRENT_ENV];

// Add environment info to config
CONFIG.environment = CURRENT_ENV;
CONFIG.isDevelopment = CURRENT_ENV === 'development';
CONFIG.isProduction = CURRENT_ENV === 'production';

// Backend API endpoints (server-side implementation required)
CONFIG.endpoints = {
  // Booking system
  booking: {
    create: `${CONFIG.api.baseUrl}/bookings`,
    update: `${CONFIG.api.baseUrl}/bookings/:id`,
    get: `${CONFIG.api.baseUrl}/bookings/:id`,
    list: `${CONFIG.api.baseUrl}/bookings`,
    cancel: `${CONFIG.api.baseUrl}/bookings/:id/cancel`
  },

  // Junk removal quotes
  junkRemoval: {
    quote: `${CONFIG.api.baseUrl}/junk-removal/quote`,
    upload: `${CONFIG.api.baseUrl}/junk-removal/upload`,
    submit: `${CONFIG.api.baseUrl}/junk-removal/submit`
  },

  // Contact and communication
  contact: {
    submit: `${CONFIG.api.baseUrl}/contact`,
    subscribe: `${CONFIG.api.baseUrl}/newsletter/subscribe`
  },

  // Availability and scheduling
  availability: {
    check: `${CONFIG.api.baseUrl}/availability/check`,
    slots: `${CONFIG.api.baseUrl}/availability/slots`
  },

  // Payment processing
  payment: {
    process: `${CONFIG.api.baseUrl}/payments/process`,
    verify: `${CONFIG.api.baseUrl}/payments/verify`,
    refund: `${CONFIG.api.baseUrl}/payments/refund`
  }
};

// Service pricing configuration
CONFIG.pricing = {
  dumpster: {
    size14Yard: {
      basePrice: 299,
      currency: 'USD',
      duration: 3, // days
      description: '14-yard dumpster rental for 3 days'
    }
  },
  junkRemoval: {
    minimum: 75,
    currency: 'USD',
    description: 'Custom quote based on items and volume'
  }
};

// Booking Configuration for Modal System
CONFIG.booking = {
  // Google Apps Script Backend URL
  GAS_WEB_APP_URL: 'https://script.google.com/macros/s/AKfycby1dsj4lzLMRPvnWdQwb8zHo0RC48-pABdVlbEsvAJsRUXCm0zdDoa5btwd1x1Ku99J7Q/exec',

  // Booking Constraints
  BOOKING_PRICE: 299,
  MIN_RENTAL_DAYS: 1,
  MAX_ADVANCE_DAYS: 90,

  // Available Delivery Time Slots
  TIME_SLOTS: [
    {value: "07:00-09:00", label: "7:00 AM - 9:00 AM"},
    {value: "09:00-11:00", label: "9:00 AM - 11:00 AM"},
    {value: "11:00-13:00", label: "11:00 AM - 1:00 PM"},
    {value: "13:00-15:00", label: "1:00 PM - 3:00 PM"},
    {value: "15:00-17:00", label: "3:00 PM - 5:00 PM"},
    {value: "17:00-19:00", label: "5:00 PM - 7:00 PM"},
    {value: "19:00-21:00", label: "7:00 PM - 9:00 PM"}
  ],

  // Form Validation Patterns
  VALIDATION_PATTERNS: {
    PHONE: /^\(\d{3}\)\s\d{3}-\d{4}$/,
    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    NAME_MIN_LENGTH: 2,
    NAME_MAX_LENGTH: 50
  }
};

// Junk Removal Configuration for Modal System
CONFIG.junkRemoval = {
  // Enhanced Airtable Database Integration for Testing
  AIRTABLE_BASE_ID: 'appVWTrDeIEKyRP47', // Your actual Airtable base ID
  AIRTABLE_TABLE_NAME: 'Junk Removal Requests',
  AIRTABLE_API_KEY: 'patHviyzeY7J0TaHh', // Your actual Airtable personal access token
  AIRTABLE_API_URL: 'https://api.airtable.com/v0',

  // Airtable Field Mapping (matching your actual table structure)
  AIRTABLE_FIELDS: {
    name: 'Name',                    // Single line text
    email: 'email',                  // Email field type
    phone: 'Phone number',           // Phone number field type
    address: 'Address',              // Single line text (combined address)
    photos: 'Photos'                 // Attachment field
    // Note: No separate city, zip, description, submissionDate, or status fields
  },

  // Photo Upload Constraints
  MAX_PHOTOS: 5,
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB per file
  ALLOWED_FILE_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],

  // Form Validation Rules
  VALIDATION_PATTERNS: {
    PHONE: /^\(\d{3}\)\s\d{3}-\d{4}$/,
    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    NAME_MIN_LENGTH: 2,
    NAME_MAX_LENGTH: 50,
    ADDRESS_MIN_LENGTH: 5,
    ADDRESS_MAX_LENGTH: 100,
    DESCRIPTION_MAX_LENGTH: 500
  },

  // API Endpoints
  ENDPOINTS: {
    SUBMIT_REQUEST: `${CONFIG.api.baseUrl}/junk-removal/submit`,
    UPLOAD_PHOTOS: `${CONFIG.api.baseUrl}/junk-removal/upload`
  },

  // UI Configuration
  UI: {
    DROPZONE_HEIGHT: '120px',
    PREVIEW_SIZE: '100px',
    ANIMATION_DURATION: 300
  },

  // Debug and Testing Configuration
  DEBUG: {
    ENABLE_CONSOLE_LOGGING: true,
    ENABLE_NETWORK_MONITORING: true,
    ENABLE_FORM_STATE_TRACKING: true,
    SIMULATE_API_DELAYS: false,
    MOCK_AIRTABLE_RESPONSES: false,
    LOG_LEVEL: 'verbose' // 'minimal', 'normal', 'verbose'
  }
};

// Business configuration
CONFIG.business = {
  name: 'Streamline Dumpsters Ltd.',
  location: 'Dublin, Ohio',
  serviceArea: {
    primary: 'Dublin, OH',
    radius: 25, // miles
    zipcodes: ['43016', '43017', '43026', '43035'] // Primary service areas
  },
  hours: {
    monday: '7:00 AM - 6:00 PM',
    tuesday: '7:00 AM - 6:00 PM',
    wednesday: '7:00 AM - 6:00 PM',
    thursday: '7:00 AM - 6:00 PM',
    friday: '7:00 AM - 6:00 PM',
    saturday: '8:00 AM - 4:00 PM',
    sunday: 'Emergency service only'
  }
};

// Validation rules
CONFIG.validation = {
  phone: /^[\+]?[1-9][\d]{0,15}$/,
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  zipcode: /^\d{5}(-\d{4})?$/,
  address: {
    minLength: 10,
    maxLength: 200
  },
  images: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    maxFiles: 10
  }
};

// Rate limiting configuration
CONFIG.rateLimits = {
  api: {
    requestsPerMinute: 60,
    burstLimit: 10
  },
  uploads: {
    requestsPerMinute: 10,
    maxConcurrent: 3
  }
};

// Export configuration
if (typeof module !== 'undefined' && module.exports) {
  // Node.js environment
  module.exports = CONFIG;
} else {
  // Browser environment
  window.CONFIG = CONFIG;
}

// Development logging
if (CONFIG.debug.enableLogging) {
  console.log('🔧 Configuration loaded:', {
    environment: CURRENT_ENV,
    api: CONFIG.api.baseUrl,
    features: CONFIG.features,
    debug: CONFIG.debug
  });
}

/**
 * ================================================================================
 * CONFIGURATION USAGE EXAMPLES
 * ================================================================================
 *
 * // Check environment
 * if (CONFIG.isDevelopment) {
 *   console.log('Running in development mode');
 * }
 *
 * // Access API endpoints
 * const bookingUrl = CONFIG.endpoints.booking.create;
 *
 * // Use feature flags
 * if (CONFIG.features.photoUpload) {
 *   // Enable photo upload functionality
 * }
 *
 * // Environment-specific behavior
 * const squareAppId = CONFIG.square.appId;
 * const environment = CONFIG.square.environment; // 'sandbox' or 'production'
 *
 * ================================================================================
 */