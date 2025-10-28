/**
 * ================================================================================
 * JUNK REMOVAL MODAL SYSTEM - Phase 2
 * Streamline Dumpsters Ltd. - Enhanced Photo Upload and Form Validation
 * ================================================================================
 *
 * PURPOSE:
 * - Handle junk removal bid request modal functionality
 * - Advanced photo upload with drag-and-drop and validation
 * - Comprehensive form validation with real-time feedback
 * - Ready for backend integration
 *
 * PHASE 2 FEATURES:
 * - PhotoUploadManager for advanced file handling
 * - JunkRemovalValidator for comprehensive form validation
 * - Enhanced photo preview with file information
 * - Real-time field validation with error messaging
 * - Improved accessibility and user experience
 *
 * DEPENDENCIES:
 * - config.js (for junk removal configuration)
 * - base.css (for styling foundation)
 * - junkRemoval.css (for enhanced styling)
 *
 * ================================================================================
 */

/**
 * PhotoUploadManager - Handles all photo upload functionality
 */
class PhotoUploadManager {
  constructor() {
    this.maxFiles = CONFIG.junkRemoval.MAX_PHOTOS;
    this.maxFileSize = CONFIG.junkRemoval.MAX_FILE_SIZE;
    this.allowedTypes = CONFIG.junkRemoval.ALLOWED_FILE_TYPES;
    this.uploadedFiles = [];
    this.dropzone = null;
    this.fileInput = null;
    this.previewContainer = null;

    console.log('📸 PhotoUploadManager initialized');
  }

  initialize(modal) {
    this.dropzone = modal.querySelector('.photo-dropzone');
    this.fileInput = modal.querySelector('#junkPhotos');
    this.previewContainer = modal.querySelector('.photo-preview-container');

    if (!this.dropzone || !this.fileInput || !this.previewContainer) {
      console.warn('⚠️ Photo upload elements not found');
      return false;
    }

    this.initializeUpload();
    return true;
  }

