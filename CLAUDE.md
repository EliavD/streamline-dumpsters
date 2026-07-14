# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Project Overview

Production website for Streamline Dumpsters Ltd. — a dumpster rental business in
Central Ohio. Static HTML/CSS/JS site on Firebase Hosting, with a Cloud Functions
(Node 22) backend and Firestore for bookings. Live and customer-facing: changes
here affect a real business taking real payments.

## Stack & Layout

- Static pages at repo root: `index.html`, `bookNow.html`, `commercial.html`,
  `contact.html`, `faq.html`, `service-area.html`, `terms.html`, `confirmation.html`,
  `portal.html` (contractor portal)
- Location pages: `dublin.html`, `powell.html`, `hilliard.html`,
  `upper-arlington.html`, `worthington.html`, `plain-city.html`
- `js/` — page scripts (booking modal: `three-step-modal.js`, `bookNow.js`)
- `css/`, `assets/`, `components/` (modal HTML partials), `blog/`
- `admin/` — admin dashboard (`/admin`, Firebase Auth-gated)
- `functions/index.js` — all Cloud Functions: `processBooking` (Square charge →
  Firestore write → Nodemailer/Gmail confirmation email), `checkAvailability`,
  `getFullyBookedDates`, `createManualBooking` (admin), plus contractor-portal
  functions (`processDumpAndReturn`, `recordWeighIn`, `settleStatement`,
  `getStatements`). Routed as `/api/*` via hosting rewrites (Cloud Run, us-central1).
- `functions/.env` — Square + Gmail credentials (never commit or print values)
- `firebase.json` — hosting config, security headers, cache tiers, `/api/*` rewrites.
  New/renamed pages must be added to the no-cache route allowlist in it.

## Commands

- `npm run dev` — local dev server (browser-sync, from repo root)
- `npm run preview` — deploy 7-day Firebase Hosting preview channel
- `firebase deploy` — full deploy (hosting + functions + firestore rules/indexes)
- `firebase deploy --only functions` — functions only (also `npm run deploy` in `functions/`)
- `firebase deploy --only hosting` — hosting only
- `firebase emulators:start --only functions` — local functions emulator
  (`npm run serve` in `functions/`)
- `firebase functions:log` — read Cloud Functions logs

## Business Facts

- Pricing: **$289** (10-yard) / **$319** (14-yard) / **$389** (20-yard), pre-tax.
  Identical on every location page. Server-side source of truth: `PRICES` in
  `functions/index.js` (cents, includes 8% tax: 31212 / 34452 / 42012).
- Inventory: 1× 10yd, 3× 14yd, 2× 20yd (`INVENTORY` in `functions/index.js`)
- Service area: Dublin, Powell, Hilliard, Upper Arlington, Worthington,
  Plain City + surrounding Central Ohio
- Payments: Square (production). Bookings stored in Firestore `bookings` collection.
- Confirmation emails: Nodemailer via Gmail (`streamlinedumpstersltd@gmail.com`),
  BCC to the same address on every send.

## Hard Rules

1. **NEVER deploy without explicit approval from Eli.** Propose the change with a
   risk level (low/med/high) and wait for go/no-go before any deploy.
2. **NEVER modify booking or payment logic without flagging it first** —
   `processBooking`, Square calls, refund logic, and price/inventory tables.
3. **CSP is Report-Only — do NOT flip to enforce.** Blocked pending a live Square
   booking test (`Content-Security-Policy-Report-Only` in `firebase.json`).
4. **Pricing changes must be applied to ALL location pages** (plus `index.html`,
   `bookNow.html`, JSON-LD structured data, and the server-side `PRICES` table).

## Deploy rules

- Before any `firebase deploy`: run `git status` — deploy ships the
  working tree, not the last commit. Uncommitted changes to firebase.json
  or any served file WILL go live.
- Firebase serves JS/CSS with `Cache-Control: max-age=31536000, immutable`
  (one year). Any change to a JS or CSS file REQUIRES bumping its `?v=` query
  string in EVERY page that references it, or returning visitors keep the old
  file for up to a year.
- Never deploy payment-related changes straight to the live channel. Deploy to
  the Firebase preview channel (`npm run preview`), complete a full test booking
  end to end, then promote.
- Rollback: `firebase hosting:rollback`. Verify it works before any risky deploy.
- New or renamed pages must be added to the clean-URL no-cache allowlist in
  firebase.json (cleanUrls strips .html, so the generic HTML no-cache rule
  never matches real requests). Miss it and the page's HTML caches and ?v=
  bumps won't reach visitors.

## Parked Items (context only — do not start unprompted)

- Badge cleanup
- www redirect
- CSP enforcement flip (see Hard Rule 3)

## Maintaining This File

When `PRICES` or `INVENTORY` change in `functions/index.js`, or pages are
added/renamed, update this file in the same commit.
