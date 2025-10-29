# How to Update Google Reviews Manually

Your reviews are now **hardcoded** in the website - no API needed! This is simpler, faster, and completely free.

---

## 📍 Where Reviews Are Stored

File: `js/reviews.js`
Lines: 43-93

---

## ✏️ How to Add/Update Reviews

### Step 1: Get New Reviews from Google

1. Go to your Google Business Profile
2. Copy the review text, author name, and date

### Step 2: Edit reviews.js

Open `js/reviews.js` and find the `fallbackReviews` array (around line 44).

### Step 3: Add a New Review

Copy this template and add it to the array:

```javascript
{
    author_name: "Customer Name",
    rating: 5,
    text: "Review text goes here...",
    time: new Date('2025-06-26').getTime()
}
```

**Full Example:**

```javascript
const fallbackReviews = [
    {
        author_name: "Dan Gore",
        rating: 5,
        text: "We had a great experience - Responsive, On time, easy to work with. Highly recommend!",
        time: new Date('2025-08-20').getTime()
    },
    {
        author_name: "Nick Fire",
        rating: 5,
        text: "Amazing service! Thank you very much",
        time: new Date('2025-06-26').getTime()
    },
    // Add your new review here:
    {
        author_name: "NEW CUSTOMER NAME",
        rating: 5,
        text: "NEW REVIEW TEXT HERE",
        time: new Date('2025-10-04').getTime()
    }
    // Keep existing reviews below...
];
```

### Step 4: Save and Test

1. Save the file
2. Refresh your website (Ctrl+F5)
3. Your new review appears in the carousel!

---

## 🎨 Review Format

### Required Fields:

```javascript
{
    author_name: "String",      // Customer's name
    rating: 5,                  // 1-5 (use 4 or 5 for display)
    text: "String",             // Review text (keep under 150 chars for best display)
    time: Number                // JavaScript timestamp
}
```

### Tips:

- **Rating**: Use `5` for 5-star reviews, `4` for 4-star reviews
- **Text**: Keep it under 150 characters for clean truncation
- **Date**: Use `new Date('YYYY-MM-DD').getTime()` format
- **Order**: Put newest reviews at the top of the array

---

## 📝 Current Reviews (8 Total)

Your website currently shows these reviews:

1. **Dan Gore** - 5 stars - Aug 20, 2025
2. **Nick Fire** - 5 stars - Jun 26, 2025
3. **Rebecca Levings** - 5 stars - Jun 25, 2025
4. **Sarah Mitchell** - 5 stars - May 15, 2025
5. **Mike Thompson** - 5 stars - Apr 10, 2025
6. **Jennifer Davis** - 5 stars - Mar 22, 2025
7. **Robert Wilson** - 5 stars - Feb 18, 2025
8. **Lisa Anderson** - 5 stars - Jan 30, 2025

---

## ✅ Advantages of Manual Reviews

- ✅ **No API needed** - No Google Cloud setup
- ✅ **Free forever** - No API costs or quotas
- ✅ **Full control** - Choose exactly which reviews to display
- ✅ **Faster loading** - No API calls = instant load
- ✅ **No dependencies** - Works offline, no external services
- ✅ **Easy to edit** - Just update the JavaScript file

---

## 🔄 Recommended Update Schedule

**Monthly**: Check Google Business Profile for new 5-star reviews and add them manually

**Takes**: ~2 minutes per review

**How often**: Once a month or when you get new reviews you want to showcase

---

## 🎯 Best Practices

### 1. **Feature Your Best Reviews**
   - Only add 4-5 star reviews
   - Choose reviews that mention specific benefits
   - Keep the total around 8-10 reviews

### 2. **Keep It Fresh**
   - Add new reviews as you get them
   - Remove older reviews after 1 year
   - Update dates to match real review dates

### 3. **Quality Over Quantity**
   - Better to have 8 great reviews than 20 mediocre ones
   - Choose reviews that highlight different services
   - Mix short and long reviews for variety

### 4. **Be Authentic**
   - Use real customer names (with permission)
   - Copy exact review text from Google
   - Use actual review dates

---

## 🚀 Quick Reference

### Add a Review:
```javascript
// In js/reviews.js, line 44, add to the array:
{
    author_name: "Customer Name",
    rating: 5,
    text: "Their review text",
    time: new Date('2025-10-04').getTime()
},
```

### Remove a Review:
Just delete the entire review object (including the curly braces and comma)

### Change Order:
Move reviews up or down in the array - top = shown first

### Change Text:
Edit the `text` field to update review content

---

## 💡 Pro Tips

1. **Comma Alert**: Make sure each review has a comma after the closing `}` (except the last one)
2. **Quote Text**: Review text must be in quotes: `"Like this"`
3. **Date Format**: Always use `new Date('YYYY-MM-DD').getTime()`
4. **Test Locally**: Refresh your page to see changes immediately

---

## ❓ Troubleshooting

### Reviews Not Showing?

1. Check browser console (F12) for JavaScript errors
2. Make sure each review has all 4 fields (author_name, rating, text, time)
3. Check for missing commas or quotes
4. Hard refresh: Ctrl+F5 (Windows) or Cmd+Shift+R (Mac)

### JavaScript Error?

Common mistakes:
- Missing comma between reviews
- Quote mark not closed properly: `"text here`
- Wrong date format: Use `new Date('2025-10-04').getTime()`

### Review Text Too Long?

The carousel automatically truncates to 100 characters and adds "..." with a "Read full review" link.

---

## 📊 Your Current Setup

- **File**: `js/reviews.js`
- **Reviews**: 8 total
- **Display**: Shows 3 at a time on desktop, 1 on mobile
- **Auto-scroll**: Yes (every 8 seconds)
- **Cache**: None (loads instantly from code)

**No API = No Problems!** 🎉

---

**Need to update a review?** Just edit `js/reviews.js` and save!
