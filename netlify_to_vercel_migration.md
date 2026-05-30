# Netlify → Vercel: Zero-Downtime Production Migration Plan
### Project: `aishwaryamanikarnike.com`

> [!IMPORTANT]
> This plan was written after a **full code audit** of every API route, middleware, env variable, webhook, and caching layer in this codebase. Follow phases in strict order. Do **not** skip the pre-cutover verification steps.

---

## Overview

| | Netlify (Current) | Vercel (Target) |
|---|---|---|
| **Platform** | Netlify Free → Plugin Runtime | Vercel Hobby (Fluid Compute) |
| **Next.js Support** | Emulated via `@netlify/plugin-nextjs` | Native (built by the Next.js team) |
| **Production Deploys** | 15 credits each | Unlimited, free |
| **Compute** | 10 credits/GB-hour (~30 GB-hrs/mo free) | 100 GB-hrs/month free |
| **Bandwidth** | ~15 GB/month free | 100 GB/month free |
| **Function Timeout** | 10 seconds | 300 seconds (with Fluid Compute) |
| **Custom Domain** | ✅ Free | ✅ Free |
| **ISR / Cache Tags** | Emulated (ODB) — can lag | Native — instant propagation |
| **`after()` API** | Supported via plugin | Supported natively with Fluid Compute |

---

## Pre-Migration Audit: What Changes & What Doesn't

### ✅ Zero-Change Components (Work Out of the Box)
| Component | File | Notes |
|---|---|---|
| All Supabase Auth & DB calls | All API routes | Platform-agnostic |
| Razorpay checkout creation | `app/api/checkout/route.ts` | Standard Next.js API route |
| Telegram join webhook | `app/api/webhooks/telegram/route.ts` | Standard POST handler |
| Resend email sending | `lib/notifications/email.ts` | HTTP call, platform-agnostic |
| Google Analytics API | `app/api/admin/analytics/ga/route.ts` | Standard Next.js API route |
| All admin API routes | `app/api/admin/**` | Standard routes |
| `revalidatePath` & `revalidateTag` | `app/api/admin/config/route.ts` | **Works better** natively on Vercel |
| `unstable_cache` with tags | `lib/db-config.ts` | **Works better** natively on Vercel |
| Cloudinary image loader | `next.config.js` + `lib/cloudinary-loader.js` | Custom loader, unchanged |
| Env variable format | `.env.local` → Vercel dashboard | Copy-paste, same names |

### ⚠️ Requires Code Change Before Migration (1 file)
| Issue | File | Risk if Not Fixed |
|---|---|---|
| **Fire-and-forget click tracking** in Edge Middleware | `middleware.ts` line 71 | Click counter may silently drop on Vercel Edge |

### 🔧 Requires External Config Update After Migration (not code)
| Item | Service | Action |
|---|---|---|
| DNS Records | GoDaddy | Change A record + CNAME to point to Vercel |
| Cloudflare Turnstile Allowed Origins | Cloudflare Dashboard | Add Vercel preview domain (for staging testing only) |

> [!NOTE]
> [!WARNING]
> **Razorpay and Telegram webhook URLs MUST be updated to use the `www` subdomain (i.e. `https://www.aishwaryamanikarnike.com/api/webhooks/...`).**
> Because Vercel redirects the apex domain (`aishwaryamanikarnike.com`) to the primary `www` domain via a `308 Permanent Redirect`, webhooks sent to the apex domain will get redirected. Telegram does not follow HTTP redirects for webhooks (which results in `308 Permanent Redirect` errors). Ensure all webhooks are registered with the `www` domain.

---

## Vercel Hobby Tier Limitations (Know Before You Go)

> [!WARNING]
> Read this section completely before proceeding.

