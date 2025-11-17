// Production mode - console logging disabled
const DEV_MODE = false;
const devLog = () => {};
const devError = () => {};
const devWarn = () => {};
/*
================================================================================
BOOKNOW.JS - Streamline Dumpsters Ltd. Booking Modal System - Phase 3
================================================================================

PURPOSE:
Phase 3 implementation with comprehensive backend integration, availability checking,
and real-time data validation for the 14-yard dumpster rental service.

FUNCTIONALITY:
- Complete Google Apps Script backend integration
- Real-time availability checking with debouncing
- Comprehensive error handling and retry logic
- Date validation and constraint management
- Loading states and user feedback
- Network error recovery
- Booking data preparation and sanitization

BACKEND INTEGRATION:
- BookingAPI class for all backend communication
- DateManager for date handling and validation
- AvailabilityChecker for real-time availability
- ErrorHandler for comprehensive error management
- BookingDataManager for data preparation

ACCESSIBILITY:
- Maintained focus trapping and ARIA support
- Enhanced error messaging for screen readers
- Loading state announcements
- Status updates via aria-live regions

PHASE 3 SCOPE:
- Google Apps Script connectivity
- Fully booked dates fetching
- Real-time availability checking
- Error handling and retry logic
- Date validation and constraints
- User feedback and loading states

DEPENDENCIES:
- config.js for booking configuration
- Modal HTML structure with availability status elements
- CSS styling for error states and loading indicators

FUTURE PHASES:
- Phase 4: Form validation and user feedback
- Phase 5: Payment processing integration

================================================================================
*/

/**
 * BookingAPI Class - Handles all backend communication
 */
class BookingAPI {
  constructor(baseURL) {
    this.baseURL = baseURL;
    this.requestTimeout = 15000; // 15 seconds (Google Apps Script can be slow)
  }

  /**
   * Test API connectivity and CORS configuration
   */
  async testAPIConnectivity() {
    devLog('🔧 Testing API connectivity...');

    try {
      // Test basic connectivity
      const response = await fetch(this.baseURL, {
        method: 'GET',
        mode: 'cors' // Explicitly request CORS
      });

      devLog('Response status:', response.status);
      devLog('Response headers:', [...response.headers.entries()]);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      devLog('✅ API connectivity test passed:', data);
      return true;

    } catch (error) {
      devError('❌ API connectivity test failed:', error);

      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        devError('🌐 CORS Error: The server is blocking cross-origin requests');
        devError('💡 This is common in local development');
      }

      return false;
    }
  }

  /**
   * Generic fetch wrapper with error handling and timeout
   */
  async makeRequest(url, options = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.requestTimeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;

    } catch (error) {
      clearTimeout(timeoutId);

      if (error.name === 'AbortError') {
        throw new Error('Request timed out. Please check your connection and try again.');
      }

      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error. Please check your connection and try again.');
      }

      throw error;
    }
  }

  /**
   * Get fully booked dates from backend
   */
  async getFullyBookedDates() {
    devLog('🔍 Attempting to fetch fully booked dates from:', this.baseURL);

    try {
      const url = `${this.baseURL}?action=getFullyBooked`;
      devLog('📡 Full request URL:', url);

      const response = await this.makeRequest(url);
      devLog('✅ Successfully fetched fully booked dates:', response);

      if (response.status === 'ok') {
        const dates = response.fullyBookedDates || [];
        devLog(`📅 Found ${dates.length} fully booked dates:`, dates);
        return dates;
      } else {
        devError('❌ API returned error status:', response);
        throw new Error(response.message || 'Failed to fetch fully booked dates');
      }
    } catch (error) {
      devError('🚨 Detailed error information:');
      devError('Error name:', error.name);
      devError('Error message:', error.message);
      devError('Error stack:', error.stack);

      // Check if it's a CORS error
      if (error.message.includes('CORS') || error.message.includes('fetch') || error.name === 'TypeError') {
        devError('🌐 This appears to be a CORS (Cross-Origin) error');
        devError('💡 Solution: Add CORS headers to your Google Apps Script');
        devError('📍 Current origin:', window.location.origin);
        devError('📍 Target URL:', this.baseURL);
      }

      throw new Error('Unable to check date availability. Please try again.');
    }
  }

  /**
   * Check availability for specific date range
   */
  async checkAvailability(startDate, endDate) {
    const url = `${this.baseURL}?action=checkAvailability&start=${startDate}&end=${endDate}`;

    try {
      devLog('🔍 Checking availability:', {startDate, endDate, url});
      const response = await this.makeRequest(url);
      devLog('✅ Availability check response:', response);

      if (response.status === 'ok') {
        return {
          available: response.overlapping < 3,
          overlapping: response.overlapping,
          message: this.getAvailabilityMessage(response.overlapping)
        };
      } else {
        throw new Error(response.message || 'Failed to check availability');
      }
    } catch (error) {
      devError('❌ Error checking availability:', error);
      // For now, assume availability is okay to allow booking to proceed
      devWarn('⚠️ Skipping availability check - assuming dates are available');
      return {
        available: true,
        overlapping: 0,
        message: 'Availability check skipped - proceeding with booking'
      };
    }
  }

  /**
   * Create booking (after payment)
   */
  async createBooking(bookingData) {
    try {
      console.log('🔍 DEBUG: ===== SUBMITTING TO GOOGLE APPS SCRIPT =====');
      console.log('🔍 Apps Script URL:', this.baseURL);
      console.log('🔍 Booking data:', bookingData);
      devLog('📤 Submitting booking to Google Apps Script:', bookingData);

      // Google Apps Script requires redirect: 'follow' to work properly
      console.log('🔍 DEBUG: Sending POST request...');
      const response = await fetch(this.baseURL, {
        method: 'POST',
        redirect: 'follow',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8', // Use text/plain for GAS compatibility
        },
        body: JSON.stringify(bookingData)
      });

      console.log('🔍 DEBUG: Response received');
      console.log('📥 Response status:', response.status);
      console.log('📥 Response ok:', response.ok);
      devLog('📥 Response status:', response.status);

      // Try to parse the response
      const result = await response.text();
      console.log('🔍 DEBUG: Raw response text:', result);
      devLog('📥 Response text:', result);

      let parsedResult;
      try {
        console.log('🔍 DEBUG: Parsing JSON response...');
        parsedResult = JSON.parse(result);
        console.log('🔍 DEBUG: Parsed result:', parsedResult);
        console.log('🔍 Result status:', parsedResult.status);
        console.log('🔍 Payment ID from Apps Script:', parsedResult.payment_id);
        console.log('🔍 Booking ID from Apps Script:', parsedResult.booking_id);

        if (parsedResult.error) {
          console.error('❌ Apps Script ERROR:', parsedResult.error);
        }
      } catch (e) {
        console.error('❌ Failed to parse JSON response:', e);
        // If not JSON, treat as success if status is ok
        if (response.ok) {
          devLog('✅ Booking submitted successfully (non-JSON response)');
          return { status: 'booked' };
        }
        throw new Error('Invalid response from server');
      }

      console.log('✅ Booking submitted successfully to Apps Script');
      devLog('✅ Booking submitted successfully:', parsedResult);
      return parsedResult;

    } catch (error) {
      devError('❌ Error creating booking:', error);
      throw new Error('Unable to complete booking. Please try again.');
    }
  }

  /**
   * Generate availability message based on overlapping count
   */
  getAvailabilityMessage(overlapping) {
    if (overlapping === 0) {
      return 'Fully available - no existing bookings';
    } else if (overlapping === 1) {
      return 'Good availability - 1 of 3 slots taken';
    } else if (overlapping === 2) {
      return 'Limited availability - 2 of 3 slots taken';
    } else {
      return 'Fully booked - no slots available';
    }
  }
}

/**
 * DateManager Class - Handles date validation and constraints
 */
class DateManager {
  constructor() {
    this.fullyBookedDates = new Set();
    this.minRentalDays = window.CONFIG?.booking?.MIN_RENTAL_DAYS || 3;
    this.maxAdvanceDays = window.CONFIG?.booking?.MAX_ADVANCE_DAYS || 90;
  }

