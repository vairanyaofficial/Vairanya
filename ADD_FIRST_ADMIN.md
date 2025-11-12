# How to Add Your First Admin User

## Problem
You're getting "Access Denied" error when trying to login to the admin panel because your email is not registered in the MongoDB `Admin` collection.

## Solution
You need to add your email to the MongoDB `Admin` collection. There are two ways to do this:

## Method 1: Using the Script (Recommended)

### Step 1: Get Your Google Email
1. Sign in with Google on the login page (`/login`)
2. Note your email address that you used to sign in

### Step 2: Run the Script
```bash
npm run add-admin <your-email@example.com> "Your Name" superadmin
```

**Example:**
```bash
npm run add-admin admin@vairanya.in "Admin User" superadmin
```

### Step 3: Verify
1. Go to `/admin/login`
2. Sign in with Google using the same email
3. You should now have access!

## Method 2: Using the Bootstrap API Endpoint

### Step 1: Sign in First
1. Go to `/login` and sign in with Google
2. This creates a NextAuth session

### Step 2: Check if Bootstrap is Available
```bash
curl http://localhost:3000/api/admin/bootstrap
```

If it returns `"available": true`, you can proceed.

### Step 3: Create First Admin
```bash
curl -X POST http://localhost:3000/api/admin/bootstrap \
  -H "Content-Type: application/json" \
  -d '{
    "email": "vairanya.official@gmail.com",
    "name": "Vairanya Official",
    "role": "superadmin"
  }'
```

**Note:** The bootstrap endpoint only works when there are no admins in the database. After the first admin is created, you'll need to use the admin panel to add more admins.

## Method 3: Direct MongoDB Access

If you have direct access to MongoDB:

1. Connect to your MongoDB database
2. Use the following document structure:

```javascript
{
  "email": "your-email@example.com",
  "name": "Your Name",
  "role": "superadmin",  // or "admin" or "worker"
  "uid": "optional-uid",
  "createdAt": new Date(),
  "updatedAt": new Date()
}
```

3. Insert into the `Admin` collection:

```javascript
db.Admin.insertOne({
  email: "your-email@example.com",
  name: "Your Name",
  role: "superadmin",
  createdAt: new Date(),
  updatedAt: new Date()
});
```

## Available Roles

- **superadmin**: Full access, can manage all admins and workers
- **admin**: Limited access, can manage products, orders, etc. but cannot manage workers
- **worker**: Very limited access, can view/edit orders and products but cannot create/delete

## Environment Variables (Optional)

You can also set environment variables in `.env`:

```env
FIRST_ADMIN_EMAIL=your-email@example.com
FIRST_ADMIN_NAME=Your Name
FIRST_ADMIN_ROLE=superadmin
FIRST_ADMIN_UID=optional-uid
```

Then run:
```bash
npm run add-admin
```

## Troubleshooting

### Error: "Database unavailable"
- Check your `MONGODB_URI` in `.env` file
- Verify MongoDB connection is working: `npm run test-mongodb`

### Error: "Admin already exists"
- The email is already in the database
- Run the script with `-u` flag to update (or use MongoDB directly)

### Error: "Bootstrap is not available"
- Admins already exist in the database
- You need to use the admin panel (logged in as superadmin) to add new admins
- Or use the script method which always works

## After Adding First Admin

1. Go to `/admin/login`
2. Sign in with Google using the email you added
3. You should now have access to the admin panel
4. From the admin panel, you can add more admins/workers if you're a superadmin

## Security Note

- The bootstrap endpoint is only available when no admins exist
- After the first admin is created, you must be a superadmin to add more admins
- Always use strong, unique emails for admin accounts
- Never share admin credentials

