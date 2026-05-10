# Troubleshooting Guide - Lead Capture System (Resend)

## Error 1: "new row violates row-level security policy for table 'leads'"

**Symptom:**
```
POST .../rest/v1/leads 403 (Forbidden)
Failed to store lead: {code: '42501', message: 'new row violates row-level security policy for table "leads"'}
```

**Cause:** Supabase Row-Level Security (RLS) policies are blocking anonymous inserts.

### Solution: Fix RLS Policies

1. Go to Supabase Dashboard → SQL Editor
2. Run this SQL:

```sql
-- Drop existing policies
DROP POLICY IF EXISTS "Allow anonymous lead submissions" ON public.leads;
DROP POLICY IF EXISTS "Authenticated users can view all leads" ON public.leads;
DROP POLICY IF EXISTS "Authenticated users can update leads" ON public.leads;
DROP POLICY IF EXISTS "Enable insert for anon users" ON public.leads;
DROP POLICY IF EXISTS "Enable read for authenticated users" ON public.leads;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.leads;

-- Enable RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Allow all inserts (anyone can submit form)
CREATE POLICY "Allow all inserts"
  ON public.leads
  FOR INSERT
  WITH CHECK (true);

-- Allow authenticated users to select
CREATE POLICY "Allow authenticated select"
  ON public.leads
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to update
CREATE POLICY "Allow authenticated update"
  ON public.leads
  FOR UPDATE
  TO authenticated
  USING (true);
```

3. Click "Run"
4. Verify policies created:
```sql
SELECT policyname, cmd, roles FROM pg_policies WHERE tablename = 'leads';
```

### Alternative: Disable RLS Temporarily

For testing only:
```sql
ALTER TABLE public.leads DISABLE ROW LEVEL SECURITY;
```

**Note:** Re-enable RLS for production.

---

## Error 2: "You can only send testing emails to your own email address"

**Symptom:**
```
Failed to send auto-reply: {
  statusCode: 403,
  name: 'validation_error',
  message: 'You can only send testing emails to your own email address...'
}
```

**Cause:** Resend's test domain (`onboarding@resend.dev`) can only send to the email you signed up with.

### Solution A: Test with Your Own Email (Quick)

For immediate testing, submit the form using your Resend signup email address.

### Solution B: Verify Your Domain (Production)

1. **Add Domain in Resend:**
   - Go to https://resend.com/domains
   - Click "Add Domain"
   - Enter: `yourdomain.com`

2. **Add DNS Records:**

   Go to your DNS provider and add these records:

   **SPF Record:**
   ```
   Type: TXT
   Name: @
   Value: v=spf1 include:_spf.resend.com ~all
   TTL: 3600
   ```

   **DKIM Record:**
   ```
   Type: TXT
   Name: resend._domainkey
   Value: [provided by Resend - copy exactly]
   TTL: 3600
   ```

   **DMARC Record (optional):**
   ```
   Type: TXT
   Name: _dmarc
   Value: v=DMARC1; p=none
   TTL: 3600
   ```

3. **Wait for Verification (5-10 minutes)**

4. **Update API Route:**

   In `app/api/send-email/route.ts`, change:
   ```typescript
   from: 'Contact Form <onboarding@resend.dev>'
   ```
   to:
   ```typescript
   from: 'Contact Form <noreply@yourdomain.com>'
   ```

---

## Error 3: "RESEND_API_KEY is not defined"

**Symptom:**
```
Error: RESEND_API_KEY is not defined
```

**Cause:** Missing environment variable.

### Solution:

1. **Check `.env.local` file exists** in project root
2. **Verify variable is set:**
```bash
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
ADMIN_EMAIL=your@email.com
```

3. **Restart development server:**
```bash
# Stop the server (Ctrl+C)
npm run dev
```

4. **Check for extra spaces/quotes:**
   - ✅ Correct: `RESEND_API_KEY=re_abc123`
   - ❌ Wrong: `RESEND_API_KEY="re_abc123"`
   - ❌ Wrong: `RESEND_API_KEY= re_abc123 `

---

## Error 4: Form Submits But No Email Received

### A. Check Resend Logs

1. Go to Resend Dashboard: https://resend.com/
2. Click "Logs" (left sidebar)
3. Look for recent email sends
4. Check for error messages

### B. Check Spam Folder

- Check your spam/junk folder
- Mark Resend emails as "Not Spam"

### C. Verify Environment Variables

```bash
# In .env.local
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
ADMIN_EMAIL=your@email.com
```

Make sure `ADMIN_EMAIL` is correct.

### D. Check Rate Limits

**Test Domain (`onboarding@resend.dev`):**
- 100 emails per day limit

**Verified Domain:**
- 3,000 emails per month (free tier)

---

## Error 5: Auto-Reply Not Sent

**Symptom:** Notification received but user doesn't get auto-reply.

**Note:** Auto-reply failures are non-blocking - they're logged but don't stop form submission.

### Debug Steps:

