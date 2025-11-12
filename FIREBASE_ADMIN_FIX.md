# Firebase Admin Login Fix

## Problem:
- `verifyIdToken failed` error
- `adminProjectId: 'not set'` 
- Firebase Admin trying to read non-existent file: `./secrets/serviceAccountKey.json`

## Root Cause:
`GOOGLE_APPLICATION_CREDENTIALS` environment variable points to a file that doesn't exist, causing Firebase Admin initialization to fail.

## Solution:

### Option 1: Remove GOOGLE_APPLICATION_CREDENTIALS (Recommended)
If you're not using a local credentials file, remove this environment variable:

```bash
# Remove from .env file
# GOOGLE_APPLICATION_CREDENTIALS=./secrets/serviceAccountKey.json
```

### Option 2: Use Individual Credentials (Best for Vercel)
Set these environment variables instead:

```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### Option 3: Use Base64 Encoded JSON (Also good for Vercel)
```env
FIREBASE_SERVICE_ACCOUNT_JSON_B64=<base64-encoded-json>
```

### Option 4: Create the Missing File
If you want to use the file path, create the file:
```bash
mkdir -p secrets
# Copy your service account JSON to secrets/serviceAccountKey.json
```

## Current Status:
- Code updated to handle missing file gracefully
- Will skip GOOGLE_APPLICATION_CREDENTIALS if file doesn't exist
- Will try other initialization strategies

## Next Steps:
1. Check your `.env` file for `GOOGLE_APPLICATION_CREDENTIALS`
2. Either remove it or set proper Firebase credentials
3. Restart your dev server
4. Try logging in again

