'use strict';

/*
================================================================================
PORTAL.JS — Contractor Portal (Phase B: read-only dashboard)
================================================================================
Reuses the Firebase Auth + Firestore mechanism from admin/admin.js exactly:
inline FIREBASE_CONFIG → initializeApp → auth() / firestore(), onAuthStateChanged
gate, signInWithEmailAndPassword. No framework, no build step.
================================================================================
*/

// ── Firebase Init (same project/config as admin/) ──────────
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyBwLkGVRqEjLTm9-xXfiM1Xsdseq5OuTCw",
  authDomain: "sl-dumpsters.firebaseapp.com",
  projectId: "sl-dumpsters",
  storageBucket: "sl-dumpsters.firebasestorage.app",
  messagingSenderId: "600947617379",
  appId: "1:600947617379:web:c40c82c42b0a7dfbff1256",
};

// Pricing display constants (authoritative amounts are enforced server-side).
const FLAT_SUBTOTAL = 350;
const TON_CAP_LBS = 4000;

// ── Element helpers ────────────────────────────────────────
const $ = (id) => document.getElementById(id);

function showLoading()  { $('app-loading').style.display = 'flex'; }
function hideLoading()  { $('app-loading').style.display = 'none'; }
function showLogin(errMsg) {
  hideLoading();
  $('portal-app').hidden = true;
  $('login-screen').style.display = 'flex';
  if (errMsg) $('login-error').textContent = errMsg;
}
function showApp() {
  hideLoading();
  $('login-screen').style.display = 'none';
  $('portal-app').hidden = false;
}

// Fallback: if Firebase never responds, show login after 8s
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

// ── State ──────────────────────────────────────────────────
let currentUser = null;
let contractor = null;
let serviceRequests = [];

// ── Auth ───────────────────────────────────────────────────
auth.onAuthStateChanged(async (user) => {
  clearTimeout(_authTimeout);
  if (user) {
    currentUser = user;
    showApp();
    await loadPortal(user.uid);
  } else {
    currentUser = null;
    showLogin();
  }
});

async function doLogin() {
  const email = $('login-email').value.trim();
  const password = $('login-password').value;
  const errEl = $('login-error');
  const btn = $('login-btn');
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

async function doLogout() {
  await auth.signOut();
}

// ── Data load ──────────────────────────────────────────────
async function loadPortal(uid) {
  try {
    const snap = await db.collection('contractors').doc(uid).get();
    if (!snap.exists) {
      renderNoAccount();
      return;
    }
    contractor = snap.data();

    try {
      const reqSnap = await db.collection('serviceRequests')
        .where('contractorId', '==', uid)
        .get();
      serviceRequests = reqSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      // newest first (sorted client-side to avoid composite-index requirement)
      serviceRequests.sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));
    } catch (e) {
      console.error('Failed to load service requests:', e);
      serviceRequests = [];
    }

    renderDashboard();
  } catch (e) {
    console.error('Failed to load contractor:', e);
    renderLoadError();
  }
}

// ── Date / number helpers ──────────────────────────────────
function toDate(v) {
  if (!v) return null;
  if (typeof v.toDate === 'function') return v.toDate();   // Firestore Timestamp
  if (v instanceof Date) return v;
  const d = new Date(v);
  return isNaN(d) ? null : d;
}
function toMillis(v) { const d = toDate(v); return d ? d.getTime() : 0; }

// Parse a "YYYY-MM-DD" string as a *local* date (avoids UTC off-by-one)
function parseYMD(s) {
  if (!s || typeof s !== 'string') return null;
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return toDate(s);
  return new Date(+m[1], +m[2] - 1, +m[3]);
}

function fmtMonthDay(d) {
  return d ? d.toLocaleString('default', { month: 'short', day: 'numeric' }) : '—';
}
function fmtMonthYear(d) {
  return d ? d.toLocaleString('default', { month: 'short', year: 'numeric' }) : '—';
}
function daysBetween(from, to) {
  if (!from || !to) return null;
  return Math.round((to - from) / 86400000);
}
function money(n) {
  const num = Number(n) || 0;
  return '$' + num.toLocaleString('en-US', {
    minimumFractionDigits: Number.isInteger(num) ? 0 : 2,
    maximumFractionDigits: 2,
  });
}

