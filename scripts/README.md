# Scripts

This directory contains utility scripts for the Vairanya application.

## Available Scripts

### Seed Products

Seed the database with sample products (50+ products across all categories).

```bash
npm run seed
# or
npm run seed:products
```

**What it does:**
- Seeds 50+ products across all categories:
  - 15 Rings
  - 12 Earrings
  - 10 Pendants
  - 8 Bracelets
  - 8 Necklaces
- Products include diverse metal finishes (gold, rose-gold, silver, platinum)
- Automatically generates SKUs and product IDs
- Skips products that already exist (by slug)

**Requirements:**
- Environment variables must be configured (see `.env.example`)
- Firebase Admin SDK must be initialized
- Database connection must be working

**Output:**
- Success/error messages for each product
- Summary of seeded products
- List of any errors encountered

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

### Seed Products for Development

```bash
# Make sure your .env.local is configured
npm run seed
```

### Seed Products for Production (with confirmation)

Before running in production, make sure:
1. You have a backup of your database
2. You understand that this will add products (duplicates are skipped)
3. Your environment variables are correctly set

```bash
npm run seed
```

## Notes

- The seed script is idempotent - running it multiple times will skip existing products
- Products are identified by their slug, so duplicate slugs will be skipped
- SKUs and product IDs are auto-generated if not provided
- The script handles errors gracefully and continues with remaining products