  initializeUpload() {
    // File input change handler
    this.fileInput.addEventListener('change', (e) => {
      this.handleFiles(e.target.files);
    });

    // Drag and drop handlers
    this.dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      this.dropzone.classList.add('drag-over');
    });

    this.dropzone.addEventListener('dragleave', (e) => {
      e.preventDefault();
      this.dropzone.classList.remove('drag-over');
    });

    this.dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      this.dropzone.classList.remove('drag-over');
      this.handleFiles(e.dataTransfer.files);
    });

    // Click to upload
    this.dropzone.addEventListener('click', (e) => {
      if (e.target !== this.fileInput) {
        this.fileInput.click();
      }
    });

    console.log('📁 Photo upload handlers initialized');
  }

  async handleFiles(fileList) {
    const files = Array.from(fileList);

    // Check total file count
    if (this.uploadedFiles.length + files.length > this.maxFiles) {
      this.showUploadError(`Maximum ${this.maxFiles} photos allowed. You can upload ${this.maxFiles - this.uploadedFiles.length} more.`);
      return;
    }

    // Process each file
    for (const file of files) {
      if (this.validateFile(file)) {
        await this.processFile(file);
      }
    }

    this.updateUploadUI();
  }

  validateFile(file) {
    // Check file type
    if (!this.allowedTypes.includes(file.type)) {
      this.showUploadError(`${file.name}: Invalid file type. Please use JPG, PNG, or WEBP.`);
      return false;
    }

    // Check file size
    if (file.size > this.maxFileSize) {
      const maxMB = this.maxFileSize / (1024 * 1024);
      this.showUploadError(`${file.name}: File too large. Maximum ${maxMB}MB allowed.`);
      return false;
    }

    // Check for duplicates
    if (this.uploadedFiles.some(uploaded => uploaded.name === file.name && uploaded.size === file.size)) {
      this.showUploadError(`${file.name}: File already uploaded.`);
      return false;
    }

    return true;
  }

  async processFile(file) {
    try {
      // Create file object with preview
      const fileData = {
        file: file,
        name: file.name,
        size: file.size,
        id: Date.now() + Math.random(),
        preview: await this.createPreview(file)
      };

      this.uploadedFiles.push(fileData);
      this.addPhotoPreview(fileData);

      console.log(`✅ Processed file: ${file.name}`);

    } catch (error) {
      console.error('Error processing file:', error);
      this.showUploadError(`Error processing ${file.name}. Please try again.`);
    }
  }

  createPreview(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = () => reject(new Error('Failed to read file'));

      reader.readAsDataURL(file);
    });
  }

  addPhotoPreview(fileData) {
    const preview = document.createElement('div');
    preview.className = 'photo-preview';
    preview.dataset.fileId = fileData.id;

    preview.innerHTML = `
      <img src="${fileData.preview}" alt="Preview of ${fileData.name}" loading="lazy">
      <div class="photo-preview-info">
        <div class="photo-filename" title="${fileData.name}">${fileData.name}</div>
        <div class="photo-filesize">${this.formatFileSize(fileData.size)}</div>
      </div>
      <button type="button" class="photo-remove" aria-label="Remove ${fileData.name}" data-file-id="${fileData.id}">×</button>
    `;

    // Add remove handler
    const removeBtn = preview.querySelector('.photo-remove');
    removeBtn.addEventListener('click', () => this.removePhoto(fileData.id));

    this.previewContainer.appendChild(preview);
  }

  removePhoto(fileId) {
    // Remove from uploaded files array
    this.uploadedFiles = this.uploadedFiles.filter(file => file.id !== fileId);

    // Remove preview element
    const preview = this.previewContainer.querySelector(`[data-file-id="${fileId}"]`);
    if (preview) {
      preview.remove();
    }

    this.updateUploadUI();
    console.log(`🗑️ Removed photo with ID: ${fileId}`);
  }

  updateUploadUI() {
    const remainingSlots = this.maxFiles - this.uploadedFiles.length;
    const uploadText = this.dropzone.querySelector('.photo-dropzone__text strong, .upload-text');
    const uploadSubtext = this.dropzone.querySelector('.photo-dropzone__subtext, .upload-subtext');

    if (uploadText && uploadSubtext) {
      if (remainingSlots > 0) {
        uploadText.innerHTML = `<strong>Click to upload photos</strong> or drag and drop`;
        uploadSubtext.textContent = `PNG, JPG, WEBP up to 10MB each (${remainingSlots} more allowed)`;
        this.dropzone.style.opacity = '1';
        this.fileInput.disabled = false;
      } else {
        uploadText.innerHTML = `<strong>Maximum photos uploaded</strong>`;
        uploadSubtext.textContent = 'Remove photos to upload different ones';
        this.dropzone.style.opacity = '0.6';
        this.fileInput.disabled = true;
      }
    }

    // Update counter
    const counter = this.dropzone.parentNode.querySelector('.photo-upload__counter');
    if (counter) {
      counter.textContent = `${this.uploadedFiles.length}/${this.maxFiles} photos`;
    }

    // Clear any existing status messages
    this.clearUploadStatus();

    // Show success message if files uploaded
    if (this.uploadedFiles.length > 0) {
      this.showUploadSuccess(`${this.uploadedFiles.length} photo(s) ready for submission`);
    }
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  showUploadError(message) {
    this.showUploadStatus(message, 'error');
  }

  showUploadSuccess(message) {
    this.showUploadStatus(message, 'success');
  }

  showUploadStatus(message, type) {
    this.clearUploadStatus();

    const status = document.createElement('div');
    status.className = `upload-status ${type}`;
    status.textContent = message;
    status.id = 'uploadStatus';

    this.dropzone.parentNode.appendChild(status);

    // Auto-remove success messages after 3 seconds
    if (type === 'success') {
      setTimeout(() => this.clearUploadStatus(), 3000);
    }
  }

  clearUploadStatus() {
    const existingStatus = document.getElementById('uploadStatus');
    if (existingStatus) {
      existingStatus.remove();
    }
  }

  getUploadedFiles() {
    return this.uploadedFiles.map(fileData => fileData.file);
  }

  reset() {
    this.uploadedFiles = [];
    this.previewContainer.innerHTML = '';
    this.fileInput.value = '';
    this.updateUploadUI();
    this.clearUploadStatus();
    console.log('🧹 Photo upload reset');
  }

  hasFiles() {
    return this.uploadedFiles.length > 0;
  }

  getFileCount() {
    return this.uploadedFiles.length;
  }
}

/**
 * JunkRemovalValidator - Handles comprehensive form validation
 */
