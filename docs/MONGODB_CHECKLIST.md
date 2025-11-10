# MongoDB Setup Checklist

Use this checklist to ensure MongoDB is properly configured.

## Pre-Setup

- [ ] Decide on MongoDB option (Atlas Cloud or Local)
- [ ] Review system requirements
- [ ] Have admin/sudo access (for local installation)

## MongoDB Atlas Setup (Cloud)

- [ ] Created MongoDB Atlas account
- [ ] Created a cluster (free tier M0)
- [ ] Created database user with password
- [ ] Whitelisted IP address (or allowed all for development)
- [ ] Copied connection string
- [ ] Replaced `<password>` and `<database>` in connection string

## Local MongoDB Setup

- [ ] Downloaded MongoDB installer
- [ ] Installed MongoDB on system
- [ ] MongoDB service is running
- [ ] Verified installation with `mongosh` or MongoDB Compass
- [ ] (Optional) Created database user
- [ ] (Optional) Created database

## Configuration

- [ ] Created `.env.local` file in project root
- [ ] Added `MONGODB_URI` or connection string components
- [ ] Verified no typos in environment variables
- [ ] Ensured `.env.local` is in `.gitignore` (should not be committed)

## Testing

- [ ] Ran `npm run test-mongodb` - Connection test passed
- [ ] Started development server: `npm run dev`
- [ ] Checked health endpoint: `http://localhost:3000/api/health`
- [ ] Verified MongoDB status shows "ok" in health response
- [ ] Tested application functionality (e.g., product listing)

## Verification

- [ ] MongoDB connection string is valid
- [ ] Database is accessible
- [ ] Can read from database
- [ ] Can write to database (if tested)
- [ ] Health check endpoint shows MongoDB as available
- [ ] No connection errors in application logs

## Troubleshooting (if needed)

- [ ] Checked MongoDB server status
- [ ] Verified firewall/network settings
- [ ] Checked IP whitelist (for Atlas)
- [ ] Verified username/password
- [ ] Checked MongoDB logs for errors
- [ ] Reviewed application error logs
- [ ] Consulted troubleshooting guide in [MONGODB_SETUP.md](./MONGODB_SETUP.md)

## Production Checklist (if deploying)

- [ ] Using MongoDB Atlas (recommended for production)
- [ ] Created production database user (not admin)
- [ ] Set up proper IP whitelist (not 0.0.0.0/0)
- [ ] Enabled database backups
- [ ] Set up monitoring/alerts
- [ ] Configured connection pooling appropriately
- [ ] Set up database indexes for performance
- [ ] Environment variables configured in production environment
- [ ] Tested connection in production environment

## Next Steps

- [ ] Read full documentation: [MONGODB_SETUP.md](./MONGODB_SETUP.md)
- [ ] Set up database indexes (optional, for performance)
- [ ] Configure backups (for production)
- [ ] Set up monitoring (for production)

---

## Quick Test Command

```bash
# Test MongoDB connection
npm run test-mongodb

# Check health endpoint
curl http://localhost:3000/api/health
```

## Support

If you encounter issues:
1. Check [MONGODB_SETUP.md](./MONGODB_SETUP.md) troubleshooting section
2. Review MongoDB logs
3. Check application logs
4. Verify environment variables

