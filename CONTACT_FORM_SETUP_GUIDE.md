# Contact Form Setup Guide (Simplified - Email Only)
## Google Apps Script Integration for Streamline Dumpsters

This guide will walk you through setting up your contact form to receive submissions via email. **No spreadsheet required!**

---

## 📋 What This Does

When someone submits your contact form:
1. ✅ Form data is validated and sanitized
2. ✅ You receive an email notification at `Eli@Sl-Dumpsters.com`
3. ✅ User receives a success message
4. ✅ Rate limiting prevents spam (3 submissions per email per hour)

**That's it! Simple and straightforward.**

---

## 🚀 Setup Instructions (5 minutes)

### Step 1: Create New Apps Script Project

1. Go to **https://script.google.com**
2. Click **"+ New project"** (top left)
3. A new tab will open with the Apps Script editor
4. You'll see some default code like `function myFunction() { }`
5. **Delete all of it** (select all and delete)

### Step 2: Add the Script

1. Open the file `google-apps-script-contact-form.gs` from your project folder
2. **Copy ALL the code** (Ctrl+A, Ctrl+C)
3. Go back to the Apps Script editor tab
4. **Paste the code** (Ctrl+V)
5. **IMPORTANT**: Look for line 37 and verify the email is correct:
   ```javascript
   const EMAIL_TO = 'Eli@Sl-Dumpsters.com';
   ```
6. Click the **Save** icon (💾) or press Ctrl+S
7. Name your project: **"Contact Form Handler"**

### Step 3: Deploy as Web App

1. In Apps Script editor, click **Deploy** > **New deployment**
2. Click the gear icon ⚙️ next to "Select type"
3. Choose **Web app**
4. Fill in the settings:
   - **Description**: "Contact form endpoint"
   - **Execute as**: **Me** (your Google account)
   - **Who has access**: **Anyone**
5. Click **Deploy**
6. You may see an authorization warning:
   - Click **Authorize access**
   - Choose your Google account
   - Click **Advanced** > **Go to Contact Form Handler (unsafe)**
   - Click **Allow**
7. **Copy the Web App URL** - it looks like:
   ```
   https://script.google.com/macros/s/ABC123.../exec
   ```
8. **Save this URL somewhere** - you'll need it in the next step!

### Step 4: Update Your Website Code

1. Open the file `js/contact.js` in your project
2. Find line 47 which says:
   ```javascript
   apiEndpoint: 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE',
   ```
3. Replace it with your actual URL:
   ```javascript
   apiEndpoint: 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec',
   ```
   (Use the URL you copied in Step 3)
4. Save the file

### Step 5: Upload Updated File to Your Website

1. Upload the updated `js/contact.js` file to your web server
2. Make sure it replaces the old version at: `https://www.sl-dumpsters.com/js/contact.js`

---

## ✅ Testing Your Contact Form

### Test Submission:

1. Go to your website: `https://www.sl-dumpsters.com/contact.html`
2. Fill out the contact form with test data:
   - Name: Test User
   - Email: your-personal-email@example.com
   - Phone: (614) 555-1234
   - Message: This is a test submission to verify the contact form is working correctly.
3. Click **Send Message**
4. You should see: "Thank you! Your message has been sent successfully..."

### Verify It Worked:

1. **Check your email** (`Eli@Sl-Dumpsters.com`): You should receive a notification email within 1-2 minutes
2. The email should include:
   - Customer's name, email, and phone
   - Their full message
   - Timestamp of submission
   - Reply-to address set to the customer's email (so you can just hit reply!)

---

## 📧 Email Notification Example

You'll receive emails that look like this:

```
Subject: New Contact Form Submission - Streamline Dumpsters

You have received a new contact form submission from your website.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONTACT INFORMATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Name:     John Smith
Email:    john.smith@example.com
Phone:    (614) 555-1234

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MESSAGE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

I need a 14-yard dumpster for a home renovation project
in Dublin. Can you deliver this Saturday?

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SUBMISSION DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Submitted:   January 23, 2025 at 02:30 PM EST
Source:      website_contact_form

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

To reply to this inquiry, simply respond to this email.

--
Streamline Dumpsters Contact Form System
Automated notification - please reply to customer directly
```

