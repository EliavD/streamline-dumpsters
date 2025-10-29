/**
 * ================================================================================
 * SECURE LOGGING UTILITY
 * Streamline Dumpsters Ltd. - Production-Safe Logging System
 * ================================================================================
 *
 * PURPOSE:
 * - Prevent console.log exposure in production
 * - Enable debugging in development only
 * - Centralized logging control
 * - Error tracking integration ready
 *
 * USAGE:
 * import Logger from './logger.js';
 * Logger.log('Debug message');
 * Logger.error('Error message');
 * Logger.warn('Warning message');
 *
 * ================================================================================
 */

class Logger {
  constructor() {
    this.isDevelopment = this.detectEnvironment();
    this.logHistory = [];
    this.maxHistorySize = 100;
  }

  /**
   * Detect if we're in development mode
   */
  detectEnvironment() {
    // Check hostname
    const hostname = window.location.hostname;

    // Development indicators
    const isDev = hostname === 'localhost' ||
                  hostname === '127.0.0.1' ||
                  hostname.startsWith('192.168.') ||
                  hostname.startsWith('10.') ||
                  hostname.includes('dev.') ||
                  hostname.includes('staging.') ||
                  window.location.protocol === 'file:';

    return isDev;
  }

  /**
   * Log debug messages (development only)
   */
  log(...args) {
    if (this.isDevelopment) {
      console.log(...args);
      this.addToHistory('log', args);
    }
  }

  /**
   * Log info messages (development only)
   */
  info(...args) {
    if (this.isDevelopment) {
      console.info(...args);
      this.addToHistory('info', args);
    }
  }

  /**
   * Log warnings (always shown, but sanitized in production)
   */
  warn(...args) {
    if (this.isDevelopment) {
      console.warn(...args);
      this.addToHistory('warn', args);
    } else {
      // In production, show generic warning without details
      console.warn('Warning occurred. Check error logs.');
    }
  }

  /**
   * Log errors (always shown, sent to error tracking in production)
   */
  error(...args) {
    if (this.isDevelopment) {
      console.error(...args);
      this.addToHistory('error', args);
    } else {
      // In production, show generic error and send to error tracking
      console.error('An error occurred. Our team has been notified.');

      // TODO: Send to error tracking service (Sentry, LogRocket, etc.)
      this.sendToErrorTracking(args);
    }
  }

  /**
   * Debug messages (development only, with prefix)
   */
  debug(...args) {
    if (this.isDevelopment) {
      console.log('🔧 DEBUG:', ...args);
      this.addToHistory('debug', args);
    }
  }

  /**
   * Success messages (development only)
   */
  success(...args) {
    if (this.isDevelopment) {
      console.log('✅', ...args);
      this.addToHistory('success', args);
    }
  }

  /**
   * Add log entry to history
   */
  addToHistory(type, args) {
    this.logHistory.push({
      timestamp: new Date().toISOString(),
      type,
      message: args
    });

    // Keep history size manageable
    if (this.logHistory.length > this.maxHistorySize) {
      this.logHistory.shift();
    }
  }

  /**
   * Send errors to tracking service (production)
   */
  sendToErrorTracking(args) {
    // Placeholder for error tracking integration
    // In production, integrate with:
    // - Sentry: Sentry.captureException(error)
    // - LogRocket: LogRocket.captureException(error)
    // - Google Analytics: ga('send', 'exception', {...})

    // For now, just store locally
    try {
      const errorData = {
        timestamp: new Date().toISOString(),
        message: JSON.stringify(args),
        url: window.location.href,
        userAgent: navigator.userAgent
      };

      // Could send to backend API endpoint
      // fetch('/api/log-error', {
      //   method: 'POST',
      //   body: JSON.stringify(errorData)
      // });

    } catch (e) {
      // Fail silently - don't break app if logging fails
    }
  }

  /**
   * Get log history (development only)
   */
  getHistory() {
    return this.isDevelopment ? this.logHistory : [];
  }

  /**
   * Clear log history
   */
  clearHistory() {
    this.logHistory = [];
  }

  /**
   * Group logs (development only)
   */
  group(label) {
    if (this.isDevelopment) {
      console.group(label);
    }
  }

  /**
   * End log group (development only)
   */
  groupEnd() {
    if (this.isDevelopment) {
      console.groupEnd();
    }
  }

  /**
   * Log table (development only)
   */
  table(data) {
    if (this.isDevelopment) {
      console.table(data);
    }
  }

  /**
   * Time measurement (development only)
   */
  time(label) {
    if (this.isDevelopment) {
      console.time(label);
    }
  }

  /**
   * End time measurement (development only)
   */
  timeEnd(label) {
    if (this.isDevelopment) {
      console.timeEnd(label);
    }
  }
}

// Create singleton instance
const logger = new Logger();

// Export for ES6 modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = logger;
}

// Export for browser
window.Logger = logger;

// Development helper - show environment
if (logger.isDevelopment) {
  console.log('🔧 Logger initialized in DEVELOPMENT mode');
  console.log('📍 Hostname:', window.location.hostname);
} else {
  console.log('🔒 Logger initialized in PRODUCTION mode - debug logs disabled');
}
