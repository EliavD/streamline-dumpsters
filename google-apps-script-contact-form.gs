/**
 * ================================================================================
 * STREAMLINE DUMPSTERS - CONTACT FORM HANDLER
 * Google Apps Script for Processing Contact Form Submissions
 * ================================================================================
 *
 * PURPOSE:
 * Receives contact form submissions from your website and sends email notifications
 * directly to your business email. Simple, no spreadsheet required.
 *
 * FEATURES:
 * - CORS enabled for cross-origin requests
 * - Sends formatted email notification for each submission
 * - Input validation and sanitization
 * - Rate limiting protection (basic)
 * - Error handling and logging
 *
 * SETUP INSTRUCTIONS (5 MINUTES):
 * 1. Go to https://script.google.com
 * 2. Click "+ New project"
 * 3. Delete any default code and paste this entire script
 * 4. Update the EMAIL_TO constant below with your business email
 * 5. Click Save (disk icon) and name it "Contact Form Handler"
 * 6. Click Deploy > New deployment
 * 7. Click "Select type" > Web app
 * 8. Set "Execute as" to "Me"
 * 9. Set "Who has access" to "Anyone"
 * 10. Click Deploy and authorize
 * 11. Copy the web app URL - you'll use this in your contact.js file
 *
 * ================================================================================
 */

// ==================== CONFIGURATION ====================

// Your business email address (where contact form submissions will be sent)
const EMAIL_TO = 'StreamlineDumpstersLtd@gmail.com';

// Notification settings
const EMAIL_SUBJECT = 'New Contact Form Submission - Streamline Dumpsters';

// Rate limiting (basic protection - stores in script properties)
const MAX_SUBMISSIONS_PER_EMAIL_PER_HOUR = 3;

// ==================== MAIN HANDLER ====================

/**
 * Handle POST requests from contact form
 */
function doPost(e) {
  try {
    // Log raw incoming data for debugging
    console.log('=== NEW FORM SUBMISSION ===');
    console.log('Content-Type:', e.postData.type);
    console.log('Raw contents:', e.postData.contents);

    // Parse incoming data - handle both regular and text/plain content types
    let data;
    if (e.postData.type === 'text/plain') {
      data = JSON.parse(e.postData.contents);
    } else {
      data = JSON.parse(e.postData.contents);
    }

    console.log('Parsed data:', JSON.stringify(data));

    // Validate required fields
    const validation = validateFormData(data);
    if (!validation.valid) {
      return createResponse(400, {
        success: false,
        message: validation.message
      });
    }

    // Check rate limiting
    if (isRateLimited(data.email)) {
      return createResponse(429, {
        success: false,
        message: 'Too many submissions. Please try again later.'
      });
    }

    // Sanitize input data
    const sanitizedData = sanitizeData(data);

    console.log('Sanitized data:', JSON.stringify(sanitizedData));

    // Send email notification
    const emailResult = sendEmailNotification(sanitizedData);

    console.log('Email result:', JSON.stringify(emailResult));

    if (!emailResult.success) {
      console.error('Email send failed:', emailResult.error);

      // Send alert about email failure
      MailApp.sendEmail({
        to: EMAIL_TO,
        subject: 'ALERT: Contact Form Email Failed to Send',
        body: 'The contact form received a submission but failed to send the notification email.\n\n' +
              'Error: ' + emailResult.error + '\n\n' +
              'Submission data:\n' + JSON.stringify(sanitizedData, null, 2)
      });

      throw new Error('Failed to send email: ' + (emailResult.error || 'Unknown error'));
    }

    // Log successful submission
    logSubmission(sanitizedData);

    console.log('Submission successful - email sent to:', EMAIL_TO);

    // Return success response
    return createResponse(200, {
      success: true,
      message: 'Thank you! Your message has been received.'
    });

  } catch (error) {
    // Log error
    console.error('Contact form error:', error);

    // Send error notification email
    try {
      MailApp.sendEmail({
        to: EMAIL_TO,
        subject: 'ERROR: Contact Form Submission Failed',
        body: 'An error occurred processing a contact form submission:\n\n' +
              'Error: ' + error.toString() + '\n\n' +
              'Stack: ' + error.stack + '\n\n' +
              'Raw data received: ' + JSON.stringify(e.postData)
      });
    } catch (emailError) {
      console.error('Could not send error email:', emailError);
    }

    // Return error response
    return createResponse(500, {
      success: false,
      message: 'An error occurred. Please try again or call us directly.'
    });
  }
}

/**
 * Handle GET requests (for testing)
 */
function doGet(e) {
  return createResponse(200, {
    success: true,
    message: 'Streamline Dumpsters Contact Form API',
    version: '2.0',
    status: 'Email-only mode (no spreadsheet required)'
  });
}

/**
 * Handle OPTIONS requests (CORS preflight)
 */
function doOptions(e) {
  return createResponse(200, {
    success: true,
    message: 'CORS preflight OK'
  });
}

// ==================== VALIDATION ====================

/**
 * Validate form data
 */
