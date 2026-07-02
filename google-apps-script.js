/**
 * GOOGLE APPS SCRIPT - WITH SQUARE PAYMENT PROCESSING
 * Updated: 2025-11-18 - Enhanced security with Script Properties
 *
 * SETUP INSTRUCTIONS:
 * 1. Go to https://script.google.com
 * 2. Open your booking script
 * 3. Replace ALL code with this file
 * 4. Save (Ctrl+S or Cmd+S)
 * 5. Run setupScriptProperties() ONCE to store credentials securely
 * 6. Deploy > Manage deployments > Edit > New version > Deploy
 * 7. Copy the new Web App URL to your website config
 */

// =============================================================================
// CONFIGURATION - SECURE CREDENTIALS
// =============================================================================

/**
 * Get credentials from Script Properties (secure storage)
 * These functions retrieve sensitive data that should NOT be hardcoded
 */
function getSquareAccessToken() {
  return PropertiesService.getScriptProperties().getProperty('SQUARE_ACCESS_TOKEN');
}

function getSquareLocationId() {
  return PropertiesService.getScriptProperties().getProperty('SQUARE_LOCATION_ID');
}

function getSheetId() {
  return PropertiesService.getScriptProperties().getProperty('SHEET_ID');
}

function getCalendarId() {
  return PropertiesService.getScriptProperties().getProperty('CALENDAR_ID');
}

// Non-sensitive configuration (safe to keep as constants)
const SHEET_NAME = 'Sl-Dumpsters Bookings';
const SQUARE_API_VERSION = '2024-01-18';
const MAX_BOOKINGS_PER_DATE = 3;
const BOOKING_PRICE_CENTS = 32292; // $322.92 (subtotal $299 + tax $23.92)

// For backward compatibility, keep these as variable names
// (they now fetch from Script Properties instead of being hardcoded)
const SQUARE_ACCESS_TOKEN = getSquareAccessToken();
const SQUARE_LOCATION_ID = getSquareLocationId();
const SHEET_ID = getSheetId();
const CALENDAR_ID = getCalendarId();

// =============================================================================
// HTTP HANDLERS
// =============================================================================

/**
 * Handle GET requests (availability checks and JSONP bookings)
 */
function doGet(e) {
  Logger.log("=== doGet START ===");

  if (!e || !e.parameter) {
    e = { parameter: {} };
  }

  Logger.log("Parameters: " + JSON.stringify(e.parameter));

  try {
    var result;

    // Handle JSONP booking submission
    if (e.parameter.callback && e.parameter.data) {
      Logger.log("=== JSONP BOOKING REQUEST ===");
      var bookingData = JSON.parse(e.parameter.data);
      Logger.log("Booking data: " + JSON.stringify(bookingData));

      // Process booking (same logic as doPost)
      result = processBooking(bookingData);

      // Return JSONP response
      var jsonpResponse = e.parameter.callback + '(' + JSON.stringify(result) + ');';
      return ContentService.createTextOutput(jsonpResponse)
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }

    if (e.parameter.action === "getFullyBooked") {
      Logger.log("Action: getFullyBooked");
      result = getFullyBookedDates();
    } else {
      var calendar = CalendarApp.getCalendarById(CALENDAR_ID);

      if (!calendar) {
        throw new Error("Calendar not found");
      }

      var start = e.parameter.start;
      var end = e.parameter.end;

      if (!start || !end) {
        throw new Error("Missing parameters");
      }

      var startDate = new Date(start + 'T00:00:00');
      var endDate = new Date(end + 'T00:00:00');
      endDate.setDate(endDate.getDate() + 1);

      var events = calendar.getEvents(startDate, endDate);

      result = {
        status: "ok",
        overlapping: events.length,
        available: events.length < MAX_BOOKINGS_PER_DATE,
        message: events.length >= MAX_BOOKINGS_PER_DATE ? "Fully booked" : "Available"
      };
    }

    // Return JSONP if callback parameter is present, otherwise return JSON
    if (e.parameter.callback) {
      var jsonpResponse = e.parameter.callback + '(' + JSON.stringify(result) + ');';
      return ContentService.createTextOutput(jsonpResponse)
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    } else {
      var output = ContentService.createTextOutput(JSON.stringify(result));
      output.setMimeType(ContentService.MimeType.JSON);
      return output;
    }

  } catch (error) {
    Logger.log("ERROR: " + error.message);

    // If it's a JSONP request, return error as JSONP
    if (e.parameter.callback) {
      var errorResponse = {
        status: "error",
        message: error.message
      };
      var jsonpError = e.parameter.callback + '(' + JSON.stringify(errorResponse) + ');';
      return ContentService.createTextOutput(jsonpError)
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }

    return createErrorResponse(error.message);
  }
}

/**
 * Handle OPTIONS requests (CORS preflight)
 * Note: Google Apps Script doesn't expose request headers in doOptions,
 * so we use wildcard origin for preflight requests
 */
function doOptions() {
  Logger.log("=== doOptions START (CORS preflight) ===");

  var output = ContentService.createTextOutput('');
  output.setMimeType(ContentService.MimeType.TEXT);
  output.setHeader('Access-Control-Allow-Origin', '*');
  output.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  output.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  output.setHeader('Access-Control-Max-Age', '86400');

  Logger.log("=== doOptions END ===");
  return output;
}

/**
 * Validate booking data with detailed error messages
 * @param {object} data - Booking data to validate
 * @throws {Error} If validation fails with specific message
 */