const STATUS_LABEL = {
  on_site: 'On site',
  pickup_scheduled: 'Pickup scheduled',
};
const REQ_STATUS_LABEL = {
  completed: 'Completed',
  scheduled: 'Scheduled',
  cancelled: 'Cancelled',
};

// ── Render: dashboard ──────────────────────────────────────
function renderDashboard() {
  const c = contractor;
  const d = c.dumpster || {};

  // Top bar
  $('topbar-business').textContent = c.businessName || '—';
  $('topbar-shop').textContent = c.shopName || c.address || '';
  $('avatar').textContent = initials(c.businessName);

  // Status banner
  $('status-eyebrow').textContent = `${d.size || '20'}-YARD ROLL-OFF`;
  $('status-text').textContent = STATUS_LABEL[d.status] || 'On site';
  $('status-loc').textContent = `#${d.assetId || '—'} · ${c.shopName || c.address || ''}`;

  const scheduled = d.status === 'pickup_scheduled';
  $('status-pill-text').textContent = scheduled ? 'Scheduled' : 'Active';

  const lastEmptied = parseYMD(d.lastEmptied);
  $('status-last-emptied').textContent = lastEmptied
    ? `Last emptied ${fmtMonthDay(lastEmptied)}`
    : 'Last emptied —';
  const days = daysBetween(lastEmptied, new Date());
  $('status-days-ago').textContent = days == null ? '—'
    : days === 0 ? 'today'
    : days === 1 ? '1 day ago'
    : `${days} days ago`;

  renderStats();
  renderHistory();
}

function initials(name) {
  if (!name) return '–';
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}

// ── Render: stat tiles (derived from serviceRequests) ──────
function renderStats() {
  const now = new Date();
  const ym = now.toISOString().slice(0, 7);

  const inMonth = serviceRequests.filter((r) => {
    const dt = toDate(r.createdAt);
    return dt && dt.toISOString().slice(0, 7) === ym && r.status !== 'cancelled';
  });
  const completed = serviceRequests.filter((r) => r.status === 'completed');
  const weighed = completed.filter((r) => typeof r.weighInLbs === 'number');

  // Dumps this month
  $('stat-month-count').textContent = inMonth.length;
  const monthBilled = inMonth.reduce((s, r) => s + (r.payment?.subtotal || 0), 0);
  $('stat-month-billed').textContent = `${money(monthBilled)} billed`;

  // Avg load weight
  if (weighed.length) {
    const avg = Math.round(weighed.reduce((s, r) => s + r.weighInLbs, 0) / weighed.length);
    $('stat-avg-weight').textContent = `${avg.toLocaleString()} lb`;
    $('stat-avg-sub').textContent = avg <= TON_CAP_LBS ? 'Under 2-ton cap' : 'Over 2-ton cap';
  } else {
    $('stat-avg-weight').textContent = '—';
    $('stat-avg-sub').textContent = 'No weigh-ins yet';
  }

  // Flat rate
  $('stat-flat-rate').textContent = money(FLAT_SUBTOTAL);

  // Total dumps
  $('stat-total').textContent = completed.length;
  const earliest = completed.reduce((min, r) => {
    const m = toMillis(r.createdAt);
    return m && (min == null || m < min) ? m : min;
  }, null);
  $('stat-total-sub').textContent = earliest ? `Since ${fmtMonthYear(new Date(earliest))}` : 'No dumps yet';
}

// ── Render: service history ────────────────────────────────
function renderHistory() {
  const list = $('history-list');
  list.innerHTML = '';

  if (!serviceRequests.length) {
    $('history-empty').hidden = false;
    return;
  }
  $('history-empty').hidden = true;

  serviceRequests.forEach((r) => list.appendChild(historyRow(r)));
}

