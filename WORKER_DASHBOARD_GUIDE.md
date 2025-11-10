# Worker Dashboard Access Guide

## Problem: Workers Can't Access Worker Dashboard

If workers are getting "Access denied" or being redirected when trying to access `/worker/dashboard`, it's usually because:

1. **Worker role not set correctly in Firestore**
2. **Session not established properly after login**
3. **Authentication flow issue**

## Solution

### Step 1: Verify Worker is Added to Firestore

1. Check that the worker's Firebase UID exists in the `admins` collection
2. Verify the `role` field is set to `"worker"` (not `"Worker"` or `"WORKER"`)
3. The document should look like:
   ```json
   {
     "name": "Worker Name",
     "email": "worker@example.com",
     "role": "worker",
     "createdAt": [timestamp],
     "updatedAt": [timestamp]
   }
   ```

### Step 2: Add Worker Using Script

1. Update `scripts/add-worker.ts`:
   ```typescript
   const WORKER_UID = "WORKER_FIREBASE_UID";
   const WORKER_NAME = "Worker Name";
   const WORKER_EMAIL = "worker@example.com";
   const WORKER_ROLE = "worker"; // Make sure this is "worker" (lowercase)
   ```

2. Run the script:
   ```bash
   npx tsx scripts/add-worker.ts
   ```

### Step 3: Sign In as Worker

1. Go to `/admin/login` or `/login?mode=admin`
2. Sign in with Google using the worker's account
3. The system should automatically redirect to `/worker/dashboard`

## Troubleshooting

### Issue: Worker gets redirected to home page

**Cause**: Worker's UID is not in the `admins` collection, or the role is not set to `"worker"`

**Solution**:
1. Check Firestore `admins` collection
2. Verify the document exists with the worker's UID as the document ID
3. Verify the `role` field is exactly `"worker"` (lowercase, no spaces)

### Issue: Worker gets redirected to admin dashboard

**Cause**: Worker's role might be set to `"admin"` or `"superadmin"` instead of `"worker"`

**Solution**:
1. Update the worker's role in Firestore to `"worker"`
2. Clear browser session (localStorage and sessionStorage)
3. Sign in again

### Issue: "Access denied" message

**Cause**: Session not established properly, or authentication failed

**Solution**:
1. Clear browser storage:
   ```javascript
   // In browser console
   localStorage.clear();
   sessionStorage.clear();
   ```
2. Sign out and sign in again
3. Check browser console for errors

### Issue: Worker dashboard shows "Loading..." forever

**Cause**: Session establishment is stuck, or Firebase Admin SDK not initialized

**Solution**:
1. Check server logs for Firebase initialization errors
2. Verify `FIREBASE_SERVICE_ACCOUNT_JSON_B64` or `FIREBASE_SERVICE_ACCOUNT_JSON` is set
3. Check that `/api/admin/login` endpoint is working

## Debug Endpoint

Use the debug endpoint to check worker status:

```javascript
// In browser console after signing in
const user = firebase.auth().currentUser;
const idToken = await user.getIdToken();

fetch("/api/admin/debug-access", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ idToken }),
})
.then(res => res.json())
.then(data => console.log(data));
```

This will show:
- Firebase initialization status
- Token verification status
- Whether user is in the `admins` collection
- User's role
- Detailed recommendations

## Roles Reference

- **`"worker"`**: Can access worker dashboard, view and update assigned orders
- **`"admin"`**: Can access admin dashboard, manage products and orders (but NOT workers)
- **`"superadmin"`**: Full access, can manage everything including workers

**Important**: Role names are case-sensitive. Use lowercase: `"worker"`, `"admin"`, `"superadmin"`

## Testing Worker Access

1. **Add a test worker**:
   ```bash
   npx tsx scripts/add-worker.ts
   ```

2. **Sign in as worker**:
   - Go to `/admin/login`
   - Sign in with Google
   - Should redirect to `/worker/dashboard`

3. **Verify worker dashboard loads**:
   - Should show worker's name
   - Should show assigned orders
   - Should not show admin-only features

## Common Mistakes

1. **Wrong role name**: Using `"Worker"` instead of `"worker"`
2. **Missing document**: Worker's UID not in `admins` collection
3. **Session not cleared**: Old session data causing conflicts
4. **Firebase not initialized**: Server-side Firebase Admin SDK not configured

## Support

If issues persist:
1. Check server logs for errors
2. Use the debug endpoint to diagnose
3. Verify Firestore data structure
4. Check browser console for client-side errors

