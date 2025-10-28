/*
================================================================================
THREE-STEP-MODAL.JS - Step Navigation & Validation for Three-Step Booking Modal
================================================================================

PURPOSE:
Manages the step navigation, validation, and state for the modern three-step
booking modal. Integrates with existing bookNow.js functionality.

FEATURES:
- Step navigation (next/back)
- Step-specific validation before advancing
- Modal open/close functionality
- Maintains all existing field IDs and data collection
- Works seamlessly with existing Square payment and Google Apps Script integration

DEPENDENCIES:
- bookNow.js (existing booking logic, calendar, Square payment)
- three-step-modal.css
- config.js

================================================================================
*/

class ThreeStepModal {
  constructor() {
    this.currentStep = 1;
    this.totalSteps = 3;
    this.modal = document.getElementById('bookingModal');
    this.steps = {
      1: document.getElementById('step-1'),
      2: document.getElementById('step-2'),
      3: document.getElementById('step-3')
    };

    // Store validation state for each step
    this.stepValidation = {
      1: false,
      2: false,
      3: false
    };

    this.init();
  }

  /**
   * Initialize modal and event listeners
   */
  init() {
    console.log('🚀 Initializing Three-Step Modal...');

    // Modal open/close
    this.bindModalControls();

    // Step navigation buttons
    this.bindStepNavigation();

    // Escape key to close modal
    this.bindKeyboardControls();

    console.log('✅ Three-Step Modal initialized');
  }

