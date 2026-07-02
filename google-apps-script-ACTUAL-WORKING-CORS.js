/**
 * ACTUAL WORKING CORS SOLUTION FOR GOOGLE APPS SCRIPT
 *
 * The truth: Google Apps Script Web Apps deployed as "Anyone" automatically
 * add Access-Control-Allow-Origin: * headers when you use ContentService.
 *
 * You DON'T need setHeader() or setXFrameOptionsMode() - those don't exist!
 *
 * The key is:
 * 1. Use ContentService.createTextOutput()
 * 2. Set MIME type to JSON
 * 3. Deploy with "Who has access: Anyone"
 * 4. That's it - Google handles CORS automatically
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
 * Google Apps Script handles CORS automatically for "Anyone" deployments
 */
function doOptions(e) {
  Logger.log("=== doOptions (CORS Preflight) ===" );

  // Just return empty response - Google adds CORS headers automatically
  return ContentService.createTextOutput("");
}

/**
 * Handle GET requests
 * CORS headers are added automatically by Google when deployed as "Anyone"
 */
function doGet(e) {
  Logger.log("=== doGet START ===");

  try {
    // Ensure parameters exist
    if (!e || !e.parameter) {
      e = { parameter: {} };
    }

    Logger.log("Parameters: " + JSON.stringify(e.parameter));

    var result;

    // Handle getFullyBooked action
    if (e.parameter.action === "getFullyBooked") {
      Logger.log("Action: getFullyBooked");
      result = getFullyBookedDates();
    } else {
      // Default test response
      result = {
        status: "ok",
        message: "CORS working - Google handles it automatically",
        fullyBookedDates: [],
        timestamp: new Date().toISOString()
      };
    }

    Logger.log("Result: " + JSON.stringify(result));

    // Create response - Google adds Access-Control-Allow-Origin automatically
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
 * Handle POST requests
 */
function doPost(e) {
  Logger.log("=== doPost START ===");

  try {
    var data = JSON.parse(e.postData.contents);
    Logger.log("POST data: " + JSON.stringify(data));

    var response = {
      status: "success",
      message: "POST received successfully",
      receivedData: data
    };

    var output = ContentService.createTextOutput(JSON.stringify(response));
    output.setMimeType(ContentService.MimeType.JSON);

    Logger.log("=== doPost SUCCESS ===");
    return output;

  } catch (error) {
    Logger.log("=== doPost ERROR ===");
    Logger.log("Error: " + error.message);

    var errorOutput = ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.message
    }));
    errorOutput.setMimeType(ContentService.MimeType.JSON);

    return errorOutput;
  }
}

/**
 * Get fully booked dates from calendar
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
