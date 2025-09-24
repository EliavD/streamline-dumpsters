/**
 * ================================================================================
 * SECURITY & VALIDATION SYSTEM
 * Streamline Dumpsters Ltd. - Client-Side Security Implementation
 * ================================================================================
 *
 * PURPOSE:
 * - Input validation and sanitization
 * - XSS prevention and CSRF protection
 * - Secure data handling and transmission
 * - Rate limiting and abuse prevention
 *
 * SECURITY PRINCIPLES:
 * - Never trust user input
 * - Validate on both client and server
 * - Sanitize all output
 * - Use HTTPS for all communications
 * - Implement proper CSRF protection
 *
 * DEPENDENCIES:
 * - config.js (for validation rules)
 * - errorHandler.js (for error management)
 *
 * USAGE:
 * const isValid = SecurityValidator.validateEmail(email);
 * const sanitized = SecurityValidator.sanitizeInput(userInput);
 *
 * ================================================================================
 */

/**
 * Comprehensive security validation system
 */
class SecurityValidator {
  /**
   * Validate email address
   * @param {string} email - Email to validate
   * @returns {Object} Validation result
   */
  static validateEmail(email) {
    const result = { isValid: false, errors: [] };

    if (!email || typeof email !== 'string') {
      result.errors.push('Email is required');
      return result;
    }

    const trimmed = email.trim();

    if (trimmed.length === 0) {
      result.errors.push('Email cannot be empty');
      return result;
    }

    if (trimmed.length > 254) {
      result.errors.push('Email is too long');
      return result;
    }

    // Use config validation pattern if available
    const emailPattern = window.CONFIG?.validation?.email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(trimmed)) {
      result.errors.push('Please enter a valid email address');
      return result;
    }

