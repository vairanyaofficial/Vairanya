# MongoDB Configuration Guide

This guide explains how to configure MongoDB connection for the Vairanya application.

## Configuration Methods

The application supports **three methods** to configure MongoDB connection. Choose the one that works best for you.

### Method 1: Full Connection URI (Recommended)

This is the simplest and most common method, especially for MongoDB Atlas.

**Format:**
- **MongoDB Atlas:** `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/database?retryWrites=true&w=majority`
- **Self-hosted:** `mongodb://username:password@host:port/database`

**Example for MongoDB Atlas:**
```env
MONGODB_URI=mongodb+srv://myuser:mypassword@cluster0.abc123.mongodb.net/vairanya?retryWrites=true&w=majority
```

**How to get your connection string from MongoDB Atlas:**
1. Go to [MongoDB Atlas Dashboard](https://cloud.mongodb.com)
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Copy the connection string
5. Replace `<password>` with your database user password
6. Replace `<database>` with your database name (e.g., `vairanya`)

### Method 2: Alternative Connection String

If you prefer using `MONGODB_CONNECTION_STRING` instead of `MONGODB_URI`:

```env
MONGODB_CONNECTION_STRING=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/vairanya?retryWrites=true&w=majority
```

### Method 3: Individual Components

For more granular control, you can specify each component separately:

```env
# For MongoDB Atlas (mongodb+srv://)
MONGODB_HOST=cluster0.abc123.mongodb.net
MONGODB_DATABASE=vairanya
MONGODB_USERNAME=myuser
MONGODB_PASSWORD=mypassword
# MONGODB_PORT is not needed for Atlas (mongodb+srv://)

# Optional: Additional connection options
MONGODB_OPTIONS=retryWrites=true&w=majority
```

```env
# For self-hosted MongoDB (mongodb://)
MONGODB_HOST=localhost
MONGODB_PORT=27017
MONGODB_DATABASE=vairanya
MONGODB_USERNAME=myuser
MONGODB_PASSWORD=mypassword
```

## Priority Order

The application checks for MongoDB configuration in this order:
1. `MONGODB_URI` (highest priority)
2. `MONGODB_CONNECTION_STRING`
3. Individual components (`MONGODB_HOST`, `MONGODB_DATABASE`, etc.)

## Disabling MongoDB

If you want to temporarily disable MongoDB (e.g., during development or when the cluster is down):

```env
MONGODB_DISABLED=true
```

When disabled, the application will:
- Return appropriate error messages
- Not attempt to connect to MongoDB
- Cache connection failures to avoid repeated retries

## Configuration Examples

### Example 1: MongoDB Atlas (Free Tier)

```env
MONGODB_URI=mongodb+srv://admin:MySecurePassword123@cluster0.abc123.mongodb.net/vairanya?retryWrites=true&w=majority
```

### Example 2: MongoDB Atlas with Individual Components

```env
MONGODB_HOST=cluster0.abc123.mongodb.net
MONGODB_DATABASE=vairanya
MONGODB_USERNAME=admin
MONGODB_PASSWORD=MySecurePassword123
```

### Example 3: Local MongoDB Development

```env
MONGODB_URI=mongodb://localhost:27017/vairanya
```

Or with authentication:
```env
MONGODB_HOST=localhost
MONGODB_PORT=27017
MONGODB_DATABASE=vairanya
MONGODB_USERNAME=devuser
MONGODB_PASSWORD=devpassword
```

## Troubleshooting

### Connection Errors

If you see connection errors:

1. **Check your connection string format:**
   - MongoDB Atlas: Must use `mongodb+srv://`
   - Self-hosted: Use `mongodb://`

2. **Verify credentials:**
   - Username and password are correct
   - Database user has proper permissions

3. **Check network access:**
   - MongoDB Atlas: Ensure your IP is whitelisted in Network Access
   - Firewall: Ensure port 27017 (or 27017-27019) is open

4. **Cluster status:**
   - MongoDB Atlas: Ensure cluster is not paused
   - Check cluster status in MongoDB Atlas dashboard

### SSL/TLS Errors

If you see SSL/TLS errors (like "tlsv1 alert internal error"):
- **Cluster is paused:** Resume your MongoDB Atlas cluster
- **Network issues:** Check your internet connection
- **Certificate issues:** Usually indicates cluster is down or paused

### Common Error Messages

**"MongoDB connection string not found"**
- Solution: Set `MONGODB_URI` or `MONGODB_CONNECTION_STRING` in your `.env` file

**"MongoDB authentication failed"**
- Solution: Check your username and password
- Verify database user exists and has correct permissions

**"MongoDB DNS resolution failed"**
- Solution: Check your hostname/cluster name
- Verify cluster exists and is not deleted

**"MongoDB connection timeout"**
- Solution: Check network connectivity
- Verify IP is whitelisted in MongoDB Atlas
- Check firewall settings

## Security Best Practices

1. **Never commit `.env` file to git:**
   - Add `.env` to `.gitignore`
   - Use `.env.example` for documentation

2. **Use strong passwords:**
   - Use complex passwords for database users
   - Rotate passwords regularly

3. **Restrict network access:**
   - MongoDB Atlas: Whitelist only necessary IPs
   - Use VPC peering for production

4. **Use environment-specific configurations:**
   - Different credentials for development, staging, production
   - Use secret management services in production

## Testing Your Configuration

After configuring MongoDB, test the connection:

1. **Check server logs:**
   - Look for `✅ MongoDB connected successfully` message
   - Check for any error messages

2. **Test API endpoints:**
   - Try accessing `/api/admin/products`
   - Check if data is being fetched from MongoDB

3. **Check diagnostics:**
   - Use `getMongoDBDiagnostics()` function to verify configuration
   - Check if MongoDB is available and properly configured

## Next Steps

1. Copy `.env.example` to `.env`
2. Fill in your MongoDB connection details
3. Restart your development server
4. Check server logs for connection status
5. Test API endpoints to verify connectivity

For more information, see [MONGODB_SETUP.md](./MONGODB_SETUP.md).



