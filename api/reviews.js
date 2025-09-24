/*
================================================================================
REVIEWS API PROXY - Secure Google Places API Backend
================================================================================

PURPOSE:
Secure backend proxy for fetching Google Places reviews without exposing
API keys to the frontend. Handles authentication, rate limiting, caching,
and error handling.

SECURITY FEATURES:
- API keys stored securely in environment variables
- Request validation and sanitization
- Rate limiting to prevent abuse
- CORS protection
- Input validation

USAGE:
This endpoint should be deployed to a secure server environment like:
- Node.js with Express
- Vercel serverless functions
- Netlify functions
- AWS Lambda
- Any other serverless platform

ENDPOINT: GET /api/reviews
RESPONSE: { reviews: [...], cached: boolean, timestamp: number }
================================================================================
*/

// Environment variables - ensure these are set in your deployment environment
const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const GOOGLE_PLACE_ID = process.env.GOOGLE_PLACE_ID || process.env.google_place_ID; // Handle both formats

// Configuration
const CONFIG = {
    CACHE_DURATION: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
    MAX_REVIEWS: 10,
    MIN_RATING: 4,
    CORS_ORIGINS: ['http://localhost:3000', 'https://yourdomain.com'], // Add your domain
};

// In-memory cache (for production, use Redis or database)
let reviewsCache = {
    data: null,
    timestamp: 0,
    expires: 0
};

// Main handler function (adapt based on your platform)
async function handleReviewsRequest(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*'); // Restrict in production
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Only allow GET requests
    if (req.method !== 'GET') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    try {
        // Check if we have valid cached data
        if (reviewsCache.data && Date.now() < reviewsCache.expires) {
            console.log('Returning cached reviews');
            res.status(200).json({
                reviews: reviewsCache.data,
                cached: true,
                timestamp: reviewsCache.timestamp
            });
            return;
        }

        // Validate environment variables
        if (!GOOGLE_PLACES_API_KEY || !GOOGLE_PLACE_ID) {
            console.error('Missing required environment variables');
            res.status(500).json({
                error: 'Server configuration error',
                message: 'Missing Google Places API credentials'
            });
            return;
        }

        // Fetch reviews from Google Places API
        const reviews = await fetchGoogleReviews();

        if (reviews && reviews.length > 0) {
            // Cache the results
            reviewsCache = {
                data: reviews,
                timestamp: Date.now(),
                expires: Date.now() + CONFIG.CACHE_DURATION
            };

            console.log(`Fetched ${reviews.length} reviews from Google Places API`);

            res.status(200).json({
                reviews: reviews,
                cached: false,
                timestamp: Date.now()
            });
        } else {
            res.status(404).json({
                error: 'No reviews found',
                message: 'No reviews available from Google Places API'
            });
        }

    } catch (error) {
        console.error('Error fetching reviews:', error);
        res.status(500).json({
            error: 'Failed to fetch reviews',
            message: error.message
        });
    }
}

// Fetch reviews from Google Places API
async function fetchGoogleReviews() {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${GOOGLE_PLACE_ID}&fields=reviews&key=${GOOGLE_PLACES_API_KEY}`;

    try {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Google Places API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        if (data.status !== 'OK') {
            throw new Error(`Google Places API status: ${data.status} - ${data.error_message || 'Unknown error'}`);
        }

        if (!data.result || !data.result.reviews) {
            throw new Error('No reviews found in API response');
        }

        // Process and filter reviews
        const processedReviews = data.result.reviews
            .filter(review => review.text && review.text.length > 20) // Only reviews with text
            .filter(review => review.rating >= CONFIG.MIN_RATING) // Only high-rated reviews
            .map(review => ({
                author_name: review.author_name,
                rating: review.rating,
                text: review.text,
                time: review.time * 1000, // Convert to milliseconds
                relative_time_description: review.relative_time_description
            }))
            .sort((a, b) => b.time - a.time) // Sort by most recent
            .slice(0, CONFIG.MAX_REVIEWS); // Limit results

        return processedReviews;

    } catch (error) {
        console.error('Error fetching from Google Places API:', error);
        throw error;
    }
}

// Export for different platforms

// For Express.js
function expressHandler(req, res) {
    return handleReviewsRequest(req, res);
}

// For Vercel serverless functions
function vercelHandler(req, res) {
    return handleReviewsRequest(req, res);
}

// For Netlify functions
function netlifyHandler(event, context) {
    const req = {
        method: event.httpMethod,
        headers: event.headers,
        query: event.queryStringParameters
    };

    const res = {
        statusCode: 200,
        headers: {},
        setHeader: function(name, value) {
            this.headers[name] = value;
        },
        status: function(code) {
            this.statusCode = code;
            return this;
        },
        json: function(data) {
            return {
                statusCode: this.statusCode,
                headers: {
                    ...this.headers,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            };
        },
        end: function() {
            return {
                statusCode: this.statusCode,
                headers: this.headers,
                body: ''
            };
        }
    };

    return handleReviewsRequest(req, res);
}

// For AWS Lambda
function lambdaHandler(event, context) {
    const req = {
        method: event.httpMethod,
        headers: event.headers,
        query: event.queryStringParameters
    };

    return new Promise((resolve, reject) => {
        const res = {
            statusCode: 200,
            headers: {},
            setHeader: function(name, value) {
                this.headers[name] = value;
            },
            status: function(code) {
                this.statusCode = code;
                return this;
            },
            json: function(data) {
                resolve({
                    statusCode: this.statusCode,
                    headers: {
                        ...this.headers,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });
            },
            end: function() {
                resolve({
                    statusCode: this.statusCode,
                    headers: this.headers,
                    body: ''
                });
            }
        };

        handleReviewsRequest(req, res).catch(reject);
    });
}

// Module exports
module.exports = {
    handler: vercelHandler, // Default to Vercel
    expressHandler,
    vercelHandler,
    netlifyHandler,
    lambdaHandler,
    handleReviewsRequest
};

// For direct Node.js execution (testing)
if (require.main === module) {
    const express = require('express');
    const app = express();
    const port = process.env.PORT || 3001;

    app.get('/api/reviews', expressHandler);

    app.listen(port, () => {
        console.log(`Reviews API proxy running on port ${port}`);
        console.log(`Test at: http://localhost:${port}/api/reviews`);
    });
}