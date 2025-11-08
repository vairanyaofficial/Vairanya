# Production Deployment Guide

## Build Status
✅ Build completed successfully!

## Pre-Deployment Checklist

### 1. Environment Variables
Make sure you have all required environment variables set. See `.env.example` for reference.

**Required Variables:**
- `FIREBASE_SERVICE_ACCOUNT_JSON` or `GOOGLE_APPLICATION_CREDENTIALS`
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

**Recommended Variables:**
- `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` (for payments)
- `NEXTAUTH_SECRET` (for authentication)
- `NEXTAUTH_URL` (your production URL)

### 2. Validate Environment Variables
```bash
npm run validate-env
```
This will check if all required environment variables are set correctly.

### 3. Build Command
```bash
npm run build
```
The build process will automatically validate environment variables after completion.

### 4. Start Production Server
```bash
npm start
```

## Deployment Options

### Option 1: Vercel (Recommended)
1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. **Important**: Do NOT set `NODE_ENV` manually in Vercel environment variables. Vercel automatically manages this variable.
   - If you see a warning: "NODE_ENV was incorrectly set to 'development', this value is being overridden to 'production'"
   - **Solution**: Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Remove `NODE_ENV` if it exists (Vercel will automatically set it to "production" during builds)
   - This warning is harmless but can be avoided by removing the manual setting
5. Deploy automatically

### Option 2: Self-Hosted (Node.js Server)
1. Run `npm run build`
2. Run `npm start`
3. Use PM2 or similar for process management:
   ```bash
   pm2 start npm --name "vairanya" -- start
   ```

### Option 3: Docker
Create a `Dockerfile`:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## Production Features

### Security
- ✅ Security headers (CSP, XSS protection, HSTS, etc.)
- ✅ Rate limiting on critical endpoints
- ✅ Error boundaries for graceful error handling
- ✅ Input validation on all API routes
- ✅ Secure environment variable handling

### Performance
- ✅ Image optimization (AVIF, WebP formats)
- ✅ Compression enabled
- ✅ React Strict Mode
- ✅ Optimized builds

### Monitoring
- ✅ Health check endpoint: `/api/health`
- ✅ Production-safe logging (errors/warnings only in production)
- ✅ Error tracking ready (integrate with Sentry/LogRocket)

### Error Handling
- ✅ Global error boundary
- ✅ Error page (`app/error.tsx`)
- ✅ 404 page (`app/not-found.tsx`)
- ✅ Graceful error messages

## Important Notes

1. **Cart Persistence**: Cart is stored in localStorage, so it persists across page refreshes
2. **API Routes**: All API routes are server-rendered (dynamic)
3. **Static Pages**: Most pages are static for better performance
4. **Image Optimization**: Configured for external domains (Firebase, ImgBB, etc.)
5. **Rate Limiting**: Admin login and order creation are rate-limited
6. **Health Check**: Monitor `/api/health` for service status
7. **NODE_ENV Warning**: If you see "NODE_ENV was incorrectly set to 'development'" warning in Vercel:
   - This happens if `NODE_ENV` is manually set in Vercel environment variables
   - **Fix**: Remove `NODE_ENV` from Vercel environment variables (Vercel automatically manages it)
   - The warning is harmless - Vercel correctly overrides it to "production", but removing the manual setting will eliminate the warning

## Build Output
- Total Routes: 75+
- Static Pages: Most pages
- Dynamic Routes: API routes and dynamic pages
- Build Size: Optimized for production

## Health Check

The application includes a health check endpoint at `/api/health`:
```bash
curl https://your-domain.com/api/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 12345,
  "services": {
    "database": "ok",
    "responseTime": 50
  }
}
```

## Debug Endpoints

### Products Debug Endpoint
If products are not loading in production, use the debug endpoint:
```bash
curl https://your-domain.com/api/products/debug
```

This endpoint provides:
- Firestore initialization status
- Environment variable checks
- Sample product data
- Detailed error information

### Troubleshooting Products Not Loading

If products are not loading in production:

1. **Check Vercel Logs**: Look for Firestore initialization errors
2. **Verify Environment Variables**: 
   - Ensure `FIREBASE_SERVICE_ACCOUNT_JSON` is set in Vercel
   - Verify the JSON is properly escaped (entire JSON on one line)
   - Check that the service account has proper permissions
3. **Use Debug Endpoint**: Visit `/api/products/debug` to see detailed diagnostics
4. **Check Health Endpoint**: Visit `/api/health` to verify Firestore connectivity
5. **Common Issues**:
   - Missing `FIREBASE_SERVICE_ACCOUNT_JSON` in Vercel environment variables
   - Malformed JSON (not properly escaped)
   - Service account doesn't have Firestore permissions
   - Firestore collection name mismatch (should be "products")

## Next Steps
1. ✅ Set up environment variables in production
2. ✅ Configure domain and SSL
3. ⚠️ Set up monitoring and logging (integrate error tracking service)
4. ✅ Test all functionality in production environment
5. ⚠️ Set up automated backups for database
6. ⚠️ Configure CDN for static assets (if needed)
7. ⚠️ Set up analytics (Google Analytics, etc.)
