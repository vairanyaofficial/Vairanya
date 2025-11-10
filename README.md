# Vairanya E-commerce Platform

A modern e-commerce platform built with Next.js, Firebase, and MongoDB.

## Features

- Product management
- Order processing
- User authentication
- Admin dashboard
- Worker dashboard
- Payment integration (Razorpay)
- Image management (ImageKit)

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- MongoDB (Atlas or Local)
- Firebase project

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables (see `.env.example`):
   ```bash
   cp .env.example .env.local
   ```

4. Configure MongoDB:
   - See [MongoDB Setup Guide](./docs/MONGODB_SETUP.md)
   - Quick start: [README_MONGODB.md](./README_MONGODB.md)
   - Test connection: `npm run test-mongodb`

5. Configure Firebase:
   - See [Firebase Setup Guide](./docs/FIREBASE_SETUP.md)

6. Run development server:
   ```bash
   npm run dev
   ```

## MongoDB Setup

MongoDB is used as a fallback database. For detailed setup instructions:

- **Quick Start**: [README_MONGODB.md](./README_MONGODB.md)
- **Detailed Guide**: [docs/MONGODB_SETUP.md](./docs/MONGODB_SETUP.md)
- **Setup Checklist**: [docs/MONGODB_CHECKLIST.md](./docs/MONGODB_CHECKLIST.md)
- **Quick Reference**: [docs/MONGODB_SETUP_SUMMARY.md](./docs/MONGODB_SETUP_SUMMARY.md)

### Quick MongoDB Setup

1. Get MongoDB connection string (Atlas or Local)
2. Add to `.env.local`:
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
   ```
3. Test connection:
   ```bash
   npm run test-mongodb
   ```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run test-mongodb` - Test MongoDB connection
- `npm run validate-env` - Validate environment variables

## Project Structure

```
├── app/              # Next.js app directory
├── components/       # React components
├── lib/             # Utility functions and database adapters
├── docs/            # Documentation
└── scripts/         # Utility scripts
```

## Database

The application uses:
- **Firebase** (Firestore) - Primary database
- **MongoDB** - Fallback/backup database

The application automatically falls back to MongoDB if Firebase is unavailable.

## Health Check

Check application health:
```
GET /api/health
```

Returns status of Firebase and MongoDB connections.

## Documentation

- [MongoDB Setup](./docs/MONGODB_SETUP.md)
- [Firebase Setup](./docs/FIREBASE_SETUP.md)
- [MongoDB Checklist](./docs/MONGODB_CHECKLIST.md)

## License

Private project

