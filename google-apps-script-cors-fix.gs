/**
 * ================================================================================
 * GOOGLE APPS SCRIPT - CORS FIX FOR BOOKING SYSTEM
 * Streamline Dumpsters Ltd. - Updated Backend with CORS Headers
 * ================================================================================
 *
 * INSTRUCTIONS:
 * 1. Copy this entire code to your Google Apps Script project
 * 2. Replace your existing code.gs file content with this
 * 3. Deploy as web app with execute permissions for "Anyone"
 * 4. Test using the provided debugging tools
 *
 * SECURITY NOTE:
 * This uses "*" for Access-Control-Allow-Origin for development.
 * In production, replace "*" with your specific domain for better security.
 *
 * ================================================================================
 */

// ================================================================================
// CORS HELPER FUNCTION
// ================================================================================

/**
 * Add CORS headers to any response
 * @param {ContentService.TextOutput} response - The response to add headers to
 * @returns {ContentService.TextOutput} Response with CORS headers
 */
function addCorsHeaders(response) {
  return response.setHeaders({
    'Access-Control-Allow-Origin': '*', // Change to your domain in production
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400', // 24 hours
    'Content-Type': 'application/json'
  });
}

// ================================================================================
// MAIN REQUEST HANDLERS
// ================================================================================

/**
 * Handle GET requests (availability checking and fully booked dates)
 * @param {Object} e - Event object with parameters
 * @returns {ContentService.TextOutput} JSON response with CORS headers
 */
