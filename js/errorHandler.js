/**
 * ================================================================================
 * UNIFIED ERROR HANDLING SYSTEM
 * Streamline Dumpsters Ltd. - Comprehensive API Error Management
 * ================================================================================
 *
 * PURPOSE:
 * - Centralized error handling for all API interactions
 * - User-friendly error messages with retry capabilities
 * - Comprehensive logging and debugging support
 * - Graceful degradation and fallback mechanisms
 *
 * FEATURES:
 * - Automatic error classification and handling
 * - Retry mechanisms with exponential backoff
 * - User notification system integration
 * - Security-focused error sanitization
 *
 * DEPENDENCIES:
 * - config.js (for environment settings)
 *
 * USAGE:
 * const result = APIErrorHandler.handle(error, 'payment processing', retryFn);
 * UserNotification.show(result.message, result.type);
 *
 * ================================================================================
 */

/**
 * Main error handling class with comprehensive error management
 */
class APIErrorHandler {
  /**
   * Handle API errors with context and retry capabilities
   * @param {Error|Object} error - The error object or response
   * @param {string} context - Context where error occurred
   * @param {Function} retryFunction - Optional retry function
   * @param {Object} options - Additional options
   * @returns {Object} Formatted error response
   */
  static handle(error, context, retryFunction = null, options = {}) {
    const errorInfo = this.classifyError(error);
    const sanitizedError = this.sanitizeError(errorInfo, context);

    // Log error based on environment
    this.logError(sanitizedError, context, options);

    // Determine user-friendly message
    const userMessage = this.getUserMessage(errorInfo, context);

    // Check if retry is possible
    const canRetry = this.canRetry(errorInfo, options.retryAttempt || 0);

    return {
      success: false,
      error: {
        type: errorInfo.type,
        code: errorInfo.code,
        message: userMessage,
        canRetry: canRetry && retryFunction !== null,
        retryFunction: canRetry ? retryFunction : null,
        context: context,
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * Classify error into specific types for handling
   * @param {Error|Object} error - The error to classify
   * @returns {Object} Classified error information
   */
  static classifyError(error) {
    // Network errors
    if (error.name === 'NetworkError' || !navigator.onLine) {
      return { type: 'network', code: 'NETWORK_ERROR', severity: 'high' };
    }

    // Timeout errors
    if (error.name === 'TimeoutError' || error.code === 'TIMEOUT') {
      return { type: 'timeout', code: 'TIMEOUT_ERROR', severity: 'medium' };
    }

    // HTTP response errors
    if (error.response) {
      const status = error.response.status;

      if (status === 400) {
        return { type: 'validation', code: 'VALIDATION_ERROR', severity: 'low', details: error.response.data };
      }
      if (status === 401) {
        return { type: 'auth', code: 'AUTH_ERROR', severity: 'high' };
      }
      if (status === 403) {
        return { type: 'permission', code: 'PERMISSION_ERROR', severity: 'high' };
      }
      if (status === 404) {
        return { type: 'notFound', code: 'NOT_FOUND_ERROR', severity: 'medium' };
      }
      if (status === 429) {
        return { type: 'rateLimit', code: 'RATE_LIMIT_ERROR', severity: 'medium' };
      }
      if (status >= 500) {
        return { type: 'server', code: 'SERVER_ERROR', severity: 'high' };
      }
    }

    // Payment-specific errors
    if (error.type === 'card_error' || error.code?.includes('CARD')) {
      return { type: 'payment', code: 'PAYMENT_ERROR', severity: 'medium', details: error };
    }

    // Upload errors
    if (error.type === 'upload_error' || error.code?.includes('UPLOAD')) {
      return { type: 'upload', code: 'UPLOAD_ERROR', severity: 'low', details: error };
    }

    // Validation errors
    if (error.type === 'validation_error' || error.name === 'ValidationError') {
      return { type: 'validation', code: 'VALIDATION_ERROR', severity: 'low', details: error };
    }

    // Default classification
    return { type: 'unknown', code: 'UNKNOWN_ERROR', severity: 'medium', originalError: error };
  }

  /**
   * Get user-friendly error messages
   * @param {Object} errorInfo - Classified error information
   * @param {string} context - Error context
   * @returns {string} User-friendly message
   */
  static getUserMessage(errorInfo, context) {
    const messages = {
      network: 'Unable to connect to our servers. Please check your internet connection and try again.',
      timeout: 'The request is taking longer than expected. Please try again.',
      rateLimit: 'Too many requests. Please wait a moment before trying again.',
      validation: 'Please check your information and correct any errors highlighted above.',
      auth: 'Session expired. Please refresh the page and try again.',
      permission: 'You don\'t have permission to perform this action.',
      notFound: 'The requested resource was not found. Please try again.',
      server: 'Our servers are experiencing issues. Please try again in a few minutes.',
      payment: 'Payment processing failed. Please check your payment information or try a different payment method.',
      upload: 'File upload failed. Please try again with a smaller file or check your internet connection.',
      unknown: 'An unexpected error occurred. Please try again or contact us if the problem persists.'
    };

    // Context-specific messages
    const contextMessages = {
      'booking submission': {
        validation: 'Please check your booking details and try again.',
        payment: 'Payment processing failed. Your booking was not completed.',
        server: 'Booking system is temporarily unavailable. Please try again shortly.'
      },
      'file upload': {
        upload: 'Photo upload failed. Please try with a smaller image or check your connection.',
        validation: 'Invalid file type. Please upload JPG, PNG, or WebP images only.'
      },
      'contact form': {
        validation: 'Please fill in all required fields correctly.',
        server: 'Message could not be sent. Please try again or call us directly.'
      }
    };

    // Check for context-specific message first
    if (contextMessages[context] && contextMessages[context][errorInfo.type]) {
      return contextMessages[context][errorInfo.type];
    }

    return messages[errorInfo.type] || messages.unknown;
  }

  /**
   * Determine if an error can be retried
   * @param {Object} errorInfo - Classified error information
   * @param {number} retryAttempt - Current retry attempt number
   * @returns {boolean} Whether retry is possible
   */
  static canRetry(errorInfo, retryAttempt = 0) {
    const maxRetries = 3;

    if (retryAttempt >= maxRetries) {
      return false;
    }

    const retryableTypes = ['network', 'timeout', 'rateLimit', 'server'];
    return retryableTypes.includes(errorInfo.type);
  }

  /**
   * Sanitize error for logging (remove sensitive information)
   * @param {Object} errorInfo - Error information
   * @param {string} context - Error context
   * @returns {Object} Sanitized error
   */
  static sanitizeError(errorInfo, context) {
    const sanitized = { ...errorInfo };

    // Remove sensitive information
    if (sanitized.details) {
      const sensitiveFields = ['password', 'token', 'key', 'secret', 'card'];
      sensitiveFields.forEach(field => {
        if (sanitized.details[field]) {
          sanitized.details[field] = '[REDACTED]';
        }
      });
    }

    return sanitized;
  }

  /**
   * Log error based on environment and severity
   * @param {Object} errorInfo - Sanitized error information
   * @param {string} context - Error context
   * @param {Object} options - Logging options
   */
  static logError(errorInfo, context, options = {}) {
    const logData = {
      timestamp: new Date().toISOString(),
      context: context,
      type: errorInfo.type,
      code: errorInfo.code,
      severity: errorInfo.severity,
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: options.userId || null
    };

    // Console logging in development
    if (window.CONFIG && window.CONFIG.debug.enableLogging) {
      console.group(`🚨 API Error: ${context}`);
      console.error('Error Info:', errorInfo);
      console.log('Log Data:', logData);
      console.groupEnd();
    }

    // Send to monitoring service in production
    if (window.CONFIG && window.CONFIG.isProduction && errorInfo.severity === 'high') {
      this.sendToMonitoring(logData, errorInfo);
    }
  }

  /**
   * Send error to monitoring service (implementation depends on service)
   * @param {Object} logData - Log data
   * @param {Object} errorInfo - Error information
   */
  static sendToMonitoring(logData, errorInfo) {
    // Example implementation - replace with actual monitoring service
    try {
      fetch('/api/errors/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...logData,
          error: errorInfo
        })
      }).catch(() => {
        // Silently fail monitoring to prevent error loops
      });
    } catch (error) {
      // Silently fail monitoring
    }
  }

