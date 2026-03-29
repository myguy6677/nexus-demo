// ============================================
// NEXUS — Google Apps Script (Form Backend)
// ============================================
//
// SETUP INSTRUCTIONS:
// 1. Go to https://sheets.google.com → Create a new spreadsheet
// 2. Name it "Nexus Form Submissions"
// 3. In row 1, add these headers: Timestamp | First Name | Last Name | Email | Phone | Business Name | Business Type | Current Website | Project Types | Project Goals | Inspiration | Timeline | Budget | Referral | Additional Notes
// 4. Go to Extensions → Apps Script
// 5. Delete everything in Code.gs and paste this entire file
// 6. Click Deploy → New Deployment
// 7. Select type: "Web app"
// 8. Set "Execute as": Me
// 9. Set "Who has access": Anyone
// 10. Click Deploy → copy the URL
// 11. Paste that URL into js/app.js where it says GOOGLE_SCRIPT_URL
//
// That's it. Every form submission will add a row to your spreadsheet.

function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = JSON.parse(e.postData.contents);

    sheet.appendRow([
      new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }),
      data.firstName || data.name || '',
      data.lastName || '',
      data.email || '',
      data.phone || '',
      data.businessName || '',
      data.businessType || '',
      data.currentWebsite || '',
      data.projectTypes || data.subject || '',
      data.projectGoals || data.message || '',
      data.inspiration || '',
      data.timeline || '',
      data.budget || '',
      data.referral || '',
      data.additional || ''
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'success' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Test function — run this in Apps Script to verify it works
function testDoPost() {
  var e = {
    postData: {
      contents: JSON.stringify({
        firstName: 'Jane',
        lastName: 'Foster',
        email: 'jane@example.com',
        phone: '(555) 123-4567',
        businessName: 'Sunrise Café',
        businessType: 'restaurant',
        currentWebsite: 'https://sunrisecafe.com',
        projectTypes: 'New Website, Landing Page',
        projectGoals: 'Get more online orders',
        inspiration: 'sweetgreen.com',
        timeline: '2-4weeks',
        budget: '500',
        referral: 'google',
        additional: 'Need it before summer'
      })
    }
  };
  var result = doPost(e);
  Logger.log(result.getContent());
}
