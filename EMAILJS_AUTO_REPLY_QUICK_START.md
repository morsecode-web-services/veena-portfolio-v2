# EmailJS Auto-Reply Quick Start

## ✅ What's Been Done

The code has been updated to support auto-reply emails! Here's what changed:

### Code Updates
- ✅ `lib/email-service.ts` - Now sends TWO emails:
  1. **Notification email** → To you (the website owner)
  2. **Auto-reply email** → To the user (optional)
- ✅ `.env.local` - Added placeholder for auto-reply template ID
- ✅ Error handling - Auto-reply failures won't break the form
- ✅ Optional feature - Works without auto-reply if not configured

### How It Works

**When a user submits the contact form:**

1. **Notification Email Sent** (to you)
   - Uses `NEXT_PUBLIC_EMAILJS_TEMPLATE_ID`
   - Contains all form data
   - If this fails, form shows error

2. **Auto-Reply Email Sent** (to user) - OPTIONAL
   - Uses `NEXT_PUBLIC_EMAILJS_AUTO_REPLY_TEMPLATE_ID`
   - Only sent if template ID is configured
   - If this fails, form still shows success (notification succeeded)

## 🚀 Quick Setup (5 Minutes)

### Step 1: Create Auto-Reply Template in EmailJS

1. Go to https://dashboard.emailjs.com/
2. Click **Email Templates** → **Create New Template**
3. **Important:** Set "To Email" to `{{from_email}}` (this sends to the user!)
4. Copy the Template ID

### Step 2: Configure Template

**Subject:**
```
Thank you for contacting me, {{from_name}}!
```

**Body:**
```
Dear {{from_name}},

Thank you for reaching out! I have received your message and will get back to you within 24-48 hours.

Here's a copy of what you sent:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{{message}}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Your contact information:
Email: {{from_email}}
Phone: {{phone}}

Best regards,
[Your Name]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
This is an automated message. I will reply personally soon.
```

### Step 3: Update .env.local

Edit `.env.local` and uncomment/update the auto-reply line:

```bash
# Your existing credentials (already configured)
NEXT_PUBLIC_EMAILJS_SERVICE_ID=service_u7i9mr9
NEXT_PUBLIC_EMAILJS_TEMPLATE_ID=template_vvpgk9p
NEXT_PUBLIC_EMAILJS_PUBLIC_KEY=FNKZ2Xtl3Gx_fFP4H

# Add your auto-reply template ID here
NEXT_PUBLIC_EMAILJS_AUTO_REPLY_TEMPLATE_ID=template_xxxxxxx
```

### Step 4: Restart & Test

```bash
# Restart dev server
npm run dev

# Test the form with your own email
# You should receive TWO emails:
# 1. Notification email (to you)
# 2. Auto-reply email (to the email you entered in form)
```

## 📧 Template Checklist

### Notification Template (Already Set Up)
- ✅ Template ID: `template_vvpgk9p`
- ✅ To Email: Your email address
- ✅ Variables: `{{from_name}}`, `{{from_email}}`, `{{phone}}`, `{{message}}`, `{{timestamp}}`

### Auto-Reply Template (To Set Up)
- [ ] Create new template in EmailJS
- [ ] Set "To Email" to `{{from_email}}` ← **CRITICAL!**
- [ ] Add subject and body with variables
- [ ] Copy template ID
- [ ] Add to `.env.local`
- [ ] Restart dev server
- [ ] Test with your email

## ⚠️ Important Notes

### Email Quota
- Each form submission = 2 emails (notification + auto-reply)
- Free tier: 200 emails/month = **100 form submissions**
- Monitor usage in EmailJS dashboard

### "To Email" Field
**Notification Template:** Your email address (e.g., `your@email.com`)  
**Auto-Reply Template:** `{{from_email}}` ← This sends to the user!

### Error Handling
- If notification email fails → User sees error message
- If auto-reply fails → User still sees success (notification worked)
- Auto-reply failures are logged to console

### Optional Feature
- Auto-reply is completely optional
- If `NEXT_PUBLIC_EMAILJS_AUTO_REPLY_TEMPLATE_ID` is not set, only notification email is sent
- No code changes needed to disable - just don't set the variable

## 🧪 Testing

### Test Checklist
1. [ ] Submit form with your own email
2. [ ] Check inbox for notification email (to you)
3. [ ] Check inbox for auto-reply email (to email you entered)
4. [ ] Verify both emails have correct data
5. [ ] Check spam folders if emails not received
6. [ ] Test with different email addresses

### Troubleshooting

**Only notification received, no auto-reply:**
- Check template ID is correct in `.env.local`
- Verify "To Email" in template is `{{from_email}}`
- Check EmailJS dashboard logs
- Look for errors in browser console

**Auto-reply goes to wrong email:**
- "To Email" field must be `{{from_email}}` (not your email!)

**Both emails go to spam:**
- Use verified email domain
- Keep content professional
- Avoid spam trigger words

## 📊 Example Templates

### Professional Auto-Reply
```
Subject: Thank you for your inquiry, {{from_name}}

Dear {{from_name}},

Thank you for contacting me! Your message has been received.

I typically respond within 24-48 hours. For urgent matters, 
please call [your phone number].

Your message:
"{{message}}"

Best regards,
[Your Name]
Veena Musician
[Website] | [Instagram] | [YouTube]
```

### Friendly Auto-Reply
```
Subject: Got your message, {{from_name}}! 🎵

Hi {{from_name}},

Thanks for reaching out! I've received your message and I'm 
excited to connect with you.

I'll get back to you soon - usually within a day or two.

In the meantime, feel free to:
• Check out my latest performance: [link]
• Follow me on Instagram: @yourhandle
• Listen to my music: [link]

Talk soon!
[Your Name]
```

## 🎯 Next Steps

1. **Create auto-reply template** in EmailJS dashboard
2. **Set "To Email" to {{from_email}}** ← Don't forget this!
3. **Copy template ID** and add to `.env.local`
4. **Restart dev server** and test
5. **Monitor EmailJS dashboard** for delivery status

## 📚 Full Documentation

For more details, see:
- `EMAILJS_AUTO_REPLY_SETUP.md` - Complete guide with examples
- `EMAILJS_SETUP.md` - Original EmailJS setup guide
- `EMAILJS_QUICK_REFERENCE.md` - Quick reference card

---

**Status:** ✅ Code Updated - Ready for Auto-Reply Configuration  
**Current Setup:** Notification emails working, auto-reply ready to enable  
**Action Required:** Create auto-reply template and add template ID to `.env.local`
