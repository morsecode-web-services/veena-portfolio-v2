# EmailJS Setup Guide

This guide will help you configure EmailJS for the contact form on your website.

## Overview

EmailJS allows you to send emails directly from client-side JavaScript without needing a backend server. It's perfect for static sites and JAMstack applications.

## Step-by-Step Setup

### 1. Create an EmailJS Account

1. Go to [https://www.emailjs.com/](https://www.emailjs.com/)
2. Click "Sign Up" and create a free account
3. Verify your email address

### 2. Add an Email Service

1. In your EmailJS dashboard, go to **Email Services**
2. Click **Add New Service**
3. Choose your email provider (Gmail, Outlook, etc.)
4. Follow the instructions to connect your email account
5. **Copy the Service ID** - you'll need this later

**Recommended:** Use Gmail with an App Password for better security:
- Enable 2-factor authentication on your Gmail account
- Generate an App Password: [https://myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
- Use the App Password when connecting Gmail to EmailJS

### 3. Create an Email Template

1. Go to **Email Templates** in your EmailJS dashboard
2. Click **Create New Template**
3. **Copy the Template ID** - you'll need this later
4. Configure your template with these variables:

#### Template Variables

Use these exact variable names in your template (they match the form fields):

- `{{from_name}}` - The sender's name
- `{{from_email}}` - The sender's email address
- `{{phone}}` - The sender's phone number
- `{{message}}` - The message content
- `{{timestamp}}` - When the form was submitted

#### Example Template

**Subject:**
```
New Contact Form Submission from {{from_name}}
```

**Body:**
```
You have received a new contact form submission from your website.

Contact Details:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Name: {{from_name}}
Email: {{from_email}}
Phone: {{phone}}

Message:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{{message}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Submitted: {{timestamp}}

Reply to this inquiry by responding to {{from_email}}
```

5. Set the **To Email** to your email address (where you want to receive messages)
6. Click **Save**

### 4. Get Your Public Key

1. Go to **Account** → **General** in your EmailJS dashboard
2. Find your **Public Key** (formerly called User ID)
3. **Copy the Public Key** - you'll need this later

### 5. Configure Environment Variables

1. Open the `.env.local` file in your project root
2. Replace the placeholder values with your actual EmailJS credentials:

```bash
NEXT_PUBLIC_EMAILJS_SERVICE_ID=service_xxxxxxx
NEXT_PUBLIC_EMAILJS_TEMPLATE_ID=template_xxxxxxx
NEXT_PUBLIC_EMAILJS_PUBLIC_KEY=xxxxxxxxxxxx
```

**Important:** Never commit `.env.local` to version control. It's already in `.gitignore`.

### 6. Test the Contact Form

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to the Contact section on your website

3. Fill out and submit the contact form

4. Check your email inbox for the test message

5. Check the browser console for any errors

## Troubleshooting

### "EmailJS is not configured" Error

**Problem:** Environment variables are not set or not loaded.

**Solution:**
- Ensure `.env.local` exists in your project root
- Verify all three variables are set correctly
- Restart your development server after changing `.env.local`
- Make sure variable names start with `NEXT_PUBLIC_` (required for Next.js client-side access)

### Email Not Received

**Problem:** Form submits successfully but no email arrives.

**Solution:**
- Check your spam/junk folder
- Verify the "To Email" in your EmailJS template is correct
- Check EmailJS dashboard for delivery status
- Ensure your email service is properly connected in EmailJS

### "Failed to send email" Error

**Problem:** EmailJS API returns an error.

**Solution:**
- Verify your Service ID, Template ID, and Public Key are correct
- Check EmailJS dashboard for any service issues
- Ensure your EmailJS account is active (free tier has limits)
- Check browser console for detailed error messages

### Template Variables Not Showing

**Problem:** Email received but shows `{{variable_name}}` instead of actual values.

**Solution:**
- Ensure variable names in template match exactly: `from_name`, `from_email`, `phone`, `message`, `timestamp`
- Variable names are case-sensitive
- Re-save your template after making changes

## EmailJS Free Tier Limits

The free tier includes:
- 200 emails per month
- 2 email templates
- 1 email service
- EmailJS branding in emails

For higher limits, consider upgrading to a paid plan.

## Security Notes

1. **Public Key is Safe:** The EmailJS public key is meant to be exposed in client-side code
2. **Rate Limiting:** The contact form has built-in rate limiting (30 seconds between submissions)
3. **Validation:** All form fields are validated before sending
4. **No Sensitive Data:** Never send passwords or sensitive information through contact forms

## Production Deployment

When deploying to production (Vercel, Netlify, GitHub Pages, etc.):

1. Add the environment variables to your hosting platform:
   - Vercel: Project Settings → Environment Variables
   - Netlify: Site Settings → Build & Deploy → Environment
   - GitHub Pages: Use GitHub Secrets for build-time variables

2. Ensure variables are prefixed with `NEXT_PUBLIC_` for client-side access

3. Redeploy your site after adding environment variables

## Alternative: Using a Backend API

If you prefer not to use EmailJS or need more control, you can:

1. Create a Next.js API route (`app/api/contact/route.ts`)
2. Use a server-side email service like:
   - [Resend](https://resend.com/) - Modern email API
   - [SendGrid](https://sendgrid.com/) - Enterprise email service
   - [Nodemailer](https://nodemailer.com/) - SMTP email sending

The current implementation is designed to work with EmailJS, but the architecture supports switching to other services.

## Support

- EmailJS Documentation: [https://www.emailjs.com/docs/](https://www.emailjs.com/docs/)
- EmailJS Support: [https://www.emailjs.com/support/](https://www.emailjs.com/support/)

## Summary

✅ EmailJS package installed (`@emailjs/browser`)  
✅ Email service configured in `lib/email-service.ts`  
✅ Environment variables template created (`.env.local`)  
✅ Contact form ready to use  
✅ Error handling and retry logic implemented  
✅ Rate limiting enabled (30 seconds between submissions)  

**Next Step:** Follow this guide to set up your EmailJS account and add your credentials to `.env.local`
