# WhatsApp Business Cloud API Setup Guide

This guide explains how to set up the official Meta WhatsApp Cloud API for automated messaging via Make.com. This is the most cost-effective option for high volumes.

## 1. Create a Meta Developer App
1. Go to [Meta for Developers](https://developers.facebook.com/).
2. Log in with your Facebook account.
3. Click **My Apps** -> **Create App**.
4. Select **Other** -> **Business**.
5. Give your app a name (e.g., `ArtistPortfolioVault`).

## 2. Add WhatsApp to your App
1. On the App Dashboard, scroll down to **WhatsApp** and click **Set up**.
2. Select your **Business Account** (or create a new one).
3. Meta will provide you with a **Temporary Access Token** and a **Phone Number ID**. (Note: Temporary tokens expire in 24 hours. For production, you must generate a Permanent System User Token in your Business Settings).

## 3. Create a Message Template (MANDATORY)
Meta does not allow you to send free-text messages to customers first. You must use a pre-approved template.
1. In the WhatsApp setup menu, go to **Step 2: Send messages with the API**.
2. Click the link to **Create a Message Template**.
3. Click **Create Template**:
   - **Category**: Marketing or Utility.
   - **Name**: `vault_access_link`.
   - **Language**: English (or your choice).
4. **Template Body**:
   - Write your message. Use `{{1}}` as a placeholder for the Telegram link.
   - Example: `Hi! Thank you for subscribing. Here is your unique link to join the exclusive Telegram vault: {{1}}. Please do not share this link!`
5. Click **Submit** and wait for approval (usually under 5 minutes).

## 4. Connect to Make.com
1. In Make.com, add the **WhatsApp Business Cloud API** module.
2. Select **Send a Template Message**.
3. Click **Add** to create a connection:
   - **Access Token**: Paste your Permanent Token.
   - **Phone Number ID**: Paste the ID from your Meta Dashboard.
4. **Recipient Phone Number**: Map the phone variable from Razorpay: `{{1.payload.payment.entity.notes.phone}}`.
5. **Template**: Select `vault_access_link`.
6. **Components/Variables**:
   - You will see a field for `Variable 1`.
   - Map the **Invite Link** from the preceding Telegram module to this field.

## 5. Testing
1. Add your own phone number as a **Recipient** in the Meta Developer portal (under WhatsApp -> Configuration) before you can send messages to yourself for free during testing.
2. Run the Make.com scenario once to verify.
