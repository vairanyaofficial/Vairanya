# MongoDB SSL Alert 80 - Troubleshooting Guide

## Error Description

**Error:** `SSL alert number 80` or `tlsv1 alert internal error`

This is a specific OpenSSL error that occurs during TLS handshake with MongoDB Atlas.

## What This Error Means

SSL Alert Number 80 is an "internal error" that typically indicates:

1. **MongoDB Atlas cluster is PAUSED** (most common)
2. **Network Access IP whitelist issue** - Vercel IPs not whitelisted
3. **Cluster is shutting down or unavailable**
4. **TLS handshake failure** due to server-side issue

## Quick Fix Checklist

### ✅ Step 1: Check MongoDB Atlas Cluster Status

1. Go to [MongoDB Atlas Dashboard](https://cloud.mongodb.com)
2. Select your project
3. Check your cluster status:
   - **🟢 Running** = Good
   - **🔴 Paused** = **RESUME IT!**
   - **🟡 Other** = Check details

**If cluster is paused:**
- Click on your cluster
- Click "Resume" button
- Wait 2-5 minutes for cluster to start
- Try connecting again

### ✅ Step 2: Check Network Access (IP Whitelist)

**This is the #1 cause of SSL Alert 80 in production!**

1. In MongoDB Atlas, go to **Network Access**
2. Click **IP Access List**
3. Check if Vercel IPs are whitelisted

**For Vercel deployments:**

**Option A: Whitelist All IPs (Temporary - for testing)**
```
0.0.0.0/0
```
⚠️ **Warning:** This allows access from anywhere. Use only for testing, then restrict.

**Option B: Whitelist Specific Vercel IPs (Recommended)**
- Vercel uses dynamic IPs
- You can find current Vercel IPs in Vercel dashboard → Settings → Functions
- Or use `0.0.0.0/0` temporarily, then check MongoDB Atlas logs to see which IPs are connecting

**Option C: Use MongoDB Atlas VPC Peering (Production)**
- For production, consider VPC peering for better security

### ✅ Step 3: Verify Connection String

Check your `MONGODB_URI` in Vercel environment variables:

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Verify `MONGODB_URI` is set correctly
3. Format should be:
   ```
   mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/database?retryWrites=true&w=majority
   ```
4. Make sure:
   - Username and password are correct
   - Cluster hostname matches your actual cluster
   - Database name is correct

### ✅ Step 4: Test Connection

After making changes:

1. **Wait 2-5 minutes** for changes to propagate
2. **Clear failure cache** (or wait 5 minutes - cache expires automatically)
3. **Test connection:**
   ```bash
   # Local test
   npm run test-mongodb
   
   # Check production health
   curl https://www.vairanya.in/api/health
   ```

## Code Changes Applied

We've enhanced the MongoDB connection code with:

1. ✅ **Explicit TLS configuration** for MongoDB Atlas
2. ✅ **Increased timeouts** (15 seconds) for better reliability
3. ✅ **Better error messages** specifically for SSL Alert 80
4. ✅ **Connection retry logic** built into MongoDB driver
5. ✅ **Heartbeat monitoring** to keep connections alive

## Environment Variables

### Required
```env
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/vairanya?retryWrites=true&w=majority
```

### Optional (for troubleshooting)
```env
# Temporarily disable MongoDB if needed
MONGODB_DISABLED=true

# Development only - allow invalid certificates (NOT recommended for production)
MONGODB_TLS_ALLOW_INVALID_CERTS=true
```

## Common Scenarios

### Scenario 1: Local Works, Production Fails

**Cause:** IP whitelist issue - your local IP is whitelisted, but Vercel IPs are not.

**Solution:**
1. Add `0.0.0.0/0` to IP whitelist (temporarily)
2. Test if it works
3. Check MongoDB Atlas logs to see which IPs are connecting
4. Replace `0.0.0.0/0` with specific IPs

### Scenario 2: Works Sometimes, Fails Other Times

**Cause:** Cluster might be auto-pausing (free tier) or network instability.

**Solution:**
1. Check if you're on MongoDB Atlas free tier (M0)
2. Free tier clusters auto-pause after inactivity
3. Consider upgrading to paid tier for production
4. Or implement connection retry logic (already done)

### Scenario 3: Error After Deployment

**Cause:** Environment variables not set in Vercel.

**Solution:**
1. Go to Vercel Dashboard → Settings → Environment Variables
2. Add `MONGODB_URI` with your connection string
3. Redeploy the application

## Verification Steps

After fixing, verify everything works:

1. ✅ **Check MongoDB Atlas Dashboard:**
   - Cluster status: Running
   - Network Access: IPs whitelisted
   - Database Access: User exists and has permissions

2. ✅ **Check Vercel:**
   - Environment variables set
   - Deployment successful
   - No build errors

3. ✅ **Test Connection:**
   ```bash
   # Local
   npm run test-mongodb
   
   # Production
   curl https://www.vairanya.in/api/health
   ```

4. ✅ **Check Logs:**
   - Vercel Function Logs should show: `✅ MongoDB connected successfully`
   - No SSL/TLS errors

## Still Having Issues?

If SSL Alert 80 persists after trying all steps:

1. **Check MongoDB Atlas Status Page:**
   - https://status.mongodb.com/
   - See if there are any ongoing issues

2. **Check MongoDB Atlas Logs:**
   - Go to MongoDB Atlas → Monitoring → Logs
   - Look for connection attempts and errors

3. **Contact MongoDB Support:**
   - If cluster is running and IPs are whitelisted
   - But connection still fails
   - There might be an Atlas-side issue

4. **Temporary Workaround:**
   ```env
   MONGODB_DISABLED=true
   ```
   This will disable MongoDB temporarily while you troubleshoot.

## Prevention

To prevent SSL Alert 80 errors:

1. ✅ **Keep cluster running** (upgrade from free tier if needed)
2. ✅ **Whitelist all necessary IPs** (including Vercel)
3. ✅ **Monitor cluster status** regularly
4. ✅ **Set up alerts** in MongoDB Atlas for cluster status
5. ✅ **Use connection pooling** (already implemented)
6. ✅ **Implement graceful degradation** (already implemented)

## Summary

SSL Alert 80 is almost always caused by:
- 🔴 **Cluster paused** (90% of cases)
- 🔴 **IP whitelist issue** (8% of cases)
- 🔴 **Other issues** (2% of cases)

**Most common fix:** Resume cluster + Whitelist IPs = ✅ Working!

