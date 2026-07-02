/**
 * WORKING VERSION - Uses HtmlService for proper CORS support
 * ContentService doesn't support setXFrameOptionsMode() - only HtmlService does!
 */

function doOptions(e) {
  // For OPTIONS preflight, return simple text response
  var output = HtmlService.createHtmlOutput("");
  output.setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  return output;
}

function doGet(e) {
  Logger.log("doGet called");

  var result = {
    status: "ok",
    message: "CORS working - using HtmlService",
    fullyBookedDates: []
  };

  // Convert JSON to string
  var jsonString = JSON.stringify(result);

  // Use HtmlService (not ContentService) for setXFrameOptionsMode support
  var output = HtmlService.createHtmlOutput(jsonString);

  // This method EXISTS on HtmlOutput
  output.setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);

  // Tell browser to treat it as JSON
  output.setTitle('API Response');

  Logger.log("doGet returning JSON via HtmlService");
  return output;
}

function doPost(e) {
  Logger.log("doPost called");

  var jsonString = JSON.stringify({
    status: "error",
    message: "POST not implemented in test version"
  });

  var output = HtmlService.createHtmlOutput(jsonString);
  output.setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);

  Logger.log("doPost returning");
  return output;
}
