# Production OAuth Setup Guide

## Issue
Google OAuth callback is redirecting to `localhost:3000` in production instead of your production domain.

## Solution

### 1. Set Environment Variables

In your production environment (Vercel, Railway, etc.), set these environment variables:

```bash
NEXTAUTH_URL=https://www.vairanya.in
NEXTAUTH_SECRET=your-secret-key-here
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

**Important:** The production domain is set to `www.vairanya.in`.

### 2. Update Google OAuth Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** > **Credentials**
3. Click on your OAuth 2.0 Client ID
4. Under **Authorized redirect URIs**, add:
   ```
   https://www.vairanya.in/api/auth/callback/google
   ```
5. Save the changes

### 3. For Vercel Deployment

If you're using Vercel, the `NEXTAUTH_URL` should be automatically set, but you can also:

1. Go to your Vercel project settings
2. Navigate to **Environment Variables**
3. Add/Update:
   - `NEXTAUTH_URL` = `https://www.vairanya.in`
   - `NEXTAUTH_SECRET` = (generate a new secret)
   - `GOOGLE_CLIENT_ID` = (your Google client ID)
   - `GOOGLE_CLIENT_SECRET` = (your Google client secret)

### 4. Generate NEXTAUTH_SECRET

Run this command to generate a secure secret:

```bash
openssl rand -base64 32
```

Or use Node.js:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 5. Verify Setup

After deployment, test the OAuth flow:
1. Visit your production site
2. Click "Sign in with Google"
3. Complete the OAuth flow
4. Verify you're redirected back to your production domain (not localhost)

## Troubleshooting

### Still redirecting to localhost?

1. **Check environment variables** - Make sure `NEXTAUTH_URL` is set correctly in production
2. **Clear browser cache** - Sometimes cached redirects can cause issues
3. **Check Google Console** - Verify the redirect URI matches exactly (including https://)
4. **Check logs** - Look for any errors in your deployment logs

### Common Errors

- **"redirect_uri_mismatch"** - The redirect URI in Google Console doesn't match your production URL
- **"NEXTAUTH_URL not set"** - Make sure the environment variable is set in your production environment

## Notes

- The code now uses `trustHost: true` which allows NextAuth to automatically detect the host in production
- For Vercel deployments, `VERCEL_URL` is automatically available and will be used if `NEXTAUTH_URL` is not set
- Always use HTTPS in production for OAuth callbacks

