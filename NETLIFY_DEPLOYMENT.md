# 🚀 Netlify Deployment Guide

Follow these steps to deploy your site to `aishwaryamanikarnike.com`.

---

## Step 1: Push Changes to GitHub
Make sure all recent changes (Resend fixes, Netlify config) are pushed to your GitHub repository.

```bash
git add .
git commit -m "Prepare for Netlify deployment"
git push origin main
```

---

## Step 2: Import Project in Netlify
1. Log in to [Netlify Dashboard](https://app.netlify.com/)
2. Click **"Add new site"** → **"Import an existing project"**
3. Select **GitHub** and authorize if needed.
4. Select your repository: `veena-portfolio-v2` (or your repo name).
5. **Site Settings**:
   - **Branch**: `main`
   - **Build command**: `npm run build`
   - **Publish directory**: `.next` (Netlify handles this automatically for Next.js)

---

## Step 3: Add Environment Variables
Before clicking "Deploy", scroll down to **"Environment variables"**:
Add these from your `.env.local` (Copy the exact values):

| Key | Value |
| :--- | :--- |
| `RESEND_API_KEY` | `re_xxxxxxxxxxxx` |
| `ADMIN_EMAIL` | `official@aishwaryamanikarnike.com` |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `xxxxxxxxxxxx` |

*Click **"Deploy site"** after adding these.*

---

## Step 4: Configure Custom Domain
1. Once deployed, go to **Site settings** → **Domain management**
2. Click **"Add domain"**
3. Enter: `aishwaryamanikarnike.com`
4. Netlify will show **"Awaiting External DNS"**.

---

## Step 5: Update GoDaddy DNS
Log in to GoDaddy → **Domain Portfolio** → **aishwaryamanikarnike.com** → **DNS Records**.

> [!CAUTION]
> **DO NOT** delete your MX or TXT records! Those are for your email and Resend verification.

**Add/Update only these two records:**

| Type | Name | Value | Note |
| :--- | :--- | :--- | :--- |
| **A** | `@` | `75.2.60.5` | Netlify Load Balancer IP |
| **CNAME** | `www` | `[your-site-name].netlify.app` | Found in Netlify Dashboard |

---

## Step 6: Verify and SSL
1. Go back to Netlify Domain Management.
2. Once DNS propagates (5-30 mins), click **"Verify DNS configuration"**.
3. Scroll down to **HTTPS** and click **"Verify DNS configuration"** to provision the SSL certificate.

🎉 **Your site is now live at aishwaryamanikarnike.com!**
