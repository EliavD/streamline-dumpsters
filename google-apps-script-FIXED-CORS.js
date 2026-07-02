/**
 * GOOGLE APPS SCRIPT - WITH SQUARE PAYMENT PROCESSING & CORS FIX
 * Updated: 2025-11-15 - Fixed CORS preflight handling
 *
 * SETUP INSTRUCTIONS:
 * 1. Go to https://script.google.com
 * 2. Open your booking script (the one with URL ending in ...7hhn5Q/exec)
 * 3. Replace ALL code with this file
 * 4. Save (Ctrl+S or Cmd+S)
 * 5. Deploy > Manage deployments > Edit (pencil icon) > Version: New version > Deploy
 * 6. Verify "Execute as" is set to "Me"
 * 7. Verify "Who has access" is set to "Anyone"
 */

// =============================================================================
// CONFIGURATION
// =============================================================================

// Google Sheet for logging bookings
const SHEET_ID = '18dlaYpyUmHygeBPMnRChwRkx1mKq7Ns0HaYf1TXr-HI';
const SHEET_NAME = 'Dumpster Bookings';

// Square PRODUCTION Credentials
// ⚠️ WARNING: These process REAL payments and charges!
const SQUARE_ACCESS_TOKEN = 'EAAAl8RVO0aQ5RZupn21Rc6ausx1VTMLv-DH4QFItbwgjwOHQ0U78pjChsjO-MdA';
const SQUARE_LOCATION_ID = 'L9MVPB33HG9N0';
const SQUARE_API_VERSION = '2024-01-18';

// Google Calendar
const CALENDAR_ID = 'afde913e0bbb5c4de2f42b45187802ba8b49f3b4d5fcba1ab41938ced5fc1ecc@group.calendar.google.com';

// Booking Configuration
const MAX_BOOKINGS_PER_DATE = 3;
const BOOKING_PRICE_CENTS = 100; // $1.00 - TESTING ONLY

// Allowed origins for CORS
const ALLOWED_ORIGINS = [
  "https://sl-dumpsters.com",
  "https://www.sl-dumpsters.com",
  "https://sl-dumpsters.web.app",
  "https://sl-dumpsters.firebaseapp.com",
  "http://localhost:3000",
  "http://localhost:5000",
  "https://localhost:5001"
];

// =============================================================================
// HTTP HANDLERS
// =============================================================================

/**
 * Handle OPTIONS requests (CORS preflight)
 * THIS IS CRITICAL FOR CORS TO WORK!
 */
function doOptions(e) {
  Logger.log("=== doOptions (CORS Preflight) START ===");

  // Get origin from request
  const origin = e && e.parameter && e.parameter.origin ? e.parameter.origin : '';
  const requestOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];

  Logger.log("Preflight origin: " + origin);
  Logger.log("Response origin: " + requestOrigin);

  // Return CORS headers for preflight
  const output = ContentService.createTextOutput("");
  output.setMimeType(ContentService.MimeType.TEXT);
  output.setHeader('Access-Control-Allow-Origin', requestOrigin);
  output.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  output.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  output.setHeader('Access-Control-Max-Age', '3600');

  Logger.log("=== doOptions (CORS Preflight) END ===");
  return output;
}

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

    // Add CORS headers
    const origin = e.parameter.origin || ALLOWED_ORIGINS[0];
    output.setHeader('Access-Control-Allow-Origin', origin);

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

  // Get origin from request headers
  const origin = e && e.postData && e.postData.headers && e.postData.headers.Origin
    ? e.postData.headers.Origin
    : e && e.postData && e.postData.headers && e.postData.headers.origin
    ? e.postData.headers.origin
    : '';

  Logger.log("Request origin: " + origin);

  const responseOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  Logger.log("Response origin: " + responseOrigin);

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
        description: buildEventDescription(data, paymentResult.payment_id),
        location: data.dropoff_address + ", " + data.dropoff_city
      }
    );

    Logger.log("Calendar event created: " + event.getId());

    // Step 3: Log to Google Sheet
    Logger.log("Step 3: Logging to sheet...");
    logBookingToSheet(data, paymentResult.payment_id);

    // Step 4: Send confirmation email
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
    return createSuccessResponse(response, responseOrigin);

  } catch (error) {
    Logger.log("=== doPost ERROR ===");
    Logger.log("Error: " + error.message);
    Logger.log("Stack: " + error.stack);
    return createErrorResponse(error.message, responseOrigin);
  }
}

/**
 * Process payment with Square
 */
function processSquarePayment(paymentToken, amountCents, bookingData) {
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

/**
 * Log booking to Google Sheet
 */
function logBookingToSheet(data, paymentId) {
  try {
    var sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);

    if (!sheet) {
      Logger.log("Creating new sheet: " + SHEET_NAME);
      sheet = SpreadsheetApp.openById(SHEET_ID).insertSheet(SHEET_NAME);

      // Add headers
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

    // Add booking row
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
  } catch (error) {
    Logger.log("Error logging to sheet: " + error.message);
    // Don't throw - we don't want to fail the booking if sheet logging fails
  }
}

/**
 * Send confirmation email
 */
function sendConfirmationEmail(data, paymentId) {
  try {
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
  } catch (error) {
    Logger.log("Error sending email: " + error.message);
    // Don't throw - we don't want to fail the booking if email fails
  }
}

/**
 * Get fully booked dates
 */
function getFullyBookedDates() {
  try {
    var calendar = CalendarApp.getCalendarById(CALENDAR_ID);
    if (!calendar) {
      throw new Error("Calendar not found");
    }

    // Get events for next 90 days
    var startDate = new Date();
    var endDate = new Date();
    endDate.setDate(endDate.getDate() + 90);

    var events = calendar.getEvents(startDate, endDate);

    // Group events by date
    var dateCount = {};
    events.forEach(function(event) {
      var dateStr = Utilities.formatDate(event.getStartTime(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
      dateCount[dateStr] = (dateCount[dateStr] || 0) + 1;
    });

    // Find fully booked dates
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

/**
 * Create success response with CORS headers
 */
function createSuccessResponse(data, origin) {
  var output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);

  // Add CORS headers
  const responseOrigin = origin || ALLOWED_ORIGINS[0];
  output.setHeader('Access-Control-Allow-Origin', responseOrigin);
  output.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  output.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  output.setHeader('Access-Control-Max-Age', '3600');

  return output;
}

/**
 * Create error response with CORS headers
 */
function createErrorResponse(message, origin) {
  var output = ContentService.createTextOutput(JSON.stringify({
    status: "error",
    message: message
  }));
  output.setMimeType(ContentService.MimeType.JSON);

  // Add CORS headers
  const responseOrigin = origin || ALLOWED_ORIGINS[0];
  output.setHeader('Access-Control-Allow-Origin', responseOrigin);
  output.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  output.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  output.setHeader('Access-Control-Max-Age', '3600');

  return output;
}