**Simply hit "Reply" to respond directly to the customer!**

---

## 🛡️ Security Features

### Built-in Protection:

1. **Input Validation**: All fields are validated and sanitized
2. **Rate Limiting**: Max 3 submissions per email per hour (prevents spam)
3. **HTML Stripping**: Removes any HTML/script tags from submissions
4. **Length Limits**:
   - Name: 100 characters
   - Email: 254 characters
   - Message: 5,000 characters
5. **Email Validation**: Checks email format before accepting

---

## 🔧 Troubleshooting

### Problem: "Unable to connect" error

**Solution**:
- Make sure you copied the FULL web app URL (including `/exec` at the end)
- Verify the URL in `contact.js` line 47 is correct with no typos
- Make sure you deployed as "Anyone" can access (not "Only myself")

### Problem: No email received

**Solution**:
- **Check your spam/junk folder** (this is the most common issue!)
- Verify the email address on line 37 of the script is correct
- Make sure you clicked "Allow" when authorizing the script
- Try submitting another test (sometimes first email is delayed)

### Problem: Form submits but nothing happens

**Solution**:
- Open browser Developer Tools (press F12)
- Go to Console tab
- Try submitting the form again
- Look for red error messages - they'll tell you what's wrong
- Common issues: Wrong URL, missing `/exec` at the end, or typo in the URL

### Problem: Authorization error during deployment

**Solution**:
- Go back to Apps Script editor
- Click Deploy > Test deployments
- Click **Authorize** and follow the prompts again
- Make sure you click "Advanced" and "Go to Contact Form Handler (unsafe)"
- This is normal - Google shows this warning for custom scripts

### Problem: "Too many submissions" error

**Solution**:
- This is the rate limiter working (3 per email per hour)
- Wait one hour to test again, or
- Use a different email address for testing

---

## 🔄 Making Changes

### To Update the Email Address:

1. Go back to https://script.google.com
2. Open your "Contact Form Handler" project
3. Change line 37: `const EMAIL_TO = 'new-email@example.com';`
4. Save (Ctrl+S)
5. Click Deploy > Manage deployments
6. Click the edit icon (pencil) next to your deployment
7. Click "Deploy"
8. Done! (No need to update your website)

### To Adjust Rate Limiting:

1. Open your script at https://script.google.com
2. Find line 43: `const MAX_SUBMISSIONS_PER_EMAIL_PER_HOUR = 3;`
3. Change the number (e.g., `5` or `10`)
4. Save and redeploy (same steps as above)

---

## 📱 Need Help?

If you run into issues:

1. **Check the troubleshooting section above** (covers 90% of issues)
2. **Look at browser console** (F12 → Console tab) for error messages
3. **Verify each setup step** was completed exactly as written
4. **Make sure the web app URL** is correct (most common issue!)

### Common Mistakes:

- ❌ Missing `/exec` at the end of the URL
- ❌ Forgetting to set "Who has access" to "Anyone"
- ❌ Not checking spam folder for emails
- ❌ Using old cached version of contact.js (clear browser cache)

---

## ✨ You're All Set!

Once setup is complete, your contact form will:
- ✅ Work 24/7 automatically
- ✅ Email you every submission instantly
- ✅ Protect against spam with rate limiting
- ✅ Provide a professional user experience
- ✅ Let you reply directly to customers

**Test it thoroughly before announcing it to customers!**

---

## 🎯 Quick Reference

**Script Location:** https://script.google.com
**Your Email:** Eli@Sl-Dumpsters.com
**Rate Limit:** 3 submissions per email per hour
**File to Update:** js/contact.js (line 47)
**What to Update:** Replace `YOUR_GOOGLE_APPS_SCRIPT_URL_HERE` with your web app URL

---

**Total Setup Time: ~5 minutes**

No spreadsheet needed. Just script → deploy → update URL → done!
