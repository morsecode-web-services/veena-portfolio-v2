# Razorpay Setup Guide

This guide explains how to configure Razorpay for the automated Telegram subscription system.

## 1. Getting Your API Keys
1. Log in to your [Razorpay Dashboard](https://dashboard.razorpay.com/).
2. On the left menu, scroll down to **Settings** -> **API Keys**.
3. Click **Generate Key** (Use Test Mode for development).
4. Copy the **Key Id** and **Key Secret**.
5. Add them to your `.env.local` (and Netlify environment variables when deploying):
   ```env
   RAZORPAY_KEY_ID=rzp_test_xxxxxx
   RAZORPAY_KEY_SECRET=xxxxxx
   RAZORPAY_WEBHOOK_SECRET=your_random_secret_string
   ```

## 2. Setting Up the Fallback Webhook (Optional but Recommended)
To prevent orphaned subscriptions (when a user pays but closes the tab before the form saves), we have a built-in Next.js webhook.
1. In the Razorpay Dashboard, go to **Settings** -> **Webhooks**.
2. Click **Add New Webhook**.
3. **Webhook URL:** `https://yourdomain.com/api/webhooks/razorpay`
4. **Secret:** Paste the exact same `RAZORPAY_WEBHOOK_SECRET` you put in your `.env.local`.
5. **Active Events:** Select `subscription.charged`.
6. Click **Create Webhook**.

## 3. Creating a Subscription Plan (Recurring)
Because we are charging users on a recurring basis, you need to create a Plan.
1. In the Razorpay Dashboard, go to **Subscriptions** -> **Plans**.
...
5. Copy the **Plan ID** (e.g., `plan_Nxxxxxx`).

## 4. Setting up a One-Time Payment (Selling Past Vaults)
For selling archives or one-time access, you don't need a Plan. 
1. Just decide on the price (e.g., ₹500).
2. Note: You will enter this amount directly in your Admin Panel for the specific form.

## 5. Configuring the Dynamic Form
1. Go to your Admin Panel in the portfolio (`/admin/forms`).
2. Create or edit a form (e.g., slug `june-vault`).
3. Scroll down to **Payment Settings (Razorpay)**.
4. Toggle **Require Payment: ON**.
5. Select **Payment Type: One-Time** (or Subscription).
6. Enter the **Amount** for One-Time payments, or the **Plan ID** for Subscriptions.
7. Click **Save Changes**.

## 6. Sunsetting or Stopping the Service
If you decide to stop the recurring service (e.g., after 6 months), follow these steps to ensure users are not charged further:

### Step 1: Deactivate the Form
1. Go to your Admin Panel (`/admin/forms`).
2. Toggle the specific vault form to **Inactive**.
3. This prevents any new users from signing up or seeing the payment checkout.

### Step 2: Cancel Active Subscriptions in Razorpay
Razorpay will continue to charge existing subscribers until you manually cancel their subscriptions.
1. Log in to the **Razorpay Dashboard**.
2. Go to **Subscriptions** -> **Subscriptions** list.
3. Use the filters to find active subscriptions for your plan.
4. Click **Cancel Subscription** for each user.
   - **Immediately**: Stops the subscription right now (user loses access immediately).
   - **At the end of cycle**: Let the user finish their current paid month, and don't charge them again.

### Step 3: Stop the Automation
1. If you are using **Make.com**, toggle your vault scenarios to **OFF**.
2. In **Telegram**, you may want to revoke the invite link used for the vault to prevent any further entries.
