# Square Payment Testing Guide

## Current Status

✅ **HTTPS Server Running Successfully!**

The server is now running at: **https://localhost:8443**

This resolves the Square SDK HTTPS requirement error you were experiencing.

---

## Step 1: Access the HTTPS Site

1. Open your browser and navigate to:
   ```
   https://localhost:8443
   ```

2. **IMPORTANT**: You will see a security warning because we're using a self-signed certificate
   - Chrome: Click "Advanced" → "Proceed to localhost (unsafe)"
   - Firefox: Click "Advanced" → "Accept the Risk and Continue"
   - Edge: Click "Advanced" → "Continue to localhost (unsafe)"

   **This is safe** - it's your own local development server with a self-signed certificate.

---

## Step 2: Test the Booking Modal with Payment

1. Click **"Book Now"** button on the homepage

2. **Step 1 - Select Dates**:
   - Choose a delivery date
   - Choose a pickup date
   - Click "Continue to Contact Info"

3. **Step 2 - Contact Information**:
   - Fill in all required fields:
     - Full Name
     - Email Address
     - Phone Number
     - Street Address
     - City/ZIP selection (dropdown)
   - Click "Continue to Payment"

4. **Step 3 - Payment** (This is where Square SDK loads):
   - You should now see the Square credit card form
   - The form should have fields for:
     - Card Number
     - Expiration Date
     - CVV
     - ZIP Code

---

## Step 3: Test Payment Processing

### Option A: Use Square Test Cards (Sandbox Mode)

If you want to test without charging real cards, switch to sandbox mode:

**Test Card Numbers**:
- **Successful Payment**: `4111 1111 1111 1111`
- **Card Declined**: `4000 0000 0000 0002`
- **Insufficient Funds**: `4000 0000 0000 9995`

**Test Details** (use with any test card):
- Expiration: Any future date (e.g., 12/25)
- CVV: Any 3 digits (e.g., 123)
- ZIP: Any 5 digits (e.g., 12345)

### Option B: Test with Production (Real Charges)

⚠️ **WARNING**: Using production credentials will create REAL charges!

Your current setup uses **production credentials**:
- App ID: `sq0idp-8ppjtDG8I7H8kNx2WfH5LQ`
- Location ID: `L9MVPB33HG9N0`
- Access Token: `EAAAl8RVO0aQ5RZupn21Rc6ausx1VTMLv-DH4QFItbwgjwOHQ0U78pjChsjO-MdA`

**If you test with production:**
1. Use a real credit card
2. You WILL be charged $299.00
3. The booking WILL be created in your calendar
4. The customer WILL receive a confirmation email
5. The transaction WILL appear in your Square dashboard

---

## Step 4: Verify Successful Booking

After clicking "Pay & Complete Booking", check:

1. **Browser Console** (F12):
   ```javascript
   ✅ Payment successful!
   ✅ Booking confirmed
   ```

2. **Google Calendar**:
   - Event should be created with dates
   - Event description includes payment ID

3. **Google Sheets**:
   - New row added with booking details
   - Payment status: "PAID"

4. **Square Dashboard**:
   - Transaction appears in Transactions list
   - Amount: $299.00
   - Status: COMPLETED

5. **Email**:
   - Customer receives confirmation email
   - Email includes booking details and payment ID

---

## Troubleshooting

### Payment Form Not Showing

**Check Browser Console** (F12) for errors:

```javascript
// ✅ GOOD - Form loading
🔧 initializeSquarePayment() called
📦 Using existing PaymentProcessor from bookingModal
✅ Square payment form created successfully

// ❌ BAD - Still HTTPS error
WebSdkEmbedError: Web Payments SDK can only be embedded on sites that use HTTPS
```

**If you still see HTTPS error:**
- Make sure you're accessing **https://localhost:8443** (not http://)
- Clear browser cache and hard refresh (Ctrl+Shift+R)
- Check that HTTPS server is still running

### Certificate Errors