class JunkRemovalValidator {
  constructor() {
    this.validationRules = {
      customerName: [
        { test: (value) => value && value.length >= 2, message: 'Full name is required (minimum 2 characters)' },
        { test: (value) => /^[a-zA-Z\s'-]+$/.test(value), message: 'Name can only contain letters, spaces, hyphens, and apostrophes' }
      ],
      customerPhone: [
        { test: (value) => value && value.length > 0, message: 'Phone number is required' },
        { test: (value) => this.isValidPhone(value), message: 'Please enter a valid phone number (e.g., (555) 123-4567)' }
      ],
      customerEmail: [
        // Email is optional - only validate format if provided
        { test: (value) => !value || this.isValidEmail(value), message: 'Please enter a valid email address' }
      ],
      customerZip: [
        { test: (value) => value && value.length > 0, message: 'Zip code is required' },
        { test: (value) => /^\d{5}$/.test(value), message: 'Please enter a valid 5-digit zip code' }
      ]
    };

    console.log('✅ JunkRemovalValidator initialized');
  }

  isValidEmail(email) {
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return emailRegex.test(email);
  }

  isValidPhone(phone) {
    const phoneRegex = /^\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}$/;
    const cleanPhone = phone.replace(/\D/g, '');
    return phoneRegex.test(phone) && cleanPhone.length === 10;
  }

  validateField(fieldName, value) {
    const rules = this.validationRules[fieldName];
    if (!rules) return { isValid: true, errors: [] };

    // Skip validation for optional empty email field
    if (fieldName === 'customerEmail' && (!value || value.trim() === '')) {
      return { isValid: true, errors: [] };
    }

    const errors = [];
    for (const rule of rules) {
      if (!rule.test(value)) {
        errors.push(rule.message);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  validateForm(formData, photoManager) {
    const results = {};
    let isFormValid = true;

    // Validate text fields
    for (const fieldName in this.validationRules) {
      const value = formData[fieldName];
      const result = this.validateField(fieldName, value);

      results[fieldName] = result;
      if (!result.isValid) {
        isFormValid = false;
      }
    }

    // Photo validation (optional but recommended)
    if (!photoManager.hasFiles()) {
      results.photos = {
        isValid: true, // Photos are optional in Phase 2
        warnings: ['Photos help us provide more accurate quotes']
      };
    } else {
      results.photos = { isValid: true, errors: [] };
    }

    return {
      isValid: isFormValid,
      fieldResults: results
    };
  }

  showFieldError(fieldName, message) {
    const field = document.querySelector(`[name="${fieldName}"]`);
    if (!field) return;

    const formGroup = field.closest('.form-group');

    // Add error class to field
    field.classList.add('field-error');
    field.setAttribute('aria-invalid', 'true');

    // Add error class to form group
    if (formGroup) {
      formGroup.classList.add('has-error');
    }

    // Create or update error message
    let errorElement = formGroup?.querySelector('.field-error-message');
    if (!errorElement) {
      errorElement = document.createElement('div');
      errorElement.className = 'field-error-message';
      errorElement.setAttribute('role', 'alert');
      formGroup?.appendChild(errorElement);
    }

    errorElement.textContent = message;
  }

  clearFieldError(fieldName) {
    const field = document.querySelector(`[name="${fieldName}"]`);
    if (!field) return;

    const formGroup = field.closest('.form-group');

    // Remove error classes
    field.classList.remove('field-error');
    field.setAttribute('aria-invalid', 'false');

    if (formGroup) {
      formGroup.classList.remove('has-error');

      // Remove error message
      const errorElement = formGroup.querySelector('.field-error-message');
      if (errorElement) {
        errorElement.remove();
      }
    }
  }

  clearAllErrors() {
    // Clear all field errors
    document.querySelectorAll('#junkRemovalForm .field-error').forEach(field => {
      field.classList.remove('field-error');
      field.setAttribute('aria-invalid', 'false');
    });

    // Clear all form group errors
    document.querySelectorAll('#junkRemovalForm .has-error').forEach(group => {
      group.classList.remove('has-error');
    });

    // Remove all error messages
    document.querySelectorAll('#junkRemovalForm .field-error-message').forEach(error => {
      error.remove();
    });
  }

  showFormError(message) {
    const statusElement = document.getElementById('junk-form-status');
    if (statusElement) {
      statusElement.textContent = message;
      statusElement.className = 'form-status error';
    }
  }

  showFormSuccess(message) {
    const statusElement = document.getElementById('junk-form-status');
    if (statusElement) {
      statusElement.textContent = message;
      statusElement.className = 'form-status success';
    }
  }

  clearFormStatus() {
    const statusElement = document.getElementById('junk-form-status');
    if (statusElement) {
      statusElement.textContent = '';
      statusElement.className = 'form-status';
    }
  }
}

/**
 * Enhanced JunkRemovalModal - Main modal controller with Phase 2 features
 */
class JunkRemovalModal {
    constructor() {
        this.modal = null;
        this.form = null;
        this.isOpen = false;
        this.focusableElements = [];
        this.previousFocus = null;

        // Phase 2: Initialize new managers
        this.photoManager = new PhotoUploadManager();
        this.validator = new JunkRemovalValidator();

        // Bind methods to preserve 'this' context
        this.openModal = this.openModal.bind(this);
        this.closeModal = this.closeModal.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleOutsideClick = this.handleOutsideClick.bind(this);
        this.handleFormSubmit = this.handleFormSubmit.bind(this);

        console.log('🗑️ JunkRemovalModal (Phase 2) initialized');
    }

    // Initialize the modal system
    initializeJunkModal() {
        console.log('🔧 Initializing junk removal modal...');

        try {
            // Get modal elements
            this.modal = document.getElementById('junkRemovalModal');
            this.form = document.getElementById('junkRemovalForm');

            if (!this.modal || !this.form) {
                console.error('❌ Junk removal modal elements not found');
                return false;
            }

            // Phase 2: Initialize photo upload manager
            if (!this.photoManager.initialize(this.modal)) {
                console.warn('⚠️ Photo upload manager initialization failed');
            }

            // Set up event listeners
            this.setupEventListeners();

            // Phase 2: Set up enhanced form validation
            this.setupEnhancedFormValidation();

            // Cache focusable elements
            this.cacheFocusableElements();

            console.log('✅ Junk removal modal (Phase 2) initialized successfully');
            return true;

        } catch (error) {
            console.error('❌ Error initializing junk removal modal:', error);
            return false;
        }
    }

    // Set up all event listeners
    setupEventListeners() {
        // Open modal buttons
        const openButtons = document.querySelectorAll('#openJunkModal, [data-modal="junk-removal"]');
        openButtons.forEach(button => {
            button.addEventListener('click', this.openModal);
        });

        // Close modal elements - updated for three-step modal styling
        const closeButton = this.modal.querySelector('.three-step-modal__close-btn');
        const cancelButton = this.modal.querySelector('#cancelJunkRequest');

        if (closeButton) {
            closeButton.addEventListener('click', this.closeModal);
        }

        if (cancelButton) {
            cancelButton.addEventListener('click', this.closeModal);
        }

        // Click outside modal to close
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.closeModal();
            }
        });

        // Form submission
        this.form.addEventListener('submit', this.handleFormSubmit);

        // Global keyboard listener
        document.addEventListener('keydown', this.handleKeyDown);

        console.log('🎧 Event listeners set up for junk removal modal');
    }

    // Phase 2: Set up enhanced form validation with real-time feedback
    setupEnhancedFormValidation() {
        const inputs = this.form.querySelectorAll('input, textarea, select');

        inputs.forEach(input => {
            // Real-time validation on blur
            input.addEventListener('blur', () => {
                const fieldName = input.name;
                const value = input.value.trim();

                if (fieldName && this.validator.validationRules[fieldName]) {
                    const result = this.validator.validateField(fieldName, value);

                    if (result.isValid) {
                        this.validator.clearFieldError(fieldName);
                    } else {
                        this.validator.showFieldError(fieldName, result.errors[0]);
                    }
                }
            });

            // Clear errors on input to provide immediate feedback
            input.addEventListener('input', () => {
                const fieldName = input.name;
                if (fieldName && this.validator.validationRules[fieldName]) {
                    this.validator.clearFieldError(fieldName);
                }
            });
        });

        // Phone number formatting
        const phoneInput = this.form.querySelector('[name="customerPhone"]');
        if (phoneInput) {
            phoneInput.addEventListener('input', (e) => {
                this.formatPhoneNumber(e.target);
            });
        }

        console.log('✅ Enhanced form validation set up');
    }

    // Format phone number input automatically
    formatPhoneNumber(input) {
        let value = input.value.replace(/\D/g, '');

        if (value.length >= 6) {
            value = `(${value.slice(0, 3)}) ${value.slice(3, 6)}-${value.slice(6, 10)}`;
        } else if (value.length >= 3) {
            value = `(${value.slice(0, 3)}) ${value.slice(3)}`;
        }

        input.value = value;
    }

    // Cache focusable elements for accessibility
    cacheFocusableElements() {
        const focusableSelectors = [
            'button:not([disabled])',
            'input:not([disabled])',
            'textarea:not([disabled])',
            'select:not([disabled])',
            '[tabindex]:not([tabindex="-1"])'
        ];

        this.focusableElements = this.modal.querySelectorAll(focusableSelectors.join(','));
        console.log(`🎯 Cached ${this.focusableElements.length} focusable elements`);
    }

    // Open the modal
    openModal() {
        console.log('🚀 Opening junk removal modal');

        if (this.isOpen) {
            console.log('📝 Modal already open');
            return;
        }

        try {
            // Store previous focus
            this.previousFocus = document.activeElement;

            // Show modal - updated for three-step modal styling
            this.modal.hidden = false;
            this.modal.style.display = 'flex';
            this.modal.setAttribute('aria-hidden', 'false');

            // Update trigger button state
            const trigger = document.querySelector('#openJunkModal');
            if (trigger) {
                trigger.setAttribute('aria-expanded', 'true');
            }

            // Prevent body scroll
            document.body.style.overflow = 'hidden';

            // Focus management
            setTimeout(() => {
                const firstInput = this.modal.querySelector('input:not([disabled])');
                if (firstInput) {
                    firstInput.focus();
                } else if (this.focusableElements.length > 0) {
                    this.focusableElements[0].focus();
                }
            }, 100);

            // Set state
            this.isOpen = true;

            console.log('✅ Junk removal modal opened');

        } catch (error) {
            console.error('❌ Error opening junk removal modal:', error);
        }
    }

    // Close the modal
    closeModal() {
        console.log('🔒 Closing junk removal modal');

        if (!this.isOpen) {
            console.log('📝 Modal already closed');
            return;
        }

        try {
            // Hide modal - updated for three-step modal styling
            this.modal.hidden = true;
            this.modal.style.display = 'none';
            this.modal.setAttribute('aria-hidden', 'true');

            // Update trigger button state
            const trigger = document.querySelector('#openJunkModal');
            if (trigger) {
                trigger.setAttribute('aria-expanded', 'false');
            }

            // Restore body scroll
            document.body.style.overflow = '';

            // Restore focus
            if (this.previousFocus) {
                this.previousFocus.focus();
                this.previousFocus = null;
            }

            // Reset confirmation screen state
            const confirmationScreen = document.getElementById('junk-confirmation');
            if (confirmationScreen && confirmationScreen.style.display === 'flex') {
                confirmationScreen.style.display = 'none';
                this.form.style.display = 'block';
            }

            // Reset form
            this.resetForm();

            // Set state
            this.isOpen = false;

            console.log('✅ Junk removal modal closed');

        } catch (error) {
            console.error('❌ Error closing junk removal modal:', error);
        }
    }

    // Handle keyboard navigation
    handleKeyDown(event) {
        if (!this.isOpen) return;

        switch (event.key) {
            case 'Escape':
                event.preventDefault();
                this.closeModal();
                break;

            case 'Tab':
                this.trapFocus(event);
                break;
        }
    }

    // Handle clicks outside modal content
    handleOutsideClick(event) {
        if (event.target === event.currentTarget) {
            this.closeModal();
        }
    }

    // Trap focus within modal for accessibility
    trapFocus(event) {
        if (this.focusableElements.length === 0) return;

        const firstFocusable = this.focusableElements[0];
        const lastFocusable = this.focusableElements[this.focusableElements.length - 1];

        if (event.shiftKey) {
            // Shift + Tab
            if (document.activeElement === firstFocusable) {
                event.preventDefault();
                lastFocusable.focus();
            }
        } else {
            // Tab
            if (document.activeElement === lastFocusable) {
                event.preventDefault();
                firstFocusable.focus();
            }
        }
    }

    // Handle photo upload
    handlePhotoUpload(files) {
        console.log(`📸 Processing ${files.length} uploaded files`);

        const validFiles = Array.from(files).filter(file => {
            // Check file type
            if (!CONFIG.junkRemoval.ALLOWED_FILE_TYPES.includes(file.type)) {
                this.showError(`File ${file.name} is not a supported image type`);
                return false;
            }

            // Check file size
            if (file.size > CONFIG.junkRemoval.MAX_FILE_SIZE) {
                this.showError(`File ${file.name} is too large (max 10MB)`);
                return false;
            }

            return true;
        });

        // Check total photos limit
        if (this.uploadedPhotos.length + validFiles.length > CONFIG.junkRemoval.MAX_PHOTOS) {
            this.showError(`Maximum ${CONFIG.junkRemoval.MAX_PHOTOS} photos allowed`);
            return;
        }

        // Process valid files
        validFiles.forEach(file => {
            this.addPhotoPreview(file);
            this.uploadedPhotos.push(file);
        });

        this.updatePhotoCounter();
        console.log(`✅ Added ${validFiles.length} photos (${this.uploadedPhotos.length} total)`);
    }

    // Add photo preview
    addPhotoPreview(file) {
        const previewContainer = this.photoUpload.querySelector('.photo-preview-container');
        const reader = new FileReader();

        reader.onload = (e) => {
            const preview = document.createElement('div');
            preview.className = 'photo-preview';
            preview.innerHTML = `
                <img src="${e.target.result}" alt="Photo preview" />
                <button type="button" class="photo-preview__remove"
                        aria-label="Remove photo ${file.name}">
                    <span aria-hidden="true">×</span>
                </button>
                <div class="photo-preview__name">${file.name}</div>
            `;

            // Remove button functionality
            const removeBtn = preview.querySelector('.photo-preview__remove');
            removeBtn.addEventListener('click', () => {
                this.removePhoto(file, preview);
            });

            previewContainer.appendChild(preview);
        };

        reader.readAsDataURL(file);
    }

    // Remove photo
    removePhoto(file, previewElement) {
        // Remove from uploaded photos array
        const index = this.uploadedPhotos.indexOf(file);
        if (index > -1) {
            this.uploadedPhotos.splice(index, 1);
        }

        // Remove preview element
        previewElement.remove();

        // Update counter
        this.updatePhotoCounter();

        console.log(`🗑️ Removed photo: ${file.name}`);
    }

    // Update photo counter
    updatePhotoCounter() {
        const counter = this.photoUpload.querySelector('.photo-upload__counter');
        if (counter) {
            counter.textContent = `${this.uploadedPhotos.length}/${CONFIG.junkRemoval.MAX_PHOTOS} photos`;
        }
    }

    // Validate individual form field
    validateField(field) {
        const value = field.value.trim();
        const fieldName = field.name;
        let isValid = true;
        let errorMessage = '';

        // Required field check
        if (field.hasAttribute('required') && !value) {
            isValid = false;
            errorMessage = 'This field is required';
        }
        // Specific field validations
        else if (value) {
            switch (fieldName) {
                case 'customerName':
                    if (value.length < this.validationPatterns.NAME_MIN_LENGTH) {
                        isValid = false;
                        errorMessage = `Name must be at least ${this.validationPatterns.NAME_MIN_LENGTH} characters`;
                    } else if (value.length > this.validationPatterns.NAME_MAX_LENGTH) {
                        isValid = false;
                        errorMessage = `Name must be less than ${this.validationPatterns.NAME_MAX_LENGTH} characters`;
                    }
                    break;

                case 'customerEmail':
                    if (!this.validationPatterns.EMAIL.test(value)) {
                        isValid = false;
                        errorMessage = 'Please enter a valid email address';
                    }
                    break;

                case 'customerPhone':
                    if (!this.validationPatterns.PHONE.test(value)) {
                        isValid = false;
                        errorMessage = 'Please enter phone as (123) 456-7890';
                    }
                    break;

                case 'serviceAddress':
                    if (value.length < this.validationPatterns.ADDRESS_MIN_LENGTH) {
                        isValid = false;
                        errorMessage = `Address must be at least ${this.validationPatterns.ADDRESS_MIN_LENGTH} characters`;
                    } else if (value.length > this.validationPatterns.ADDRESS_MAX_LENGTH) {
                        isValid = false;
                        errorMessage = `Address must be less than ${this.validationPatterns.ADDRESS_MAX_LENGTH} characters`;
                    }
                    break;

                case 'junkDescription':
                    if (value.length > this.validationPatterns.DESCRIPTION_MAX_LENGTH) {
                        isValid = false;
                        errorMessage = `Description must be less than ${this.validationPatterns.DESCRIPTION_MAX_LENGTH} characters`;
                    }
                    break;
            }
        }

        // Show/hide error
        if (isValid) {
            this.clearFieldError(field);
        } else {
            this.showFieldError(field, errorMessage);
        }

        return isValid;
    }

    // Show field error
    showFieldError(field, message) {
        field.classList.add('field-error');
        field.setAttribute('aria-invalid', 'true');

        let errorElement = field.parentNode.querySelector('.field-error-message');
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.className = 'field-error-message';
            errorElement.setAttribute('role', 'alert');
            field.parentNode.appendChild(errorElement);
        }

        errorElement.textContent = message;
    }

