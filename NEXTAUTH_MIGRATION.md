# NextAuth Migration Summary

## Overview
Firebase Authentication has been replaced with NextAuth.js for all authentication needs.

## Changes Made

### 1. Dependencies
- ✅ Installed `next-auth@beta`
- ✅ Installed `bcryptjs` and `@types/bcryptjs` for password hashing

### 2. NextAuth Configuration
- ✅ Created `app/api/auth/[...nextauth]/route.ts` with:
  - Google OAuth provider
  - Credentials provider (email/password)
  - JWT session strategy
  - MongoDB integration for user sync and admin role checking

### 3. Components Updated
- ✅ `components/AuthProvider.tsx` - Now uses NextAuth `useSession` hook
- ✅ `components/SessionProvider.tsx` - New wrapper for NextAuth SessionProvider
- ✅ `app/layout.tsx` - Added SessionProvider wrapper

### 4. API Routes Updated
- ✅ `app/api/admin/login/route.ts` - Uses NextAuth session instead of Firebase token
- ✅ `app/api/admin/check/route.ts` - Uses NextAuth session
- ✅ `app/api/admin/check-session/route.ts` - New route for admin session checking
- ✅ `app/api/auth/register/route.ts` - New route for email/password registration
- ✅ `app/api/addresses/route.ts` - Uses NextAuth session
- ✅ `app/api/addresses/[id]/route.ts` - Uses NextAuth session
- ✅ `app/api/wishlist/route.ts` - Uses NextAuth session

### 5. Client Components Updated
- ✅ `lib/wishlist-context.tsx` - Removed Firebase token, uses NextAuth cookies
- ✅ `app/account/page.tsx` - Removed Firebase token, uses NextAuth cookies
- ✅ `app/checkout/page.tsx` - Removed Firebase token, uses NextAuth cookies

### 6. Helper Functions
- ✅ `lib/auth-helpers.ts` - New helper functions for NextAuth session management
- ✅ `types/next-auth.d.ts` - TypeScript declarations for NextAuth session

## Environment Variables Required

Add these to your `.env` file:

```env
# NextAuth
NEXTAUTH_SECRET=your-secret-key-here  # Generate with: openssl rand -base64 32
NEXTAUTH_URL=http://localhost:3000    # Your app URL

# Google OAuth (for Google sign-in)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### How to Get Google OAuth Credentials:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (development)
   - `https://yourdomain.com/api/auth/callback/google` (production)

## What Still Uses Firebase

- **Firebase Storage** - Still used for file uploads (if applicable)
- **Firestore** - Still used for addresses collection (can be migrated to MongoDB later)
- **Firebase Admin SDK** - Still initialized but only for Firestore operations, not auth

## Migration Notes

1. **User IDs**: NextAuth uses email or MongoDB `_id` as user identifier. Firebase UIDs are preserved in the `uid` field for backward compatibility.

2. **Admin Roles**: Admin roles are checked by email in MongoDB `Admin` collection. Make sure admin emails match between Firebase and MongoDB.

3. **Password Storage**: New user registrations store bcrypt-hashed passwords in MongoDB `customers` collection.

4. **Session Management**: NextAuth uses JWT tokens stored in HTTP-only cookies. No manual token management needed.

5. **API Authentication**: All API routes now use `getServerSession(authOptions)` to get user session from cookies. No Authorization headers needed from client.

## Testing Checklist

- [ ] Set environment variables
- [ ] Test Google sign-in
- [ ] Test email/password sign-in
- [ ] Test email/password registration
- [ ] Test admin login
- [ ] Test protected API routes
- [ ] Test wishlist functionality
- [ ] Test address management
- [ ] Test checkout flow
- [ ] Run `npm run build` to verify no build errors

## Breaking Changes

1. **Client-side token access**: `user.getIdToken()` no longer works. Use NextAuth session instead.
2. **API calls**: Remove `Authorization: Bearer ${token}` headers - NextAuth handles auth via cookies.
3. **User object structure**: User object now comes from NextAuth session, not Firebase User.

## Completed Next Steps

1. ✅ **Migrated addresses from Firestore to MongoDB** - Addresses API now uses MongoDB instead of Firestore
2. ✅ **Removed Firebase auth from client SDK** - Firebase client SDK now only exports storage (unused, can be removed)
3. ✅ **Updated all Firebase auth references** - All components now use NextAuth

## ✅ Firebase Completely Removed

All Firebase dependencies have been successfully removed:

1. ✅ **All Firestore collections migrated to MongoDB**:
   - Products → MongoDB
   - Orders → MongoDB
   - Reviews → MongoDB
   - Carousel slides → MongoDB
   - Collections → MongoDB
   - Offers → MongoDB
   - Messages → MongoDB
   - Categories → MongoDB
   - Addresses → MongoDB

2. ✅ **Firebase Admin SDK removed**:
   - Removed from `package.json`
   - All `-firestore.ts` files now re-export MongoDB functions
   - All API routes updated to use MongoDB

3. ✅ **Firebase Client SDK removed**:
   - `lib/firebaseClient.ts` deleted
   - Removed from `package.json`

4. ✅ **All authentication migrated to NextAuth**:
   - No Firebase auth dependencies remaining
   - All API routes use NextAuth sessions

## ✅ Final Cleanup Complete

All Firebase code has been completely removed:

1. ✅ Deleted `lib/firebaseAdmin.server.ts`
2. ✅ Deleted debug/test routes:
   - `app/api/admin/debug-access/route.ts`
   - `app/api/firebase/test/route.ts`
   - `app/api/admin/debug/route.ts`
   - `app/api/products/debug/route.ts`
3. ✅ Removed Firebase-related scripts from `package.json`:
   - `validate-firebase-json`
   - `encode-firebase-json`
   - `extract-firebase-credentials`

**Firebase has been completely removed from the codebase!** 🎉

