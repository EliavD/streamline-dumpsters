/**
 * MINIMAL TEST VERSION - CORRECT CORS FIX
 * Uses setXFrameOptionsMode() which is the CORRECT method for Apps Script
 */

function doOptions(e) {
  return ContentService.createTextOutput()
    .setMimeType(ContentService.MimeType.TEXT);
}

function doGet(e) {
  Logger.log("doGet called");

  var result = {
    status: "ok",
    message: "CORS test successful - CORRECT FIX",
    fullyBookedDates: []
  };

  var output = ContentService.createTextOutput(JSON.stringify(result));
  output.setMimeType(ContentService.MimeType.JSON);

  // THIS IS THE CORRECT METHOD - not setHeader()!
  output.setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);

  Logger.log("doGet returning with CORS enabled via setXFrameOptionsMode");
  return output;
}

function doPost(e) {
  Logger.log("doPost called");

  var output = ContentService.createTextOutput(JSON.stringify({
    status: "error",
    message: "POST not implemented in test version"
  }));
  output.setMimeType(ContentService.MimeType.JSON);

  // THIS IS THE CORRECT METHOD - not setHeader()!
  output.setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);

  return output;
}
