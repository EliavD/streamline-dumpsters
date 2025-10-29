# Google Reviews Setup Guide - Streamline Dumpsters

**Goal**: Enable automatic Google Business reviews on your website

**Time Required**: 10 minutes

---

## 🎯 What You Need

Just **ONE API**: **Places API** (for fetching Google Business reviews)

---

## 📝 Step-by-Step Instructions

### Step 1: Create Google Cloud Project (2 minutes)

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/

2. **Sign in**
   - Use the Google account that manages your Google Business Profile

3. **Create New Project**
   - Click the **project dropdown** at the top left (next to "Google Cloud")
   - Click **"NEW PROJECT"**
   - **Project Name**: `Streamline Dumpsters`
   - Click **"CREATE"**
   - Wait 10-30 seconds
   - Click **"SELECT PROJECT"** when ready

---

### Step 2: Enable Places API (1 minute)

1. **Go to API Library**
   - Visit: https://console.cloud.google.com/apis/library
   - OR: Left menu → "APIs & Services" → "Library"

2. **Search for Places API**
   - In search bar, type: `Places API`
   - Click on **"Places API"** (the one WITHOUT "(New)" in the name)

3. **Enable It**
   - Click the blue **"ENABLE"** button
   - Wait a few seconds for it to activate

---

### Step 3: Create API Key (2 minutes)

1. **Go to Credentials**
   - Visit: https://console.cloud.google.com/apis/credentials
   - OR: Left menu → "APIs & Services" → "Credentials"

2. **Create New Key**
   - Click **"+ CREATE CREDENTIALS"** at the top
   - Select **"API key"**

3. **Copy Your API Key**
   - A popup shows your new key (looks like: `AIzaSyABC123...`)
   - **COPY THIS KEY** - you'll need it in a moment
   - Click **"RESTRICT KEY"** (important for security!)

---

### Step 4: Restrict API Key (3 minutes)

**Why?** So nobody else can steal and use your API key

1. **Name Your Key**
   - **Name**: `Streamline Dumpsters - Reviews API`

2. **Application Restrictions**
   - Select: **"HTTP referrers (websites)"**
   - Click **"ADD AN ITEM"**
   - Add these referrers (one per line):
     ```
     http://localhost:3000/*
     http://127.0.0.1:3000/*
     https://yourdomain.com/*
     https://www.yourdomain.com/*
     ```
     ⚠️ **Replace `yourdomain.com`** with your actual website domain

3. **API Restrictions**
   - Select: **"Restrict key"**
   - From the dropdown, check **ONLY**:
     - ✅ **Places API**

4. **Save**
   - Click **"SAVE"** at the bottom
   - Wait for confirmation

---

### Step 5: Enable Billing (2 minutes)

**Don't worry!** You get:
- ✅ **$200 FREE credit** for new users (3 months)
- ✅ **28,000 FREE requests/month** for Places API
- ✅ Your website will use ~30-50 requests/month (WAY under the limit)

1. **Go to Billing**
   - Visit: https://console.cloud.google.com/billing
   - OR: Left menu → "Billing"

