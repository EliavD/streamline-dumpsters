# Google Cloud Console Setup Guide for Streamline Dumpsters

This guide will walk you through setting up a Google Cloud Console project with all the necessary APIs for your website.

## 📋 Overview

You'll need to enable these APIs:
- **Places API** - For fetching Google Business reviews
- **Google Calendar API** - For managing dumpster rental bookings
- **Maps JavaScript API** - For location services (optional, for future use)

---

## 🚀 Step 1: Create a New Google Cloud Project

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/

2. **Sign in with your Google Account**
   - Use the same account that manages your Google Business Profile

3. **Create a New Project**
   - Click the **project dropdown** at the top (next to "Google Cloud")
   - Click **"NEW PROJECT"**
   - Enter project details:
     - **Project Name**: `Streamline Dumpsters Website`
     - **Organization**: Leave as default (No organization)
     - **Location**: Leave as default
   - Click **"CREATE"**

4. **Wait for project creation** (takes 10-30 seconds)
   - You'll see a notification when it's ready
   - Click **"SELECT PROJECT"** in the notification

---

## 🔑 Step 2: Enable Required APIs

### Enable Places API (for Google Reviews)

1. **Go to APIs & Services Library**
   - From the left menu: **"APIs & Services"** → **"Library"**
   - Or visit: https://console.cloud.google.com/apis/library

2. **Search for "Places API"**
   - In the search bar, type: `Places API`
   - You'll see two options:
     - ✅ **"Places API"** (Legacy - enable this one)
     - ⚠️ "Places API (New)" (Skip for now)

3. **Enable Places API**
   - Click on **"Places API"** (the legacy version)
   - Click the blue **"ENABLE"** button
   - Wait for it to activate (takes a few seconds)

### Enable Google Calendar API (for Bookings)

1. **Go back to the Library**
   - Click **"APIs & Services"** → **"Library"**

2. **Search for "Google Calendar API"**
   - Type: `Google Calendar API` in the search bar

3. **Enable Calendar API**
   - Click on **"Google Calendar API"**
   - Click **"ENABLE"**

### Enable Maps JavaScript API (Optional - for future features)

1. **Go back to the Library**
   - Click **"APIs & Services"** → **"Library"**

2. **Search for "Maps JavaScript API"**
   - Type: `Maps JavaScript API`

3. **Enable Maps API**
   - Click on **"Maps JavaScript API"**
   - Click **"ENABLE"**

---

## 🔐 Step 3: Create API Keys

### Create Places API Key

1. **Go to Credentials**
   - Left menu: **"APIs & Services"** → **"Credentials"**
   - Or visit: https://console.cloud.google.com/apis/credentials

2. **Create a New API Key**
   - Click **"+ CREATE CREDENTIALS"** at the top
   - Select **"API key"**

3. **Copy Your New API Key**
   - A popup will show your API key
   - **IMPORTANT**: Copy this key immediately
   - Example: `AIzaSyABC123...` (41 characters)

4. **Restrict the API Key** (Important for Security)
   - Click **"RESTRICT KEY"** in the popup
   - Or click the key name to edit it later

5. **Configure Key Restrictions**
   - **Name**: `Places API Key - Streamline Dumpsters`

   - **Application restrictions**:
     - Select **"HTTP referrers (websites)"**
     - Click **"ADD AN ITEM"**
     - Add your website URLs:
       ```
       http://localhost:3000/*
       http://127.0.0.1:3000/*
       https://yourdomain.com/*
       https://www.yourdomain.com/*
       ```
       (Replace `yourdomain.com` with your actual domain)

   - **API restrictions**:
     - Select **"Restrict key"**
     - Check these APIs:
       - ✅ Places API
       - ✅ Maps JavaScript API (if enabled)

   - Click **"SAVE"**

---

## 📍 Step 4: Get Your Google Place ID

You already have this: `ChIJkyC9UZaddGARr7nDEx3FM8I`

If you need to verify it or find a different location:

1. **Use Place ID Finder**
   - Visit: https://developers.google.com/maps/documentation/javascript/examples/places-placeid-finder

2. **Search for your business**
   - Type: `Streamline Dumpsters Ltd`
   - Click on your business when it appears

3. **Copy the Place ID**
   - The Place ID will appear below the search box
   - Format: `ChIJ...` (many characters)

---

## 🔧 Step 5: Update Your .env File

Replace your old credentials with the new ones:

```env
# Google My Business Reviews & Locations
GOOGLE_PLACES_API_KEY=YOUR_NEW_API_KEY_HERE
GOOGLE_PLACE_ID=ChIJkyC9UZaddGARr7nDEx3FM8I

# Google Calendar API Key (if different from Places key)
GOOGLE_CALENDAR_API_KEY=YOUR_CALENDAR_API_KEY_OR_CALENDAR_ID
```

