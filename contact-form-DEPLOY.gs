/**
 * ================================================================================
 * STREAMLINE DUMPSTERS — CONTACT FORM HANDLER  (PRODUCTION / DEPLOY THIS ONE)
 * ================================================================================
 *
 * This REPLACES the old "SIMPLE DEBUG VERSION". Differences:
 *   - No more "DEBUG: Form Submission Received" email on every submit.
 *   - Sends ONE clean notification email per submission (faster response,
 *     which is what was tripping the browser's timeout).
 *   - Basic validation; returns { success: false, message } on bad input so the
 *     website can show a proper error instead of a false "sent!" message.
 *   - Removed the non-functional CORS header code (ContentService can't set
 *     those headers; public web apps already return permissive CORS).
 *
 * TO DEPLOY:
 *   1. Paste this over the ENTIRE contents of the contact-form Apps Script.
 *   2. Deploy > Manage deployments > edit the active Web app deployment >
 *      "New version" > Deploy.  (Editing the code alone does nothing until you
 *      cut a new version of the SAME deployment, so the /exec URL stays the same.)
 *   3. Confirm "Execute as: Me" and "Who has access: Anyone".
 * ================================================================================
 */

// Where contact-form notifications are sent.
const EMAIL_TO = 'StreamlineDumpstersLtd@gmail.com';

// Subject line for the notification email.
const EMAIL_SUBJECT = 'New Contact Form Submission - Streamline Dumpsters';

/**
 * Handle POST requests from the website contact form.
 */
function doPost(e) {
  try {
    // The site sends JSON as text/plain; parse it.
    const data = JSON.parse(e.postData.contents);

    // Validate required fields.
    const problem = validate(data);
    if (problem) {
      return jsonResponse({ success: false, message: problem });
    }

    // Send the notification email to the business.
    MailApp.sendEmail({
      to: EMAIL_TO,
      subject: EMAIL_SUBJECT,
      replyTo: data.email,
      name: 'Streamline Dumpsters Contact Form',
      body:
        'You have received a new contact form submission.\n\n' +
        'Name:    ' + data.name + '\n' +
        'Email:   ' + data.email + '\n' +
        'Phone:   ' + (data.phone || 'Not provided') + '\n\n' +
        'Message:\n' + data.message + '\n\n' +
        '--\n' +
        'Reply directly to this email to respond to the customer.'
    });

    return jsonResponse({
      success: true,
      message: 'Thank you! Your message has been received.'
    });

  } catch (error) {
    // On a real failure, alert the owner (this does NOT fire on every submit —
    // only when something actually breaks).
    try {
      MailApp.sendEmail({
        to: EMAIL_TO,
        subject: 'ERROR: Contact Form Failed',
        body: 'Error: ' + error.toString() + '\n\n' +
              'Stack: ' + (error.stack || 'n/a') + '\n\n' +
              'Raw data: ' + (e && e.postData ? e.postData.contents : 'none')
      });
    } catch (err2) {
      console.error('Error-alert email failed:', err2);
    }

    return jsonResponse({
      success: false,
      message: 'An error occurred. Please try again or call us directly.'
    });
  }
}

/**
 * Basic required-field / format validation.
 * Returns an error message string if invalid, or null if OK.
 */
function validate(data) {
  if (!data || !data.name || !data.name.trim())       return 'Name is required.';
  if (!data.email || !data.email.trim())              return 'Email is required.';
  if (!data.message || !data.message.trim())          return 'Message is required.';

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email);
  if (!emailOk)                                       return 'Please enter a valid email address.';

  if (data.name.length > 100)                         return 'Name is too long.';
  if (data.email.length > 254)                        return 'Email is too long.';
  if (data.message.length > 5000)                     return 'Message is too long.';

  return null;
}

/**
 * Health check / manual test in the browser.
 */
function doGet(e) {
  return ContentService.createTextOutput('Streamline Dumpsters Contact Form — Ready');
}

/**
 * CORS preflight (harmless; simple text/plain POSTs don't trigger one).
 */
function doOptions(e) {
  return ContentService.createTextOutput('OK');
}

/**
 * Helper: JSON response.
 * NOTE: Apps Script web apps always return HTTP 200 regardless of content, so
 * the website relies on the "success" field in this body — not the status code.
 */
function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