  /**
   * Create retry function with exponential backoff
   * @param {Function} originalFunction - Function to retry
   * @param {number} attempt - Current attempt number
   * @returns {Function} Retry function
   */
  static createRetryFunction(originalFunction, attempt = 0) {
    return async () => {
      const delay = Math.min(1000 * Math.pow(2, attempt), 10000); // Max 10 second delay

      if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      return originalFunction();
    };
  }
}

/**
 * User notification system for displaying errors
 */
class UserNotification {
  /**
   * Show notification to user
   * @param {string} message - Message to display
   * @param {string} type - Notification type (error, success, warning, info)
   * @param {Object} options - Additional options
   */
  static show(message, type = 'error', options = {}) {
    const notification = this.create(message, type, options);
    this.display(notification);

    // Auto-remove after delay
    if (options.autoRemove !== false) {
      setTimeout(() => {
        this.remove(notification);
      }, options.duration || 5000);
    }

    return notification;
  }

  /**
   * Create notification element
   * @param {string} message - Message text
   * @param {string} type - Notification type
   * @param {Object} options - Additional options
   * @returns {HTMLElement} Notification element
   */
  static create(message, type, options) {
    const notification = document.createElement('div');
    notification.className = `notification notification--${type}`;
    notification.setAttribute('role', 'alert');
    notification.setAttribute('aria-live', 'polite');

    const content = `
      <div class="notification__content">
        <span class="notification__icon">${this.getIcon(type)}</span>
        <span class="notification__message">${message}</span>
        ${options.canRetry ? '<button class="notification__retry btn btn--outline btn--sm">Try Again</button>' : ''}
        <button class="notification__close" aria-label="Close notification">×</button>
      </div>
    `;

    notification.innerHTML = content;

    // Add event listeners
    const closeBtn = notification.querySelector('.notification__close');
    closeBtn.addEventListener('click', () => this.remove(notification));

    if (options.retryFunction) {
      const retryBtn = notification.querySelector('.notification__retry');
      if (retryBtn) {
        retryBtn.addEventListener('click', () => {
          this.remove(notification);
          options.retryFunction();
        });
      }
    }

    return notification;
  }

