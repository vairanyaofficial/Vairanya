// scripts/extract-firebase-credentials.js
// Helper script to extract individual Firebase credentials from service account JSON
// This is useful when setting up Firebase on Vercel using individual environment variables

const fs = require('fs');
const path = require('path');

const serviceAccountPath = process.argv[2] || path.join(__dirname, '../secrets/serviceAccountKey.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.error('❌ Service account file not found:', serviceAccountPath);
  console.log('\nUsage: node scripts/extract-firebase-credentials.js [path-to-service-account.json]');
  process.exit(1);
}

try {
  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
  
  console.log('\n✅ Firebase Credentials Extracted\n');
  console.log('='.repeat(80));
  console.log('Copy these environment variables to Vercel:\n');
  
  console.log('FIREBASE_PROJECT_ID');
  console.log('-'.repeat(80));
  console.log(serviceAccount.project_id);
  console.log('');
  
  console.log('FIREBASE_CLIENT_EMAIL');
  console.log('-'.repeat(80));
  console.log(serviceAccount.client_email);
  console.log('');
  
  console.log('FIREBASE_PRIVATE_KEY');
  console.log('-'.repeat(80));
  console.log(serviceAccount.private_key);
  console.log('');
  
  // Optional fields
  if (serviceAccount.private_key_id) {
    console.log('FIREBASE_PRIVATE_KEY_ID (optional)');
    console.log('-'.repeat(80));
    console.log(serviceAccount.private_key_id);
    console.log('');
  }
  
  if (serviceAccount.client_id) {
    console.log('FIREBASE_CLIENT_ID (optional)');
    console.log('-'.repeat(80));
    console.log(serviceAccount.client_id);
    console.log('');
  }
  
  if (serviceAccount.auth_uri) {
    console.log('FIREBASE_AUTH_URI (optional)');
    console.log('-'.repeat(80));
    console.log(serviceAccount.auth_uri);
    console.log('');
  }
  
  if (serviceAccount.token_uri) {
    console.log('FIREBASE_TOKEN_URI (optional)');
    console.log('-'.repeat(80));
    console.log(serviceAccount.token_uri);
    console.log('');
  }
  
  if (serviceAccount.auth_provider_x509_cert_url) {
    console.log('FIREBASE_AUTH_PROVIDER_X509_CERT_URL (optional)');
    console.log('-'.repeat(80));
    console.log(serviceAccount.auth_provider_x509_cert_url);
    console.log('');
  }
  
  if (serviceAccount.client_x509_cert_url) {
    console.log('FIREBASE_CLIENT_X509_CERT_URL (optional)');
    console.log('-'.repeat(80));
    console.log(serviceAccount.client_x509_cert_url);
    console.log('');
  }
  
  console.log('='.repeat(80));
  console.log('\n📝 Instructions:');
  console.log('1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables');
  console.log('2. Add each variable above (at minimum: PROJECT_ID, CLIENT_EMAIL, PRIVATE_KEY)');
  console.log('3. Set environment to "Production" (and Preview/Development if needed)');
  console.log('4. Redeploy your application');
  console.log('\n✅ Done!\n');
  
} catch (error) {
  console.error('❌ Error reading service account file:', error.message);
  process.exit(1);
}

