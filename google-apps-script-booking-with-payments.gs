/**
 * GOOGLE APPS SCRIPT - WITH SQUARE PAYMENT PROCESSING
 * Copy this ENTIRE file to your Google Apps Script
 *
 * SETUP INSTRUCTIONS:
 * 1. Go to https://script.google.com
 * 2. Open your booking script
 * 3. Replace ALL code with this file
 * 4. Save (Ctrl+S or Cmd+S)
 * 5. Deploy > New deployment
 * 6. Copy the new Web App URL to your website config
 */

// =============================================================================
// CONFIGURATION
// =============================================================================

// Google Sheet for logging bookings
const SHEET_ID = '18dlaYpyUmHygeBPMnRChwRkx1mKq7Ns0HaYf1TXr-HI';
const SHEET_NAME = 'Dumpster Bookings';

// Square Production Credentials
const SQUARE_ACCESS_TOKEN = 'EAAAl8RVO0aQ5RZupn21Rc6ausx1VTMLv-DH4QFItbwgjwOHQ0U78pjChsjO-MdA';
const SQUARE_LOCATION_ID = 'L9MVPB33HG9N0';
const SQUARE_API_VERSION = '2024-01-18';

// Google Calendar
const CALENDAR_ID = 'afde913e0bbb5c4de2f42b45187802ba8b49f3b4d5fcba1ab41938ced5fc1ecc@group.calendar.google.com';

// Booking Configuration
const MAX_BOOKINGS_PER_DATE = 3;
const BOOKING_PRICE_CENTS = 29900; // $299.00

// =============================================================================
// HTTP HANDLERS
// =============================================================================

/**
 * Handle GET requests (availability checks)
 */
function doGet(e) {
  Logger.log("=== doGet START ===");

  if (!e || !e.parameter) {
    e = { parameter: {} };
  }

  Logger.log("Parameters: " + JSON.stringify(e.parameter));

  try {
    var result;

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

    var output = ContentService.createTextOutput(JSON.stringify(result));
    output.setMimeType(ContentService.MimeType.JSON);
    return output;

  } catch (error) {
    Logger.log("ERROR: " + error.message);
    return createErrorResponse(error.message);
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
    Logger.log("Booking data received: " + JSON.stringify(data));

    // Validate required fields
    if (!data.payment_token) {
      throw new Error("Payment token is required");
    }
    if (!data.name || !data.email || !data.delivery_date || !data.pickup_date) {
      throw new Error("Missing required booking information");
    }

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

    // Step 2: Create calendar event
    Logger.log("Step 2: Creating calendar event...");
    var calendar = CalendarApp.getCalendarById(CALENDAR_ID);

    var event = calendar.createEvent(
      "Dumpster Rental - " + data.name,
      new Date(data.delivery_date + 'T00:00:00'),
      new Date(data.pickup_date + 'T23:59:59'),
      {
        description: buildEventDescription(data, paymentResult.payment_id),
        location: data.dropoff_address + ", " + data.dropoff_city
      }
    );

    Logger.log("Calendar event created: " + event.getId());

    // Step 3: Log to Google Sheet
    Logger.log("Step 3: Logging to sheet...");
    logBookingToSheet(data, paymentResult.payment_id);

    // Step 4: Send confirmation email (optional)
    Logger.log("Step 4: Sending confirmation email...");
    sendConfirmationEmail(data, paymentResult.payment_id);

    // Return success response
    var response = {
      status: "success",
      message: "Booking confirmed and payment processed",
      booking_id: event.getId(),
      payment_id: paymentResult.payment_id,
      amount_paid: (data.amount_cents || BOOKING_PRICE_CENTS) / 100,
      currency: "USD"
    };

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
 * Process payment with Square
 * @param {string} paymentToken - Payment token from Square Web SDK
 * @param {number} amountCents - Amount in cents
 * @param {object} bookingData - Booking information for reference
 * @returns {object} Payment result {success, payment_id, error}
 */
function processSquarePayment(paymentToken, amountCents, bookingData) {
  try {
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
      // Payment failed
      var errorMessage = "Unknown error";
      if (result.errors && result.errors.length > 0) {
        errorMessage = result.errors[0].detail || result.errors[0].code;
      }
      return {
        success: false,
        error: errorMessage
      };
    }

  } catch (error) {
    Logger.log("Payment processing error: " + error.message);
    return {
      success: false,
      error: error.message
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
 * Build event description with payment info
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
  description += "Delivery Date: " + data.delivery_date + "\n";
  description += "Pickup Date: " + data.pickup_date + "\n\n";

  description += "PAYMENT INFORMATION\n";
  description += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
  description += "Payment ID: " + paymentId + "\n";
  description += "Amount: $" + ((data.amount_cents || BOOKING_PRICE_CENTS) / 100).toFixed(2) + "\n";
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
 * Send confirmation email to customer
 */
function sendConfirmationEmail(data, paymentId) {
  try {
    var subject = "Booking Confirmation - Streamline Dumpsters";
    var amount = ((data.amount_cents || BOOKING_PRICE_CENTS) / 100).toFixed(2);

    var body = "";
    body += "Dear " + data.name + ",\n\n";
    body += "Thank you for your booking with Streamline Dumpsters!\n\n";
    body += "BOOKING DETAILS\n";
    body += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
    body += "Delivery Date: " + data.delivery_date + "\n";
    body += "Pickup Date: " + data.pickup_date + "\n";
    body += "Delivery Address: " + data.dropoff_address + ", " + data.dropoff_city + "\n";
    body += "Dumpster Size: " + (data.dumpster_size || '14 yard') + "\n\n";
    body += "PAYMENT CONFIRMATION\n";
    body += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
    body += "Amount Paid: $" + amount + "\n";
    body += "Payment ID: " + paymentId + "\n";
    body += "Status: CONFIRMED\n\n";
    body += "If you have any questions, please contact us at (614) 636-2343.\n\n";
    body += "Thank you for choosing Streamline Dumpsters!\n\n";
    body += "Best regards,\n";
    body += "Streamline Dumpsters Team";

    MailApp.sendEmail({
      to: data.email,
      subject: subject,
      body: body
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
 * Create success response
 */
function createSuccessResponse(data) {
  var output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}

/**
 * Create error response
 */
function createErrorResponse(message) {
  var output = ContentService.createTextOutput(JSON.stringify({
    status: "error",
    message: message
  }));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
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
    amount_cents: 29900
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
  Logger.log("=== TEST 1: Get Fully Booked ===");
  var test1 = doGet({parameter: {action: "getFullyBooked"}});
  Logger.log(test1.getContent());

  Logger.log("\n=== TEST 2: Check Availability ===");
  var test2 = doGet({parameter: {start: "2025-11-01", end: "2025-11-03"}});
  Logger.log(test2.getContent());

  Logger.log("\n=== TEST 3: Payment Processing ===");
  testPayment();

  Logger.log("\n=== TESTS COMPLETE ===");
}