  /**
   * Get today's date in YYYY-MM-DD format
   */
  getTodayString() {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  /**
   * Get date string for X days from today
   */
  getDateString(daysFromToday) {
    const date = new Date();
    date.setDate(date.getDate() + daysFromToday);
    return date.toISOString().split('T')[0];
  }

  /**
   * Check if date is a weekend (optional business rule)
   */
  isWeekend(dateString) {
    const date = new Date(dateString + 'T00:00:00');
    const dayOfWeek = date.getDay();
    return dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday
  }

  /**
   * Set fully booked dates and update date inputs
   */
  setFullyBookedDates(dates) {
    this.fullyBookedDates = new Set(dates);
    this.updateDateInputConstraints();
  }

  /**
   * Check if a date is fully booked
   */
  isDateFullyBooked(dateString) {
    return this.fullyBookedDates.has(dateString);
  }

  /**
   * Update min/max constraints on date inputs
   */
  updateDateInputConstraints() {
    const deliveryInput = document.getElementById('deliveryDate');
    const pickupInput = document.getElementById('pickupDate');

    if (!deliveryInput || !pickupInput) return;

    const today = this.getTodayString();
    const maxDate = this.getDateString(this.maxAdvanceDays);

    // Set delivery date constraints
    deliveryInput.min = today;
    deliveryInput.max = maxDate;

    // Set pickup date constraints (will be updated when delivery date changes)
    pickupInput.min = today;
    pickupInput.max = maxDate;

    // Add visual indicators for fully booked dates
    this.updateDateInputStyles();
  }

  /**
   * Update pickup date minimum based on delivery date
   */
  updatePickupDateMinimum(deliveryDate) {
    const pickupInput = document.getElementById('pickupDate');

    if (deliveryDate && pickupInput) {
      const deliveryDateObj = new Date(deliveryDate + 'T00:00:00');
      deliveryDateObj.setDate(deliveryDateObj.getDate() + this.minRentalDays);
      pickupInput.min = deliveryDateObj.toISOString().split('T')[0];

      // Clear pickup date if it's now invalid
      if (pickupInput.value && pickupInput.value < pickupInput.min) {
        pickupInput.value = '';
      }
    }
  }

  /**
   * Check if a date range spans any fully booked dates
   */
  hasFullyBookedDatesInRange(startDate, endDate) {
    const start = new Date(startDate + 'T00:00:00');
    const end = new Date(endDate + 'T00:00:00');

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      if (this.isDateFullyBooked(dateStr)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Validate date range
   */
  validateDateRange(deliveryDate, pickupDate) {
    const errors = [];

    if (!deliveryDate || !pickupDate) {
      return errors; // Don't validate incomplete ranges
    }

    const today = this.getTodayString();
    const maxDate = this.getDateString(this.maxAdvanceDays);

    // Check if dates are in valid range
    if (deliveryDate < today) {
      errors.push('Delivery date cannot be in the past');
    }

    if (deliveryDate > maxDate) {
      errors.push(`Delivery date cannot be more than ${this.maxAdvanceDays} days in advance`);
    }

    if (pickupDate < today) {
      errors.push('Pickup date cannot be in the past');
    }

    if (pickupDate > maxDate) {
      errors.push(`Pickup date cannot be more than ${this.maxAdvanceDays} days in advance`);
    }

    // Check minimum rental period
    const deliveryDateObj = new Date(deliveryDate + 'T00:00:00');
    const pickupDateObj = new Date(pickupDate + 'T00:00:00');
    const daysDifference = Math.ceil((pickupDateObj - deliveryDateObj) / (1000 * 60 * 60 * 24));

    if (daysDifference < this.minRentalDays) {
      errors.push(`Minimum rental period is ${this.minRentalDays} days`);
    }

    // Check for fully booked dates in range
    if (this.hasFullyBookedDatesInRange(deliveryDate, pickupDate)) {
      errors.push('One or more dates in your selected range are fully booked');
    }

    return errors;
  }

  /**
   * Custom styling for date inputs (basic approach)
   */
  updateDateInputStyles() {
    // Note: This is limited with native date inputs
    // For full control, consider using a date picker library like Flatpickr
    const style = document.createElement('style');
    style.textContent = `
      input[type="date"]::-webkit-calendar-picker-indicator {
        filter: ${this.fullyBookedDates.size > 0 ? 'brightness(0.8)' : 'none'};
      }
    `;
    document.head.appendChild(style);
  }
}

/**
 * AvailabilityChecker Class - Handles real-time availability checking
 */
class AvailabilityChecker {
  constructor(api, dateManager) {
    this.api = api;
    this.dateManager = dateManager;
    this.currentRequest = null;
    this.checkTimeout = null;
  }

  /**
   * Initialize availability checking
   */
  async initialize() {
    try {
      this.showLoadingState('Connecting to booking system...');

      // Test connectivity first
      const connectivityTest = await this.api.testAPIConnectivity();
      if (!connectivityTest) {
        throw new Error('connectivity');
      }

      this.showLoadingState('Loading availability data...');
      const fullyBookedDates = await this.api.getFullyBookedDates();
      this.dateManager.setFullyBookedDates(fullyBookedDates);
      this.hideLoadingState();

      // Show success message
      this.showAvailabilityStatus('available', `✅ Booking system connected. ${fullyBookedDates.length} dates are fully booked.`);
      devLog('✓ Availability data loaded:', fullyBookedDates.length, 'fully booked dates');

    } catch (error) {
      this.hideLoadingState();

      let userMessage = 'Unable to load availability data.';
      let technicalMessage = '';

      if (error.message === 'connectivity') {
        userMessage = '🌐 Connection Issue: Unable to connect to booking system.';
        technicalMessage = 'This might be a CORS issue in local development. Check browser console for details.';
      } else if (error.message.includes('CORS') || error.message.includes('fetch') || error.name === 'TypeError') {
        userMessage = '🔒 Security Restriction: Local development CORS issue detected.';
        technicalMessage = 'Add CORS headers to Google Apps Script or test on deployed site.';
      } else {
        technicalMessage = error.message;
      }

      this.showError(`${userMessage} ${technicalMessage}`);
      devError('Availability initialization error:', error);
    }
  }

  /**
   * Check availability with debouncing
   */
  async checkDateRangeAvailability(deliveryDate, pickupDate, immediate = false) {
    // Clear previous timeout
    if (this.checkTimeout) {
      clearTimeout(this.checkTimeout);
    }

    // Cancel previous request
    if (this.currentRequest) {
      this.currentRequest.cancelled = true;
    }

    const delay = immediate ? 0 : 500; // 500ms debounce

    this.checkTimeout = setTimeout(async () => {
      if (!deliveryDate || !pickupDate) {
        this.clearAvailabilityStatus();
        return;
      }

      // Validate date range first
      const validationErrors = this.dateManager.validateDateRange(deliveryDate, pickupDate);
      if (validationErrors.length > 0) {
        this.showAvailabilityStatus('error', validationErrors[0]);
        return;
      }

      // Create request tracker
      const requestTracker = { cancelled: false };
      this.currentRequest = requestTracker;

      try {
        this.showLoadingState('Checking availability...');

        const availability = await this.api.checkAvailability(deliveryDate, pickupDate);

        // Check if request was cancelled
        if (requestTracker.cancelled) {
          return;
        }

        this.hideLoadingState();

        // Display availability status
        if (availability.available) {
          this.showAvailabilityStatus('available', availability.message);
        } else {
          this.showAvailabilityStatus('unavailable', availability.message);
        }

      } catch (error) {
        if (requestTracker.cancelled) {
          return;
        }

        this.hideLoadingState();
        this.showAvailabilityStatus('error', error.message);
        devError('Availability check error:', error);
      }
    }, delay);
  }

  /**
   * Show loading state
   */
  showLoadingState(message = 'Loading...') {
    const loadingIndicator = document.getElementById('loadingIndicator');
    if (loadingIndicator) {
      // Clear existing content safely
      loadingIndicator.textContent = '';

      // Create spinner element
      const spinner = document.createElement('span');
      spinner.className = 'spinner';
      loadingIndicator.appendChild(spinner);

      // Add message as text node (safe from XSS)
      const messageText = document.createTextNode(' ' + message);
      loadingIndicator.appendChild(messageText);

      loadingIndicator.hidden = false;
    }
  }

  /**
   * Hide loading state
   */
  hideLoadingState() {
    const loadingIndicator = document.getElementById('loadingIndicator');
    if (loadingIndicator) {
      loadingIndicator.hidden = true;
    }
  }

  /**
   * Show availability status
   */
  showAvailabilityStatus(type, message) {
    const statusElement = document.getElementById('availabilityStatus');
    if (statusElement) {
      statusElement.textContent = message;
      statusElement.className = `availability-status ${type}`;
      statusElement.style.display = 'block';
    }
  }

  /**
   * Clear availability status
   */
  clearAvailabilityStatus() {
    const statusElement = document.getElementById('availabilityStatus');
    if (statusElement) {
      statusElement.textContent = '';
      statusElement.className = 'availability-status';
      statusElement.style.display = 'none';
    }
  }

  /**
   * Show error message
   */
  showError(message) {
    const statusElement = document.getElementById('form-status');
    if (statusElement) {
      statusElement.textContent = message;
      statusElement.className = 'form-status error';
    }
  }
}

/**
 * ErrorHandler Class - Comprehensive error management
 */
class ErrorHandler {
  static showFormError(message, fieldId = null) {
    // Show general form error
    const formStatus = document.getElementById('form-status');
    if (formStatus) {
      formStatus.textContent = message;
      formStatus.className = 'form-status error';
    }

    // Show field-specific error if specified
    if (fieldId) {
      const errorElement = document.getElementById(`${fieldId}Error`);
      const formGroup = document.querySelector(`#${fieldId}`)?.closest('.form-group');

      if (errorElement) {
        errorElement.textContent = message;
        formGroup?.classList.add('has-error');
      }
    }
  }

  static clearFormErrors() {
    // Clear general form error
    const formStatus = document.getElementById('form-status');
    if (formStatus) {
      formStatus.textContent = '';
      formStatus.className = 'form-status';
    }

    // Clear all field errors
    document.querySelectorAll('.field-error').forEach(error => {
      error.textContent = '';
    });

    document.querySelectorAll('.form-group.has-error').forEach(group => {
      group.classList.remove('has-error');
    });
  }

  static showNetworkError(retryCallback = null) {
    const message = 'Network connection error. Please check your internet connection.';
    const formStatus = document.getElementById('form-status');

    if (formStatus) {
      // Clear existing content safely
      formStatus.textContent = '';

      // Create message div
      const messageDiv = document.createElement('div');
      messageDiv.textContent = message;
      formStatus.appendChild(messageDiv);

      // Add retry button if callback provided
      if (retryCallback) {
        const retryButton = document.createElement('button');
        retryButton.type = 'button';
        retryButton.className = 'btn btn--secondary';
        retryButton.textContent = 'Retry';
        // Use addEventListener instead of onclick attribute to avoid XSS
        retryButton.addEventListener('click', () => {
          // Execute callback safely
          if (typeof retryCallback === 'function') {
            retryCallback();
          } else if (typeof retryCallback === 'string') {
            // If callback is a string function name, execute it from window scope
            const fn = window[retryCallback];
            if (typeof fn === 'function') {
              fn();
            }
          }
        });
        formStatus.appendChild(retryButton);
      }

      formStatus.className = 'form-status error';
    }
  }

  static isNetworkError(error) {
    return error.message.includes('Network') ||
           error.message.includes('fetch') ||
           error.message.includes('timed out') ||
           error.name === 'TypeError';
  }
}

/**
 * BookingDataManager Class - Data preparation and validation
 */
class BookingDataManager {
  static sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML.trim();
  }

  static prepareBookingData(calendarDates = null) {
    // Read directly from input fields (NOT from FormData)
    // because fields are in three-step modal, not in the hidden form
    const getValue = (id) => {
      const element = document.getElementById(id);
      return element ? element.value : '';
    };

    return {
      name: this.sanitizeInput(getValue('fullName')),
      email: this.sanitizeInput(getValue('email')),
      phone: this.sanitizeInput(getValue('phone')),
      dropoff_address: this.sanitizeInput(getValue('dropoffAddress')),
      dropoff_city: this.sanitizeInput(getValue('dropoffCity')),
      dropoff_zip: this.sanitizeInput(getValue('dropoffZip')),
      dropoff_notes: this.sanitizeInput(getValue('dropoffNotes')),
      delivery_date: calendarDates?.startDate || null,
      pickup_date: calendarDates?.endDate || null,
      rental_duration: calendarDates?.duration || 0,
      time: getValue('timeSlot')
    };
  }

  static validateBookingData(data) {
    const errors = [];

    if (!data.name || data.name.length < 2) {
      errors.push({ field: 'fullName', message: 'Full name is required (minimum 2 characters)' });
    }

    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    if (!emailRegex.test(data.email)) {
      errors.push({ field: 'email', message: 'Valid email address is required' });
    }

    if (!data.dropoff_address || data.dropoff_address.length < 5) {
      errors.push({ field: 'dropoffAddress', message: 'Drop-off address is required (minimum 5 characters)' });
    }

    if (!data.dropoff_city || data.dropoff_city.length < 2) {
      errors.push({ field: 'dropoffCity', message: 'City is required' });
    }

    const zipRegex = /^[0-9]{5}(-[0-9]{4})?$/;
    if (!data.dropoff_zip || !zipRegex.test(data.dropoff_zip)) {
      errors.push({ field: 'dropoffZip', message: 'Valid ZIP code is required' });
    }

    if (!data.delivery_date) {
      errors.push({ field: 'calendarDates', message: 'Delivery date is required' });
    }

    if (!data.pickup_date) {
      errors.push({ field: 'calendarDates', message: 'Pickup date is required' });
    }

    if (!data.time) {
      errors.push({ field: 'timeSlot', message: 'Delivery time slot is required' });
    }

    return errors;
  }
}

/**
 * BackendTester Class - Testing utilities for development
 */
class BackendTester {
  constructor(modal) {
    this.modal = modal;
    this.api = modal.api;
  }

  /**
   * Test API connectivity
   */
  async testConnection() {
    try {
      devLog('Testing API connection...');
      const result = await this.api.getFullyBookedDates();
      devLog('✅ API connection successful:', result);
      return true;
    } catch (error) {
      devError('❌ API connection failed:', error);
      return false;
    }
  }

  /**
   * Test availability checking
   */
  async testAvailabilityCheck(startDate, endDate) {
    try {
      devLog(`Testing availability check for ${startDate} to ${endDate}...`);
      const result = await this.api.checkAvailability(startDate, endDate);
      devLog('✅ Availability check successful:', result);
      return result;
    } catch (error) {
      devError('❌ Availability check failed:', error);
      return null;
    }
  }

  /**
   * Run all tests
   */
  async runAllTests() {
    const results = {
      connection: await this.testConnection(),
      availability: await this.testAvailabilityCheck('2025-01-15', '2025-01-18')
    };

    devLog('Backend test results:', results);
    return results;
  }
}

/**
 * Enhanced BookingModal Class - Phase 5 with Complete Payment Processing
 */
class BookingModal {
  constructor() {
    devLog('🏗️ BookingModal constructor called');

    // Check if we're on a page with the booking modal
    this.modal = document.getElementById('bookingModal');
    devLog('  - Modal element found:', !!this.modal);

    if (!this.modal) {
      devLog('⚠️ BookingModal: Modal not found on this page - exiting constructor');
      return;
    }

    // Modal elements
    this.form = document.getElementById('dumpsterBookingForm');
    this.openButton = document.getElementById('openBookingModal');
    this.closeButton = document.getElementById('closeBookingModal');
    this.cancelButton = document.getElementById('cancelBooking');

    devLog('  - Open button found:', !!this.openButton);
    devLog('  - Form found:', !!this.form);

    // Form elements
    this.formElements = {
      fullName: document.getElementById('fullName'),
      email: document.getElementById('email'),
      phone: document.getElementById('phone'),
      dropoffAddress: document.getElementById('dropoffAddress'),
      dropoffCity: document.getElementById('dropoffCity'),
      dropoffZip: document.getElementById('dropoffZip'),
      dropoffNotes: document.getElementById('dropoffNotes'),
      timeSlot: document.getElementById('timeSlot'),
      continueToPayment: document.getElementById('continueToPayment'),
      submitPayment: document.getElementById('submitPayment'),
      paymentSection: document.getElementById('paymentSection')
    };

    // State management
    this.isOpen = false;
    this.previousFocus = null;
    this.focusableElements = [];

    // Backend services
    this.api = new BookingAPI(window.CONFIG?.booking?.GAS_WEB_APP_URL);
    this.dateManager = new DateManager();
    this.availabilityChecker = new AvailabilityChecker(this.api, this.dateManager);

    // Phase 4: Form validation and user feedback systems
    this.validator = new FormValidator();
    this.stateManager = new FormStateManager();
    this.phoneFormatter = new PhoneFormatter('phone');

    // Calendar management system
    this.calendarManager = new CalendarManager(this.api, this.dateManager);

    // Phase 5: Payment processing system
    this.paymentProcessor = new PaymentProcessor();
    this.bookingFlowManager = new BookingFlowManager(this, this.api, this.validator, this.stateManager, this.paymentProcessor, this.calendarManager);

    // Initialize the modal system
    this.initializeModal();
    this.initializeForm();
    this.initializeEventListeners();
    this.initializeValidation();

    devLog('✓ BookingModal Phase 5 initialized with complete payment processing system');
  }

  /**
   * Initialize modal event listeners and setup
   */
  initializeModal() {
    if (!this.modal || !this.openButton) {
      devWarn('BookingModal: Required elements not found');
      devLog('  - this.modal:', !!this.modal);
      devLog('  - this.openButton:', !!this.openButton);
      return;
    }

    devLog('🎯 Attaching click handler to openBookingModal button');

    // Open modal event listener
    this.openButton.addEventListener('click', (e) => {
      devLog('🖱️ Book Now button clicked!');
      e.preventDefault();
      e.stopPropagation();
      devLog('📖 Calling openModal()...');
      this.openModal();
    });

    // Close modal event listeners - attach to ALL close buttons (all steps)
    const allCloseButtons = this.modal.querySelectorAll('.three-step-modal__close-btn');
    allCloseButtons.forEach(closeBtn => {
      closeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        devLog('🚪 Close button clicked');
        this.closeModal();
      });
    });
    devLog(`  - Attached close handlers to ${allCloseButtons.length} close buttons`);

    // Legacy close button (if exists)
    if (this.closeButton) {
      this.closeButton.addEventListener('click', (e) => {
        e.preventDefault();
        this.closeModal();
      });
    }

    if (this.cancelButton) {
      this.cancelButton.addEventListener('click', (e) => {
        e.preventDefault();
        this.closeModal();
      });
    }

    // ESC key to close modal
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.closeModal();
      }
    });

    // Click outside modal to close (backdrop click)
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) {
        this.closeModal();
      }
    });

    // Prevent closing when clicking inside modal content
    const modalContent = this.modal.querySelector('.modal-content');
    if (modalContent) {
      modalContent.addEventListener('click', (e) => {
        e.stopPropagation();
      });
    }
  }

  /**
   * Initialize form elements and constraints
   */
  async initializeForm() {
    if (!this.form) {
      devWarn('BookingModal: Form not found');
      return;
    }

    // Populate time slots from configuration
    this.populateTimeSlots();

    // Initialize calendar (replaces date input constraints)
    await this.calendarManager.init();

    // Initialize form field references for future use
    this.updateFocusableElements();

    devLog('✓ BookingModal form initialized');
  }

  /**
   * Initialize event listeners for backend integration
   */
  initializeEventListeners() {
    // Date change handlers with availability checking
    if (this.formElements.deliveryDate) {
      this.formElements.deliveryDate.addEventListener('change', (e) => {
        const deliveryDate = e.target.value;
        this.dateManager.updatePickupDateMinimum(deliveryDate);
        this.checkAvailabilityIfReady(true);
      });

      // Real-time availability checking with debounce
      this.formElements.deliveryDate.addEventListener('input', () => {
        this.checkAvailabilityIfReady(false);
      });
    }

    if (this.formElements.pickupDate) {
      this.formElements.pickupDate.addEventListener('change', () => {
        this.checkAvailabilityIfReady(true);
      });

      this.formElements.pickupDate.addEventListener('input', () => {
        this.checkAvailabilityIfReady(false);
      });
    }

    // Form submission handlers
    if (this.formElements.continueToPayment) {
      this.formElements.continueToPayment.addEventListener('click', (e) => {
        e.preventDefault();
        this.handleContinueToPayment();
      });
    }

    if (this.formElements.submitPayment) {
      this.formElements.submitPayment.addEventListener('click', (e) => {
        e.preventDefault();
        this.handleSubmitBooking();
      });
    }

    // Form validation on submit
    if (this.form) {
      this.form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleFormSubmission();
      });
    }
  }

  /**
   * Initialize comprehensive form validation system
   */
  initializeValidation() {
    // Enable real-time validation for all form fields
    const validationFields = ['fullName', 'email', 'phone', 'deliveryDate', 'pickupDate', 'timeSlot'];

    validationFields.forEach(fieldName => {
      this.validator.enableRealTimeValidation(fieldName);
    });

    // Enable validation feedback
    this.stateManager.enableValidation();

    devLog('✓ Form validation system initialized');
  }

  /**
   * Handle continue to payment button click
   */
  async handleContinueToPayment() {
    try {
      // Clear previous errors
      this.validator.clearAllErrors();

      // Get calendar dates
      const calendarDates = this.calendarManager.getSelectedDates();

      // Validate form before continuing
      const formData = this.validator.getFormData();
      formData.calendarDates = calendarDates; // Add calendar dates to validation
      const validation = this.validator.validateForm(formData);

      // DEBUG: Log validation results
      devLog('=== VALIDATION DEBUG ===');
      devLog('Form Data:', formData);
      devLog('Validation Result:', validation);
      devLog('Field Results:', validation.fieldResults);

      // Show which fields failed
      for (const [fieldName, result] of Object.entries(validation.fieldResults)) {
        if (!result.isValid) {
          devLog(`❌ ${fieldName} FAILED:`, result.errors);
        } else {
          devLog(`✓ ${fieldName} passed`);
        }
      }
      devLog('=======================');

      if (!validation.isValid) {
        this.showValidationErrors(validation.fieldResults);
        this.validator.showFormError('Please correct the errors above before continuing.');
        return;
      }

      // Set loading state
      this.stateManager.setSubmissionState(true);
      this.validator.showSuccess('Validating information...');

      // Check final availability
      devLog('Checking availability for dates:', calendarDates);
      const availability = await this.api.checkAvailability(
        calendarDates.startDate,
        calendarDates.endDate
      );
      devLog('Availability response:', availability);

      if (!availability.available) {
        this.validator.showFormError('Selected dates are no longer available. Please choose different dates.');
        return;
      }

      // Initialize payment form
      devLog('Initializing payment processor...');
      devLog('Square Config:', {
        appId: this.paymentProcessor.appId,
        locationId: this.paymentProcessor.locationId
      });
      this.validator.showSuccess('Initializing secure payment form...');

      try {
        await this.paymentProcessor.createCardPaymentForm();
        devLog('✅ Payment processor initialized successfully');
      } catch (squareError) {
        devError('❌ Square payment initialization failed:', squareError);
        devError('Square error details:', {
          message: squareError.message,
          stack: squareError.stack
        });
        // Show error to user
        this.validator.showFormError('Payment form failed to load. Please refresh the page and try again.');
        throw squareError; // Stop the process
      }

      // Show payment section
      this.stateManager.showPaymentSection();
      this.stateManager.setAvailabilityStatus(true, availability.message);
      this.validator.showSuccess('Information validated. You can now proceed with your booking.');

    } catch (error) {
      devError('Continue to payment error:', error);
      devError('Error stack:', error.stack);
      devError('Error details:', {
        message: error.message,
        name: error.name,
        code: error.code
      });

      if (error.message.includes('Square')) {
        this.validator.showFormError('Payment system unavailable. Please try again in a few minutes.');
      } else {
        this.validator.showFormError(`Unable to proceed to payment: ${error.message}`);
      }
    } finally {
      this.stateManager.setSubmissionState(false);
    }
  }

  /**
   * Handle booking submission
   */
  async handleSubmitBooking() {
    await this.bookingFlowManager.processCompleteBooking();
  }

  /**
   * Handle general form submission
   */
  handleFormSubmission() {
    // Determine which button was clicked based on form state
    if (this.stateManager.paymentReady) {
      this.handleSubmitBooking();
    } else {
      this.handleContinueToPayment();
    }
  }

  /**
   * Show validation errors for specific fields
   */
  showValidationErrors(fieldResults) {
    for (const [fieldName, result] of Object.entries(fieldResults)) {
      if (!result.isValid && result.errors.length > 0) {
        this.validator.showFieldError(fieldName, result.errors[0]);
      }
    }
  }

  /**
   * Populate time slot dropdown from configuration
   */
  populateTimeSlots() {
    const timeSlotSelect = this.formElements.timeSlot;
    if (!timeSlotSelect || !window.CONFIG?.booking?.TIME_SLOTS) {
      devWarn('BookingModal: Time slot select or configuration not found');
      return;
    }

    // Clear existing options (except the first placeholder)
    while (timeSlotSelect.children.length > 1) {
      timeSlotSelect.removeChild(timeSlotSelect.lastChild);
    }

    // Add time slot options from configuration
    window.CONFIG.booking.TIME_SLOTS.forEach(slot => {
      const option = document.createElement('option');
      option.value = slot.value;
      option.textContent = slot.label;
      timeSlotSelect.appendChild(option);
    });

    devLog('✓ Time slots populated:', window.CONFIG.booking.TIME_SLOTS.length);
  }

  /**
   * Update list of focusable elements within the modal
   */
  updateFocusableElements() {
    if (!this.modal) return;

    const focusableSelectors = [
      'input:not([disabled]):not([type="hidden"])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'button:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])'
    ];

    this.focusableElements = Array.from(
      this.modal.querySelectorAll(focusableSelectors.join(', '))
    ).filter(el => {
      // Only include visible elements
      return el.offsetWidth > 0 && el.offsetHeight > 0;
    });
  }

  /**
   * Open the booking modal with backend initialization
   */
  async openModal() {
    if (this.isOpen) return;

    // Track booking started in GA4
    if (typeof gtag !== 'undefined') {
      gtag('event', 'booking_started');
    }

    // Store the currently focused element
    this.previousFocus = document.activeElement;

    // Show the modal
    this.modal.hidden = false;
    this.modal.style.display = 'flex';
    this.isOpen = true;

    // Update ARIA states
    this.openButton.setAttribute('aria-expanded', 'true');

    // Prevent body scrolling
    document.body.style.overflow = 'hidden';

    // Scroll modal content to top
    const modalContent = this.modal.querySelector('.modal-content');
    if (modalContent) {
      modalContent.scrollTop = 0;
    }

    // Update focusable elements list
    this.updateFocusableElements();

    // Focus the modal header or close button instead of first input
    setTimeout(() => {
      const closeButton = this.closeButton;
      if (closeButton) {
        closeButton.focus();
      }
    }, 100);

    // Set up focus trapping
    this.setupFocusTrap();

    // Initialize availability data
    await this.availabilityChecker.initialize();

    // Check current date selection if any
    this.checkAvailabilityIfReady(true);

    devLog('✓ BookingModal opened with backend integration');
  }

  /**
   * Close the booking modal
   */
  closeModal() {
    if (!this.isOpen) return;

    // Hide the modal
    this.modal.hidden = true;
    this.modal.style.display = 'none';
    this.isOpen = false;

    // Update ARIA states
    this.openButton.setAttribute('aria-expanded', 'false');

    // Restore body scrolling
    document.body.style.overflow = '';

    // Return focus to the trigger button
    if (this.previousFocus) {
      this.previousFocus.focus();
      this.previousFocus = null;
    }

    // Remove focus trap
    this.removeFocusTrap();

    // Cleanup payment form
    this.paymentProcessor.destroy();

    // Clear status messages
    this.availabilityChecker.clearAvailabilityStatus();
    this.clearFormStatus();

    devLog('✓ BookingModal closed with payment cleanup');
  }

  /**
   * Check availability if both dates are ready
   */
  checkAvailabilityIfReady(immediate = true) {
    const deliveryDate = this.formElements.deliveryDate?.value;
    const pickupDate = this.formElements.pickupDate?.value;

    if (deliveryDate && pickupDate) {
      this.availabilityChecker.checkDateRangeAvailability(deliveryDate, pickupDate, immediate);
    } else {
      this.availabilityChecker.clearAvailabilityStatus();
    }
  }

  /**
   * Clear form status messages
   */
  clearFormStatus() {
    const statusElement = document.getElementById('form-status');
    if (statusElement) {
      statusElement.textContent = '';
      statusElement.className = 'form-status';
    }
  }

  /**
   * Set up focus trapping within the modal
   */
  setupFocusTrap() {
    this.modal.addEventListener('keydown', this.handleFocusTrap.bind(this));
  }

  /**
   * Remove focus trap event listener
   */
  removeFocusTrap() {
    this.modal.removeEventListener('keydown', this.handleFocusTrap.bind(this));
  }

  /**
   * Handle focus trapping with Tab key
   */
  handleFocusTrap(e) {
    if (e.key !== 'Tab') return;

    if (this.focusableElements.length === 0) return;

    const firstFocusable = this.focusableElements[0];
    const lastFocusable = this.focusableElements[this.focusableElements.length - 1];

    if (e.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstFocusable) {
        e.preventDefault();
        lastFocusable.focus();
      }
    } else {
      // Tab
      if (document.activeElement === lastFocusable) {
        e.preventDefault();
        firstFocusable.focus();
      }
    }
  }

  /**
   * Get current form data
   */
  getFormData() {
    return BookingDataManager.prepareBookingData();
  }

  /**
   * Reset form to initial state
   */
  resetForm() {
    if (!this.form) return;

    this.form.reset();

    // Clear all validation errors
    this.validator.clearAllErrors();

    // Reset state manager
    this.stateManager.resetForm();

    // Clear availability status
    this.availabilityChecker.clearAvailabilityStatus();

    devLog('✓ Form reset to initial state with validation system');
  }

  /**
   * Public method to check if modal is open
   */
  isModalOpen() {
    return this.isOpen;
  }
}

