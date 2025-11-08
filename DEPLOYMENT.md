# Vairanya Deployment Guide

## Custom Domain Setup

### Vercel Domain Configuration

1. **Add Domain in Vercel:**
   - Go to Vercel Dashboard → Project Settings → Domains
   - Add your custom domain (e.g., `vairanya.com`)
   - Vercel will provide DNS records to configure

### DNS Records Configuration

#### For Root Domain (vairanya.com):
```
Type: A
Name: @
Value: 76.76.21.21
TTL: Auto
```

#### For WWW Subdomain (www.vairanya.com):
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
TTL: Auto
```

**Note:** Actual IP addresses may vary. Check Vercel dashboard for exact values.

### Domain Provider Instructions

#### GoDaddy:
1. Login to GoDaddy
2. My Products → DNS
3. Click "Add" to create new record
4. Add the records provided by Vercel
5. Save changes

#### Namecheap:
1. Login to Namecheap
2. Domain List → Manage
3. Advanced DNS tab
4. Add New Record
5. Enter Type, Host, and Value
6. Save

#### Cloudflare:
1. Login to Cloudflare
2. Select your domain
3. DNS → Records
4. Add Record
5. Enter Type, Name, and Content
6. Save

### Verification

1. Check Vercel Dashboard for domain status
2. Wait for DNS propagation (usually 1-24 hours)
3. SSL certificate will be automatically provisioned by Vercel

### Environment Variables

Make sure these are set in Vercel:
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `FIREBASE_SERVICE_ACCOUNT_JSON`
- All other required environment variables

### Firebase Authorized Domains

After adding custom domain, update Firebase:
1. Go to Firebase Console → Authentication → Settings
2. Add your custom domain to "Authorized domains"
3. Add both: `vairanya.com` and `www.vairanya.com`

### Post-Deployment Checklist

- [ ] Domain added to Vercel
- [ ] DNS records configured
- [ ] Domain verified in Vercel
- [ ] SSL certificate active (automatic)
- [ ] Firebase authorized domains updated
- [ ] Test login functionality
- [ ] Test all pages load correctly



