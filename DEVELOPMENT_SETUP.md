# Development Setup Guide

## Firebase Setup for Development

To run the application in development mode, you need to set up Firebase Admin credentials.

### Option 1: Using Environment Variable (Recommended)

1. Create a `.env.local` file in the root directory (if it doesn't exist)
2. Add your Firebase service account JSON as an environment variable:

```bash
FIREBASE_SERVICE_ACCOUNT_JSON='{"type":"service_account","project_id":"your-project-id",...}'
```

**Important:** The entire JSON must be on a single line with all quotes properly escaped.

### Option 2: Using Service Account File

1. Create a `secrets` folder in the root directory
2. Create `secrets/serviceAccountKey.json` with your Firebase service account JSON
3. Make sure this file is in `.gitignore` (it should be already)

### Getting Your Firebase Service Account JSON

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Project Settings** → **Service Accounts**
4. Click **Generate New Private Key**
5. Download the JSON file
6. Copy the entire JSON content

### For Environment Variable (.env.local)

Paste the entire JSON as a single line in `.env.local`:

```bash
FIREBASE_SERVICE_ACCOUNT_JSON='{"type":"service_account","project_id":"your-project","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"..."}'
```

**Note:** Make sure all quotes inside the JSON are properly escaped, or use single quotes around the entire JSON string.

### Verification

After setting up, restart your development server:

```bash
npm run dev
```

Check the console logs. You should see:
- ✅ `FIREBASE_SERVICE_ACCOUNT_JSON is valid, using it for initialization`
- ✅ `Firebase Admin initialized with FIREBASE_SERVICE_ACCOUNT_JSON`

If you see errors, check:
1. The JSON is valid (use a JSON validator)
2. All quotes are properly escaped
3. The entire JSON is on a single line
4. `.env.local` file is in the root directory

