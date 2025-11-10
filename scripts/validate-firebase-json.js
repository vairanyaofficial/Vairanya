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
  console.log('🔍 Validating FIREBASE_SERVICE_ACCOUNT_JSON...\n');
  
  const svcJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  
  if (!svcJson) {
    console.error('❌ FIREBASE_SERVICE_ACCOUNT_JSON is not set in environment variables');
    console.log('\n💡 To set it:');
    console.log('   1. Create a .env.local file in the project root');
    console.log('   2. Add: FIREBASE_SERVICE_ACCOUNT_JSON="your-json-here"');
    console.log('   3. Make sure the entire JSON is on one line');
    return false;
  }
  
  console.log('✅ Environment variable is set');
  console.log(`   Length: ${svcJson.length} characters\n`);
  
  // Show first and last 50 characters (safely)
  const preview = svcJson.substring(0, 50).replace(/private_key["\s:]+"[^"]*/gi, 'private_key:"[REDACTED]"');
  const previewEnd = svcJson.substring(svcJson.length - 50);
  console.log(`   First 50 chars: ${preview}...`);
  console.log(`   Last 50 chars: ...${previewEnd}\n`);
  
  // Check for common issues
  console.log('🔍 Checking for common issues...');
  
  // Check for BOM
  if (svcJson.charCodeAt(0) === 0xFEFF) {
    console.warn('⚠️  Found BOM (Byte Order Mark) at the start - this might cause issues');
  }
  
  // Check for leading/trailing quotes
  const trimmed = svcJson.trim();
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || 
      (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    console.warn('⚠️  JSON is wrapped in quotes - this might need to be removed');
  }
  
  // Check for newlines
  if (svcJson.includes('\n') || svcJson.includes('\r')) {
    console.warn('⚠️  JSON contains newlines - make sure it\'s all on one line');
  }
  
  // Try to parse
  let cleanedJson = trimmed;
  
  // Remove BOM if present
  if (cleanedJson.charCodeAt(0) === 0xFEFF) {
    cleanedJson = cleanedJson.slice(1);
  }
  
  // Remove leading/trailing quotes if double-quoted string
  if ((cleanedJson.startsWith('"') && cleanedJson.endsWith('"')) || 
      (cleanedJson.startsWith("'") && cleanedJson.endsWith("'"))) {
    cleanedJson = cleanedJson.slice(1, -1);
    cleanedJson = cleanedJson.replace(/\\"/g, '"').replace(/\\'/g, "'");
  }
  
  console.log('\n🔍 Attempting to parse JSON...');
  
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
      const context = cleanedJson.substring(start, end);
      console.error(`   Error at position ${pos}`);
      console.error(`   Context: ...${context}...`);
      console.error(`            ${' '.repeat(Math.min(20, pos - start))}^`);
    }
    
    console.log('\n💡 Common fixes:');
    console.log('   1. Make sure the JSON is properly formatted');
    console.log('   2. Remove any leading/trailing quotes');
    console.log('   3. Escape all quotes inside the JSON: " becomes \\"');
    console.log('   4. Remove any newlines - put everything on one line');
    console.log('   5. In .env.local, use: FIREBASE_SERVICE_ACCOUNT_JSON=\'{"type":"service_account",...}\'');
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

