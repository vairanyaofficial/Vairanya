/**
 * Script to check Firebase environment variable configuration
 * Run with: node scripts/check-firebase-env.js
 */

require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

const svcJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
const googleAppCreds = process.env.GOOGLE_APPLICATION_CREDENTIALS;

console.log('🔍 Checking Firebase Environment Configuration\n');

// Check if FIREBASE_SERVICE_ACCOUNT_JSON is set
if (!svcJson) {
  console.log('❌ FIREBASE_SERVICE_ACCOUNT_JSON is not set');
  console.log('   Please set it in your .env or .env.local file\n');
} else {
  console.log('✅ FIREBASE_SERVICE_ACCOUNT_JSON is set');
  console.log(`   Length: ${svcJson.length} characters`);
  console.log(`   First 50 chars: ${svcJson.substring(0, 50)}...`);
  
  // Check for common issues
  const trimmed = svcJson.trim();
  if (trimmed.length === 0) {
    console.log('❌ FIREBASE_SERVICE_ACCOUNT_JSON is empty (only whitespace)');
  } else if (trimmed === '{}') {
    console.log('❌ FIREBASE_SERVICE_ACCOUNT_JSON is an empty object');
  } else if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    console.log('⚠️  FIREBASE_SERVICE_ACCOUNT_JSON appears to be wrapped in quotes');
    console.log('   This might cause issues. Try removing the outer quotes.');
  } else {
    // Try to parse JSON
    try {
      const parsed = JSON.parse(trimmed);
      console.log('✅ FIREBASE_SERVICE_ACCOUNT_JSON is valid JSON');
      
      // Check required fields
      const requiredFields = ['project_id', 'private_key', 'client_email'];
      const missingFields = requiredFields.filter(field => !parsed[field]);
      
      if (missingFields.length > 0) {
        console.log(`❌ Missing required fields: ${missingFields.join(', ')}`);
      } else {
        console.log('✅ All required fields are present');
        console.log(`   Project ID: ${parsed.project_id}`);
        console.log(`   Client Email: ${parsed.client_email}`);
        console.log(`   Private Key: ${parsed.private_key ? 'Present' : 'Missing'} (${parsed.private_key?.length || 0} chars)`);
      }
    } catch (error) {
      console.log(`❌ FIREBASE_SERVICE_ACCOUNT_JSON is NOT valid JSON`);
      console.log(`   Error: ${error.message}`);
      console.log(`   Position: ${error.message.match(/position (\d+)/)?.[1] || 'unknown'}`);
      
      // Show the problematic area
      const match = error.message.match(/position (\d+)/);
      if (match) {
        const pos = parseInt(match[1]);
        const start = Math.max(0, pos - 20);
        const end = Math.min(trimmed.length, pos + 20);
        console.log(`   Around position ${pos}:`);
        console.log(`   "${trimmed.substring(start, end)}"`);
        console.log(`   ${' '.repeat(pos - start)}^`);
      }
      
      console.log('\n💡 Common fixes:');
      console.log('   1. Remove any extra quotes around the JSON');
      console.log('   2. Ensure all quotes inside the JSON are properly escaped');
      console.log('   3. Remove any line breaks (JSON should be on one line in .env)');
      console.log('   4. Check for trailing commas');
      console.log('   5. Make sure there are no special characters at the start');
    }
  }
  console.log();
}

// Check GOOGLE_APPLICATION_CREDENTIALS
if (!googleAppCreds) {
  console.log('ℹ️  GOOGLE_APPLICATION_CREDENTIALS is not set (optional if using FIREBASE_SERVICE_ACCOUNT_JSON)');
} else {
  console.log(`✅ GOOGLE_APPLICATION_CREDENTIALS is set: ${googleAppCreds}`);
  const fs = require('fs');
  const path = require('path');
  try {
    if (fs.existsSync(googleAppCreds)) {
      console.log('✅ Credentials file exists');
      const fileContent = fs.readFileSync(googleAppCreds, 'utf8');
      try {
        const parsed = JSON.parse(fileContent);
        console.log('✅ Credentials file contains valid JSON');
      } catch (error) {
        console.log(`❌ Credentials file is not valid JSON: ${error.message}`);
      }
    } else {
      console.log(`❌ Credentials file does not exist: ${googleAppCreds}`);
    }
  } catch (error) {
    console.log(`⚠️  Could not check credentials file: ${error.message}`);
  }
}

console.log('\n📋 Next Steps:');
console.log('   1. Fix any errors shown above');
console.log('   2. Restart your development server');
console.log('   3. Check /api/products/debug endpoint for diagnostics');

