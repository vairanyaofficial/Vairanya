# Production Debugging Guide

## Products Not Loading in Production

If products are not loading in your production deployment, follow these steps:

### Step 1: Check Debug Endpoint

Visit your production URL and check the debug endpoint:
```
https://your-domain.com/api/products/debug
```

This will show you:
- ✅ Firestore initialization status
- ✅ Environment variables status
- ✅ Sample product data (if available)
- ❌ Any errors with detailed information

### Step 2: Check Vercel Logs

1. Go to Vercel Dashboard
2. Select your project
3. Go to "Deployments" → Latest deployment → "Logs"
4. Look for errors containing:
   - "Firestore not initialized"
   - "FIREBASE_SERVICE_ACCOUNT_JSON"
   - "Firebase Admin SDK"

### Step 3: Verify Environment Variables

#### In Vercel Dashboard:

1. Go to **Project Settings** → **Environment Variables**
2. Verify `FIREBASE_SERVICE_ACCOUNT_JSON` is set:
   - ✅ Should be set for **Production** environment
   - ✅ Value should be the complete JSON string from Firebase Console
   - ✅ Entire JSON must be on a single line
   - ✅ All quotes must be properly escaped

#### Getting Service Account JSON:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Project Settings** → **Service Accounts**
4. Click **Generate New Private Key**
5. Copy the entire JSON content
6. In Vercel, paste it as a single line (no line breaks)

### Step 4: Common Issues & Solutions

#### Issue 1: "Firestore not initialized"
**Solution:**
- Check if `FIREBASE_SERVICE_ACCOUNT_JSON` is set in Vercel
- Verify the JSON is valid (use `/api/products/debug` endpoint)
- Redeploy after adding environment variables

#### Issue 2: "Invalid JSON format"
**Solution:**
- Ensure the entire JSON is on one line
- Escape all quotes properly
- Don't add extra spaces or line breaks
- Verify JSON validity using a JSON validator

#### Issue 3: "Permission denied"
**Solution:**
- Verify service account has "Firebase Admin SDK Admin Service Agent" role
- Check Firestore security rules allow read access
- Ensure the service account email has proper permissions

#### Issue 4: "Collection not found"
**Solution:**
- Verify the collection name is "products" (lowercase)
- Check if products exist in Firestore
- Verify the collection is in the correct Firestore database

### Step 5: Test Health Check

Visit the health check endpoint:
```
https://your-domain.com/api/health
```

This should return:
```json
{
  "status": "healthy",
  "services": {
    "database": "ok"
  }
}
```

If `database` is `"error"`, Firestore is not connected.

### Step 6: Verify Products API

Test the products API directly:
```
https://your-domain.com/api/products
```

Expected response:
```json
{
  "success": true,
  "products": [...],
  "total": 6
}
```

If `success` is `false`, check the `error` and `errorCode` fields.

### Step 7: Check Browser Console

Open browser DevTools → Console and look for:
- Errors from `/api/products` endpoint
- Network errors (404, 500, 503)
- CORS errors (shouldn't happen with same origin)

### Quick Checklist

- [ ] `FIREBASE_SERVICE_ACCOUNT_JSON` is set in Vercel
- [ ] JSON is valid and properly formatted
- [ ] Service account has proper permissions
- [ ] Products collection exists in Firestore
- [ ] Collection name is "products" (lowercase)
- [ ] Vercel deployment completed successfully
- [ ] Environment variables are set for Production environment
- [ ] No errors in Vercel logs
- [ ] `/api/products/debug` shows Firestore initialized
- [ ] `/api/health` shows database: "ok"

### Still Not Working?

1. **Check Vercel Function Logs**: More detailed logs than deployment logs
2. **Test Locally**: Run `npm run build && npm start` locally with production env vars
3. **Verify Firebase Project**: Ensure you're using the correct Firebase project
4. **Check Firestore Database**: Verify products exist and collection name is correct
5. **Contact Support**: Share debug endpoint output and Vercel logs

### Debug Endpoint Output Examples

#### ✅ Success:
```json
{
  "success": true,
  "debug": {
    "firestore": {
      "initialized": true
    },
    "products": {
      "count": 6
    }
  }
}
```

#### ❌ Firestore Not Initialized:
```json
{
  "success": true,
  "debug": {
    "firestore": {
      "initialized": false,
      "error": "Firestore not initialized"
    },
    "environment": {
      "hasServiceAccountJson": false
    }
  }
}
```

#### ❌ Invalid JSON:
```json
{
  "success": true,
  "debug": {
    "environment": {
      "hasServiceAccountJson": true,
      "serviceAccountJsonValid": false,
      "serviceAccountJsonError": "Invalid JSON format"
    }
  }
}
```