function doGet(e) {
  Logger.log("--- New doGet Execution ---");
  Logger.log("Parameters: " + JSON.stringify(e.parameter));

  try {
    let result;

    if (e.parameter.action === "getFullyBooked") {
      // Handle fully booked dates request
      result = getFullyBookedDates();
    } else {
      // Handle availability check request
      const calendarId = getCalendarId();
      const calendar = CalendarApp.getCalendarById(calendarId);

      if (!calendar) {
        throw new Error("Calendar not found with ID: " + calendarId);
      }

      const start = e.parameter.start;
      const end = e.parameter.end;

      if (!start || !end) {
        throw new Error("Missing 'start' or 'end' parameters.");
      }

      Logger.log("Checking availability for: " + start + " to " + end);

      const startDate = toLocalMidnight(start);
      const endDate = toLocalMidnight(end);
      endDate.setDate(endDate.getDate() + 1);

      const events = calendar.getEvents(startDate, endDate);
      const overlapping = events.length;

      Logger.log("Found " + overlapping + " overlapping events");

      result = ContentService.createTextOutput(JSON.stringify({
        status: "ok",
        overlapping: overlapping,
        available: overlapping < 3,
        message: overlapping >= 3 ? "Fully booked for selected dates" : "Available"
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // Add CORS headers to the response
    return addCorsHeaders(result);

  } catch (error) {
    Logger.log("Error in doGet: " + error.message);
    Logger.log("Error stack: " + error.stack);

    const errorResponse = ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.message,
      timestamp: new Date().toISOString()
    })).setMimeType(ContentService.MimeType.JSON);

    return addCorsHeaders(errorResponse);
  }
}

/**
 * Handle POST requests (booking creation)
 * @param {Object} e - Event object with parameters and postData
 * @returns {ContentService.TextOutput} JSON response with CORS headers
 */
function doPost(e) {
  Logger.log("--- New doPost Execution ---");

  try {
    const postData = JSON.parse(e.postData.contents);
    Logger.log("Post data: " + JSON.stringify(postData));

    // Extract booking information
    const name = postData.name;
    const email = postData.email;
    const phone = postData.phone;
    const dropoff_address = postData.dropoff_address;
    const dropoff_city = postData.dropoff_city;
    const dropoff_zip = postData.dropoff_zip;
    const dropoff_notes = postData.dropoff_notes;
    const delivery_date = postData.delivery_date;
    const pickup_date = postData.pickup_date;
    const rental_duration = postData.rental_duration;
    const time = postData.time;
    const payment_id = postData.payment_id;
    const amount = postData.amount;

    // Validate required fields
    if (!name || !email || !delivery_date || !pickup_date || !dropoff_address || !dropoff_city || !dropoff_zip) {
      throw new Error("Missing required booking information");
    }

    // Get calendar
    const calendarId = getCalendarId();
    const calendar = CalendarApp.getCalendarById(calendarId);

    if (!calendar) {
      throw new Error("Calendar not found");
    }

    // Check availability one more time
    const startDate = toLocalMidnight(delivery_date);
    const endDate = toLocalMidnight(pickup_date);
    endDate.setDate(endDate.getDate() + 1);

    const existingEvents = calendar.getEvents(startDate, endDate);
    if (existingEvents.length >= 3) {
      throw new Error("Selected dates are no longer available");
    }

    // Create event title with booking details
    const eventTitle = `Dumpster Rental - ${name}`;
    const eventDescription = [
      `Customer: ${name}`,
      `Email: ${email}`,
      `Phone: ${phone}`,
      `Drop-off Address: ${dropoff_address}, ${dropoff_city}, ${dropoff_zip}`,
      dropoff_notes ? `Special Instructions: ${dropoff_notes}` : '',
      `Delivery Time: ${time}`,
      `Duration: ${rental_duration} days`,
      `Payment ID: ${payment_id}`,
      `Amount: $${amount}`,
      `Booked: ${new Date().toLocaleString()}`
    ].filter(line => line).join('\n');

    // Create calendar event
    const event = calendar.createEvent(
      eventTitle,
      new Date(delivery_date + 'T00:00:00'),
      new Date(pickup_date + 'T23:59:59'),
      {
        description: eventDescription,
        location: `${dropoff_address}, ${dropoff_city}, ${dropoff_zip}`
      }
    );

    Logger.log("Event created successfully: " + event.getId());

    const response = ContentService.createTextOutput(JSON.stringify({
      status: "booked",
      message: `Dumpster successfully booked from ${delivery_date} to ${pickup_date}.`,
      event_id: event.getId(),
      booking_reference: event.getId().split('@')[0]
    })).setMimeType(ContentService.MimeType.JSON);

    return addCorsHeaders(response);

  } catch (error) {
    Logger.log("Error in doPost: " + error.message);
    Logger.log("Error stack: " + error.stack);

    const errorResponse = ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.message,
      timestamp: new Date().toISOString()
    })).setMimeType(ContentService.MimeType.JSON);

    return addCorsHeaders(errorResponse);
  }
}

/**
 * Handle OPTIONS requests for CORS preflight
 * @param {Object} e - Event object
 * @returns {ContentService.TextOutput} Empty response with CORS headers
 */
function doOptions(e) {
  Logger.log("--- OPTIONS (Preflight) Request ---");

  const response = ContentService.createTextOutput('');
  return addCorsHeaders(response);
}

// ================================================================================
// UTILITY FUNCTIONS
// ================================================================================

/**
 * Get the calendar ID for bookings
 * @returns {string} Calendar ID
 */
function getCalendarId() {
  // Replace with your actual calendar ID
  // You can find this in Google Calendar settings
  return 'your-calendar-id@group.calendar.google.com';

  // Alternatively, use the primary calendar:
  // return CalendarApp.getDefaultCalendar().getId();
}

/**
 * Convert date string to local midnight
 * @param {string} dateStr - Date string in YYYY-MM-DD format
 * @returns {Date} Date object set to local midnight
 */
function toLocalMidnight(dateStr) {
  const date = new Date(dateStr + 'T00:00:00');
  return date;
}

/**
 * Get fully booked dates for the next 3 months
 * @returns {ContentService.TextOutput} JSON response with fully booked dates
 */