1. **Check Browser Console (F12):**
   - Look for: "Failed to send auto-reply" error
   - Check the error details

2. **Verify Domain Status:**
   - If using test domain: Only works for your signup email
   - If using custom domain: Check it's verified in Resend

3. **Check Resend Logs:**
   - Dashboard → Logs
   - Look for auto-reply send attempts
   - Check error messages

4. **Verify Inquiry Type:**
   - Must be: `performance`, `classes`, `collaboration`, or `general`
   - Check browser network tab for API request payload

---

## Error 6: Lead Not Stored in Supabase

### Fix:

1. **Run RLS Policy Fix:**
   - See Error 1 solution above

2. **Verify Supabase Credentials:**
```bash
# In .env.local
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxxx
```

3. **Check Supabase Logs:**
   - Dashboard → Logs
   - Filter by "Error"
   - Look for INSERT failures

4. **Verify Table Exists:**
   - Dashboard → Table Editor
   - Check `leads` table exists
   - Run the migration if missing

---

## Error 7: Type Errors After Installation

**Symptom:**
```
Cannot find module 'resend' or its corresponding type declarations
```

**Fix:**

1. **Install all packages:**
```bash
npm install resend react-email @react-email/components @react-email/render
```

2. **Clear cache and reinstall:**
```bash
rm -rf node_modules package-lock.json
npm install
```

3. **Verify installation:**
```bash
npm list resend react-email
```

---

## Debugging Checklist

### Database (Supabase):
- [ ] `leads` table exists in Supabase Table Editor
- [ ] Table has correct columns (id, name, email, phone, inquiry_type, message, status, created_at, updated_at)
- [ ] RLS has permissive insert policy
- [ ] Environment variables set: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Email (Resend):
- [ ] Resend API key is valid
- [ ] `RESEND_API_KEY` set in `.env.local`
- [ ] `ADMIN_EMAIL` set in `.env.local`
- [ ] Domain verified (for production) OR using test domain with correct email
- [ ] Not hitting rate limits
- [ ] Check Resend Dashboard → Logs for errors

### Form Behavior:
- [ ] Form shows "Inquiry Type" dropdown
- [ ] All fields required (validated)
- [ ] Form submits without console errors
- [ ] Success message appears
- [ ] Form resets after submission

### Data Flow:
- [ ] Lead appears in Supabase Table Editor
- [ ] Notification email received (check spam)
- [ ] Auto-reply email received (check spam, verify domain for production)
- [ ] Google Analytics event tracked (if GA configured)

---

## Quick Test Command

Verify TypeScript compilation:
```bash
npm run type-check
```

Should complete without errors.

---

## Common Mistakes

1. **Forgot to restart dev server** after changing `.env.local`
2. **RLS blocking inserts** (use Error 1 solution)
3. **Using test domain for production** (verify custom domain)
4. **Wrong email in test submissions** (must match signup email for test domain)
5. **Missing environment variables**
6. **Forgot to run migration** to create `leads` table
7. **Using quotes in `.env.local`** (don't quote values)

---

## Working Example

After fixing all issues:

1. User fills form:
   - Name: John Doe
   - Phone: +1 234 567 8900
   - Email: john@example.com
   - Inquiry Type: Private Classes
   - Message: I want to learn Veena

2. User clicks "Send Message"

3. System:
   - ✅ Stores in Supabase
   - ✅ Sends notification to admin
   - ✅ Sends auto-reply to john@example.com
   - ✅ Shows success message
   - ✅ Resets form

4. Admin receives:
```
Subject: New classes inquiry from John Doe

Inquiry Type: CLASSES
Name: John Doe
Email: john@example.com
Phone: +1 234 567 8900

Message:
I want to learn Veena
```

5. John receives:
```
Subject: Thank you for your interest in classes

Dear John Doe,

Thank you for your interest in private classes! I'm delighted to hear from you.

I offer personalized instruction in:
• Saraswati Veena (Carnatic style)
• Carnatic Vocal Music
• Music Theory & Composition

I will reach out within 24-48 hours to discuss your goals...
```

---

## Getting Help

If issues persist:

1. **Check Resend Dashboard:**
   - https://resend.com/ → Logs
   - Look for failed sends

2. **Check Supabase Dashboard:**
   - Dashboard → Logs
   - Filter by "Error"

3. **Check Browser Console:**
   - F12 → Console tab
   - Look for red errors

4. **Documentation:**
   - Resend Docs: https://resend.com/docs
   - React Email Docs: https://react.email/docs
   - Supabase Docs: https://supabase.com/docs

---

## 🆘 Still Stuck?

Make sure you've completed:
1. ✅ Installed packages: `npm install resend react-email @react-email/components @react-email/render`
2. ✅ Set up `.env.local` with Resend API key and admin email
3. ✅ Fixed Supabase RLS policies
4. ✅ Restarted dev server
5. ✅ Either verified domain OR testing with your Resend signup email

Good luck! 🚀
