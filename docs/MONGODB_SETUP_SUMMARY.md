# MongoDB Setup Summary

## Quick Reference

### 1. Installation Options

| Option | Best For | Setup Time | Cost |
|--------|----------|------------|------|
| MongoDB Atlas | Production, Cloud | 5 minutes | Free tier available |
| Local MongoDB | Development, Testing | 15-30 minutes | Free |

### 2. Environment Variables

Add to `.env.local`:

```env
# Recommended: Full connection string
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority

# Alternative: Individual components
MONGODB_HOST=localhost
MONGODB_PORT=27017
MONGODB_DATABASE=vairanya
MONGODB_USERNAME=username
MONGODB_PASSWORD=password
```

### 3. Testing

```bash
# Test MongoDB connection
npm run test-mongodb

# Check health endpoint
curl http://localhost:3000/api/health
```

### 4. Common Connection Strings

**MongoDB Atlas:**
```
mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
```

**Local MongoDB (no auth):**
```
mongodb://localhost:27017/vairanya
```

**Local MongoDB (with auth):**
```
mongodb://username:password@localhost:27017/vairanya?authSource=vairanya
```

### 5. Verification Steps

1. ✅ Environment variable is set
2. ✅ Connection test passes: `npm run test-mongodb`
3. ✅ Health endpoint shows MongoDB status: `/api/health`
4. ✅ Application can read/write data

### 6. Troubleshooting Quick Fixes

| Issue | Solution |
|-------|----------|
| Connection timeout | Check IP whitelist (Atlas) or service status (local) |
| Authentication failed | Verify username/password |
| Database not found | MongoDB creates it automatically on first write |
| Environment variables not loading | Restart dev server, check `.env.local` location |

## Next Steps

- Full setup guide: [MONGODB_SETUP.md](./MONGODB_SETUP.md)
- Quick start: [README_MONGODB.md](../README_MONGODB.md)
- Test connection: `npm run test-mongodb`

