# Make.com Automation Setup Guide

This guide details how to automatically send a **Single-Use Telegram Invite Link** to subscribers when their Razorpay payment is successful.

---

## Step 0: Telegram Setup (The Source)

### 1. Create a Private Channel
*   Open Telegram and create a **New Channel**.
*   Name: (e.g., "Aishwarya's Premium Content")
*   Type: **Private** (Crucial).

### 2. Create a Bot (The Assistant)
*   Message **@BotFather** on Telegram.
*   Type `/newbot` and follow instructions to get your **API Token** (Save this!).

### 3. Add Bot as Admin
*   Go to your Channel > Settings > **Administrators** > **Add Admin**.
*   Search for your bot and add it. 
*   **Permissions**: Ensure "Manage Invite Links" is **ON**.

### 4. Get Channel ID (The Fail-Safe Way)
*   Post a message in your channel.
*   Visit this URL in your browser (replace with your token):
    `https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates`
*   Find the `"chat":{"id":-100...}` part. 
*   **IMPORTANT**: Copy the entire number **including the -100** (e.g., `-100123456789`). If you miss the `-100`, Make.com will return a "chat not found" error.

---

## Step 1: Create a New Scenario in Make.com
1. Log in to [Make.com](https://www.make.com/) and click **Create a new scenario**.

## Step 2: Set Up the Custom Webhook Trigger
To handle both one-time payments and subscriptions in one scenario, we use a generic Webhook.

1.  Click the `+` icon and search for **Webhooks** (red hook icon).
2.  Select **Custom Webhook**.
3.  Click **Add**, name it "Razorpay Global Trigger", and click **Save**.
4.  Copy the generated **Webhook URL**.
5.  Go to your **Razorpay Dashboard** > Settings > Webhooks > **Add New Webhook**.
6.  **Webhook URL**: Paste the URL from Make.
7.  **Active Events**: Select **BOTH** of these:
    *   `payment.captured` (For one-time payments/classes)
    *   `subscription.charged` (For monthly memberships)
8.  Click **Create Webhook**.
9.  In Make.com, click **"Determine data structure"**, then perform a test payment on your site to allow Make to capture the field names.

## Step 3: Generate the Telegram Invite Link
1. Click the next `+` in Make and search for **Telegram Bot**.
2. Select **Create a Chat Invite Link**.
3. **Connection**: Add a connection using your Bot API Token from Step 0.
4. **Chat ID**: Paste your `-100...` Channel ID.
5. **Member Limit**: Set to `1` (This makes it a single-use link for security).
6. **Expire Date**: (Optional) Set to one day from now using `{{addDays(now; 1)}}`.

## Step 4: Send the Link to the User

### 4.1 Send via Email (Resend)
1. Add a new module and search for **HTTP** (or search for the "Resend" app if available).
2. **If using the HTTP Module**:
   - **Method**: `POST`
   - **URL**: `https://api.resend.com/emails`
   - **Headers**: 
     - `Authorization`: `Bearer YOUR_RESEND_API_KEY`
     - `Content-Type`: `application/json`
   - **Body Type**: `Raw`
   - **Content**: 
     ```json
     {
       "from": "Aishwarya <official@email.aishwaryamanikarnike.com>",
       "to": "{{email}}",
       "subject": "Welcome! Your Telegram Access Link",
       "html": "<p>Hi! Thank you for your payment. Here is your exclusive invite link to the private Telegram group: <strong>{{invite_link}}</strong></p><p>Please note: This link will expire after one use.</p>"
     }
     ```

### 4.2 Send via WhatsApp (Optional)
1. Add another module (e.g., **WhatsApp Cloud API** or **Twilio**).
2. **Recipient**: Use the `phone` from the Razorpay trigger data.
3. **Message Content**: 
   "Hi! Thank you for your payment. Here is your exclusive invite link to the Telegram group: `{{invite_link}}`"

---

## Troubleshooting
- **Bot can't create link**: Check that the bot is an Admin in the channel and has "Manage Invite Links" permission.
- **Wrong Chat ID**: Ensure the ID starts with `-100`.
- **Payment not triggering**: Make sure you selected both `subscription.charged` and `payment.captured`.
- **Email missing in Resend**: Since one-time payments and subscriptions store emails in different places, use this formula in the "to" field: 
  `{{ifempty(payload.payment.entity.email; payload.subscription.entity.email)}}`
