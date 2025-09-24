# Backend Integration Guide
## Streamline Dumpsters Ltd. - Server-Side Implementation Requirements

### Overview
This document outlines the backend API requirements and endpoints needed to support the Streamline Dumpsters Ltd. website functionality. The frontend is designed to work with RESTful APIs following the specifications below.

---

## API Endpoints Specification

### 1. Booking Management

#### Create Booking
```http
POST /api/bookings
Content-Type: application/json
X-CSRF-Token: {token}

{
  "serviceType": "dumpster" | "junkRemoval",
  "customer": {
    "name": "string",
    "email": "string",
    "phone": "string",
    "address": "string",
    "zipcode": "string"
  },
  "service": {
    "deliveryDate": "ISO date string",
    "notes": "string (optional)"
  },
  "payment": {
    "squareNonce": "string",
    "amount": number
  }
}
```

**Response (Success):**
```json
{
  "status": "success",
  "data": {
    "bookingId": "string",
    "confirmationNumber": "string",
    "status": "confirmed",
    "estimatedDelivery": "ISO date string"
  },
  "message": "Booking confirmed successfully"
}
```

#### Get Booking Details
```http
GET /api/bookings/{bookingId}
```

#### Update Booking
```http
PUT /api/bookings/{bookingId}
Content-Type: application/json
```

#### Cancel Booking
```http
POST /api/bookings/{bookingId}/cancel
```

---

### 2. Junk Removal Quotes

#### Submit Quote Request
```http
POST /api/junk-removal/quote
Content-Type: application/json

{
  "customer": {
    "name": "string",
    "email": "string",
    "phone": "string",
    "address": "string"
  },
  "items": [
    {
      "type": "string",
      "description": "string",
      "quantity": number,
      "imageUrl": "string (optional)"
    }
  ],
  "preferredDate": "ISO date string",
  "notes": "string (optional)"
}
```

#### Upload Photos for Quote
```http
POST /api/junk-removal/upload
Content-Type: multipart/form-data

files: File[]
quoteId: string (optional)
```

---

### 3. Contact & Communication

#### Submit Contact Form
```http
POST /api/contact
Content-Type: application/json

{
  "name": "string",
  "email": "string",
  "phone": "string (optional)",
  "subject": "string",
  "message": "string",
  "serviceType": "general" | "booking" | "support"
}
```

#### Newsletter Subscription
```http
POST /api/newsletter/subscribe
Content-Type: application/json

{
  "email": "string",
  "name": "string (optional)"
}
```

---

### 4. Availability & Scheduling

#### Check Service Availability
```http
GET /api/availability/check?date=YYYY-MM-DD&zipcode=12345&serviceType=dumpster
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "available": true,
    "sameDayDelivery": false,
    "nextAvailable": "YYYY-MM-DD",
    "timeSlots": [
      {
        "start": "09:00",
        "end": "12:00",
        "available": true
      }
    ]
  }
}
```

#### Get Available Time Slots
```http
GET /api/availability/slots?date=YYYY-MM-DD&zipcode=12345
```

---

### 5. Payment Processing

#### Process Payment
```http
POST /api/payments/process
Content-Type: application/json

{
  "nonce": "string", // Square payment nonce
  "amount": number, // Amount in cents
  "currency": "USD",
  "bookingId": "string",
  "customer": {
    "email": "string",
    "name": "string"
  }
}
```

#### Verify Payment
```http
GET /api/payments/verify/{paymentId}
```

---

## Database Schema Requirements