// Initialize the booking modal after modals are loaded
function initializeBookingModal() {
  devLog('🔄 initializeBookingModal() called');
  devLog('  - Modal exists:', !!document.getElementById('bookingModal'));
  devLog('  - Button exists:', !!document.getElementById('openBookingModal'));
  devLog('  - CONFIG exists:', typeof window.CONFIG !== 'undefined');
  devLog('  - Already initialized:', !!window.bookingModal);
  // Prevent double initialization (check if it's actually a BookingModal instance, not the DOM element!)
  if (window.bookingModal && window.bookingModal instanceof BookingModal) {
    devLog('⏭️  BookingModal already initialized, skipping');
    return;
  }

  // Clear if it's just the DOM element
  if (window.bookingModal && !(window.bookingModal instanceof BookingModal)) {
    devLog('⚠️  window.bookingModal was the DOM element, clearing it');
    window.bookingModal = null;
  }

  // Only initialize if we have the required configuration
  if (typeof window.CONFIG === 'undefined') {
    devWarn('⚠️  BookingModal: Configuration not loaded, waiting 500ms...');

    // Wait a bit for config to load, then try again
    setTimeout(() => {
      if (typeof window.CONFIG !== 'undefined') {
        devLog('✅ CONFIG now available, creating BookingModal');
        window.bookingModal = new BookingModal();
      } else {
        devError('❌ BookingModal: Configuration still not available after waiting');
      }
    }, 500);
  } else {
    devLog('✅ All prerequisites met, creating BookingModal');
    window.bookingModal = new BookingModal();
  }
}

