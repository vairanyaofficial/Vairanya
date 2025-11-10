# Admin Panel Access Guide

## Problem: Can't Access Admin Panel

If you're getting an "Access denied" error when trying to access the admin panel, it means your Firebase UID is not in the `admins` collection in Firestore.

## Solution: Add Yourself as Admin

### Step 1: Get Your Firebase UID

1. Sign in to your app with Google (regular login)
2. Open browser console (F12)
3. Run this command:
   ```javascript
   firebase.auth().currentUser.uid
   ```
4. Copy the UID (it will look like: `XA6zxFhsnHg6A3P9eZxGIwLOLn43`)

### Step 2: Update the Script

1. Open `scripts/add-worker.ts`
2. Update these values:
   ```typescript
   const WORKER_UID = "YOUR_UID_HERE"; // Paste your UID
   const WORKER_NAME = "Your Name";
   const WORKER_EMAIL = "your-email@example.com";
   const WORKER_ROLE = "superadmin"; // Use "superadmin" for first admin
   ```

### Step 3: Run the Script

```bash
npx tsx scripts/add-worker.ts
```

You should see:
```
✅ Admin/Worker added successfully!
   UID: YOUR_UID
   Name: Your Name
   Email: your-email@example.com
   Role: superadmin

🎉 You can now sign in to the admin dashboard!
   Go to: http://localhost:3000/admin/login
```

### Step 4: Sign In to Admin Panel

1. Go to `/admin/login`
2. Click "Sign in with Google"
3. You should now have access to the admin dashboard!

## Alternative: Manual Firestore Entry

If you have access to Firebase Console:

1. Go to Firebase Console > Firestore Database
2. Create/Select collection: `admins`
3. Add a document with:
   - **Document ID**: Your Firebase UID
   - **Fields**:
     ```json
     {
       "name": "Your Name",
       "email": "your-email@example.com",
       "role": "superadmin",
       "createdAt": [timestamp],
       "updatedAt": [timestamp]
     }
     ```

## Roles

- **superadmin**: Full access (can manage workers, products, orders, etc.)
- **admin**: Limited access (can manage products and orders, but NOT workers)
- **worker**: Very limited access (view/edit only, no create/delete)

## Troubleshooting

### Error: "Firebase Admin initialization failed"

Make sure your `.env.local` has:
- `FIREBASE_SERVICE_ACCOUNT_JSON_B64` (recommended), OR
- `FIREBASE_SERVICE_ACCOUNT_JSON`

### Error: "Access denied. Your account is not registered as an admin"

This means your UID is not in the `admins` collection. Follow the steps above to add yourself.

### Error: "Token verification failed"

Try signing in again. The token might have expired.

### Debug Endpoint

You can use the debug endpoint to check your admin status:

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

This will show you:
- Firebase initialization status
- Token verification status
- Whether you're in the admins collection
- Your role
- Detailed recommendations

## Security Notes

- Only users manually added to the `admins` collection can access the admin panel
- The first admin should be added with role `"superadmin"`
- Superadmins can add other admins/workers via the admin panel
- Never commit your Firebase service account credentials to git

