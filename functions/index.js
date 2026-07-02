// deploy: production-v1
const { randomUUID } = require("crypto");
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const fetch = require("node-fetch");
const nodemailer = require("nodemailer");
require("dotenv").config();

admin.initializeApp();
const db = admin.firestore();

const SQUARE_ACCESS_TOKEN = process.env.SQUARE_ACCESS_TOKEN;
const SQUARE_LOCATION_ID = process.env.SQUARE_LOCATION_ID;
const SQUARE_API_VERSION = "2024-01-18";
const SQUARE_API_BASE = "https://connect.squareup.com/v2";


const INVENTORY = { "10": 1, "14": 3, "20": 2 };

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function mapSquareError(errors) {
  if (!errors || !errors.length) return "Payment failed. Please try again.";
  const code = errors[0].code;
  const map = {
    CARD_DECLINED: "Your card was declined. Please try a different card.",
    CVV_FAILURE: "The card security code (CVV) is incorrect. Please check and try again.",
    ADDRESS_VERIFICATION_FAILURE: "The billing address doesn't match your card. Please check and try again.",
    EXPIRATION_FAILURE: "Your card has expired. Please use a different card.",
    INSUFFICIENT_FUNDS: "Your card has insufficient funds.",
    CARD_NOT_SUPPORTED: "This card type is not supported. Please try a different card.",
    INVALID_CARD: "The card information is invalid. Please check your details and try again.",
    GENERIC_DECLINE: "Your card was declined. Please contact your bank or try a different card.",
    CARD_VELOCITY_EXCEEDED: "Too many payment attempts. Please wait a few minutes and try again.",
    PAN_FAILURE: "The card number is invalid. Please check and try again.",
    VERIFY_CVV_FAILURE: "The card security code (CVV) is incorrect. Please check and try again.",
    VERIFY_AVS_FAILURE: "Address verification failed. Please check your billing address.",
    INVALID_EXPIRATION: "The card expiration date is invalid.",
    INVALID_PIN: "The PIN entered is incorrect.",
    CARD_TOKEN_EXPIRED: "Your payment session has expired. Please refresh the page and try again.",
    CARD_TOKEN_USED: "This payment token has already been used. Please refresh the page.",
  };
  return map[code] || errors[0].detail || "Payment failed. Please try again.";
}

