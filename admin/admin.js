'use strict';

// ── Firebase Init ──────────────────────────────
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyBwLkGVRqEjLTm9-xXfiM1Xsdseq5OuTCw",
  authDomain: "sl-dumpsters.firebaseapp.com",
  projectId: "sl-dumpsters",
  storageBucket: "sl-dumpsters.firebasestorage.app",
  messagingSenderId: "600947617379",
  appId: "1:600947617379:web:c40c82c42b0a7dfbff1256",
};

function showLogin(errMsg) {
  document.getElementById('app-loading').style.display = 'none';
  document.getElementById('dashboard').style.display = 'none';
  document.getElementById('login-screen').style.display = 'flex';
  if (errMsg) document.getElementById('login-error').textContent = errMsg;
}

// Fallback: if Firebase never responds, show login after 8 s
const _authTimeout = setTimeout(() => showLogin(), 8000);

let auth, db;
try {
  firebase.initializeApp(FIREBASE_CONFIG);
  auth = firebase.auth();
  db = firebase.firestore();
} catch (e) {
  clearTimeout(_authTimeout);
  showLogin('Firebase failed to initialize. Please refresh.');
  throw e;
}

// ── State ──────────────────────────────────────
let bookings = [];
let calYear = new Date().getFullYear();
let calMonth = new Date().getMonth(); // 0-indexed
let activeTab = 'calendar';
let selectedBookingId = null;

// ── Auth ──────────────────────────────────────
auth.onAuthStateChanged(user => {
  clearTimeout(_authTimeout);
  document.getElementById('app-loading').style.display = 'none';
  if (user) {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('dashboard').style.display = 'flex';
    document.getElementById('header-user-email').textContent = user.email;
    loadBookings();
    renderCalendar();
    updatePricingPreview();
  } else {
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('dashboard').style.display = 'none';
  }
});

async function doLogin() {
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const errEl = document.getElementById('login-error');
  const btn = document.getElementById('login-btn');
  errEl.textContent = '';
  btn.disabled = true;
  btn.textContent = 'Signing in…';
  try {
    await auth.signInWithEmailAndPassword(email, password);
  } catch (e) {
    errEl.textContent = 'Invalid email or password.';
    btn.disabled = false;
    btn.textContent = 'Sign In';
  }
}

// Allow Enter key on password field
document.getElementById('login-password').addEventListener('keydown', e => {
  if (e.key === 'Enter') doLogin();
});

async function doLogout() {
  await auth.signOut();
}

// ── Data ──────────────────────────────────────
async function loadBookings() {
  try {
    const snap = await db.collection('bookings').orderBy('deliveryDate', 'desc').get();
    bookings = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderActiveView();
    updateStats();
    populateMonthFilter();
  } catch (e) {
    console.error('Failed to load bookings:', e);
  }
}

function updateStats() {
  const now = new Date();
  const thisMonth = now.toISOString().slice(0, 7);
  const todayStr = now.toISOString().slice(0, 10);

  const monthBookings = bookings.filter(b => b.deliveryDate && b.deliveryDate.startsWith(thisMonth));
  const revenue = monthBookings.reduce((sum, b) => sum + (b.payment?.total || 0), 0);
  const upcoming = bookings.filter(b => b.deliveryDate >= todayStr && b.status !== 'cancelled');

  document.getElementById('stat-month-bookings').textContent = monthBookings.length;
  document.getElementById('stat-month-revenue').textContent = '$' + revenue.toFixed(2);
  document.getElementById('stat-upcoming').textContent = upcoming.length;
  document.getElementById('stat-total').textContent = bookings.length;
}

function populateMonthFilter() {
  const seen = new Set();
  const select = document.getElementById('filter-month');
  const current = select.value;
  while (select.options.length > 1) select.remove(1);

  bookings.forEach(b => {
    if (b.deliveryDate) seen.add(b.deliveryDate.slice(0, 7));
  });

  [...seen].sort().reverse().forEach(ym => {
    const [y, m] = ym.split('-');
    const label = new Date(+y, +m - 1, 1).toLocaleString('default', { month: 'long', year: 'numeric' });
    const opt = document.createElement('option');
    opt.value = ym;
    opt.textContent = label;
    select.appendChild(opt);
  });

  if (current) select.value = current;
}

// ── Tab Switching ──────────────────────────────
function switchTab(tab) {
  activeTab = tab;
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('tab-' + tab).classList.add('active');
  document.querySelectorAll('.view-panel').forEach(p => p.classList.remove('active'));
  document.getElementById('view-' + (tab === 'new' ? 'new' : tab)).classList.add('active');
  if (tab === 'calendar') renderCalendar();
  if (tab === 'list') renderList();
  if (tab === 'dumpreturn') renderServiceRequests();
}

function renderActiveView() {
  if (activeTab === 'calendar') renderCalendar();
  else if (activeTab === 'list') renderList();
}

// ── Calendar ──────────────────────────────────
function calNav(dir) {
  calMonth += dir;
  if (calMonth > 11) { calMonth = 0; calYear++; }
  if (calMonth < 0) { calMonth = 11; calYear--; }
  renderCalendar();
}