2. **Link Billing Account**
   - Click **"LINK A BILLING ACCOUNT"**
   - If you don't have one, click **"CREATE BILLING ACCOUNT"**
   - Add a credit/debit card (required but won't be charged under free tier)
   - Complete the setup

3. **Link to Your Project**
   - Select your billing account
   - Click **"SET ACCOUNT"**

---

### Step 6: Update Your Website Code (1 minute)

1. **Update .env file**

   Open your `.env` file and update these lines:
   ```env
   GOOGLE_PLACES_API_KEY=YOUR_NEW_API_KEY_HERE
   GOOGLE_PLACE_ID=ChIJkyC9UZaddGARr7nDEx3FM8I
   ```

   Replace `YOUR_NEW_API_KEY_HERE` with the API key you copied in Step 3.

   **Example:**
   ```env
   GOOGLE_PLACES_API_KEY=AIzaSyBxC3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R
   GOOGLE_PLACE_ID=ChIJkyC9UZaddGARr7nDEx3FM8I
   ```

2. **Update reviews.js** (if needed)

   The API key in your code should match. Open `js/reviews.js` and find this line (around line 163):
   ```javascript
   const API_KEY = 'AIzaSyAZtAgmy8J7jsNJ6KevUJf88tH9DVybHCs';
   ```

   Replace it with your new API key:
   ```javascript
   const API_KEY = 'YOUR_NEW_API_KEY_HERE';
   ```

---

### Step 7: Test Your Setup (1 minute)

#### Test in Browser

1. **Test the API directly**

   Open a new browser tab and paste this URL (replace `YOUR_API_KEY`):
   ```
   https://maps.googleapis.com/maps/api/place/details/json?place_id=ChIJkyC9UZaddGARr7nDEx3FM8I&fields=name,rating,reviews&key=YOUR_API_KEY
   ```

2. **What you should see:**
   - ✅ **Success**: JSON data with `"status": "OK"` and your business reviews
   - ❌ **Error**: `"REQUEST_DENIED"` - Go back and check Steps 2 & 5

#### Test on Your Website

1. **Clear your cache**
   - Press `F12` to open Developer Tools
   - Go to **Console** tab
   - Type: `localStorage.removeItem('streamline_reviews')`
   - Press Enter

2. **Refresh your website**
   - Press `Ctrl+F5` (Windows) or `Cmd+Shift+R` (Mac)

3. **Check the Console**
   - Look for this message:
     ```
     Loaded X reviews from Google Places API
     ```
   - If you see this: **SUCCESS!** ✅
   - If you see "using fallback": Check Steps 2-5 again

---

## 🎉 You're Done!

Your website will now:
- ✅ Automatically fetch real Google Business reviews
- ✅ Cache them for 24 hours (so you don't waste API calls)
- ✅ Update daily with new reviews
- ✅ Fall back to manual reviews if API fails

---

## ⚠️ Troubleshooting

### Error: "REQUEST_DENIED"

**Solutions:**
1. ✅ Make sure you enabled **Places API** (Step 2)
2. ✅ Make sure you set up **Billing** (Step 5)
3. ✅ Wait 1-2 minutes after enabling - sometimes takes time to propagate

### Error: "INVALID_REQUEST"

**Solutions:**
1. ✅ Check your Place ID is correct: `ChIJkyC9UZaddGARr7nDEx3FM8I`
2. ✅ Make sure API key is copied correctly (no extra spaces)

### Reviews Show Fallback Data

**Solutions:**
1. ✅ Clear localStorage: `localStorage.removeItem('streamline_reviews')`
2. ✅ Check browser console (F12) for error messages
3. ✅ Test API URL in browser (Step 7, part 1)

### Error: "API key not valid"

**Solutions:**
1. ✅ Check HTTP referrer restrictions match your domain
2. ✅ Try removing restrictions temporarily to test
3. ✅ Make sure you restricted to "Places API" not other APIs

---

## 💰 Pricing & Quotas

### Free Tier (You'll Stay Here)

- **28,000 requests/month FREE**
- Your usage: ~30-50 requests/month
- **You will NOT be charged**

### How It Works

- Each page load = 1 request (but cached for 24 hours)
- If 100 people visit your site per day = ~100 requests/month
- Still WAY under the 28,000 free limit

### After Free Tier (You won't hit this)

- Cost: $17 per 1,000 additional requests
- You'd need 28,000+ requests/month to be charged

---

## 🔒 Security Checklist

- [ ] API key is restricted to your domain only
- [ ] API key is in `.env` file (not committed to Git)
- [ ] `.env` is in your `.gitignore` file
- [ ] Only Places API is enabled for this key
- [ ] Billing is set up (required for API access)

---

## 📊 Monitor Your Usage

Check how many API calls you're using:

1. Go to: https://console.cloud.google.com/apis/dashboard
2. Click on "Places API"
3. See traffic, requests, and errors

Set up alerts if you want:
1. Go to: https://console.cloud.google.com/apis/api/places-backend.googleapis.com/quotas
2. Set daily quota limits (optional)

---

## ✅ Final Checklist

- [ ] Created Google Cloud project
- [ ] Enabled Places API
- [ ] Created API key
- [ ] Restricted API key to website domain
- [ ] Restricted API key to Places API only
- [ ] Set up billing account
- [ ] Updated `.env` with new API key
- [ ] Updated `js/reviews.js` with new API key
- [ ] Tested API in browser URL
- [ ] Cleared localStorage cache
- [ ] Tested website - reviews loading!

---

**Your Credentials:**
- Place ID: `ChIJkyC9UZaddGARr7nDEx3FM8I` ✅
- New API Key: `AIzaSy...` (you'll create this in Step 3)

**Need help?** The setup should take ~10 minutes total. If you get stuck on any step, check the Troubleshooting section above!
