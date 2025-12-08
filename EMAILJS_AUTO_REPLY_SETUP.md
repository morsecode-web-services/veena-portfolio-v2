# EmailJS Auto-Reply Setup Guide

This guide shows you how to set up automatic reply emails to users who submit your contact form.

## Overview

When someone submits your contact form, two emails will be sent:
1. **Notification Email** → To you (the website owner)
2. **Auto-Reply Email** → To the user (confirmation they submitted)

## Step-by-Step Setup

### Step 1: Create Auto-Reply Template in EmailJS

1. Go to your EmailJS dashboard: https://dashboard.emailjs.com/
2. Navigate to **Email Templates**
3. Click **Create New Template**
4. Name it something like "Contact Form Auto-Reply"
5. **Copy the Template ID** - you'll need this

### Step 2: Configure Auto-Reply Template

#### Template Settings:
- **From Name:** Your name or business name (e.g., "Veena Musician")
- **From Email:** Your email address
- **To Email:** `{{from_email}}` ← This sends to the user who submitted the form
- **Subject:** Confirmation message

#### Example Auto-Reply Template:

**Subject:**
```
Thank you for contacting me, {{from_name}}!
```

**Email Body:**
```
Dear {{from_name}},

Thank you for reaching out! I have received your message and will get back to you as soon as possible.

Here's a copy of what you sent:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
YOUR MESSAGE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{{message}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Your Contact Information:
Email: {{from_email}}
Phone: {{phone}}

I typically respond within 24-48 hours. If your inquiry is urgent, please feel free to reach out via phone.

Best regards,
[Your Name]
[Your Website]
[Your Contact Information]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
This is an automated message. Please do not reply to this email.
```

**Important:** Make sure to use `{{from_email}}` in the "To Email" field so it sends to the user!

### Step 3: Update Environment Variables

Add the auto-reply template ID to your `.env.local`:

```bash
# Existing variables
NEXT_PUBLIC_EMAILJS_SERVICE_ID=service_xxxxxxx
NEXT_PUBLIC_EMAILJS_TEMPLATE_ID=template_xxxxxxx
NEXT_PUBLIC_EMAILJS_PUBLIC_KEY=xxxxxxxxxxxx

# Add this new variable for auto-reply
NEXT_PUBLIC_EMAILJS_AUTO_REPLY_TEMPLATE_ID=template_yyyyyyy
```

### Step 4: Update Email Service Code

The email service needs to send two emails instead of one. Here's what needs to change:

**Option A: Sequential Sending (Recommended)**
- Send notification email first (to you)
- Then send auto-reply email (to user)
- If notification fails, auto-reply won't send
- More reliable

**Option B: Parallel Sending**
- Send both emails at the same time
- Faster but less reliable
- If one fails, the other might still succeed

I'll implement **Option A (Sequential)** as it's more reliable.

### Step 5: Code Implementation

I'll update the `lib/email-service.ts` file to support auto-reply functionality.

## Implementation Details

### What Changes:

1. **New environment variable:** `NEXT_PUBLIC_EMAILJS_AUTO_REPLY_TEMPLATE_ID`
2. **Updated `sendContactEmail` function:** Sends two emails sequentially
3. **Error handling:** If notification email fails, auto-reply won't send
4. **Optional auto-reply:** Can be disabled by not setting the template ID

### Benefits:

✅ Professional user experience  
✅ Immediate confirmation to users  
✅ Reduces "did my message send?" anxiety  
✅ Provides users with a copy of their message  
✅ Sets expectations for response time  
✅ Optional - works without auto-reply too  

### Considerations:

⚠️ **Email Quota:** Each form submission uses 2 emails (notification + auto-reply)  
⚠️ **Free Tier:** 200 emails/month = 100 form submissions with auto-reply  
⚠️ **Spam Risk:** Make sure auto-reply doesn't look like spam  
⚠️ **Reply-To:** Set proper reply-to address in template  

## Testing Auto-Reply

1. Update `.env.local` with auto-reply template ID
2. Restart dev server: `npm run dev`
3. Submit contact form with your own email
4. Check inbox for TWO emails:
   - Notification email (to you)
   - Auto-reply email (to the email you entered in form)

## Troubleshooting

### Auto-reply not received

**Check:**
- Template ID is correct in `.env.local`
- "To Email" in template is set to `{{from_email}}`
- Email didn't go to spam folder
- EmailJS dashboard shows both emails sent
- Email address entered in form is valid

### Only notification received, no auto-reply

**Possible causes:**
- Auto-reply template ID not set or incorrect
- Error in auto-reply template (check EmailJS logs)
- "To Email" field not set to `{{from_email}}`
- Second email failed (check browser console)

### Both emails go to spam

**Solutions:**
- Use a verified email domain
- Add SPF/DKIM records to your domain
- Avoid spam trigger words in template
- Keep auto-reply professional and concise

## Advanced: Customizing Auto-Reply

### Add Your Branding

```
[Your Logo/Header Image]

Dear {{from_name}},

Thank you for your interest in [Your Service/Product]!
...
```

### Include Social Media Links

```
Connect with me:
🎵 Instagram: @yourhandle
🎥 YouTube: youtube.com/yourchannel
🌐 Website: yourwebsite.com
```

### Add Call-to-Action

```
While you wait for my response:
• Check out my latest performance: [link]
• View my upcoming events: [link]
• Listen to my music: [link]
```

### Set Response Time Expectations

```
Response Time:
• General inquiries: 24-48 hours
• Booking requests: Within 24 hours
• Urgent matters: Please call [phone]
```

## Best Practices

1. **Keep it concise** - Users don't read long auto-replies
2. **Be professional** - This is their first automated interaction
3. **Set expectations** - Tell them when to expect a response
4. **Provide alternatives** - Give other ways to reach you
5. **Include their message** - So they have a record
6. **Make it personal** - Use their name ({{from_name}})
7. **Add value** - Include useful links or information

## Example Professional Auto-Reply

```
Subject: Thank you for contacting [Your Name]!

Dear {{from_name}},

Thank you for reaching out! Your message has been received and I will respond within 24-48 hours.

Your Message:
"{{message}}"

In the meantime, feel free to:
• Explore my music: [website link]
• View upcoming performances: [events link]
• Follow me on Instagram: @yourhandle

For urgent booking inquiries, please call: [phone number]

Best regards,
[Your Name]
Veena Musician

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
This is an automated confirmation. I will reply personally soon.
```

## Next Steps

Would you like me to:
1. **Implement the auto-reply feature** in your code?
2. **Create a template example** specific to your needs?
3. **Add configuration options** to enable/disable auto-reply?

Let me know and I'll update the code accordingly!
