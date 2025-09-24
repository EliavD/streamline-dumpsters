/**
 * ================================================================================
 * JUNK REMOVAL DEBUG AND TESTING SYSTEM
 * Streamline Dumpsters Ltd. - Comprehensive Debugging and Airtable Integration
 * ================================================================================
 *
 * PURPOSE:
 * - Debug junk removal form submission issues
 * - Test Airtable API integration
 * - Monitor network requests and responses
 * - Provide comprehensive error tracking
 * - Test photo upload functionality
 *
 * FEATURES:
 * - Real-time debugging console
 * - Airtable API testing
 * - Network monitoring
 * - Form state tracking
 * - Error simulation
 * - CORS issue detection
 *
 * ================================================================================
 */

/**
 * AirtableService - Handles all Airtable API interactions
 */
class AirtableService {
  constructor() {
    this.baseId = CONFIG.junkRemoval.AIRTABLE_BASE_ID;
    this.tableName = CONFIG.junkRemoval.AIRTABLE_TABLE_NAME;
    this.apiKey = CONFIG.junkRemoval.AIRTABLE_API_KEY;
    this.apiUrl = `${CONFIG.junkRemoval.AIRTABLE_API_URL}/${this.baseId}/${encodeURIComponent(this.tableName)}`;
    this.fieldMapping = CONFIG.junkRemoval.AIRTABLE_FIELDS;

    this.debugLogger = new DebugLogger('AirtableService');
    this.debugLogger.log('AirtableService initialized', {
      baseId: this.baseId,
      tableName: this.tableName,
      apiUrl: this.apiUrl,
      hasApiKey: !!this.apiKey && this.apiKey !== 'PLACEHOLDER_API_KEY'
    });
  }

  async testConnection() {
    this.debugLogger.log('Testing Airtable connection...');

    try {
      // Check configuration
      if (!this.baseId || this.baseId === 'PLACEHOLDER_BASE_ID') {
        throw new Error('Airtable Base ID not configured');
      }

      if (!this.apiKey || this.apiKey === 'PLACEHOLDER_API_KEY') {
        throw new Error('Airtable API Key not configured');
      }

      // Test API connectivity with a simple GET request
      const response = await fetch(this.apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      this.debugLogger.log('Connection test response', {
        status: response.status,
        statusText: response.statusText,
        headers: this.getResponseHeaders(response)
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`API Error ${response.status}: ${errorData}`);
      }

      const data = await response.json();
      this.debugLogger.log('Connection test successful', data);

      return {
        success: true,
        message: 'Successfully connected to Airtable',
        data: data
      };

    } catch (error) {
      this.debugLogger.error('Connection test failed', error);

      // Detect common error types
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        return {
          success: false,
          error: 'CORS_ERROR',
          message: 'CORS error - Airtable API blocked by browser',
          suggestion: 'Use a CORS proxy or server-side API'
        };
      }

      return {
        success: false,
        error: error.name,
        message: error.message,
        suggestion: 'Check API key and base ID configuration'
      };
    }
  }