// Wait for modals to be loaded by modal-loader.js
document.addEventListener('modalsLoaded', () => {
  devLog('📦 modalsLoaded event received in bookNow.js');
  initializeBookingModal();
});

// Fallback: If modalsLoaded event already fired or modal-loader not present
document.addEventListener('DOMContentLoaded', function() {
  devLog('📄 DOMContentLoaded event in bookNow.js');
  // Check if modal already exists (direct HTML, not loaded dynamically)
  if (document.getElementById('bookingModal')) {
    devLog('✓ Modal found in DOM on DOMContentLoaded, initializing...');
    initializeBookingModal();
  } else {
    devLog('⏳ Modal not found in DOM on DOMContentLoaded, waiting for modalsLoaded event');
  }
});

// Make testing utilities available globally for debugging
window.testBackend = function() {
  if (window.bookingModal) {
    const tester = new BackendTester(window.bookingModal);
    return tester.runAllTests();
  } else {
    devError('BookingModal not initialized');
  }
};

// Test form validation system
window.testValidation = function() {
  if (window.bookingModal) {
    const validator = window.bookingModal.validator;

    devLog('Testing form validation system...');

    // Test invalid data
    const invalidData = {
      fullName: 'A', // Too short
      email: 'invalid-email', // Invalid format
      phone: '123', // Invalid phone
      deliveryDate: '', // Required
      pickupDate: '', // Required
      timeSlot: '', // Required
      agreeTos: false // Required
    };

    const invalidResult = validator.validateForm(invalidData);
    devLog('Invalid data validation:', invalidResult);

    // Test valid data
    const validData = {
      fullName: 'John Doe',
      email: 'john.doe@example.com',
      phone: '(555) 123-4567',
      deliveryDate: '2025-01-15',
      pickupDate: '2025-01-18',
      timeSlot: '09:00-11:00',
      agreeTos: true
    };

    const validResult = validator.validateForm(validData);
    devLog('Valid data validation:', validResult);

    return {
      invalidTest: invalidResult,
      validTest: validResult
    };
  } else {
    devError('BookingModal not initialized');
  }
};

// Test phone formatter
window.testPhoneFormatter = function() {
  if (window.PhoneFormatter) {
    const formatter = new PhoneFormatter();

    const testNumbers = ['5551234567', '555 123 4567', '(555) 123-4567', '555.123.4567'];

    devLog('Testing phone formatter...');
    testNumbers.forEach(number => {
      const formatted = formatter.formatPhone(number);
      devLog(`${number} -> ${formatted}`);
    });

    return true;
  } else {
    devError('PhoneFormatter not available');
  }
};

// Test payment processing
window.testPaymentProcessing = function() {
  if (window.bookingModal && window.bookingModal.paymentProcessor) {
    const processor = window.bookingModal.paymentProcessor;

    devLog('Testing payment processor...');

    // Test initialization
    processor.initialize().then(() => {
      devLog('✅ Payment processor initialized successfully');

      // Test payment form creation (requires card container in DOM)
      return processor.createCardPaymentForm();
    }).then(() => {
      devLog('✅ Payment form created successfully');
    }).catch((error) => {
      devError('❌ Payment processor test failed:', error);
    });

    return true;
  } else {
    devError('Payment processor not available');
  }
};

// Test complete booking flow (simulation)
window.testCompleteBookingFlow = function() {
  if (window.bookingModal) {
    devLog('Testing complete booking flow...');

    // Simulate form data
    const testData = {
      fullName: 'John Doe',
      email: 'john.doe@example.com',
      phone: '(555) 123-4567',
      deliveryDate: '2025-01-15',
      pickupDate: '2025-01-18',
      timeSlot: '09:00-11:00',
      agreeTos: true
    };

    // Fill form fields for testing
    Object.entries(testData).forEach(([key, value]) => {
      const element = document.getElementById(key);
      if (element) {
        if (element.type === 'checkbox') {
          element.checked = value;
        } else {
          element.value = value;
        }
      }
    });

    devLog('✅ Test data filled into form');
    devLog('💡 You can now test the booking flow by clicking "Continue to Payment"');

    return testData;
  } else {
    devError('BookingModal not available');
  }
};

// Test error recovery system
window.testErrorRecovery = function() {
  if (window.bookingModal && window.bookingModal.bookingFlowManager) {
    const errorManager = window.bookingModal.bookingFlowManager.errorRecoveryManager;

    devLog('Testing error recovery system...');

    // Test retryable vs non-retryable errors
    const retryableError = new Error('Network error occurred');
    const nonRetryableError = new Error('Invalid payment method');

    devLog('Retryable error test:', errorManager.shouldRetry(retryableError));
    devLog('Non-retryable error test:', errorManager.shouldRetry(nonRetryableError));

    // Test retry operation with success
    let attemptCount = 0;
    const testOperation = async () => {
      attemptCount++;
      if (attemptCount < 3) {
        throw new Error('Network error');
      }
      return { success: true, attempt: attemptCount };
    };

    errorManager.retryOperation(testOperation).then((result) => {
      devLog('✅ Retry operation succeeded:', result);
      errorManager.reset();
    }).catch((error) => {
      devError('❌ Retry operation failed:', error);
    });

    return true;
  } else {
    devError('Error recovery system not available');
  }
};

// Test security manager
window.testSecurityManager = function() {
  if (window.bookingModal && window.bookingModal.bookingFlowManager) {
    const securityManager = window.bookingModal.bookingFlowManager.securityManager;

    devLog('Testing security manager...');

    try {
      // Test normal submissions
      for (let i = 1; i <= 3; i++) {
        securityManager.canSubmit();
        securityManager.recordAttempt();
        devLog(`✅ Submission ${i} allowed`);
      }

      // Test rate limiting
      devLog('Testing rate limiting...');
      securityManager.canSubmit();
      devLog('✅ Rate limiting working correctly');

    } catch (error) {
      devLog('🛡️ Security block triggered:', error.message);
    }

    // Reset for normal operation
    securityManager.reset();
    devLog('✅ Security manager reset');

    return true;
  } else {
    devError('Security manager not available');
  }
};

/**
 * ================================================================================
 * PHASE 5: PAYMENT PROCESSING AND COMPLETE BOOKING FLOW
 * ================================================================================
 */

/**
 * PaymentProcessor Class - Square Payments SDK integration
 */
class PaymentProcessor {
  constructor() {
    this.payments = null;
    this.card = null;
    this.isInitialized = false;
    this.appId = window.CONFIG?.square?.appId;
    this.locationId = window.CONFIG?.square?.locationId;
  }

  /**
   * Initialize Square Payments
   */
  async initialize() {
    try {
      if (!window.Square) {
        throw new Error('Square Payments SDK not loaded');
      }

      if (!this.appId || !this.locationId) {
        throw new Error('Square payment credentials not configured');
      }

      // Get environment from CONFIG (sandbox or production)
      const environment = window.CONFIG?.square?.environment || 'production';

      devLog('🔧 Initializing Square Payments:', {
        appId: this.appId,
        locationId: this.locationId,
        environment: environment,
        configSquare: window.CONFIG?.square
      });

      // Initialize Square Payments with environment parameter as third argument
      // Square SDK expects: Square.payments(appId, locationId, environment)
      this.payments = await window.Square.payments(this.appId, this.locationId, environment);
      this.isInitialized = true;

      devLog('✓ Square Payments initialized successfully in', environment, 'mode');
      return true;
    } catch (error) {
      devError('Square Payments initialization failed:', error);
      throw new Error('Payment system unavailable. Please try again later.');
    }
  }

  /**
   * Create and attach card payment form
   */
  async createCardPaymentForm() {
    if (!this.isInitialized) {
      devLog('⚠️ Payment processor not initialized, initializing now...');
      await this.initialize();
    }

    try {
      devLog('🔍 Looking for card container...');
      const cardContainer = document.getElementById('card-container');
      if (!cardContainer) {
        devError('❌ Card container element not found in DOM');
        throw new Error('Card container not found');
      }
      devLog('✅ Card container found:', cardContainer);

      devLog('🎨 Creating Square card (using default styles)...');
      // Create card payment form with NO custom styles
      // Custom styles may be causing rendering issues
      this.card = await this.payments.card();

      await this.card.attach(cardContainer);

      // Debug: Check if Square SDK actually created child elements
      devLog('🔍 Card container after attach:');
      devLog('  - innerHTML length:', cardContainer.innerHTML.length);
      devLog('  - Child elements count:', cardContainer.children.length);
      devLog('  - Children:', Array.from(cardContainer.children).map(el => el.tagName + '.' + el.className));

      // Check if card container has any iframes (Square SDK uses iframes)
      const iframes = cardContainer.querySelectorAll('iframe');
      devLog('  - iframes found:', iframes.length);
      if (iframes.length === 0) {
        devError('❌ WARNING: No iframes found! Square SDK may not have attached properly');
      } else {
        devLog('✅ Square SDK iframes detected:', iframes.length);
      }

      // Add event listeners
      this.card.addEventListener('cardBrandChanged', (event) => {
        devLog('Card brand detected:', event.detail.cardBrand);
      });

      this.card.addEventListener('errorClassAdded', (event) => {
        devLog('Card validation error:', event.detail);
        this.showCardError('Please check your card information');
      });

      this.card.addEventListener('errorClassRemoved', () => {
        this.clearCardError();
      });

      devLog('✓ Card payment form created successfully');
      return true;
    } catch (error) {
      devError('Card form creation failed:', error);
      throw new Error('Unable to load payment form. Please refresh and try again.');
    }
  }

  /**
   * Process payment - Tokenize card and prepare for server-side processing
   */
  async processPayment(amount, currency = 'USD') {
    console.error('🔍 PAYMENT PROCESS START - card exists:', !!this.card);
    console.error('🔍 Card value:', this.card);

    if (!this.card) {
      console.error('❌ CRITICAL: Payment form not initialized - this.card is null/undefined');
      throw new Error('Payment form not initialized');
    }

    console.log('🔍 DEBUG: About to process payment');
    console.log('🔍 Amount:', amount, 'cents');
    console.log('🔍 Config environment:', window.CONFIG?.environment);
    console.log('🔍 Square environment:', window.CONFIG?.square?.environment);

    try {
      // Tokenize card details
      console.log('🔍 DEBUG: Tokenizing card...');
      const tokenResult = await this.card.tokenize();

      console.log('🔍 DEBUG: Token result:', tokenResult.status);
      if (tokenResult.status === 'OK') {
        console.log('🔍 Token (first 20 chars):', tokenResult.token.substring(0, 20));
        console.log('✅ Token created successfully - will be sent to Google Apps Script for processing');

        // Return token for Google Apps Script to process the REAL payment
        // NO simulation, NO fake payment ID
        return {
          success: true,
          token: tokenResult.token,
          amount: amount,
          currency: currency,
          // Note: payment_id will be provided by Google Apps Script after real charge
          paymentId: null  // Explicitly null - will be set by Apps Script
        };
      } else {
        let errorMessage = 'Payment processing failed.';

        if (tokenResult.errors) {
          const cardErrors = tokenResult.errors.filter(error =>
            error.category === 'PAYMENT_METHOD_ERROR'
          );

          if (cardErrors.length > 0) {
            errorMessage = this.getCardErrorMessage(cardErrors[0].code);
          }
        }

        console.error('❌ Tokenization failed:', errorMessage);
        throw new Error(errorMessage);
      }
    } catch (error) {
      devError('Payment processing error:', error);
      throw error;
    }
  }

  // REMOVED: simulatePaymentProcessing() function
  // Payment processing is now handled by Google Apps Script
  // The token is sent directly to Apps Script which processes the REAL payment with Square API

  /**
   * Get user-friendly error message for card errors
   */
  getCardErrorMessage(errorCode) {
    const errorMessages = {
      'CARD_EXPIRED': 'Your card has expired. Please use a different card.',
      'CVV_FAILURE': 'Invalid security code. Please check the CVV on your card.',
      'ADDRESS_VERIFICATION_FAILURE': 'Please verify your billing address.',
      'INVALID_CARD': 'Invalid card number. Please check and try again.',
      'INSUFFICIENT_FUNDS': 'Insufficient funds. Please use a different card.',
      'CARD_DECLINED': 'Your card was declined. Please contact your bank or use a different card.',
      'PROCESSING_ERROR': 'Payment processing error. Please try again.',
      'GENERIC_DECLINE': 'Payment was declined. Please try a different payment method.'
    };

    return errorMessages[errorCode] || 'Payment processing failed. Please try again.';
  }

  /**
   * Show card error message
   */
  showCardError(message) {
    const container = document.getElementById('card-container');
    const existingError = container?.querySelector('.card-error');

    if (existingError) {
      existingError.remove();
    }

    if (container) {
      const errorDiv = document.createElement('div');
      errorDiv.className = 'card-error';
      errorDiv.style.color = '#ef4444';
      errorDiv.style.fontSize = '0.875rem';
      errorDiv.style.marginTop = '0.5rem';
      errorDiv.textContent = message;
      container.appendChild(errorDiv);
    }
  }

  /**
   * Clear card error message
   */
  clearCardError() {
    const container = document.getElementById('card-container');
    const existingError = container?.querySelector('.card-error');
    if (existingError) {
      existingError.remove();
    }
  }

