// scripts/postbuild-check.js
// Post-build environment validation check
// This runs after build to validate environment variables in production

// Only run validation if:
// 1. Not on Vercel (Vercel handles env vars differently)
// 2. NODE_ENV is production
// 3. SKIP_ENV_VALIDATION is not set
if (
  !process.env.VERCEL &&
  process.env.NODE_ENV === 'production' &&
  !process.env.SKIP_ENV_VALIDATION
) {
  try {
    const { execSync } = require('child_process');
    console.log('🔍 Running environment validation...');
    execSync('npm run validate-env', { stdio: 'inherit' });
  } catch (error) {
    // Don't fail the build - just warn
    console.warn('⚠️  Environment validation failed or skipped:', error.message);
    console.warn('⚠️  You can skip validation by setting SKIP_ENV_VALIDATION=true');
    // Exit with 0 to not fail the build
    process.exit(0);
  }
} else {
  if (process.env.VERCEL) {
    console.log('ℹ️  Skipping env validation on Vercel (env vars are managed by Vercel)');
  } else if (process.env.NODE_ENV !== 'production') {
    console.log('ℹ️  Skipping env validation (not in production mode)');
  } else if (process.env.SKIP_ENV_VALIDATION) {
    console.log('ℹ️  Skipping env validation (SKIP_ENV_VALIDATION is set)');
  }
}