### Bookings Table
```sql
CREATE TABLE bookings (
  id UUID PRIMARY KEY,
  confirmation_number VARCHAR(20) UNIQUE,
  service_type ENUM('dumpster', 'junk_removal'),
  status ENUM('pending', 'confirmed', 'in_progress', 'completed', 'cancelled'),
  customer_name VARCHAR(255),
  customer_email VARCHAR(255),
  customer_phone VARCHAR(20),
  delivery_address TEXT,
  delivery_zipcode VARCHAR(10),
  delivery_date DATE,
  delivery_time_slot VARCHAR(20),
  notes TEXT,
  amount_cents INTEGER,
  payment_status ENUM('pending', 'paid', 'refunded'),
  square_payment_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Junk Removal Quotes Table
```sql
CREATE TABLE junk_removal_quotes (
  id UUID PRIMARY KEY,
  customer_name VARCHAR(255),
  customer_email VARCHAR(255),
  customer_phone VARCHAR(20),
  customer_address TEXT,
  preferred_date DATE,
  items JSON,
  photos JSON,
  estimated_amount_cents INTEGER,
  status ENUM('pending', 'quoted', 'accepted', 'completed'),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Contact Messages Table
```sql
CREATE TABLE contact_messages (
  id UUID PRIMARY KEY,
  name VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(20),
  subject VARCHAR(255),
  message TEXT,
  service_type VARCHAR(50),
  status ENUM('new', 'read', 'responded'),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## Third-Party Integrations

### 1. Square Payment Processing
```javascript
// Server-side Square integration
const { Client, Environment } = require('squareup');

const client = new Client({
  accessToken: process.env.SQUARE_ACCESS_TOKEN,
  environment: process.env.NODE_ENV === 'production'
    ? Environment.Production
    : Environment.Sandbox
});

// Process payment
async function processPayment(nonce, amount, orderId) {
  try {
    const response = await client.paymentsApi.createPayment({
      sourceId: nonce,
      amountMoney: {
        amount: amount, // Amount in cents
        currency: 'USD'
      },
      idempotencyKey: orderId,
      referenceId: orderId
    });

    return response.result.payment;
  } catch (error) {
    throw new Error(`Payment failed: ${error.message}`);
  }
}
```

### 2. Airtable Database Integration
```javascript
// Server-side Airtable integration
const Airtable = require('airtable');

const base = new Airtable({
  apiKey: process.env.AIRTABLE_API_KEY
}).base(process.env.AIRTABLE_BASE_ID);

// Create booking record
async function createBookingRecord(bookingData) {
  try {
    const record = await base('Bookings').create([
      {
        fields: {
          'Confirmation Number': bookingData.confirmationNumber,
          'Customer Name': bookingData.customerName,
          'Customer Email': bookingData.customerEmail,
          'Service Type': bookingData.serviceType,
          'Delivery Date': bookingData.deliveryDate,
          'Status': bookingData.status
        }
      }
    ]);

    return record[0].id;
  } catch (error) {
    throw new Error(`Failed to create Airtable record: ${error.message}`);
  }
}
```

### 3. Cloudinary Image Upload
```javascript
// Server-side Cloudinary integration
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Upload image with optimization
async function uploadImage(file, options = {}) {
  try {
    const result = await cloudinary.uploader.upload(file.path, {
      folder: 'junk-removal-photos',
      transformation: [
        { width: 1200, height: 800, crop: 'limit' },
        { quality: 'auto:good' },
        { format: 'auto' }
      ],
      ...options
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height
    };
  } catch (error) {
    throw new Error(`Image upload failed: ${error.message}`);
  }
}
```

---

## Security Implementation

### 1. CSRF Protection
```javascript
// Express.js CSRF middleware
const csrf = require('csurf');
const csrfProtection = csrf({ cookie: true });

app.use(csrfProtection);

// Provide token to frontend
app.get('/api/csrf-token', (req, res) => {
  res.json({ token: req.csrfToken() });
});
```

### 2. Rate Limiting
```javascript
const rateLimit = require('express-rate-limit');

// API rate limiting
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
  message: 'Too many requests, please try again later'
});

// Stricter rate limiting for sensitive endpoints
const strictLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 10,
  message: 'Too many requests for this endpoint'
});

app.use('/api/', apiLimiter);
app.use('/api/payments/', strictLimiter);
app.use('/api/bookings/', strictLimiter);
```

### 3. Input Validation & Sanitization
```javascript
const { body, validationResult } = require('express-validator');
const DOMPurify = require('isomorphic-dompurify');

// Validation middleware
const validateBooking = [
  body('customer.email').isEmail().normalizeEmail(),
  body('customer.phone').isMobilePhone(),
  body('customer.name').isLength({ min: 2, max: 100 }).trim(),
  body('customer.address').isLength({ min: 10, max: 200 }).trim(),
  body('service.deliveryDate').isISO8601(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        error: 'VALIDATION_ERROR',
        message: 'Invalid input data',
        details: errors.array()
      });
    }

    // Sanitize text inputs
    req.body.customer.name = DOMPurify.sanitize(req.body.customer.name);
    req.body.customer.address = DOMPurify.sanitize(req.body.customer.address);

    next();
  }
];
```

---

## Environment Variables Required

```bash
# Database
DATABASE_URL=postgresql://username:password@host:port/database

# Square Payment
SQUARE_ACCESS_TOKEN=your_square_access_token
SQUARE_APPLICATION_ID=your_square_app_id
SQUARE_LOCATION_ID=your_square_location_id

# Airtable
AIRTABLE_API_KEY=your_airtable_api_key
AIRTABLE_BASE_ID=your_airtable_base_id

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email (SendGrid/Mailgun/etc.)
EMAIL_API_KEY=your_email_service_api_key
EMAIL_FROM_ADDRESS=noreply@streamlinedumpsters.com

# Security
JWT_SECRET=your_jwt_secret_key
CSRF_SECRET=your_csrf_secret_key

# Application
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://streamlinedumpsters.com
```

---

## Error Response Format

All API endpoints should return errors in this standardized format:

```json
{
  "status": "error",
  "error": "ERROR_CODE",
  "message": "User-friendly error message",
  "details": {
    "field": "specific field error",
    "code": "SPECIFIC_ERROR_CODE"
  },
  "timestamp": "2024-01-01T12:00:00Z"
}
```

### Common Error Codes
- `VALIDATION_ERROR` - Input validation failed
- `PAYMENT_FAILED` - Payment processing failed
- `BOOKING_UNAVAILABLE` - Requested time slot not available
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `SERVER_ERROR` - Internal server error
- `NOT_FOUND` - Resource not found
- `UNAUTHORIZED` - Authentication required
- `FORBIDDEN` - Permission denied

---

## Testing Requirements

### 1. Unit Tests
- All validation functions
- Payment processing logic
- Database operations
- Third-party service integrations

### 2. Integration Tests
- Complete booking flow
- Payment processing
- Email notifications
- File uploads

### 3. Security Tests
- SQL injection prevention
- XSS prevention
- CSRF protection
- Rate limiting effectiveness

---

This backend integration guide provides the complete specification for implementing the server-side functionality required by the Streamline Dumpsters Ltd. website. All endpoints, security measures, and third-party integrations are designed to work seamlessly with the existing frontend code.