  /**
   * Destroy card form (cleanup)
   */
  destroy() {
    if (this.card) {
      this.card.destroy();
      this.card = null;
    }
    this.isInitialized = false;
  }
}
// Expose PaymentProcessor globally for three-step-modal compatibility
window.PaymentProcessor = PaymentProcessor;

/**
 * ErrorRecoveryManager Class - Handle payment and booking failures
 */
class ErrorRecoveryManager {
  constructor(bookingFlowManager) {
    this.bookingFlowManager = bookingFlowManager;
    this.retryAttempts = 0;
    this.maxRetries = 3;
    this.retryDelay = 1000; // Start with 1 second
  }

  /**
   * Attempt retry with exponential backoff
   */
  async retryOperation(operation, context = {}) {
    if (this.retryAttempts >= this.maxRetries) {
      throw new Error('Maximum retry attempts exceeded. Please try again later.');
    }

    this.retryAttempts++;

    try {
      return await operation();
    } catch (error) {
      if (this.shouldRetry(error)) {
        devLog(`Retry attempt ${this.retryAttempts}/${this.maxRetries} for operation`);

        // Exponential backoff
        await this.delay(this.retryDelay * Math.pow(2, this.retryAttempts - 1));

        return this.retryOperation(operation, context);
      } else {
        throw error;
      }
    }
  }

  /**
   * Determine if error is retryable
   */
  shouldRetry(error) {
    const retryableErrors = [
      'Network error',
      'Request timed out',
      'Service temporarily unavailable',
      'Internal server error'
    ];

    return retryableErrors.some(retryableError =>
      error.message.toLowerCase().includes(retryableError.toLowerCase())
    );
  }

  /**
   * Delay execution
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Reset retry counter
   */
  reset() {
    this.retryAttempts = 0;
  }
}

/**
 * SecurityManager Class - Prevent fraud and abuse
 */
class SecurityManager {
  constructor() {
    this.submissionAttempts = 0;
    this.maxSubmissions = 5;
    this.submissionWindow = 10 * 60 * 1000; // 10 minutes
    this.lastSubmissionTime = 0;
    this.blockedUntil = 0;
  }

  /**
   * Check if submission is allowed
   */
  canSubmit() {
    const now = Date.now();

    // Check if currently blocked
    if (now < this.blockedUntil) {
      const remainingTime = Math.ceil((this.blockedUntil - now) / 1000 / 60);
      throw new Error(`Too many submission attempts. Please wait ${remainingTime} minutes before trying again.`);
    }

    // Reset counter if window has passed
    if (now - this.lastSubmissionTime > this.submissionWindow) {
      this.submissionAttempts = 0;
    }

    // Check submission limit
    if (this.submissionAttempts >= this.maxSubmissions) {
      this.blockedUntil = now + this.submissionWindow;
      throw new Error('Too many submission attempts. Please wait 10 minutes before trying again.');
    }

    return true;
  }

  /**
   * Record submission attempt
   */
  recordAttempt() {
    this.submissionAttempts++;
    this.lastSubmissionTime = Date.now();
  }

  /**
   * Reset after successful submission
   */
  reset() {
    this.submissionAttempts = 0;
    this.lastSubmissionTime = 0;
    this.blockedUntil = 0;
  }
}

/**
 * ================================================================================
 * PHASE 4: FORM VALIDATION AND USER FEEDBACK SYSTEM
 * ================================================================================
 */

/**
 * FormValidator Class - Comprehensive validation system
 */
