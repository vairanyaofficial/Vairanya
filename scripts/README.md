# Scripts

This directory contains utility scripts for the Vairanya application.

## Available Scripts

### Validate Environment

Validate that all required environment variables are set.

```bash
npm run validate-env
```

**What it checks:**
- Firebase configuration
- Razorpay keys (optional but recommended)
- NextAuth configuration (optional but recommended)
- Other required variables

## Usage Examples

### Validate Environment Before Deployment

```bash
# Make sure your .env.local is configured
npm run validate-env
```

The validate-env script runs automatically after each build as part of the `postbuild` script.

## Notes

- The validate-env script is essential for ensuring all required environment variables are properly configured
- It provides clear error messages if any required variables are missing
- Run this script before deploying to production