    result.isValid = true;
    result.value = trimmed.toLowerCase();
    return result;
  }

  /**
   * Validate phone number
   * @param {string} phone - Phone number to validate
   * @returns {Object} Validation result
   */
  static validatePhone(phone) {
    const result = { isValid: false, errors: [] };

    if (!phone || typeof phone !== 'string') {
      result.errors.push('Phone number is required');
      return result;
    }

    // Remove all non-digits
    const cleaned = phone.replace(/\D/g, '');

    if (cleaned.length < 10) {
      result.errors.push('Phone number must be at least 10 digits');
      return result;
    }

    if (cleaned.length > 15) {
      result.errors.push('Phone number is too long');
      return result;
    }

    // Use config validation pattern if available
    const phonePattern = window.CONFIG?.validation?.phone || /^[\+]?[1-9][\d]{0,15}$/;

    if (!phonePattern.test(cleaned)) {
      result.errors.push('Please enter a valid phone number');
      return result;
    }

    result.isValid = true;
    result.value = cleaned;
    result.formatted = this.formatPhone(cleaned);
    return result;
  }

  /**
   * Format phone number for display
   * @param {string} phone - Cleaned phone number
   * @returns {string} Formatted phone number
   */
  static formatPhone(phone) {
    if (phone.length === 10) {
      return `(${phone.slice(0, 3)}) ${phone.slice(3, 6)}-${phone.slice(6)}`;
    }
    if (phone.length === 11 && phone.startsWith('1')) {
      return `+1 (${phone.slice(1, 4)}) ${phone.slice(4, 7)}-${phone.slice(7)}`;
    }
    return phone;
  }

  /**
   * Validate address
   * @param {string} address - Address to validate
   * @returns {Object} Validation result
   */
  static validateAddress(address) {
    const result = { isValid: false, errors: [] };

    if (!address || typeof address !== 'string') {
      result.errors.push('Address is required');
      return result;
    }

    const trimmed = address.trim();
    const config = window.CONFIG?.validation?.address || { minLength: 10, maxLength: 200 };

    if (trimmed.length === 0) {
      result.errors.push('Address cannot be empty');
      return result;
    }

    if (trimmed.length < config.minLength) {
      result.errors.push(`Address must be at least ${config.minLength} characters`);
      return result;
    }

    if (trimmed.length > config.maxLength) {
      result.errors.push(`Address must be less than ${config.maxLength} characters`);
      return result;
    }

    // Basic format validation
    if (!/\d/.test(trimmed)) {
      result.errors.push('Address must include a street number');
      return result;
    }

    result.isValid = true;
    result.value = trimmed;
    return result;
  }

  /**
   * Validate ZIP code
   * @param {string} zipcode - ZIP code to validate
   * @returns {Object} Validation result
   */
  static validateZipCode(zipcode) {
    const result = { isValid: false, errors: [] };

    if (!zipcode || typeof zipcode !== 'string') {
      result.errors.push('ZIP code is required');
      return result;
    }

    const trimmed = zipcode.trim();

    // Use config validation pattern if available
    const zipcodePattern = window.CONFIG?.validation?.zipcode || /^\d{5}(-\d{4})?$/;

    if (!zipcodePattern.test(trimmed)) {
      result.errors.push('Please enter a valid ZIP code (12345 or 12345-6789)');
      return result;
    }

    result.isValid = true;
    result.value = trimmed;
    return result;
  }

  /**
   * Validate date input
   * @param {string|Date} date - Date to validate
   * @param {Object} options - Validation options
   * @returns {Object} Validation result
   */
  static validateDate(date, options = {}) {
    const result = { isValid: false, errors: [] };

    if (!date) {
      result.errors.push('Date is required');
      return result;
    }

    const dateObj = date instanceof Date ? date : new Date(date);

    if (isNaN(dateObj.getTime())) {
      result.errors.push('Please enter a valid date');
      return result;
    }

    const now = new Date();

    // Check minimum date (default: tomorrow)
    const minDate = options.minDate || new Date(now.getTime() + 24 * 60 * 60 * 1000);
    if (dateObj < minDate) {
      result.errors.push('Date must be at least 24 hours in advance');
      return result;
    }

    // Check maximum date (default: 1 year from now)
    const maxDate = options.maxDate || new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
    if (dateObj > maxDate) {
      result.errors.push('Date cannot be more than 1 year in advance');
      return result;
    }

    result.isValid = true;
    result.value = dateObj;
    return result;
  }

  /**
   * Sanitize text input to prevent XSS
   * @param {string} input - Input to sanitize
   * @returns {string} Sanitized input
   */
  static sanitizeInput(input) {
    if (!input || typeof input !== 'string') {
      return '';
    }

    return input
      .replace(/[<>\"']/g, function(match) {
        const escapeMap = {
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#x27;'
        };
        return escapeMap[match];
      })
      .trim();
  }

  /**
   * Validate file upload
   * @param {File} file - File to validate
   * @param {Object} options - Validation options
   * @returns {Object} Validation result
   */
  static validateFile(file, options = {}) {
    const result = { isValid: false, errors: [] };

    if (!file || !(file instanceof File)) {
      result.errors.push('Please select a valid file');
      return result;
    }

    const config = window.CONFIG?.validation?.images || {
      maxSize: 5 * 1024 * 1024,
      allowedTypes: ['image/jpeg', 'image/png', 'image/webp']
    };

    // Check file size
    if (file.size > (options.maxSize || config.maxSize)) {
      const maxSizeMB = (options.maxSize || config.maxSize) / (1024 * 1024);
      result.errors.push(`File size must be less than ${maxSizeMB}MB`);
      return result;
    }

    // Check file type
    const allowedTypes = options.allowedTypes || config.allowedTypes;
    if (!allowedTypes.includes(file.type)) {
      result.errors.push('File type not supported. Please use JPG, PNG, or WebP images.');
      return result;
    }

    // Check file name for suspicious content
    if (this.hasSuspiciousFileName(file.name)) {
      result.errors.push('Invalid file name');
      return result;
    }

    result.isValid = true;
    result.value = file;
    return result;
  }

  /**
   * Check for suspicious file names
   * @param {string} fileName - File name to check
   * @returns {boolean} True if suspicious
   */
  static hasSuspiciousFileName(fileName) {
    const suspiciousPatterns = [
      /\.php$/i,
      /\.asp$/i,
      /\.jsp$/i,
      /\.js$/i,
      /\.html$/i,
      /\.exe$/i,
      /\.bat$/i,
      /\.sh$/i,
      /[<>:"|?*]/,
      /^\./,
      /\.\./
    ];

    return suspiciousPatterns.some(pattern => pattern.test(fileName));
  }

  /**
   * Validate form data comprehensively
   * @param {Object} formData - Form data to validate
   * @param {Object} rules - Validation rules
   * @returns {Object} Validation result
   */
  static validateForm(formData, rules) {
    const result = { isValid: true, errors: {}, values: {} };

    for (const [field, value] of Object.entries(formData)) {
      const fieldRules = rules[field];
      if (!fieldRules) continue;

      let fieldResult = { isValid: true, errors: [] };

      // Apply validation rules
      if (fieldRules.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
        fieldResult.errors.push(`${fieldRules.label || field} is required`);
        fieldResult.isValid = false;
      }

      if (value && fieldRules.type) {
        switch (fieldRules.type) {
          case 'email':
            fieldResult = this.validateEmail(value);
            break;
          case 'phone':
            fieldResult = this.validatePhone(value);
            break;
          case 'address':
            fieldResult = this.validateAddress(value);
            break;
          case 'zipcode':
            fieldResult = this.validateZipCode(value);
            break;
          case 'date':
            fieldResult = this.validateDate(value, fieldRules.options);
            break;
          default:
            fieldResult.value = this.sanitizeInput(value);
        }
      }

      if (!fieldResult.isValid) {
        result.isValid = false;
        result.errors[field] = fieldResult.errors;
      } else {
        result.values[field] = fieldResult.value !== undefined ? fieldResult.value : value;
      }
    }

    return result;
  }
}

