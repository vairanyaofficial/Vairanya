#!/usr/bin/env node
/**
 * Script to encode Firebase Service Account JSON to base64
 * Usage: 
 *   node scripts/encode-json-to-base64.js <path-to-serviceAccountKey.json>
 *   or
 *   node scripts/encode-json-to-base64.js (reads from secrets/serviceAccountKey.json)
 * 
 * This is the safest way to store JSON in environment variables.
 */

const fs = require('fs');
const path = require('path');

function encodeJsonToBase64() {
  console.log('🔐 Encoding Firebase Service Account JSON to Base64\n');
  
  // Get file path from command line or use default
  const filePath = process.argv[2] || path.join(__dirname, '..', 'secrets', 'serviceAccountKey.json');
  
  // Check if file exists
  if (!fs.existsSync(filePath)) {
    console.error('❌ File not found:', filePath);
    console.log('\n💡 Usage:');
    console.log('   node scripts/encode-json-to-base64.js <path-to-serviceAccountKey.json>');
    console.log('   or place serviceAccountKey.json in secrets/ folder');
    process.exit(1);
  }
  
  try {
    // Read JSON file
    const jsonContent = fs.readFileSync(filePath, 'utf8');
    
    // Validate JSON
    let parsed;
    try {
      parsed = JSON.parse(jsonContent);
    } catch (parseErr) {
      console.error('❌ Invalid JSON file:', parseErr.message);
      process.exit(1);
    }
    
    // Validate it's a service account JSON
    const requiredFields = ['type', 'project_id', 'private_key', 'client_email'];
    const missingFields = requiredFields.filter(field => !parsed[field]);
    
    if (missingFields.length > 0) {
      console.error(`❌ Missing required fields: ${missingFields.join(', ')}`);
      console.error('   This does not appear to be a valid Firebase service account JSON.');
      process.exit(1);
    }
    
    // Encode to base64
    const base64Encoded = Buffer.from(jsonContent).toString('base64');
    
    console.log('✅ JSON file is valid!');
    console.log(`   Project ID: ${parsed.project_id}`);
    console.log(`   Client Email: ${parsed.client_email}`);
    console.log(`   Type: ${parsed.type}\n`);
    
    console.log('📋 Base64 Encoded String:');
    console.log('─'.repeat(80));
    console.log(base64Encoded);
    console.log('─'.repeat(80));
    
    console.log('\n💡 Next Steps:');
    console.log('   1. Copy the base64 string above');
    console.log('   2. Add to your .env.local file:');
    console.log('      FIREBASE_SERVICE_ACCOUNT_JSON=' + base64Encoded);
    console.log('   3. Or add to Vercel environment variables:');
    console.log('      - Go to Vercel Dashboard → Project Settings → Environment Variables');
    console.log('      - Add FIREBASE_SERVICE_ACCOUNT_JSON');
    console.log('      - Paste the base64 string (no quotes needed!)');
    console.log('      - Select environments (Production, Preview, Development)');
    console.log('   4. Restart your development server');
    
    console.log('\n✅ Base64 encoding is safer than raw JSON because:');
    console.log('   - No quote escaping issues');
    console.log('   - No newline issues');
    console.log('   - Safe for environment variables');
    console.log('   - Automatically decoded by the application');
    
    // Optionally write to .env.local.example
    const envExamplePath = path.join(__dirname, '..', '.env.local.example');
    if (fs.existsSync(envExamplePath)) {
      console.log('\n💡 Tip: Update .env.local.example with:');
      console.log('   FIREBASE_SERVICE_ACCOUNT_JSON=<base64-encoded-json>');
    }
    
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

// Run
encodeJsonToBase64();