  async createRecord(formData) {
    this.debugLogger.log('Creating Airtable record', formData);

    try {
      // Validate configuration
      const connectionTest = await this.testConnection();
      if (!connectionTest.success) {
        throw new Error(`Connection failed: ${connectionTest.message}`);
      }

      // Prepare record data
      const recordData = this.prepareRecordData(formData);
      this.debugLogger.log('Prepared record data', recordData);

      // Create the record
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fields: recordData
        })
      });

      this.debugLogger.log('Create record response', {
        status: response.status,
        statusText: response.statusText,
        headers: this.getResponseHeaders(response)
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Failed to create record: ${response.status} ${errorData}`);
      }

      const result = await response.json();
      this.debugLogger.log('Record created successfully', result);

      return {
        success: true,
        recordId: result.id,
        data: result
      };

    } catch (error) {
      this.debugLogger.error('Failed to create record', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  prepareRecordData(formData) {
    const record = {};

    // Map form fields to Airtable fields (using actual field names)
    record['Name'] = formData.customerName || '';
    record['email'] = formData.customerEmail || '';
    record['Phone number'] = formData.customerPhone || '';

    // Combine address components into single Address field
    const addressComponents = [
      formData.serviceAddress || '',
      formData.serviceCity || '',
      formData.serviceZip || ''
    ].filter(component => component.trim() !== '');
    record['Address'] = addressComponents.join(', ');

    // Handle photos (convert to Airtable attachment format)
    if (formData.photos && formData.photos.length > 0) {
      record['Photos'] = formData.photos.map(photo => ({
        filename: photo.name,
        type: photo.type,
        size: photo.size
      }));
    }

    return record;
  }

  getResponseHeaders(response) {
    const headers = {};
    for (const [key, value] of response.headers.entries()) {
      headers[key] = value;
    }
    return headers;
  }

  async uploadAttachments(files) {
    this.debugLogger.log('Uploading attachments to Airtable', {
      fileCount: files.length,
      files: files.map(f => ({ name: f.name, size: f.size, type: f.type }))
    });

    // Note: Airtable requires attachments to be uploaded to a URL first
    // This is a placeholder for the actual implementation
    try {
      const attachments = [];

      for (const file of files) {
        // Convert file to base64 for demo purposes
        const base64 = await this.fileToBase64(file);
        attachments.push({
          filename: file.name,
          type: file.type,
          size: file.size,
          content: base64.substring(0, 100) + '...' // Truncated for logging
        });
      }

      this.debugLogger.log('Attachments processed', { count: attachments.length });
      return attachments;

    } catch (error) {
      this.debugLogger.error('Failed to upload attachments', error);
      throw error;
    }
  }

  fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
}

/**
 * DebugLogger - Enhanced logging system
 */
class DebugLogger {
  constructor(component) {
    this.component = component;
    this.logLevel = CONFIG.junkRemoval.DEBUG.LOG_LEVEL;
    this.enableConsoleLogging = CONFIG.junkRemoval.DEBUG.ENABLE_CONSOLE_LOGGING;
    this.logs = [];
  }

  log(message, data = null) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      component: this.component,
      level: 'INFO',
      message,
      data
    };

    this.logs.push(logEntry);
    this.outputToConsole(logEntry);
    this.outputToDebugPanel(logEntry);
  }

  error(message, error) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      component: this.component,
      level: 'ERROR',
      message,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      }
    };

    this.logs.push(logEntry);
    this.outputToConsole(logEntry);
    this.outputToDebugPanel(logEntry);
  }

  warn(message, data = null) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      component: this.component,
      level: 'WARN',
      message,
      data
    };

    this.logs.push(logEntry);
    this.outputToConsole(logEntry);
    this.outputToDebugPanel(logEntry);
  }

  outputToConsole(logEntry) {
    if (!this.enableConsoleLogging) return;

    const style = {
      'INFO': 'color: #2563eb',
      'WARN': 'color: #f59e0b',
      'ERROR': 'color: #ef4444'
    };

    console.log(
      `%c[${logEntry.timestamp}] ${logEntry.component}: ${logEntry.message}`,
      style[logEntry.level] || 'color: #6b7280'
    );

    if (logEntry.data) {
      console.log('Data:', logEntry.data);
    }

    if (logEntry.error) {
      console.error('Error:', logEntry.error);
    }
  }

  outputToDebugPanel(logEntry) {
    const debugConsole = document.getElementById('debugConsole');
    if (!debugConsole) return;

    const logElement = document.createElement('div');
    logElement.className = `debug-log-entry debug-log-${logEntry.level.toLowerCase()}`;

    const timestamp = new Date(logEntry.timestamp).toLocaleTimeString();
    logElement.innerHTML = `
      <span class="debug-timestamp">${timestamp}</span>
      <span class="debug-component">[${logEntry.component}]</span>
      <span class="debug-message">${logEntry.message}</span>
    `;

    if (logEntry.data || logEntry.error) {
      const details = document.createElement('pre');
      details.className = 'debug-details';
      details.textContent = JSON.stringify(logEntry.data || logEntry.error, null, 2);
      logElement.appendChild(details);
    }

    debugConsole.appendChild(logElement);
    debugConsole.scrollTop = debugConsole.scrollHeight;
  }

  getLogs() {
    return this.logs;
  }

  clearLogs() {
    this.logs = [];
  }
}

/**
 * JunkRemovalDebugger - Main debugging controller
 */
class JunkRemovalDebugger {
  constructor() {
    this.airtableService = new AirtableService();
    this.debugLogger = new DebugLogger('JunkRemovalDebugger');
    this.networkMonitor = new NetworkMonitor();
    this.formStateTracker = new FormStateTracker();

    this.debugLogger.log('JunkRemovalDebugger initialized');
  }

  // Connection Tests
  async testAirtableConnection() {
    this.debugLogger.log('Starting Airtable connection test');
    const result = await this.airtableService.testConnection();

    if (result.success) {
      this.showTestResult('Airtable Connection', 'SUCCESS', result.message);
    } else {
      this.showTestResult('Airtable Connection', 'FAILED', result.message, result.suggestion);
    }

    return result;
  }

  async testNetworkConnectivity() {
    this.debugLogger.log('Testing network connectivity');

    try {
      // Test basic internet connectivity
      const response = await fetch('https://httpbin.org/get', {
        method: 'GET',
        mode: 'cors'
      });

      if (response.ok) {
        this.showTestResult('Network Connectivity', 'SUCCESS', 'Internet connection is working');
        return { success: true };
      } else {
        throw new Error(`Network test failed: ${response.status}`);
      }

    } catch (error) {
      this.debugLogger.error('Network test failed', error);
      this.showTestResult('Network Connectivity', 'FAILED', error.message);
      return { success: false, error: error.message };
    }
  }

  async checkCORSIssues() {
    this.debugLogger.log('Checking for CORS issues');

    try {
      // Test CORS with Airtable API
      const corsTest = await fetch(CONFIG.junkRemoval.AIRTABLE_API_URL, {
        method: 'GET',
        mode: 'cors'
      });

      this.showTestResult('CORS Check', 'SUCCESS', 'No CORS issues detected');
      return { success: true };

    } catch (error) {
      if (error.name === 'TypeError' && error.message.includes('CORS')) {
        this.showTestResult('CORS Check', 'FAILED', 'CORS issue detected', 'Use server-side proxy or enable CORS in Airtable');
        return { success: false, error: 'CORS_ERROR' };
      } else {
        this.showTestResult('CORS Check', 'WARNING', `Unexpected error: ${error.message}`);
        return { success: false, error: error.message };
      }
    }
  }

  // Form Tests
  fillTestData() {
    this.debugLogger.log('Filling form with test data');

    const testData = {
      customerName: 'John Doe Test',
      customerEmail: 'john.doe.test@example.com',
      customerPhone: '(555) 123-4567',
      serviceAddress: '123 Test Street',
      serviceCity: 'Dublin',
      serviceZip: '43016',
      junkDescription: 'Test furniture removal - sofa, chairs, table',
      additionalNotes: 'Second floor apartment - elevator available'
    };

    // Fill form fields
    for (const [field, value] of Object.entries(testData)) {
      const input = document.querySelector(`[name="${field}"]`);
      if (input) {
        input.value = value;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('blur', { bubbles: true }));
      }
    }

    this.debugLogger.log('Test data filled successfully', testData);
    this.showTestResult('Fill Test Data', 'SUCCESS', 'Form filled with test data');
  }

  async testFormValidation() {
    this.debugLogger.log('Testing form validation');

    try {
      const modal = window.junkRemovalModal;
      if (!modal) {
        throw new Error('JunkRemovalModal not available');
      }

      // Get form data
      const formData = modal.collectFormData();
      this.debugLogger.log('Collected form data', formData);

      // Test validation
      const validationResult = modal.validator.validateForm(formData, modal.photoManager);
      this.debugLogger.log('Validation result', validationResult);

      if (validationResult.isValid) {
        this.showTestResult('Form Validation', 'SUCCESS', 'All fields are valid');
      } else {
        const errors = Object.entries(validationResult.fieldResults)
          .filter(([_, result]) => !result.isValid)
          .map(([field, result]) => `${field}: ${result.errors.join(', ')}`)
          .join('; ');

        this.showTestResult('Form Validation', 'FAILED', `Validation errors: ${errors}`);
      }

      return validationResult;

    } catch (error) {
      this.debugLogger.error('Form validation test failed', error);
      this.showTestResult('Form Validation', 'ERROR', error.message);
      return { success: false, error: error.message };
    }
  }

  async testFormSubmission() {
    this.debugLogger.log('Testing complete form submission flow');

    try {
      const modal = window.junkRemovalModal;
      if (!modal) {
        throw new Error('JunkRemovalModal not available');
      }

      // Collect and validate form data
      const formData = modal.collectFormData();
      const validationResult = modal.validator.validateForm(formData, modal.photoManager);

      if (!validationResult.isValid) {
        throw new Error('Form validation failed');
      }

      // Test Airtable submission
      const submissionResult = await this.airtableService.createRecord(formData);

      if (submissionResult.success) {
        this.showTestResult('Form Submission', 'SUCCESS', `Record created with ID: ${submissionResult.recordId}`);
      } else {
        this.showTestResult('Form Submission', 'FAILED', submissionResult.error);
      }

      return submissionResult;

    } catch (error) {
      this.debugLogger.error('Form submission test failed', error);
      this.showTestResult('Form Submission', 'ERROR', error.message);
      return { success: false, error: error.message };
    }
  }

  // Photo Tests
  createTestImages() {
    this.debugLogger.log('Creating test images');

    // Create a simple test image as blob
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 150;
    const ctx = canvas.getContext('2d');

    // Draw a simple test pattern
    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(0, 0, 200, 150);
    ctx.fillStyle = '#ffffff';
    ctx.font = '20px Arial';
    ctx.fillText('Test Image', 50, 80);

    canvas.toBlob((blob) => {
      // Create a File object
      const testFile = new File([blob], 'test-image.png', { type: 'image/png' });

      // Add to photo manager
      const modal = window.junkRemovalModal;
      if (modal && modal.photoManager) {
        modal.photoManager.handleFiles([testFile]);
        this.debugLogger.log('Test image created and added', {
          name: testFile.name,
          size: testFile.size,
          type: testFile.type
        });
        this.showTestResult('Create Test Images', 'SUCCESS', 'Test image created and uploaded');
      }
    }, 'image/png');
  }

  testPhotoUpload() {
    this.debugLogger.log('Testing photo upload system');

    const modal = window.junkRemovalModal;
    if (!modal || !modal.photoManager) {
      this.showTestResult('Photo Upload', 'ERROR', 'Photo manager not available');
      return;
    }

    const photoManager = modal.photoManager;
    const uploadedFiles = photoManager.getUploadedFiles();

    this.debugLogger.log('Photo upload status', {
      fileCount: uploadedFiles.length,
      maxFiles: photoManager.maxFiles,
      files: uploadedFiles.map(f => ({ name: f.name, size: f.size, type: f.type }))
    });

    if (uploadedFiles.length > 0) {
      this.showTestResult('Photo Upload', 'SUCCESS', `${uploadedFiles.length} photos uploaded successfully`);
    } else {
      this.showTestResult('Photo Upload', 'WARNING', 'No photos uploaded - use "Create Test Images" first');
    }
  }

  testFileValidation() {
    this.debugLogger.log('Testing file validation');

    const modal = window.junkRemovalModal;
    if (!modal || !modal.photoManager) {
      this.showTestResult('File Validation', 'ERROR', 'Photo manager not available');
      return;
    }

    const photoManager = modal.photoManager;

    // Test valid file
    const validFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const validResult = photoManager.validateFile(validFile);

    // Test invalid file type
    const invalidFile = new File(['test'], 'test.txt', { type: 'text/plain' });
    const invalidResult = photoManager.validateFile(invalidFile);

    // Test oversized file
    const oversizedFile = new File([new ArrayBuffer(20 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' });
    const oversizedResult = photoManager.validateFile(oversizedFile);

    this.debugLogger.log('File validation results', {
      validFile: validResult,
      invalidFile: invalidResult,
      oversizedFile: oversizedResult
    });

    if (validResult && !invalidResult && !oversizedResult) {
      this.showTestResult('File Validation', 'SUCCESS', 'File validation working correctly');
    } else {
      this.showTestResult('File Validation', 'FAILED', 'File validation not working as expected');
    }
  }

  // Utility Methods
  showFormState() {
    const modal = window.junkRemovalModal;
    if (!modal) {
      this.debugLogger.error('JunkRemovalModal not available');
      return;
    }

    const formData = modal.collectFormData();
    const photoState = {
      hasPhotos: modal.photoManager.hasFiles(),
      photoCount: modal.photoManager.getFileCount(),
      photos: modal.photoManager.getUploadedFiles().map(f => ({
        name: f.name,
        size: f.size,
        type: f.type
      }))
    };

    const state = {
      formData,
      photoState,
      modalState: {
        isOpen: modal.isOpen,
        hasModal: !!modal.modal,
        hasForm: !!modal.form
      }
    };

    this.debugLogger.log('Current form state', state);

    // Display in form state panel
    const formStateDisplay = document.getElementById('formStateDisplay');
    if (formStateDisplay) {
      formStateDisplay.textContent = JSON.stringify(state, null, 2);
    }
  }

  showPhotoState() {
    const modal = window.junkRemovalModal;
    if (!modal || !modal.photoManager) {
      this.debugLogger.error('Photo manager not available');
      return;
    }

    const photoManager = modal.photoManager;
    const photoState = {
      hasFiles: photoManager.hasFiles(),
      fileCount: photoManager.getFileCount(),
      maxFiles: photoManager.maxFiles,
      maxFileSize: photoManager.maxFileSize,
      allowedTypes: photoManager.allowedTypes,
      uploadedFiles: photoManager.getUploadedFiles().map(f => ({
        name: f.name,
        size: f.size,
        type: f.type,
        lastModified: f.lastModified
      }))
    };

    this.debugLogger.log('Current photo state', photoState);

    // Display in form state panel
    const formStateDisplay = document.getElementById('formStateDisplay');
    if (formStateDisplay) {
      formStateDisplay.textContent = JSON.stringify(photoState, null, 2);
    }
  }

  exportDebugData() {
    const debugData = {
      timestamp: new Date().toISOString(),
      config: CONFIG.junkRemoval,
      logs: this.debugLogger.getLogs(),
      networkLogs: this.networkMonitor.getLogs(),
      formState: this.getFormState()
    };

    const blob = new Blob([JSON.stringify(debugData, null, 2)], {
      type: 'application/json'
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `junk-removal-debug-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    this.debugLogger.log('Debug data exported');
    this.showTestResult('Export Debug Data', 'SUCCESS', 'Debug data exported successfully');
  }

  getFormState() {
    try {
      const modal = window.junkRemovalModal;
      if (!modal) return null;

      return {
        formData: modal.collectFormData(),
        photoState: {
          hasFiles: modal.photoManager.hasFiles(),
          fileCount: modal.photoManager.getFileCount()
        },
        modalState: {
          isOpen: modal.isOpen
        }
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  showTestResult(testName, status, message, suggestion = null) {
    const debugConsole = document.getElementById('debugConsole');
    if (!debugConsole) return;

    const resultElement = document.createElement('div');
    resultElement.className = `test-result test-result-${status.toLowerCase()}`;

    const statusIcon = {
      'SUCCESS': '✅',
      'FAILED': '❌',
      'ERROR': '💥',
      'WARNING': '⚠️'
    }[status] || 'ℹ️';

    resultElement.innerHTML = `
      <div class="test-result-header">
        <span class="test-result-icon">${statusIcon}</span>
        <strong>${testName}: ${status}</strong>
      </div>
      <div class="test-result-message">${message}</div>
      ${suggestion ? `<div class="test-result-suggestion">💡 ${suggestion}</div>` : ''}
    `;

    debugConsole.appendChild(resultElement);
    debugConsole.scrollTop = debugConsole.scrollHeight;
  }

  clearDebugLog() {
    const debugConsole = document.getElementById('debugConsole');
    if (debugConsole) {
      debugConsole.innerHTML = '<div class="debug-log-entry">Debug log cleared</div>';
    }

    this.debugLogger.clearLogs();
    this.networkMonitor.clearLogs();
  }
}

/**
 * NetworkMonitor - Monitor network requests
 */
class NetworkMonitor {
  constructor() {
    this.logs = [];
    this.setupNetworkMonitoring();
  }

  setupNetworkMonitoring() {
    // Override fetch to monitor requests
    const originalFetch = window.fetch;

    window.fetch = async (...args) => {
      const startTime = Date.now();
      const [url, options] = args;

      this.logRequest(url, options);

      try {
        const response = await originalFetch(...args);
        const endTime = Date.now();

        this.logResponse(url, response, endTime - startTime);

        return response;
      } catch (error) {
        const endTime = Date.now();
        this.logError(url, error, endTime - startTime);
        throw error;
      }
    };
  }

  logRequest(url, options) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      type: 'REQUEST',
      url,
      method: options?.method || 'GET',
      headers: options?.headers || {},
      body: options?.body
    };

    this.logs.push(logEntry);
    this.outputToNetworkPanel(logEntry);
  }

  logResponse(url, response, duration) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      type: 'RESPONSE',
      url,
      status: response.status,
      statusText: response.statusText,
      duration: `${duration}ms`
    };

    this.logs.push(logEntry);
    this.outputToNetworkPanel(logEntry);
  }

  logError(url, error, duration) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      type: 'ERROR',
      url,
      error: error.message,
      duration: `${duration}ms`
    };

    this.logs.push(logEntry);
    this.outputToNetworkPanel(logEntry);
  }

  outputToNetworkPanel(logEntry) {
    const networkLog = document.getElementById('networkLog');
    if (!networkLog) return;

    const logElement = document.createElement('div');
    logElement.className = `network-log-entry network-log-${logEntry.type.toLowerCase()}`;

    const timestamp = new Date(logEntry.timestamp).toLocaleTimeString();

    if (logEntry.type === 'REQUEST') {
      logElement.innerHTML = `
        <span class="network-timestamp">${timestamp}</span>
        <span class="network-method">${logEntry.method}</span>
        <span class="network-url">${logEntry.url}</span>
      `;
    } else if (logEntry.type === 'RESPONSE') {
      logElement.innerHTML = `
        <span class="network-timestamp">${timestamp}</span>
        <span class="network-status status-${Math.floor(logEntry.status / 100)}xx">${logEntry.status}</span>
        <span class="network-duration">${logEntry.duration}</span>
        <span class="network-url">${logEntry.url}</span>
      `;
    } else if (logEntry.type === 'ERROR') {
      logElement.innerHTML = `
        <span class="network-timestamp">${timestamp}</span>
        <span class="network-error">ERROR</span>
        <span class="network-duration">${logEntry.duration}</span>
        <span class="network-url">${logEntry.url}</span>
        <span class="network-error-message">${logEntry.error}</span>
      `;
    }

    networkLog.appendChild(logElement);
    networkLog.scrollTop = networkLog.scrollHeight;
  }

  getLogs() {
    return this.logs;
  }

  clearLogs() {
    this.logs = [];
    const networkLog = document.getElementById('networkLog');
    if (networkLog) {
      networkLog.innerHTML = '<div class="network-log-entry">Network log cleared</div>';
    }
  }
}

/**
 * FormStateTracker - Track form state changes
 */
class FormStateTracker {
  constructor() {
    this.states = [];
    this.debugLogger = new DebugLogger('FormStateTracker');
  }

  trackState(formData) {
    const state = {
      timestamp: new Date().toISOString(),
      formData: JSON.parse(JSON.stringify(formData))
    };

    this.states.push(state);
    this.debugLogger.log('Form state tracked', state);
  }

  getStates() {
    return this.states;
  }

  clearStates() {
    this.states = [];
  }
}

// Global debugging instance
window.junkRemovalDebugger = null;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  // Only initialize if debug configuration is enabled
  if (CONFIG.junkRemoval.DEBUG.ENABLE_CONSOLE_LOGGING) {
    window.junkRemovalDebugger = new JunkRemovalDebugger();
    console.log('🐛 JunkRemovalDebugger initialized and ready');
  }
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    AirtableService,
    DebugLogger,
    JunkRemovalDebugger,
    NetworkMonitor,
    FormStateTracker
  };
}