/**
 * CSRF protection utility
 */
class CSRFProtection {
  /**
   * Get CSRF token from meta tag or cookie
   * @returns {string|null} CSRF token
   */
  static getToken() {
    // Try meta tag first
    const metaToken = document.querySelector('meta[name="csrf-token"]');
    if (metaToken) {
      return metaToken.getAttribute('content');
    }

    // Try cookie
    const cookieToken = this.getCookie('csrf-token');
    if (cookieToken) {
      return cookieToken;
    }

    console.warn('CSRF token not found. Request may be rejected by server.');
    return null;
  }

  /**
   * Add CSRF token to request headers
   * @param {Object} headers - Request headers
   * @returns {Object} Headers with CSRF token
   */
  static addToHeaders(headers = {}) {
    const token = this.getToken();
    if (token) {
      headers['X-CSRF-Token'] = token;
    }
    return headers;
  }

  /**
   * Get cookie value by name
   * @param {string} name - Cookie name
   * @returns {string|null} Cookie value
   */
  static getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      return parts.pop().split(';').shift();
    }
    return null;
  }
}

/**
 * Rate limiting for client-side requests
 */
class RateLimiter {
  constructor() {
    this.requests = new Map();
    this.limits = window.CONFIG?.rateLimits || {
      api: { requestsPerMinute: 60, burstLimit: 10 },
      uploads: { requestsPerMinute: 10, maxConcurrent: 3 }
    };
  }

  /**
   * Check if request is allowed
   * @param {string} key - Rate limit key
   * @param {string} type - Request type (api, uploads)
   * @returns {boolean} True if allowed
   */
  isAllowed(key, type = 'api') {
    const now = Date.now();
    const limit = this.limits[type];

    if (!this.requests.has(key)) {
      this.requests.set(key, []);
    }

    const requests = this.requests.get(key);

    // Remove old requests (older than 1 minute)
    const oneMinuteAgo = now - 60000;
    const recentRequests = requests.filter(time => time > oneMinuteAgo);
    this.requests.set(key, recentRequests);

    // Check rate limit
    if (recentRequests.length >= limit.requestsPerMinute) {
      return false;
    }

    // Add current request
    recentRequests.push(now);
    return true;
  }

