# MongoDB Setup Instructions

## Quick Configuration

### 1. Add MongoDB URI to .env file

Open your `.env` file (create it if it doesn't exist) and add one of the following:

#### Method 1: Full Connection URI (Recommended)
```env
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/vairanya?retryWrites=true&w=majority
```

#### Method 2: Individual Components
```env
MONGODB_HOST=cluster0.xxxxx.mongodb.net
MONGODB_DATABASE=vairanya
MONGODB_USERNAME=your_username
MONGODB_PASSWORD=your_password
```

### 2. Get Your Connection String from MongoDB Atlas

1. Go to https://cloud.mongodb.com
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Copy the connection string
5. Replace `<password>` with your actual password
6. Replace `<database>` with `vairanya`

### 3. Test the Connection

```bash
npm run test-mongodb
```

### 4. Restart Your Server

```bash
npm run dev
```

## Configuration Priority

The application checks for MongoDB configuration in this order:

1. `MONGODB_URI` (highest priority)
2. `MONGODB_CONNECTION_STRING`
3. Individual components (`MONGODB_HOST`, `MONGODB_DATABASE`, etc.)

## Common Issues

### Cluster is Paused/Shut Down

**Symptoms:**
- SSL/TLS errors
- "tlsv1 alert internal error"
- Connection timeout

**Solution:**
1. Go to MongoDB Atlas Dashboard
2. Find your cluster (cluster0)
3. Click "Resume" button
4. Wait 2-3 minutes

### Connection String Not Found

**Solution:**
- Make sure `MONGODB_URI` is set in your `.env` file
- Check for typos in variable name
- Restart your development server after adding the variable

### Authentication Failed

**Solution:**
- Verify username and password are correct
- Check database user exists in MongoDB Atlas
- Verify user has proper permissions

## Disable MongoDB (Temporary)

If you need to temporarily disable MongoDB:

```env
MONGODB_DISABLED=true
```

## More Information

- **Quick Setup:** See [docs/MONGODB_QUICK_SETUP.md](./docs/MONGODB_QUICK_SETUP.md)
- **Detailed Config:** See [docs/MONGODB_CONFIG.md](./docs/MONGODB_CONFIG.md)
- **Full Setup Guide:** See [docs/MONGODB_SETUP.md](./docs/MONGODB_SETUP.md)



