# MongoDB Setup Guide

This guide will help you set up MongoDB for the Vairanya project step by step.

## Table of Contents
1. [Overview](#overview)
2. [Option 1: MongoDB Atlas (Cloud - Recommended)](#option-1-mongodb-atlas-cloud---recommended)
3. [Option 2: Local MongoDB Installation](#option-2-local-mongodb-installation)
4. [Configuration](#configuration)
5. [Testing the Connection](#testing-the-connection)
6. [Troubleshooting](#troubleshooting)

## Overview

MongoDB is used as a fallback database (primary is Firebase). The application will automatically use MongoDB if Firebase is unavailable or as a backup data store.

## Option 1: MongoDB Atlas (Cloud - Recommended)

MongoDB Atlas is a cloud-hosted MongoDB service. It's free for development and easy to set up.

### Step 1: Create MongoDB Atlas Account

1. Go to [https://www.mongodb.com/cloud/atlas/register](https://www.mongodb.com/cloud/atlas/register)
2. Sign up for a free account
3. Verify your email address

### Step 2: Create a Cluster

1. After logging in, click **"Build a Database"**
2. Choose the **FREE** tier (M0)
3. Select a cloud provider and region (choose one close to your users)
4. Give your cluster a name (e.g., "vairanya-cluster")
5. Click **"Create"**

### Step 3: Create Database User

1. Go to **Database Access** in the left sidebar
2. Click **"Add New Database User"**
3. Choose **"Password"** authentication
4. Enter a username (e.g., "vairanya-admin")
5. Click **"Autogenerate Secure Password"** or create your own
6. **Save the password** - you'll need it for the connection string
7. Set user privileges to **"Atlas admin"** (for development) or create a custom role
8. Click **"Add User"**

### Step 4: Configure Network Access

1. Go to **Network Access** in the left sidebar
2. Click **"Add IP Address"**
3. For development, click **"Allow Access from Anywhere"** (adds `0.0.0.0/0`)
   - ⚠️ **Security Note**: For production, add only specific IP addresses
4. Click **"Confirm"**

### Step 5: Get Connection String

1. Go to **Database** in the left sidebar
2. Click **"Connect"** on your cluster
3. Choose **"Connect your application"**
4. Select **"Node.js"** as the driver and version **6.0 or later**
5. Copy the connection string (it looks like: `mongodb+srv://username:password@cluster.mongodb.net/`)
6. Replace `<password>` with your database user password
7. Replace `<database>` with your database name (e.g., "vairanya")

**Example connection string:**
```
mongodb+srv://vairanya-admin:your-password@vairanya-cluster.xxxxx.mongodb.net/vairanya?retryWrites=true&w=majority
```

### Step 6: Add to Environment Variables

1. Create a `.env.local` file in the root of your project (if it doesn't exist)
2. Add the connection string:

```env
MONGODB_URI=mongodb+srv://vairanya-admin:your-password@vairanya-cluster.xxxxx.mongodb.net/vairanya?retryWrites=true&w=majority
```

Or alternatively, use individual components:

```env
MONGODB_HOST=cluster.xxxxx.mongodb.net
MONGODB_DATABASE=vairanya
MONGODB_USERNAME=vairanya-admin
MONGODB_PASSWORD=your-password
```

## Option 2: Local MongoDB Installation

### Windows Installation

#### Step 1: Download MongoDB

1. Go to [https://www.mongodb.com/try/download/community](https://www.mongodb.com/try/download/community)
2. Select:
   - Version: Latest stable (e.g., 7.0)
   - Platform: Windows
   - Package: MSI
3. Click **"Download"**

#### Step 2: Install MongoDB

1. Run the downloaded MSI installer
2. Choose **"Complete"** installation
3. Select **"Install MongoDB as a Service"**
4. Service Name: `MongoDB`
5. Run service as: **Network Service user**
6. Check **"Install MongoDB Compass"** (GUI tool - optional but recommended)
7. Click **"Install"**

#### Step 3: Verify Installation

1. Open Command Prompt or PowerShell as Administrator
2. Check if MongoDB service is running:
   ```powershell
   Get-Service MongoDB
   ```
3. If not running, start it:
   ```powershell
   Start-Service MongoDB
   ```

#### Step 4: Create Database and User (Optional but Recommended)

1. Open MongoDB Compass or connect via `mongosh`:
   ```powershell
   mongosh
   ```

2. Create a database:
   ```javascript
   use vairanya
   ```

3. Create a user:
   ```javascript
   db.createUser({
     user: "vairanya-admin",
     pwd: "your-secure-password",
     roles: [{ role: "readWrite", db: "vairanya" }]
   })
   ```

#### Step 5: Configure Connection String

Add to your `.env.local` file:

**With authentication:**
```env
MONGODB_URI=mongodb://vairanya-admin:your-secure-password@localhost:27017/vairanya?authSource=vairanya
```

**Without authentication (development only):**
```env
MONGODB_URI=mongodb://localhost:27017/vairanya
```

### macOS Installation

#### Step 1: Install using Homebrew

```bash
# Install Homebrew if you don't have it
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install MongoDB
brew tap mongodb/brew
brew install mongodb-community@7.0
```

#### Step 2: Start MongoDB Service

```bash
brew services start mongodb-community@7.0
```

#### Step 3: Verify Installation

```bash
mongosh
```

#### Step 4: Configure Connection String

Add to your `.env.local` file:

```env
MONGODB_URI=mongodb://localhost:27017/vairanya
```

### Linux Installation

#### Step 1: Import MongoDB Public GPG Key

```bash
curl -fsSL https://pgp.mongodb.com/server-7.0.asc | \
   sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg \
   --dearmor
```

#### Step 2: Add MongoDB Repository

**For Ubuntu/Debian:**
```bash
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
```

**For RHEL/CentOS:**
```bash
echo "[mongodb-org-7.0]
name=MongoDB Repository
baseurl=https://repo.mongodb.org/yum/redhat/$releasever/mongodb-org/7.0/x86_64/
gpgcheck=1
enabled=1
gpgkey=https://pgp.mongodb.com/server-7.0.asc" | sudo tee /etc/yum.repos.d/mongodb-org-7.0.repo
```

#### Step 3: Install MongoDB

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install -y mongodb-org
```

**RHEL/CentOS:**
```bash
sudo yum install -y mongodb-org
```

#### Step 4: Start MongoDB Service

```bash
sudo systemctl start mongod
sudo systemctl enable mongod
```

#### Step 5: Configure Connection String

Add to your `.env.local` file:

```env
MONGODB_URI=mongodb://localhost:27017/vairanya
```

## Configuration

### Environment Variables

The application supports multiple ways to configure MongoDB:

#### Method 1: Full Connection String (Recommended)

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
```

#### Method 2: Individual Components

```env
MONGODB_HOST=localhost
MONGODB_PORT=27017
MONGODB_DATABASE=vairanya
MONGODB_USERNAME=vairanya-admin
MONGODB_PASSWORD=your-password
MONGODB_OPTIONS=retryWrites=true&w=majority
```

#### Method 3: Alternative Connection String Name

```env
MONGODB_CONNECTION_STRING=mongodb://localhost:27017/vairanya
```

### Environment File Setup

1. Copy the example environment file:
   ```bash
   cp .env.example .env.local
   ```

2. Edit `.env.local` and add your MongoDB connection string

3. **Never commit `.env.local` to git** - it contains sensitive information

## Testing the Connection

### Method 1: Using the Test Script

Run the MongoDB connection test script:

```bash
npm run test-mongodb
```

This will:
- Validate your environment variables
- Test the MongoDB connection
- Display connection status and diagnostics

### Method 2: Using the Health Check API

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Visit the health check endpoint:
   ```
   http://localhost:3000/api/health
   ```

3. Check the response for MongoDB status

### Method 3: Manual Test

Create a test file `test-mongo.js`:

```javascript
const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI || process.env.MONGODB_CONNECTION_STRING;

async function testConnection() {
  try {
    const client = new MongoClient(uri);
    await client.connect();
    console.log('✅ MongoDB connection successful!');
    
    const db = client.db();
    const collections = await db.listCollections().toArray();
    console.log('Collections:', collections.map(c => c.name));
    
    await client.close();
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
}

testConnection();
```

Run it:
```bash
node test-mongo.js
```

## Troubleshooting

### Connection Timeout

**Problem:** Connection times out when trying to connect.

**Solutions:**
1. **MongoDB Atlas:** Check if your IP address is whitelisted in Network Access
2. **Local MongoDB:** Verify MongoDB service is running:
   - Windows: `Get-Service MongoDB`
   - macOS: `brew services list`
   - Linux: `sudo systemctl status mongod`
3. **Firewall:** Check if port 27017 (or 27018, 27019 for replica sets) is open

### Authentication Failed

**Problem:** "Authentication failed" error.

**Solutions:**
1. Verify username and password are correct
2. Check if the database user has proper permissions
3. For MongoDB Atlas, ensure you're using the correct database user (not your Atlas account)
4. For local MongoDB, verify the authSource parameter in the connection string

### Invalid Connection String

**Problem:** "Invalid connection string" error.

**Solutions:**
1. Ensure the connection string is properly formatted
2. URL-encode special characters in password (use `encodeURIComponent()`)
3. Check for extra spaces or quotes in the environment variable
4. Verify the database name is correct

### Database Not Found

**Problem:** Database doesn't exist.

**Solutions:**
1. MongoDB will create the database automatically on first write
2. You can manually create it using MongoDB Compass or mongosh:
   ```javascript
   use vairanya
   db.createCollection("products")
   ```

### SSL/TLS Errors (MongoDB Atlas)

**Problem:** SSL/TLS connection errors.

**Solutions:**
1. MongoDB Atlas requires SSL by default - ensure your connection string includes SSL parameters
2. For local development with Atlas, you may need to install certificates
3. Connection string should start with `mongodb+srv://` for Atlas (handles SSL automatically)

### Environment Variables Not Loading

**Problem:** Environment variables are not being read.

**Solutions:**
1. Ensure `.env.local` is in the project root directory
2. Restart your development server after changing environment variables
3. Verify the variable names match exactly (case-sensitive)
4. Check for typos in the variable names

### Connection Pool Exhausted

**Problem:** "Too many connections" error.

**Solutions:**
1. The connection pool is configured with `maxPoolSize: 10` - this should be sufficient for most applications
2. Ensure you're closing connections properly (the app handles this automatically)
3. For MongoDB Atlas Free tier, there's a limit of 500 connections - upgrade if needed

## Next Steps

After setting up MongoDB:

1. ✅ Test the connection using the test script
2. ✅ Verify the health check endpoint works
3. ✅ Check that your application can read/write to MongoDB
4. ✅ Set up database indexes for better performance (optional)
5. ✅ Configure backups (for production)

## Additional Resources

- [MongoDB Documentation](https://docs.mongodb.com/)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [MongoDB Node.js Driver Documentation](https://mongodb.github.io/node-mongodb-native/)
- [MongoDB University](https://university.mongodb.com/) - Free courses

## Support

If you encounter issues:
1. Check the [Troubleshooting](#troubleshooting) section
2. Review MongoDB logs:
   - Windows: `C:\Program Files\MongoDB\Server\7.0\log\mongod.log`
   - macOS: `/usr/local/var/log/mongodb/mongo.log`
   - Linux: `/var/log/mongodb/mongod.log`
3. Check the application logs for detailed error messages