If you see "NET::ERR_CERT_AUTHORITY_INVALID":
- This is normal for self-signed certificates
- Click "Advanced" → "Proceed to localhost"
- The site is safe - it's your local development server

### Payment Fails

**Check these locations for error details:**

1. **Browser Console**: Payment error message
2. **Google Apps Script Logs**:
   - Go to: https://script.google.com
   - Open your booking script
   - View → Logs
3. **Square Dashboard**: Check for declined transactions

**Common Payment Errors**:
- `CVV_FAILURE`: Wrong CVV code
- `INVALID_CARD`: Card number invalid
- `GENERIC_DECLINE`: Card declined by issuer

---

## Switch Between Sandbox and Production

### To Switch to Sandbox (Test Mode):

1. **Update HTML Files** (all 8 pages):
   ```html
   <!-- Change from: -->
   <script src="https://web.squarecdn.com/v1/square.js"></script>

   <!-- To: -->
   <script src="https://sandbox.web.squarecdn.com/v1/square.js"></script>
   ```

2. **Update js/config.js**:
   ```javascript
   const ENV = 'sandbox'; // Change from 'production'
   ```

3. **Hard refresh browser** (Ctrl+Shift+R)

### To Switch Back to Production:

1. Reverse the changes above
2. Clear browser cache
3. Hard refresh

---

## Files Modified for Payment Integration

### Frontend Files:
- ✅ `index.html` - Added Square SDK script
- ✅ `bookNow.html` - Updated Square SDK to production
- ✅ `dublin.html` - Updated Square SDK to production
- ✅ `hilliard.html` - Updated Square SDK to production
- ✅ `upper-arlington.html` - Updated Square SDK to production
- ✅ `worthington.html` - Updated Square SDK to production
- ✅ `powell.html` - Updated Square SDK to production
- ✅ `plain-city.html` - Updated Square SDK to production
- ✅ `js/config.js` - Production credentials added
- ✅ `js/core.min.js` - Production credentials added
- ✅ `js/bookNow.js` - Payment initialization function added
- ✅ `components/booking-modal.html` - Three-step modal with payment

### Backend Files:
- ✅ `google-apps-script-booking-with-payments.gs` - Payment processing backend
- ✅ `.env` - Production credentials stored securely

### Server Files:
- ✅ `https-server.js` - HTTPS development server (port 8443)
- ✅ `certs/` - SSL certificates for local HTTPS

---

## Production Deployment Checklist

Before deploying to your live website:

1. ✅ Test complete booking flow on HTTPS localhost
2. ✅ Verify payment processing works
3. ✅ Verify calendar event creation
4. ✅ Verify Google Sheets logging
5. ✅ Verify confirmation email sent
6. ⚠️ **Consider rotating your Access Token** (you shared it in conversation)
7. ✅ Update `.gitignore` to exclude `.env` file
8. ✅ Upload all files to production server
9. ✅ Test on live domain with real HTTPS
10. ✅ Monitor Square dashboard for transactions

---

## Security Recommendations

1. **Rotate Access Token**: Since the token was shared in this conversation, consider generating a new one:
   - Go to: https://developer.squareup.com
   - Navigate to your app → Production → Credentials
   - Generate new Access Token
   - Update `.env` file
   - Re-deploy Google Apps Script

2. **Never Commit `.env`**: Ensure `.env` is in `.gitignore`

3. **Use Environment Variables**: On production, store credentials in environment variables, not in files

---

## Next Steps

1. **Test on localhost HTTPS** (https://localhost:8443)
2. **Verify payment flow works completely**
3. **Consider switching to sandbox for testing** (to avoid real charges)
4. **Deploy to production when ready**
5. **Test on live site with real domain**

---

## Stop the HTTPS Server

When you're done testing:

```bash
# Find the process
netstat -ano | findstr :8443

# Or just press Ctrl+C in the terminal running the server
```

---

## Questions or Issues?

If you encounter any problems:
1. Check browser console for JavaScript errors
2. Check Google Apps Script logs for backend errors
3. Check Square dashboard for payment issues
4. Verify all credentials are correct in `.env` file
