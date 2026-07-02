/**
 * GOOGLE APPS SCRIPT - CORS-SAFE VERSION
 * Updated: 2025-11-15 - Sends CORS headers even when errors occur
 *
 * KEY FIX: Wrapped everything in try-catch to ensure CORS headers are ALWAYS sent
 * This prevents "Missing CORS header" errors in the browser
 */

// =============================================================================
// CONFIGURATION
// =============================================================================

var SHEET_ID = '18dlaYpyUmHygeBPMnRChwRkx1mKq7Ns0HaYf1TXr-HI';
var SHEET_NAME = 'Dumpster Bookings';

var SQUARE_ACCESS_TOKEN = 'EAAAl8RVO0aQ5RZupn21Rc6ausx1VTMLv-DH4QFItbwgjwOHQ0U78pjChsjO-MdA';
var SQUARE_LOCATION_ID = 'L9MVPB33HG9N0';
var SQUARE_API_VERSION = '2024-01-18';

var CALENDAR_ID = 'afde913e0bbb5c4de2f42b45187802ba8b49f3b4d5fcba1ab41938ced5fc1ecc@group.calendar.google.com';

var MAX_BOOKINGS_PER_DATE = 3;
var BOOKING_PRICE_CENTS = 100; // $1.00

// =============================================================================
// HTTP HANDLERS - CORS-SAFE VERSIONS
// =============================================================================

/**
 * Handle OPTIONS requests (CORS preflight)
 */
function doOptions(e) {
  return createCorsResponse("");
}

/**
 * Handle GET requests - CORS-SAFE VERSION
 * Always returns CORS headers, even on error
 */
function doGet(e) {
  Logger.log("=== doGet START ===");

  try {
    // Ensure e.parameter exists
    if (!e || !e.parameter) {
      e = { parameter: {} };
    }

    Logger.log("Parameters: " + JSON.stringify(e.parameter));

    var result;

    // Handle getFullyBooked action
    if (e.parameter.action === "getFullyBooked") {
      Logger.log("Action: getFullyBooked");
      result = getFullyBookedDates();
      Logger.log("=== doGet SUCCESS ===");
      return createCorsResponse(JSON.stringify(result));
    }

    // Handle availability check (requires start and end parameters)
    var start = e.parameter.start;
    var end = e.parameter.end;

    if (!start || !end) {
      Logger.log("ERROR: Missing start or end parameters");
      return createCorsResponse(JSON.stringify({
        status: "error",
        message: "Missing start or end parameters"
      }));
    }

    // Get calendar
    var calendar = CalendarApp.getCalendarById(CALENDAR_ID);
    if (!calendar) {
      Logger.log("ERROR: Calendar not found");
      return createCorsResponse(JSON.stringify({
        status: "error",
        message: "Calendar not found"
      }));
    }

    // Check availability
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

    Logger.log("=== doGet SUCCESS ===");
    return createCorsResponse(JSON.stringify(result));

  } catch (error) {
    Logger.log("=== doGet ERROR ===");
    Logger.log("Error: " + error.message);
    Logger.log("Stack: " + error.stack);

    // CRITICAL: Return error WITH CORS headers
    return createCorsResponse(JSON.stringify({
      status: "error",
      message: error.message,
      debug: error.stack
    }));
  }
}

/**
 * Handle POST requests - CORS-SAFE VERSION
 */
function doPost(e) {
  Logger.log("=== doPost START ===");

  try {
    var data = JSON.parse(e.postData.contents);
    Logger.log("Booking data received: " + JSON.stringify(data));

    // Validate required fields
    if (!data.payment_token) {
      throw new Error("Payment token is required");
    }
    if (!data.name || !data.email || !data.delivery_date || !data.pickup_date) {
      throw new Error("Missing required booking information");
    }

    // Process payment
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

    // Create calendar event
    Logger.log("Step 2: Creating calendar event...");
    var calendar = CalendarApp.getCalendarById(CALENDAR_ID);

    var timeSlot = data.time || data.timeSlot || "07:00-09:00";
    var timeParts = timeSlot.split("-");
    var startTime = timeParts[0] || "07:00";
    var endTime = timeParts[1] || "09:00";

    var eventStart = new Date(data.delivery_date + 'T' + startTime + ':00');
    var eventEnd = new Date(data.delivery_date + 'T' + endTime + ':00');

    var event = calendar.createEvent(
      "Dumpster Rental - " + data.name,
      eventStart,
      eventEnd,
      {
        description: buildEventDescription(data, paymentResult.payment_id),
        location: data.dropoff_address + ", " + data.dropoff_city
      }
    );

    Logger.log("Calendar event created: " + event.getId());

    // Log to sheet (non-critical - don't fail if this errors)
    try {
      Logger.log("Step 3: Logging to sheet...");
      logBookingToSheet(data, paymentResult.payment_id);
    } catch (sheetError) {
      Logger.log("Warning: Sheet logging failed: " + sheetError.message);
    }

    // Send email (non-critical - don't fail if this errors)
    try {
      Logger.log("Step 4: Sending confirmation email...");
      sendConfirmationEmail(data, paymentResult.payment_id);
    } catch (emailError) {
      Logger.log("Warning: Email sending failed: " + emailError.message);
    }

    // Return success
    var response = {
      status: "success",
      message: "Booking confirmed and payment processed",
      booking_id: event.getId(),
      payment_id: paymentResult.payment_id,
      amount_paid: (data.amount_cents || BOOKING_PRICE_CENTS) / 100,
      currency: "USD"
    };

    Logger.log("=== doPost SUCCESS ===");
    return createCorsResponse(JSON.stringify(response));

  } catch (error) {
    Logger.log("=== doPost ERROR ===");
    Logger.log("Error: " + error.message);
    Logger.log("Stack: " + error.stack);

    // CRITICAL: Return error WITH CORS headers
    return createCorsResponse(JSON.stringify({
      status: "error",
      message: error.message,
      debug: error.stack
    }));
  }
}

