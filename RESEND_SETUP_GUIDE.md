# 🚀 Resend + React Email Setup Guide

Complete guide to migrate from EmailJS to Resend with React Email templates.

---

## ✅ What's Been Done

All code has been implemented! Here's what's ready:

### Email Templates Created:
- ✅ `emails/PerformanceInquiry.tsx` - Performance booking auto-reply
- ✅ `emails/ClassesInquiry.tsx` - Private classes auto-reply
- ✅ `emails/CollaborationInquiry.tsx` - Collaboration auto-reply
- ✅ `emails/GeneralInquiry.tsx` - General inquiry auto-reply
- ✅ `emails/ContactNotification.tsx` - Admin notification email
- ✅ `emails/styles.ts` - Shared styling

### API Route Created:
- ✅ `app/api/send-email/route.ts` - Handles email sending + database storage

### Contact Form Updated:
- ✅ Now calls `/api/send-email` instead of EmailJS
- ✅ Simplified error handling
- ✅ Rate limiting maintained

---

## 🎯 Setup Steps (You Need To Do)

### Step 1: Install Required Packages (2 minutes)

Run in your project root:

```bash
npm install resend react-email @react-email/components @react-email/render
```

### Step 2: Create Resend Account (3 minutes)

1. Go to https://resend.com/
2. Click **"Start Building"**
3. Sign up with GitHub, Google, or email
4. You'll land on the dashboard

### Step 3: Get Resend API Key (1 minute)

1. In Resend dashboard, click **"API Keys"** (left sidebar)
2. Click **"Create API Key"**
3. Settings:
   - **Name:** `portfolio-contact-form`
   - **Permission:** "Sending access"
4. Click **"Add"**
5. **Copy the API key** - you'll only see it once!
   - Format: `re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### Step 4: Update Environment Variables (1 minute)

Add to your `.env.local` file:

```bash
# Resend Configuration
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
ADMIN_EMAIL=your@email.com

# Supabase (should already be set)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxxx
```

**Replace:**
- `re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx` with your actual Resend API key
- `your@email.com` with the email where you want to receive notifications

### Step 5: Fix Supabase RLS Policy (1 minute)

If you haven't already fixed the RLS issue, run this in Supabase Dashboard → SQL Editor:

```sql
-- Allow anyone to submit the contact form
DROP POLICY IF EXISTS "Allow anonymous lead submissions" ON public.leads;
DROP POLICY IF EXISTS "Enable insert for anon users" ON public.leads;

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all inserts"
  ON public.leads
  FOR INSERT
  WITH CHECK (true);
```

### Step 6: Restart Development Server (30 seconds)

```bash
# Stop current server (Ctrl+C)
npm run dev
```

Environment variables are only loaded on server start.

---

## 🧪 Testing Your Setup

### Test 1: Submit Contact Form

1. Go to http://localhost:3000
2. Navigate to Contact section
3. Fill out form:
   - Name: Test User
   - Phone: +1 234 567 8900
   - Email: **your personal email** (so you can check auto-reply)
   - Inquiry Type: **Classes**
   - Message: This is a test submission

4. Click "Send Message"

### Test 2: Verify Success

Check for these confirmations:

✅ **In Browser:**
- Success message appears
- Form resets
- No errors in console (F12)

✅ **In Your Inbox (ADMIN_EMAIL):**
- Notification email received
- Subject: "New classes inquiry from Test User"
- Contains all form details
- Has reply-to address set to user's email

✅ **In Test User Inbox:**
- Auto-reply email received
- Subject: "Thank you for your interest in classes"
- Personalized with name
- Lists class offerings (Veena, Vocal, Theory)

✅ **In Supabase:**
- Dashboard → Table Editor → `leads`
- New row with your test submission

### Test 3: Try Different Inquiry Types

Repeat Test 1 but change inquiry type to:
- Performance
- Collaboration
- General

Each should trigger a different auto-reply template.

---

## 🎨 Preview Email Templates (Optional)

Want to see your emails during development?

### Option 1: Using React Email Dev Server

Add this script to `package.json`:

```json
"scripts": {
  "email": "email dev"
}
```

Run:
```bash
npm run email
```

Opens http://localhost:3000 with email previews.

### Option 2: Manual Testing

Send test submissions with different inquiry types and check your inbox.

---

## 🌐 Domain Verification (Production - Optional)

Currently sending from `onboarding@resend.dev`. For production, verify your domain:

### Step 1: Add Domain in Resend

1. Resend Dashboard → **Domains** → **Add Domain**
2. Enter: `aishwaryamanikarnike.com`
3. Resend provides DNS records to add

### Step 2: Add DNS Records

Go to your DNS provider (where domain is registered) and add:

**SPF Record:**
```
Type: TXT
Name: @
Value: v=spf1 include:_spf.resend.com ~all
```

**DKIM Record:**
```
Type: TXT
Name: resend._domainkey
Value: [provided by Resend]
```

**DMARC Record (optional but recommended):**
```
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=none
```

### Step 3: Wait for Verification

- Takes 5-10 minutes
- Resend will show "Verified" status
- Refresh the Domains page

### Step 4: Update API Route

In `app/api/send-email/route.ts`, change these lines:

```typescript
// FROM:
from: 'Contact Form <onboarding@resend.dev>',
from: 'Aishwarya Manikarnike <onboarding@resend.dev>',

