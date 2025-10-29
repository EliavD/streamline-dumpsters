# Testing with Debug Logging - PLEASE RUN THIS NOW

I've added detailed console logging to track exactly what's happening during initialization.

## What I Just Added:

1. **bookNow.js** - Detailed logs showing:
   - When `initializeBookingModal()` is called
   - Whether modal/button/CONFIG exist
   - Whether BookingModal was created successfully

2. **modal-loader.js** - Logs showing:
   - When modal HTML is loaded
   - Whether modal exists after insertion
   - When `modalsLoaded` event is dispatched

## Test Now - Step by Step

### Test 1: dublin.html (location page with modal-loader)

1. **Open**: http://127.0.0.1:8080/dublin.html

2. **Open Console**: Press F12, go to Console tab

3. **Look for this sequence of logs**:
   ```
   📄 DOMContentLoaded event in bookNow.js
   ⏳ Modal not found in DOM on DOMContentLoaded, waiting for modalsLoaded event
   ✓ Loaded component: components/booking-modal.html
     - Modal in DOM after insert: true
   📦 All modal components loaded, dispatching modalsLoaded event
     - bookingModal exists: true
     - openBookingModal button exists: true
   📦 modalsLoaded event received in bookNow.js
   🔄 initializeBookingModal() called
     - Modal exists: true
     - Button exists: true
     - CONFIG exists: true
     - Already initialized: false
   ✅ All prerequisites met, creating BookingModal
   ✓ BookingModal Phase 5 initialized...
   ```

4. **Copy the ACTUAL console output** and send it to me

5. **Try clicking "Book Now" button**
   - Does modal open? YES or NO
   - Any errors in console?

### Test 2: bookNow.html (has modal directly in HTML)

1. **Open**: http://127.0.0.1:8080/bookNow.html

2. **Open Console**: F12

3. **Look for**:
   ```
   📄 DOMContentLoaded event in bookNow.js
   ✓ Modal found in DOM on DOMContentLoaded, initializing...
   🔄 initializeBookingModal() called
     - Modal exists: true
     - Button exists: true
     - CONFIG exists: true
     - Already initialized: false
   ✅ All prerequisites met, creating BookingModal
   ✓ BookingModal Phase 5 initialized...
   ```

4. **Copy actual output**

5. **Click "Book Now" button** - does it work?

### Test 3: index.html (uses bundled core.min.js)

1. **Open**: http://127.0.0.1:8080/index.html

2. This one works - just verify it still does

## What To Send Me

For EACH page that DOESN'T work:

1. **Full console log output** (copy/paste everything)

2. **Screenshot of console** if easier

3. **Answer these questions**:
   - Does it say "Modal exists: true"?
   - Does it say "Button exists: true"?
   - Does it say "CONFIG exists: true"?
   - Does it say "BookingModal Phase 5 initialized"?
   - When you click "Book Now" what happens? (nothing? error?)

4. **Run this in console** and send output:
   ```javascript
   console.log({
     modal: document.getElementById('bookingModal'),
     button: document.getElementById('openBookingModal'),
     bookingModal: window.bookingModal,
     threeStepModal: window.threeStepModal
   });
   ```

## What I'm Looking For

The debug logs will tell me EXACTLY where it's failing:

- ❌ If "Modal exists: false" → modal HTML not loading
- ❌ If "CONFIG exists: false" → config.js not loading
- ❌ If "BookingModal Phase 5 initialized" never appears → constructor failing
- ❌ If everything shows TRUE but modal doesn't open → click handler not working

## Quick Manual Test

After page loads, run this in console:

```javascript
// Try to open modal manually
if (window.bookingModal) {
  window.bookingModal.openModal();
  console.log('Manual open attempted');
} else {
  console.error('window.bookingModal does not exist!');
}
```

Tell me what happens.

---

**PLEASE TEST NOW AND SEND ME THE CONSOLE OUTPUT**

This will show me exactly where it's failing!
