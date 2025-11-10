const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Read the .env file
const envPath = path.join(__dirname, '.env');
let content = fs.readFileSync(envPath, 'utf8');

console.log('🔧 Fixing .env file...\n');

// 1. Remove the multiline FIREBASE_SERVICE_ACCOUNT_JSON (since we're using file-based approach)
console.log('1. Removing multiline FIREBASE_SERVICE_ACCOUNT_JSON...');
const multilineJsonRegex = /FIREBASE_SERVICE_ACCOUNT_JSON=\{[\s\S]*?^\}/m;
content = content.replace(multilineJsonRegex, '# FIREBASE_SERVICE_ACCOUNT_JSON commented out - using GOOGLE_APPLICATION_CREDENTIALS file instead');

// 2. Fix ADMIN_SESSION_SECRET (it has Firebase JSON instead of a secret)
console.log('2. Fixing ADMIN_SESSION_SECRET...');
const adminSecretRegex = /ADMIN_SESSION_SECRET=\{[\s\S]*?^\}/m;
const randomSecret = crypto.randomBytes(32).toString('hex');
content = content.replace(adminSecretRegex, `ADMIN_SESSION_SECRET=${randomSecret}`);

// 3. Remove duplicate GOOGLE_APPLICATION_CREDENTIALS
console.log('3. Removing duplicate GOOGLE_APPLICATION_CREDENTIALS...');
// Keep only the first one, remove the duplicate
const lines = content.split('\n');
let seenGoogleCreds = false;
const cleanedLines = lines.filter(line => {
  if (line.includes('GOOGLE_APPLICATION_CREDENTIALS') && !line.trim().startsWith('#')) {
    if (seenGoogleCreds) {
      return false; // Skip duplicate
    }
    seenGoogleCreds = true;
  }
  return true;
});
content = cleanedLines.join('\n');

// 4. Fix NEXTAUTH_SECRET if it's still the placeholder
console.log('4. Checking NEXTAUTH_SECRET...');
if (content.includes('NEXTAUTH_SECRET="replace-with-a-strong-random-string"')) {
  const nextAuthSecret = crypto.randomBytes(32).toString('hex');
  content = content.replace(
    'NEXTAUTH_SECRET="replace-with-a-strong-random-string"',
    `NEXTAUTH_SECRET="${nextAuthSecret}"`
  );
  console.log('   Generated new NEXTAUTH_SECRET');
}

// Write the fixed content
const backupPath = path.join(__dirname, '.env.backup');
const fixedPath = path.join(__dirname, '.env.fixed');

// Create backup
fs.writeFileSync(backupPath, fs.readFileSync(envPath));
console.log(`\n✅ Backup created: .env.backup`);

// Write fixed version
fs.writeFileSync(fixedPath, content);
console.log(`✅ Fixed version created: .env.fixed`);
console.log(`\n📋 Summary of changes:`);
console.log(`   - Removed multiline FIREBASE_SERVICE_ACCOUNT_JSON (using file-based approach instead)`);
console.log(`   - Fixed ADMIN_SESSION_SECRET with random value: ${randomSecret.substring(0, 20)}...`);
console.log(`   - Removed duplicate GOOGLE_APPLICATION_CREDENTIALS`);
console.log(`\n⚠️  Next steps:`);
console.log(`   1. Review .env.fixed`);
console.log(`   2. If it looks good, replace .env with it:`);
console.log(`      mv .env.fixed .env`);
console.log(`   3. Restart your dev server`);