function validateBookingData(data) {
  Logger.log("🔍 Validating booking data...");

  // Payment token
  if (!data.payment_token || data.payment_token.trim() === '') {
    throw new Error("Payment information is missing. Please try again.");
  }

  // Customer name
  if (!data.name || data.name.trim() === '') {
    throw new Error("Customer name is required. Please enter your name.");
  }

  // Email validation
  if (!data.email || data.email.trim() === '') {
    throw new Error("Email address is required. Please enter your email.");
  }

  var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(data.email)) {
    throw new Error("Invalid email address. Please enter a valid email.");
  }

  // Delivery date validation
  if (!data.delivery_date || data.delivery_date.trim() === '') {
    throw new Error("Delivery date is required. Please select a delivery date.");
  }

  // Check date format (YYYY-MM-DD)
  var dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(data.delivery_date)) {
    throw new Error("Delivery date must be in YYYY-MM-DD format.");
  }

  // Pickup date validation
  if (!data.pickup_date || data.pickup_date.trim() === '') {
    throw new Error("Pickup date is required. Please select a pickup date.");
  }

  if (!dateRegex.test(data.pickup_date)) {
    throw new Error("Pickup date must be in YYYY-MM-DD format.");
  }

  // Validate pickup is after delivery
  var deliveryDate = new Date(data.delivery_date);
  var pickupDate = new Date(data.pickup_date);

  if (isNaN(deliveryDate.getTime())) {
    throw new Error("Invalid delivery date. Please select a valid date.");
  }

  if (isNaN(pickupDate.getTime())) {
    throw new Error("Invalid pickup date. Please select a valid date.");
  }

  if (pickupDate < deliveryDate) {
    throw new Error("Pickup date must be on or after delivery date.");
  }

  // Validate delivery address
  if (!data.dropoff_address || data.dropoff_address.trim() === '') {
    throw new Error("Delivery address is required. Please enter a delivery address.");
  }

  // Validate city
  if (!data.dropoff_city || data.dropoff_city.trim() === '') {
    throw new Error("City is required. Please enter a city.");
  }

  Logger.log("✅ Booking data validation passed");
  return true;
}

/**
 * Process booking (shared by doPost and doGet/JSONP)
 */
function processBooking(data) {
  Logger.log("=== processBooking START ===");
  Logger.log("Booking data: " + JSON.stringify(data));

  // Validate Script Properties are configured
  validateScriptProperties();

  // Validate booking data with detailed error messages
  validateBookingData(data);

  // Step 1: Process payment with Square
  Logger.log("Step 1: Processing payment...");
  var paymentResult = processSquarePayment(
    data.payment_token,
    data.amount_cents || BOOKING_PRICE_CENTS,
    data
  );

  if (!paymentResult.success) {
    Logger.log("Payment failed: " + paymentResult.error);
    throw new Error("Payment failed: " + paymentResult.error);
  }

  Logger.log("Payment successful: " + paymentResult.payment_id);

  // Payment succeeded - now wrap remaining operations in try-catch for automatic refund
  var paymentId = paymentResult.payment_id;
  var amountCharged = data.amount_cents || BOOKING_PRICE_CENTS;

  try {
    // Step 2: Create calendar event
    Logger.log("Step 2: Creating calendar event...");
    var calendar = CalendarApp.getCalendarById(CALENDAR_ID);

    if (!calendar) {
      throw new Error("Unable to access calendar. Calendar not found.");
    }

    // Parse the time slot (e.g., "07:00-09:00" -> start: 07:00, end: 09:00)
    var timeSlot = data.time || data.timeSlot || "07:00-09:00";
    var timeParts = timeSlot.split("-");
    var startTime = timeParts[0] || "07:00";
    var endTime = timeParts[1] || "09:00";

    // Create event with specific time slot on delivery date
    var eventStart = new Date(data.delivery_date + 'T' + startTime + ':00');
    var eventEnd = new Date(data.delivery_date + 'T' + endTime + ':00');

    var event = calendar.createEvent(
      "Dumpster Rental - " + data.name,
      eventStart,
      eventEnd,
      {
        description: buildEventDescription(data, paymentId),
        location: data.dropoff_address + ", " + data.dropoff_city
      }
    );

    Logger.log("Calendar event created: " + event.getId());

    // Step 3: Log to Google Sheet
    Logger.log("Step 3: Logging to sheet...");
    logBookingToSheet(data, paymentId);

    // Step 4: Send confirmation email
    Logger.log("Step 4: Sending confirmation email...");
    sendConfirmationEmail(data, paymentId);

    // Return success response
    var response = {
      status: "success",
      message: "Booking confirmed and payment processed",
      booking_id: event.getId(),
      payment_id: paymentId,
      amount_paid: amountCharged / 100,
      currency: "USD"
    };

    Logger.log("=== processBooking SUCCESS ===");
    return response;

  } catch (postPaymentError) {
    // CRITICAL: Payment succeeded but booking failed - initiate automatic refund
    Logger.log("❌ POST-PAYMENT ERROR: " + postPaymentError.message);
    Logger.log("⚠️ Payment was charged but booking failed - initiating automatic refund");

    var refundResult = refundSquarePayment(
      paymentId,
      "Automatic refund: Booking failed after payment - " + postPaymentError.message,
      amountCharged
    );

    if (refundResult.success) {
      Logger.log("✅ Customer automatically refunded: " + refundResult.refund_id);
      throw new Error(
        "Unable to create booking confirmation. Your payment has been automatically refunded. " +
        "Please try again or contact support. (Refund ID: " + refundResult.refund_id + ")"
      );
    } else {
      Logger.log("❌ AUTOMATIC REFUND FAILED: " + refundResult.error);
      Logger.log("⚠️⚠️⚠️ MANUAL REFUND REQUIRED FOR PAYMENT: " + paymentId);
      throw new Error(
        "Unable to create booking confirmation. IMPORTANT: Your payment was processed but we could not complete your booking. " +
        "Please contact support immediately at (614) 636-2343 with payment ID: " + paymentId + ". " +
        "We will process your refund manually and assist you with rebooking."
      );
    }
  }
}