class FormValidator {
  constructor() {
    this.validationRules = {
      fullName: [
        { test: (value) => value && value.length >= 2, message: 'Full name is required (minimum 2 characters)' },
        { test: (value) => /^[a-zA-Z\s'-]+$/.test(value), message: 'Name can only contain letters, spaces, hyphens, and apostrophes' },
        { test: (value) => value && value.length <= 50, message: 'Name cannot exceed 50 characters' }
      ],
      email: [
        { test: (value) => value && value.length > 0, message: 'Email address is required' },
        { test: (value) => this.isValidEmail(value), message: 'Please enter a valid email address' },
        { test: (value) => value && value.length <= 100, message: 'Email cannot exceed 100 characters' }
      ],
      phone: [
        { test: (value) => value && value.length > 0, message: 'Phone number is required' },
        { test: (value) => this.isValidPhone(value), message: 'Please enter a valid phone number (e.g., (555) 123-4567)' }
      ],
      dropoffAddress: [
        { test: (value) => value && value.length > 0, message: 'Drop-off address is required' },
        { test: (value) => value && value.length >= 5, message: 'Address must be at least 5 characters' },
        { test: (value) => value && value.length <= 100, message: 'Address cannot exceed 100 characters' }
      ],
      dropoffCity: [
        { test: (value) => value && value.length > 0, message: 'City is required' },
        { test: (value) => /^[a-zA-Z\s'-]+$/.test(value), message: 'City can only contain letters, spaces, hyphens, and apostrophes' },
        { test: (value) => value && value.length <= 50, message: 'City cannot exceed 50 characters' }
      ],
      dropoffZip: [
        { test: (value) => value && value.length > 0, message: 'ZIP code is required' },
        { test: (value) => this.isValidZipCode(value), message: 'Please enter a valid ZIP code (e.g., 12345 or 12345-6789)' }
      ],
      calendarDates: [
        { test: (value) => value && value.startDate && value.endDate, message: 'Please select delivery and pickup dates' },
        { test: (value) => value && value.isValid, message: `Minimum rental period is ${window.CONFIG?.booking?.MIN_RENTAL_DAYS || 1} ${(window.CONFIG?.booking?.MIN_RENTAL_DAYS || 1) === 1 ? 'day' : 'days'}` }
      ],
      timeSlot: [
        { test: (value) => value && value.length > 0, message: 'Please select a delivery time slot' },
        { test: (value) => this.isValidTimeSlot(value), message: 'Please select a valid time slot' }
      ],
      agreeTos: [
        { test: (value) => value === true, message: 'You must agree to the terms of service to continue' }
      ]
    };

    this.realTimeValidation = new Set();
    this.debounceTimers = new Map();
  }

  /**
   * Email validation regex
   */
  isValidEmail(email) {
    if (!email) return false;
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return emailRegex.test(email);
  }

  /**
   * Phone validation (US format)
   */
  isValidPhone(phone) {
    if (!phone) return false;
    const phoneRegex = /^\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}$/;
    const cleanPhone = phone.replace(/\D/g, '');
    return phoneRegex.test(phone) && cleanPhone.length === 10;
  }

  /**
   * ZIP code validation
   */
  isValidZipCode(zip) {
    if (!zip) return false;
    const zipRegex = /^[0-9]{5}(-[0-9]{4})?$/;
    return zipRegex.test(zip.trim());
  }

  /**
   * Check if date is today or future
   */
  isValidFutureDate(dateStr) {
    if (!dateStr) return false;
    const selectedDate = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return selectedDate >= today;
  }

  /**
   * Check if date is within advance booking limit
   */
  isWithinAdvanceLimit(dateStr) {
    if (!dateStr) return false;
    const selectedDate = new Date(dateStr + 'T00:00:00');
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + (window.CONFIG?.booking?.MAX_ADVANCE_DAYS || 90));
    return selectedDate <= maxDate;
  }

  /**
   * Check minimum rental period
   */
  isValidRentalPeriod(deliveryDate, pickupDate) {
    if (!deliveryDate || !pickupDate) return true; // Don't validate incomplete data

    const delivery = new Date(deliveryDate + 'T00:00:00');
    const pickup = new Date(pickupDate + 'T00:00:00');
    const daysDifference = Math.ceil((pickup - delivery) / (1000 * 60 * 60 * 24));

    return daysDifference >= (window.CONFIG?.booking?.MIN_RENTAL_DAYS || 3);
  }

  /**
   * Check if time slot is valid
   */
  isValidTimeSlot(timeSlot) {
    if (!timeSlot) return false;
    return window.CONFIG?.booking?.TIME_SLOTS?.some(slot => slot.value === timeSlot) || false;
  }

  /**
   * Validate single field
   */
  validateField(fieldName, value, formData = {}) {
    const rules = this.validationRules[fieldName];
    if (!rules) return { isValid: true, errors: [] };

    const errors = [];
    for (const rule of rules) {
      if (!rule.test(value, formData)) {
        errors.push(rule.message);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate entire form
   */
  validateForm(formData) {
    const results = {};
    let isFormValid = true;

    for (const fieldName in this.validationRules) {
      const value = fieldName === 'agreeTos' ? formData[fieldName] === true : formData[fieldName];
      const result = this.validateField(fieldName, value, formData);

      results[fieldName] = result;
      if (!result.isValid) {
        isFormValid = false;
      }
    }

    return {
      isValid: isFormValid,
      fieldResults: results
    };
  }

  /**
   * Enable real-time validation for a field
   */
  enableRealTimeValidation(fieldName) {
    this.realTimeValidation.add(fieldName);

    const field = document.getElementById(fieldName);
    if (!field) return;

    // Add event listeners for real-time validation
    field.addEventListener('input', (e) => this.handleRealTimeValidation(fieldName, e));
    field.addEventListener('blur', (e) => this.handleRealTimeValidation(fieldName, e, true));
  }

  /**
   * Handle real-time validation with debouncing
   */
  handleRealTimeValidation(fieldName, event, immediate = false) {
    const delay = immediate ? 0 : 300; // 300ms debounce for input, immediate for blur

    // Clear existing timer
    if (this.debounceTimers.has(fieldName)) {
      clearTimeout(this.debounceTimers.get(fieldName));
    }

    // Set new timer
    const timer = setTimeout(() => {
      this.validateAndDisplayFieldError(fieldName, event.target.value);
      this.debounceTimers.delete(fieldName);
    }, delay);

    this.debounceTimers.set(fieldName, timer);
  }

  /**
   * Validate field and display errors
   */
  validateAndDisplayFieldError(fieldName, value) {
    const formData = this.getFormData();
    const validation = this.validateField(fieldName, value, formData);

    if (validation.isValid) {
      this.clearFieldError(fieldName);
    } else {
      this.showFieldError(fieldName, validation.errors[0]); // Show first error
    }

    return validation.isValid;
  }

  /**
   * Get current form data
   * Reads directly from input fields since they're in three-step modal, not in form tag
   */
  getFormData() {
    const getValue = (id) => {
      const element = document.getElementById(id);
      return element ? element.value : '';
    };

    const getChecked = (id) => {
      const element = document.getElementById(id);
      return element ? element.checked : false;
    };

    return {
      fullName: getValue('fullName'),
      email: getValue('email'),
      phone: getValue('phone'),
      dropoffAddress: getValue('dropoffAddress'),
      dropoffCity: getValue('dropoffCity'),
      dropoffZip: getValue('dropoffZip'),
      dropoffNotes: getValue('dropoffNotes'),
      timeSlot: getValue('timeSlot'),
      deliveryDate: getValue('deliveryDate'),
      pickupDate: getValue('pickupDate'),
      agreeTos: getChecked('agreeTos')
    };
  }

  /**
   * Show field error
   */
  showFieldError(fieldName, message) {
    const errorElement = document.getElementById(`${fieldName}Error`);
    const formGroup = document.querySelector(`#${fieldName}`)?.closest('.form-group');

    if (errorElement) {
      errorElement.textContent = message;
      formGroup?.classList.add('has-error');
    }
  }

  /**
   * Clear field error
   */
  clearFieldError(fieldName) {
    const errorElement = document.getElementById(`${fieldName}Error`);
    const formGroup = document.querySelector(`#${fieldName}`)?.closest('.form-group');

    if (errorElement) {
      errorElement.textContent = '';
      formGroup?.classList.remove('has-error');
    }
  }

  /**
   * Clear all errors
   */
  clearAllErrors() {
    document.querySelectorAll('.field-error').forEach(error => {
      error.textContent = '';
    });

    document.querySelectorAll('.form-group.has-error').forEach(group => {
      group.classList.remove('has-error');
    });
  }

  /**
   * Show form-level success message
   */
  showSuccess(message) {
    const statusElement = document.getElementById('form-status');
    if (statusElement) {
      statusElement.textContent = message;
      statusElement.className = 'form-status success';
    }
  }

  /**
   * Show form-level error message
   */
  showFormError(message) {
    const statusElement = document.getElementById('form-status');
    if (statusElement) {
      statusElement.textContent = message;
      statusElement.className = 'form-status error';
    }
  }
}

/**
 * PhoneFormatter Class - Automatic phone number formatting
 */
class PhoneFormatter {
  constructor(inputId) {
    this.input = document.getElementById(inputId);
    if (this.input) {
      this.initializeFormatting();
    }
  }

  initializeFormatting() {
    this.input.addEventListener('input', (e) => {
      const value = e.target.value;
      const formatted = this.formatPhone(value);
      if (formatted !== value) {
        e.target.value = formatted;
      }
    });

    this.input.addEventListener('keypress', (e) => {
      // Only allow numbers and specific characters
      if (!/[\d\s()\-.]/.test(e.key) && !['Backspace', 'Delete', 'Tab', 'Enter'].includes(e.key)) {
        e.preventDefault();
      }
    });
  }

  formatPhone(value) {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');

    // Apply formatting based on length
    if (digits.length <= 3) {
      return digits;
    } else if (digits.length <= 6) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    } else if (digits.length <= 10) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    } else {
      // Limit to 10 digits
      const limited = digits.slice(0, 10);
      return `(${limited.slice(0, 3)}) ${limited.slice(3, 6)}-${limited.slice(6)}`;
    }
  }

  getCleanNumber() {
    return this.input.value.replace(/\D/g, '');
  }
}

/**
 * FormStateManager Class - Manage form states and user feedback
 */
class FormStateManager {
  constructor() {
    this.isSubmitting = false;
    this.validationEnabled = false;
    this.availabilityChecked = false;
    this.paymentReady = false;
  }

  /**
   * Enable form validation
   */
  enableValidation() {
    this.validationEnabled = true;

    // Show validation feedback
    const statusElement = document.getElementById('form-status');
    if (statusElement) {
      // Create validation message safely
      const messageDiv = document.createElement('div');
      messageDiv.className = 'form-status info';
      messageDiv.textContent = 'Form validation is now active';
      statusElement.textContent = '';
      statusElement.appendChild(messageDiv);

      setTimeout(() => {
        statusElement.textContent = '';
      }, 2000);
    }
  }

  /**
   * Set availability check status
   */
  setAvailabilityStatus(available, message = '') {
    this.availabilityChecked = true;

    const continueButton = document.getElementById('continueToPayment');
    const paymentSection = document.getElementById('paymentSection');

    if (available && continueButton && paymentSection) {
      continueButton.textContent = 'Continue to Payment';
      continueButton.disabled = false;
      continueButton.classList.remove('loading');
    } else if (continueButton) {
      continueButton.textContent = 'Check Availability First';
      continueButton.disabled = true;
    }
  }

  /**
   * Set form submission state
   */
  setSubmissionState(isSubmitting) {
    this.isSubmitting = isSubmitting;

    const submitButton = document.getElementById('submitPayment');
    const continueButton = document.getElementById('continueToPayment');
    const form = document.getElementById('dumpsterBookingForm');

    if (isSubmitting) {
      if (submitButton) {
        submitButton.textContent = 'Processing...';
        submitButton.disabled = true;
        submitButton.classList.add('loading');
      }

      if (continueButton) {
        continueButton.disabled = true;
      }

      if (form) {
        form.style.opacity = '0.7';
        form.style.pointerEvents = 'none';
      }
    } else {
      if (submitButton) {
        submitButton.textContent = 'Complete Booking - $1';
        submitButton.disabled = false;
        submitButton.classList.remove('loading');
      }

      if (continueButton) {
        continueButton.disabled = false;
      }

      if (form) {
        form.style.opacity = '1';
        form.style.pointerEvents = 'auto';
      }
    }
  }

  /**
   * Show payment section
   */
  showPaymentSection() {
    const paymentSection = document.getElementById('paymentSection');
    const continueButton = document.getElementById('continueToPayment');
    const submitButton = document.getElementById('submitPayment');

    if (paymentSection) {
      paymentSection.style.display = 'block';
      paymentSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    if (continueButton) {
      continueButton.style.display = 'none';
    }

    if (submitButton) {
      submitButton.style.display = 'block';
    }

    this.paymentReady = true;
  }

  /**
   * Hide payment section
   */
  hidePaymentSection() {
    const paymentSection = document.getElementById('paymentSection');
    const continueButton = document.getElementById('continueToPayment');
    const submitButton = document.getElementById('submitPayment');

    if (paymentSection) {
      paymentSection.style.display = 'none';
    }

    if (continueButton) {
      continueButton.style.display = 'block';
    }

    if (submitButton) {
      submitButton.style.display = 'none';
    }

    this.paymentReady = false;
  }

  /**
   * Reset form to initial state
   */
  resetForm() {
    const form = document.getElementById('dumpsterBookingForm');
    if (form) {
      form.reset();
    }

    this.isSubmitting = false;
    this.validationEnabled = false;
    this.availabilityChecked = false;
    this.paymentReady = false;

    this.hidePaymentSection();
    this.setSubmissionState(false);

    // Clear all status messages
    document.querySelectorAll('.field-error').forEach(error => {
      error.textContent = '';
    });

    document.querySelectorAll('.form-group.has-error').forEach(group => {
      group.classList.remove('has-error');
    });

    const statusElement = document.getElementById('form-status');
    if (statusElement) {
      statusElement.textContent = '';
      statusElement.className = 'form-status';
    }
  }
}

/**
 * BookingFlowManager Class - Complete booking flow management with payment processing
 */
class BookingFlowManager {
  constructor(modal, api, validator, stateManager, paymentProcessor, calendarManager) {
    this.modal = modal;
    this.api = api;
    this.validator = validator;
    this.stateManager = stateManager;
    this.paymentProcessor = paymentProcessor;
    this.calendarManager = calendarManager;
    this.currentBookingData = null;
    this.errorRecoveryManager = new ErrorRecoveryManager(this);
    this.securityManager = new SecurityManager();
  }

  /**
   * Process complete booking flow with payment
   */
  async processCompleteBooking() {
    console.error('🟢 processCompleteBooking STARTED');
    try {
      // Security check
      this.securityManager.canSubmit();
      this.securityManager.recordAttempt();

      // Step 1: Validate form data
      const formData = this.validator.getFormData();

      // Add calendar dates to form data
      formData.calendarDates = this.calendarManager.getSelectedDates();

      const validation = this.validator.validateForm(formData);

      if (!validation.isValid) {
        devError('❌ Form validation failed:');
        devError('📋 Form data:', formData);
        devError('🔍 Validation results:', validation.fieldResults);

        // Log specific failed fields
        Object.entries(validation.fieldResults).forEach(([field, result]) => {
          if (!result.isValid) {
            devError(`  ❌ ${field}: ${result.errors.join(', ')}`);
          }
        });

        this.showValidationErrors(validation.fieldResults);
        throw new Error('Please correct form errors before continuing.');
      }

      // Step 2: Final availability check with retry logic
      this.stateManager.setSubmissionState(true);
      this.updateStatusMessage('Checking final availability...');

      console.error('📅 Checking availability for dates:', {
        deliveryDate: formData.deliveryDate,
        pickupDate: formData.pickupDate
      });

      const availability = await this.errorRecoveryManager.retryOperation(async () => {
        return await this.api.checkAvailability(formData.deliveryDate, formData.pickupDate);
      });

      console.error('📊 Availability check response:', availability);

      if (!availability.available) {
        console.error('❌ Availability check FAILED - dates not available');
        throw new Error('Selected dates are no longer available. Please choose different dates.');
      }

      console.error('✅ Availability check PASSED - proceeding to payment');

      // Step 3: Process payment
      this.updateStatusMessage('Processing payment...');

      const paymentResult = await this.errorRecoveryManager.retryOperation(async () => {
        return await this.paymentProcessor.processPayment(
          (window.CONFIG?.booking?.BOOKING_PRICE || 299) * 100, // Convert to cents
          'USD'
        );
      });

      if (!paymentResult.success) {
        throw new Error('Payment processing failed. Please try again.');
      }

      // Step 4: Create booking in calendar
      this.updateStatusMessage('Finalizing your booking...');

      const bookingData = this.prepareBookingData(formData, paymentResult);
      const bookingResult = await this.errorRecoveryManager.retryOperation(async () => {
        return await this.api.createBooking(bookingData);
      });

      // Step 5: Handle booking result
      if (bookingResult.status === 'ok' || bookingResult.status === 'booked') {
        await this.handleBookingSuccess(bookingResult, paymentResult, formData);
        this.securityManager.reset(); // Reset security counter on success
      } else if (bookingResult.status === 'fully_booked') {
        // Booking failed due to race condition - need to handle refund
        await this.handleBookingFailure(bookingResult, paymentResult, true);
      } else {
        await this.handleBookingFailure(bookingResult, paymentResult, false);
      }

    } catch (error) {
      console.error('🚨 BOOKING FLOW ERROR CAUGHT:', error);
      console.error('🚨 Error message:', error.message);
      console.error('🚨 Error stack:', error.stack);
      devError('Booking flow error:', error);
      await this.handleBookingError(error);
    } finally {
      this.stateManager.setSubmissionState(false);
      this.errorRecoveryManager.reset();
    }
  }

  /**
   * Prepare booking data for API submission with payment info
   */
  prepareBookingData(formData, paymentResult) {
    // Get calendar dates from the calendar manager
    const calendarDates = this.modal.calendarManager.getSelectedDates();

    const bookingData = {
      name: this.sanitizeInput(formData.fullName),
      email: this.sanitizeInput(formData.email),
      phone: formData.phone?.replace(/\D/g, ''), // Clean phone number
      dropoff_address: this.sanitizeInput(formData.dropoffAddress),
      dropoff_city: this.sanitizeInput(formData.dropoffCity),
      dropoff_zip: this.sanitizeInput(formData.dropoffZip),
      dropoff_notes: this.sanitizeInput(formData.dropoffNotes),
      delivery_date: calendarDates.startDate,
      pickup_date: calendarDates.endDate,
      rental_duration: calendarDates.duration,
      time: formData.timeSlot,
      payment_token: paymentResult.token,
      card_nonce: paymentResult.token, // Add for Google Apps Script compatibility
      nonce: paymentResult.token, // Alternative field name
      amount_cents: paymentResult.amount, // FIXED: Changed from payment_amount to amount_cents
      payment_currency: paymentResult.currency
    };

    console.log('🔍 DEBUG: Prepared booking data for Apps Script:');
    console.log('🔍 Payment token (first 20):', bookingData.payment_token?.substring(0, 20));
    console.log('🔍 Amount (cents):', bookingData.amount_cents);
    console.log('🔍 Email:', bookingData.email);
    console.log('🔍 Full booking data:', JSON.stringify(bookingData, null, 2));

    return bookingData;
  }

  /**
   * Handle successful booking with payment confirmation
   */
  async handleBookingSuccess(bookingResult, paymentResult, formData) {
    console.log('🔍 DEBUG: ===== BOOKING SUCCESS =====');
    console.log('🔍 Booking result:', bookingResult);
    console.log('🔍 Payment result (tokenization):', paymentResult);

    // Use the REAL payment ID from Google Apps Script (not the fake one)
    const realPaymentId = bookingResult.payment_id || 'Unknown';
    const realAmountPaid = bookingResult.amount_paid || (paymentResult.amount / 100);

    console.log('🔍 Real payment ID from Square:', realPaymentId);
    console.log('🔍 Real amount charged:', realAmountPaid);

    // Store booking reference for potential future use
    this.currentBookingData = {
      bookingMessage: bookingResult.message || 'Booking confirmed successfully',
      paymentId: realPaymentId,  // Use real payment ID from Apps Script
      amount: realAmountPaid,
      timestamp: new Date().toISOString(),
      formData: formData // Store form data for confirmation screen
    };

    console.log('✅ Stored booking data:', this.currentBookingData);

    // Show Step 4 confirmation screen instead of auto-closing
    this.showConfirmationScreen(formData);
  }

  /**
   * Handle booking failure with payment considerations
   */
  async handleBookingFailure(bookingResult, paymentResult, needsRefund) {
    let errorMessage = bookingResult.message || 'Booking failed unexpectedly.';

    if (needsRefund && paymentResult) {
      errorMessage += ' Your payment will be refunded within 3-5 business days.';
      // In production, trigger refund process here
      devWarn('Refund needed for payment:', paymentResult.paymentId);
      this.logRefundRequest(paymentResult);
    }

    this.validator.showFormError(errorMessage);
    this.updateStatusMessage(errorMessage, 'error');

    // Allow user to try different dates
    this.stateManager.hidePaymentSection();
  }

  /**
   * Handle unexpected errors with payment consideration
   */
  async handleBookingError(error) {
    console.error('🔴 handleBookingError called with:', error);
    console.error('🔴 Error type:', error.constructor.name);
    console.error('🔴 Error message:', error.message);
    let userMessage = 'An unexpected error occurred. Please try again.';

    if (error.message.includes('availability')) {
      userMessage = error.message;
      this.stateManager.hidePaymentSection();
    } else if (error.message.includes('Payment')) {
      userMessage = error.message;
    } else if (error.message.includes('Network')) {
      userMessage = 'Network connection error. Please check your connection and try again.';
    } else if (error.message.includes('Too many')) {
      userMessage = error.message; // Security manager message
    }

    this.validator.showFormError(userMessage);
    this.updateStatusMessage(userMessage, 'error');
  }

  /**
   * Create success message with payment details
   */
  createSuccessMessage(bookingResult, paymentResult, formData) {
    // Create DOM elements safely to prevent XSS
    const container = document.createElement('div');
    container.className = 'booking-success';

    // Create heading
    const heading = document.createElement('h3');
    heading.textContent = '🎉 Booking Confirmed!';
    container.appendChild(heading);

    // Create message paragraph
    const messagePara = document.createElement('p');
    messagePara.textContent = bookingResult.message || 'Your dumpster rental has been successfully booked.';
    container.appendChild(messagePara);

    // Create booking details section
    const detailsDiv = document.createElement('div');
    detailsDiv.className = 'booking-details';

    // Helper function to create detail paragraph
    const createDetail = (label, value) => {
      const p = document.createElement('p');
      const strong = document.createElement('strong');
      strong.textContent = label + ': ';
      p.appendChild(strong);
      p.appendChild(document.createTextNode(value));
      return p;
    };

    // Add all booking details
    detailsDiv.appendChild(createDetail('Delivery',
      `${this.formatDate(formData.deliveryDate)} at ${this.formatTimeSlot(formData.timeSlot)}`));
    detailsDiv.appendChild(createDetail('Pickup',
      this.formatDate(formData.pickupDate)));
    detailsDiv.appendChild(createDetail('Amount Charged',
      `$${(paymentResult.amount / 100).toFixed(2)}`));
    detailsDiv.appendChild(createDetail('Payment ID',
      paymentResult.paymentId));
    detailsDiv.appendChild(createDetail('Confirmation',
      bookingResult.confirmation_number || 'EMAIL_CONFIRMATION'));

    container.appendChild(detailsDiv);

    // Create next steps paragraph
    const nextStepsPara = document.createElement('p');
    nextStepsPara.className = 'booking-next-steps';

    const nextStepsStrong = document.createElement('strong');
    nextStepsStrong.textContent = 'Next Steps:';
    nextStepsPara.appendChild(nextStepsStrong);
    nextStepsPara.appendChild(document.createElement('br'));
    nextStepsPara.appendChild(document.createTextNode('• You will receive a confirmation email within 5 minutes'));
    nextStepsPara.appendChild(document.createElement('br'));
    nextStepsPara.appendChild(document.createTextNode('• Our team will contact you the day before delivery'));
    nextStepsPara.appendChild(document.createElement('br'));
    nextStepsPara.appendChild(document.createTextNode('• Please ensure clear access to your driveway'));

    container.appendChild(nextStepsPara);

    return container;
  }

  /**
   * Log refund request for manual processing
   */
  logRefundRequest(paymentResult) {
    // In production, this would integrate with your refund processing system
    devLog('REFUND REQUEST:', {
      paymentId: paymentResult.paymentId,
      amount: paymentResult.amount,
      timestamp: new Date().toISOString(),
      reason: 'Booking failed after payment'
    });
  }

  /**
   * Utility functions
   */
  sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML.trim();
  }

  formatDate(dateString) {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString + 'T00:00:00').toLocaleDateString('en-US', options);
  }

  formatTimeSlot(timeSlot) {
    const slot = window.CONFIG?.booking?.TIME_SLOTS?.find(s => s.value === timeSlot);
    return slot ? slot.label : timeSlot;
  }

  updateStatusMessage(message, type = 'info') {
    const statusElement = document.getElementById('form-status');
    if (statusElement) {
      // Always use textContent for safety - only accepts strings
      if (typeof message === 'string') {
        statusElement.textContent = message;
        statusElement.className = `form-status ${type}`;
      } else {
        // If a DOM element is passed, use it directly
        statusElement.textContent = '';
        statusElement.appendChild(message);
        statusElement.className = `form-status ${type}`;
      }
    }
  }

  showValidationErrors(fieldResults) {
    for (const [fieldName, result] of Object.entries(fieldResults)) {
      if (!result.isValid && result.errors.length > 0) {
        this.validator.showFieldError(fieldName, result.errors[0]);
      }
    }
  }

  /**
   * Show Step 4 confirmation screen with booking details
   * Replaces the auto-close behavior after successful payment
   */
  showConfirmationScreen(formData) {
    console.log('🔍 DEBUG: ===== SHOWING CONFIRMATION SCREEN =====');
    console.log('🔍 Current booking data:', this.currentBookingData);
    devLog('🎉 Showing confirmation screen (Step 4)');

    // Track booking completion in GA4 with actual amount
    const actualAmount = this.currentBookingData?.amount || 1;
    if (typeof gtag !== 'undefined') {
      gtag('event', 'booking_complete', {
        'value': actualAmount,
        'currency': 'USD'
      });
      console.log('🔍 GA4 event tracked with value:', actualAmount);
    }

    // Get calendar dates
    const calendarDates = this.calendarManager.getSelectedDates();

    // Format dates for display
    const deliveryDate = this.formatConfirmationDate(calendarDates.startDate);
    const pickupDate = this.formatConfirmationDate(calendarDates.endDate);

    // Format location
    const location = `${formData.dropoffAddress || formData.dropoff_address}, ${formData.dropoffCity || formData.dropoff_city}`;

    console.log('🔍 Confirmation details:');
    console.log('  - Delivery:', deliveryDate);
    console.log('  - Pickup:', pickupDate);
    console.log('  - Location:', location);
    console.log('  - Payment ID:', this.currentBookingData?.paymentId);
    console.log('  - Amount:', actualAmount);

    // Populate confirmation fields
    document.getElementById('confirmationDeliveryDate').textContent = deliveryDate;
    document.getElementById('confirmationPickupDate').textContent = pickupDate;
    document.getElementById('confirmationLocation').textContent = location;

    // Navigate to Step 4
    this.goToStep(4);

    // Setup button handlers
    this.setupConfirmationButtons();
  }

  /**
   * Navigate to a specific step (including Step 4)
   */
  goToStep(stepNumber) {
    // Hide all steps
    const allSteps = document.querySelectorAll('.three-step__step');
    allSteps.forEach(step => {
      step.classList.remove('active');
    });

    // Show target step
    const targetStep = document.getElementById(`step-${stepNumber}`);
    if (targetStep) {
      targetStep.classList.add('active');
      devLog(`✅ Navigated to Step ${stepNumber}`);
    } else {
      devError(`❌ Step ${stepNumber} not found`);
    }
  }

  /**
   * Format date for confirmation screen (e.g., "Oct 26, 2024")
   */
  formatConfirmationDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  /**
   * Setup button handlers for confirmation screen
   */
  setupConfirmationButtons() {
    // "Book Another Dumpster" button
    const bookAnotherBtn = document.getElementById('bookAnotherDumpster');
    if (bookAnotherBtn) {
      bookAnotherBtn.onclick = () => {
        devLog('🔄 Book Another Dumpster clicked');
        // Reset form and go back to Step 1
        this.stateManager.resetForm();
        this.modal.resetForm();
        this.goToStep(1);
        // Reset Square payment flag
        window.squarePaymentInitialized = false;
      };
    }

    // "Back to Home" button
    const backToHomeBtn = document.getElementById('backToHome');
    if (backToHomeBtn) {
      backToHomeBtn.onclick = () => {
        devLog('🏠 Back to Home clicked');
        // Close the modal and reset
        this.modal.closeModal();
        this.stateManager.resetForm();
        // Reset Square payment flag
        window.squarePaymentInitialized = false;
      };
    }

    // Close button in confirmation header
    const confirmationCloseBtn = document.querySelector('.three-step-modal__close-btn--confirmation');
    if (confirmationCloseBtn) {
      confirmationCloseBtn.onclick = () => {
        devLog('❌ Confirmation close clicked');
        this.modal.closeModal();
        this.stateManager.resetForm();
        // Reset Square payment flag
        window.squarePaymentInitialized = false;
      };
    }
  }
}

// ===============================================================================
// CALENDAR MANAGER CLASS
// ===============================================================================

/**
 * CalendarManager - Visual calendar component for date selection
 * Handles calendar rendering, date selection, and availability checking
 */
class CalendarManager {
  constructor(api, dateManager) {
    this.api = api;
    this.dateManager = dateManager;
    this.currentMonth = new Date();
    this.selectedStartDate = null;
    this.selectedEndDate = null;
    this.fullyBookedDates = new Set();
    this.isInitialized = false;
    this.availabilityChecker = null;

    // Bind methods
    this.handleDateClick = this.handleDateClick.bind(this);
    this.navigateMonth = this.navigateMonth.bind(this);
    this.handleKeydown = this.handleKeydown.bind(this);
  }

  /**
   * Initialize the calendar
   */
  async init() {
    if (this.isInitialized) return;

    try {
      this.availabilityChecker = new AvailabilityChecker(this.api, this.dateManager);
      this.setupEventListeners();
      await this.render();
      await this.loadAvailability();
      this.isInitialized = true;

      if (window.CONFIG?.debug?.enableLogging) {
        devLog('📅 CalendarManager initialized');
      }
    } catch (error) {
      devError('Calendar initialization failed:', error);
      this.showError('Failed to initialize calendar');
    }
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    const prevBtn = document.getElementById('prevMonth');
    const nextBtn = document.getElementById('nextMonth');

    if (prevBtn) prevBtn.addEventListener('click', () => this.navigateMonth(-1));
    if (nextBtn) nextBtn.addEventListener('click', () => this.navigateMonth(1));

    // Keyboard navigation
    document.addEventListener('keydown', this.handleKeydown);
  }

  /**
   * Handle keyboard navigation
   */
  handleKeydown(event) {
    if (!event.target.classList.contains('calendar-day')) return;

    const { key } = event;
    const days = Array.from(document.querySelectorAll('.calendar-day:not(.disabled):not(.other-month)'));
    const currentIndex = days.indexOf(event.target);

    let targetIndex = currentIndex;

    switch (key) {
      case 'ArrowLeft':
        targetIndex = Math.max(0, currentIndex - 1);
        break;
      case 'ArrowRight':
        targetIndex = Math.min(days.length - 1, currentIndex + 1);
        break;
      case 'ArrowUp':
        targetIndex = Math.max(0, currentIndex - 7);
        break;
      case 'ArrowDown':
        targetIndex = Math.min(days.length - 1, currentIndex + 7);
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        this.handleDateClick(event);
        return;
      default:
        return;
    }

    if (targetIndex !== currentIndex && days[targetIndex]) {
      event.preventDefault();
      days[targetIndex].focus();
    }
  }

  /**
   * Navigate to different month
   */
  async navigateMonth(direction) {
    this.currentMonth.setMonth(this.currentMonth.getMonth() + direction);
    await this.render();
    await this.loadAvailability();
  }

  /**
   * Render the calendar
   */
  async render() {
    this.updateMonthYearDisplay();
    this.renderCalendarGrid();
    this.updateSelectedDatesDisplay();
  }

  /**
   * Update month/year display
   */
  updateMonthYearDisplay() {
    const monthYearElement = document.getElementById('currentMonthYear');
    if (monthYearElement) {
      const options = { year: 'numeric', month: 'long' };
      monthYearElement.textContent = this.currentMonth.toLocaleDateString('en-US', options);
    }
  }

  /**
   * Render calendar grid
   */
  renderCalendarGrid() {
    const grid = document.getElementById('calendarGrid');
    if (!grid) return;

    // Clear grid safely
    grid.textContent = '';

    const year = this.currentMonth.getFullYear();
    const month = this.currentMonth.getMonth();

    // Get first day of month and calculate starting point
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    // Generate 42 days (6 weeks)
    for (let i = 0; i < 42; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);

      const dayButton = this.createDayButton(currentDate, month);
      grid.appendChild(dayButton);
    }
  }

  /**
   * Create individual day button
   */
  createDayButton(date, currentMonth) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'calendar-day';
    button.textContent = date.getDate();
    button.setAttribute('data-date', this.formatDateString(date));
    button.setAttribute('tabindex', '-1');

    // Add ARIA attributes
    button.setAttribute('role', 'gridcell');
    button.setAttribute('aria-label', this.formatDateForScreen(date));

    // Add CSS classes based on date state
    if (date.getMonth() !== currentMonth) {
      button.classList.add('other-month');
      // Don't disable other-month dates - allow booking across months
    }

    // Check if date is fully booked first (takes priority over regular disabled)
    if (this.isDateFullyBooked(date)) {
      button.classList.add('fully-booked');
      button.disabled = true;
      button.setAttribute('aria-disabled', 'true');
      button.setAttribute('aria-label', `${this.formatDateForScreen(date)} - Fully booked`);
    } else if (this.isDateDisabled(date)) {
      button.classList.add('disabled');
      button.disabled = true;
      button.setAttribute('aria-disabled', 'true');
    }

    // Mark selected dates
    const dateString = this.formatDateString(date);
    if (this.selectedStartDate === dateString) {
      button.classList.add('selected-start');
      button.setAttribute('aria-selected', 'true');
    }
    if (this.selectedEndDate === dateString) {
      button.classList.add('selected-end');
      button.setAttribute('aria-selected', 'true');
    }
    if (this.isDateInRange(dateString)) {
      button.classList.add('in-range');
    }

    // Add click handler
    if (!button.disabled) {
      button.addEventListener('click', this.handleDateClick);
      button.setAttribute('tabindex', '0');
    }

    return button;
  }

