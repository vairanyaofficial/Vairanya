# Vercel Deployment Fix Guide

## ✅ Fixed Issues

### 1. Firebase Admin SDK Bundling
- ✅ Fixed `outputFileTracingIncludes` in `next.config.mjs` to properly include `firebase-admin` and all dependencies
- ✅ Added proper external package configuration for serverless functions
- ✅ Improved dynamic import handling for Vercel serverless environment

### 2. Configuration Files
- ✅ Created `vercel.json` with proper function configuration
- ✅ Added Node.js version requirements in `package.json`
- ✅ Optimized build settings for Vercel

### 3. Error Handling
- ✅ Improved error messages for production environment
- ✅ Better fallback handling for initialization failures
- ✅ Proper Vercel environment detection

## 🚀 Deployment Steps

### Step 1: Environment Variables in Vercel

Go to **Vercel Dashboard** → **Your Project** → **Settings** → **Environment Variables** and add:

#### Required Variables:
1. **FIREBASE_SERVICE_ACCOUNT_JSON**
   - Get from Firebase Console → Project Settings → Service Accounts
   - Click "Generate New Private Key"
   - Copy entire JSON content
   - Paste in Vercel as a **single line** (no line breaks)
   - **Important**: All quotes must be properly escaped
   - Set for: **Production**, **Preview**, **Development**

2. **NEXT_PUBLIC_FIREBASE_API_KEY**
   - From Firebase Console → Project Settings → General
   - Set for: **Production**, **Preview**, **Development**

3. **NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN**
   - Format: `your-project.firebaseapp.com`
   - Set for: **Production**, **Preview**, **Development**

4. **NEXT_PUBLIC_FIREBASE_PROJECT_ID**
   - Your Firebase project ID
   - Set for: **Production**, **Preview**, **Development**

5. **NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET**
   - Format: `your-project.appspot.com`
   - Set for: **Production**, **Preview**, **Development**

6. **NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID**
   - From Firebase Console
   - Set for: **Production**, **Preview**, **Development**

7. **NEXT_PUBLIC_FIREBASE_APP_ID**
   - From Firebase Console
   - Set for: **Production**, **Preview**, **Development**

#### Optional Variables (if using):
- `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` (for payments)
- `IMAGEKIT_PUBLIC_KEY`, `IMAGEKIT_PRIVATE_KEY`, `IMAGEKIT_URL_ENDPOINT` (for image uploads)

### Step 2: Deploy to Vercel

1. **Push code to GitHub**:
   ```bash
   git add .
   git commit -m "Fix Vercel deployment configuration"
   git push origin main
   ```

2. **Vercel will automatically deploy** (if connected to GitHub)

3. **Or manually deploy**:
   - Go to Vercel Dashboard
   - Click "Deploy" → "Import Git Repository"
   - Select your repository
   - Vercel will detect Next.js automatically

### Step 3: Verify Deployment

1. **Check Build Logs**:
   - Go to Vercel Dashboard → Your Project → Deployments → Latest
   - Check "Build Logs" for any errors
   - Should see: "✅ Build completed successfully"

2. **Test API Endpoints**:
   - Visit: `https://your-domain.vercel.app/api/products/debug`
   - Should show Firestore initialization status
   - Check for any errors

3. **Test Main Page**:
   - Visit: `https://your-domain.vercel.app`
   - Products should load
   - Collections should load
   - No errors in browser console

### Step 4: Troubleshooting

#### Issue: "Firebase Admin SDK not found"
**Solution**:
- Check that `firebase-admin` is in `package.json` dependencies ✅ (already fixed)
- Check Vercel build logs for installation errors
- Ensure `package.json` is committed to Git

#### Issue: "Firestore not initialized"
**Solution**:
1. Check `FIREBASE_SERVICE_ACCOUNT_JSON` is set in Vercel
2. Verify JSON is valid (use `/api/products/debug` endpoint)
3. Ensure JSON is on a single line with escaped quotes
4. Redeploy after adding environment variables

#### Issue: Build fails
**Solution**:
- Check Node.js version (should be >= 18.0.0) ✅ (already set in package.json)
- Check build logs for specific errors
- Ensure all dependencies are in `package.json`

#### Issue: API routes return 500 errors
**Solution**:
1. Check Vercel Function Logs
2. Visit `/api/products/debug` for detailed diagnostics
3. Verify environment variables are set correctly
4. Check Firestore permissions for service account

## 📋 Pre-Deployment Checklist

- [ ] All environment variables set in Vercel
- [ ] `FIREBASE_SERVICE_ACCOUNT_JSON` is valid JSON (single line)
- [ ] Code pushed to GitHub
- [ ] Build completes successfully
- [ ] Test `/api/products/debug` endpoint
- [ ] Test main page loads products
- [ ] Test collections load
- [ ] No errors in browser console
- [ ] No errors in Vercel function logs

## 🔍 Debug Endpoints

### Products Debug
```
https://your-domain.vercel.app/api/products/debug
```
Shows:
- Firestore initialization status
- Environment variables status
- Sample product data
- Detailed error information

### Health Check
```
https://your-domain.vercel.app/api/health
```
Shows:
- Service status
- Database connectivity
- Response time

## 📝 Important Notes

1. **Never commit** `secrets/serviceAccountKey.json` to Git (already in `.gitignore`)
2. **Always use** `FIREBASE_SERVICE_ACCOUNT_JSON` environment variable in Vercel
3. **JSON must be** on a single line with properly escaped quotes
4. **Redeploy** after adding/changing environment variables
5. **Check logs** in Vercel Dashboard if something doesn't work

## ✅ What Was Fixed

1. **next.config.mjs**:
   - Fixed `outputFileTracingIncludes` pattern
   - Added all required firebase-admin dependencies
   - Proper external package configuration

2. **vercel.json**:
   - Created with proper function configuration
   - Set memory and timeout limits
   - Configured for Next.js framework

3. **package.json**:
   - Added Node.js version requirements
   - Ensured proper engine specifications

4. **lib/firebaseAdmin.server.ts**:
   - Improved Vercel environment detection
   - Better error handling for production
   - Proper dynamic import handling

## 🎯 Expected Results

After deployment:
- ✅ All API routes work
- ✅ Products load correctly
- ✅ Collections load correctly
- ✅ No "Firebase Admin SDK not found" errors
- ✅ No "Firestore not initialized" errors
- ✅ Fast response times
- ✅ Proper error handling

## 📞 Support

If issues persist:
1. Check Vercel Function Logs
2. Visit `/api/products/debug` endpoint
3. Check environment variables in Vercel Dashboard
4. Verify Firebase service account permissions
5. Review build logs for errors

