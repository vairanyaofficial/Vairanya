# Production Fix Checklist: Firebase Admin SDK Not Found

## Immediate Actions Required

### ✅ Step 1: Verify package.json
- [ ] Open `package.json`
- [ ] Verify `firebase-admin` is in `dependencies` (not `devDependencies`)
- [ ] Current version should be: `"firebase-admin": "^13.6.0"`
- [ ] Commit and push `package.json` and `package-lock.json`

### ✅ Step 2: Verify Vercel Environment Variables
**CRITICAL:** Vercel cannot use file-based credentials. You MUST use `FIREBASE_SERVICE_ACCOUNT_JSON`.

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add/Update `FIREBASE_SERVICE_ACCOUNT_JSON`:
   - **Value:** Complete Firebase service account JSON on ONE LINE
   - **Environment:** Production, Preview, Development (all three)
   - **Format:** Single line with escaped quotes and newlines

#### How to Format:
```bash
# Get your service account JSON from Firebase Console
# Remove all line breaks
# Escape all quotes: " becomes \"
# Escape newlines in private_key: \n stays as \n
# Paste as single line in Vercel
```

Example:
```
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"vairanya-e638e","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n","client_email":"firebase-adminsdk-...@vairanya-e638e.iam.gserviceaccount.com",...}
```

### ✅ Step 3: Verify next.config.mjs
- [ ] Open `next.config.mjs`
- [ ] Verify `serverExternalPackages` includes `'firebase-admin'`
- [ ] Should look like:
  ```javascript
  serverExternalPackages: [
    'firebase-admin',
    'mongodb',
  ],
  ```

### ✅ Step 4: Clear Vercel Build Cache
1. Go to Vercel Dashboard → Your Project → Settings → General
2. Scroll to "Build & Development Settings"
3. Click "Clear Build Cache"
4. Click "Redeploy" or push a new commit

### ✅ Step 5: Verify Node.js Version
1. Go to Vercel Dashboard → Settings → General
2. Set "Node.js Version" to `20.x` (recommended) or `18.x`
3. Save and redeploy

### ✅ Step 6: Check Build Logs
After redeploying:
1. Go to Vercel Dashboard → Deployments → Latest Deployment
2. Click "Build Logs"
3. Look for:
   ```
   Installing dependencies...
   added XXX packages
   ```
4. Verify `firebase-admin` is in the installed packages

### ✅ Step 7: Verify Deployment
1. After deployment completes, visit: `https://your-domain.vercel.app/api/products/debug`
2. Should show:
   ```json
   {
     "initialized": true,
     "hasFirestore": true,
     "hasServiceAccountJson": true,
     "serviceAccountJsonValid": true
   }
   ```

## Common Issues & Solutions

### Issue: "MODULE_NOT_FOUND: firebase-admin"
**Cause:** Package not installed in production
**Solution:**
1. Verify `package.json` has `firebase-admin` in dependencies
2. Clear Vercel build cache
3. Redeploy

### Issue: "Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON"
**Cause:** JSON is multiline or improperly formatted
**Solution:**
1. Convert JSON to single line
2. Escape all quotes: `"` → `\"`
3. Keep `\n` in private_key as `\n` (don't convert to actual newlines)
4. Set in Vercel environment variables

### Issue: "Firestore not initialized"
**Cause:** Invalid credentials or missing environment variable
**Solution:**
1. Verify `FIREBASE_SERVICE_ACCOUNT_JSON` is set in Vercel
2. Verify JSON is valid (use `/api/products/debug` endpoint)
3. Check Vercel function logs for detailed error

### Issue: Build succeeds but runtime fails
**Cause:** Package not included in serverless bundle
**Solution:**
1. Verify `serverExternalPackages` in `next.config.mjs`
2. Verify `experimental.serverComponentsExternalPackages` (if using Next.js 13)
3. Clear build cache and redeploy

## Verification Commands (Local)

Before deploying, verify locally:

```bash
# Check if firebase-admin is installed
npm list firebase-admin

# Verify package.json
cat package.json | grep firebase-admin

# Test build locally
npm run build

# Check if build includes firebase-admin
ls -la .next/server/node_modules/firebase-admin 2>/dev/null || echo "Not bundled (good - using external)"
```

## After Fixing

1. **Commit all changes:**
   ```bash
   git add package.json package-lock.json next.config.mjs
   git commit -m "Fix: Ensure firebase-admin is properly configured for production"
   git push
   ```

2. **Monitor Vercel deployment:**
   - Watch build logs
   - Check for any errors
   - Verify deployment succeeds

3. **Test in production:**
   - Visit `/api/products/debug`
   - Visit `/api/products`
   - Check Vercel function logs if issues persist

## Still Having Issues?

1. Check Vercel Function Logs:
   - Vercel Dashboard → Your Project → Functions
   - Click on any serverless function
   - Check logs for detailed error messages

2. Use Debug Endpoint:
   - Visit: `https://your-domain.vercel.app/api/products/debug`
   - This shows detailed diagnostics

3. Check Improved Error Messages:
   - The updated code now shows detailed error information
   - Look for specific error codes and messages
   - Follow the suggested solutions

## Quick Reference

- **Package:** `firebase-admin@^13.6.0` (in dependencies)
- **Config:** `serverExternalPackages: ['firebase-admin']` in next.config.mjs
- **Env Var:** `FIREBASE_SERVICE_ACCOUNT_JSON` (single line JSON in Vercel)
- **Node Version:** 18.x or 20.x in Vercel
- **Debug Endpoint:** `/api/products/debug`

