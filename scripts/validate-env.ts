// scripts/validate-env.ts
// Environment variables validation script
// Run this before starting the production server

import { validateEnv } from "../lib/env-validation";

const result = validateEnv();

if (!result.isValid) {
  console.error("❌ Environment validation failed!");
  console.error("\nMissing required environment variables:");
  result.missing.forEach((varName) => {
    console.error(`  - ${varName}`);
  });
  process.exit(1);
}

if (result.warnings.length > 0) {
  console.warn("⚠️  Environment validation warnings:");
  result.warnings.forEach((warning) => {
    console.warn(`  - ${warning}`);
  });
}

if (result.isValid && result.warnings.length === 0) {
  console.log("✅ All environment variables are properly configured!");
}

process.exit(0);
