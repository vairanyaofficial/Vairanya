// scripts/generate-nextauth-secret.js
// Helper script to generate NEXTAUTH_SECRET

const crypto = require('crypto');

// Generate a random 32-byte secret and encode it as base64
const secret = crypto.randomBytes(32).toString('base64');

console.log('='.repeat(60));
console.log('NEXTAUTH_SECRET Generated:');
console.log('='.repeat(60));
console.log(secret);
console.log('='.repeat(60));
console.log('\nCopy this value and add it to your .env.local file:');
console.log(`NEXTAUTH_SECRET=${secret}`);
console.log('\n⚠️  Keep this secret safe and never commit it to git!');
console.log('='.repeat(60));