1. **Non-Commercial Restriction:** Vercel Hobby is strictly for **personal, non-commercial use**. Since this site processes real Razorpay payments and collects enrollment fees, this is a **genuine concern, not a minor one**.

   **Honest Assessment:**
   - Vercel does not proactively audit every project. They typically enforce this when a project's usage metrics spike noticeably (high bandwidth, function invocations, or compute).
   - If flagged, Vercel will send an email asking you to upgrade. They do **not** immediately suspend the site — you typically get a 7–14 day window to act.
   - The Pro plan costs **$20/month**. At that price point, you get: 1,000 GB-hours compute (vs 100 on Hobby), 1 TB bandwidth (vs 100 GB), 6,000 build minutes, priority support, and the commercial use right.
   - **Recommendation:** Given that this site generates real revenue (paid Razorpay enrollments), the most responsible path is to start on Vercel Hobby to prove it works, and then upgrade to Vercel Pro when the next cohort opens or when you make your first payment batch. At ₹20/month equivalent this is a negligible operational cost compared to the value of keeping the payment pipeline reliable.

2. **Edge Middleware — 50ms CPU Limit:** Your `middleware.ts` runs on every request. The **network wait time** (Supabase query) does not count, but the CPU time (JSON parsing, matching, header manipulation) must stay under 50ms. Your current middleware is simple enough to stay well within this limit.

3. **Hard Usage Caps (No Overages):** Unlike Netlify Pro, Vercel Hobby does not let you pay to scale. If you somehow hit 100 GB-hours compute or 100 GB bandwidth in a month, the site goes dark until the next billing cycle. At your current traffic (~1 GB-hour/week), you would need 25x growth to approach this limit.

4. **1 Million Function Invocations/Month Hard Cap:** Each API call counts as one invocation. At your current rate of ~575 page views/week, you are at ~10,000 invocations/week (well within the 1M limit).

5. **100 Deploys/Day Cap:** You cannot trigger more than 100 production deployments per day. For a team of 1–2, this will never be an issue.

6. **`after()` API Requires Fluid Compute:** The Razorpay webhook uses `unstable_after` to run background processing after returning `{ status: 'ok' }`. This **requires Fluid Compute to be enabled** in your Vercel project settings. Without it, the background tasks (email, Telegram invite, DB write) will all be killed the moment the response is sent.

---

## Phase 1: Code Change (Do This Before Anything Else)

### Fix: Fire-and-Forget Click Tracking in `middleware.ts`

**The Problem:** Line 71 of `middleware.ts` calls `edgeSupabase.rpc(...).then(() => {})` without awaiting or registering it with the Edge Runtime's `waitUntil` hook. Vercel's edge isolate terminates the worker immediately after the redirect response is sent, so this promise is silently dropped — meaning smart link clicks will not be counted.

**The Fix:** Change the fire-and-forget call to a proper `await`. The Supabase RPC is fast (~50ms network round trip) so this adds minimal latency to the redirect.