  /**
   * Get time until next allowed request
   * @param {string} key - Rate limit key
   * @param {string} type - Request type
   * @returns {number} Milliseconds until next allowed request
   */
  getRetryAfter(key, type = 'api') {
    const requests = this.requests.get(key);
    if (!requests || requests.length === 0) {
      return 0;
    }

    const oldestRequest = Math.min(...requests);
    const oneMinuteFromOldest = oldestRequest + 60000;
    return Math.max(0, oneMinuteFromOldest - Date.now());
  }
}

/**
 * Secure HTTP client with built-in protections
 */
class SecureHttpClient {
  constructor() {
    this.rateLimiter = new RateLimiter();
  }

  /**
   * Make secure HTTP request
   * @param {string} url - Request URL
   * @param {Object} options - Request options
   * @returns {Promise} Response promise
   */
  async request(url, options = {}) {
    // Rate limiting
    const rateLimitKey = options.rateLimitKey || url;
    if (!this.rateLimiter.isAllowed(rateLimitKey)) {
      const retryAfter = this.rateLimiter.getRetryAfter(rateLimitKey);
      throw new Error(`Rate limit exceeded. Try again in ${Math.ceil(retryAfter / 1000)} seconds.`);
    }

    // Prepare headers
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    // Add CSRF protection
    CSRFProtection.addToHeaders(headers);

    // Add security headers
    headers['X-Requested-With'] = 'XMLHttpRequest';

    // Configure request
    const requestConfig = {
      ...options,
      headers,
      credentials: 'same-origin', // Include cookies for CSRF
      timeout: window.CONFIG?.api?.timeout || 30000
    };

    // Make request
    try {
      const response = await fetch(url, requestConfig);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response;
    } catch (error) {
      // Log security-relevant errors
      if (error.message.includes('CORS') || error.message.includes('403')) {
        console.warn('Security error detected:', error.message);
      }
      throw error;
    }
  }

  /**
   * POST request with validation
   * @param {string} url - Request URL
   * @param {Object} data - Request data
   * @param {Object} options - Request options
   * @returns {Promise} Response promise
   */
  async post(url, data, options = {}) {
    return this.request(url, {
      method: 'POST',
      body: JSON.stringify(data),
      ...options
    });
  }

  /**
   * GET request
   * @param {string} url - Request URL
   * @param {Object} options - Request options
   * @returns {Promise} Response promise
   */
  async get(url, options = {}) {
    return this.request(url, {
      method: 'GET',
      ...options
    });
  }
}

// Create global instances
const secureHttpClient = new SecureHttpClient();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    SecurityValidator,
    CSRFProtection,
    RateLimiter,
    SecureHttpClient
  };
} else {
  window.SecurityValidator = SecurityValidator;
  window.CSRFProtection = CSRFProtection;
  window.RateLimiter = RateLimiter;
  window.SecureHttpClient = SecureHttpClient;
  window.secureHttpClient = secureHttpClient;
}

/**
 * ================================================================================
 * SECURITY USAGE EXAMPLES
 * ================================================================================
 *
 * // Form validation
 * const formData = {
 *   email: 'user@example.com',
 *   phone: '555-123-4567',
 *   address: '123 Main St, Dublin, OH'
 * };
 *
 * const rules = {
 *   email: { required: true, type: 'email', label: 'Email' },
 *   phone: { required: true, type: 'phone', label: 'Phone' },
 *   address: { required: true, type: 'address', label: 'Address' }
 * };
 *
 * const validation = SecurityValidator.validateForm(formData, rules);
 * if (!validation.isValid) {
 *   console.log('Validation errors:', validation.errors);
 * }
 *
 * // Secure API request
 * try {
 *   const response = await secureHttpClient.post('/api/booking', {
 *     customerEmail: validation.values.email,
 *     customerPhone: validation.values.phone,
 *     deliveryAddress: validation.values.address
 *   });
 *   const data = await response.json();
 * } catch (error) {
 *   console.error('Request failed:', error);
 * }
 *
 * ================================================================================
 */