// TO:
from: 'Contact Form <noreply@aishwaryamanikarnike.com>',
from: 'Aishwarya Manikarnike <noreply@aishwaryamanikarnike.com>',
```

Redeploy your site.

---

## 🚨 Troubleshooting

### Error: "RESEND_API_KEY is not defined"

**Fix:**
1. Check `.env.local` exists in project root
2. Verify `RESEND_API_KEY=re_xxxxx` is set (no quotes)
3. Restart dev server (`npm run dev`)

### Error: "Failed to send notification email"

**Fix:**
1. Check Resend Dashboard → **Logs** for errors
2. Verify API key is correct
3. Check `ADMIN_EMAIL` is set in `.env.local`
4. Ensure you're not hitting rate limits (100 emails/day on test domain)

### Auto-Reply Not Received

**Fix:**
1. Check spam folder
2. Verify inquiry type is valid (performance, classes, collaboration, general)
3. Check browser console for errors
4. Test with different email provider (Gmail, Outlook, etc.)

### Lead Not Stored in Supabase

**Fix:**
1. Run RLS policy fix (Step 5 above)
2. Verify Supabase credentials in `.env.local`
3. Check Supabase Dashboard → Logs for errors

### Type Errors After Installation

**Fix:**
```bash
npm run type-check
```

If errors persist, try:
```bash
rm -rf node_modules package-lock.json
npm install
```

---

## 📊 Comparison: EmailJS vs Resend

| Feature | EmailJS (Old) | Resend (New) |
|---------|--------------|--------------|
| **OAuth Issues** | ❌ Frequent reconnects | ✅ None - API key based |
| **Free Tier** | 200 emails/month | 3,000 emails/month |
| **Reliability** | ⚠️ Gmail disconnects | ✅ Excellent |
| **Template Management** | Dashboard only | ✅ React components in code |
| **Type Safety** | ❌ No | ✅ TypeScript props |
| **Email Preview** | ❌ No | ✅ Built-in dev server |
| **Custom Domain** | ❌ No | ✅ Yes |
| **Deliverability** | ⚠️ Moderate | ✅ Excellent |
| **Client-Side** | ✅ Yes | ❌ Server-side only |

---

## ✨ Benefits You're Getting

1. **No More OAuth Headaches**
   - No reconnection needed
   - API keys don't expire

2. **Better Templates**
   - React components (easy to maintain)
   - Type-safe with TypeScript
   - Preview during development

3. **More Emails**
   - 3,000/month free vs 200/month
   - 15x increase!

4. **Better Deliverability**
   - Professional sender domain (after verification)
   - Fewer spam issues
   - Built for transactional emails

5. **Easier Maintenance**
   - Templates in code (version controlled)
   - Easy to update and test
   - No dashboard switching

---

## 🎉 You're Done!

Once you've completed the setup steps and tested successfully:

1. ✅ Resend API key configured
2. ✅ Environment variables set
3. ✅ RLS policy fixed
4. ✅ Test submissions successful
5. ✅ Emails received (notification + auto-reply)
6. ✅ Leads stored in Supabase

You can now:
- Delete old EmailJS configuration (keep for backup if worried)
- Remove `@emailjs/browser` dependency later
- Deploy to production

---

## 🚀 Next Steps (Optional)

1. **Verify Custom Domain** - Send from `@aishwaryamanikarnike.com`
2. **Customize Templates** - Edit React components in `emails/` folder
3. **Add More Templates** - Create templates for other use cases
4. **Build Admin Dashboard** - View leads in `/admin/leads` (Phase 2)

---

## 📝 Files Changed

### Created:
- `emails/styles.ts`
- `emails/PerformanceInquiry.tsx`
- `emails/ClassesInquiry.tsx`
- `emails/CollaborationInquiry.tsx`
- `emails/GeneralInquiry.tsx`
- `emails/ContactNotification.tsx`
- `app/api/send-email/route.ts`
- `RESEND_SETUP_GUIDE.md` (this file)

### Modified:
- `components/features/ContactForm.tsx` - Uses API route now
- `.env.example` - Added Resend variables

### Can Delete Later (After Confirming Resend Works):
- `lib/email-service.ts` - Old EmailJS functions
- EmailJS environment variables from `.env.local`

---

## 💡 Tips

- **Keep EmailJS for now** - Don't delete until Resend is proven to work
- **Test thoroughly** - Submit forms with all 4 inquiry types
- **Monitor Resend logs** - First week, check dashboard daily
- **Verify domain ASAP** - Better deliverability for production
- **Check spam folders** - First few emails might land there

---

## 🆘 Need Help?

- **Resend Docs**: https://resend.com/docs
- **React Email Docs**: https://react.email/docs
- **Check Browser Console**: F12 → Console tab for errors
- **Check Resend Logs**: Dashboard → Logs
- **Check Supabase Logs**: Dashboard → Logs

---

Good luck! 🎵✨