    // Clear field error
    clearFieldError(field) {
        field.classList.remove('field-error');
        field.setAttribute('aria-invalid', 'false');

        const errorElement = field.parentNode.querySelector('.field-error-message');
        if (errorElement) {
            errorElement.remove();
        }
    }

    // Validate entire form
    validateForm() {
        const inputs = this.form.querySelectorAll('input[required], textarea[required], select[required]');
        let isValid = true;

        inputs.forEach(input => {
            if (!this.validateField(input)) {
                isValid = false;
            }
        });

        return isValid;
    }

    // Phase 2: Enhanced form submission with validation
    async handleFormSubmit(event) {
        event.preventDefault();
        console.log('📝 Submitting junk removal form (Phase 2)');

        // Clear previous errors
        this.validator.clearAllErrors();
        this.validator.clearFormStatus();

        // Collect form data
        const formData = this.collectFormData();

        // Validate form using enhanced validator
        const validationResult = this.validator.validateForm(formData, this.photoManager);

        if (!validationResult.isValid) {
            console.log('❌ Form validation failed');

            // Show field-specific errors
            for (const [fieldName, result] of Object.entries(validationResult.fieldResults)) {
                if (!result.isValid && result.errors.length > 0) {
                    this.validator.showFieldError(fieldName, result.errors[0]);
                }
            }

            this.validator.showFormError('Please fix the errors above and try again');

            // Focus on first error field
            const firstErrorField = this.form.querySelector('.field-error');
            if (firstErrorField) {
                firstErrorField.focus();
            }

            return;
        }

        // Show photo warning if no photos uploaded
        if (!this.photoManager.hasFiles()) {
            this.validator.showFormError('📸 Adding photos helps us provide more accurate quotes. Continue without photos?');
            // Still allow submission but warn user
        }

        // Show loading state
        this.showLoadingState(true);

        try {
            // Submit to backend
            const result = await this.submitToBackend(formData);

            if (result.success) {
                // Show confirmation screen instead of auto-closing
                this.showConfirmationScreen(formData);
            } else {
                this.validator.showFormError(result.message || 'Failed to submit request. Please try again.');
            }

        } catch (error) {
            console.error('❌ Form submission error:', error);
            this.validator.showFormError('An error occurred. Please try again later.');
        } finally {
            this.showLoadingState(false);
        }
    }