function historyRow(r) {
  const li = document.createElement('li');
  li.className = 'history__row';

  const statusKey = r.status || 'scheduled';
  const statusLabel = REQ_STATUS_LABEL[statusKey] || statusKey;
  const svcDate = parseYMD((r.pickupWindow || '').split('|')[0]) || toDate(r.createdAt);
  const dateShort = fmtMonthDay(svcDate);

  const hasWeight = typeof r.weighInLbs === 'number';
  const weightStr = hasWeight ? `${r.weighInLbs.toLocaleString()} lbs`
    : statusKey === 'completed' ? '—' : 'Pending weigh-in';

  const overCents = r.payment?.overageCents;
  const overageStr = (overCents == null)
    ? (hasWeight ? 'no overage' : '—')
    : `${money(overCents / 100)} overage`;

  const amountStr = money(r.payment?.subtotal ?? FLAT_SUBTOTAL);

  // 1 — date cell (desktop column)
  li.appendChild(cell('hist hist--date', dateShort + (svcDate ? `, ${svcDate.getFullYear()}` : '')));

  // 2 — type cell (icon + title + status badge + mobile detail)
  const type = document.createElement('div');
  type.className = 'hist hist--type history__main';
  const icon = document.createElement('span');
  icon.className = 'history__icon';
  icon.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M1 3h15v13H1z"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>';
  const txt = document.createElement('div');
  const title = document.createElement('p');
  title.className = 'history__row-title';
  title.append('Dump & return ');
  const badge = document.createElement('span');
  badge.className = `history__badge history__badge--${statusKey}`;
  badge.textContent = `· ${statusLabel}`;
  title.appendChild(badge);
  const detail = document.createElement('p');
  detail.className = 'history__row-detail';
  detail.textContent = `${dateShort} · ${hasWeight ? r.weighInLbs.toLocaleString() + ' lbs' : weightStr} · ${overageStr}`;
  txt.appendChild(title);
  txt.appendChild(detail);
  type.appendChild(icon);
  type.appendChild(txt);
  li.appendChild(type);

  // 3 — weight cell
  li.appendChild(cell('hist hist--weight', weightStr));
  // 4 — overage cell
  li.appendChild(cell('hist hist--overage', overageStr));
  // 5 — amount
  li.appendChild(cell('history__amount', amountStr));

  return li;
}

function cell(className, text) {
  const el = document.createElement('span');
  el.className = className;
  el.textContent = text;
  return el;
}

// ── Fallback states ────────────────────────────────────────
function renderNoAccount() {
  $('topbar-business').textContent = currentUser?.email || 'Signed in';
  $('topbar-shop').textContent = 'No contractor account linked';
  $('status-text').textContent = 'No account';
  $('status-loc').textContent = 'Contact us to set up your portal';
  $('history-empty').hidden = false;
  $('history-empty').textContent =
    'This login has no contractor account yet. Please contact Streamline Dumpsters at (614) 636-2343.';
}
function renderLoadError() {
  $('status-text').textContent = 'Couldn’t load';
  $('status-loc').textContent = 'Please refresh and try again';
}

// ════════════════════════════════════════════════════════════
// PHASE C — dump & return flow (request → checkout → confirm)
// ════════════════════════════════════════════════════════════

// Authoritative amounts live server-side; these are for display only.
const PRICE = { subtotal: 350, taxRate: 0.08, tax: 28, total: 378 };

// Until the Phase D Cloud Function (/api/processDumpAndReturn) ships, the
// backend POST is stubbed client-side. Flip to false in Phase D to hit the API.
const STUB_BACKEND = false;

const flowState = { pickupValue: null, pickupLabel: null, payInProgress: false };

