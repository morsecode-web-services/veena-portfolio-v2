# Meta WhatsApp Cloud API — Setup Guide for Personal Brands
### For: Razorpay → Make.com → WhatsApp → Telegram Cohort Flow

> **Who this is for**: Individual creators / personal brands (music teachers, coaches, educators) running paid cohorts — not a registered company.  
> **Cost**: ₹0/month platform fee · ₹0.145/Utility message · ~₹14.50 at 100 msgs/month  
> **Time**: ~2–3 hours setup + up to 24h template approval  
> **Business verification**: Optional to start (250 msgs/day trial works without it)

---

## ⚠️ Personal Brand Reality Check

Meta's WhatsApp API was designed for businesses, but **personal brands and solo creators can absolutely use it**. Here's what you need to know upfront:

| Question | Answer |
|---|---|
| Do I need a registered company? | **No** — a sole proprietorship or even just a personal name works |
| Do I need a GST number? | **No** — required only for Meta's optional business *verification* badge |
| Can I use my personal number? | **No** — it must be unregistered on WhatsApp. Use a 2nd number. |
| Will Meta reject me as an individual? | **No** — you can start sending on the trial tier immediately |
| What's the catch? | Trial tier caps at 250 unique recipients/day (fine for your volume) |

### The Phone Number Problem — Read This First

> [!CAUTION]
> Your existing personal WhatsApp number **cannot** be used for the API while it's active on WhatsApp. You have two choices:

**Option A — Use a 2nd SIM (Recommended)**
- Get a cheap ₹99 Jio/Airtel SIM
- Never register it on WhatsApp personal/business app
- Use this number exclusively for the API
- Students see this as your "official" cohort number

