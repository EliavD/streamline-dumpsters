/*
================================================================================
CONTACT.JS - Streamline Dumpsters Ltd. Contact Form Functionality
================================================================================

PURPOSE:
Handles contact form submission, validation, and user feedback for the contact
page. Provides client-side validation and secure form handling with proper
error messaging and accessibility support.

FUNCTIONALITY:
- Form submission with fetch API
- Client-side validation for required fields
- Success/error message display
- Form state management (loading, success, error)
- Basic email and phone validation

ACCESSIBILITY:
- ARIA live regions for dynamic messages
- Proper form validation feedback
- Keyboard navigation support
- Screen reader friendly error messages

BACKEND SETUP:This script requires a Google Apps Script backend to process form submissions.See CONTACT_FORM_SETUP_GUIDE.md in the project root for complete setup instructions.Update line 47 with your deployed Google Apps Script URL.

BROWSER SUPPORT:
- Modern browsers (Chrome 70+, Firefox 65+, Safari 12+, Edge 79+)
- Graceful degradation for older browsers
================================================================================
*/

document.addEventListener('DOMContentLoaded', function() {
    // Get form elements
    const contactForm = document.getElementById('contactForm');
    const formMessage = document.querySelector('.form-message');

    // Verify elements exist
    if (!contactForm) {
        console.log('Contact: No contact form found');
        return;
    }

    // Configuration
    const config = {
        apiEndpoint: 'https://script.google.com/macros/s/AKfycbwUMKj_F-4D0bOZmcrKH627eR_OeJUiYX1dIbXI11FiubbElP7JmmlnL6YrlZbPZ_xM/exec',
        submitTimeout: 10000, // 10 seconds
        enableClientValidation: true
    };

    // Initialize contact form
    initializeContactForm();

    /**
     * Initialize the contact form functionality
     */
    function initializeContactForm() {
        // Add form submission listener
        contactForm.addEventListener('submit', handleFormSubmit);

        // Add real-time validation listeners
        if (config.enableClientValidation) {
            setupFieldValidation();
        }

        console.log('✓ Contact form initialized');
    }

    /**
     * Setup real-time field validation
     */
    function setupFieldValidation() {
        const requiredFields = contactForm.querySelectorAll('[required]');

        requiredFields.forEach(field => {
            // Only validate on blur if the field has content
            // Don't validate empty fields on blur - only validate on submit
            field.addEventListener('blur', function() {
                // Only validate if field has content
                if (field.value.trim().length > 0) {
                    validateField(field);
                }
            });

            field.addEventListener('input', function() {
                // Clear any existing errors when user starts typing
                clearFieldError(field);
            });
        });

        // Email-specific validation
        const emailField = contactForm.querySelector('#email');
        if (emailField) {
            emailField.addEventListener('blur', function() {
                validateEmail(emailField);
            });
        }

        // Phone-specific validation (optional field)
        const phoneField = contactForm.querySelector('#phone');
        if (phoneField) {
            phoneField.addEventListener('blur', function() {
                if (phoneField.value.trim()) {
                    validatePhone(phoneField);
                }
            });
        }
    }

    /**
     * Handle form submission
     * @param {Event} event - Form submit event
     */
    async function handleFormSubmit(event) {
        event.preventDefault();

        // Validate form before submission
        if (!validateForm()) {
            showFormMessage('Please correct the errors above.', 'error');
            return;
        }

        // IMPORTANT: Collect form data BEFORE disabling fields!
        const formData = collectFormData();

        // Show loading state (this disables fields, so must come after collecting data)
        setFormLoading(true);
        showFormMessage('Sending your message...', 'loading');

        try {

            // Submit form
            const response = await submitForm(formData);

            // Handle success
            handleSubmitSuccess(response);

        } catch (error) {
            // Handle error
            handleSubmitError(error);
        } finally {
            // Hide loading state
            setFormLoading(false);
        }
    }

    /**
     * Validate the entire form
     * @returns {boolean} True if form is valid
     */
    function validateForm() {
        let isValid = true;
        const requiredFields = contactForm.querySelectorAll('[required]');

        // Clear previous errors
        clearAllFieldErrors();

        // Validate each required field
        requiredFields.forEach(field => {
            if (!validateField(field)) {
                isValid = false;
            }
        });

        // Validate email specifically
        const emailField = contactForm.querySelector('#email');
        if (emailField && !validateEmail(emailField)) {
            isValid = false;
        }

        // Validate phone if provided
        const phoneField = contactForm.querySelector('#phone');
        if (phoneField && phoneField.value.trim() && !validatePhone(phoneField)) {
            isValid = false;
        }

        return isValid;
    }

    /**
     * Validate a single field
     * @param {Element} field - Form field to validate
     * @returns {boolean} True if field is valid
     */
    function validateField(field) {
        const value = field.value.trim();
        const fieldName = getFieldLabel(field);

        if (field.hasAttribute('required') && !value) {
            showFieldError(field, `${fieldName} is required.`);
            return false;
        }

        if (value.length > 1000) {
            showFieldError(field, `${fieldName} must be less than 1000 characters.`);
            return false;
        }

        clearFieldError(field);
        return true;
    }

    /**
     * Validate email field
     * @param {Element} emailField - Email input field
     * @returns {boolean} True if email is valid
     */
    function validateEmail(emailField) {
        const email = emailField.value.trim();

        if (!email && emailField.hasAttribute('required')) {
            showFieldError(emailField, 'Email is required.');
            return false;
        }

        if (email && !isValidEmail(email)) {
            showFieldError(emailField, 'Please enter a valid email address.');
            return false;
        }

        clearFieldError(emailField);
        return true;
    }

    /**
     * Validate phone field
     * @param {Element} phoneField - Phone input field
     * @returns {boolean} True if phone is valid
     */
    function validatePhone(phoneField) {
        const phone = phoneField.value.trim();

        if (phone && !isValidPhone(phone)) {
            showFieldError(phoneField, 'Please enter a valid phone number.');
            return false;
        }

        clearFieldError(phoneField);
        return true;
    }

    /**
     * Check if email format is valid
     * @param {string} email - Email to validate
     * @returns {boolean} True if email format is valid
     */
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email) && email.length <= 254;
    }

    /**
     * Check if phone format is valid
     * @param {string} phone - Phone to validate
     * @returns {boolean} True if phone format is valid
     */
    function isValidPhone(phone) {
        // Remove all non-digit characters
        const digitsOnly = phone.replace(/\D/g, '');
        // Accept 10-15 digits (covers most international formats)
        return digitsOnly.length >= 10 && digitsOnly.length <= 15;
    }

    /**
     * Show field validation error
     * @param {Element} field - Form field
     * @param {string} message - Error message
     */
    function showFieldError(field, message) {
        field.classList.add('field-error');
        field.setAttribute('aria-invalid', 'true');

        // Create or update error message
        let errorElement = field.parentNode.querySelector('.field-error-message');
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.className = 'field-error-message';
            errorElement.setAttribute('role', 'alert');
            field.parentNode.appendChild(errorElement);
        }

        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }

    /**
     * Clear field validation error
     * @param {Element} field - Form field
     */
    function clearFieldError(field) {
        field.classList.remove('field-error');
        field.setAttribute('aria-invalid', 'false');

        const errorElement = field.parentNode.querySelector('.field-error-message');
        if (errorElement) {
            errorElement.style.display = 'none';
            errorElement.textContent = '';
        }
    }

    /**
     * Clear all field errors
     */
    function clearAllFieldErrors() {
        const errorFields = contactForm.querySelectorAll('.field-error');
        errorFields.forEach(field => clearFieldError(field));
    }

    /**
     * Get user-friendly field label
     * @param {Element} field - Form field
     * @returns {string} Field label
     */
    function getFieldLabel(field) {
        const label = contactForm.querySelector(`label[for="${field.id}"]`);
        if (label) {
            return label.textContent.replace('*', '').trim();
        }
        return field.name || field.id || 'Field';
    }

    /**
     * Collect form data
     * @returns {Object} Form data object
     */
    function collectFormData() {
        const formData = new FormData(contactForm);
        const data = {};

        // Convert FormData to plain object
        for (const [key, value] of formData.entries()) {
            data[key] = value.trim();
        }

        console.log('Form data collected:', data);

        // Add metadata
        data.timestamp = new Date().toISOString();
        data.source = 'website_contact_form';
        data.userAgent = navigator.userAgent;

        console.log('Final data to send:', data);

        return data;
    }

    /**
     * Submit form data to backend
     * @param {Object} formData - Form data to submit
     * @returns {Promise} Fetch promise
     */
    async function submitForm(formData) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), config.submitTimeout);

        try {
            const response = await fetch(config.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'text/plain'
                },
                body: JSON.stringify(formData),
                signal: controller.signal,
                redirect: 'follow'
            });

            clearTimeout(timeoutId);

            // Try to read the response
            try {
                const result = await response.json();
                return result;
            } catch (e) {
                // If JSON parsing fails but no error was thrown, assume success
                if (response.status === 200 || response.status === 0) {
                    return { success: true };
                }
                throw new Error('Invalid response from server');
            }

        } catch (error) {
            clearTimeout(timeoutId);
            throw error;
        }
    }

    /**
     * Handle successful form submission
     * @param {Object} response - Server response
     */
    function handleSubmitSuccess(response) {
        showFormMessage(
            'Thank you! Your message has been sent successfully. We\'ll respond within 24 hours.',
            'success'
        );

        // Reset form
        contactForm.reset();
        clearAllFieldErrors();

        // Focus first field
        const firstField = contactForm.querySelector('input, textarea');
        if (firstField) {
            firstField.focus();
        }

        console.log('✓ Contact form submitted successfully');
    }

    /**
     * Handle form submission error
     * @param {Error} error - Submission error
     */
    function handleSubmitError(error) {
        console.error('Contact form submission error:', error);

        let errorMessage = 'Sorry, there was an error sending your message. Please try again.';

        // Handle specific error types
        if (error.name === 'AbortError') {
            errorMessage = 'Request timed out. Please check your connection and try again.';
        } else if (error.message.includes('Failed to fetch')) {
            errorMessage = 'Unable to connect. Please check your internet connection and try again.';
        } else if (error.message.includes('HTTP 429')) {
            errorMessage = 'Too many requests. Please wait a moment and try again.';
        } else if (error.message.includes('HTTP 4')) {
            errorMessage = 'Invalid form data. Please check your entries and try again.';
        } else if (error.message.includes('HTTP 5')) {
            errorMessage = 'Server error. Please try again later or contact us directly.';
        }

        showFormMessage(errorMessage, 'error');
    }

    /**
     * Show form message to user
     * @param {string} message - Message to display
     * @param {string} type - Message type (success, error, loading)
     */
    function showFormMessage(message, type) {
        if (!formMessage) return;

        // Clear previous classes
        formMessage.className = 'form-message';

        // Add new class
        formMessage.classList.add(type);

        // Set message text
        formMessage.textContent = message;

        // Announce to screen readers
        formMessage.setAttribute('aria-live', 'polite');

        // Auto-hide success messages
        if (type === 'success') {
            setTimeout(() => {
                hideFormMessage();
            }, 8000);
        }
    }

    /**
     * Hide form message
     */
    function hideFormMessage() {
        if (formMessage) {
            formMessage.className = 'form-message';
            formMessage.textContent = '';
        }
    }

    /**
     * Set form loading state
     * @param {boolean} loading - Whether form is loading
     */
    function setFormLoading(loading) {
        const submitButton = contactForm.querySelector('button[type="submit"]');
        const formInputs = contactForm.querySelectorAll('input, textarea, button');

        if (loading) {
            if (submitButton) {
                submitButton.disabled = true;
                submitButton.textContent = 'Sending...';
            }
            formInputs.forEach(input => input.disabled = true);
        } else {
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = 'Send Message';
            }
            formInputs.forEach(input => input.disabled = false);
        }
    }

    // Expose public API for debugging
    if (window.DEBUG) {
        window.contactForm = {
            validate: validateForm,
            submit: () => handleFormSubmit(new Event('submit')),
            showMessage: showFormMessage,
            reset: () => {
                contactForm.reset();
                clearAllFieldErrors();
                hideFormMessage();
            }
        };
    }
});