    // Phase 2: Enhanced form data collection
    collectFormData() {
        const formData = new FormData(this.form);

        // Add photos from photo manager
        const uploadedFiles = this.photoManager.getUploadedFiles();
        uploadedFiles.forEach((photo, index) => {
            formData.append(`photo_${index}`, photo);
        });

        // Convert to object for easier handling
        const data = {
            customerName: formData.get('customerName'),
            customerEmail: formData.get('customerEmail'),
            customerPhone: formData.get('customerPhone'),
            customerZip: formData.get('customerZip'),
            serviceAddress: formData.get('serviceAddress'),
            serviceCity: formData.get('serviceCity'),
            serviceZip: formData.get('serviceZip'),
            serviceDescription: formData.get('serviceDescription'),
            junkDescription: formData.get('junkDescription'),
            additionalNotes: formData.get('additionalNotes'),
            photos: uploadedFiles,
            photoCount: this.photoManager.getFileCount(),
            submissionDate: new Date().toISOString()
        };

        console.log('📋 Collected form data:', { ...data, photos: `${data.photos.length} files` });
        return data;
    }

    // Submit to backend (Google Apps Script)
    async submitToBackend(formData) {
        console.log('🚀 Submitting to backend...');

        // Backend URL - hardcoded since .env isn't accessible in frontend
        const BACKEND_URL = 'https://script.google.com/macros/s/AKfycbyJrogqdGeTweEI0pSRKqNB2VaoWglZOsPmMrPILEXw4BkzE4bXC42K0JRVfaBqhKYT3g/exec';

        try {
            // Prepare data for backend
            // Combine address fields if available
            let fullAddress = '';
            if (formData.serviceAddress) {
                fullAddress = formData.serviceAddress;
            }
            if (formData.customerZip) {
                fullAddress = fullAddress ? `${fullAddress}, ${formData.customerZip}` : formData.customerZip;
            }

            // Convert photos to base64
            const photoPromises = formData.photos.map(file => this.convertPhotoToBase64(file));
            const photoData = await Promise.all(photoPromises);

            const payload = {
                name: formData.customerName,
                number: formData.customerPhone,
                email: formData.customerEmail || '',
                address: fullAddress,
                notes: formData.serviceDescription || formData.junkDescription || formData.additionalNotes || '',
                photos: photoData
            };

            console.log('📋 Submitting payload:', { ...payload, photos: `${photoData.length} photos` });

            // Submit to Google Apps Script backend
            const response = await fetch(BACKEND_URL, {
                method: 'POST',
                mode: 'no-cors', // Required for Google Apps Script
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });

            // Note: no-cors mode doesn't allow reading response
            // So we assume success if no error was thrown
            console.log('✅ Form submitted successfully');

            return {
                success: true,
                message: 'Your junk removal request has been submitted successfully!'
            };

        } catch (error) {
            console.error('❌ Backend submission error:', error);
            return {
                success: false,
                message: 'An error occurred while submitting your request. Please try again.'
            };
        }
    }

