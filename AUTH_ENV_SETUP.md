# Authentication Environment Variables Setup Guide

## Overview
यह guide आपको authentication के लिए required environment variables setup करने में मदद करेगी।

## Required Environment Variables

### 1. NextAuth Secret (ज़रूरी)
```env
NEXTAUTH_SECRET=your-secret-key-here
```

**कैसे generate करें:**
```bash
# Option 1: OpenSSL (recommended)
openssl rand -base64 32

# Option 2: Online generator
# Visit: https://generate-secret.vercel.app/32

# Option 3: Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**नोट:** यह secret key बहुत important है - इसे कभी share न करें!

### 2. NextAuth URL (ज़रूरी)
```env
# Development
NEXTAUTH_URL=http://localhost:3000

# Production
NEXTAUTH_URL=https://yourdomain.com
```

### 3. MongoDB Connection (ज़रूरी)
Authentication के लिए MongoDB ज़रूरी है क्योंकि:
- User data store होता है
- Admin roles check होते हैं
- Passwords store होते हैं

**Option 1: MongoDB URI (Recommended)**
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/vairanya?retryWrites=true&w=majority
```

**Option 2: Individual Parts**
```env
MONGODB_HOST=cluster.mongodb.net
MONGODB_DATABASE=vairanya
MONGODB_USERNAME=your-username
MONGODB_PASSWORD=your-password
```

**MongoDB Atlas Setup:**
1. [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) पर account बनाएं
2. Free cluster create करें
3. Database User create करें (username/password)
4. Network Access में IP address add करें (0.0.0.0/0 for testing)
5. Connection string copy करें

### 4. Google OAuth (Optional - Google Sign-In के लिए)
```env
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

**Google OAuth Setup:**
1. [Google Cloud Console](https://console.cloud.google.com/) जाएं
2. New project create करें (या existing select करें)
3. "APIs & Services" → "Credentials" जाएं
4. "Create Credentials" → "OAuth 2.0 Client ID" select करें
5. Application type: "Web application" select करें
6. Authorized redirect URIs add करें:
   - Development: `http://localhost:3000/api/auth/callback/google`
   - Production: `https://yourdomain.com/api/auth/callback/google`
7. Client ID और Client Secret copy करें

## Setup Steps

### Step 1: .env File बनाएं
Project root में `.env.local` file बनाएं:

```bash
# Windows
copy .env.example .env.local

# Linux/Mac
cp .env.example .env.local
```

### Step 2: Environment Variables Add करें
`.env.local` file में निम्नलिखित values add करें:

```env
# Required
NEXTAUTH_SECRET=generate-using-openssl-rand-base64-32
NEXTAUTH_URL=http://localhost:3000
MONGODB_URI=your-mongodb-connection-string

# Optional (Google Sign-In के लिए)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### Step 3: Verify Setup
```bash
# Dependencies install करें
npm install

# Development server start करें
npm run dev
```

### Step 4: Test Authentication
1. Browser में `http://localhost:3000` खोलें
2. Login page पर जाएं
3. Email/Password से sign in करें (या Google Sign-In try करें)

## Production Setup

### Vercel Deployment
1. Vercel project settings में जाएं
2. "Environment Variables" section में जाएं
3. सभी environment variables add करें:
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL` (production URL)
   - `MONGODB_URI`
   - `GOOGLE_CLIENT_ID` (optional)
   - `GOOGLE_CLIENT_SECRET` (optional)

### Important Notes for Production:
- `NEXTAUTH_URL` को production domain पर set करें
- `NEXTAUTH_SECRET` को strong secret से replace करें
- MongoDB Atlas में production IP addresses whitelist करें
- Google OAuth में production redirect URI add करें

## Troubleshooting

### Error: "NEXTAUTH_SECRET is not set"
**Solution:** `.env.local` file में `NEXTAUTH_SECRET` add करें

### Error: "MongoDB connection failed"
**Solution:** 
- MongoDB connection string verify करें
- MongoDB Atlas cluster running है check करें
- Network Access में IP address whitelist करें

### Error: "Google OAuth failed"
**Solution:**
- Google Client ID/Secret verify करें
- Redirect URI correctly set है check करें
- Google Cloud Console में OAuth consent screen setup करें

### Error: "Invalid callback URL"
**Solution:**
- `NEXTAUTH_URL` correctly set है verify करें
- Google OAuth redirect URI match करता है check करें

## Security Best Practices

1. **Never commit .env files** - `.env.local` को `.gitignore` में add करें
2. **Use strong secrets** - `NEXTAUTH_SECRET` को strong random string से generate करें
3. **Restrict MongoDB access** - Production में specific IPs को whitelist करें
4. **Use HTTPS in production** - Always use HTTPS for production deployments
5. **Rotate secrets regularly** - Periodically change secrets in production

## Support

अगर कोई issue आए तो:
1. Check करें कि सभी environment variables correctly set हैं
2. MongoDB connection string verify करें
3. Google OAuth credentials verify करें
4. Browser console में errors check करें
5. Server logs check करें

## Additional Resources

- [NextAuth.js Documentation](https://next-auth.js.org/)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)