function buildEmailHtml(data, paymentId) {
  const subtotal = parseFloat(data.subtotal || 0).toFixed(2);
  const taxRate = parseFloat(data.tax_rate || 0);
  const taxPct = Math.round(taxRate * 100);
  const taxAmount = parseFloat(data.tax_amount || 0).toFixed(2);
  const total = parseFloat(data.amount || 0).toFixed(2);
  const size = data.dumpster_size || "14";
  const addressLine = `${data.dropoff_address}<br>${data.dropoff_city}${data.dropoff_zip ? ", " + data.dropoff_zip : ""}`;

  const specialInstructions = data.dropoff_notes
    ? `<div style="padding:16px;background-color:#f1f5f9;border-left:4px solid #01b0bb;border-radius:8px;margin-top:20px;">
        <p style="margin:0 0 4px 0;color:#64748b;font-size:12px;font-weight:700;text-transform:uppercase;">SPECIAL INSTRUCTIONS</p>
        <p style="margin:0;color:#334155;font-size:14px;">${data.dropoff_notes}</p>
      </div>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    @media only screen and (max-width:600px){
      .email-container{width:100%!important;}
      .content-padding{padding:16px!important;}
      .header-padding{padding:24px 16px!important;}
    }
  </style>
</head>
<body style="margin:0;padding:20px;font-family:system-ui,-apple-system,sans-serif;background:#f8fafc;">
  <table role="presentation" style="width:100%;border-collapse:collapse;background-color:#f8fafc;" cellpadding="0" cellspacing="0">
    <tr><td style="padding:0;" align="center">
    <table role="presentation" class="email-container" style="width:100%;max-width:600px;border-collapse:collapse;background-color:#ffffff;" cellpadding="0" cellspacing="0">

    <!-- HEADER -->
    <tr><td class="header-padding" style="background:linear-gradient(to right,#01b0bb,#2a7d84);padding:32px 24px;text-align:center;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
      <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;letter-spacing:-0.5px;font-family:Roboto,Arial,sans-serif;">Streamline Dumpsters</h1>
      <p style="margin:4px 0 0 0;color:rgba(255,255,255,0.9);font-size:14px;">Booking Confirmation</p>
    </td></tr>

    <!-- MAIN CONTENT -->
    <tr><td class="content-padding" style="padding:24px;">

      <!-- GREETING -->
      <div style="margin-bottom:24px;color:#334155;">
        <p style="margin:0 0 12px 0;font-size:18px;color:#334155;">Dear ${data.name},</p>
        <p style="margin:0;font-size:16px;line-height:24px;color:#334155;">Thank you for your booking! Your dumpster rental has been confirmed.</p>
      </div>

      <!-- STATUS BOX -->
      <table role="presentation" style="width:100%;border-collapse:collapse;background-color:#f0fdfa;border-left:4px solid #14b8a6;border-radius:8px;margin-bottom:32px;" cellpadding="0" cellspacing="0">
        <tr><td style="padding:16px;">
          <table role="presentation" style="width:100%;border-collapse:collapse;" cellpadding="0" cellspacing="0">
            <tr>
              <td style="width:40px;vertical-align:top;">
                <div style="width:32px;height:32px;background-color:#14b8a6;border-radius:50%;color:#ffffff;font-weight:bold;text-align:center;line-height:32px;font-size:20px;">&#10003;</div>
              </td>
              <td style="vertical-align:top;">
                <p style="margin:0 0 4px 0;color:#0f766e;font-size:16px;font-weight:700;">BOOKING CONFIRMED</p>
                <p style="margin:0;color:#0d9488;font-size:14px;">Your payment has been processed successfully</p>
              </td>
            </tr>
          </table>
        </td></tr>
      </table>

      <!-- BOOKING DETAILS -->
      <div style="margin-bottom:32px;">
        <h2 style="margin:0 0 16px 0;color:#01b0bb;font-size:20px;font-weight:700;padding-bottom:8px;border-bottom:1px solid #e2e8f0;">Booking Details</h2>
        <table role="presentation" style="width:100%;border-collapse:collapse;margin-bottom:20px;" cellpadding="0" cellspacing="0">
          <tr>
            <td style="width:40px;vertical-align:top;padding-top:4px;"><span style="color:#64748b;font-size:20px;">&#128197;</span></td>
            <td style="padding-bottom:20px;">
              <p style="margin:0 0 2px 0;color:#64748b;font-size:14px;">Delivery Date:</p>
              <p style="margin:0;color:#334155;font-size:16px;font-weight:600;">${data.delivery_date}</p>
            </td>
          </tr>
          <tr>
            <td style="width:40px;vertical-align:top;padding-top:4px;"><span style="color:#64748b;font-size:20px;">&#128197;</span></td>
            <td style="padding-bottom:20px;">
              <p style="margin:0 0 2px 0;color:#64748b;font-size:14px;">Pickup Date:</p>
              <p style="margin:0;color:#334155;font-size:16px;font-weight:600;">${data.pickup_date}</p>
            </td>
          </tr>
          <tr>
            <td style="width:40px;vertical-align:top;padding-top:4px;"><span style="color:#64748b;font-size:20px;">&#128205;</span></td>
            <td style="padding-bottom:20px;">
              <p style="margin:0 0 2px 0;color:#64748b;font-size:14px;">Delivery Address:</p>
              <p style="margin:0;color:#334155;font-size:16px;font-weight:600;">${addressLine}</p>
            </td>
          </tr>
          <tr>
            <td style="width:40px;vertical-align:top;padding-top:4px;"><span style="color:#64748b;font-size:20px;">&#128465;</span></td>
            <td style="padding-bottom:20px;">
              <p style="margin:0 0 2px 0;color:#64748b;font-size:14px;">Dumpster Size:</p>
              <p style="margin:0;color:#334155;font-size:16px;font-weight:600;">${size} yard</p>
            </td>
          </tr>
        </table>
        ${specialInstructions}
      </div>

      <!-- PAYMENT SUMMARY -->
      <div style="margin-bottom:32px;">
        <h2 style="margin:0 0 16px 0;color:#01b0bb;font-size:20px;font-weight:700;padding-bottom:8px;border-bottom:1px solid #e2e8f0;">Payment Summary</h2>
        <table role="presentation" style="width:100%;border-collapse:collapse;" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:12px 0;color:#334155;font-size:14px;">Subtotal:</td>
            <td style="padding:12px 0;color:#334155;font-size:14px;text-align:right;">$${subtotal}</td>
          </tr>
          <tr>
            <td style="padding:12px 0;color:#334155;font-size:14px;">Tax (${taxPct}%):</td>
            <td style="padding:12px 0;color:#334155;font-size:14px;text-align:right;">$${taxAmount}</td>
          </tr>
          <tr>
            <td colspan="2" style="padding:16px 0;border-top:1px solid #e2e8f0;"></td>
          </tr>
          <tr>
            <td style="padding:8px 0 0 0;color:#334155;font-size:18px;font-weight:700;">Total Paid:</td>
            <td style="padding:8px 0 0 0;color:#10b981;font-size:20px;font-weight:700;text-align:right;">$${total}</td>
          </tr>
        </table>
        <div style="margin-top:12px;text-align:right;">
          <p style="margin:0;display:inline-block;padding:4px 8px;background-color:#f1f5f9;color:#64748b;font-size:12px;border-radius:4px;">Payment ID: ${paymentId}</p>
        </div>
      </div>

    </td></tr>
    </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function buildEmailText(data, paymentId) {
  const subtotal = parseFloat(data.subtotal || 0).toFixed(2);
  const taxPct = Math.round(parseFloat(data.tax_rate || 0) * 100);
  const taxAmount = parseFloat(data.tax_amount || 0).toFixed(2);
  const total = parseFloat(data.amount || 0).toFixed(2);
  const size = data.dumpster_size || "14";

  let t = `Dear ${data.name},\n\nThank you for your booking! Your dumpster rental has been confirmed.\n\n`;
  t += `BOOKING DETAILS\n${"─".repeat(28)}\n`;
  t += `Delivery Date:  ${data.delivery_date}\n`;
  t += `Pickup Date:    ${data.pickup_date}\n`;
  t += `Address:        ${data.dropoff_address}, ${data.dropoff_city}${data.dropoff_zip ? " " + data.dropoff_zip : ""}\n`;
  t += `Dumpster Size:  ${size} yard\n`;
  if (data.dropoff_notes) t += `Special Notes:  ${data.dropoff_notes}\n`;
  t += `\nPAYMENT SUMMARY\n${"─".repeat(28)}\n`;
  t += `Subtotal:       $${subtotal}\n`;
  t += `Tax (${taxPct}%):      $${taxAmount}\n`;
  t += `Total Paid:     $${total}\n`;
  t += `Payment ID:     ${paymentId}\n\n`;
  t += `If you have any questions, please contact us at (614) 636-2343.\n\nThank you for choosing Streamline Dumpsters!\n\nBest regards,\nStreamline Dumpsters Team`;
  return t;
}

// ─────────────────────────────────────────────
// FUNCTION 1 — processBooking
// ─────────────────────────────────────────────

exports.processBooking = functions.https.onRequest(async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ status: "error", message: "Method not allowed" });

  const data = req.body;

  // Validate required fields
  const required = ["payment_token", "name", "email", "delivery_date", "pickup_date", "dropoff_address", "dropoff_city"];
  for (const field of required) {
    if (!data[field] || String(data[field]).trim() === "") {
      return res.status(400).json({ status: "error", message: `Missing required field: ${field}` });
    }
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    return res.status(400).json({ status: "error", message: "Invalid email address format" });
  }

  const dateRe = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRe.test(data.delivery_date) || !dateRe.test(data.pickup_date)) {
    return res.status(400).json({ status: "error", message: "Dates must be in YYYY-MM-DD format" });
  }

  if (data.pickup_date < data.delivery_date) {
    return res.status(400).json({ status: "error", message: "Pickup date must be on or after delivery date" });
  }

  // Step 1 — Square payment
  // Server-side price table — source of truth regardless of what the client sends
  const PRICES = { "10": 31212, "14": 34452, "20": 42012 };
  const dumpsterSize = String(data.dumpster_size || "14");
  if (!PRICES[dumpsterSize]) {
    return res.status(400).json({ status: "error", message: `Invalid dumpster size: ${dumpsterSize}` });
  }
  const amountCents = PRICES[dumpsterSize]; // always use server-side price

  // ── Capacity gate (pre-charge) ───────────────────────────────
  // Refuse a full size BEFORE charging the card. Same blocking definition as
  // checkAvailability: confirmed bookings of this size whose date range overlaps
  // the requested range. The authoritative re-check is the transaction below;
  // this pre-check avoids charging in the common "already full" case.
  const capacity = INVENTORY[dumpsterSize] ?? 1;
  const overlapsRequest = (b) =>
    data.delivery_date <= b.pickupDate && data.pickup_date >= b.deliveryDate;
  try {
    const preSnap = await db.collection("bookings")
      .where("status", "==", "confirmed")
      .where("size", "==", dumpsterSize)
      .get();
    let overlapping = 0;
    preSnap.forEach((doc) => { if (overlapsRequest(doc.data())) overlapping++; });
    if (overlapping >= capacity) {
      return res.status(409).json({
        status: "error",
        message: "That size is no longer available for those dates. Please choose different dates or another size.",
      });
    }
  } catch (err) {
    console.error("Capacity pre-check failed:", err.message);
    return res.status(500).json({ status: "error", message: "Could not verify availability. Please try again." });
  }

  const idempotencyKey = randomUUID();
  let squarePaymentId;

  const TEST_MODE = process.env.TEST_MODE === "true";

  if (TEST_MODE) {
    squarePaymentId = "TEST_PAYMENT_" + idempotencyKey.substring(0, 8).toUpperCase();
    console.log("[TEST_MODE] Skipping Square charge, mock payment ID:", squarePaymentId);
  } else {
    try {
      const sqRes = await fetch(`${SQUARE_API_BASE}/payments`, {
        method: "POST",
        headers: {
          "Square-Version": SQUARE_API_VERSION,
          "Authorization": `Bearer ${SQUARE_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          source_id: data.payment_token,
          amount_money: { amount: amountCents, currency: "USD" },
          location_id: SQUARE_LOCATION_ID,
          idempotency_key: idempotencyKey,
          note: `Dumpster Rental - ${data.name}`,
          buyer_email_address: data.email,
        }),
      });

      const sqData = await sqRes.json();

      if (!sqRes.ok || !sqData.payment) {
        return res.status(402).json({ status: "error", message: mapSquareError(sqData.errors) });
      }

      squarePaymentId = sqData.payment.id;
    } catch (err) {
      console.error("Square request failed:", err.message);
      return res.status(500).json({ status: "error", message: "Payment processing failed. Please try again." });
    }
  }

  // Steps 2-3 — Firestore + Email (auto-refund on failure)
  try {
    const bookingData = {
      size: data.dumpster_size || "14",
      deliveryDate: data.delivery_date,
      pickupDate: data.pickup_date,
      dropoffTime: data.time || "",
      status: "confirmed",
      customer: {
        name: data.name,
        email: data.email,
        phone: data.phone || "",
        address: data.dropoff_address,
        city: data.dropoff_city,
        zip: data.dropoff_zip || "",
        notes: data.dropoff_notes || "",
      },
      payment: {
        squarePaymentId,
        amountCents,
        subtotal: parseFloat(data.subtotal) || 0,
        taxRate: parseFloat(data.tax_rate) || 0,
        taxAmount: parseFloat(data.tax_amount) || 0,
        total: parseFloat(data.amount) || 0,
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    // Atomic capacity re-check + write. The query read inside the transaction
    // closes the last-unit race: of two concurrent requests for the final unit,
    // only one commits; the other retries, sees it full, and throws CAPACITY_FULL.
    const docRef = await db.runTransaction(async (txn) => {
      const snap = await txn.get(
        db.collection("bookings")
          .where("status", "==", "confirmed")
          .where("size", "==", dumpsterSize)
      );
      let overlapping = 0;
      snap.forEach((doc) => { if (overlapsRequest(doc.data())) overlapping++; });
      if (overlapping >= capacity) {
        const e = new Error("CAPACITY_FULL");
        e.capacityFull = true;
        throw e;
      }
      const ref = db.collection("bookings").doc();
      txn.set(ref, bookingData);
      return ref;
    });

    // Step 3 — Confirmation email (non-critical)
    try {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
      });
      await transporter.sendMail({
        from: `"Streamline Dumpsters" <${process.env.GMAIL_USER}>`,
        to: data.email,
        bcc: process.env.GMAIL_USER,
        subject: "Booking Confirmation - Streamline Dumpsters",
        html: buildEmailHtml(data, squarePaymentId),
        text: buildEmailText(data, squarePaymentId),
      });
    } catch (emailErr) {
      console.error("Confirmation email failed (non-critical):", emailErr.message);
    }

    return res.status(200).json({
      status: "success",
      message: "Booking confirmed and payment processed",
      booking_id: docRef.id,
      payment_id: squarePaymentId,
      amount_paid: parseFloat(data.amount) || amountCents / 100,
    });
  } catch (firestoreErr) {
    const capacityFull = !!(firestoreErr && firestoreErr.capacityFull);
    console.error(
      capacityFull
        ? "Capacity full at commit (race) — refunding:"
        : "Firestore write failed, initiating auto-refund:",
      firestoreErr.message
    );

    // Auto-refund
    try {
      const refundRes = await fetch(`${SQUARE_API_BASE}/refunds`, {
        method: "POST",
        headers: {
          "Square-Version": SQUARE_API_VERSION,
          "Authorization": `Bearer ${SQUARE_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          idempotency_key: randomUUID(),
          payment_id: squarePaymentId,
          amount_money: { amount: amountCents, currency: "USD" },
          reason: "Automatic refund: booking confirmation failed",
        }),
      });

      const refundData = await refundRes.json();
      const refundId = refundData.refund && refundData.refund.id;

      if (capacityFull) {
        return res.status(409).json({
          status: "error",
          message: `That size is no longer available for those dates. Your payment was not kept — it has been refunded (Refund ID: ${refundId}). Please choose different dates or another size.`,
        });
      }

      return res.status(500).json({
        status: "error",
        message: `Something went wrong confirming your booking. Your payment has been automatically refunded (Refund ID: ${refundId}). Please try again or call us at (614) 636-2343.`,
      });
    } catch (refundErr) {
      console.error("Auto-refund also failed:", refundErr.message);
      return res.status(500).json({
        status: "error",
        message: `Something went wrong with your booking. Your payment (ID: ${squarePaymentId}) may have been charged. Please call us immediately at (614) 636-2343 and we will make it right.`,
      });
    }
  }
});

// ─────────────────────────────────────────────
// FUNCTION 2 — checkAvailability
// ─────────────────────────────────────────────

exports.checkAvailability = functions.https.onRequest(async (req, res) => {
  const { start, end, size = "14" } = req.query;

  if (!start || !end) {
    return res.status(400).json({ status: "error", message: "Missing required query params: start, end" });
  }

  const snapshot = await db.collection("bookings")
    .where("status", "==", "confirmed")
    .where("size", "==", size)
    .get();

  let overlapping = 0;
  snapshot.forEach((doc) => {
    const b = doc.data();
    if (start <= b.pickupDate && end >= b.deliveryDate) overlapping++;
  });

  const capacity = INVENTORY[size] ?? 1;
  const remaining = Math.max(0, capacity - overlapping);

  return res.status(200).json({ available: remaining > 0, remaining });
});

// ─────────────────────────────────────────────
// FUNCTION 3 — getFullyBookedDates
// ─────────────────────────────────────────────

// ─────────────────────────────────────────────
// FUNCTION 4 — createManualBooking (admin only)
// ─────────────────────────────────────────────

exports.createManualBooking = functions.https.onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") {
    res.set("Access-Control-Allow-Methods", "POST");
    res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    return res.status(204).send("");
  }

  if (req.method !== "POST") return res.status(405).json({ status: "error", message: "Method not allowed" });

  // Verify Firebase Auth token
  const authHeader = req.headers.authorization || "";
  if (!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ status: "error", message: "Unauthorized" });
  }
  try {
    await admin.auth().verifyIdToken(authHeader.slice(7));
  } catch (e) {
    return res.status(401).json({ status: "error", message: "Invalid auth token" });
  }

  const data = req.body;
  const required = ["name", "email", "delivery_date", "pickup_date", "dropoff_address", "dropoff_city"];
  for (const field of required) {
    if (!data[field] || String(data[field]).trim() === "") {
      return res.status(400).json({ status: "error", message: `Missing required field: ${field}` });
    }
  }

  const PRICES = { "10": 31212, "14": 34452, "20": 42012 };
  const dumpsterSize = String(data.dumpster_size || "14");
  const defaultCents = PRICES[dumpsterSize] || 34452;
  const amountCents = data.amount_cents ? parseInt(data.amount_cents) : defaultCents;
  const total = amountCents / 100;
  const subtotal = parseFloat((total / 1.08).toFixed(2));
  const taxAmount = parseFloat((total - subtotal).toFixed(2));

  // Soft capacity check (Option B) — admin may intentionally overbook, so we
  // only WARN and never block the manual path.
  let capacityWarning = null;
  try {
    const cap = INVENTORY[dumpsterSize] ?? 1;
    const capSnap = await db.collection("bookings")
      .where("status", "==", "confirmed")
      .where("size", "==", dumpsterSize)
      .get();
    let overlapping = 0;
    capSnap.forEach((doc) => {
      const b = doc.data();
      if (data.delivery_date <= b.pickupDate && data.pickup_date >= b.deliveryDate) overlapping++;
    });
    if (overlapping >= cap) {
      capacityWarning = `Heads-up: all ${cap} ${dumpsterSize}-yard unit(s) are already booked for those dates — this manual booking overbooks that size.`;
    }
  } catch (e) {
    console.error("Manual booking capacity check failed (non-blocking):", e.message);
  }

  try {
    const docRef = await db.collection("bookings").add({
      size: dumpsterSize,
      deliveryDate: data.delivery_date,
      pickupDate: data.pickup_date,
      dropoffTime: data.time || "",
      status: "confirmed",
      source: "manual",
      customer: {
        name: data.name,
        email: data.email,
        phone: data.phone || "",
        address: data.dropoff_address,
        city: data.dropoff_city,
        zip: data.dropoff_zip || "",
        notes: data.dropoff_notes || "",
      },
      payment: {
        squarePaymentId: "MANUAL",
        amountCents,
        subtotal,
        taxRate: 0.08,
        taxAmount,
        total,
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    try {
      const emailData = {
        ...data,
        dumpster_size: dumpsterSize,
        amount: String(total),
        subtotal: String(subtotal),
        tax_rate: "0.08",
        tax_amount: String(taxAmount),
      };
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
      });
      await transporter.sendMail({
        from: `"Streamline Dumpsters" <${process.env.GMAIL_USER}>`,
        to: data.email,
        bcc: process.env.GMAIL_USER,
        subject: "Booking Confirmation - Streamline Dumpsters",
        html: buildEmailHtml(emailData, "MANUAL"),
        text: buildEmailText(emailData, "MANUAL"),
      });
    } catch (emailErr) {
      console.error("Manual booking email failed (non-critical):", emailErr.message);
    }

    return res.status(200).json({ status: "success", booking_id: docRef.id, capacity_warning: capacityWarning });
  } catch (err) {
    console.error("createManualBooking failed:", err.message);
    return res.status(500).json({ status: "error", message: "Failed to create booking. Please try again." });
  }
});



exports.getFullyBookedDates = functions.https.onRequest(async (req, res) => {
  const { size = "14" } = req.query;

  const today = new Date();
  const threeMonths = new Date();
  threeMonths.setMonth(threeMonths.getMonth() + 3);

  const todayStr = today.toISOString().split("T")[0];
  const threeMonthsStr = threeMonths.toISOString().split("T")[0];

  const snapshot = await db.collection("bookings")
    .where("status", "==", "confirmed")
    .where("size", "==", size)
    .get();

  const dateCount = {};

  snapshot.forEach((doc) => {
    const b = doc.data();
    // Skip bookings already fully completed before today
    if (!b.pickupDate || b.pickupDate < todayStr) return;
    // Start walk from today if delivery was in the past (dumpster already out)
    const walkFrom = b.deliveryDate > todayStr ? b.deliveryDate : todayStr;
    const start = new Date(walkFrom + "T00:00:00");
    const end = new Date(b.pickupDate + "T00:00:00");

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split("T")[0];
      if (dateStr > threeMonthsStr) break;
      dateCount[dateStr] = (dateCount[dateStr] || 0) + 1;
    }
  });

  const capacity = INVENTORY[size] ?? 1;
  const fullyBookedDates = Object.keys(dateCount).filter((d) => dateCount[d] >= capacity);

  return res.status(200).json({
    status: "ok",
    fullyBookedDates,
    timestamp: new Date().toISOString(),
  });
});

// ─────────────────────────────────────────────
// FUNCTION 5 — processDumpAndReturn (contractor portal)
// Modeled on processBooking: verify caller → server-side price → Square charge
// (TEST_MODE-safe) → Firestore write → status flip → email, with auto-refund.
// APPENDED — nothing above this line is modified.
// ─────────────────────────────────────────────

exports.processDumpAndReturn = functions.https.onRequest(async (req, res) => {
  // CORS preflight (same shape as createManualBooking)
  res.set("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") {
    res.set("Access-Control-Allow-Methods", "POST");
    res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    return res.status(204).send("");
  }
  if (req.method !== "POST") return res.status(405).json({ status: "error", message: "Method not allowed" });

  // Verify Firebase Auth token → contractorId is the signed-in uid
  const authHeader = req.headers.authorization || "";
  if (!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ status: "error", message: "Unauthorized" });
  }
  let contractorId;
  try {
    const decoded = await admin.auth().verifyIdToken(authHeader.slice(7));
    contractorId = decoded.uid;
  } catch (e) {
    return res.status(401).json({ status: "error", message: "Invalid auth token" });
  }

  const data = req.body || {};
  // pickup_window is validated for ALL billing modes; payment_token is required
  // only for the per_dump charge path (checked below), so monthly takes no card.
  if (!/^\d{4}-\d{2}-\d{2}\|(AM|PM)$/.test(String(data.pickup_window || ""))) {
    return res.status(400).json({ status: "error", message: "Invalid pickup window" });
  }

  // Contractor must exist (Admin SDK read — bypasses rules)
  let contractor;
  try {
    const snap = await db.collection("contractors").doc(contractorId).get();
    if (!snap.exists) {
      return res.status(403).json({ status: "error", message: "No contractor account found for this user." });
    }
    contractor = snap.data();
  } catch (e) {
    console.error("Contractor lookup failed:", e.message);
    return res.status(500).json({ status: "error", message: "Could not verify your account. Please try again." });
  }

  // Server-side price table — source of truth (client amounts are ignored)
  const SUBTOTAL_CENTS = 35000;                            // $350.00 flat
  const TAX_RATE = 0.08;                                   // 8%
  const TAX_CENTS = Math.round(SUBTOTAL_CENTS * TAX_RATE); // 2800 = $28.00
  const amountCents = SUBTOTAL_CENTS + TAX_CENTS;          // 37800 = $378.00
  const subtotal = SUBTOTAL_CENTS / 100;
  const taxAmount = TAX_CENTS / 100;
  const total = amountCents / 100;

  // TEST MODE — ISOLATED from processBooking. This function stays in test mode
  // (no real charge) unless DR_TEST_MODE is explicitly set to "false".
  const TEST_MODE = process.env.DR_TEST_MODE !== "false";

  const idempotencyKey = randomUUID();
  let squarePaymentId;

  // Billing mode is read from Firestore server-side — the client cannot bypass
  // the charge skip. Monthly contractors are never charged here; the existing
  // per_dump charge path below (token + DR_TEST_MODE + Square + auto-refund) is
  // unchanged, just gated behind these conditions.
  const isMonthly = contractor.billingMode === "monthly";

  if (isMonthly) {
    squarePaymentId = null;
    console.log("[DR MONTHLY] No charge — billed monthly:", contractorId);
  } else if (!data.payment_token || String(data.payment_token).trim() === "") {
    return res.status(400).json({ status: "error", message: "Missing payment token" });
  } else if (TEST_MODE) {
    squarePaymentId = "TEST_DR_" + idempotencyKey.substring(0, 8).toUpperCase();
    console.log("[DR TEST_MODE] Skipping Square charge, mock payment ID:", squarePaymentId);
  } else {
    try {
      const sqRes = await fetch(`${SQUARE_API_BASE}/payments`, {
        method: "POST",
        headers: {
          "Square-Version": SQUARE_API_VERSION,
          "Authorization": `Bearer ${SQUARE_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          source_id: data.payment_token,
          amount_money: { amount: amountCents, currency: "USD" },
          location_id: SQUARE_LOCATION_ID,
          idempotency_key: idempotencyKey,
          note: `Dump & Return - ${contractor.businessName || contractorId}`,
          buyer_email_address: contractor.email || undefined,
        }),
      });
      const sqData = await sqRes.json();
      if (!sqRes.ok || !sqData.payment) {
        return res.status(402).json({ status: "error", message: mapSquareError(sqData.errors) });
      }
      squarePaymentId = sqData.payment.id;
    } catch (err) {
      console.error("Square request failed:", err.message);
      return res.status(500).json({ status: "error", message: "Payment processing failed. Please try again." });
    }
  }

  // Firestore write + dumpster status flip + email (auto-refund on failure)
  const confirmationNumber = "DR-" + String(Math.floor(1000 + Math.random() * 9000));
  try {
    const docRef = await db.collection("serviceRequests").add({
      contractorId,
      type: "dump_return",
      dumpsterAssetId: (contractor.dumpster && contractor.dumpster.assetId) || data.dumpster_asset_id || null,
      pickupWindow: data.pickup_window,
      photoUrl: null,
      status: "scheduled",
      payment: {
        squarePaymentId,
        amountCents,
        subtotal,
        taxRate: TAX_RATE,
        taxAmount,
        total,
        overageCents: null,
      },
      billingMode: isMonthly ? "monthly" : "per_dump",
      billingStatus: isMonthly ? "unbilled" : "paid",
      weighInLbs: null,
      confirmationNumber,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Flip the on-site unit to "pickup_scheduled" (best-effort, non-fatal)
    try {
      await db.collection("contractors").doc(contractorId).update({ "dumpster.status": "pickup_scheduled" });
    } catch (statusErr) {
      console.error("Dumpster status update failed (non-critical):", statusErr.message);
    }

    // Confirmation email — reuses buildEmailHtml/buildEmailText (non-critical)
    try {
      const pickupDate = String(data.pickup_window).split("|")[0];
      const emailData = {
        name: contractor.businessName || "Contractor",
        email: contractor.email || "",
        delivery_date: pickupDate,
        pickup_date: pickupDate,
        dropoff_address: contractor.address || "",
        dropoff_city: contractor.shopName || "",
        dropoff_zip: "",
        dumpster_size: (contractor.dumpster && contractor.dumpster.size) || "20",
        subtotal: String(subtotal),
        tax_rate: String(TAX_RATE),
        tax_amount: String(taxAmount),
        amount: String(total),
      };
      if (emailData.email) {
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
        });
        await transporter.sendMail({
          from: `"Streamline Dumpsters" <${process.env.GMAIL_USER}>`,
          to: emailData.email,
          bcc: process.env.GMAIL_USER,
          subject: "Dump & Return Confirmation - Streamline Dumpsters",
          html: buildEmailHtml(emailData, squarePaymentId),
          text: buildEmailText(emailData, squarePaymentId),
        });
      }
    } catch (emailErr) {
      console.error("Dump & return email failed (non-critical):", emailErr.message);
    }

    return res.status(200).json({
      status: "success",
      message: "Dump & return scheduled",
      service_request_id: docRef.id,
      confirmation_number: confirmationNumber,
      payment_id: squarePaymentId,
      amount_paid: isMonthly ? 0 : total,
      billing_mode: isMonthly ? "monthly" : "per_dump",
      test_mode: TEST_MODE,
    });
  } catch (firestoreErr) {
    console.error("Firestore write failed, initiating auto-refund:", firestoreErr.message);
    if (isMonthly || TEST_MODE) {
      return res.status(500).json({ status: "error", message: "Something went wrong scheduling your pickup. No charge was made. Please try again." });
    }
    try {
      const refundRes = await fetch(`${SQUARE_API_BASE}/refunds`, {
        method: "POST",
        headers: {
          "Square-Version": SQUARE_API_VERSION,
          "Authorization": `Bearer ${SQUARE_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          idempotency_key: randomUUID(),
          payment_id: squarePaymentId,
          amount_money: { amount: amountCents, currency: "USD" },
          reason: "Automatic refund: dump & return scheduling failed",
        }),
      });
      const refundData = await refundRes.json();
      const refundId = refundData.refund && refundData.refund.id;
      return res.status(500).json({
        status: "error",
        message: `Something went wrong scheduling your pickup. Your payment has been automatically refunded (Refund ID: ${refundId}). Please try again or call us at (614) 636-2343.`,
      });
    } catch (refundErr) {
      console.error("Auto-refund also failed:", refundErr.message);
      return res.status(500).json({
        status: "error",
        message: `Something went wrong scheduling your pickup. Your payment (ID: ${squarePaymentId}) may have been charged. Please call us at (614) 636-2343 and we will make it right.`,
      });
    }
  }
});

// ─────────────────────────────────────────────
// FUNCTION 6 — recordWeighIn (admin only)
// Records a weigh-in: in ONE transaction, completes the serviceRequest
// (weighInLbs, status, server-recomputed overage/subtotal/tax/total, completedAt)
// AND flips the contractor's dumpster (lastEmptied + status:"on_site"). Both docs
// commit together or not at all; a concurrent/duplicate weigh-in is refused (409).
// Admin SDK; NO rules change. Touches ONLY serviceRequests + contractors — never
// the bookings collection. APPENDED — nothing above this line is modified.
// ─────────────────────────────────────────────

const ADMIN_UID = "sYC54EnjOBZZZFCv1x7nBFV3pZm2";

exports.recordWeighIn = functions.https.onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") {
    res.set("Access-Control-Allow-Methods", "POST");
    res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    return res.status(204).send("");
  }
  if (req.method !== "POST") return res.status(405).json({ status: "error", message: "Method not allowed" });

  // Admin-only: verify the Firebase ID token AND that the caller is the admin uid.
  const authHeader = req.headers.authorization || "";
  if (!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ status: "error", message: "Unauthorized" });
  }
  try {
    const decoded = await admin.auth().verifyIdToken(authHeader.slice(7));
    if (decoded.uid !== ADMIN_UID) {
      return res.status(403).json({ status: "error", message: "Forbidden — admin only." });
    }
  } catch (e) {
    return res.status(401).json({ status: "error", message: "Invalid auth token" });
  }

  // Validate input (the admin supplies ONLY the weight; the server computes money).
  const data = req.body || {};
  const serviceRequestId = String(data.serviceRequestId || "").trim();
  const weighInLbs = Math.round(Number(data.weighInLbs));
  if (!serviceRequestId) {
    return res.status(400).json({ status: "error", message: "Missing serviceRequestId" });
  }
  if (!Number.isFinite(weighInLbs) || weighInLbs < 0 || weighInLbs >= 100000) {
    return res.status(400).json({ status: "error", message: "Invalid weighInLbs" });
  }

  // Server-side billing math (authoritative — client amounts never trusted).
  const BASE_SUBTOTAL = 350;       // $350 base
  const TON_CAP_LBS = 4000;        // 2 tons included
  const OVERAGE_RATE_CENTS = 3;    // $0.03/lb over the cap
  const TAX_RATE = 0.08;
  const overageCents = Math.max(0, weighInLbs - TON_CAP_LBS) * OVERAGE_RATE_CENTS;
  const subtotal = parseFloat((BASE_SUBTOTAL + overageCents / 100).toFixed(2));
  const taxAmount = parseFloat((subtotal * TAX_RATE).toFixed(2));
  const total = parseFloat((subtotal + taxAmount).toFixed(2));
  const amountCents = Math.round(total * 100);
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  const srRef = db.collection("serviceRequests").doc(serviceRequestId);

  try {
    const out = await db.runTransaction(async (txn) => {
      const srSnap = await txn.get(srRef);
      if (!srSnap.exists) { const e = new Error("NOT_FOUND"); e.code = "NOT_FOUND"; throw e; }
      const sr = srSnap.data();
      if (sr.status !== "scheduled") {
        const e = new Error("NOT_SCHEDULED"); e.code = "NOT_SCHEDULED"; e.current = sr.status; throw e;
      }
      const contractorId = sr.contractorId;
      if (!contractorId) { const e = new Error("NO_CONTRACTOR"); e.code = "NO_CONTRACTOR"; throw e; }

      // 1) complete the service request (nested-field updates preserve the rest)
      txn.update(srRef, {
        status: "completed",
        weighInLbs,
        completedAt: admin.firestore.FieldValue.serverTimestamp(),
        "payment.overageCents": overageCents,
        "payment.subtotal": subtotal,
        "payment.taxRate": TAX_RATE,
        "payment.taxAmount": taxAmount,
        "payment.total": total,
        "payment.amountCents": amountCents,
      });
      // 2) flip the dumpster back on-site (same atomic transaction)
      txn.update(db.collection("contractors").doc(contractorId), {
        "dumpster.lastEmptied": today,
        "dumpster.status": "on_site",
      });

      return { contractorId };
    });

    return res.status(200).json({
      status: "success",
      service_request_id: serviceRequestId,
      contractor_id: out.contractorId,
      weigh_in_lbs: weighInLbs,
      overage_cents: overageCents,
      subtotal,
      tax_amount: taxAmount,
      total,
      last_emptied: today,
    });
  } catch (err) {
    if (err.code === "NOT_FOUND") return res.status(404).json({ status: "error", message: "Service request not found." });
    if (err.code === "NOT_SCHEDULED") return res.status(409).json({ status: "error", message: `This request is already "${err.current || "not scheduled"}" — a weigh-in can only be recorded once.` });
    if (err.code === "NO_CONTRACTOR") return res.status(422).json({ status: "error", message: "Service request has no contractor." });
    console.error("recordWeighIn failed:", err.message);
    return res.status(500).json({ status: "error", message: "Could not record weigh-in. Please try again." });
  }
});

// ─────────────────────────────────────────────
// Statement helpers (America/New_York date basis — Dublin, OH is US Eastern)
// ─────────────────────────────────────────────
function f3EasternYMD(d) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}
function f3DaysBetween(aYMD, bYMD) { // whole days (b - a)
  const [ay, am, ad] = aYMD.split("-").map(Number);
  const [by, bm, bd] = bYMD.split("-").map(Number);
  return Math.round((Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / 86400000);
}
function f3StatementDates(period) { // period "YYYY-MM" → issue = 1st of next month, due = issue + 5d
  const [y, m] = period.split("-").map(Number);
  const ny = m === 12 ? y + 1 : y;
  const nm = m === 12 ? 1 : m + 1;
  const issueDate = `${ny}-${String(nm).padStart(2, "0")}-01`;
  const due = new Date(Date.UTC(ny, nm - 1, 1) + 5 * 86400000);
  const dueDate = `${due.getUTCFullYear()}-${String(due.getUTCMonth() + 1).padStart(2, "0")}-${String(due.getUTCDate()).padStart(2, "0")}`;
  return { issueDate, dueDate };
}
function f3CompletionPeriod(completedAt) {
  const d = completedAt && typeof completedAt.toDate === "function" ? completedAt.toDate() : new Date(completedAt);
  return f3EasternYMD(d).slice(0, 7);
}

// ─────────────────────────────────────────────
// FUNCTION 7 — settleStatement (admin only)
// Atomically settles one contractor-month: validates each member dump, computes
// charges/tax/late-fee SERVER-SIDE, writes the immutable statements/{cid_period}
// doc (frozen numbers), and flips each member billingStatus unbilled→billed — all
// in ONE transaction (all-or-none). Refuses re-settling an already-settled month.
// Touches ONLY serviceRequests + statements. Never bookings. APPENDED.
// ─────────────────────────────────────────────
exports.settleStatement = functions.https.onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") {
    res.set("Access-Control-Allow-Methods", "POST");
    res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    return res.status(204).send("");
  }
  if (req.method !== "POST") return res.status(405).json({ status: "error", message: "Method not allowed" });

  const authHeader = req.headers.authorization || "";
  if (!authHeader.startsWith("Bearer ")) return res.status(401).json({ status: "error", message: "Unauthorized" });
  try {
    const decoded = await admin.auth().verifyIdToken(authHeader.slice(7));
    if (decoded.uid !== ADMIN_UID) return res.status(403).json({ status: "error", message: "Forbidden — admin only." });
  } catch (e) {
    return res.status(401).json({ status: "error", message: "Invalid auth token" });
  }

  const data = req.body || {};
  const contractorId = String(data.contractorId || "").trim();
  const period = String(data.period || "").trim();
  const applyLateFee = data.applyLateFee === true;
  const ids = Array.isArray(data.serviceRequestIds) ? data.serviceRequestIds.map(String) : [];
  if (!contractorId) return res.status(400).json({ status: "error", message: "Missing contractorId" });
  if (!/^\d{4}-\d{2}$/.test(period)) return res.status(400).json({ status: "error", message: "Invalid period (expected YYYY-MM)" });
  if (!ids.length) return res.status(400).json({ status: "error", message: "No serviceRequestIds provided" });

  const { issueDate, dueDate } = f3StatementDates(period);
  const todayYMD = f3EasternYMD(new Date());                 // server's Eastern "today"
  const lateDays = Math.max(0, f3DaysBetween(dueDate, todayYMD));
  const lateFeeCents = applyLateFee ? lateDays * 1000 : 0;   // $10/day, simple
  const statementId = `${contractorId}_${period}`;
  const stmtRef = db.collection("statements").doc(statementId);

  const codeErr = (code, id) => { const e = new Error(code); e.code = code; if (id) e.id = id; return e; };

  try {
    const out = await db.runTransaction(async (txn) => {
      // All reads first.
      const existing = await txn.get(stmtRef);
      if (existing.exists) throw codeErr("ALREADY_SETTLED");

      let subtotalCents = 0, taxCents = 0;
      const refs = [];
      for (const id of ids) {
        const ref = db.collection("serviceRequests").doc(id);
        const snap = await txn.get(ref);
        if (!snap.exists) throw codeErr("MEMBER_INVALID", id);
        const sr = snap.data();
        if (sr.contractorId !== contractorId) throw codeErr("MEMBER_INVALID", id);
        if (sr.billingMode !== "monthly") throw codeErr("MEMBER_INVALID", id);
        if (sr.status !== "completed") throw codeErr("MEMBER_INVALID", id);
        if (sr.billingStatus !== "unbilled") throw codeErr("MEMBER_INVALID", id);
        if (!sr.completedAt || f3CompletionPeriod(sr.completedAt) !== period) throw codeErr("MEMBER_INVALID", id);
        subtotalCents += Math.round((sr.payment && sr.payment.subtotal || 0) * 100);
        taxCents += Math.round((sr.payment && sr.payment.taxAmount || 0) * 100);
        refs.push(ref);
      }
      const dumpsCount = refs.length;
      const chargesCents = subtotalCents + taxCents;
      const totalCents = chargesCents + lateFeeCents;

      // Then all writes (atomic).
      txn.set(stmtRef, {
        contractorId, period, issueDate, dueDate,
        serviceRequestIds: ids, dumpsCount,
        subtotalCents, taxCents, chargesCents,
        lateFeeApplied: applyLateFee && lateFeeCents > 0,
        lateDaysAtSettle: lateDays, lateFeeCents, totalCents,
        settledAt: admin.firestore.FieldValue.serverTimestamp(),
        settledBy: ADMIN_UID,
      });
      for (const ref of refs) {
        txn.update(ref, { billingStatus: "billed", statementId, billedAt: admin.firestore.FieldValue.serverTimestamp() });
      }
      return { dumpsCount, subtotalCents, taxCents, chargesCents, lateFeeCents, totalCents };
    });

    return res.status(200).json({
      status: "success", statement_id: statementId, period, issue_date: issueDate, due_date: dueDate,
      late_days: lateDays, late_fee_applied: applyLateFee && lateFeeCents > 0, ...out,
    });
  } catch (err) {
    if (err.code === "ALREADY_SETTLED") return res.status(409).json({ status: "error", message: `${period} is already settled for this contractor.` });
    if (err.code === "MEMBER_INVALID") return res.status(422).json({ status: "error", message: `A dump in this statement is no longer eligible (id ${err.id}). Refresh and try again.` });
    console.error("settleStatement failed:", err.message);
    return res.status(500).json({ status: "error", message: "Could not settle the statement. Please try again." });
  }
});

// ─────────────────────────────────────────────
// FUNCTION 8 — getStatements (admin only, read)
// Reads the statements collection so the admin UI can render settled (frozen)
// statements without a firestore.rules change. Never touches bookings. APPENDED.
// ─────────────────────────────────────────────
exports.getStatements = functions.https.onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") {
    res.set("Access-Control-Allow-Methods", "GET, POST");
    res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    return res.status(204).send("");
  }
  if (req.method !== "GET" && req.method !== "POST") return res.status(405).json({ status: "error", message: "Method not allowed" });

  const authHeader = req.headers.authorization || "";
  if (!authHeader.startsWith("Bearer ")) return res.status(401).json({ status: "error", message: "Unauthorized" });
  try {
    const decoded = await admin.auth().verifyIdToken(authHeader.slice(7));
    if (decoded.uid !== ADMIN_UID) return res.status(403).json({ status: "error", message: "Forbidden — admin only." });
  } catch (e) {
    return res.status(401).json({ status: "error", message: "Invalid auth token" });
  }

  try {
    const contractorId = (req.query && req.query.contractorId) || (req.body && req.body.contractorId) || null;
    let q = db.collection("statements");
    if (contractorId) q = q.where("contractorId", "==", String(contractorId));
    const snap = await q.get();
    const statements = snap.docs.map((d) => {
      const s = d.data();
      return { id: d.id, ...s, settledAt: s.settledAt && s.settledAt.toDate ? s.settledAt.toDate().toISOString() : null };
    });
    return res.status(200).json({ status: "success", statements });
  } catch (err) {
    console.error("getStatements failed:", err.message);
    return res.status(500).json({ status: "error", message: "Could not load statements." });
  }
});
