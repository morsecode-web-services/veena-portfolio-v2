# EmailJS Quick Reference Card

## 🚀 Quick Start (5 Minutes)

### 1. Get EmailJS Credentials
```
1. Visit: https://www.emailjs.com/
2. Sign up (free)
3. Add Email Service → Copy Service ID
4. Create Template → Copy Template ID
5. Account → General → Copy Public Key
```

### 2. Update .env.local
```bash
NEXT_PUBLIC_EMAILJS_SERVICE_ID=service_xxxxxxx
NEXT_PUBLIC_EMAILJS_TEMPLATE_ID=template_xxxxxxx
NEXT_PUBLIC_EMAILJS_PUBLIC_KEY=xxxxxxxxxxxx
```

### 3. Email Template Variables
Use these exact names in your EmailJS template:
```
{{from_name}}    - Sender's name
{{from_email}}   - Sender's email
{{phone}}        - Sender's phone
{{message}}      - Message content
{{timestamp}}    - Submission time
```

### 4. Test
```bash
npm run dev
# Navigate to Contact section and test the form
```

---

## 📧 Example Email Template

### Subject Line:
```
New Contact Form Submission from {{from_name}}
```

### Email Body:
```
You have received a new contact form submission from your website.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONTACT DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Name:     {{from_name}}
Email:    {{from_email}}
Phone:    {{phone}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MESSAGE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{{message}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Submitted: {{timestamp}}

Reply to this inquiry by responding to {{from_email}}
```

---

## 🔧 Troubleshooting

### "EmailJS is not configured"
- Check `.env.local` exists in project root
- Verify all 3 variables are set
- Restart dev server: `npm run dev`

### Email not received
- Check spam folder
- Verify "To Email" in EmailJS template
- Check EmailJS dashboard for delivery status

### Variables showing as {{variable_name}}
- Variable names must match exactly (case-sensitive)
- Use: `from_name`, `from_email`, `phone`, `message`, `timestamp`

---

## 📊 Free Tier Limits
- ✅ 200 emails/month
- ✅ 2 templates
- ✅ 1 email service
- ⚠️ EmailJS branding included

---

## 🚀 Production Deployment

### Vercel
```
1. Project Settings → Environment Variables
2. Add all 3 NEXT_PUBLIC_EMAILJS_* variables
3. Redeploy
```

### Netlify
```
1. Site Settings → Build & Deploy → Environment
2. Add all 3 NEXT_PUBLIC_EMAILJS_* variables
3. Redeploy
```

---

## 📱 Contact Form Features

✅ Client-side email sending (no backend needed)  
✅ Form validation (Zod)  
✅ Rate limiting (30s cooldown)  
✅ Auto-retry on failure (2 attempts)  
✅ 10-second timeout  
✅ User-friendly error messages  
✅ Accessibility compliant  

---

## 🔗 Quick Links

- **EmailJS Dashboard:** https://dashboard.emailjs.com/
- **Documentation:** https://www.emailjs.com/docs/
- **Full Setup Guide:** See `EMAILJS_SETUP.md`
- **Implementation Details:** See `EMAILJS_IMPLEMENTATION_SUMMARY.md`

---

## 💡 Pro Tips

1. **Use Gmail with App Password** for better security
2. **Test with a personal email first** before going live
3. **Check spam folder** during initial testing
4. **Monitor EmailJS dashboard** for delivery status
5. **Keep Public Key in .env.local** (it's safe to expose but cleaner this way)

---

**Need Help?** See full documentation in `EMAILJS_SETUP.md`
