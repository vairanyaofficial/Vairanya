#!/usr/bin/env node
/**
 * Script to validate Firebase Service Account JSON
 * Usage: node scripts/validate-firebase-json.js
 */

const fs = require('fs');
const path = require('path');

// Try to load .env.local if it exists
try {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        let value = match[2].trim();
        // Remove quotes if present
        if ((value.startsWith('"') && value.endsWith('"')) || 
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        // Unescape quotes
        value = value.replace(/\\"/g, '"').replace(/\\'/g, "'");
        process.env[key] = value;
      }
    });
  }
} catch (err) {
  // Ignore errors - environment variables might already be set
}

function validateFirebaseJSON() {
  // Check both FIREBASE_SERVICE_ACCOUNT_JSON_B64 and FIREBASE_SERVICE_ACCOUNT_JSON
  const svcJsonB64 = process.env.FIREBASE_SERVICE_ACCOUNT_JSON_B64;
  const svcJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  
  // Priority: B64 > regular
  const activeVar = svcJsonB64 ? "FIREBASE_SERVICE_ACCOUNT_JSON_B64" : "FIREBASE_SERVICE_ACCOUNT_JSON";
  const activeValue = svcJsonB64 || svcJson;
  
  console.log(`🔍 Validating ${activeVar}...\n`);
  
  if (!activeValue) {
    console.error('❌ Neither FIREBASE_SERVICE_ACCOUNT_JSON_B64 nor FIREBASE_SERVICE_ACCOUNT_JSON is set');
    console.log('\n💡 To set it:');
    console.log('   1. Create a .env.local file in the project root');
    console.log('   2. Option A (Base64 - Recommended):');
    console.log('      Add: FIREBASE_SERVICE_ACCOUNT_JSON_B64="base64-encoded-json"');
    console.log('      Run: npm run encode-firebase-json to generate base64');
    console.log('   3. Option B (Raw JSON):');
    console.log('      Add: FIREBASE_SERVICE_ACCOUNT_JSON="your-json-here"');
    console.log('      Make sure the entire JSON is on one line');
    return false;
  }
  
  console.log(`✅ Environment variable ${activeVar} is set`);
  console.log(`   Length: ${activeValue.length} characters`);
  if (svcJsonB64) {
    console.log(`   Type: Base64 encoded (recommended)\n`);
  } else {
    console.log(`   Type: Raw JSON (auto-detects base64)\n`);
  }
  
  // Show first and last 50 characters (safely)
  const preview = activeValue.substring(0, 50).replace(/private_key["\s:]+"[^"]*/gi, 'private_key:"[REDACTED]"');
  const previewEnd = activeValue.substring(activeValue.length - 50);
  console.log(`   First 50 chars: ${preview}...`);
  console.log(`   Last 50 chars: ...${previewEnd}\n`);
  
  // Check for common issues
  console.log('🔍 Checking for common issues...');
  
  // Check for BOM
  if (activeValue.charCodeAt(0) === 0xFEFF) {
    console.warn('⚠️  Found BOM (Byte Order Mark) at the start - this might cause issues');
  }
  
  // Check for leading/trailing quotes (only for raw JSON, not base64)
  const trimmed = activeValue.trim();
  if (!svcJsonB64 && ((trimmed.startsWith('"') && trimmed.endsWith('"')) || 
      (trimmed.startsWith("'") && trimmed.endsWith("'")))) {
    console.warn('⚠️  JSON is wrapped in quotes - this might need to be removed');
  }
  
  // Check for newlines (only for raw JSON, not base64)
  if (!svcJsonB64 && (activeValue.includes('\n') || activeValue.includes('\r'))) {
    console.warn('⚠️  JSON contains newlines - make sure it\'s all on one line');
  }
  
  // Try to parse
  let cleanedJson = trimmed;
  
  // Remove BOM if present
  if (cleanedJson.charCodeAt(0) === 0xFEFF) {
    cleanedJson = cleanedJson.slice(1);
  }
  
  // Check if it's base64 encoded (safer option)
  console.log('\n🔍 Checking if JSON is base64 encoded...');
  const isBase64 = (str) => {
    try {
      if (str.length < 10) return false;
      const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
      const cleaned = str.replace(/\s/g, '');
      if (!base64Regex.test(cleaned)) return false;
      const decoded = Buffer.from(cleaned, 'base64').toString('utf8');
      return decoded && decoded.length > 0 && (decoded.startsWith('{') || decoded.startsWith('['));
    } catch {
      return false;
    }
  };
  
  if (isBase64(cleanedJson)) {
    console.log('✅ Detected base64 encoded JSON - decoding...');
    try {
      cleanedJson = Buffer.from(cleanedJson.replace(/\s/g, ''), 'base64').toString('utf8');
      console.log('✅ Base64 decoded successfully!\n');
    } catch (base64Err) {
      console.error('❌ Base64 decoding failed:', base64Err.message);
      return false;
    }
  } else {
    console.log('ℹ️  Not base64 encoded, trying direct JSON parse...\n');
  }
  
  // Remove leading/trailing quotes if double-quoted string
  if ((cleanedJson.startsWith('"') && cleanedJson.endsWith('"')) || 
      (cleanedJson.startsWith("'") && cleanedJson.endsWith("'"))) {
    cleanedJson = cleanedJson.slice(1, -1);
    cleanedJson = cleanedJson.replace(/\\"/g, '"').replace(/\\'/g, "'");
  }
  
  console.log('🔍 Attempting to parse JSON...');
  
  let parsed;
  try {
    parsed = JSON.parse(cleanedJson);
    console.log('✅ JSON is valid!\n');
  } catch (parseErr) {
    console.error('❌ JSON parsing failed!');
    console.error(`   Error: ${parseErr.message}`);
    
    // Try to find the error position
    const posMatch = parseErr.message.match(/position (\d+)/);
    if (posMatch) {
      const pos = parseInt(posMatch[1]);
      const start = Math.max(0, pos - 20);
      const end = Math.min(cleanedJson.length, pos + 20);
      const context = cleanedJson.substring(start, end).replace(/private_key[^,}]*/gi, '[REDACTED]');
      console.error(`   Error at position ${pos}`);
      console.error(`   Context: ...${context}...`);
      console.error(`            ${' '.repeat(Math.min(20, pos - start))}^`);
    }
    
    console.log('\n💡 Common fixes:');
    console.log('   1. Use base64 encoding (recommended): node scripts/encode-json-to-base64.js');
    console.log('   2. Make sure the JSON is properly formatted');
    console.log('   3. Remove any leading/trailing quotes');
    console.log('   4. Escape all quotes inside the JSON: " becomes \\"');
    console.log('   5. Remove any newlines - put everything on one line');
    console.log('   6. In .env.local, use: FIREBASE_SERVICE_ACCOUNT_JSON=\'{"type":"service_account",...}\'');
    return false;
  }
  
  // Validate required fields
  console.log('🔍 Validating required fields...');
  const requiredFields = ['project_id', 'private_key', 'client_email', 'type'];
  const missingFields = requiredFields.filter(field => !parsed[field]);
  
  if (missingFields.length > 0) {
    console.error(`❌ Missing required fields: ${missingFields.join(', ')}`);
    return false;
  }
  
  console.log('✅ All required fields are present');
  console.log(`   Project ID: ${parsed.project_id}`);
  console.log(`   Client Email: ${parsed.client_email}`);
  console.log(`   Type: ${parsed.type}`);
  console.log(`   Private Key: ${parsed.private_key ? 'Present' : 'Missing'} (${parsed.private_key?.length || 0} chars)`);
  
  console.log('\n✅ Firebase Service Account JSON is valid and ready to use!');
  return true;
}

// Run validation
const isValid = validateFirebaseJSON();
process.exit(isValid ? 0 : 1);

