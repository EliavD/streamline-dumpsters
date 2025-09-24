/*
================================================================================
STREAMLINE DUMPSTERS API SERVER
================================================================================

PURPOSE:
Express.js server for handling API requests, including Google Places reviews
proxy and other backend functionality.

SETUP:
1. Install dependencies: npm install
2. Set environment variables in .env file
3. Run: npm start (production) or npm run dev (development)

ENDPOINTS:
- GET /api/reviews - Fetch Google Business reviews
- Static file serving for the frontend

SECURITY:
- CORS protection
- Rate limiting
- Environment variable protection
- Input validation
================================================================================
*/

const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

// Import API handlers
const { expressHandler: reviewsHandler } = require('./api/reviews');

const app = express();
const port = process.env.PORT || 3000;

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

// Middleware
app.use(limiter);
app.use(cors({
    origin: process.env.NODE_ENV === 'production'
        ? ['https://yourdomain.com', 'https://www.yourdomain.com'] // Replace with your domain
        : ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5500'] // Development origins
}));
app.use(express.json());
app.use(express.static('.', {
    index: 'index.html'
}));

// API Routes
app.get('/api/reviews', reviewsHandler);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Serve frontend files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Catch-all handler for SPA routing
app.get('*', (req, res) => {
    // If the request is for an API route that doesn't exist
    if (req.path.startsWith('/api/')) {
        res.status(404).json({ error: 'API endpoint not found' });
        return;
    }

    // Otherwise serve the main HTML file
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
});

// Start server
app.listen(port, () => {
    console.log(`🚀 Streamline Dumpsters API Server running on port ${port}`);
    console.log(`📍 Local: http://localhost:${port}`);
    console.log(`🔍 Health check: http://localhost:${port}/api/health`);
    console.log(`⭐ Reviews API: http://localhost:${port}/api/reviews`);

    // Verify environment variables
    if (!process.env.GOOGLE_PLACES_API_KEY) {
        console.warn('⚠️  WARNING: GOOGLE_PLACES_API_KEY not found in environment variables');
    }
    if (!process.env.GOOGLE_PLACE_ID && !process.env.google_place_ID) {
        console.warn('⚠️  WARNING: GOOGLE_PLACE_ID not found in environment variables');
    }

    console.log('✅ Server started successfully');
});

module.exports = app;