function renderCalendar() {
  const label = new Date(calYear, calMonth, 1).toLocaleString('default', { month: 'long', year: 'numeric' });
  document.getElementById('cal-month-label').textContent = label;

  const grid = document.getElementById('cal-grid');
  grid.innerHTML = '';

  // Day-of-week headers
  ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].forEach(d => {
    const el = document.createElement('div');
    el.className = 'cal-dow';
    el.textContent = d;
    grid.appendChild(el);
  });

  const firstDay = new Date(calYear, calMonth, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const daysInPrev = new Date(calYear, calMonth, 0).getDate();
  const todayStr = new Date().toISOString().slice(0, 10);

  const calStr = m => calYear + '-' + String(calMonth + 1).padStart(2, '0') + '-' + String(m).padStart(2, '0');

  // Build map: date → [bookings active on that date]
  const bookingsByDate = {};
  bookings.forEach(b => {
    if (!b.deliveryDate || b.status === 'cancelled') return;
    const start = b.deliveryDate;
    const end = b.pickupDate || b.deliveryDate;
    // Only show chip on delivery date for calendar simplicity
    if (!bookingsByDate[start]) bookingsByDate[start] = [];
    bookingsByDate[start].push(b);
  });

  let totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;

  for (let i = 0; i < totalCells; i++) {
    const cell = document.createElement('div');
    cell.className = 'cal-day';

    let dateStr;
    if (i < firstDay) {
      const d = daysInPrev - firstDay + i + 1;
      cell.classList.add('other-month');
      const prevM = calMonth === 0 ? 12 : calMonth;
      const prevY = calMonth === 0 ? calYear - 1 : calYear;
      dateStr = prevY + '-' + String(prevM).padStart(2, '0') + '-' + String(d).padStart(2, '0');
      cell.innerHTML = `<div class="cal-day-num">${d}</div>`;
    } else if (i >= firstDay + daysInMonth) {
      const d = i - firstDay - daysInMonth + 1;
      cell.classList.add('other-month');
      const nextM = calMonth === 11 ? 1 : calMonth + 2;
      const nextY = calMonth === 11 ? calYear + 1 : calYear;
      dateStr = nextY + '-' + String(nextM).padStart(2, '0') + '-' + String(d).padStart(2, '0');
      cell.innerHTML = `<div class="cal-day-num">${d}</div>`;
    } else {
      const d = i - firstDay + 1;
      dateStr = calStr(d);
      if (dateStr === todayStr) cell.classList.add('today');
      cell.innerHTML = `<div class="cal-day-num">${d}</div>`;
    }

    // Add booking chips
    (bookingsByDate[dateStr] || []).forEach(b => {
      const chip = document.createElement('div');
      const size = b.size || '14';
      chip.className = `cal-chip chip-${size}`;
      chip.textContent = `${size}yd · ${(b.customer?.name || 'Unknown').split(' ')[0]}`;
      chip.title = `${b.customer?.name} — ${b.customer?.address}, ${b.customer?.city}`;
      chip.onclick = (e) => { e.stopPropagation(); showDetail(b.id); };
      cell.appendChild(chip);
    });

    grid.appendChild(cell);
  }
}

// ── List View ──────────────────────────────────
function renderList() {
  const monthFilter = document.getElementById('filter-month').value;
  const sizeFilter = document.getElementById('filter-size').value;
  const sourceFilter = document.getElementById('filter-source').value;

  let filtered = bookings.filter(b => {
    if (monthFilter && !(b.deliveryDate || '').startsWith(monthFilter)) return false;
    if (sizeFilter && b.size !== sizeFilter) return false;
    if (sourceFilter && (b.source || 'online') !== sourceFilter) return false;
    return true;
  });

  document.getElementById('list-count').textContent = `${filtered.length} booking${filtered.length !== 1 ? 's' : ''}`;

  const tbody = document.getElementById('list-body');
  tbody.innerHTML = '';

  const empty = document.getElementById('list-empty');
  if (filtered.length === 0) { empty.style.display = 'block'; return; }
  empty.style.display = 'none';

  filtered.forEach(b => {
    const tr = document.createElement('tr');
    const size = b.size || '14';
    const source = b.source || 'online';
    const total = b.payment?.total ? '$' + b.payment.total.toFixed(2) : '—';
    const name = b.customer?.name || '—';
    const phone = b.customer?.phone ? `<br><span style="color:#94a3b8;font-size:11px;">${b.customer.phone}</span>` : '';
    const addr = [b.customer?.address, b.customer?.city, b.customer?.zip].filter(Boolean).join(', ');

    tr.innerHTML = `
      <td>${b.deliveryDate || '—'}</td>
      <td>${b.pickupDate || '—'}</td>
      <td>${esc(name)}${phone}</td>
      <td>${esc(addr)}</td>
      <td><span class="size-badge badge-${size}">${size}yd</span></td>
      <td>${total}</td>
      <td><span class="source-badge ${source === 'manual' ? 'source-manual' : ''}">${source}</span></td>
    `;
    tr.onclick = () => showDetail(b.id);
    tbody.appendChild(tr);
  });
}

