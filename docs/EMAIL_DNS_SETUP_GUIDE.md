# Email & DNS Setup Guide

This guide explains how to configure your DNS records in Netlify to support both **GoDaddy Email** (receiving) and **Resend** (sending).

## Current Architecture
- **Domain Registrar**: GoDaddy
- **DNS Hosting**: Netlify (Nameservers pointed to Netlify)
- **Email Service (Receiving)**: GoDaddy Workspace/M365
- **Email Service (Sending)**: Resend

> [!IMPORTANT]
> Because your nameservers are pointed to Netlify, **you must add these records in the Netlify Dashboard**, not GoDaddy. GoDaddy's DNS settings will have no effect.

---

## Step 1: Fix Receiving Emails (GoDaddy MX)
To receive emails at `official@aishwaryamanikarnike.com`, add these MX records in Netlify:

| Type | Name | Priority | Value |
| :--- | :--- | :--- | :--- |
| **MX** | `@` | `10` | `smtp.secureserver.net` |
| **MX** | `@` | `20` | `mailstore1.secureserver.net` |

*Note: If you use Microsoft 365 via GoDaddy, your value will look like `yourdomain-com.mail.protection.outlook.com`. Check your GoDaddy "Email & Office" dashboard if these generic ones don't work.*

---

## Step 2: Fix Deliverability (Combined SPF)
To prevent your emails from being marked as spam by Gmail/Outlook, you need an SPF record. You should only have **one** SPF record per domain. This record tells the world that both GoDaddy and Resend are authorized to send mail for you.

Add this **TXT** record in Netlify:

| Type | Name | Value |
| :--- | :--- | :--- |
| **TXT** | `@` | `v=spf1 include:secureserver.net include:_spf.resend.com ~all` |

---

## Step 3: Fix Resend Verification (DKIM)
Resend requires DKIM records to verify your domain ownership. Go to your [Resend Dashboard](https://resend.com/domains) and find your domain. It will provide **3 CNAME records**.

Add them to Netlify like this:

| Type | Name | Value |
| :--- | :--- | :--- |
| **CNAME** | `resend._domainkey` | *[Copy from Resend]* |
| **CNAME** | `resend2._domainkey` | *[Copy from Resend]* |
| **CNAME** | `resend3._domainkey` | *[Copy from Resend]* |

---

## Step 4: Verification
1. **Wait for Propagation**: DNS changes usually take 15–60 minutes but can take up to 24 hours.
2. **Check Resend**: Go to the Resend dashboard and click **"Verify"**. All records should turn green.
3. **Test Inbound**: Send an email from a personal account to `official@aishwaryamanikarnike.com`.
4. **Test Outbound**: Send a test email from your application (via Resend) to a service like [Mail-Tester](https://www.mail-tester.com/) to check your score.

---

## Why am I seeing errors in GoDaddy?
GoDaddy's dashboard checks its own internal DNS records. Since you switched to Netlify DNS, GoDaddy's check "fails" even if the records are correctly set up in Netlify. Once you add the records to Netlify, your email will work perfectly, even if GoDaddy still shows a warning.