**Option B — Migrate your existing WhatsApp Business number**
- Delete the WhatsApp Business app account from your phone
- Wait 30 days (Meta's deletion cooling period)
- Then register it with the API
- ⚠️ You lose all existing chat history

**Recommendation**: Get a ₹99 Jio SIM. Use it only for API. Keep your personal number for direct conversations.

---

## Overview

```
[Student pays via Razorpay]
        ↓
[Make.com webhook triggers]
        ↓
[WhatsApp Business Cloud module]
        ↓ (uses your Meta credentials)
[Meta Cloud API sends WhatsApp template msg]
        ↓
[Student receives Telegram invite link on WhatsApp]
```

---

## Phase 1: Meta Business Manager Setup

### Step 1.1 — Create Your Meta Business Portfolio

1. Go to **[business.facebook.com](https://business.facebook.com)**
2. Log in with your **personal Facebook account** (this is fine — your personal profile is just the admin)
3. Click **"Create account"**
4. Fill in:
   - **Business name**: Your brand name (e.g., `Veena Music` or your own name — doesn't need to be a legal entity)
   - **Your name**: Your real name
   - **Business email**: Your working email (use a domain email if you have one, e.g., `hello@yourdomain.com`)
5. Verify your email when prompted

### Step 1.2 — Complete Business Info

1. Go to **Settings (⚙️) → Business info**
2. Fill in:
   - **Business address**: Your home/personal address is fine
   - **Website URL**: Your portfolio website (e.g., `yourname.com`)
   - **Phone**: Your contact number
3. Save

> **Do I need Meta Business Verification?**  
> **No — not to start.** The trial tier (250 msgs/day) works without verification. You only need to submit verification documents if you want to scale past 250 msgs/day or get the green checkmark badge. For your cohort volume, skip this for now.

---

## Phase 2: Meta Developer App Setup

### Step 2.1 — Create a Developer App

1. Go to **[developers.facebook.com](https://developers.facebook.com)**
2. Click **My Apps → Create App**
3. Choose use case: **"Other"** → click Next
4. Choose app type: **"Business"** → click Next
5. Fill in:
   - **App name**: e.g., `Veena Cohort Notifications`
   - **App contact email**: your email
   - **Business Portfolio**: select the one you created in Phase 1
6. Click **Create App**

### Step 2.2 — Add the WhatsApp Product

1. Inside your app dashboard, scroll to **"Add products to your app"**
2. Find **WhatsApp** → click **Set up**
3. You'll be in the WhatsApp Quickstart page

### Step 2.3 — Create a WhatsApp Business Account (WABA)

1. In the WhatsApp setup wizard, under "Step 1", click **"Get started"**
2. You'll see an option to create a new **WhatsApp Business Account**
3. Fill in:
   - **WhatsApp Business Account name**: `Veena Music Cohorts` (or your brand name)
   - **WhatsApp Business Profile display name**: What students will see (e.g., `Veena Music`)
   - **Category**: **Education**
   - **Business description**: Brief one-liner about your cohorts
4. Click **Continue**

> **Display name rules**: Must match your brand. Meta rejects names that look like they're impersonating another business. Your personal brand name or your real name is perfectly acceptable.

### Step 2.4 — Add Your Phone Number

1. In the left sidebar: **WhatsApp → API Setup**
2. Under "Step 1: Select a phone number" → click **"Add phone number"**
3. Enter the **2nd SIM number** you got (not your personal WhatsApp number)
   - Display name: Your brand name (e.g., `Veena Music`)
   - Category: **Education**
   - Phone number: with country code (`+91XXXXXXXXXX`)
4. Choose verification method: **SMS** (simpler) or Voice call
5. Enter the OTP you receive
6. ✅ Once verified, your **Phone Number ID** appears — copy and save this immediately

---

## Phase 3: Collect Your 3 Credentials

You need **exactly 3 values** for Make.com. Get them all before proceeding.

### Step 3.1 — Phone Number ID

- Location: **WhatsApp → API Setup → Step 1** (shown after phone verification)
- Looks like: `123456789012345`
- ✅ Copy and save

### Step 3.2 — WhatsApp Business Account ID (WABA ID)

- Location: **WhatsApp → API Setup → Step 1** (just below Phone Number ID)
- OR: Sidebar → **WhatsApp → Configuration**
- Looks like: `987654321098765`
- ✅ Copy and save

### Step 3.3 — Permanent Access Token ⚠️ CRITICAL

> [!CAUTION]
> The green **"Copy"** button on the API Setup page gives you a **temporary token that expires in 24 hours**. Using this in Make.com will silently break your automation overnight. Do not use it.

**Create a non-expiring System User token:**

1. Go to **[business.facebook.com](https://business.facebook.com)**
2. Navigate to: **Settings (⚙️) → Users → System Users**
3. Click **"Add"** → create a system user:
   - **Name**: `make-com-bot`
   - **Role**: Admin
4. Click **"Generate New Token"** on the system user
5. Select your app (from Step 2.1)
6. Set expiry: **"Never"**
7. Select **permissions**:
   - ✅ `whatsapp_business_messaging`
   - ✅ `whatsapp_business_management`
8. Click **Generate Token** → **copy it immediately** (shown only once)

**Then assign this system user to your WhatsApp account:**
1. Still on the system user → click **"Add Assets"**
2. Choose **WhatsApp Accounts**
3. Select your WABA
4. Set permission: **Full control**
5. Click **Save**

✅ Done. This token never expires and will keep Make.com running indefinitely.

---

## Phase 4: Create Your Message Template

### Step 4.1 — Open Template Manager

1. Go to **[business.facebook.com/wa/manage/message-templates/](https://business.facebook.com/wa/manage/message-templates/)**
2. Select your WABA from the dropdown
3. Click **"Create template"**

### Step 4.2 — Template Settings

| Field | Value |
|---|---|
| **Category** | **Utility** ← must be this (₹0.145/msg vs ₹1.09 for Marketing) |
| **Name** | `cohort_enrollment_confirmation` |
| **Language** | English |

### Step 4.3 — Write the Body

```
Hi {{1}}, your payment was received! 🎉

You're now enrolled in the cohort. Join your Telegram group here:
{{2}}

See you inside! 🎵
```

**Sample values** (required by Meta for review):
- `{{1}}` → `Priya`
- `{{2}}` → `https://t.me/+examplelink`

### Step 4.4 — Optional Extras

- **Header**: `Enrollment Confirmed ✅` (text, optional)
- **Footer**: Your brand name (optional)
- **Buttons**: None needed

### Step 4.5 — Submit

Click **"Submit"**. Status becomes **"Pending"** → approved in minutes to 24 hours.

> **If rejected**: Meta rejects templates that look like marketing (promos, offers). Make the language more neutral/transactional. Example: Remove exclamation marks and emojis if needed.  
> **Re-submit tip**: Change the template name slightly (e.g., `cohort_enrollment_v2`) when resubmitting.

---

## Phase 5: Connect to Make.com

### Step 5.1 — Add the Module

1. Open your Make.com scenario (Razorpay webhook flow)
2. Click **+** after the Razorpay trigger
3. Search: **"WhatsApp Business Cloud"**
4. Action: **"Send a Template Message"**

### Step 5.2 — Create the Connection

1. Click **"Add"** next to Connection
2. Fill in:
   - **Connection name**: `Meta WhatsApp - Veena Music`
   - **Phone Number ID**: from Step 3.1
   - **Access Token**: your permanent system user token from Step 3.3
3. Click **Save**

### Step 5.3 — Configure the Module

| Field | Value |
|---|---|
| **Recipient Phone Number** | `+91{{1.payload.payment.entity.notes.phone}}` |
| **Template Name** | `cohort_enrollment_confirmation` |
| **Language Code** | `en` |

**Template parameters:**

```
Parameter 1 (text): {{1.payload.payment.entity.notes.name}}
Parameter 2 (text): https://t.me/+YOUR_TELEGRAM_INVITE_LINK
```

> **Phone format**: Must be E.164 — `+` prefix + country code + number, no spaces.  
> If Razorpay notes stores `9876543210` → use `+91{{phone}}`  
> If it stores `+919876543210` → use as-is

### Step 5.4 — Disable the Twilio Module

Right-click the old Twilio module → **"Disable"** (don't delete yet — keep as reference until this is confirmed working).

---

## Phase 6: Test Before Going Live

### Step 6.1 — Meta's Built-in Test Tool

1. **WhatsApp → API Setup → Step 2: Send messages**
2. Enter your own number as recipient
3. Select your approved template
4. Add sample parameters
5. Click **Send message**
6. ✅ Confirm you receive it on WhatsApp

### Step 6.2 — Make.com Run Once

1. Click **"Run once"** in Make.com
2. Trigger a test Razorpay payment (test mode)
3. Verify both modules turn green
4. Check the WhatsApp message arrives correctly

### Step 6.3 — Error Troubleshooting

| Error | Cause | Fix |
|---|---|---|
| `Invalid parameter` | Phone number format wrong | Ensure `+91` prefix, no spaces |
| `Template not found` | Name doesn't match exactly | Copy-paste template name from Meta |
| `Template not approved` | Still pending | Wait and retry |
| `Access token expired` | Used temporary token | Use System User token (Step 3.3) |
| `Permission denied` | System User not linked to WABA | Redo Step 3.3 asset assignment |
| `Parameter count mismatch` | Wrong param count | Template has 2 vars → send exactly 2 |
| `(131030) Re-engagement message` | Student number format issue | Verify E.164 format |

---

## Phase 7: Messaging Limits & Scaling

| Tier | Limit/day | How to Reach |
|---|---|---|
| **Trial (default)** | 250 unique recipients | Immediate — no action needed |
| **Tier 1** | 1,000 unique recipients | Auto-upgrade after consistent quality sends |
| **Tier 2** | 10,000/day | Auto-upgrade with volume |

**At your volume (50–200 msgs/month), you will never leave Trial tier.** No verification documents, no GST, no business registration needed.

### Optional: Meta Business Verification (For the Future)

If you ever want to:
- Remove the "Trial" limit
- Get the green ✅ verified badge
- Scale past 250 msgs/day

You'd submit one of these documents to Meta:
- **Udyam Registration** (free MSME registration at [udyamregistration.gov.in](https://udyamregistration.gov.in)) — easiest for a personal brand
- OR a GST certificate (if you have one)
- OR your PAN card + bank statement showing business activity

Udyam is free, takes 10 minutes, and is the simplest path for solo creators in India.

---

## Your Credentials (Save Securely)

Add these to your `.env.local`:

```bash
# Meta WhatsApp Cloud API
META_WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id_here
META_WHATSAPP_WABA_ID=your_waba_id_here
META_WHATSAPP_ACCESS_TOKEN=your_never_expiring_system_user_token_here
META_WHATSAPP_TEMPLATE_NAME=cohort_enrollment_confirmation
```

---

## Cost at Your Volume

| Monthly Enrollments | WhatsApp Cost |
|---|---|
| 25 | ₹3.63 |
| 50 | ₹7.25 |
| 100 | ₹14.50 |
| 200 | ₹29.00 |

**Billing**: Pre-paid WhatsApp credits. Top up via Meta Business Manager → Billing → Add payment method (UPI / card).  
**Minimum top-up**: ~$5 USD (~₹420) — lasts months at your volume.

---

## Related Docs
- [Twilio WhatsApp Setup](./TWILIO_WHATSAPP_SETUP.md) — sandbox testing only (keep for dev)
- [Verification Setup](./verification-setup.md) — phone/email validation on enrollment form
- [Re-enrollment Strategy](./REENROLLMENT_STRATEGY_ANALYSIS.md) — returning student flow