// ── Booking Detail ─────────────────────────────
function showDetail(bookingId) {
  const b = bookings.find(x => x.id === bookingId);
  if (!b) return;
  selectedBookingId = bookingId;

  const size = b.size || '14';
  const source = b.source || 'online';
  const payId = b.payment?.squarePaymentId || '—';
  const total = b.payment?.total ? '$' + b.payment.total.toFixed(2) : '—';
  const subtotal = b.payment?.subtotal ? '$' + b.payment.subtotal.toFixed(2) : '—';
  const tax = b.payment?.taxAmount ? '$' + b.payment.taxAmount.toFixed(2) : '—';
  const createdAt = b.createdAt?.toDate ? b.createdAt.toDate().toLocaleDateString() : '—';

  document.getElementById('modal-title').textContent = `${b.customer?.name || 'Booking'} — ${size}yd`;
  document.getElementById('modal-body').innerHTML = `
    <div class="detail-section">
      <h4>Service</h4>
      <div class="detail-row"><span class="detail-label">Delivery</span><span class="detail-value">${b.deliveryDate || '—'}</span></div>
      <div class="detail-row"><span class="detail-label">Pickup</span><span class="detail-value">${b.pickupDate || '—'}</span></div>
      <div class="detail-row"><span class="detail-label">Size</span><span class="detail-value">${size} yard</span></div>
      <div class="detail-row"><span class="detail-label">Time pref.</span><span class="detail-value">${b.dropoffTime || 'Any'}</span></div>
      ${b.customer?.notes ? `<div class="detail-row"><span class="detail-label">Notes</span><span class="detail-value">${esc(b.customer.notes)}</span></div>` : ''}
    </div>
    <div class="detail-section">
      <h4>Customer</h4>
      <div class="detail-row"><span class="detail-label">Name</span><span class="detail-value">${esc(b.customer?.name || '—')}</span></div>
      <div class="detail-row"><span class="detail-label">Email</span><span class="detail-value">${esc(b.customer?.email || '—')}</span></div>
      <div class="detail-row"><span class="detail-label">Phone</span><span class="detail-value">${esc(b.customer?.phone || '—')}</span></div>
      <div class="detail-row"><span class="detail-label">Address</span><span class="detail-value">${esc([b.customer?.address, b.customer?.city, b.customer?.zip].filter(Boolean).join(', '))}</span></div>
    </div>
    <div class="detail-section">
      <h4>Payment</h4>
      <div class="detail-row"><span class="detail-label">Subtotal</span><span class="detail-value">${subtotal}</span></div>
      <div class="detail-row"><span class="detail-label">Tax</span><span class="detail-value">${tax}</span></div>
      <div class="detail-row"><span class="detail-label">Total</span><span class="detail-value" style="font-weight:700;color:#0d9488;">${total}</span></div>
      <div class="detail-row"><span class="detail-label">Source</span><span class="detail-value">${source}</span></div>
      <div class="detail-row"><span class="detail-label">Payment ID</span><span class="detail-value" style="font-size:12px;color:#64748b;">${esc(payId)}</span></div>
    </div>
    <div class="detail-section">
      <h4>Record</h4>
      <div class="detail-row"><span class="detail-label">Booking ID</span><span class="detail-value" style="font-size:12px;color:#64748b;">${b.id}</span></div>
      <div class="detail-row"><span class="detail-label">Created</span><span class="detail-value">${createdAt}</span></div>
      <div class="detail-row"><span class="detail-label">Status</span><span class="detail-value">${b.status || 'confirmed'}</span></div>
    </div>
  `;

  document.getElementById('modal-cancel-btn').style.display = b.status === 'cancelled' ? 'none' : '';
  document.getElementById('booking-modal').style.display = 'flex';
}

function closeModal(e) {
  if (e.target === document.getElementById('booking-modal')) closeModalDirect();
}
function closeModalDirect() {
  document.getElementById('booking-modal').style.display = 'none';
  document.getElementById('modal-footer-view').style.display = 'flex';
  document.getElementById('modal-footer-edit').style.display = 'none';
  selectedBookingId = null;
}

function showEditForm() {
  const b = bookings.find(x => x.id === selectedBookingId);
  if (!b) return;

  const saveBtn = document.getElementById('modal-save-btn');
  saveBtn.disabled = false;
  saveBtn.textContent = 'Save Changes';

  const opt = (val, label, cur) => `<option value="${val}"${cur === val ? ' selected' : ''}>${label}</option>`;

  document.getElementById('modal-body').innerHTML = `
    <div class="detail-section">
      <h4>Service</h4>
      <div class="edit-grid">
        <div class="form-group">
          <label class="form-label">Delivery Date *</label>
          <input class="form-input" id="edit-delivery" type="date" value="${esc(b.deliveryDate || '')}" required>
        </div>
        <div class="form-group">
          <label class="form-label">Pickup Date *</label>
          <input class="form-input" id="edit-pickup" type="date" value="${esc(b.pickupDate || '')}" required>
        </div>
        <div class="form-group">
          <label class="form-label">Dumpster Size</label>
          <select class="form-select" id="edit-size">
            ${opt('10','10 Yard',b.size)}
            ${opt('14','14 Yard',b.size)}
            ${opt('20','20 Yard',b.size)}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Time Preference</label>
          <select class="form-select" id="edit-time">
            ${opt('','Any time',b.dropoffTime||'')}
            ${opt('morning','Morning (8am–12pm)',b.dropoffTime)}
            ${opt('afternoon','Afternoon (12pm–5pm)',b.dropoffTime)}
          </select>
        </div>
      </div>
    </div>
    <div class="detail-section">
      <h4>Customer</h4>
      <div class="edit-grid">
        <div class="form-group">
          <label class="form-label">Full Name *</label>
          <input class="form-input" id="edit-name" type="text" value="${esc(b.customer?.name || '')}" required>
        </div>
        <div class="form-group">
          <label class="form-label">Email</label>
          <input class="form-input" id="edit-email" type="email" value="${esc(b.customer?.email || '')}">
        </div>
        <div class="form-group">
          <label class="form-label">Phone</label>
          <input class="form-input" id="edit-phone" type="tel" value="${esc(b.customer?.phone || '')}">
        </div>
        <div class="form-group">
          <label class="form-label">ZIP Code</label>
          <input class="form-input" id="edit-zip" type="text" value="${esc(b.customer?.zip || '')}" maxlength="5">
        </div>
        <div class="form-group">
          <label class="form-label">Street Address *</label>
          <input class="form-input" id="edit-address" type="text" value="${esc(b.customer?.address || '')}" required>
        </div>
        <div class="form-group">
          <label class="form-label">City *</label>
          <input class="form-input" id="edit-city" type="text" value="${esc(b.customer?.city || '')}" required>
        </div>
        <div class="form-group full">
          <label class="form-label">Special Instructions</label>
          <textarea class="form-textarea" id="edit-notes">${esc(b.customer?.notes || '')}</textarea>
        </div>
      </div>
    </div>
    <div style="font-size:12px;color:#94a3b8;margin-top:4px;">Payment and booking ID are read-only and will not change.</div>
  `;

  document.getElementById('modal-footer-view').style.display = 'none';
  document.getElementById('modal-footer-edit').style.display = 'flex';
}

