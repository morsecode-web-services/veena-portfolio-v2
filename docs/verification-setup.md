# 🛡️ Enrollment Verification Setup Guide

To enable "Soft Verification" (Email & WhatsApp validation) for your cohort enrollments, follow these steps to get your free API keys.

---

## 1. Email Verification (BigDataCloud)
Checks if the email is real and deliverable. Allows personal email sign-ups.

1.  **Sign Up**: Go to [BigDataCloud Email Verification](https://www.bigdatacloud.com/email-verification-api).
2.  **Get Key**: Copy your **API Key** from your account dashboard.
3.  **Free Tier**: **500 requests per month**.
4.  **Config**: Add to `.env.local` as `BIGDATACLOUD_API_KEY`.

---

## 2. Phone/WhatsApp Validation (Veriphone)
Checks if the number is an active mobile line (WhatsApp capable) and currently reachable.

1.  **Sign Up**: Go to [Veriphone.io](https://veriphone.io/).
2.  **Get Key**: Copy your **API Key** from the dashboard.
3.  **Free Tier**: 1,000 requests/month.
4.  **Config**: Add to `.env.local` as `VERIPHONE_API_KEY`.

---

## 3. Environment Configuration
Add these to your `/Users/nageshraj/Desktop/projects/portfolio-v2/.env.local` file:

```bash
# Verification APIs
BIGDATACLOUD_API_KEY=your_bigdatacloud_key_here
VERIPHONE_API_KEY=your_veriphone_key_here
```

---

## How it Works
1.  **Invisible Check**: When a user clicks "Pay & Enroll", the system pings these APIs in the background.
2.  **Fail-Open**: If the APIs don't respond within 3 seconds, we let the user through anyway to avoid blocking sales.
3.  **Validation Rules**: 
    *   Email must be "deliverable".
    *   Phone must be a "mobile" line type.
