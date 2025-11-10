# MongoDB Quick Setup Guide

## Step 1: Get Your MongoDB Connection String

### For MongoDB Atlas (Recommended):

1. **Go to MongoDB Atlas Dashboard:** https://cloud.mongodb.com
2. **Click "Connect"** on your cluster
3. **Choose "Connect your application"**
4. **Select Node.js driver** and copy the connection string
5. **Replace placeholders:**
   - Replace `<password>` with your database user password
   - Replace `<database>` with `vairanya` (or your database name)

**Example connection string:**
```
mongodb+srv://username:password@cluster0.abc123.mongodb.net/vairanya?retryWrites=true&w=majority
```

## Step 2: Configure in .env File

Create or edit your `.env` file in the project root and add:

### Option A: Full Connection URI (Recommended)
```env
MONGODB_URI=mongodb+srv://username:password@cluster0.abc123.mongodb.net/vairanya?retryWrites=true&w=majority
```

### Option B: Individual Components
```env
MONGODB_HOST=cluster0.abc123.mongodb.net
MONGODB_DATABASE=vairanya
MONGODB_USERNAME=your_username
MONGODB_PASSWORD=your_password
```

## Step 3: Verify Configuration

Run the test script to verify your MongoDB connection:

```bash
npm run test-mongodb
```

You should see:
```
✅ MongoDB connected successfully!
✅ Database: vairanya
✅ Collections found: [list of collections]
```

## Step 4: Restart Your Server

After configuring, restart your development server:

```bash
npm run dev
```

Check the server logs for:
```
✅ MongoDB connected successfully to cluster0.abc123.mongodb.net (database: vairanya)
```

## Troubleshooting

### Error: "MongoDB connection string not found"
- **Solution:** Make sure `MONGODB_URI` is set in your `.env` file

### Error: "MongoDB authentication failed"
- **Solution:** Check your username and password in the connection string

### Error: "SSL/TLS connection error" or "tlsv1 alert internal error"
- **Solution:** Your MongoDB Atlas cluster is paused. Resume it from the MongoDB Atlas dashboard.

### Error: "DNS resolution failed"
- **Solution:** 
  - Check your cluster hostname
  - Verify cluster exists and is not deleted
  - Check your internet connection

### Cluster is Paused
1. Go to MongoDB Atlas Dashboard
2. Find your cluster (cluster0)
3. Click "Resume" button
4. Wait 2-3 minutes for cluster to resume

## Important Notes

1. **Never commit `.env` file to git** - It contains sensitive credentials
2. **Keep your password secure** - Use strong passwords
3. **Whitelist IP addresses** - In MongoDB Atlas, go to Network Access and add your IP
4. **For production:** Use environment-specific credentials

## Next Steps

- ✅ Test MongoDB connection: `npm run test-mongodb`
- ✅ Check server logs for connection status
- ✅ Test API endpoints: `/api/admin/products`
- ✅ Verify data is being fetched from MongoDB

For detailed configuration options, see [MONGODB_CONFIG.md](./MONGODB_CONFIG.md).