function discardEdit() {
  // Re-render the read-only detail view for the same booking
  const id = selectedBookingId;
  showDetail(id);
}

async function saveBookingEdit() {
  const b = bookings.find(x => x.id === selectedBookingId);
  if (!b) return;

  const delivery = document.getElementById('edit-delivery').value;
  const pickup   = document.getElementById('edit-pickup').value;
  const name     = document.getElementById('edit-name').value.trim();
  const address  = document.getElementById('edit-address').value.trim();
  const city     = document.getElementById('edit-city').value.trim();

  if (!delivery || !pickup || !name || !address || !city) {
    alert('Please fill in all required fields (Delivery Date, Pickup Date, Name, Address, City).');
    return;
  }
  if (pickup < delivery) {
    alert('Pickup date must be on or after delivery date.');
    return;
  }

  const btn = document.getElementById('modal-save-btn');
  btn.disabled = true;
  btn.textContent = 'Saving…';

  try {
    const updates = {
      deliveryDate: delivery,
      pickupDate:   pickup,
      size:         document.getElementById('edit-size').value,
      dropoffTime:  document.getElementById('edit-time').value,
      'customer.name':    name,
      'customer.email':   document.getElementById('edit-email').value.trim(),
      'customer.phone':   document.getElementById('edit-phone').value.trim(),
      'customer.address': address,
      'customer.city':    city,
      'customer.zip':     document.getElementById('edit-zip').value.trim(),
      'customer.notes':   document.getElementById('edit-notes').value.trim(),
    };

    await db.collection('bookings').doc(selectedBookingId).update(updates);

    // Sync local bookings array so UI reflects the change immediately
    Object.assign(b, {
      deliveryDate: delivery,
      pickupDate:   pickup,
      size:         updates.size,
      dropoffTime:  updates.dropoffTime,
      customer: {
        ...b.customer,
        name:    updates['customer.name'],
        email:   updates['customer.email'],
        phone:   updates['customer.phone'],
        address: updates['customer.address'],
        city:    updates['customer.city'],
        zip:     updates['customer.zip'],
        notes:   updates['customer.notes'],
      },
    });

    // Return to read-only view with updated data
    showDetail(selectedBookingId);
    renderActiveView();
    updateStats();
  } catch (err) {
    alert('Failed to save changes: ' + err.message);
    btn.disabled = false;
    btn.textContent = 'Save Changes';
  }
}

async function cancelBooking() {
  if (!selectedBookingId) return;
  if (!confirm('Mark this booking as cancelled? This cannot be undone.')) return;
  try {
    await db.collection('bookings').doc(selectedBookingId).update({ status: 'cancelled' });
    const b = bookings.find(x => x.id === selectedBookingId);
    if (b) b.status = 'cancelled';
    closeModalDirect();
    updateStats();
    renderActiveView();
  } catch (e) {
    alert('Failed to cancel booking: ' + e.message);
  }
}

// ── New Booking Form ───────────────────────────
const PRICES = {
  '10': { subtotal: 289.00, tax: 23.12, total: 312.12, cents: 31212 },
  '14': { subtotal: 319.00, tax: 25.52, total: 344.52, cents: 34452 },
  '20': { subtotal: 389.00, tax: 31.12, total: 420.12, cents: 42012 },
};

function updatePricingPreview() {
  const size = document.getElementById('f-size')?.value || '14';
  const p = PRICES[size] || PRICES['14'];
  const override = parseInt(document.getElementById('f-amount-cents')?.value);
  if (override && override > 0) {
    const total = override / 100;
    const subtotal = (total / 1.08).toFixed(2);
    const tax = (total - subtotal).toFixed(2);
    document.getElementById('prev-subtotal').textContent = '$' + subtotal;
    document.getElementById('prev-tax').textContent = '$' + parseFloat(tax).toFixed(2);
    document.getElementById('prev-total').textContent = '$' + total.toFixed(2);
  } else {
    document.getElementById('prev-subtotal').textContent = '$' + p.subtotal.toFixed(2);
    document.getElementById('prev-tax').textContent = '$' + p.tax.toFixed(2);
    document.getElementById('prev-total').textContent = '$' + p.total.toFixed(2);
  }
}