**Example:**
```env
GOOGLE_PLACES_API_KEY=AIzaSyABC123XYZ789...
GOOGLE_PLACE_ID=ChIJkyC9UZaddGARr7nDEx3FM8I
```

---

## ✅ Step 6: Test Your Setup

### Test Places API

1. **Open a new browser tab**
2. **Paste this URL** (replace `YOUR_API_KEY` with your actual key):
   ```
   https://maps.googleapis.com/maps/api/place/details/json?place_id=ChIJkyC9UZaddGARr7nDEx3FM8I&fields=name,rating,reviews&key=YOUR_API_KEY
   ```

3. **Expected Response**:
   - ✅ Good: You see JSON with `"status": "OK"` and your business reviews
   - ❌ Bad: `"status": "REQUEST_DENIED"` - API not enabled or key restricted incorrectly

### Test on Your Website

1. **Clear your browser cache**
   - Press `F12` to open Developer Tools
   - Go to **Console** tab
   - Run: `localStorage.removeItem('streamline_reviews')`

2. **Refresh the page**
   - The reviews should now load from Google Places API

3. **Check the Console**
   - Look for: `"Loaded X reviews from Google Places API"`
   - If you see this, it's working! ✅

---

## 🛡️ Security Best Practices

### API Key Security

1. **Never commit API keys to Git**
   - Your `.env` file should be in `.gitignore`
   - Check: Does your `.gitignore` include `.env`?

2. **Use HTTP Referrer Restrictions**
   - Always restrict API keys to your specific domains
   - This prevents others from using your key

3. **Monitor API Usage**
   - Go to: https://console.cloud.google.com/apis/dashboard
   - Check daily usage to detect unauthorized use

4. **Set Quota Limits** (Optional but recommended)
   - Go to: https://console.cloud.google.com/apis/api/places-backend.googleapis.com/quotas
   - Set daily limits to prevent unexpected charges

### Billing Setup (Free tier available)

1. **Enable Billing** (Required for most APIs)
   - Go to: https://console.cloud.google.com/billing
   - Click **"Link a billing account"**
   - Add a payment method

   **Note**: Google provides:
   - $200/month free credit for new users
   - Places API: First 28,000 requests/month are FREE
   - You won't be charged unless you exceed free tier

---

## 📊 Monitoring & Quotas

### Check API Usage

1. **Go to API Dashboard**
   - Visit: https://console.cloud.google.com/apis/dashboard

2. **View Traffic**
   - See requests per day for each API
   - Monitor errors and success rates

### Current Free Tier Limits

- **Places API (Legacy)**:
  - Free: Up to 28,000 requests/month
  - Cost: $17 per 1,000 requests after free tier

- **Google Calendar API**:
  - Free: 1,000,000 queries/day (basically unlimited for your use case)

---

## 🔄 Step 7: Update Your Code

After creating new credentials, update your code:

1. **Update .env file** (as shown in Step 5)

2. **Update reviews.js**
   - Replace the API key in the code with your new key
   - Or better yet, fetch it from a config file

3. **Clear localStorage cache**
   ```javascript
   localStorage.removeItem('streamline_reviews');
   ```

4. **Test the website**
   - Refresh the page
   - Check browser console for success messages

---

## ❓ Troubleshooting

### "REQUEST_DENIED" Error

**Possible causes:**
1. API not enabled → Go to APIs Library and enable "Places API"
2. Billing not set up → Enable billing in Google Cloud Console
3. API key restrictions too strict → Check HTTP referrer settings
4. Wrong API key → Copy the correct key from Credentials page

### "INVALID_REQUEST" Error

**Possible causes:**
1. Wrong Place ID → Verify Place ID for your business
2. Missing required fields → Check URL has `fields` parameter

### Reviews Not Loading

**Check:**
1. Browser console for errors (F12 → Console tab)
2. Network tab (F12 → Network) - look for failed requests
3. localStorage cache - clear with `localStorage.clear()`

---

## 📞 Need Help?

- **Google Cloud Support**: https://cloud.google.com/support
- **Places API Documentation**: https://developers.google.com/maps/documentation/places/web-service/overview
- **API Key Best Practices**: https://cloud.google.com/docs/authentication/api-keys

---

## ✨ Summary Checklist

- [ ] Created Google Cloud Console project
- [ ] Enabled Places API (Legacy)
- [ ] Enabled Google Calendar API
- [ ] Created and restricted API key
- [ ] Updated .env file with new credentials
- [ ] Tested API with browser URL
- [ ] Tested reviews loading on website
- [ ] Set up billing (for free tier access)
- [ ] Added HTTP referrer restrictions
- [ ] Verified API key is not in Git

---

**Your Current Credentials:**
- Place ID: `ChIJkyC9UZaddGARr7nDEx3FM8I` ✅
- Old API Key: `AIzaSyAZtAgmy8J7jsNJ6KevUJf88tH9DVybHCs` ⚠️ (May need replacement)

Follow this guide to create fresh credentials with proper restrictions!
