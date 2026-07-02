/**
 * MINIMAL TEST VERSION - Just CORS headers
 * This version strips everything down to basics to test if CORS works at all
 */

function doOptions(e) {
  var output = ContentService.createTextOutput("");
  output.setMimeType(ContentService.MimeType.TEXT);
  output.setHeader('Access-Control-Allow-Origin', '*');
  output.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  output.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  output.setHeader('Access-Control-Max-Age', '3600');
  return output;
}

function doGet(e) {
  Logger.log("doGet called");

  var result = {
    status: "ok",
    message: "CORS test successful",
    fullyBookedDates: []
  };

  var output = ContentService.createTextOutput(JSON.stringify(result));
  output.setMimeType(ContentService.MimeType.JSON);
  output.setHeader('Access-Control-Allow-Origin', '*');
  output.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  output.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  Logger.log("doGet returning with CORS headers");
  return output;
}

function doPost(e) {
  Logger.log("doPost called");

  var output = ContentService.createTextOutput(JSON.stringify({
    status: "error",
    message: "POST not implemented in test version"
  }));
  output.setMimeType(ContentService.MimeType.JSON);
  output.setHeader('Access-Control-Allow-Origin', '*');
  output.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  output.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  return output;
}