  /**
   * Handle date click
   */
  handleDateClick(event) {
    const dateString = event.target.getAttribute('data-date');
    if (!dateString || event.target.disabled) return;

    // If no start date or both dates are selected, start over
    if (!this.selectedStartDate || (this.selectedStartDate && this.selectedEndDate)) {
      this.selectedStartDate = dateString;
      this.selectedEndDate = null;
    } else {
      // Set end date, ensuring it's after start date
      const startTime = new Date(this.selectedStartDate).getTime();
      const endTime = new Date(dateString).getTime();

      if (endTime < startTime) {
        // Swap dates if end is before start
        this.selectedEndDate = this.selectedStartDate;
        this.selectedStartDate = dateString;
      } else {
        this.selectedEndDate = dateString;
      }
    }

    this.render();
    this.validateDateSelection();
  }

  /**
   * Check if date is disabled
   */
  isDateDisabled(date) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);

    // Disable past dates
    if (checkDate < today) return true;

    // Disable dates beyond max advance booking
    const maxDate = new Date(today);
    maxDate.setDate(today.getDate() + (window.CONFIG?.booking?.MAX_ADVANCE_DAYS || 90));

    return checkDate > maxDate;
  }

  /**
   * Check if date is fully booked
   */
  isDateFullyBooked(date) {
    const dateString = this.formatDateString(date);
    return this.fullyBookedDates.has(dateString);
  }

  /**
   * Check if date is in selected range
   */
  isDateInRange(dateString) {
    if (!this.selectedStartDate || !this.selectedEndDate) return false;

    const checkTime = new Date(dateString).getTime();
    const startTime = new Date(this.selectedStartDate).getTime();
    const endTime = new Date(this.selectedEndDate).getTime();

    return checkTime > startTime && checkTime < endTime;
  }

  /**
   * Load availability data from backend
   */
  async loadAvailability() {
    if (!this.api) return;

    try {
      // Get fully booked dates from the API
      const fullyBookedDates = await this.api.getFullyBookedDates();

      // Update fully booked dates
      this.updateAvailability({ fullyBookedDates });

    } catch (error) {
      devWarn('Failed to load calendar availability:', error);
      // On error, continue without availability data
      this.updateAvailability({ fullyBookedDates: [] });
    }
  }

  /**
   * Update availability display
   */
  updateAvailability(availabilityData) {
    this.fullyBookedDates.clear();

    if (availabilityData && availabilityData.fullyBookedDates) {
      availabilityData.fullyBookedDates.forEach(date => {
        this.fullyBookedDates.add(date);
      });
    }

    // Re-render to show updated availability
    this.renderCalendarGrid();
  }

  /**
   * Update selected dates display
   */
  updateSelectedDatesDisplay() {
    const startElement = document.getElementById('selectedStartDate');
    const endElement = document.getElementById('selectedEndDate');
    const durationElement = document.getElementById('rentalDuration');

    if (startElement) {
      startElement.textContent = this.selectedStartDate ?
        this.formatDateForDisplay(this.selectedStartDate) : 'Not selected';
    }

    if (endElement) {
      endElement.textContent = this.selectedEndDate ?
        this.formatDateForDisplay(this.selectedEndDate) : 'Not selected';
    }

    if (durationElement) {
      if (this.selectedStartDate && this.selectedEndDate) {
        const duration = this.calculateDuration();
        const dayText = duration === 1 ? 'day' : 'days';
        durationElement.textContent = `${duration} ${dayText}`;
      } else {
        durationElement.textContent = '-';
      }
    }
  }

  /**
   * Calculate rental duration
   */
  calculateDuration() {
    if (!this.selectedStartDate || !this.selectedEndDate) return 0;

    const start = new Date(this.selectedStartDate);
    const end = new Date(this.selectedEndDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return Math.max(1, diffDays); // Minimum 1 day
  }

  /**
   * Validate date selection
   */
  validateDateSelection() {
    const errorElement = document.getElementById('calendarError');
    if (!errorElement) return;

    let errorMessage = '';

    if (this.selectedStartDate && this.selectedEndDate) {
      const duration = this.calculateDuration();
      const minDays = window.CONFIG?.booking?.MIN_RENTAL_DAYS || 1;

      if (duration < minDays) {
        errorMessage = `Minimum rental period is ${minDays} ${minDays === 1 ? 'day' : 'days'}`;
      }
    }

    errorElement.textContent = errorMessage;
    errorElement.style.display = errorMessage ? 'block' : 'none';
  }

  /**
   * Get selected dates for form submission
   */
  getSelectedDates() {
    return {
      startDate: this.selectedStartDate,
      endDate: this.selectedEndDate,
      duration: this.calculateDuration(),
      isValid: this.isSelectionValid()
    };
  }

  /**
   * Check if current selection is valid
   */
  isSelectionValid() {
    if (!this.selectedStartDate || !this.selectedEndDate) return false;

    const duration = this.calculateDuration();
    const minDays = window.CONFIG?.booking?.MIN_RENTAL_DAYS || 1;

    return duration >= minDays;
  }

  /**
   * Clear selection
   */
  clearSelection() {
    this.selectedStartDate = null;
    this.selectedEndDate = null;
    this.render();
  }

  /**
   * Show error message
   */
  showError(message) {
    const errorElement = document.getElementById('calendarError');
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.style.display = 'block';
    }
  }

  /**
   * Format date as string (YYYY-MM-DD)
   */
  formatDateString(date) {
    return date.toISOString().split('T')[0];
  }

  /**
   * Format date for display
   */
  formatDateForDisplay(dateString) {
    const date = new Date(dateString + 'T00:00:00');
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  }

  /**
   * Format date for screen readers
   */
  formatDateForScreen(date) {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  }
}