/**
 * CRITICAL HELPER: Creates response with CORS headers
 * This ensures CORS headers are ALWAYS sent, even on errors
 */
function createCorsResponse(jsonString) {
  var output = ContentService.createTextOutput(jsonString);
  output.setMimeType(ContentService.MimeType.JSON);

  // Add CORS headers - wildcard for maximum compatibility
  output.setHeader('Access-Control-Allow-Origin', '*');
  output.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  output.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  output.setHeader('Access-Control-Max-Age', '3600');

  return output;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

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

function getFullyBookedDates() {
  try {
    var calendar = CalendarApp.getCalendarById(CALENDAR_ID);
    if (!calendar) {
      throw new Error("Calendar not found");
    }

    var startDate = new Date();
    var endDate = new Date();
    endDate.setDate(endDate.getDate() + 90);

    var events = calendar.getEvents(startDate, endDate);

    var dateCount = {};
    events.forEach(function(event) {
      var dateStr = Utilities.formatDate(event.getStartTime(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
      dateCount[dateStr] = (dateCount[dateStr] || 0) + 1;
    });

    var fullyBooked = [];
    for (var date in dateCount) {
      if (dateCount[date] >= MAX_BOOKINGS_PER_DATE) {
        fullyBooked.push(date);
      }
    }

    return {
      status: "ok",
      fullyBookedDates: fullyBooked
    };
  } catch (error) {
    Logger.log("Error getting fully booked dates: " + error.message);
    throw error;
  }
}

function buildEventDescription(data, paymentId) {
  var description = "";
  description += "BOOKING DETAILS\n";
  description += "====================\n";
  description += "Customer: " + data.name + "\n";
  description += "Email: " + data.email + "\n";
  description += "Phone: " + data.phone + "\n";
  description += "Delivery: " + data.delivery_date + " (" + data.time + ")\n";
  description += "Pickup: " + data.pickup_date + "\n";
  description += "Location: " + data.dropoff_address + ", " + data.dropoff_city;
  if (data.dropoff_zip) {
    description += " " + data.dropoff_zip;
  }
  description += "\n";
  if (data.dropoff_notes) {
    description += "Notes: " + data.dropoff_notes + "\n";
  }
  description += "\n";
  description += "PAYMENT INFO\n";
  description += "====================\n";
  description += "Payment ID: " + paymentId + "\n";
  description += "Amount: $" + (BOOKING_PRICE_CENTS / 100).toFixed(2) + "\n";
  description += "Status: PAID\n";

  return description;
}

function logBookingToSheet(data, paymentId) {
  var sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);

  if (!sheet) {
    Logger.log("Creating new sheet: " + SHEET_NAME);
    sheet = SpreadsheetApp.openById(SHEET_ID).insertSheet(SHEET_NAME);

    sheet.appendRow([
      'Timestamp',
      'Customer Name',
      'Email',
      'Phone',
      'Delivery Date',
      'Pickup Date',
      'Delivery Time',
      'Address',
      'City',
      'ZIP',
      'Notes',
      'Payment ID',
      'Amount',
      'Status'
    ]);
  }

  sheet.appendRow([
    new Date(),
    data.name,
    data.email,
    data.phone,
    data.delivery_date,
    data.pickup_date,
    data.time || 'Not specified',
    data.dropoff_address,
    data.dropoff_city,
    data.dropoff_zip || '',
    data.dropoff_notes || '',
    paymentId,
    '$' + (BOOKING_PRICE_CENTS / 100).toFixed(2),
    'CONFIRMED'
  ]);

  Logger.log("Booking logged to sheet successfully");
}

function sendConfirmationEmail(data, paymentId) {
  var subject = "Booking Confirmation - Streamline Dumpsters";
  var subtotal = (BOOKING_PRICE_CENTS / 100);
  var taxRate = 0.08;
  var taxAmount = subtotal * taxRate;
  var total = subtotal + taxAmount;

  var body = "";
  body += "Dear " + data.name + ",\n\n";
  body += "Thank you for your booking with Streamline Dumpsters!\n\n";
  body += "BOOKING DETAILS\n";
  body += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
  body += "Delivery Date: " + data.delivery_date + "\n";
  body += "Delivery Time: " + (data.time || 'TBD') + "\n";
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

  MailApp.sendEmail({
    to: data.email,
    subject: subject,
    body: body
  });

  Logger.log("Confirmation email sent to: " + data.email);
}