  /**
   * Bind modal open/close controls
   */
  bindModalControls() {
    // NOTE: Modal opening/closing is handled by existing bookNow.js BookingModal class
    // We only handle step navigation here

    // However, we need to ensure step 1 is shown when modal opens
    // We'll hook into the existing modal opening by observing the modal
    if (this.modal) {
      let isInitializing = true;

      // Use MutationObserver to detect when modal is opened
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'attributes' && mutation.attributeName === 'hidden') {
            // Skip the initial mutation during page load
            if (isInitializing) {
              isInitializing = false;
              return;
            }

            // Check if modal was just opened (hidden attribute removed)
            const isNowHidden = this.modal.hasAttribute('hidden');
            const wasHidden = mutation.oldValue !== null; // oldValue is null when attribute is removed

            if (!isNowHidden && wasHidden) {
              // Modal was just opened - reset to step 1
              console.log('📖 Modal opened - resetting to step 1');
              this.goToStep(1);
            }
          }
        });
      });

      // Wait a moment before starting to observe to avoid initial mutations
      setTimeout(() => {
        isInitializing = false;
        observer.observe(this.modal, {
          attributes: true,
          attributeOldValue: true,
          attributeFilter: ['hidden']
        });
      }, 100);
    }
  }

  /**
   * Bind step navigation buttons
   */
  bindStepNavigation() {
    // Step 1 -> Step 2
    const step1Next = document.getElementById('step1Next');
    if (step1Next) {
      step1Next.addEventListener('click', () => this.validateAndAdvance(1));
    }

    // Step 2 -> Step 1 (Back)
    const step2Back = document.getElementById('step2Back');
    const step2BackBtn = document.getElementById('step2BackBtn');
    if (step2Back) {
      step2Back.addEventListener('click', () => this.goToStep(1));
    }
    if (step2BackBtn) {
      step2BackBtn.addEventListener('click', () => this.goToStep(1));
    }

    // Step 2 -> Step 3
    const step2Next = document.getElementById('step2Next');
    if (step2Next) {
      step2Next.addEventListener('click', () => this.validateAndAdvance(2));
    }

    // Step 3 -> Step 2 (Back)
    const step3Back = document.getElementById('step3Back');
    if (step3Back) {
      step3Back.addEventListener('click', () => this.goToStep(2));
    }

    // Step 3 submit is handled by existing bookNow.js payment logic
  }

  /**
   * Bind keyboard controls
   */
  bindKeyboardControls() {
    // ESC key handling is done by bookNow.js BookingModal class
    // We don't need to duplicate it here
  }

  /**
   * Open modal (Not used - handled by bookNow.js)
   */
  openModal() {
    // This is handled by bookNow.js BookingModal class
    // Kept for compatibility
    console.log('📖 Modal opening handled by bookNow.js');
  }

  /**
   * Close modal (Not used - handled by bookNow.js)
   */
  closeModal() {
    // This is handled by bookNow.js BookingModal class
    // Kept for compatibility
    console.log('🚪 Modal closing handled by bookNow.js');
  }

  /**
   * Navigate to specific step
   */
  goToStep(stepNumber) {
    if (stepNumber < 1 || stepNumber > this.totalSteps) {
      console.error('Invalid step number:', stepNumber);
      return;
    }

    console.log(`➡️ Navigating to step ${stepNumber}`);

    // Hide all steps
    Object.values(this.steps).forEach(step => {
      step.classList.remove('active');
    });

    // Show target step
    this.steps[stepNumber].classList.add('active');
    this.currentStep = stepNumber;

    // Update aria-current
    Object.entries(this.steps).forEach(([num, step]) => {
      if (parseInt(num) === stepNumber) {
        step.setAttribute('aria-current', 'step');
      } else {
        step.removeAttribute('aria-current');
      }
    });

    // Scroll to top of modal body
    const modalBody = this.steps[stepNumber].querySelector('.three-step-modal__body');
    if (modalBody) {
      modalBody.scrollTop = 0;
    }

    // Sync hidden date fields when navigating (for bookNow.js compatibility)
    this.syncDateFields();

    // Special handling for step 3 (payment)
    if (stepNumber === 3) {
      this.preparePaymentStep();
    }
  }

  /**
   * Sync display date values to hidden input fields
   * This ensures bookNow.js can read the selected dates
   */
  syncDateFields() {
    const startDateDisplay = document.getElementById('selectedStartDate');
    const endDateDisplay = document.getElementById('selectedEndDate');
    const deliveryDateInput = document.getElementById('deliveryDate');
    const pickupDateInput = document.getElementById('pickupDate');

    if (startDateDisplay && deliveryDateInput) {
      const startText = startDateDisplay.textContent.trim();
      if (startText && startText !== 'Not selected') {
        // Convert display format to YYYY-MM-DD if needed
        // For now, we'll assume the calendar sets it correctly
        deliveryDateInput.value = startText;
      }
    }

    if (endDateDisplay && pickupDateInput) {
      const endText = endDateDisplay.textContent.trim();
      if (endText && endText !== 'Not selected') {
        pickupDateInput.value = endText;
      }
    }
  }

  /**
   * Validate current step and advance if valid
   */
  async validateAndAdvance(currentStep) {
    console.log(`🔍 Validating step ${currentStep}...`);

    let isValid = false;

    switch (currentStep) {
      case 1:
        isValid = await this.validateStep1();
        break;
      case 2:
        isValid = this.validateStep2();
        break;
      case 3:
        // Step 3 handled by existing payment submission
        isValid = this.validateStep3();
        break;
    }

    if (isValid) {
      this.stepValidation[currentStep] = true;
      console.log(`✅ Step ${currentStep} validated`);

      if (currentStep < this.totalSteps) {
        this.goToStep(currentStep + 1);
      }
    } else {
      console.log(`❌ Step ${currentStep} validation failed`);
    }

    return isValid;
  }

  /**
   * Validate Step 1: Date & Time Selection
   */
  async validateStep1() {
    const errors = [];

    // Get calendar data (relies on existing calendar implementation)
    const startDateEl = document.getElementById('selectedStartDate');
    const endDateEl = document.getElementById('selectedEndDate');
    const timeSlot = document.getElementById('timeSlot');

    const startDate = startDateEl ? startDateEl.textContent : '';
    const endDate = endDateEl ? endDateEl.textContent : '';

    // Check if dates are selected
    if (!startDate || startDate === 'Not selected') {
      errors.push('Please select a delivery date');
      this.showFieldError('calendarError', 'Please select delivery and pickup dates');
    }

    if (!endDate || endDate === 'Not selected') {
      errors.push('Please select a pickup date');
      this.showFieldError('calendarError', 'Please select delivery and pickup dates');
    }

    // Check time slot
    if (!timeSlot || !timeSlot.value) {
      errors.push('Please select a delivery time');
      this.showFieldError('timeSlotError', 'Please select a delivery time');
      timeSlot.classList.add('error');
    } else {
      this.clearFieldError('timeSlotError');
      timeSlot.classList.remove('error');
    }

    if (errors.length > 0) {
      return false;
    }

    // Clear all errors
    this.clearFieldError('calendarError');
    this.clearFieldError('timeSlotError');

    return true;
  }

  /**
   * Validate Step 2: Delivery Details & Contact Info
   */
  validateStep2() {
    const errors = [];

    // Delivery address fields
    const address = document.getElementById('dropoffAddress');
    const city = document.getElementById('dropoffCity');
    const zip = document.getElementById('dropoffZip');

    // Contact fields
    const fullName = document.getElementById('fullName');
    const email = document.getElementById('email');
    const phone = document.getElementById('phone');

    // Validate delivery address
    if (!this.validateField(address, 'Please enter a delivery address', 'dropoffAddressError')) {
      errors.push('address');
    }

    if (!this.validateField(city, 'Please enter a city', 'dropoffCityError')) {
      errors.push('city');
    }

    if (!this.validateField(zip, 'Please enter a valid ZIP code', 'dropoffZipError', /^\d{5}(-\d{4})?$/)) {
      errors.push('zip');
    }

    // Validate contact info
    if (!this.validateField(fullName, 'Please enter your full name', 'fullNameError')) {
      errors.push('fullName');
    }

    if (!this.validateField(email, 'Please enter a valid email address', 'emailError', /^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      errors.push('email');
    }

    if (!this.validateField(phone, 'Please enter a valid phone number', 'phoneError', /^[\d\s\-\(\)]+$/)) {
      errors.push('phone');
    }

    return errors.length === 0;
  }

  /**
   * Validate Step 3: Terms of Service
   */
  validateStep3() {
    const agreeTos = document.getElementById('agreeTos');

    if (!agreeTos || !agreeTos.checked) {
      this.showFieldError('agreeTosError', 'You must agree to the terms of service');
      return false;
    }

    this.clearFieldError('agreeTosError');
    return true;
  }

  /**
   * Generic field validation helper
   */
  validateField(field, errorMessage, errorElementId, pattern = null) {
    if (!field) return false;

    const value = field.value.trim();

    // Check if empty
    if (!value) {
      this.showFieldError(errorElementId, errorMessage);
      field.classList.add('error');
      return false;
    }

    // Check pattern if provided
    if (pattern && !pattern.test(value)) {
      this.showFieldError(errorElementId, errorMessage);
      field.classList.add('error');
      return false;
    }

    // Valid - clear errors
    this.clearFieldError(errorElementId);
    field.classList.remove('error');
    return true;
  }

  /**
   * Show field error message
   */
  showFieldError(errorElementId, message) {
    const errorElement = document.getElementById(errorElementId);
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.classList.add('visible');
    }
  }

  /**
   * Clear field error message
   */
  clearFieldError(errorElementId) {
    const errorElement = document.getElementById(errorElementId);
    if (errorElement) {
      errorElement.textContent = '';
      errorElement.classList.remove('visible');
    }
  }

  /**
   * Prepare payment step (Step 3)
   */
  preparePaymentStep() {
    console.log('💳 Preparing payment step...');

    // Trigger Square payment initialization if not already done
    // This hooks into existing bookNow.js Square payment logic
    if (typeof window.initializeSquarePayment === 'function' && !window.squarePaymentInitialized) {
      window.initializeSquarePayment();
    }
  }

  /**
   * Reset modal to initial state
   */
  resetModal() {
    // Go back to step 1
    this.currentStep = 1;

    // Clear validation state
    this.stepValidation = {
      1: false,
      2: false,
      3: false
    };

    // Clear all error messages
    const errorElements = this.modal.querySelectorAll('.three-step__error-message');
    errorElements.forEach(el => {
      el.textContent = '';
      el.classList.remove('visible');
    });

    // Remove error classes from inputs
    const inputs = this.modal.querySelectorAll('.three-step__form-input, .three-step__form-textarea, .three-step__time-select');
    inputs.forEach(input => {
      input.classList.remove('error');
    });
  }

  /**
   * Trap focus within modal for accessibility
   */
  trapFocus() {
    const focusableElements = this.modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length === 0) return;

    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    // Focus first element
    firstFocusable.focus();

    // Trap focus
    this.modal.addEventListener('keydown', (e) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable.focus();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable.focus();
        }
      }
    });
  }

  /**
   * Get current form data (for integration with existing bookNow.js)
   */
  getFormData() {
    return {
      // Step 1: Dates & Time
      deliveryDate: this.getDateValue('selectedStartDate'),
      pickupDate: this.getDateValue('selectedEndDate'),
      deliveryTime: document.getElementById('timeSlot')?.value || '',

      // Step 2: Delivery Details
      dropoffAddress: document.getElementById('dropoffAddress')?.value || '',
      dropoffCity: document.getElementById('dropoffCity')?.value || '',
      dropoffZip: document.getElementById('dropoffZip')?.value || '',
      dropoffNotes: document.getElementById('dropoffNotes')?.value || '',

      // Step 2: Contact Info
      fullName: document.getElementById('fullName')?.value || '',
      email: document.getElementById('email')?.value || '',
      phone: document.getElementById('phone')?.value || '',

      // Step 3: Terms
      agreeTos: document.getElementById('agreeTos')?.checked || false
    };
  }

  /**
   * Helper to get date value from display element
   */
  getDateValue(elementId) {
    const element = document.getElementById(elementId);
    if (!element) return '';

    const text = element.textContent.trim();
    if (text === 'Not selected') return '';

    return text;
  }
}

// Initialize when DOM is ready
if (typeof window !== 'undefined') {
  // Function to initialize the modal
  function initThreeStepModal() {
    const modal = document.getElementById('bookingModal');

    if (!modal) {
      console.log('⏳ ThreeStepModal: Booking modal not found yet');
      return;
    }

    if (window.threeStepModal) {
      console.log('⏭️ ThreeStepModal: Already initialized, skipping');
      return;
    }

    // Wait a bit for bookingModal to initialize first
    setTimeout(() => {
      if (!window.bookingModal) {
        console.warn('⚠️ ThreeStepModal: bookingModal not initialized yet, waiting...');
      }

      window.threeStepModal = new ThreeStepModal();
      console.log('✅ Three-Step Modal ready');
    }, 100);
  }

  // Try to initialize on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initThreeStepModal);
  } else {
    // DOM already loaded - wait a tick to let bookNow.js initialize first
    setTimeout(initThreeStepModal, 100);
  }

  // Also listen for modalsLoaded event (from modal-loader.js)
  document.addEventListener('modalsLoaded', () => {
    console.log('📦 Modals loaded event received, initializing three-step modal...');
    initThreeStepModal();
  });
}

// Export for module usage if needed
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ThreeStepModal;
}