// ===============================================================================
// BROWSER CONSOLE DEBUGGING TOOLS
// ===============================================================================

/**
 * Debug utilities for troubleshooting booking system issues
 */
window.bookingDebug = {
  /**
   * Test API connectivity and CORS
   */
  testAPI: async () => {
    devLog('🔧 Manual API Test');
    const modal = window.bookingModal;
    if (!modal?.api) {
      devError('❌ Booking modal not found - make sure modal is initialized');
      return;
    }

    await modal.api.testAPIConnectivity();
  },

  /**
   * Check CORS configuration
   */
  checkCORS: () => {
    devLog('🌐 CORS Check');
    devLog('Current origin:', window.location.origin);
    devLog('Current protocol:', window.location.protocol);
    devLog('Current hostname:', window.location.hostname);
    devLog('API URL:', window.CONFIG?.booking?.GAS_WEB_APP_URL);
    devLog('Is Development:', window.CONFIG?.isDevelopment);
    devLog('Environment:', window.CONFIG?.environment);

    // Test if we can make a basic fetch request
    if (window.CONFIG?.booking?.GAS_WEB_APP_URL) {
      devLog('🔍 Testing basic fetch to API...');
      fetch(window.CONFIG.booking.GAS_WEB_APP_URL)
        .then(response => {
          devLog('✅ Fetch successful - status:', response.status);
          devLog('Response headers:', [...response.headers.entries()]);
        })
        .catch(error => {
          devError('❌ Fetch failed:', error);
          if (error.name === 'TypeError') {
            devError('🌐 This is likely a CORS error');
          }
        });
    }
  },

  /**
   * Test fully booked dates fetch
   */
  testFullyBookedDates: async () => {
    devLog('📅 Testing fully booked dates fetch');
    const modal = window.bookingModal;
    if (!modal?.api) {
      devError('❌ Booking modal not found');
      return;
    }

    try {
      const dates = await modal.api.getFullyBookedDates();
      devLog('✅ Fully booked dates:', dates);
      return dates;
    } catch (error) {
      devError('❌ Failed to fetch dates:', error);
      return null;
    }
  },

  /**
   * Test calendar availability check
   */
  testAvailabilityCheck: async (startDate = '2024-12-01', endDate = '2024-12-03') => {
    devLog(`📊 Testing availability check for ${startDate} to ${endDate}`);
    const modal = window.bookingModal;
    if (!modal?.api) {
      devError('❌ Booking modal not found');
      return;
    }

    try {
      const availability = await modal.api.checkAvailability(startDate, endDate);
      devLog('✅ Availability result:', availability);
      return availability;
    } catch (error) {
      devError('❌ Availability check failed:', error);
      return null;
    }
  },

  /**
   * Initialize calendar manually
   */
  initCalendar: async () => {
    devLog('📅 Manual calendar initialization');
    const modal = window.bookingModal;
    if (!modal?.calendarManager) {
      devError('❌ Calendar manager not found');
      return;
    }

    try {
      await modal.calendarManager.init();
      devLog('✅ Calendar initialized successfully');
    } catch (error) {
      devError('❌ Calendar initialization failed:', error);
    }
  },

  /**
   * Clear all loading states manually
   */
  clearLoadingStates: () => {
    devLog('🔄 Clearing all loading states');

    // Hide loading indicators
    document.querySelectorAll('.loading-indicator').forEach(el => {
      el.hidden = true;
      el.style.display = 'none';
      devLog('✅ Hidden loading indicator');
    });

    // Clear availability status
    const availabilityStatus = document.getElementById('availabilityStatus');
    if (availabilityStatus) {
      availabilityStatus.textContent = '';
      devLog('✅ Cleared availability status');
    }

    devLog('✅ All loading states cleared');
  },

  /**
   * Show system information
   */
  showSystemInfo: () => {
    devLog('ℹ️ System Information');
    devLog('User Agent:', navigator.userAgent);
    devLog('Current URL:', window.location.href);
    devLog('Referrer:', document.referrer);
    devLog('Screen Size:', `${screen.width}x${screen.height}`);
    devLog('Viewport Size:', `${window.innerWidth}x${window.innerHeight}`);
    devLog('Connection:', navigator.connection ? {
      effectiveType: navigator.connection.effectiveType,
      downlink: navigator.connection.downlink,
      rtt: navigator.connection.rtt
    } : 'Not available');
  },

  /**
   * Export debug report
   */
  exportDebugReport: async () => {
    devLog('📋 Generating debug report...');

    const report = {
      timestamp: new Date().toISOString(),
      environment: {
        isDevelopment: window.CONFIG?.isDevelopment,
        environment: window.CONFIG?.environment,
        origin: window.location.origin,
        hostname: window.location.hostname,
        protocol: window.location.protocol,
        userAgent: navigator.userAgent
      },
      config: {
        hasConfig: !!window.CONFIG,
        hasBookingConfig: !!window.CONFIG?.booking,
        apiUrl: window.CONFIG?.booking?.GAS_WEB_APP_URL,
        minRentalDays: window.CONFIG?.booking?.MIN_RENTAL_DAYS,
        timeSlots: window.CONFIG?.booking?.TIME_SLOTS?.length
      },
      modal: {
        exists: !!window.bookingModal,
        initialized: !!window.bookingModal?.api,
        hasCalendar: !!window.bookingModal?.calendarManager
      },
      tests: {}
    };

    // Run tests
    try {
      report.tests.apiConnectivity = await window.bookingDebug.testAPI();
    } catch (e) {
      report.tests.apiConnectivity = { error: e.message };
    }

    try {
      report.tests.fullyBookedDates = await window.bookingDebug.testFullyBookedDates();
    } catch (e) {
      report.tests.fullyBookedDates = { error: e.message };
    }

    devLog('📋 Debug Report:', report);
    return report;
  }
};

// Expose classes for debugging and testing
if (window.CONFIG?.debug?.enableLogging) {
  window.BookingModal = BookingModal;
  window.BookingAPI = BookingAPI;
  window.DateManager = DateManager;
  window.AvailabilityChecker = AvailabilityChecker;
  window.ErrorHandler = ErrorHandler;
  window.BookingDataManager = BookingDataManager;
  window.BackendTester = BackendTester;
  window.FormValidator = FormValidator;
  window.PhoneFormatter = PhoneFormatter;
  window.FormStateManager = FormStateManager;
  window.BookingFlowManager = BookingFlowManager;
  window.PaymentProcessor = PaymentProcessor;
  window.ErrorRecoveryManager = ErrorRecoveryManager;
  window.SecurityManager = SecurityManager;
  window.CalendarManager = CalendarManager;
  devLog('🔧 BookingModal Phase 5 debugging enabled with complete payment system');
}

// Always expose debug tools
devLog('🔧 Booking debug tools available: window.bookingDebug');
devLog('💡 Try: window.bookingDebug.checkCORS() or window.bookingDebug.testAPI()');

// Auto-run environment check in development
if (window.CONFIG?.isDevelopment && window.CONFIG?.debug?.enableLogging) {
  setTimeout(() => {
    devLog('🔄 Auto-running CORS check in development mode...');
    window.bookingDebug.checkCORS();
  }, 1000);
}
// =============================================================================
// GLOBAL PAYMENT INITIALIZATION FUNCTION
// Exposed for three-step-modal.js compatibility
// =============================================================================

/**
 * Initialize Square payment form
 * Called by three-step-modal.js when step 3 is shown
 */
window.initializeSquarePayment = async function() {
  devLog('🔧 initializeSquarePayment() called');
  
  if (window.squarePaymentInitialized) {
    devLog('✓ Square payment already initialized');
    return;
  }
  
  try {
    // Get the bookingModal instance if it exists
    if (window.bookingModal && window.bookingModal.paymentProcessor) {
      devLog('📦 Using existing PaymentProcessor from bookingModal');
      await window.bookingModal.paymentProcessor.createCardPaymentForm();
      window.squarePaymentInitialized = true;
      devLog('✅ Square payment form created successfully');
    } else {
      // Create standalone PaymentProcessor
      devLog('🆕 Creating standalone PaymentProcessor');
      const PaymentProcessorClass = window.PaymentProcessor || PaymentProcessor;
      const processor = new PaymentProcessorClass();
      await processor.initialize();
      await processor.createCardPaymentForm();
      window.squarePaymentInitialized = true;
      devLog('✅ Square payment form created successfully (standalone)');
    }
  } catch (error) {
    // ALWAYS log payment errors, even in production
    console.error('❌ PAYMENT INITIALIZATION FAILED:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    devError('❌ Failed to initialize Square payment:', error);

    // Show error in the card container
    const cardContainer = document.getElementById('card-container');
    if (cardContainer) {
      cardContainer.innerHTML = `
        <div style="padding: 1.5rem; background: #fee; border: 1px solid #fcc; border-radius: 8px; color: #c00;">
          <strong>Payment Error:</strong> ${error.message}
          <br><small>Please refresh the page and try again.</small>
        </div>
      `;
    }
  }
};

devLog('✅ window.initializeSquarePayment() is now available');