    // Convert photo file to base64
    async convertPhotoToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                resolve({
                    name: file.name,
                    data: e.target.result, // base64 data URL
                    mimeType: file.type,
                    size: file.size
                });
            };

            reader.onerror = (error) => {
                console.error('Error reading file:', error);
                reject(error);
            };

            reader.readAsDataURL(file);
        });
    }

    // Show success message
    showSuccess(message) {
        this.showMessage(message, 'success');
    }

    // Show error message
    showError(message) {
        this.showMessage(message, 'error');
    }

    // Show general message
    showMessage(message, type = 'info') {
        // Remove existing messages
        const existingMessages = this.modal.querySelectorAll('.form-message');
        existingMessages.forEach(msg => msg.remove());

        // Create new message
        const messageElement = document.createElement('div');
        messageElement.className = `form-message form-message--${type}`;
        messageElement.setAttribute('role', 'alert');
        messageElement.textContent = message;

        // Insert at top of form
        this.form.insertBefore(messageElement, this.form.firstChild);

        // Auto-remove after delay (except for errors)
        if (type !== 'error') {
            setTimeout(() => {
                messageElement.remove();
            }, 5000);
        }
    }

    // Show/hide loading state
    showLoadingState(isLoading) {
        const submitButton = this.form.querySelector('button[type="submit"]');
        const loadingText = submitButton.dataset.loadingText || 'Submitting...';
        const originalText = submitButton.dataset.originalText || submitButton.textContent;

        if (isLoading) {
            submitButton.dataset.originalText = originalText;
            submitButton.textContent = loadingText;
            submitButton.disabled = true;
            submitButton.classList.add('btn--loading');
        } else {
            submitButton.textContent = originalText;
            submitButton.disabled = false;
            submitButton.classList.remove('btn--loading');
        }
    }

    // Phase 2: Enhanced form reset
    resetForm() {
        // Reset form fields
        this.form.reset();

        // Reset photo manager
        this.photoManager.reset();

        // Clear all validation errors
        this.validator.clearAllErrors();
        this.validator.clearFormStatus();

        console.log('🧹 Form reset to initial state (Phase 2)');
    }

    /**
     * Show confirmation screen after successful submission
     */
    showConfirmationScreen(formData) {
        console.log('🎉 Showing junk removal confirmation screen');

        // Get service type from form
        const serviceTypeSelect = this.form.querySelector('#serviceType');
        const serviceType = serviceTypeSelect ? serviceTypeSelect.options[serviceTypeSelect.selectedIndex].text : 'Junk Removal';

        // Populate confirmation fields
        document.getElementById('confirmServiceType').textContent = serviceType;
        document.getElementById('confirmName').textContent = formData.customerName || '-';
        document.getElementById('confirmEmail').textContent = formData.customerEmail || 'Not provided';
        document.getElementById('confirmPhotoCount').textContent = formData.photoCount > 0 ? `${formData.photoCount} photo${formData.photoCount !== 1 ? 's' : ''}` : 'None';

        // Hide form, show confirmation
        this.form.style.display = 'none';
        const confirmationScreen = document.getElementById('junk-confirmation');
        if (confirmationScreen) {
            confirmationScreen.style.display = 'flex';
        }

        // Setup button handlers
        this.setupConfirmationButtons();
    }

    /**
     * Setup button handlers for confirmation screen
     */
    setupConfirmationButtons() {
        // "Submit Another Request" button
        const submitAnotherBtn = document.getElementById('submitAnotherJunkRequest');
        if (submitAnotherBtn) {
            submitAnotherBtn.onclick = () => {
                console.log('🔄 Submit Another Request clicked');
                // Hide confirmation, show form
                document.getElementById('junk-confirmation').style.display = 'none';
                this.form.style.display = 'block';
                // Reset form completely
                this.resetForm();
            };
        }

        // "Back to Home" button
        const backToHomeBtn = document.getElementById('junkBackToHome');
        if (backToHomeBtn) {
            backToHomeBtn.onclick = () => {
                console.log('🏠 Back to Home clicked');
                this.closeModal();
            };
        }

        // Close button in confirmation header
        const closeConfirmationBtn = document.getElementById('closeJunkConfirmation');
        if (closeConfirmationBtn) {
            closeConfirmationBtn.onclick = () => {
                console.log('❌ Confirmation close clicked');
                this.closeModal();
            };
        }
    }
}

// Initialize the junk removal modal after modals are loaded
function initializeJunkRemovalModal() {
    // Create global instance
    window.junkRemovalModal = new JunkRemovalModal();

    // Initialize the modal
    const initialized = window.junkRemovalModal.initializeJunkModal();

    if (initialized) {
        console.log('✅ Junk removal modal system ready');
    } else {
        console.error('❌ Failed to initialize junk removal modal system');
    }
}

// Wait for modals to be loaded by modal-loader.js
document.addEventListener('modalsLoaded', initializeJunkRemovalModal);

// Fallback: If modalsLoaded event already fired or modal-loader not present
document.addEventListener('DOMContentLoaded', function() {
    // Check if modal already exists (direct HTML, not loaded dynamically)
    if (document.getElementById('junkRemovalModal')) {
        initializeJunkRemovalModal();
    }
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = JunkRemovalModal;
}