In [middleware.ts](file:///c:/Users/nages/OneDrive/Desktop/Projects/Nagesh/vynika_portfolio/veena-portfolio-v2/middleware.ts), change line 71:

```diff
- // Fire-and-forget click tracking (non-blocking)
- edgeSupabase.rpc('increment_click_count', { row_id: link.id }).then(() => {});
+ // Await click tracking — Vercel Edge terminates immediately after response, fire-and-forget is unreliable
+ await edgeSupabase.rpc('increment_click_count', { row_id: link.id });
```

> [!NOTE]
> This adds approximately 50ms to the redirect latency. Users will not notice — they are already waiting for a DNS + HTTP round trip. The alternative is to use Vercel's `waitUntil` from `@vercel/functions`, but awaiting is simpler and sufficient here.

**Commit this change and push to your repository to trigger the Vercel build:**
```bash
# Stage the changes
git add middleware.ts netlify_to_vercel_migration.md

# Commit the changes
git commit -m "fix(edge): await click tracking in middleware to support Vercel execution"

# Push to your main branch
git push origin main
```

---

## Phase 2: Set Up Vercel Project (Staging, No DNS Change Yet)

The domain will still point to Netlify during this entire phase. Users are completely unaffected.

### Step 2.1 — Create Vercel Account & Import Project

1. Go to [vercel.com](https://vercel.com) and sign up / log in with your **GitHub account** (the same account that hosts this repo).
2. Click **"Add New... → Project"**.
3. Find your repository `veena-portfolio-v2` and click **Import**.
4. Vercel will auto-detect Next.js and pre-fill:
   - **Framework Preset:** Next.js ✅
   - **Build Command:** `npm run build` ✅
   - **Output Directory:** `.next` ✅
   - **Install Command:** `npm install` ✅
5. **Do NOT click Deploy yet** — configure environment variables first.

### Step 2.2 — Add All Environment Variables

In the Vercel project setup screen, click **"Environment Variables"**. Add every variable from your `.env.local` file. Use the table below:

| Variable | Notes |
|---|---|
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Copy from `.env.local` |
| `NEXT_PUBLIC_CLARITY_PROJECT_ID` | Copy from `.env.local` |
| `NEXT_PUBLIC_SUPABASE_URL` | Copy from `.env.local` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Copy from `.env.local` |
| `SUPABASE_SERVICE_ROLE_KEY` | Copy from `.env.local` |
| `RESEND_API_KEY` | Copy from `.env.local` |
| `ADMIN_EMAIL` | `official@aishwaryamanikarnike.com` |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Copy from `.env.local` |
| `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` | Copy from `.env.local` |
| `CLOUDINARY_API_KEY` | Copy from `.env.local` |
| `CLOUDINARY_API_SECRET` | Copy from `.env.local` |
| `NEXT_PUBLIC_SITE_URL` | `https://aishwaryamanikarnike.com` |
| `NEXT_PUBLIC_SITE_LIVE` | `true` (keep same as Netlify prod) |
| `GA_PROPERTY_ID` | Copy from `.env.local` |
| `GA_CLIENT_EMAIL` | Copy from `.env.local` |
| `GA_PRIVATE_KEY` | Copy the entire multi-line key. In Vercel's dashboard, paste as-is — it handles newlines correctly |
| `RAZORPAY_KEY_ID` | Copy from `.env.local` (use **live** key, not test key!) |
| `RAZORPAY_KEY_SECRET` | Copy from `.env.local` (use **live** key!) |
| `RAZORPAY_WEBHOOK_SECRET` | Copy from `.env.local` |
| `TELEGRAM_BOT_TOKEN` | Copy from `.env.local` |
| `ADMIN_TELEGRAM_CHAT_ID` | Copy from `.env.local` |
| `META_WHATSAPP_PHONE_NUMBER_ID` | Copy from `.env.local` |
| `META_WHATSAPP_ACCESS_TOKEN` | Copy from `.env.local` |
| `META_WHATSAPP_TEMPLATE_NAME` | Copy from `.env.local` |
| `TWILIO_ACCOUNT_SID` | Copy from `.env.local` |
| `TWILIO_AUTH_TOKEN` | Copy from `.env.local` |
| `TWILIO_WHATSAPP_FROM` | Copy from `.env.local` |
| `TWILIO_WHATSAPP_CONTENT_SID` | Copy from `.env.local` |
| `TWILIO_WHATSAPP_REENROLL_CONTENT_SID` | Copy from `.env.local` |
| `BIGDATACLOUD_API_KEY_1` | Copy from `.env.local` |
| `VERIPHONE_API_KEY` | Copy from `.env.local` |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Copy from `.env.local` |
| `TURNSTILE_SECRET_KEY` | Copy from `.env.local` |
| `SKIP_WEBHOOK_SIGNATURE` | **DO NOT ADD** — only for local dev |
| `NEXTAUTH_SECRET` | **DO NOT ADD** — not used in Next.js App Router |
| `NEXTAUTH_URL` | **DO NOT ADD** — not used in Next.js App Router |
| `NEXT_PUBLIC_BASE_PATH` | **DO NOT ADD** — must be empty on Vercel |

> [!CAUTION]
> Double-check that `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` are your **live** Razorpay keys (starting with `rzp_live_`), not the test keys (`rzp_test_`). The `.env.local` currently has test keys.

> [!TIP]
> Vercel has a bulk import feature. Go to **Project Settings → Environment Variables → Import .env** and paste your entire `.env.local` file contents. It will auto-parse all variables. Then delete the ones listed as "DO NOT ADD" above.

### Step 2.3 — Enable Fluid Compute

> [!IMPORTANT]
> This is critical. Without this, the Razorpay webhook's `after()` background processing (email, Telegram invite link, DB writes) will be silently killed.

1. After creating the project, go to **Project Settings → Functions**.
2. Toggle **"Fluid Compute"** to **ON**.
3. Save.

### Step 2.4 — First Deploy

Click **Deploy**. Vercel will build and deploy to a preview URL like `https://veena-portfolio-v2-abc123.vercel.app`. This is your staging URL — the custom domain still points to Netlify.

Wait for the build to complete. Check the build logs for errors.

### Step 2.5 — Add Custom Domain to Vercel (Without Switching DNS)

1. In Vercel dashboard → **Project Settings → Domains**.
2. Click **Add Domain**.
3. Enter `aishwaryamanikarnike.com` and `www.aishwaryamanikarnike.com`.
4. Vercel will show you the DNS records to add.
5. **Copy these records but do NOT update GoDaddy DNS yet.** You will do this in Phase 4.

---

## Phase 3: Verification on Vercel Staging URL

Use the temporary `.vercel.app` URL to verify **every critical flow** before touching DNS.

### Checklist — Must Pass All Before Phase 4

- [-] **Homepage loads** at `https://veena-portfolio-v2-[hash].vercel.app`
- [-] **Cohorts page loads** and displays cohort data from Supabase
- [-] **Enrollment form** (`/forms/[slug]`) renders correctly
- [-] **Admin login** works at `/admin` — you can log in with Supabase auth
- [-] **Admin dashboard** loads (analytics, student list, smart links)
- [-] **Google Analytics dashboard** loads — 14 runReport calls complete within 10s
- [-] **Site config save** works — change one field in admin config, save, and verify `revalidatePath` fires (homepage should show the change)
- [-] **Smart links** — visit `/link/[some-slug]` and verify it redirects correctly and the click counter increments in Supabase
- [ ] **Test Razorpay checkout** using test mode — complete a payment flow end-to-end on the staging URL
  - After payment, check Supabase `webhook_logs` for a new `success` or `partial_success` entry
  - Check that email was sent (or that the email API was called)
- [ ] **Blog page** loads at `/blog`

> [!NOTE]
> Some flows (like the Razorpay webhook and Telegram webhook) require the webhook URL to be registered. For staging testing, temporarily add the Vercel staging URL as a **second webhook** endpoint in Razorpay and Telegram. Do not replace the Netlify URL yet.

---

## Phase 4: DNS Cutover (Zero-Downtime & Keeping Netlify DNS)

To ensure **zero risk of email downtime**, we will keep Netlify as your DNS manager. You do not need to change nameservers in GoDaddy or touch your MX/TXT records (which handle your email inboxes and Resend sending). You only change where your website points.

### Step 4.1 — Unlock the Domain in Netlify Site Settings
Netlify locks the website records (`aishwaryamanikarnike.com` and `www`) as `NETLIFY` type records so they cannot be edited. To unlock them:
1. Log in to your **Netlify Dashboard** (https://app.netlify.com).
2. Go to **Sites** ➔ select **`vynika-portfolio`** (the site currently hosting your code).
3. Go to **Site Configuration** (or Site Settings) ➔ **Domain Management**.
4. Scroll down to the "Custom Domains" section.
5. Click **Options** next to `aishwaryamanikarnike.com` and select **Remove domain** (unlink it).
6. Do the same for `www.aishwaryamanikarnike.com`.
   * *This deletes only the two website pointer records; all your email/TXT records remain perfectly intact.*

### Step 4.2 — Add Website Records to Vercel in Netlify DNS
Now that the domain is unlinked from the site, the DNS panel allows you to add custom records pointing to Vercel:
1. Click on the **Netlify DNS** tab in the top navigation bar of your Netlify Dashboard.
2. Click on the domain **`aishwaryamanikarnike.com`** to open the records list.
3. Click **Add new record**:
   * **Record Type**: `A`
   * **Name**: `@` (or leave blank if it autofills `aishwaryamanikarnike.com`)
   * **Value**: `216.198.79.1` (or `76.76.21.21` — use the exact Expected Value Vercel displays on your screen)
   * **TTL**: `300` (Change this from `3600` to `300` seconds so future changes take only 5 minutes)
4. Click **Add new record** again:
   * **Record Type**: `CNAME`
   * **Name**: `www`
   * **Value**: `d1dd9e5b66d2d278.vercel-dns-017.com` (use the exact project-specific CNAME value Vercel displays on your screen)
   * **TTL**: `300`

*Note: Do not touch any **MX** records or **TXT** records. Leaving those alone guarantees your emails and Resend domain verifications will never stop working.*

### Step 4.3 — Verify Cutover is Live & TTL Caching Details
* **Vercel Verification (5 Minutes)**: Vercel queries your nameservers directly. It will detect the new records and turn green in your Vercel Dashboard within **2 to 5 minutes**. It will then automatically issue a new SSL certificate.
* **Global Propagation (up to 1 hour)**: Because the previous records had a TTL of `3600` (1 hour), some visitors' computers or internet providers may cache the old Netlify route for up to **60 minutes** before they see the Vercel site. 
  * *To check it instantly: Open an **Incognito Browser** or test on a mobile network (4G/5G) which usually clears DNS cache much faster.*

---

## Phase 5: Update Third-Party Webhook URLs

Now that the domain points to Vercel, update all external services that push to your API routes.

### Step 5.1 — Update Razorpay Webhook URL
1. Log in to [Razorpay Dashboard](https://dashboard.razorpay.com).
2. Go to **Account & Settings → Webhooks**.
3. Find the existing webhook pointing to `https://aishwaryamanikarnike.com/api/webhooks/razorpay` (or edit/create a new one) and ensure it points to the `www` subdomain: `https://www.aishwaryamanikarnike.com/api/webhooks/razorpay`.
4. Edit it — the URL is the same (since the domain is now on Vercel, it will route correctly). No change needed if the domain matches.
5. **Verify the webhook secret** (`RAZORPAY_WEBHOOK_SECRET`) matches what you set in Vercel environment variables.
6. Use Razorpay's "Send Test Webhook" feature and verify a new entry appears in your Supabase `webhook_logs` table.

### Step 5.2 — Update Telegram Bot Webhook URL
The Telegram webhook is registered using the Bot API. Run this command to re-register it (replace the URL if needed):

```bash
curl "https://api.telegram.org/bot<YOUR_TELEGRAM_BOT_TOKEN>/setWebhook?url=https://www.aishwaryamanikarnike.com/api/webhooks/telegram?token=<YOUR_TELEGRAM_BOT_TOKEN>"
```

Verify it is registered correctly:
```bash
curl "https://api.telegram.org/bot<YOUR_TELEGRAM_BOT_TOKEN>/getWebhookInfo"
```

The response should show `"url": "https://www.aishwaryamanikarnike.com/api/webhooks/telegram?token=..."` and `"last_error_message"` should be empty.

### Step 5.3 — Update Cloudflare Turnstile Allowed Origins
1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com) → **Turnstile**.
2. Find the widget used for the enrollment form.
3. In **Allowed Origins**, verify `https://aishwaryamanikarnike.com` is listed. It should already be there.
4. During the staging test phase, you can also add `https://veena-portfolio-v2-[hash].vercel.app` temporarily for testing.

---

## Phase 6: Post-Migration Validation (Final Checks)

Run these checks on the live production URL pointing to Vercel.

- [ ] Open `https://aishwaryamanikarnike.com` — homepage loads correctly
- [ ] Smart link redirect works: visit `/link/[slug]` and verify destination + click count increment
- [ ] Complete a real enrollment flow (use test mode if possible)
- [ ] Send a reminder email from the admin students panel — verify it delivers
- [ ] Check Google Analytics — confirm GA4 is receiving pageview events from the new Vercel deployment
- [ ] Open the admin analytics dashboard — verify all 14 chart sections render data
- [ ] Trigger a site config save in admin — verify `revalidateTag('config')` fires and the homepage reflects the change within 1–2 seconds (much faster than Netlify's ODB emulation)
- [ ] Monitor Vercel's **Functions** tab for any 500 errors in the first 30 minutes

---

## Rollback Plan

If anything is wrong after the DNS cutover, you can revert within 5 minutes.

### Rollback Procedure
1. **Go to Netlify DNS Panel** (https://app.netlify.com ➔ Netlify DNS ➔ click `aishwaryamanikarnike.com`).
2. Edit the **A record** for `aishwaryamanikarnike.com`:
   * Change the value back to Netlify's default alias/IP.
3. Edit the **CNAME record** for `www.aishwaryamanikarnike.com`:
   * Change the value back to your Netlify site domain (e.g., `veena-musician-website.netlify.app`).
4. Save the changes. 
5. The rollback will propagate within 5 minutes.
6. Verify the site is serving from Netlify again by checking the SSL certificate or response headers (which will show `server: Netlify` instead of Vercel).

> [!IMPORTANT]
> **Keep the Netlify site active and do NOT delete it for at least 30 days** after a successful migration. It is your instant rollback option. Netlify does not charge you for keeping an inactive/un-deployed project live.

---

## Phase 7: Post-Migration Cleanup (30 Days Later)

Only do this after you are confident everything is stable.

- [ ] Disable auto-publishing on Netlify (stop any accidental deploys)
- [ ] Transfer the Netlify `netlify.toml` into archived docs (it has no effect on Vercel, but keep for reference)
- [ ] Optionally, delete the Netlify site (after 30 days of stable Vercel operation)
- [ ] Update your `docs/NETLIFY_DEPLOYMENT.md` to reflect the new Vercel setup

---

## Complete Migration Timeline

```
Day -1 (24 hours before cutover)
  └── Phase 1: Commit middleware.ts fix
  └── Phase 2: Set up Vercel project + environment variables + Fluid Compute

Day 0 (Cutover Day)
  └── Phase 3: Full staging verification on vercel.app URL (1–2 hours)
  └── Phase 4: DNS cutover (5–15 minutes propagation)
  └── Phase 5: Update Razorpay + Telegram webhook configs
  └── Phase 6: Post-migration validation

Day +30
  └── Phase 7: Cleanup
```

---

## Known Limitations Summary

| Limitation | Impact | Mitigation |
|---|---|---|
| **Hobby tier non-commercial restriction** | **High concern** — site processes real Razorpay payments | Plan to upgrade to Pro ($20/mo) before or shortly after first live enrollment cycle on Vercel |
| Edge Middleware 50ms CPU cap | Could 503 if middleware gets complex | Current middleware is well within limits; avoid adding heavy logic |
| 100 deploys/day hard cap | N/A for a single developer | Not a real concern |
| No ISR Fallback Blocking mode on Hobby | First visitor after ISR invalidation sees stale data briefly | Same behaviour as Netlify; acceptable |
| Hard usage caps (no overage) | Site goes dark if limits are exceeded | At current traffic levels, 100 GB-hours provides 96x headroom |
| `after()` requires Fluid Compute enabled | Razorpay background tasks silently killed if disabled | Enable Fluid Compute in project settings (Step 2.3) |
| Click counter may miss first hit until Phase 1 fix is deployed | Smart link click count could under-count | Deploy the `middleware.ts` fix before migration |
