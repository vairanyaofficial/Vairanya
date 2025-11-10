# Firebase Admin SDK Setup Guide

This guide covers multiple methods to configure Firebase Admin SDK authentication for your Next.js application.

## Authentication Methods

### Method 1: FIREBASE_SERVICE_ACCOUNT_JSON (Recommended for Vercel)

**Best for:** Production deployments on Vercel

Set the entire service account JSON as an environment variable:

```bash
# .env.local (development)
FIREBASE_SERVICE_ACCOUNT_JSON='{"type":"service_account","project_id":"...","private_key":"...","client_email":"..."}'
```

**Important Notes:**
- ✅ Entire JSON must be on a single line (no line breaks)
- ✅ Escape all quotes properly: `\"` for double quotes
- ✅ Single quotes around the JSON are OK: `FIREBASE_SERVICE_ACCOUNT_JSON='{...}'`
- ❌ Don't wrap JSON in double quotes: `FIREBASE_SERVICE_ACCOUNT_JSON="{...}"` (wrong)

**In Vercel:**
1. Go to Project Settings → Environment Variables
2. Add `FIREBASE_SERVICE_ACCOUNT_JSON`
3. Paste the entire JSON as a single line
4. Select environments (Production, Preview, Development)
5. Redeploy

### Method 2: Base64 Encoded JSON (Safest for Environment Variables)

**Best for:** Avoiding quote/newline issues in environment variables

Encode your service account JSON to base64:

```bash
# Encode JSON to base64 (using Node.js)
node -e "console.log(require('fs').readFileSync('serviceAccountKey.json').toString('base64'))"

# Or using online tool: https://www.base64encode.org/
```

Then set it as environment variable:

```bash
# .env.local
FIREBASE_SERVICE_ACCOUNT_JSON=eyJ0eXAiOiJKV1QiLCJhbGc...
```

**Advantages:**
- ✅ No quote escaping issues
- ✅ No newline issues
- ✅ Safe for environment variables
- ✅ Automatically decoded by the application

**In Vercel:**
1. Encode your service account JSON to base64
2. Add `FIREBASE_SERVICE_ACCOUNT_JSON` with the base64 string
3. No quotes needed!

### Method 3: GOOGLE_APPLICATION_CREDENTIALS (File Path)

**Best for:** Local development

Point to a local service account JSON file:

```bash
# .env.local
GOOGLE_APPLICATION_CREDENTIALS="./secrets/serviceAccountKey.json"
```

**Setup:**
1. Create a `secrets` folder in your project root (add to `.gitignore`)
2. Download service account JSON from Firebase Console
3. Save it as `secrets/serviceAccountKey.json`
4. Set the environment variable

**Note:** This method works in development but **not in Vercel/production** (files aren't available in serverless environments).

### Method 4: Vercel Secrets (CLI)

**Best for:** Advanced users comfortable with CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Add secret
vercel secrets add FIREBASE_SERVICE_ACCOUNT_JSON_B64 <base64-encoded-json>

# Reference in .env or vercel.json
```

## Getting Service Account JSON

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Project Settings** → **Service Accounts**
4. Click **Generate New Private Key**
5. Download the JSON file
6. Use one of the methods above to configure it

## Security Best Practices

### 1. Least Privilege Permissions
- ✅ Grant only required permissions to service account
- ✅ Use Firestore security rules in addition to service account permissions
- ✅ Review IAM roles periodically

### 2. Key Rotation
- ✅ Rotate service account keys periodically (every 90 days recommended)
- ✅ Remove old/unused keys from Firebase Console
- ✅ Update environment variables after rotation

### 3. Environment Variable Security
- ✅ Never commit `.env` files to git (already in `.gitignore`)
- ✅ Don't log environment variables in console/logs
- ✅ Set environment variables only for required environments (Production/Preview)
- ✅ Use Vercel's environment-specific variables

### 4. Code Security
- ✅ Don't expose service account JSON in client-side code
- ✅ Use server-only modules (`"server-only"` package)
- ✅ Validate environment variables at startup
- ✅ Use TypeScript for type safety

### 5. Google Cloud IAM
- ✅ Restrict service account usage via IAM conditions
- ✅ Set up alerting for unusual access patterns
- ✅ Enable Cloud Audit Logs for service account usage

## Troubleshooting

### Issue: "Invalid JSON: Expected property name or '}' in JSON at position 1"

**Causes:**
- JSON wrapped in extra quotes
- Newlines in JSON string
- Invalid JSON format

**Solutions:**
1. Use base64 encoding (Method 2) - avoids all quote issues
2. Verify JSON is valid using [jsonlint.com](https://jsonlint.com)
3. Remove outer quotes if present
4. Ensure JSON is on a single line

### Issue: "Credentials file not found"

**Causes:**
- File path is incorrect
- File doesn't exist
- Using file path in production (Vercel doesn't have file system)

**Solutions:**
1. Use `FIREBASE_SERVICE_ACCOUNT_JSON` instead (Method 1 or 2)
2. Verify file path is correct and relative to project root
3. Check file exists in development environment

### Issue: "Missing required fields"

**Causes:**
- Incomplete service account JSON
- Wrong JSON file (not a service account)

**Solutions:**
1. Download fresh service account JSON from Firebase Console
2. Verify JSON contains: `type`, `project_id`, `private_key`, `client_email`
3. Check JSON wasn't corrupted during copy/paste

## Advanced: Google Secret Manager

For enhanced security, you can use Google Secret Manager:

1. Store service account JSON in Google Secret Manager
2. Use a service account with Secret Manager access
3. Fetch secret at runtime (requires initial authentication)

**Note:** This setup is more complex and requires additional Google Cloud configuration. Contact your DevOps team for assistance.

## Validation

Test your configuration:

```bash
# Check diagnostics endpoint
curl http://localhost:3000/api/firebase/test

# Or visit in browser
http://localhost:3000/api/health
```

Expected response:
```json
{
  "diagnostics": {
    "initialized": true,
    "authMethod": "FIREBASE_SERVICE_ACCOUNT_JSON",
    "serviceAccountJsonValid": true
  }
}
```

## Migration Guide

### From File to Environment Variable

1. Read your service account JSON file
2. Encode to base64 (recommended) or use raw JSON
3. Set `FIREBASE_SERVICE_ACCOUNT_JSON` environment variable
4. Remove `GOOGLE_APPLICATION_CREDENTIALS` if no longer needed
5. Test and deploy

### From Raw JSON to Base64

```bash
# Encode existing JSON
node -e "console.log(require('fs').readFileSync('serviceAccountKey.json').toString('base64'))"

# Copy output and set as FIREBASE_SERVICE_ACCOUNT_JSON
```

## Support

If you encounter issues:
1. Check `/api/firebase/test` endpoint for diagnostics
2. Review Vercel logs for detailed error messages
3. Verify environment variables are set correctly
4. Test JSON validity using online validators

