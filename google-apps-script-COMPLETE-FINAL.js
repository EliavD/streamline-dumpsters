/**
 * COMPLETE BOOKING SYSTEM - FINAL VERSION
 *
 * This version includes:
 * - CORS support (automatic via Google Apps Script)
 * - Square payment processing ($1.00 test payments)
 * - Google Calendar event creation
 * - Google Sheet logging
 * - Email confirmations
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
// HTTP HANDLERS
// =============================================================================

/**
 * Handle OPTIONS requests (CORS preflight)
 */
function doOptions(e) {
  Logger.log("=== doOptions (CORS Preflight) ===");
  return ContentService.createTextOutput("");
}

/**
 * Handle GET requests (availability checks)
 */
function doGet(e) {
  Logger.log("=== doGet START ===");

  try {
    if (!e || !e.parameter) {
      e = { parameter: {} };
    }

    Logger.log("Parameters: " + JSON.stringify(e.parameter));

    var result;

    if (e.parameter.action === "getFullyBooked") {
      Logger.log("Action: getFullyBooked");
      result = getFullyBookedDates();
    } else {
      result = {
        status: "ok",
        message: "Booking system ready",
        fullyBookedDates: [],
        timestamp: new Date().toISOString()
      };
    }

    Logger.log("Result: " + JSON.stringify(result));

    var output = ContentService.createTextOutput(JSON.stringify(result));
    output.setMimeType(ContentService.MimeType.JSON);

    Logger.log("=== doGet SUCCESS ===");
    return output;

  } catch (error) {
    Logger.log("=== doGet ERROR ===");
    Logger.log("Error: " + error.message);
    Logger.log("Stack: " + error.stack);

    var errorOutput = ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.message
    }));
    errorOutput.setMimeType(ContentService.MimeType.JSON);

    return errorOutput;
  }
}

/**
 * Handle POST requests (booking submissions)
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

    // Step 3: Log to Google Sheet (non-critical)
    try {
      Logger.log("Step 3: Logging to sheet...");
      logBookingToSheet(data, paymentResult.payment_id);
    } catch (sheetError) {
      Logger.log("Warning: Sheet logging failed: " + sheetError.message);
    }

    // Step 4: Send confirmation email (non-critical)
    try {
      Logger.log("Step 4: Sending confirmation email...");
      sendConfirmationEmail(data, paymentResult.payment_id);
    } catch (emailError) {
      Logger.log("Warning: Email sending failed: " + emailError.message);
    }

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

    var output = ContentService.createTextOutput(JSON.stringify(response));
    output.setMimeType(ContentService.MimeType.JSON);
    return output;

  } catch (error) {
    Logger.log("=== doPost ERROR ===");
    Logger.log("Error: " + error.message);
    Logger.log("Stack: " + error.stack);

    var errorOutput = ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.message
    }));
    errorOutput.setMimeType(ContentService.MimeType.JSON);

    return errorOutput;
  }
}

// =============================================================================
// PAYMENT PROCESSING
// =============================================================================

/**
 * Process payment with Square
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
 * Get fully booked dates
 */
function getFullyBookedDates() {
  try {
    var calendar = CalendarApp.getCalendarById(CALENDAR_ID);
    if (!calendar) {
      throw new Error("Calendar not found: " + CALENDAR_ID);
    }

    var startDate = new Date();
    var endDate = new Date();
    endDate.setDate(endDate.getDate() + 90);

    var events = calendar.getEvents(startDate, endDate);
    Logger.log("Found " + events.length + " events");

    var dateCount = {};
    for (var i = 0; i < events.length; i++) {
      var dateStr = Utilities.formatDate(
        events[i].getStartTime(),
        Session.getScriptTimeZone(),
        'yyyy-MM-dd'
      );
      dateCount[dateStr] = (dateCount[dateStr] || 0) + 1;
    }

    var fullyBooked = [];
    for (var date in dateCount) {
      if (dateCount[date] >= MAX_BOOKINGS_PER_DATE) {
        fullyBooked.push(date);
      }
    }

    Logger.log("Fully booked dates: " + JSON.stringify(fullyBooked));

    return {
      status: "ok",
      fullyBookedDates: fullyBooked,
      totalEvents: events.length
    };

  } catch (error) {
    Logger.log("Error getting fully booked dates: " + error.message);
    throw error;
  }
}

/**
 * Build event description
 */
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

// =============================================================================
// GOOGLE SHEETS LOGGING
// =============================================================================

/**
 * Log booking to Google Sheet
 */
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

// =============================================================================
// EMAIL NOTIFICATIONS
// =============================================================================

/**
 * Send confirmation email
 */
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