/**
 * Handle POST requests (booking with payment)
 */
function doPost(e) {
  Logger.log("=== doPost START ===");

  try {
    // Parse the incoming data
    var data = JSON.parse(e.postData.contents);
    var response = processBooking(data);
    Logger.log("=== doPost SUCCESS ===");
    return createSuccessResponse(response);

  } catch (error) {
    Logger.log("=== doPost ERROR ===");
    Logger.log("Error: " + error.message);
    Logger.log("Stack: " + error.stack);
    return createErrorResponse(error.message);
  }
}

// =============================================================================
// SQUARE PAYMENT PROCESSING
// =============================================================================

/**
 * Parse Square API errors into user-friendly messages
 * @param {Array} errors - Array of error objects from Square API
 * @returns {string} User-friendly error message
 */
function parseSquareError(errors) {
  if (!errors || errors.length === 0) {
    return "Payment processing failed. Please try again.";
  }

  var error = errors[0];
  var code = error.code || '';
  var category = error.category || '';
  var detail = error.detail || '';

  // Map Square error codes to user-friendly messages
  var errorMappings = {
    'CARD_DECLINED': 'Your card was declined. Please try a different payment method.',
    'GENERIC_DECLINE': 'Your card was declined. Please try a different payment method.',
    'CVV_FAILURE': 'The security code (CVV) is incorrect. Please check your card.',
    'INSUFFICIENT_FUNDS': 'Your card has insufficient funds. Please try a different card.',
    'INVALID_CARD': 'The card information is invalid. Please check and try again.',
    'INVALID_EXPIRATION': 'The card expiration date is invalid. Please check your card.',
    'INVALID_CARD_DATA': 'The card information is invalid. Please check and try again.',
    'CARD_EXPIRED': 'Your card has expired. Please use a different card.',
    'CARD_NOT_SUPPORTED': 'This card type is not supported. Please use a different card.',
    'INVALID_PIN': 'The PIN entered is incorrect. Please try again.',
    'CARD_PROCESSING_NOT_ENABLED': 'Card processing is not available. Please contact support.',
    'PAN_FAILURE': 'The card number is invalid. Please check and try again.',
    'ALLOWABLE_PIN_TRIES_EXCEEDED': 'Too many incorrect PIN attempts. Please use a different card.',
    'CHIP_INSERTION_REQUIRED': 'Please insert your chip card.',
    'INVALID_ACCOUNT': 'The card account is invalid. Please use a different card.',
    'INVALID_AMOUNT': 'The payment amount is invalid. Please try again.',
    'TRANSACTION_LIMIT': 'Transaction limit exceeded. Please contact your bank.',
    'VOICE_FAILURE': 'Voice authorization required. Please contact your bank.',
    'TEMPORARY_ERROR': 'A temporary error occurred. Please try again in a moment.',
    'TIMEOUT': 'The payment request timed out. Please try again.'
  };

  // Check if we have a mapping for this error code
  if (errorMappings[code]) {
    Logger.log("Mapped error code '" + code + "' to user message");
    return errorMappings[code];
  }

  // If no specific mapping, provide a helpful generic message with details
  if (category === 'PAYMENT_METHOD_ERROR') {
    return 'There was a problem with your payment method. ' + detail;
  } else if (category === 'INVALID_REQUEST_ERROR') {
    return 'Invalid payment information. Please check your details and try again.';
  } else if (category === 'AUTHENTICATION_ERROR') {
    return 'Payment authentication failed. Please contact support.';
  } else if (category === 'RATE_LIMIT_ERROR') {
    return 'Too many payment attempts. Please wait a moment and try again.';
  }

  // Fallback to detail message or generic error
  return detail || 'Payment processing failed. Please try again or contact support.';
}

/**
 * Refund a Square payment (automatic rollback)
 * @param {string} paymentId - Square payment ID to refund
 * @param {string} reason - Reason for refund (for logging)
 * @param {number} amountCents - Amount to refund in cents
 * @returns {object} Refund result {success, refund_id, error}
 */
