# Email Setup Guide

## Overview
The application sends order confirmation emails to customers when an order is placed. This feature uses Nodemailer with SMTP configuration.

## Environment Variables

Add the following environment variables to your `.env.local` file:

```env
# SMTP Configuration for GoDaddy Email
SMTP_HOST=smtpout.secureserver.net
SMTP_PORT=465
SMTP_USER=hello@vairanya.in
SMTP_PASS=your-email-password
SMTP_FROM=hello@vairanya.in
SMTP_FROM_NAME=Vairanya
```

**Note:** By default, emails will be sent from `hello@vairanya.in` using GoDaddy email settings.

## GoDaddy Email Setup (Current Configuration)

Since your email is hosted on GoDaddy, use these settings:

1. **SMTP Settings:**
   - **SMTP_HOST**: `smtpout.secureserver.net` (or `smtp.secureserver.net`)
   - **SMTP_PORT**: `465` (SSL) or `587` (TLS)
   - **SMTP_USER**: Your full email address (`hello@vairanya.in`)
   - **SMTP_PASS**: Your GoDaddy email account password

2. **Port Options:**
   - **Port 465** (SSL) - Recommended, more secure
   - **Port 587** (TLS) - Alternative option

3. **Testing:**
   - Use your GoDaddy email account password (not an app password like Gmail)
   - Make sure your email account is active in GoDaddy

## Gmail Setup (Alternative - If you want to use Gmail instead)

If you want to use Gmail instead of GoDaddy email:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

1. **Enable 2-Step Verification** on your Google account
2. **Generate an App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a new app password for "Mail"
   - Use this password in `SMTP_PASS`

## Other Email Providers

### Outlook/Hotmail
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
```

### SendGrid
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

### Custom SMTP
Use your provider's SMTP settings:
- **SMTP_HOST**: Your SMTP server hostname
- **SMTP_PORT**: Usually 587 (TLS) or 465 (SSL)
- **SMTP_USER**: Your SMTP username
- **SMTP_PASS**: Your SMTP password

## Testing

The email service will:
- ✅ Send emails automatically when orders are created
- ✅ Log email sending status (check server logs)
- ⚠️ Continue order creation even if email fails (non-blocking)

## Troubleshooting

### Email not sending
1. Check that all SMTP environment variables are set
2. Verify SMTP credentials are correct
3. Check server logs for error messages
4. For Gmail: Ensure you're using an App Password, not your regular password

### Email goes to spam
- Ensure `SMTP_FROM` matches your verified sender email
- Consider setting up SPF/DKIM records for your domain
- Use a professional email address (not free Gmail for production)

## Notes

- Email sending is **non-blocking** - orders will be created even if email fails
- Email failures are logged but don't affect order creation
- The email template includes order details, items, shipping address, and payment method

