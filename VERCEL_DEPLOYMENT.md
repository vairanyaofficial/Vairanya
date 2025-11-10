# Vercel Deployment Guide for Firebase Admin

## Problem: "Firebase Admin SDK not found" in Production

If you're getting this error in production on Vercel, follow these steps:

## Solution Steps

### 1. Verify package.json is Committed

Make sure `package.json` with `firebase-admin` in dependencies is committed to your repository:

```bash
git add package.json package-lock.json
git commit -m "Ensure firebase-admin is in dependencies"
git push
```

### 2. Check Vercel Build Logs

1. Go to your Vercel project dashboard
2. Check the latest deployment's build logs
3. Look for: `Installing dependencies...`
4. Verify that `firebase-admin` is being installed

### 3. Verify Environment Variables in Vercel

Since file-based credentials don't work on Vercel, you MUST use `FIREBASE_SERVICE_ACCOUNT_JSON`:

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add `FIREBASE_SERVICE_ACCOUNT_JSON` with the complete JSON on ONE LINE
3. Make sure it's set for **Production**, **Preview**, and **Development** environments

#### How to Format FIREBASE_SERVICE_ACCOUNT_JSON for Vercel:

1. Get your service account JSON from Firebase Console
2. Remove all newlines and format as a single line
3. Escape all quotes properly
4. Paste into Vercel environment variables

**Example format:**
```
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"your-project","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"...","client_id":"...","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"..."}
```

**Important:** 
- The entire JSON must be on ONE line
- Escape newlines in private_key with `\n`
- Escape all double quotes with `\"`

### 4. Verify next.config.mjs Configuration

Make sure your `next.config.mjs` has:

```javascript
serverExternalPackages: [
  'firebase-admin',
  'mongodb',
],
```

This tells Next.js NOT to bundle these packages and use them from node_modules instead.

### 5. Clear Vercel Build Cache

Sometimes Vercel's build cache can cause issues:

1. Go to Vercel Dashboard → Your Project → Settings → General
2. Scroll down to "Build & Development Settings"
3. Click "Clear Build Cache"
4. Redeploy

### 6. Force Reinstall Dependencies

In Vercel Dashboard:
1. Go to your project → Settings → General
2. Under "Build & Development Settings"
3. Set "Install Command" to: `npm install --force`
4. Redeploy

### 7. Check Node.js Version

Make sure Vercel is using a compatible Node.js version:

1. Go to Vercel Dashboard → Settings → General
2. Set "Node.js Version" to `18.x` or `20.x` (recommended)
3. Redeploy

### 8. Verify Build Output

Check that `firebase-admin` is in the build:

1. After deployment, check build logs for:
   ```
   Installing dependencies...
   added XXX packages
   ```
2. Look for `firebase-admin` in the installed packages list

### 9. Alternative: Use Vercel Environment Variables Script

Create a script to validate the environment in production:

```bash
# In package.json, add:
"scripts": {
  "vercel-build": "npm run build && npm run validate-env"
}
```

### 10. Debug in Production

If the issue persists, check Vercel function logs:

1. Go to Vercel Dashboard → Your Project → Functions
2. Click on any serverless function
3. Check the logs for the actual error message
4. The improved error handling will show detailed diagnostics

## Common Issues

### Issue 1: Package not installed
**Solution:** Make sure `package.json` is committed and `firebase-admin` is in `dependencies` (not `devDependencies`)

### Issue 2: Environment variable not set
**Solution:** Set `FIREBASE_SERVICE_ACCOUNT_JSON` in Vercel environment variables

### Issue 3: JSON format invalid
**Solution:** Make sure the JSON is on one line with proper escaping

### Issue 4: Build cache
**Solution:** Clear Vercel build cache and redeploy

### Issue 5: Node version mismatch
**Solution:** Set Node.js version to 18.x or 20.x in Vercel settings

## Verification

After deploying, verify Firebase is working:

1. Visit: `https://your-domain.vercel.app/api/products/debug`
2. Should show: `"initialized": true`
3. Should show: `"hasFirestore": true`

## Still Having Issues?

1. Check Vercel build logs for the exact error
2. Check Vercel function logs for runtime errors
3. Visit `/api/products/debug` endpoint for detailed diagnostics
4. The improved error handling will show exactly what's wrong

## Quick Fix Checklist

- [ ] `firebase-admin` is in `package.json` dependencies
- [ ] `package.json` and `package-lock.json` are committed
- [ ] `FIREBASE_SERVICE_ACCOUNT_JSON` is set in Vercel (single line, properly escaped)
- [ ] `next.config.mjs` has `serverExternalPackages: ['firebase-admin']`
- [ ] Node.js version is set in Vercel (18.x or 20.x)
- [ ] Build cache is cleared
- [ ] Redeployed after making changes