// ── Pickup window options (real upcoming dates) ────────────
function ymd(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function buildPickupOptions() {
  const today = new Date();
  const tomorrow = new Date(); tomorrow.setDate(today.getDate() + 1);
  const tDate = ymd(today), mDate = ymd(tomorrow);
  const tLabel = today.toLocaleString('default', { weekday: 'short', month: 'short', day: 'numeric' });
  const mLabel = tomorrow.toLocaleString('default', { weekday: 'short', month: 'short', day: 'numeric' });

  const opts = [
    { value: `${tDate}|AM`, title: 'Today', sub: 'Request before 10:00 AM', tag: 'Same-day', summary: `Today · ${tLabel}` },
    { value: `${mDate}|AM`, title: 'Tomorrow · Morning', sub: '8:00 AM – 12:00 PM', summary: `${mLabel} · 8 AM–12 PM` },
    { value: `${mDate}|PM`, title: 'Tomorrow · Afternoon', sub: '12:00 PM – 5:00 PM', summary: `${mLabel} · 12–5 PM` },
  ];

  const wrap = $('pickup-options');
  wrap.innerHTML = '';
  opts.forEach((o, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'pickup__opt';
    btn.setAttribute('role', 'radio');
    btn.dataset.value = o.value;
    btn.dataset.summary = o.summary;

    const radio = document.createElement('span');
    radio.className = 'pickup__radio';
    const main = document.createElement('div');
    main.className = 'pickup__main';
    const title = document.createElement('p');
    title.className = 'pickup__title';
    title.textContent = o.title;
    const sub = document.createElement('p');
    sub.className = 'pickup__sub';
    sub.textContent = o.sub;
    main.appendChild(title); main.appendChild(sub);
    btn.appendChild(radio); btn.appendChild(main);
    if (o.tag) {
      const tag = document.createElement('span');
      tag.className = 'pickup__tag';
      tag.textContent = o.tag;
      btn.appendChild(tag);
    }
    btn.addEventListener('click', () => selectPickup(o.value, o.summary));
    wrap.appendChild(btn);

    if (i === 1) selectPickup(o.value, o.summary); // default: Tomorrow · Morning
  });
}
function selectPickup(value, summary) {
  flowState.pickupValue = value;
  flowState.pickupLabel = summary;
  document.querySelectorAll('.pickup__opt').forEach((el) => {
    const on = el.dataset.value === value;
    el.classList.toggle('is-selected', on);
    el.setAttribute('aria-checked', on ? 'true' : 'false');
  });
}

// ── Screen navigation ──────────────────────────────────────
function openFlow() {
  // mini-card reflects the contractor's dumpster
  const d = contractor?.dumpster || {};
  $('mini-size').textContent = `${d.size || '20'}-yard roll-off`;
  $('mini-asset').textContent = `#${d.assetId || '—'}`;
  $('mini-addr').textContent = contractor?.address || contractor?.shopName || '';
  buildPickupOptions();
  showScreen('request');
  $('flow').hidden = false;
  document.body.style.overflow = 'hidden';
}
function closeFlow() {
  $('flow').hidden = true;
  document.body.style.overflow = '';
}
function showScreen(name) {
  ['request', 'checkout', 'confirm'].forEach((s) => {
    $(`flow-${s}`).hidden = (s !== name);
  });
  $('flow').scrollTop = 0;
}

// Request → Checkout
function isMonthlyBilling() {
  return contractor?.billingMode === 'monthly';
}

// Monthly contractors are billed once a month (ACH/check) — the portal logs the
// request and takes NO card. Per_dump contractors keep the Square card flow.
function applyBillingMode(monthly) {
  const show = (id, on) => { const el = $(id); if (el) el.style.display = on ? '' : 'none'; };
  show('pay-label', !monthly);
  show('card-container', !monthly);
  show('card-loading', !monthly);
  show('monthly-note', monthly);
  // #card-error stays visible — it surfaces errors in BOTH modes.
  if (monthly) {
    $('due-label').textContent = 'Per dump';
    $('due-amount').textContent = '$378.00 · billed monthly';
    $('co-overage-note').innerHTML = 'Loads over 2 tons add <strong>$0.03/lb</strong> after weigh-in to your monthly statement.';
    $('pay-btn').innerHTML = 'Schedule pickup';
  }
}

async function goToCheckout() {
  $('co-when').textContent = flowState.pickupLabel || '—';
  $('co-where').textContent = contractor?.address || contractor?.shopName || '—';
  const monthly = isMonthlyBilling();
  applyBillingMode(monthly);
  showScreen('checkout');
  if (!monthly) await mountCard();   // no Square card form for monthly
}

// ── Square card form (mirrors the PaymentProcessor pattern in
//    js/bookNow.js, kept isolated so the booking flow is untouched) ──
const portalPay = {
  payments: null,
  card: null,
  ready: false,
  async mount() {
    if (this.ready) return;
    if (!window.Square) throw new Error('Square SDK not loaded');
    const cfg = (window.CONFIG && window.CONFIG.square) || {};
    if (!cfg.appId || !cfg.locationId) throw new Error('Square credentials not configured');
    this.payments = await window.Square.payments(cfg.appId, cfg.locationId, cfg.environment || 'production');
    this.card = await this.payments.card();
    await this.card.attach('#card-container');
    this.ready = true;
  },
  async tokenize() {
    const res = await this.card.tokenize();
    if (res.status === 'OK') return res.token;
    const detail = res.errors && res.errors[0] && res.errors[0].message;
    throw new Error(detail || 'Please check your card details and try again.');
  },
};

async function mountCard() {
  const loading = $('card-loading');
  const err = $('card-error');
  err.textContent = '';
  loading.style.display = 'block';
  try {
    await portalPay.mount();
    loading.style.display = 'none';
  } catch (e) {
    console.error('Card mount failed:', e);
    loading.style.display = 'none';
    err.textContent = 'Unable to load the payment form. Please refresh and try again.';
  }
}

// ── Submit (Pay) ───────────────────────────────────────────
async function submitPayment() {
  if (flowState.payInProgress) return;
  const monthly = isMonthlyBilling();
  const btn = $('pay-btn');
  const err = $('card-error');
  err.textContent = '';

  if (!monthly && !portalPay.ready) { err.textContent = 'Payment form is still loading. One moment…'; return; }

  flowState.payInProgress = true;
  btn.disabled = true;
  const original = btn.innerHTML;
  btn.textContent = monthly ? 'Scheduling…' : 'Processing…';

  try {
    const token = monthly ? null : await portalPay.tokenize();
    const result = await sendDumpAndReturn(token);
    showConfirmation(result);
  } catch (e) {
    console.error('Submit failed:', e);
    err.textContent = e.message || 'Something went wrong. Please try again.';
    btn.disabled = false;
    btn.innerHTML = original;
  } finally {
    flowState.payInProgress = false;
  }
}

async function sendDumpAndReturn(token) {
  const payload = {
    pickup_window: flowState.pickupValue,
    dumpster_asset_id: contractor?.dumpster?.assetId || null,
  };
  if (token) payload.payment_token = token;   // omitted for monthly (no card)

  if (STUB_BACKEND) {
    // Phase C stub — no charge, no Firestore write. Simulated success so the
    // UI flow is fully testable. Phase D replaces this with the real call.
    await new Promise((r) => setTimeout(r, 700));
    return {
      confirmation_number: 'DR-' + Math.floor(1000 + Math.random() * 9000),
      amount_paid: PRICE.total,
      pickup_label: flowState.pickupLabel,
      stub: true,
    };
  }

  const idToken = await currentUser.getIdToken();
  const res = await fetch('/api/processDumpAndReturn', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok || data.status === 'error') {
    throw new Error(data.message || 'Payment could not be completed.');
  }
  return data;
}

function showConfirmation(result) {
  const monthly = result.billing_mode === 'monthly' || isMonthlyBilling();
  $('confirm-when').textContent = result.pickup_label || flowState.pickupLabel || '—';
  $('confirm-number').textContent = '#' + (result.confirmation_number || 'DR-0000');
  if (monthly) {
    if ($('confirm-amount-label')) $('confirm-amount-label').textContent = 'Billing';
    $('confirm-amount').textContent = 'Monthly statement';
  } else {
    $('confirm-amount').textContent = money(result.amount_paid ?? PRICE.total);
  }
  // Optimistic local UI update; the real status flip is persisted server-side
  // (Phase D) since contractor docs are not client-writable.
  if (contractor?.dumpster) {
    contractor.dumpster.status = 'pickup_scheduled';
    $('status-text').textContent = STATUS_LABEL.pickup_scheduled;
    $('status-pill-text').textContent = 'Scheduled';
  }
  showScreen('confirm');
}

// ── Wire up events ─────────────────────────────────────────
$('login-btn').addEventListener('click', doLogin);
$('login-password').addEventListener('keydown', (e) => { if (e.key === 'Enter') doLogin(); });
$('logout-link').addEventListener('click', doLogout);

$('request-btn').addEventListener('click', openFlow);
$('to-checkout').addEventListener('click', goToCheckout);
$('pay-btn').addEventListener('click', submitPayment);
$('confirm-done').addEventListener('click', closeFlow);

// Back / change buttons (data-flow-back="dashboard|request")
document.querySelectorAll('[data-flow-back]').forEach((el) => {
  el.addEventListener('click', () => {
    const target = el.dataset.flowBack;
    if (target === 'dashboard') closeFlow();
    else showScreen(target);
  });
});

// Photo upload stub — visible affordance, saves nothing (Phase C).
$('photo-box').addEventListener('click', () => {
  $('photo-box').classList.add('is-noted');
});