function refundSquarePayment(paymentId, reason, amountCents) {
  Logger.log("=== AUTOMATIC REFUND START ===");
  Logger.log("Payment ID: " + paymentId);
  Logger.log("Reason: " + reason);
  Logger.log("Amount: $" + (amountCents / 100).toFixed(2));

  try {
    var url = 'https://connect.squareup.com/v2/refunds';

    var payload = {
      idempotency_key: Utilities.getUuid(),
      payment_id: paymentId,
      amount_money: {
        amount: amountCents,
        currency: 'USD'
      },
      reason: reason
    };

    var options = {
      method: 'post',
      headers: {
        'Square-Version': SQUARE_API_VERSION,
        'Authorization': 'Bearer ' + SQUARE_ACCESS_TOKEN,
        'Content-Type': 'application/json'
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    Logger.log("Sending refund request to Square...");
    var response = UrlFetchApp.fetch(url, options);
    var responseCode = response.getResponseCode();
    var responseText = response.getContentText();

    Logger.log("Square refund response code: " + responseCode);
    Logger.log("Square refund response: " + responseText);

    var result = JSON.parse(responseText);

    if (responseCode === 200 && result.refund) {
      Logger.log("✅ REFUND SUCCESSFUL: " + result.refund.id);
      return {
        success: true,
        refund_id: result.refund.id,
        status: result.refund.status
      };
    } else {
      Logger.log("❌ REFUND FAILED: " + responseText);
      return {
        success: false,
        error: result.errors ? result.errors[0].detail : "Refund failed"
      };
    }

  } catch (error) {
    Logger.log("❌ REFUND ERROR: " + error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Process payment with Square
 * @param {string} paymentToken - Payment token from Square Web SDK
 * @param {number} amountCents - Amount in cents
 * @param {object} bookingData - Booking information for reference
 * @returns {object} Payment result {success, payment_id, error}
 */
function processSquarePayment(paymentToken, amountCents, bookingData) {
  Logger.log("=== processSquarePayment START ===");

  // Validate Script Properties are configured
  validateScriptProperties();

  try {
    // PRODUCTION API - processes REAL charges!
    var url = 'https://connect.squareup.com/v2/payments';

    var payload = {
      source_id: paymentToken,
      amount_money: {
        amount: amountCents,
        currency: 'USD'
      },
      location_id: SQUARE_LOCATION_ID,
      idempotency_key: Utilities.getUuid(),
      note: 'Dumpster Rental - ' + bookingData.name,
      buyer_email_address: bookingData.email
    };

    var options = {
      method: 'post',
      headers: {
        'Square-Version': SQUARE_API_VERSION,
        'Authorization': 'Bearer ' + SQUARE_ACCESS_TOKEN,
        'Content-Type': 'application/json'
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    Logger.log("Sending payment request to Square...");
    var response = UrlFetchApp.fetch(url, options);
    var responseCode = response.getResponseCode();
    var responseText = response.getContentText();

    Logger.log("Square response code: " + responseCode);
    Logger.log("Square response: " + responseText);

    var result = JSON.parse(responseText);

    if (responseCode === 200 && result.payment) {
      return {
        success: true,
        payment_id: result.payment.id,
        status: result.payment.status,
        amount: result.payment.amount_money.amount,
        currency: result.payment.amount_money.currency
      };
    } else {
      // Payment failed - parse error for user-friendly message
      var errorMessage = parseSquareError(result.errors);
      Logger.log("Payment failed with user message: " + errorMessage);
      return {
        success: false,
        error: errorMessage,
        raw_errors: result.errors // Keep for logging
      };
    }

  } catch (error) {
    Logger.log("Payment processing error: " + error.message);
    return {
      success: false,
      error: "Payment processing failed. Please try again or contact support."
    };
  }
}

// =============================================================================
// CALENDAR FUNCTIONS
// =============================================================================

/**
 * Get all fully booked dates
 */
function getFullyBookedDates() {
  try {
    var calendar = CalendarApp.getCalendarById(CALENDAR_ID);
    var today = new Date();
    var future = new Date();
    future.setMonth(today.getMonth() + 3);

    var events = calendar.getEvents(today, future);
    var bookingsPerDate = {};

    events.forEach(function(event) {
      var start = new Date(event.getStartTime());
      var end = new Date(event.getEndTime());

      for (var d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
        var dateStr = d.toISOString().split("T")[0];
        bookingsPerDate[dateStr] = (bookingsPerDate[dateStr] || 0) + 1;
      }
    });

    var fullyBooked = Object.keys(bookingsPerDate).filter(function(date) {
      return bookingsPerDate[date] >= MAX_BOOKINGS_PER_DATE;
    });

    return {
      status: "ok",
      fullyBookedDates: fullyBooked,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    return {
      status: "error",
      message: error.message
    };
  }
}

/**
 * Build event description with payment info, tax breakdown, and notes
 */
function buildEventDescription(data, paymentId) {
  var description = "";
  description += "CUSTOMER INFORMATION\n";
  description += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
  description += "Name: " + data.name + "\n";
  description += "Email: " + data.email + "\n";
  description += "Phone: " + (data.phone || 'Not provided') + "\n\n";

  description += "DELIVERY DETAILS\n";
  description += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
  description += "Address: " + data.dropoff_address + "\n";
  description += "City: " + data.dropoff_city + "\n";
  description += "ZIP: " + (data.dropoff_zip || 'Not provided') + "\n";
  description += "Delivery Date: " + data.delivery_date + "\n";
  description += "Pickup Date: " + data.pickup_date + "\n";
  if (data.dropoff_notes) {
    description += "Notes: " + data.dropoff_notes + "\n";
  }
  description += "\n";

  description += "PAYMENT INFORMATION\n";
  description += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
  description += "Subtotal: $" + (data.subtotal || 299).toFixed(2) + "\n";
  description += "Tax (" + ((data.tax_rate || 0.08) * 100).toFixed(0) + "%): $" + (data.tax_amount || 23.92).toFixed(2) + "\n";
  description += "Total: $" + (data.amount || 322.92).toFixed(2) + "\n";
  description += "Payment ID: " + paymentId + "\n";
  description += "Status: PAID\n";

  return description;
}

// =============================================================================
// GOOGLE SHEETS LOGGING
// =============================================================================

/**
 * Log booking to Google Sheet
 */
function logBookingToSheet(data, paymentId) {
  try {
    var spreadsheet = SpreadsheetApp.openById(SHEET_ID);
    var sheet = spreadsheet.getSheetByName(SHEET_NAME);

    // Create sheet if it doesn't exist
    if (!sheet) {
      sheet = spreadsheet.insertSheet(SHEET_NAME);
      // Add header row
      var headers = [
        'Timestamp',
        'Customer Name',
        'Email',
        'Phone',
        'Address',
        'City',
        'Delivery Date',
        'Pickup Date',
        'Dumpster Size',
        'Amount Paid',
        'Payment ID',
        'Status'
      ];
      sheet.appendRow(headers);
      sheet.getRange('A1:L1').setFontWeight('bold').setBackground('#2563eb').setFontColor('#ffffff');
      sheet.setFrozenRows(1);
    }

    // Add the new booking
    var timestamp = new Date();
    var amount = ((data.amount_cents || BOOKING_PRICE_CENTS) / 100).toFixed(2);

    sheet.appendRow([
      timestamp,
      data.name || 'Not provided',
      data.email || 'Not provided',
      data.phone || 'Not provided',
      data.dropoff_address || 'Not provided',
      data.dropoff_city || 'Not provided',
      data.delivery_date || 'Not provided',
      data.pickup_date || 'Not provided',
      data.dumpster_size || '14 yard',
      '$' + amount,
      paymentId,
      'PAID'
    ]);

    // Auto-resize columns
    sheet.autoResizeColumns(1, 12);

    Logger.log("Booking logged to sheet successfully");

  } catch (error) {
    Logger.log('Error logging to sheet: ' + error.toString());
    // Don't fail the entire request if logging fails
  }
}

// =============================================================================
// EMAIL NOTIFICATIONS
// =============================================================================

/**
 * Send confirmation email to customer with tax breakdown and notes
 */
/**
 * Build HTML email template for booking confirmation
 * @param {Object} data - Booking data object
 * @param {string} paymentId - Square payment ID
 * @return {string} Complete HTML email template with inline styles
 */
function buildHtmlEmailTemplate(data, paymentId) {
  var subtotal = data.subtotal || 299;
  var taxRate = data.tax_rate || 0.08;
  var taxAmount = data.tax_amount || 23.92;
  var total = data.amount || 322.92;

  var html = '<!DOCTYPE html>';
  html += '<html lang="en">';
  html += '<head>';
  html += '<meta charset="UTF-8">';
  html += '<meta name="viewport" content="width=device-width, initial-scale=1.0">';
  html += '<title>Booking Confirmation</title>';
  html += '<style type="text/css">';
  html += '@media only screen and (max-width: 600px) {';
  html += '  .email-container { width: 100% !important; }';
  html += '  .content-padding { padding: 16px !important; }';
  html += '  .header-padding { padding: 24px 16px !important; }';
  html += '}';
  html += '</style>';
  html += '</head>';
  html += '<body style="margin: 0; padding: 0; font-family: Roboto, Arial, Helvetica, sans-serif; background-color: #f8fafc;">';

  // Main container
  html += '<table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f8fafc;" cellpadding="0" cellspacing="0">';
  html += '<tr><td style="padding: 0;" align="center">';

  // Content wrapper - responsive width
  html += '<table role="presentation" class="email-container" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff;" cellpadding="0" cellspacing="0">';

  // HEADER - Teal gradient
  html += '<tr><td class="header-padding" style="background: linear-gradient(to right, #01b0bb, #2a7d84); padding: 32px 24px; text-align: center; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">';
  html += '<h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">Streamline Dumpsters</h1>';
  html += '<p style="margin: 4px 0 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">Booking Confirmation</p>';
  html += '</td></tr>';

  // MAIN CONTENT AREA
  html += '<tr><td class="content-padding" style="padding: 24px;">';

  // GREETING
  html += '<div style="margin-bottom: 24px; color: #334155;">';
  html += '<p style="margin: 0 0 12px 0; font-size: 18px; color: #334155;">Dear ' + data.name + ',</p>';
  html += '<p style="margin: 0; font-size: 16px; line-height: 24px; color: #334155;">Thank you for your booking! Your dumpster rental has been confirmed.</p>';
  html += '</div>';

  // CONFIRMATION STATUS BOX - Teal theme
  html += '<table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f0fdfa; border-left: 4px solid #14b8a6; border-radius: 8px; margin-bottom: 32px;" cellpadding="0" cellspacing="0">';
  html += '<tr><td style="padding: 16px;">';
  html += '<table role="presentation" style="width: 100%; border-collapse: collapse;" cellpadding="0" cellspacing="0">';
  html += '<tr>';
  html += '<td style="width: 40px; vertical-align: top;">';
  html += '<div style="width: 32px; height: 32px; background-color: #14b8a6; border-radius: 50%; color: #ffffff; font-weight: bold; text-align: center; line-height: 32px; font-size: 20px;">✓</div>';
  html += '</td>';
  html += '<td style="vertical-align: top;">';
  html += '<p style="margin: 0 0 4px 0; color: #0f766e; font-size: 16px; font-weight: 700;">BOOKING CONFIRMED</p>';
  html += '<p style="margin: 0; color: #0d9488; font-size: 14px;">Your payment has been processed successfully</p>';
  html += '</td>';
  html += '</tr>';
  html += '</table>';
  html += '</td></tr>';
  html += '</table>';

  // BOOKING DETAILS SECTION
  html += '<div style="margin-bottom: 32px;">';
  html += '<h2 style="margin: 0 0 16px 0; color: #01b0bb; font-size: 20px; font-weight: 700; padding-bottom: 8px; border-bottom: 1px solid #e2e8f0;">Booking Details</h2>';

  html += '<table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 20px;" cellpadding="0" cellspacing="0">';

  // Delivery Date
  html += '<tr>';
  html += '<td style="width: 40px; vertical-align: top; padding-top: 4px;">';
  html += '<span style="color: #64748b; font-size: 20px;">📅</span>';
  html += '</td>';
  html += '<td style="padding-bottom: 20px;">';
  html += '<p style="margin: 0 0 2px 0; color: #64748b; font-size: 14px;">Delivery Date:</p>';
  html += '<p style="margin: 0; color: #334155; font-size: 16px; font-weight: 600;">' + data.delivery_date + '</p>';
  html += '</td>';
  html += '</tr>';

  // Pickup Date
  html += '<tr>';
  html += '<td style="width: 40px; vertical-align: top; padding-top: 4px;">';
  html += '<span style="color: #64748b; font-size: 20px;">📅</span>';
  html += '</td>';
  html += '<td style="padding-bottom: 20px;">';
  html += '<p style="margin: 0 0 2px 0; color: #64748b; font-size: 14px;">Pickup Date:</p>';
  html += '<p style="margin: 0; color: #334155; font-size: 16px; font-weight: 600;">' + data.pickup_date + '</p>';
  html += '</td>';
  html += '</tr>';

  // Delivery Address
  html += '<tr>';
  html += '<td style="width: 40px; vertical-align: top; padding-top: 4px;">';
  html += '<span style="color: #64748b; font-size: 20px;">📍</span>';
  html += '</td>';
  html += '<td style="padding-bottom: 20px;">';
  html += '<p style="margin: 0 0 2px 0; color: #64748b; font-size: 14px;">Delivery Address:</p>';
  html += '<p style="margin: 0; color: #334155; font-size: 16px; font-weight: 600;">';
  html += data.dropoff_address + '<br>' + data.dropoff_city;
  if (data.dropoff_zip) {
    html += ', ' + data.dropoff_zip;
  }
  html += '</p>';
  html += '</td>';
  html += '</tr>';

  // Dumpster Size
  html += '<tr>';
  html += '<td style="width: 40px; vertical-align: top; padding-top: 4px;">';
  html += '<span style="color: #64748b; font-size: 20px;">🗑️</span>';
  html += '</td>';
  html += '<td style="padding-bottom: 20px;">';
  html += '<p style="margin: 0 0 2px 0; color: #64748b; font-size: 14px;">Dumpster Size:</p>';
  html += '<p style="margin: 0; color: #334155; font-size: 16px; font-weight: 600;">' + (data.dumpster_size || '14 yard') + '</p>';
  html += '</td>';
  html += '</tr>';
  html += '</table>';

  // Special Instructions (conditional)
  if (data.dropoff_notes) {
    html += '<div style="padding: 16px; background-color: #f1f5f9; border-left: 4px solid #01b0bb; border-radius: 8px;">';
    html += '<p style="margin: 0 0 4px 0; color: #64748b; font-size: 12px; font-weight: 700; text-transform: uppercase;">SPECIAL INSTRUCTIONS</p>';
    html += '<p style="margin: 0; color: #334155; font-size: 14px;">' + data.dropoff_notes + '</p>';
    html += '</div>';
  }

  html += '</div>';

  // PAYMENT SUMMARY SECTION
  html += '<div style="margin-bottom: 32px;">';
  html += '<h2 style="margin: 0 0 16px 0; color: #01b0bb; font-size: 20px; font-weight: 700; padding-bottom: 8px; border-bottom: 1px solid #e2e8f0;">Payment Summary</h2>';

  html += '<table role="presentation" style="width: 100%; border-collapse: collapse;" cellpadding="0" cellspacing="0">';

  // Subtotal
  html += '<tr>';
  html += '<td style="padding: 12px 0; color: #334155; font-size: 14px;">Subtotal:</td>';
  html += '<td style="padding: 12px 0; color: #334155; font-size: 14px; text-align: right;">$' + subtotal.toFixed(2) + '</td>';
  html += '</tr>';

  // Tax
  html += '<tr>';
  html += '<td style="padding: 12px 0; color: #334155; font-size: 14px;">Tax (' + (taxRate * 100).toFixed(0) + '%):</td>';
  html += '<td style="padding: 12px 0; color: #334155; font-size: 14px; text-align: right;">$' + taxAmount.toFixed(2) + '</td>';
  html += '</tr>';

  // Divider
  html += '<tr>';
  html += '<td colspan="2" style="padding: 16px 0; border-top: 1px solid #e2e8f0;"></td>';
  html += '</tr>';

  // Total
  html += '<tr>';
  html += '<td style="padding: 8px 0 0 0; color: #334155; font-size: 18px; font-weight: 700;">Total Paid:</td>';
  html += '<td style="padding: 8px 0 0 0; color: #10b981; font-size: 20px; font-weight: 700; text-align: right;">$' + total.toFixed(2) + '</td>';
  html += '</tr>';
  html += '</table>';

  // Payment ID
  html += '<div style="margin-top: 12px; text-align: right;">';
  html += '<p style="margin: 0; display: inline-block; padding: 4px 8px; background-color: #f1f5f9; color: #64748b; font-size: 12px; border-radius: 4px;">Payment ID: ' + paymentId + '</p>';
  html += '</div>';

  html += '</div>';

  html += '</td></tr>'; // End main content area

  html += '</table>'; // End content wrapper
  html += '</td></tr>';
  html += '</table>'; // End main container

  html += '</body>';
  html += '</html>';

  return html;
}

/**
 * Send booking confirmation email to customer
 * @param {Object} data - Booking data object
 * @param {string} paymentId - Square payment ID
 */
function sendConfirmationEmail(data, paymentId) {
  try {
    var subject = "Booking Confirmation - Streamline Dumpsters";
    var subtotal = data.subtotal || 299;
    var taxRate = data.tax_rate || 0.08;
    var taxAmount = data.tax_amount || 23.92;
    var total = data.amount || 322.92;

    // Plain text version (fallback for email clients that don't support HTML)
    var body = "";
    body += "Dear " + data.name + ",\n\n";
    body += "Thank you for your booking with Streamline Dumpsters!\n\n";
    body += "BOOKING DETAILS\n";
    body += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
    body += "Delivery Date: " + data.delivery_date + "\n";
    body += "Pickup Date: " + data.pickup_date + "\n";
    body += "Delivery Address: " + data.dropoff_address + ", " + data.dropoff_city;
    if (data.dropoff_zip) {
      body += " " + data.dropoff_zip;
    }
    body += "\n";
    body += "Dumpster Size: " + (data.dumpster_size || '14 yard') + "\n";
    if (data.dropoff_notes) {
      body += "Special Instructions: " + data.dropoff_notes + "\n";
    }
    body += "\n";
    body += "PAYMENT CONFIRMATION\n";
    body += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
    body += "Subtotal: $" + subtotal.toFixed(2) + "\n";
    body += "Tax (" + (taxRate * 100).toFixed(0) + "%): $" + taxAmount.toFixed(2) + "\n";
    body += "Total Paid: $" + total.toFixed(2) + "\n";
    body += "Payment ID: " + paymentId + "\n";
    body += "Status: CONFIRMED\n\n";
    body += "If you have any questions, please contact us at (614) 636-2343.\n\n";
    body += "Thank you for choosing Streamline Dumpsters!\n\n";
    body += "Best regards,\n";
    body += "Streamline Dumpsters Team";

    // Generate HTML email template
    var htmlBody = buildHtmlEmailTemplate(data, paymentId);

    // Send email with both plain text and HTML versions
    MailApp.sendEmail({
      to: data.email,
      subject: subject,
      body: body,          // Plain text fallback
      htmlBody: htmlBody   // HTML version (preferred by most clients)
    });

    Logger.log("Confirmation email sent to: " + data.email);

  } catch (error) {
    Logger.log("Error sending confirmation email: " + error.toString());
    // Don't fail the entire request if email fails
  }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Create success response with CORS headers
 */
function createSuccessResponse(data) {
  var output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);

  // Always set CORS headers with wildcard for maximum compatibility
  output.setHeader('Access-Control-Allow-Origin', '*');
  output.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  output.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  return output;
}

/**
 * Create error response with CORS headers
 */
function createErrorResponse(message) {
  var output = ContentService.createTextOutput(JSON.stringify({
    status: "error",
    message: message
  }));
  output.setMimeType(ContentService.MimeType.JSON);

  // Always set CORS headers with wildcard for maximum compatibility
  output.setHeader('Access-Control-Allow-Origin', '*');
  output.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  output.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  return output;
}

// =============================================================================
// SECURITY & SETUP FUNCTIONS
// =============================================================================

/**
 * ONE-TIME SETUP: Store credentials securely in Script Properties
 *
 * HOW TO RUN THIS FUNCTION:
 * 1. In Google Apps Script editor, select "setupScriptProperties" from the function dropdown
 * 2. Click the "Run" button (play icon)
 * 3. Authorize the script if prompted
 * 4. Check the execution log - you should see "✅ Script Properties configured successfully"
 * 5. IMPORTANT: After running once, you can delete the credential values from this function
 *    (or just never run it again - the values are now stored securely)
 *
 * WHAT THIS DOES:
 * - Stores your sensitive credentials in Script Properties (encrypted by Google)
 * - These values are NOT visible in the script code after storage
 * - Only this script can access these properties
 * - They persist across deployments and versions
 */
function setupScriptProperties() {
  Logger.log("🔧 Setting up Script Properties...");

  var properties = PropertiesService.getScriptProperties();

  // STEP 1: Set your Square PRODUCTION credentials
  // ⚠️ WARNING: These process REAL payments and charges!
  properties.setProperty('SQUARE_ACCESS_TOKEN', 'EAAAl8RVO0aQ5RZupn21Rc6ausx1VTMLv-DH4QFItbwgjwOHQ0U78pjChsjO-MdA');
  properties.setProperty('SQUARE_LOCATION_ID', 'L9MVPB33HG9N0');

  // STEP 2: Set your Google Sheet ID
  // Find this in your sheet URL: https://docs.google.com/spreadsheets/d/[SHEET_ID]/edit
  properties.setProperty('SHEET_ID', '1zcgGFEbnNyomioweBYLwOCUJeuXj-ho3INVl9k3pIuE');

  // STEP 3: Set your Google Calendar ID
  // Find this in Calendar Settings > Integrate Calendar
  properties.setProperty('CALENDAR_ID', 'afde913e0bbb5c4de2f42b45187802ba8b49f3b4d5fcba1ab41938ced5fc1ecc@group.calendar.google.com');

  Logger.log("✅ Script Properties configured successfully!");
  Logger.log("📋 Stored properties:");
  Logger.log("  - SQUARE_ACCESS_TOKEN: " + (properties.getProperty('SQUARE_ACCESS_TOKEN') ? "✓ Set" : "✗ Missing"));
  Logger.log("  - SQUARE_LOCATION_ID: " + (properties.getProperty('SQUARE_LOCATION_ID') ? "✓ Set" : "✗ Missing"));
  Logger.log("  - SHEET_ID: " + (properties.getProperty('SHEET_ID') ? "✓ Set" : "✗ Missing"));
  Logger.log("  - CALENDAR_ID: " + (properties.getProperty('CALENDAR_ID') ? "✓ Set" : "✗ Missing"));
  Logger.log("\n💡 TIP: You can now delete the credential values from this function for extra security");
  Logger.log("💡 TIP: Run validateScriptProperties() to verify everything is configured correctly");
}

/**
 * VALIDATION: Check if all required Script Properties are set
 *
 * HOW TO USE:
 * - Run this function manually to check your configuration
 * - It's also called automatically at the start of critical functions
 * - If any properties are missing, you'll get a clear error message
 *
 * @throws {Error} If any required properties are missing
 */
function validateScriptProperties() {
  Logger.log("🔍 Validating Script Properties...");

  var properties = PropertiesService.getScriptProperties();
  var requiredProps = {
    'SQUARE_ACCESS_TOKEN': 'Square API access token',
    'SQUARE_LOCATION_ID': 'Square location ID',
    'SHEET_ID': 'Google Sheet ID',
    'CALENDAR_ID': 'Google Calendar ID'
  };

  var missingProps = [];

  for (var propName in requiredProps) {
    var value = properties.getProperty(propName);
    if (!value || value === 'null' || value === '') {
      missingProps.push(propName + ' (' + requiredProps[propName] + ')');
      Logger.log("  ✗ " + propName + ": MISSING");
    } else {
      Logger.log("  ✓ " + propName + ": Set (" + value.substring(0, 10) + "...)");
    }
  }

  if (missingProps.length > 0) {
    var errorMsg = "❌ CONFIGURATION ERROR: Missing required Script Properties:\n\n";
    errorMsg += missingProps.join('\n');
    errorMsg += "\n\n💡 SOLUTION: Run setupScriptProperties() to configure these values.";
    errorMsg += "\n📖 See setup instructions at the top of this script.";

    Logger.log(errorMsg);
    throw new Error(errorMsg);
  }

  Logger.log("✅ All Script Properties validated successfully!");
  return true;
}

/**
 * VIEW: Display current Script Properties (without showing sensitive values)
 *
 * HOW TO USE:
 * - Run this function to see which properties are configured
 * - Does NOT show the actual credential values (security best practice)
 * - Only shows if each property is set or missing
 */
function viewScriptProperties() {
  Logger.log("📋 Current Script Properties Configuration:");
  Logger.log("═════════════════════════════════════════");

  var properties = PropertiesService.getScriptProperties();
  var allProps = properties.getProperties();

  if (Object.keys(allProps).length === 0) {
    Logger.log("❌ No properties set. Run setupScriptProperties() first.");
    return;
  }

  for (var propName in allProps) {
    var value = allProps[propName];
    var displayValue = value ? "✓ Set (" + value.length + " chars)" : "✗ Missing";
    Logger.log("  " + propName + ": " + displayValue);
  }

  Logger.log("═════════════════════════════════════════");
}

/**
 * CLEANUP: Delete all Script Properties (use with caution!)
 *
 * HOW TO USE:
 * - Only run this if you need to completely reset your configuration
 * - You'll need to run setupScriptProperties() again after this
 *
 * ⚠️ WARNING: This will delete ALL stored credentials!
 */
function clearScriptProperties() {
  Logger.log("⚠️ Clearing all Script Properties...");

  var properties = PropertiesService.getScriptProperties();
  properties.deleteAllProperties();

  Logger.log("✅ All Script Properties cleared");
  Logger.log("💡 Run setupScriptProperties() to reconfigure credentials");
}

// =============================================================================
// TEST FUNCTIONS
// =============================================================================

/**
 * Test payment processing (use fake token for testing)
 */
function testPayment() {
  var testData = {
    payment_token: 'cnon:card-nonce-ok', // Square test token
    name: 'Test Customer',
    email: 'test@example.com',
    phone: '(614) 555-1234',
    dropoff_address: '123 Test St',
    dropoff_city: 'Dublin, OH 43016',
    delivery_date: '2025-11-01',
    pickup_date: '2025-11-04',
    dumpster_size: '14 yard',
    amount_cents: 32292,
    subtotal: 299,
    tax_rate: 0.08,
    tax_amount: 23.92,
    amount: 322.92
  };

  var result = processSquarePayment(
    testData.payment_token,
    testData.amount_cents,
    testData
  );

  Logger.log("Test payment result: " + JSON.stringify(result));
}

/**
 * Run all tests
 */
function runAllTests() {
  Logger.log("=== TEST 1: Validate Configuration ===");
  validateScriptProperties();

  Logger.log("\n=== TEST 2: Get Fully Booked ===");
  var test1 = doGet({parameter: {action: "getFullyBooked"}});
  Logger.log(test1.getContent());

  Logger.log("\n=== TEST 3: Check Availability ===");
  var test2 = doGet({parameter: {start: "2025-11-01", end: "2025-11-03"}});
  Logger.log(test2.getContent());

  Logger.log("\n=== TEST 4: Payment Processing ===");
  testPayment();

  Logger.log("\n=== TESTS COMPLETE ===");
}
