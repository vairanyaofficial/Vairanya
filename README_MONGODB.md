# MongoDB Quick Setup Guide

This is a quick reference guide for setting up MongoDB. For detailed instructions, see [docs/MONGODB_SETUP.md](./docs/MONGODB_SETUP.md).

## Quick Start

### 1. Choose Your MongoDB Option

**Option A: MongoDB Atlas (Cloud - Recommended for Production)**
- Free tier available
- No installation required
- Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)

**Option B: Local MongoDB**
- Install MongoDB on your machine
- Better for development
- See installation instructions in [docs/MONGODB_SETUP.md](./docs/MONGODB_SETUP.md)

### 2. Get Your Connection String

**MongoDB Atlas:**
```
mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
```

**Local MongoDB:**
```
mongodb://localhost:27017/vairanya
```

### 3. Configure Environment Variables

Create a `.env.local` file in the project root:

```env
# Option 1: Full connection string (Recommended)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/vairanya?retryWrites=true&w=majority

# Option 2: Individual components
# MONGODB_HOST=localhost
# MONGODB_PORT=27017
# MONGODB_DATABASE=vairanya
# MONGODB_USERNAME=your-username
# MONGODB_PASSWORD=your-password
```

### 4. Test Your Connection

Run the MongoDB test script:

```bash
npm run test-mongodb
```

You should see:
```
✅ MongoDB connection initialized successfully!
✅ Connected to database: vairanya
✅ All MongoDB tests passed!
```

### 5. Verify in Your Application

Start your development server:

```bash
npm run dev
```

Check the health endpoint:
```
http://localhost:3000/api/health
```

You should see MongoDB status in the response.

## Common Issues

### Connection Timeout
- **MongoDB Atlas:** Check if your IP is whitelisted in Network Access
- **Local:** Verify MongoDB service is running

### Authentication Failed
- Verify username and password are correct
- Check database user permissions

### Environment Variables Not Loading
- Ensure `.env.local` is in the project root
- Restart your development server after changing environment variables

## Next Steps

- Read the full setup guide: [docs/MONGODB_SETUP.md](./docs/MONGODB_SETUP.md)
- Test your connection: `npm run test-mongodb`
- Check application health: `http://localhost:3000/api/health`

## Support

For detailed setup instructions and troubleshooting, see [docs/MONGODB_SETUP.md](./docs/MONGODB_SETUP.md).

