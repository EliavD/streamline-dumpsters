# Simple Test Guide - Find the Real Issue

Since only index.html works, let's identify the exact difference.

## Test in Browser

### 1. Open Browser DevTools
Press **F12** to open Developer Tools

### 2. Test bookNow.html
Open: http://127.0.0.1:8080/bookNow.html

In Console tab, run these commands:
```javascript
// Check if scripts loaded
console.log('Logger:', typeof Logger);
console.log('CONFIG:', typeof window.CONFIG);
console.log('threeStepModal:', typeof window.threeStepModal);
console.log('bookingModal:', typeof window.bookingModal);

// Check if modal exists
console.log('Modal element:', document.getElementById('bookingModal'));

// Check if button exists
console.log('Button:', document.getElementById('openBookingModal'));

// Try to manually open
if (window.bookingModal) {
  window.bookingModal.openModal();
}
```

### 3. Test dublin.html
Open: http://127.0.0.1:8080/dublin.html

Run same commands above.

### 4. Compare with index.html
Open: http://127.0.0.1:8080/index.html

Run same commands.

## What to Look For

### Console Errors
Look for RED error messages like:
- "Logger is not defined"
- "CONFIG is not defined"
- "Cannot read property..."
- "bookingModal not found"

### Expected Results (Working Page)
```
Logger: "object"
CONFIG: "object"
threeStepModal: "object"
bookingModal: "object"
Modal element: div#bookingModal.modal.modal--three-step
Button: button#openBookingModal
```

### Problem Indicators (Broken Page)
```
Logger: "undefined" ← BAD
CONFIG: "undefined" ← BAD
threeStepModal: "undefined" ← BAD
bookingModal: "undefined" ← BAD
Modal element: null ← BAD
```

## Likely Issues

### If Logger is undefined
- Script loading order wrong
- logger.js failed to load (check Network tab)

### If CONFIG is undefined
- config.js failed to load
- config.js ran before logger.js

### If bookingModal is undefined
- bookNow.js didn't initialize
- Modal element not found when bookNow.js ran

### If Modal element is null
- For location pages: modal-loader.js failed
- Check Network tab for failed component load

## Network Tab Check

1. Open Network tab in DevTools
2. Reload page
3. Filter by "JS"
4. Look for:
   - logger.js (should be 200)
   - config.js (should be 200)
   - three-step-modal.js (should be 200)
   - bookNow.js (should be 200)
   - modal-loader.js (should be 200 for location pages)
   - components/booking-modal.html (should be 200 for location pages)

If any show 404 or Failed, that's the problem!

## Quick Fix Commands

If you find the issue, try these:

### Force reload clearing cache
```
Ctrl + Shift + R (Windows)
Cmd + Shift + R (Mac)
```

### Clear all site data
```
1. Open DevTools (F12)
2. Application tab
3. Clear Storage
4. Click "Clear site data"
5. Reload page
```

---

**Run these tests and tell me what you see in the console!**