document.getElementById('f-amount-cents')?.addEventListener('input', updatePricingPreview);

async function submitManualBooking(e) {
  e.preventDefault();
  const btn = document.getElementById('form-submit-btn');
  const successEl = document.getElementById('form-success');
  const errorEl = document.getElementById('form-error');

  btn.disabled = true;
  btn.textContent = 'Creating…';
  successEl.textContent = '';
  errorEl.textContent = '';

  const delivery = document.getElementById('f-delivery').value;
  const pickup = document.getElementById('f-pickup').value;
  if (pickup < delivery) {
    errorEl.textContent = 'Pickup date must be on or after delivery date.';
    btn.disabled = false;
    btn.textContent = 'Create Booking';
    return;
  }

  const payload = {
    name: document.getElementById('f-name').value.trim(),
    email: document.getElementById('f-email').value.trim(),
    phone: document.getElementById('f-phone').value.trim(),
    delivery_date: delivery,
    pickup_date: pickup,
    dumpster_size: document.getElementById('f-size').value,
    time: document.getElementById('f-time').value,
    dropoff_address: document.getElementById('f-address').value.trim(),
    dropoff_city: document.getElementById('f-city').value.trim(),
    dropoff_zip: document.getElementById('f-zip').value.trim(),
    dropoff_notes: document.getElementById('f-notes').value.trim(),
  };

  const overrideCents = parseInt(document.getElementById('f-amount-cents').value);
  if (overrideCents > 0) payload.amount_cents = overrideCents;

  try {
    const token = await auth.currentUser.getIdToken();
    const res = await fetch('/api/createManualBooking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok || json.status !== 'success') throw new Error(json.message || 'Unknown error');

    successEl.textContent = '✓ Booking created! ID: ' + json.booking_id;
    document.getElementById('booking-form').reset();
    updatePricingPreview();
    await loadBookings();
  } catch (err) {
    errorEl.textContent = 'Error: ' + err.message;
  }

  btn.disabled = false;
  btn.textContent = 'Create Booking';
}

// ── Utilities ──────────────────────────────────
function esc(str) {
  return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ── Dump & Return (F1 — read-only contractor service requests) ──
// Additive: reads serviceRequests + contractors (admin is allowed by rules),
// joins business names, renders cards. No writes, no booking code paths touched.
let serviceRequests = [];
let contractorsById = {};
let srLoaded = false;

async function loadServiceRequests() {
  try {
    const [srSnap, cSnap] = await Promise.all([
      db.collection('serviceRequests').get(),
      db.collection('contractors').get(),
    ]);
    serviceRequests = srSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    contractorsById = {};
    cSnap.docs.forEach(d => { contractorsById[d.id] = d.data(); });
    srLoaded = true;
    renderServiceRequests();
  } catch (e) {
    console.error('Failed to load service requests:', e);
    const loading = document.getElementById('dr-loading');
    if (loading) loading.textContent = 'Could not load dump & return requests.';
  }
}

const DR_STATUS_ORDER = { scheduled: 0, completed: 1, cancelled: 2 };
const DR_STATUS_LABEL = { scheduled: 'Scheduled', completed: 'Completed', cancelled: 'Cancelled' };
const DR_GROUPS = ['scheduled', 'completed', 'cancelled'];

function drToMillis(v) {
  if (!v) return 0;
  if (typeof v.toDate === 'function') return v.toDate().getTime();
  const d = new Date(v); return isNaN(d) ? 0 : d.getTime();
}
function drFmtPickup(pw) {
  if (!pw || typeof pw !== 'string') return '—';
  const [datePart, slot] = pw.split('|');
  const m = (datePart || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return esc(pw);
  const d = new Date(+m[1], +m[2] - 1, +m[3]);
  const md = d.toLocaleString('default', { month: 'short', day: 'numeric' });
  return slot ? `${md} · ${esc(slot)}` : md;
}
function drMoney(n) {
  const num = Number(n);
  if (!isFinite(num)) return '—';
  return '$' + num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function renderServiceRequests() {
  if (!srLoaded) { loadServiceRequests(); return; } // lazy-load on first open

  const loading = document.getElementById('dr-loading');
  if (loading) loading.style.display = 'none';
  const empty = document.getElementById('dr-empty');
  const list = document.getElementById('dr-list');
  const count = document.getElementById('dr-count');
  if (!list) return;

  count.textContent = `${serviceRequests.length} request${serviceRequests.length !== 1 ? 's' : ''}`;
  list.innerHTML = '';

  if (serviceRequests.length === 0) { if (empty) empty.style.display = 'block'; return; }
  if (empty) empty.style.display = 'none';

  // Scheduled first (actionable), then completed, then cancelled; newest first within each.
  const sorted = [...serviceRequests].sort((a, b) => {
    const ga = DR_STATUS_ORDER[a.status] ?? 9, gb = DR_STATUS_ORDER[b.status] ?? 9;
    if (ga !== gb) return ga - gb;
    return drToMillis(b.createdAt) - drToMillis(a.createdAt);
  });

  DR_GROUPS.forEach(group => {
    const rows = sorted.filter(r => (r.status || 'scheduled') === group);
    if (!rows.length) return;
    const header = document.createElement('div');
    header.className = 'dr-group';
    header.textContent = `${DR_STATUS_LABEL[group]} (${rows.length})`;
    list.appendChild(header);
    rows.forEach(r => list.appendChild(drCard(r)));
  });
}

function drCard(r) {
  const c = contractorsById[r.contractorId] || {};
  const business = c.businessName || '(unknown contractor)';
  const status = r.status || 'scheduled';
  const weigh = (typeof r.weighInLbs === 'number') ? `${r.weighInLbs.toLocaleString()} lbs` : 'pending';
  const overCents = r.payment && r.payment.overageCents;
  let overage = '';
  if (overCents != null) overage = overCents > 0 ? `${drMoney(overCents / 100)} overage` : 'no overage';
  const amount = (r.payment && r.payment.total != null) ? drMoney(r.payment.total) : '—';

  const card = document.createElement('div');
  card.className = 'dr-card';
  card.innerHTML = `
    <div class="dr-card__top">
      <span class="dr-card__biz">${esc(business)}</span>
      <span class="dr-badge dr-badge--${esc(status)}">${esc(DR_STATUS_LABEL[status] || status)}</span>
    </div>
    <div class="dr-card__meta">
      <span class="dr-card__asset">#${esc(r.dumpsterAssetId || '—')}</span>
      <span>${drFmtPickup(r.pickupWindow)}</span>
      <span class="dr-card__conf">${esc(r.confirmationNumber || '—')}</span>
    </div>
    <div class="dr-card__foot">
      <span class="dr-card__amt">${amount}</span>
      <span class="dr-card__weigh">${esc(weigh)}</span>
      ${overage ? `<span class="dr-card__over">${esc(overage)}</span>` : ''}
    </div>
    ${status === 'scheduled' ? `<div class="dr-card__actions"><button class="dr-weigh-btn" onclick="openWeighIn('${r.id}')">Record weigh-in</button></div>` : ''}`;
  return card;
}

// ── Weigh-in (F2 — writes via the recordWeighIn Cloud Function, admin-only) ──
let weighInId = null;

function openWeighIn(srId) {
  const r = serviceRequests.find(x => x.id === srId);
  if (!r) return;
  weighInId = srId;
  const c = contractorsById[r.contractorId] || {};
  document.getElementById('wi-summary').innerHTML =
    `<strong>${esc(c.businessName || '(unknown contractor)')}</strong><br>` +
    `#${esc(r.dumpsterAssetId || '—')} · ${esc(r.confirmationNumber || '—')} · ${drFmtPickup(r.pickupWindow)}`;
  document.getElementById('wi-weight').value = '';
  document.getElementById('wi-preview').textContent = '';
  document.getElementById('wi-error').textContent = '';
  const btn = document.getElementById('wi-save-btn');
  btn.disabled = false; btn.textContent = 'Save weigh-in';
  document.getElementById('weighin-modal').style.display = 'flex';
}
function closeWeighIn(e) {
  if (e.target === document.getElementById('weighin-modal')) closeWeighInDirect();
}
function closeWeighInDirect() {
  document.getElementById('weighin-modal').style.display = 'none';
  weighInId = null;
}

// Live preview only — the SERVER recomputes the authoritative amounts.
function updateWeighInPreview() {
  const lbs = Math.round(Number(document.getElementById('wi-weight').value));
  const prev = document.getElementById('wi-preview');
  if (!Number.isFinite(lbs) || lbs <= 0) { prev.textContent = ''; return; }
  const overageCents = Math.max(0, lbs - 4000) * 3;
  const subtotal = 350 + overageCents / 100;
  const tax = subtotal * 0.08;
  const total = subtotal + tax;
  prev.innerHTML = overageCents > 0
    ? `Overage <strong>${drMoney(overageCents / 100)}</strong> · subtotal ${drMoney(subtotal)} · tax ${drMoney(tax)} · <strong>total ${drMoney(total)}</strong>`
    : `Under 2-ton cap — no overage · subtotal ${drMoney(350)} · tax ${drMoney(28)} · <strong>total ${drMoney(378)}</strong>`;
}

async function submitWeighIn() {
  if (!weighInId) return;
  const errEl = document.getElementById('wi-error');
  errEl.textContent = '';
  const lbs = Math.round(Number(document.getElementById('wi-weight').value));
  if (!Number.isFinite(lbs) || lbs < 0 || lbs >= 100000) { errEl.textContent = 'Enter a valid weight in pounds.'; return; }

  const btn = document.getElementById('wi-save-btn');
  btn.disabled = true; btn.textContent = 'Saving…';
  try {
    const idToken = await auth.currentUser.getIdToken();
    const res = await fetch('/api/recordWeighIn', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
      body: JSON.stringify({ serviceRequestId: weighInId, weighInLbs: lbs }),
    });
    const data = await res.json();
    if (!res.ok || data.status === 'error') throw new Error(data.message || 'Failed to record weigh-in.');

    // Reflect the server result locally (no full reload needed).
    const r = serviceRequests.find(x => x.id === weighInId);
    if (r) {
      r.status = 'completed';
      r.weighInLbs = data.weigh_in_lbs;
      r.payment = Object.assign({}, r.payment, {
        overageCents: data.overage_cents, subtotal: data.subtotal,
        taxAmount: data.tax_amount, total: data.total,
      });
      const c = contractorsById[r.contractorId];
      if (c && c.dumpster) { c.dumpster.status = 'on_site'; c.dumpster.lastEmptied = data.last_emptied; }
    }
    closeWeighInDirect();
    renderServiceRequests();
  } catch (e) {
    console.error('Weigh-in failed:', e);
    errEl.textContent = e.message || 'Failed to record weigh-in.';
    btn.disabled = false; btn.textContent = 'Save weigh-in';
  }
}

// ── Statements (F3 — monthly billing view + mark-settled) ────
let settledStatements = [];
let statementsLoaded = false;
let openStatementGroups = {};   // `${contractorId}_${period}` → { members, subtotalC, taxC, dueDate, lateFeeC, lateDays }

function drSwitch(which) {
  const isReq = which === 'requests';
  document.getElementById('drsub-requests').classList.toggle('is-active', isReq);
  document.getElementById('drsub-statements').classList.toggle('is-active', !isReq);
  document.getElementById('dr-requests-view').style.display = isReq ? '' : 'none';
  document.getElementById('dr-statements-view').style.display = isReq ? 'none' : '';
  if (!isReq) {
    (async () => {
      if (!srLoaded) await loadServiceRequests();    // open statements derive from serviceRequests
      if (!statementsLoaded) await loadStatements();  // settled (frozen) via getStatements
      renderStatements();
    })();
  }
}

async function loadStatements() {
  try {
    const idToken = await auth.currentUser.getIdToken();
    const res = await fetch('/api/getStatements', { headers: { 'Authorization': `Bearer ${idToken}` } });
    const data = await res.json();
    if (res.ok && data.status === 'success') settledStatements = data.statements || [];
  } catch (e) {
    console.error('Failed to load statements:', e);
  }
  statementsLoaded = true;
}

// Client date helpers — America/New_York, mirroring the server exactly.
function easternTodayYMD() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}
function f3DaysBetweenC(a, b) {
  const [ay, am, ad] = a.split('-').map(Number);
  const [by, bm, bd] = b.split('-').map(Number);
  return Math.round((Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / 86400000);
}
function f3StatementDatesC(period) {
  const [y, m] = period.split('-').map(Number);
  const ny = m === 12 ? y + 1 : y, nm = m === 12 ? 1 : m + 1;
  const issueDate = `${ny}-${String(nm).padStart(2, '0')}-01`;
  const due = new Date(Date.UTC(ny, nm - 1, 1) + 5 * 86400000);
  const dueDate = `${due.getUTCFullYear()}-${String(due.getUTCMonth() + 1).padStart(2, '0')}-${String(due.getUTCDate()).padStart(2, '0')}`;
  return { issueDate, dueDate };
}
function srCompletionPeriod(r) {
  const ca = r.completedAt;
  let d = null;
  if (ca && typeof ca.toDate === 'function') d = ca.toDate();
  else if (ca) d = new Date(ca);
  if (!d || isNaN(d)) return null;
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d).slice(0, 7);
}
function monthLabel(period) {
  const [y, m] = period.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleString('default', { month: 'long', year: 'numeric' });
}

function renderStatements() {
  const list = document.getElementById('stmt-list');
  const loading = document.getElementById('stmt-loading');
  if (loading) loading.style.display = 'none';
  if (!list) return;
  list.innerHTML = '';
  openStatementGroups = {};

  // OPEN (live): monthly + unbilled + completed, grouped by completion month.
  serviceRequests.forEach(r => {
    if (r.billingMode === 'monthly' && r.billingStatus === 'unbilled' && r.status === 'completed') {
      const period = srCompletionPeriod(r);
      if (!period) return;
      const key = r.contractorId + '_' + period;
      if (!openStatementGroups[key]) openStatementGroups[key] = { contractorId: r.contractorId, period, members: [] };
      openStatementGroups[key].members.push(r);
    }
  });

  const openKeys = Object.keys(openStatementGroups).sort().reverse();
  const oh = document.createElement('div'); oh.className = 'dr-group'; oh.textContent = `Open (${openKeys.length})`;
  list.appendChild(oh);
  if (!openKeys.length) { const e = document.createElement('div'); e.className = 'dr-empty'; e.textContent = 'No open statements.'; list.appendChild(e); }
  openKeys.forEach(k => list.appendChild(openStatementCard(openStatementGroups[k])));

  // SETTLED (frozen) via getStatements.
  const sh = document.createElement('div'); sh.className = 'dr-group'; sh.textContent = `Settled (${settledStatements.length})`;
  list.appendChild(sh);
  if (!settledStatements.length) { const e = document.createElement('div'); e.className = 'dr-empty'; e.textContent = 'No settled statements yet.'; list.appendChild(e); }
  [...settledStatements].sort((a, b) => (b.period || '').localeCompare(a.period || '')).forEach(s => list.appendChild(settledStatementCard(s)));
}

function openStatementCard(group) {
  const c = contractorsById[group.contractorId] || {};
  const subtotalC = group.members.reduce((s, r) => s + Math.round((r.payment && r.payment.subtotal || 0) * 100), 0);
  const taxC = group.members.reduce((s, r) => s + Math.round((r.payment && r.payment.taxAmount || 0) * 100), 0);
  const { issueDate, dueDate } = f3StatementDatesC(group.period);
  const lateDays = Math.max(0, f3DaysBetweenC(dueDate, easternTodayYMD()));
  const lateFeeC = lateDays * 1000;
  group.subtotalC = subtotalC; group.taxC = taxC; group.dueDate = dueDate; group.lateFeeC = lateFeeC; group.lateDays = lateDays;

  const key = group.contractorId + '_' + group.period;
  const n = group.members.length;
  const card = document.createElement('div');
  card.className = 'stmt-card';
  card.innerHTML = `
    <div class="stmt-card__top"><span class="stmt-card__biz">${esc(c.businessName || '(unknown)')}</span><span class="stmt-card__period">${esc(monthLabel(group.period))}</span></div>
    <div class="stmt-row"><span>${n} dump${n !== 1 ? 's' : ''} · charges</span><span>${drMoney(subtotalC / 100)}</span></div>
    <div class="stmt-row"><span>Tax (8%)</span><span>${drMoney(taxC / 100)}</span></div>
    <div class="stmt-row stmt-row--late">
      <label><input type="checkbox" id="inc-${key}" ${lateDays > 0 ? 'checked' : 'disabled'} onchange="updateStmtTotal('${group.contractorId}','${group.period}')"> Late fee · ${lateDays} day${lateDays !== 1 ? 's' : ''} late</label>
      <span>${drMoney(lateFeeC / 100)}</span>
    </div>
    <div class="stmt-card__divider"></div>
    <div class="stmt-row stmt-row--total"><span>Total owed</span><span id="tot-${key}">${drMoney((subtotalC + taxC + lateFeeC) / 100)}</span></div>
    <div class="stmt-card__meta">Issued ${issueDate} · due ${dueDate}</div>
    <button class="stmt-settle-btn" id="set-${key}" onclick="markSettled('${group.contractorId}','${group.period}')">Mark settled</button>`;
  return card;
}

function updateStmtTotal(contractorId, period) {
  const key = contractorId + '_' + period;
  const g = openStatementGroups[key];
  if (!g) return;
  const inc = document.getElementById('inc-' + key);
  const lateC = (inc && inc.checked) ? g.lateFeeC : 0;
  const el = document.getElementById('tot-' + key);
  if (el) el.textContent = drMoney((g.subtotalC + g.taxC + lateC) / 100);
}

function settledStatementCard(s) {
  const c = contractorsById[s.contractorId] || {};
  const settled = s.settledAt ? new Date(s.settledAt).toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
  const card = document.createElement('div');
  card.className = 'stmt-card stmt-card--settled';
  card.innerHTML = `
    <div class="stmt-card__top"><span class="stmt-card__biz">${esc(c.businessName || '(unknown)')}</span><span class="dr-badge dr-badge--completed">Settled</span></div>
    <div class="stmt-card__period-row">${esc(monthLabel(s.period))} · ${s.dumpsCount} dump${s.dumpsCount !== 1 ? 's' : ''}</div>
    <div class="stmt-row"><span>Charges</span><span>${drMoney((s.subtotalCents || 0) / 100)}</span></div>
    <div class="stmt-row"><span>Tax</span><span>${drMoney((s.taxCents || 0) / 100)}</span></div>
    <div class="stmt-row"><span>Late fee${s.lateFeeApplied ? ` · ${s.lateDaysAtSettle}d` : ' (waived)'}</span><span>${drMoney((s.lateFeeCents || 0) / 100)}</span></div>
    <div class="stmt-card__divider"></div>
    <div class="stmt-row stmt-row--total"><span>Total</span><span>${drMoney((s.totalCents || 0) / 100)}</span></div>
    <div class="stmt-card__meta">Settled ${esc(settled)} · frozen</div>`;
  return card;
}

async function markSettled(contractorId, period) {
  const key = contractorId + '_' + period;
  const g = openStatementGroups[key];
  if (!g) return;
  const inc = document.getElementById('inc-' + key);
  const applyLateFee = !!(inc && inc.checked);
  const msg = `Mark ${monthLabel(period)} settled? This freezes the statement` + (applyLateFee ? ` with a ${drMoney(g.lateFeeC / 100)} late fee.` : ' (late fee waived).');
  if (!confirm(msg)) return;
  const btn = document.getElementById('set-' + key);
  if (btn) { btn.disabled = true; btn.textContent = 'Settling…'; }
  try {
    const idToken = await auth.currentUser.getIdToken();
    const res = await fetch('/api/settleStatement', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
      body: JSON.stringify({ contractorId, period, serviceRequestIds: g.members.map(m => m.id), applyLateFee }),
    });
    const data = await res.json();
    if (!res.ok || data.status === 'error') throw new Error(data.message || 'Failed to settle.');
    g.members.forEach(m => { const r = serviceRequests.find(x => x.id === m.id); if (r) { r.billingStatus = 'billed'; r.statementId = data.statement_id; } });
    await loadStatements();   // refetch the frozen settled statement
    renderStatements();
  } catch (e) {
    console.error('Settle failed:', e);
    alert('Settle failed: ' + e.message);
    if (btn) { btn.disabled = false; btn.textContent = 'Mark settled'; }
  }
}