  /**
   * Display notification on page
   * @param {HTMLElement} notification - Notification element
   */
  static display(notification) {
    let container = document.querySelector('.notification-container');

    if (!container) {
      container = document.createElement('div');
      container.className = 'notification-container';
      document.body.appendChild(container);
    }

    container.appendChild(notification);

    // Animate in
    requestAnimationFrame(() => {
      notification.classList.add('notification--visible');
    });
  }

  /**
   * Remove notification
   * @param {HTMLElement} notification - Notification element
   */
  static remove(notification) {
    notification.classList.add('notification--removing');

    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }

  /**
   * Get icon for notification type
   * @param {string} type - Notification type
   * @returns {string} Icon HTML
   */
  static getIcon(type) {
    const icons = {
      error: '⚠️',
      success: '✅',
      warning: '⚠️',
      info: 'ℹ️'
    };

    return icons[type] || icons.info;
  }
}

/**
 * Network status monitoring
 */
class NetworkMonitor {
  static init() {
    window.addEventListener('online', () => {
      UserNotification.show('Connection restored', 'success', { duration: 3000 });
    });

    window.addEventListener('offline', () => {
      UserNotification.show('Connection lost. Some features may not work.', 'warning', { autoRemove: false });
    });
  }

  static isOnline() {
    return navigator.onLine;
  }
}

// Initialize network monitoring
if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    NetworkMonitor.init();
  });
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { APIErrorHandler, UserNotification, NetworkMonitor };
} else {
  window.APIErrorHandler = APIErrorHandler;
  window.UserNotification = UserNotification;
  window.NetworkMonitor = NetworkMonitor;
}

/**
 * ================================================================================
 * ERROR HANDLING USAGE EXAMPLES
 * ================================================================================
 *
 * // Basic error handling
 * try {
 *   const response = await fetch('/api/booking');
 * } catch (error) {
 *   const result = APIErrorHandler.handle(error, 'booking submission', () => retryBooking());
 *   UserNotification.show(result.error.message, 'error', {
 *     canRetry: result.error.canRetry,
 *     retryFunction: result.error.retryFunction
 *   });
 * }
 *
 * // With retry mechanism
 * async function submitBookingWithRetry(attempt = 0) {
 *   try {
 *     return await submitBooking();
 *   } catch (error) {
 *     const retryFn = APIErrorHandler.createRetryFunction(() => submitBookingWithRetry(attempt + 1), attempt);
 *     const result = APIErrorHandler.handle(error, 'booking submission', retryFn, { retryAttempt: attempt });
 *
 *     if (result.error.canRetry) {
 *       UserNotification.show(result.error.message, 'error', {
 *         canRetry: true,
 *         retryFunction: result.error.retryFunction
 *       });
 *     } else {
 *       UserNotification.show(result.error.message, 'error');
 *     }
 *   }
 * }
 *
 * ================================================================================
 */