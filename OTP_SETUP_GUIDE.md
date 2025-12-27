# OTP Email Verification Setup Guide

## Overview
This application now uses OTP (One-Time Password) email verification instead of magic links.

## Setup Instructions

### 1. Configure Email Service

You need to set up email credentials for sending OTPs. We recommend using Gmail with an App Password.

#### For Gmail:

1. **Enable 2-Factor Authentication** on your Google Account
   - Go to: https://myaccount.google.com/security
   - Enable 2-Step Verification

2. **Create an App Password**
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" and "Other (Custom name)"
   - Name it "Expertene OTP"
   - Copy the 16-character password

3. **Create `.env` file** in the project root:
   ```env
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-16-char-app-password
   ```

#### For Other Email Services:

**Outlook/Hotmail:**
```env
EMAIL_USER=your-email@outlook.com
EMAIL_PASSWORD=your-password
```

**Custom SMTP:**
Edit `server/email-service.ts` and replace the transporter with:
```typescript
const transporter = nodemailer.createTransport({
  host: 'smtp.your-provider.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});
```

### 2. Install Dependencies

Already installed:
- ✅ nodemailer
- ✅ @types/nodemailer

### 3. How It Works

**Signup Flow:**
1. User enters email, username, password
2. System sends 6-digit OTP to email
3. User enters OTP on verification screen
4. OTP is validated (expires in 10 minutes)
5. Account is verified and user can login

**OTP Email Example:**
```
Subject: Verify Your Email - Expertene

Your verification code: 123456

This code expires in 10 minutes.
```

### 4. API Endpoints

**Send OTP:**
```
POST /api/otp/send-otp
Body: { "email": "user@example.com" }
Response: { "success": true, "expiresIn": 600 }
```

**Verify OTP:**
```
POST /api/otp/verify-otp
Body: { "email": "user@example.com", "otp": "123456" }
Response: { "success": true, "message": "Email verified successfully" }
```

### 5. Security Features

- ✅ OTP expires after 10 minutes
- ✅ OTP is deleted after successful verification
- ✅ OTP is deleted after expiration
- ✅ Rate limiting recommended (add middleware)
- ✅ Secure storage in Firestore

### 6. Testing

**Test Email Configuration:**
```bash
# The server will verify email config on startup
npm run dev
# Look for: "✅ Email server is ready"
```

**Test OTP Flow:**
1. Sign up with a real email address
2. Check your email for the OTP
3. Enter the OTP within 10 minutes
4. Verify successful login

### 7. Production Considerations

**Before deploying:**
1. ✅ Set up environment variables on your hosting platform
2. ✅ Use a dedicated email service (SendGrid, Mailgun, AWS SES)
3. ✅ Add rate limiting to prevent OTP spam
4. ✅ Monitor email delivery rates
5. ✅ Set up email templates in your email service

**Recommended Email Services for Production:**
- **SendGrid**: 100 emails/day free
- **Mailgun**: 5,000 emails/month free
- **AWS SES**: $0.10 per 1,000 emails

### 8. Troubleshooting

**"Email server configuration error":**
- Check your EMAIL_USER and EMAIL_PASSWORD in `.env`
- For Gmail, make sure you're using an App Password, not your regular password
- Verify 2FA is enabled on your Google account

**"Failed to send OTP email":**
- Check your internet connection
- Verify email credentials are correct
- Check spam folder for test emails

**"OTP not found or expired":**
- OTPs expire after 10 minutes
- Request a new OTP

### 9. Customization

**Change OTP Length:**
Edit `server/email-service.ts`:
```typescript
// For 4-digit OTP
export function generateOTP(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}
```

**Change Expiration Time:**
Edit `server/otp-routes.ts`:
```typescript
const expiresAt = now + (5 * 60 * 1000); // 5 minutes
```

**Customize Email Template:**
Edit the HTML in `server/email-service.ts` `sendOTPEmail` function.

## Support

For issues or questions, check:
- Nodemailer docs: https://nodemailer.com/
- Gmail App Passwords: https://support.google.com/accounts/answer/185833
