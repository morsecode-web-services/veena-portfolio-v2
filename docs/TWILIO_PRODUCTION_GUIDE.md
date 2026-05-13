# Twilio Production Setup Guide

This guide explains how to move your Twilio integration from Sandbox to Production for WhatsApp.

## 1. Getting Started (Account Creation)

### Step 1.1: Sign Up
1. Go to [Twilio.com](https://www.twilio.com/) and click **Sign Up**.
2. Enter your details and verify your **Email Address**.
3. Verify your **Phone Number** via SMS.
4. Twilio will ask "What are you building?" — Choose **SMS** or **WhatsApp** and **Node.js** as your language.

### Step 1.2: Utilise the Free Trial
*   **Trial Credits**: Twilio usually gives you **$15.50** in free credits to start.
*   **Sandbox**: You can use the WhatsApp Sandbox immediately to send messages to your own "whitelisted" number for free.
*   **Limitations**: Trial accounts add a "Sent from your Twilio trial account" watermark to messages and can only send to verified numbers.

---

## 2. Upgrading & Payments

To move to production and remove watermarks, you must upgrade.

### Step 2.1: Add Payment Method
1. In the Twilio Console, click **Upgrade Project** (top right).
2. **Address**: Enter your billing address.
3. **Payment**: Add a Credit/Debit Card or PayPal.
4. **Initial Deposit**: You typically need to add a minimum of **$20** to your balance to upgrade.

### Step 2.2: Auto-Recharge
Twilio uses a **Pre-paid Balance** system.
1. Go to **Billing → Payment Methods**.
2. Enable **Auto-Recharge**.
3. Set a "Trigger amount" (e.g., $10) and a "Recharge amount" (e.g., $20).
4. When your balance hits $10, Twilio will automatically charge your card $20. This ensures your cohort notifications never stop due to zero balance.

---

## 3. WhatsApp Production Setup
To send messages to any user without them joining a sandbox, you need a verified WhatsApp Sender.

### Step 2.1: Request a WhatsApp Sender
1. Go to **Messaging → Senders → WhatsApp Senders**.
2. Click **Register a WhatsApp Sender**.
3. You will need your **Meta Business Manager ID**.
4. Once approved, you will get a production WhatsApp number (e.g., `whatsapp:+91XXXXXXXXXX`).
5. Update `TWILIO_WHATSAPP_FROM` in your `.env.local` with this number.

### Step 2.2: Create a Content Template (Required)
Twilio uses the **Content Editor** for production WhatsApp templates.
1. Go to **Messaging → Content Editor**.
2. Create a new Content. 
3. Name it `cohort_welcome`.
4. Body: `Hi {{1}}, your payment was received! Join your cohort group here: {{2}}`
5. Submit for approval (Meta usually takes 1-24 hours).
6. Once approved, copy the **Content SID** (starts with `HX...`).
7. Update `TWILIO_WHATSAPP_CONTENT_SID` in your `.env.local`.

---

## 4. Environment Variables Checklist
Ensure these are set in your production environment (Netlify/Vercel):

```bash
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=your_token
TWILIO_WHATSAPP_FROM=whatsapp:+your_prod_number
TWILIO_WHATSAPP_CONTENT_SID=HX...
```

## 5. Testing
Once configured, use the **Admin Automation Dashboard** to toggle on the Twilio channels. The execution logs will show any errors returned by the Twilio API.