function validateFormData(data) {
  // Check required fields
  if (!data.name || !data.name.trim()) {
    return { valid: false, message: 'Name is required' };
  }

  if (!data.email || !data.email.trim()) {
    return { valid: false, message: 'Email is required' };
  }

  if (!data.message || !data.message.trim()) {
    return { valid: false, message: 'Message is required' };
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(data.email)) {
    return { valid: false, message: 'Invalid email format' };
  }

  // Check field lengths
  if (data.name.length > 100) {
    return { valid: false, message: 'Name is too long' };
  }

  if (data.email.length > 254) {
    return { valid: false, message: 'Email is too long' };
  }

  if (data.message.length > 5000) {
    return { valid: false, message: 'Message is too long' };
  }

  return { valid: true };
}

/**
 * Sanitize input data
 */
function sanitizeData(data) {
  return {
    name: stripHtml(data.name).trim().substring(0, 100),
    email: stripHtml(data.email).trim().toLowerCase().substring(0, 254),
    phone: data.phone ? stripHtml(data.phone).trim().substring(0, 20) : '',
    message: stripHtml(data.message).trim().substring(0, 5000),
    timestamp: data.timestamp || new Date().toISOString(),
    source: data.source || 'contact_form',
    userAgent: data.userAgent || 'unknown'
  };
}

/**
 * Strip HTML tags from string
 */
function stripHtml(str) {
  if (!str) return '';
  return str.toString().replace(/<[^>]*>/g, '').replace(/[<>]/g, '');
}

// ==================== RATE LIMITING ====================

/**
 * Check if email has exceeded rate limit
 */
function isRateLimited(email) {
  try {
    const scriptProperties = PropertiesService.getScriptProperties();
    const now = new Date().getTime();
    const oneHourAgo = now - (60 * 60 * 1000);

    // Get submission history for this email
    const key = 'submissions_' + email.toLowerCase();
    const submissionsJson = scriptProperties.getProperty(key);

    if (!submissionsJson) {
      return false; // No previous submissions
    }

    // Parse submission timestamps
    let submissions = JSON.parse(submissionsJson);

    // Filter to only submissions in the last hour
    submissions = submissions.filter(timestamp => timestamp > oneHourAgo);

    // Update the property with filtered list
    scriptProperties.setProperty(key, JSON.stringify(submissions));

    // Check if over limit
    return submissions.length >= MAX_SUBMISSIONS_PER_EMAIL_PER_HOUR;

  } catch (error) {
    console.error('Rate limit check error:', error);
    return false; // Allow submission if check fails
  }
}

/**
 * Log submission timestamp for rate limiting
 */
function logSubmission(data) {
  try {
    const scriptProperties = PropertiesService.getScriptProperties();
    const key = 'submissions_' + data.email.toLowerCase();
    const now = new Date().getTime();

    // Get existing submissions
    const submissionsJson = scriptProperties.getProperty(key);
    let submissions = submissionsJson ? JSON.parse(submissionsJson) : [];

    // Add new timestamp
    submissions.push(now);

    // Keep only last 10 timestamps (cleanup)
    if (submissions.length > 10) {
      submissions = submissions.slice(-10);
    }

    // Save back
    scriptProperties.setProperty(key, JSON.stringify(submissions));

  } catch (error) {
    console.error('Logging error:', error);
    // Non-critical, continue
  }
}

// ==================== EMAIL NOTIFICATION ====================

/**
 * Send email notification
 */
function sendEmailNotification(data) {
  try {
    // Format timestamp
    const timestamp = new Date(data.timestamp);
    const formattedDate = Utilities.formatDate(
      timestamp,
      Session.getScriptTimeZone(),
      'MMMM dd, yyyy \'at\' hh:mm a z'
    );

    // Build email body
    const emailBody = `
You have received a new contact form submission from your website.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONTACT INFORMATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Name:     ${data.name}
Email:    ${data.email}
Phone:    ${data.phone || 'Not provided'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MESSAGE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${data.message}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SUBMISSION DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Submitted:   ${formattedDate}
Source:      ${data.source}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

To reply to this inquiry, simply respond to this email.

--
Streamline Dumpsters Contact Form System
Automated notification - please reply to customer directly
    `.trim();

    // Send email with customer email as reply-to
    MailApp.sendEmail({
      to: EMAIL_TO,
      subject: EMAIL_SUBJECT,
      body: emailBody,
      replyTo: data.email,
      name: 'Streamline Dumpsters Contact Form'
    });

    console.log('Email sent to:', EMAIL_TO);

    return { success: true };

  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error: error.toString() };
  }
}

// ==================== RESPONSE HELPER ====================

/**
 * Create JSON response with CORS headers
 */
function createResponse(statusCode, data) {
  const output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}

// Note: Google Apps Script automatically handles CORS for web apps

// ==================== TEST FUNCTION ====================

/**
 * Test function to verify email sending works
 * Run this manually in Apps Script editor to test email
 */
function testEmailSending() {
  const testData = {
    name: 'Test User',
    email: 'test@example.com',
    phone: '(614) 555-1234',
    message: 'This is a test message from the contact form script.',
    timestamp: new Date().toISOString(),
    source: 'manual_test',
    userAgent: 'test'
  };

  console.log('Testing email send to:', EMAIL_TO);
  const result = sendEmailNotification(testData);
  console.log('Test result:', JSON.stringify(result));

  if (result.success) {
    console.log('✓ Test email sent successfully!');
    console.log('Check your inbox at:', EMAIL_TO);
  } else {
    console.error('✗ Test email failed:', result.error);
  }

  return result;
}
