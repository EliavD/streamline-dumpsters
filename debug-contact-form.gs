/**
 * SIMPLE DEBUG VERSION - Contact Form Handler
 * This will send an email for EVERY request showing exactly what was received
 */

const EMAIL_TO = 'StreamlineDumpstersLtd@gmail.com';

function doPost(e) {
  // Send immediate debug email showing what was received
  try {
    MailApp.sendEmail({
      to: EMAIL_TO,
      subject: 'DEBUG: Form Submission Received',
      body: 'Raw request data:\n\n' +
            'Type: ' + (e.postData ? e.postData.type : 'NO POSTDATA') + '\n' +
            'Contents: ' + (e.postData ? e.postData.contents : 'NO CONTENTS') + '\n\n' +
            'Full e object: ' + JSON.stringify(e, null, 2)
    });
  } catch (err) {
    console.error('Debug email failed:', err);
  }

  // Try to parse and process
  try {
    const data = JSON.parse(e.postData.contents);

    // Send the actual contact email
    MailApp.sendEmail({
      to: EMAIL_TO,
      subject: 'Contact Form Submission',
      body: 'Name: ' + data.name + '\n' +
            'Email: ' + data.email + '\n' +
            'Phone: ' + (data.phone || 'Not provided') + '\n\n' +
            'Message:\n' + data.message,
      replyTo: data.email
    });

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: 'Email sent!'
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    // Send error email
    try {
      MailApp.sendEmail({
        to: EMAIL_TO,
        subject: 'ERROR: Contact Form Failed',
        body: 'Error: ' + error.toString() + '\n\n' +
              'Stack: ' + error.stack
      });
    } catch (err2) {
      console.error('Error email failed:', err2);
    }

    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput('Debug Contact Form Handler - Ready');
}

function doOptions(e) {
  return ContentService.createTextOutput('OK');
}
