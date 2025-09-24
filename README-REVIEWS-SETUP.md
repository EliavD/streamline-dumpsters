# Google Reviews Integration Setup

This document explains how to set up the Google Business Reviews section for the Streamline Dumpsters website.

## Overview

The reviews system consists of:
- **Frontend**: HTML/CSS/JavaScript carousel displaying reviews
- **Backend**: Secure API proxy to fetch Google Places reviews
- **Caching**: Local storage and server-side caching for performance
- **Fallback**: Static reviews if API fails

## Environment Variables

Ensure these variables are set in your `.env` file:

```env
GOOGLE_PLACES_API_KEY=AIzaSyAZtAgmy8J7jsNJ6KevUJf88tH9DVybHCs
GOOGLE_PLACE_ID=ChIJkyC9UZaddGARr7nDEx3FM8I
```

**Note**: The current `.env` file has a typo in the variable name (`google_place_ID` instead of `GOOGLE_PLACE_ID`). The backend handles both formats.

## Quick Setup (Development)

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start the development server**:
   ```bash
   npm run dev
   ```

3. **Visit the website**:
   ```
   http://localhost:3000
   ```

## Production Deployment Options

### Option 1: Express.js Server
Deploy the entire application including `server.js` to platforms like:
- Railway
- Render
- Heroku
- DigitalOcean App Platform

### Option 2: Serverless Functions
Deploy just the API proxy (`api/reviews.js`) to:

#### Vercel
1. Deploy your static files to Vercel
2. The `api/reviews.js` will automatically become a serverless function
3. Access at: `https://yoursite.vercel.app/api/reviews`

#### Netlify
1. Deploy static files to Netlify
2. Move `api/reviews.js` to `netlify/functions/reviews.js`
3. Use the `netlifyHandler` export
4. Access at: `https://yoursite.netlify.app/.netlify/functions/reviews`

#### AWS Lambda
1. Use the `lambdaHandler` export
2. Deploy via AWS SAM, Serverless Framework, or CDK
3. Configure API Gateway to trigger the function

## API Endpoint

### GET /api/reviews

**Response Format**:
```json
{
  "reviews": [
    {
      "author_name": "Customer Name",
      "rating": 5,
      "text": "Great service! Highly recommend...",
      "time": 1703123456789,
      "relative_time_description": "2 days ago"
    }
  ],
  "cached": false,
  "timestamp": 1703123456789
}
```

**Features**:
- Filters reviews with rating >= 4
- Only includes reviews with text content
- Sorts by most recent first
- Limits to 10 reviews maximum
- Caches results for 24 hours

## Frontend Features

### Reviews Carousel
- **Auto-scroll**: Changes every 8 seconds
- **Manual navigation**: Left/right arrow buttons
- **Keyboard support**: Arrow keys when focused
- **Responsive**: 1 review on mobile, 2 on tablet, 3 on desktop
- **Pause on hover**: Stops auto-scroll when user hovers
- **Touch support**: Mobile-friendly interactions

### Caching
- **Client-side**: LocalStorage cache for 24 hours
- **Server-side**: In-memory cache (use Redis in production)
- **Fallback**: Static reviews if API fails

### Accessibility
- **ARIA labels**: Proper labeling for screen readers
- **Keyboard navigation**: Full keyboard support
- **Focus management**: Visible focus indicators
- **Loading states**: Clear loading and error states

## Troubleshooting

### API Key Issues
1. Verify `GOOGLE_PLACES_API_KEY` is correct
2. Ensure the API key has Google Places API enabled
3. Check billing is set up in Google Cloud Console

### Place ID Issues
1. Verify `GOOGLE_PLACE_ID` matches your business
2. Use Google's Place ID Finder to get the correct ID
3. Ensure the place has reviews available

### CORS Issues
1. Update `server.js` CORS origins for your domain
2. For serverless, configure CORS in your platform settings

### Reviews Not Loading
1. Check browser console for errors
2. Test the API endpoint directly: `/api/reviews`
3. Verify fallback reviews are displaying

## Security Notes

✅ **API keys are server-side only** - Never exposed to frontend
✅ **Rate limiting** - Prevents API abuse
✅ **Input validation** - Sanitizes all review content
✅ **CORS protection** - Restricts cross-origin requests
✅ **Caching** - Reduces API calls and costs

## Cost Optimization

- **Caching**: 24-hour cache reduces API calls
- **Rate limiting**: Prevents excessive usage
- **Filtered results**: Only fetches necessary data
- **Error handling**: Graceful fallbacks prevent failed requests

## Testing

### Local Testing
```bash
# Start development server
npm run dev

# Test API endpoint
curl http://localhost:3000/api/reviews
```

### Production Testing
```bash
# Test health check
curl https://yoursite.com/api/health

# Test reviews
curl https://yoursite.com/api/reviews
```

## Monitoring

Monitor these metrics in production:
- API response times
- Cache hit rates
- Error rates
- Google Places API quota usage
- Review freshness (last update time)

## Support

For issues with this integration:
1. Check the browser console for JavaScript errors
2. Verify environment variables are set correctly
3. Test the API endpoint directly
4. Check Google Cloud Console for API quota/billing issues