function getFullyBookedDates() {
  try {
    Logger.log("Getting fully booked dates...");

    const calendarId = getCalendarId();
    const calendar = CalendarApp.getCalendarById(calendarId);

    if (!calendar) {
      throw new Error("Calendar not found");
    }

    const today = new Date();
    const futureDate = new Date();
    futureDate.setMonth(today.getMonth() + 3); // Look 3 months ahead

    const events = calendar.getEvents(today, futureDate);
    const bookingsPerDate = {};

    // Count bookings per date
    events.forEach(event => {
      const start = new Date(event.getStartTime());
      const end = new Date(event.getEndTime());

      // Count each day the event spans
      for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split("T")[0];
        bookingsPerDate[dateStr] = (bookingsPerDate[dateStr] || 0) + 1;
      }
    });

    // Find dates with 3 or more bookings (fully booked)
    const fullyBooked = Object.keys(bookingsPerDate).filter(date => bookingsPerDate[date] >= 3);

    Logger.log("Fully booked dates: " + JSON.stringify(fullyBooked));

    return ContentService.createTextOutput(JSON.stringify({
      status: "ok",
      fullyBookedDates: fullyBooked,
      totalDatesChecked: Object.keys(bookingsPerDate).length,
      timestamp: new Date().toISOString()
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    Logger.log("Error in getFullyBookedDates: " + error.message);

    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.message,
      timestamp: new Date().toISOString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// ================================================================================
// TESTING FUNCTIONS (Optional - for debugging)
// ================================================================================

/**
 * Test function to verify CORS setup
 * Run this manually to test your setup
 */
function testCorsSetup() {
  Logger.log("Testing CORS setup...");

  // Test GET request
  const getResult = doGet({
    parameter: {
      action: "getFullyBooked"
    }
  });

  Logger.log("GET test result: " + getResult.getContent());

  // Test POST request
  const postResult = doPost({
    postData: {
      contents: JSON.stringify({
        name: "Test User",
        email: "test@example.com",
        phone: "5551234567",
        dropoff_address: "123 Test St",
        dropoff_city: "Test City",
        dropoff_zip: "12345",
        delivery_date: "2024-12-01",
        pickup_date: "2024-12-03",
        rental_duration: 2,
        time: "09:00-11:00",
        payment_id: "test_payment",
        amount: 299
      })
    }
  });

  Logger.log("POST test result: " + postResult.getContent());
}

/**
 * Initialize calendar for testing
 * Run this once to set up test events
 */
function initializeTestData() {
  Logger.log("Initializing test data...");

  const calendar = CalendarApp.getDefaultCalendar();

  // Create some test events
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  calendar.createEvent(
    "Test Booking 1",
    today,
    tomorrow,
    {
      description: "Test booking event for development"
    }
  );

  Logger.log("Test data created successfully");
}

// ================================================================================
// DEPLOYMENT INSTRUCTIONS
// ================================================================================

/*
DEPLOYMENT STEPS:

1. In Google Apps Script:
   - Create a new project or open your existing one
   - Replace all code with this file content
   - Update getCalendarId() function with your actual calendar ID
   - Save the project

2. Deploy as Web App:
   - Click "Deploy" > "New deployment"
   - Type: "Web app"
   - Execute as: "Me"
   - Who has access: "Anyone" (for CORS to work)
   - Click "Deploy"
   - Copy the web app URL

3. Update your booking system:
   - Replace the GAS_WEB_APP_URL in config.js with your new URL

4. Test:
   - Use the browser debugging tools provided
   - Check browser console for detailed logs
   - Verify CORS headers are present

5. Security (Production):
   - Change Access-Control-Allow-Origin from "*" to your domain
   - Consider adding authentication if needed
   - Monitor usage through Google Apps Script dashboard

TROUBLESHOOTING:
- If still getting CORS errors, ensure the web app is deployed with "Anyone" access
- Check that the calendar ID is correct in getCalendarId()
- Verify the web app URL is correct in your config.js
- Use the testCorsSetup() function to debug server-side issues
*/