# 🔐 LMS Security & Vulnerability Analysis

Complete audit of the Student Portal LMS — covering every attack surface from authentication to media DRM, payment processing, admin access, and infrastructure.

---

## System Map

```
Student Flow
 └─ /cohorts → /api/checkout → Razorpay → Webhook → DB Enrollment
 └─ /portal/login (Magic Link OTP) → /auth/callback → /portal (Dashboard)
 └─ /portal/[courseId] (Curriculum) → /portal/[courseId]/lesson/[lessonId]
     └─ /api/portal/media/[lessonId] (Presigned R2 URL Gate)

Admin Flow
 └─ /admin/login (Magic Link) → /admin/* (RBAC: admin | editor)
     └─ Direct Supabase anon-key RLS writes (course_lessons, courses)
     └─ /api/admin/r2-upload-url (Presigned PUT URL)
     └─ /api/admin/cohorts/reenroll (Personalized Payment Links)
     └─ /api/admin/students/search (PII Search)
```

---

## 🔴 Critical Findings

### C-1 — Client-Side Only Auth Guard on Admin Panel

**File:** [AdminLayoutClient.tsx](file:///c:/Users/nages/OneDrive/Desktop/Projects/Nagesh/vynika_portfolio/veena-portfolio-v2/app/admin/AdminLayoutClient.tsx#L44-L122)
**Severity:** 🔴 Critical

The entire `/admin/*` route tree is protected **only by a client-side `useEffect` auth check**. The server (`app/admin/layout.tsx`) is a pure pass-through with no server-side session validation.

```
Impact:
- Any user who disables JavaScript sees the raw admin HTML (SSR renders with children).
- A slow network means admin content briefly flashes before redirect fires.
- Server-rendered admin pages can be fetched directly by curl/scrapers with no auth at all.
```

**Root Cause:** `app/admin/layout.tsx` delegates entirely to `AdminLayoutClient` (a `'use client'` component) with no server-side guard.

**Fix:** Add a server-side auth check using `@supabase/ssr` in the layout **before** rendering children. Move the role check to server-side middleware or a `layout.tsx` async server component.

```typescript
// app/admin/layout.tsx (fixed concept)
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function AdminLayout({ children }) {
  const supabase = createServerClient(...);
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect('/admin/login');
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
  if (!profile || !['admin', 'editor'].includes(profile.role)) redirect('/admin/login');
  return <>{children}</>;
}
```

---

### C-2 — Client-Side Only Auth Guard on Student Portal

**File:** [portal/layout.tsx](file:///c:/Users/nages/OneDrive/Desktop/Projects/Nagesh/vynika_portfolio/veena-portfolio-v2/app/portal/layout.tsx#L14-L34)
**Severity:** 🔴 Critical

Same issue as C-1. The `/portal` layout is `'use client'` and checks auth via `useEffect`. While the lesson **media API** (`/api/portal/media/[lessonId]`) is server-side protected, the **lesson metadata** is fetchable without enrollment verification.

```
Impact:
- A student who never paid can navigate to /portal/[courseId] and see the full
  lesson list, titles, descriptions, and durations.
- They cannot stream the video (blocked by the API), but they can enumerate the
  full curriculum structure of any course by guessing the courseId UUID.
```

**Additional Gap:** In [CourseCurriculumPage](file:///c:/Users/nages/OneDrive/Desktop/Projects/Nagesh/vynika_portfolio/veena-portfolio-v2/app/portal/%5BcourseId%5D/page.tsx#L63-L67), lessons are fetched from `course_lessons` table with **no enrollment check at the database query level**:

```typescript
// ❌ No enrollment check before this query
const { data: lessonData } = await supabase
    .from('course_lessons')
    .select('id, title, description, video_url, video_duration, is_free_preview, order_index')
    .eq('course_id', courseId)  // Any authenticated user can query any courseId
```

**Fix:** 
1. Move portal layout to a server component with `@supabase/ssr`.
2. Add a Supabase RLS policy on `course_lessons` that restricts reads to enrolled students (or to `is_free_preview = true`).

---

### C-3 — Admin Panel Makes Direct Supabase Client Writes Without Server-Side Authorization

**File:** [admin/courses/[courseId]/page.tsx](file:///c:/Users/nages/OneDrive/Desktop/Projects/Nagesh/vynika_portfolio/veena-portfolio-v2/app/admin/courses/%5BcourseId%5D/page.tsx#L147-L160)
**Severity:** 🔴 Critical

The admin course builder uses the **public anon Supabase client** to write directly to `course_lessons`:

```typescript
// ❌ Direct client-side write with only client-side auth guard
const { error } = await supabase
    .from('course_lessons')
    .update(lessonData)
    .eq('id', editingLesson.id);
```

This means the **only thing preventing any authenticated user (including enrolled students) from modifying lesson data** is the Supabase Row Level Security (RLS) policy on `course_lessons` — **which has never been confirmed to exist in the reviewed migrations.**

```
Impact:
- If RLS is missing or misconfigured on course_lessons, any logged-in student
  could POST directly to the Supabase API and modify/delete any lesson.
- The admin "auth check" is entirely client-side and can be bypassed.
```

**Fix:**
1. Immediately verify RLS policies exist for `course_lessons`: only `service_role` or users with `admin/editor` role in `profiles` should be able to `INSERT/UPDATE/DELETE`.
2. Migrate lesson CRUD to dedicated server API routes (`/api/admin/lessons/route.ts`) that perform the same server-side role check seen in `/api/admin/r2-upload-url` and `/api/admin/cohorts/reenroll`.

---

### C-4 — `SKIP_WEBHOOK_SIGNATURE` Can Be Accidentally Enabled in Production

**File:** [webhooks/razorpay/route.ts](file:///c:/Users/nages/OneDrive/Desktop/Projects/Nagesh/vynika_portfolio/veena-portfolio-v2/app/api/webhooks/razorpay/route.ts#L39-L63)
**Severity:** 🔴 Critical

```typescript
const skipSignature =
  process.env.NODE_ENV !== 'production' &&
  process.env.SKIP_WEBHOOK_SIGNATURE === 'true';
```

The condition uses `NODE_ENV !== 'production'`, **but Vercel automatically sets `NODE_ENV=production` for all deployments**, so this should be safe in theory. However:

```
Risk 1: Any preview/staging Vercel deployment uses NODE_ENV=production but may 
        accidentally have SKIP_WEBHOOK_SIGNATURE=true in its environment variables.

Risk 2: The .env.local file currently has SKIP_WEBHOOK_SIGNATURE=true committed.
        If this is accidentally applied to any non-local environment, anyone can
        POST arbitrary JSON to /api/webhooks/razorpay and trigger:
        - Student enrollment creation
        - Telegram invite link generation
        - Email delivery to arbitrary addresses
        - Database writes with admin privileges
```

**Fix:**
1. Change the condition to **only** check `SKIP_WEBHOOK_SIGNATURE`, remove the `NODE_ENV` check. It is the admin's sole responsibility to never set this in any non-local env.
2. Add a startup assertion that crashes the server if `SKIP_WEBHOOK_SIGNATURE=true` AND `NODE_ENV=production`.
3. Add this variable to `.gitignore` or document it clearly in your deployment checklist.

---

## 🟠 High Severity Findings

### H-1 — Presigned Video URL Expiry is Too Long (60 Minutes)

**File:** [api/portal/media/[lessonId]/route.ts](file:///c:/Users/nages/OneDrive/Desktop/Projects/Nagesh/vynika_portfolio/veena-portfolio-v2/app/api/portal/media/%5BlessonId%5D/route.ts#L96-L98)
**Severity:** 🟠 High

```typescript
result.videoUrl = await getPresignedGetUrl(lesson.video_url, 3600); // 60 minutes
```

A presigned URL that is valid for 60 minutes can be:
- Copied from browser DevTools by the student and shared externally.
- Used to download the entire video file via `wget` or `curl` within the window.
- Shared on messaging groups for free access.

**Fix:** Reduce TTL to **5–15 minutes** (enough to start streaming). The `<video>` element begins playback almost immediately; a 5-minute window is more than sufficient. Use **Range Request** support (which R2 supports) for long videos.

```typescript
result.videoUrl = await getPresignedGetUrl(lesson.video_url, 300); // 5 minutes
```

---

### H-2 — No Enrollment Status Verification in the Media API's Cohort Lookup

**File:** [api/portal/media/[lessonId]/route.ts](file:///c:/Users/nages/OneDrive/Desktop/Projects/Nagesh/vynika_portfolio/veena-portfolio-v2/app/api/portal/media/%5BlessonId%5D/route.ts#L71-L87)
**Severity:** 🟠 High

The enrollment check in the media API verifies `status: 'active'`, which is good. However, the cohort relationship traversal has a potential gap:

```typescript
const cohortIds = (lesson as any).courses?.cohorts?.map((c: any) => c.id) || [];
if (cohortIds.length === 0) {
    return NextResponse.json({ error: 'Lesson not linked to any cohort' }, { status: 403 });
}
```

If the **foreign key relationship** between `courses` → `cohorts` is not a proper relational structure (e.g., cohorts have `course_id` not `courses.cohorts`), `cohortIds` will be an empty array and the request will return **403** (which accidentally blocks access). But if the join is reversed or structured differently, the cohortIds array might be silently wrong.

**Fix:** Add a defensive assertion and log the cohortIds count. Consider a dedicated SQL function (`rpc`) that validates enrollment + lesson access atomically.

---

### H-3 — In-Memory Rate Limiting Will Not Work in Serverless/Edge

**File:** [api/validate/route.ts](file:///c:/Users/nages/OneDrive/Desktop/Projects/Nagesh/vynika_portfolio/veena-portfolio-v2/app/api/validate/route.ts#L6-L23)
**Severity:** 🟠 High

```typescript
const validationTimes = new Map<string, number>(); // ❌ In-memory, per-instance
const RATE_LIMIT_WINDOW = 5000; // 5 seconds
```

Vercel (and all serverless platforms) spins up **separate isolated function instances** for each request. This `Map` is **never shared** between instances. An attacker can send 1000 requests/second and bypass this rate limiter entirely.

```
Impact:
- Unlimited free calls to BigDataCloud and Veriphone APIs, exhausting quotas.
- Each API call costs money or API credits.
- Denial-of-service against the validation APIs.
```

**Fix:** Replace with a proper distributed rate limiter backed by an upstash Redis or Supabase `ratelimit` table. Alternatively, move phone/email validation to the client with Cloudflare Turnstile protecting the checkout flow instead.

---

### H-4 — `next` Redirect Parameter in Auth Callback Not Sanitized

**File:** [auth/callback/page.tsx](file:///c:/Users/nages/OneDrive/Desktop/Projects/Nagesh/vynika_portfolio/veena-portfolio-v2/app/auth/callback/page.tsx#L15-L26)
**Severity:** 🟠 High

```typescript
const next = searchParams.get('next') || '/portal';
// ...
router.replace(next); // ❌ Unvalidated open redirect
```

An attacker can craft a phishing link like:
```
https://aishwaryamanikarnike.com/auth/callback?code=VALID_CODE&next=https://evil.com
```

After the user authenticates (via magic link), they are silently redirected to the attacker-controlled site. This is a classic **Open Redirect** vulnerability that can be used in phishing attacks against enrolled students.

**Fix:** Validate that `next` only redirects to a same-origin path:

```typescript
const rawNext = searchParams.get('next') || '/portal';
// Only allow relative paths starting with /
const next = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/portal';
router.replace(next);
```

---

### H-5 — Student PII Exposed in Admin Search API With Broad Scope

**File:** [api/admin/students/search/route.ts](file:///c:/Users/nages/OneDrive/Desktop/Projects/Nagesh/vynika_portfolio/veena-portfolio-v2/app/api/admin/students/search/route.ts#L79-L84)
**Severity:** 🟠 High

The `ilike` pattern search on `student_search_view` is executed with the raw, unescaped query string:

```typescript
.or(`name.ilike.%${query}%,email.ilike.%${query}%,phone.ilike.%${query}%,telegram_username.ilike.%${query}%`)
```

If PostgREST's `or` filter doesn't sanitize `%`, `_`, and special characters in LIKE patterns, a query of `%` returns **all students** regardless. While this API is admin-only, it means any `editor` role user can trivially dump the entire student database by sending `q=%`.

**Fix:** Sanitize the query parameter before building the LIKE pattern. Escape `%` and `_` characters, and enforce a maximum query length.

```typescript
const safeQuery = query.replace(/[%_]/g, '\\$&'); // Escape LIKE wildcards
// Also enforce minimum length and max 100 chars
```

---

## 🟡 Medium Severity Findings

### M-1 — No HTTP Security Headers Configured

**File:** [next.config.js](file:///c:/Users/nages/OneDrive/Desktop/Projects/Nagesh/vynika_portfolio/veena-portfolio-v2/next.config.js)
**Severity:** 🟡 Medium

`next.config.js` has **no `headers()` configuration**. The application is missing critical HTTP security headers:

| Header | Current | Risk |
|:---|:---|:---|
| `Content-Security-Policy` | ❌ Missing | XSS attacks can load external scripts |
| `X-Frame-Options` | ❌ Missing | Clickjacking on payment pages |
| `X-Content-Type-Options` | ❌ Missing | MIME-type sniffing attacks |
| `Referrer-Policy` | ❌ Missing | Referrer leakage of payment links |
| `Permissions-Policy` | ❌ Missing | Unauthorized camera/mic/location access |
| `Strict-Transport-Security` | ❌ Missing | Protocol downgrade attacks |

**Fix:** Add a `headers()` function to `next.config.js`:

```javascript
async headers() {
  return [{
    source: '/(.*)',
    headers: [
      { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
    ]
  }];
}
```

---

### M-2 — PDF Toolbar Not Fully Disabled (Toolbar=0 is Browser-Dependent)

**File:** [portal/[courseId]/lesson/[lessonId]/page.tsx](file:///c:/Users/nages/OneDrive/Desktop/Projects/Nagesh/vynika_portfolio/veena-portfolio-v2/app/portal/%5BcourseId%5D/lesson/%5BlessonId%5D/page.tsx#L227-L233)
**Severity:** 🟡 Medium

```tsx
<iframe
    src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=1`}
    ...
/>
```

`#toolbar=0` is a **Chrome PDF viewer hint only**, not a standard. Firefox, Safari, and Edge still show their native PDF toolbars which include a **Download** button. The presigned R2 URL in `src` is also directly visible in browser DevTools → Network tab, and can be downloaded within the 60-minute window.

**Fix:** 
- Use a proper PDF viewer library (e.g., `react-pdf`, `pdfjs-dist`) that renders PDFs as canvas elements without exposing the raw URL.
- Alternatively, reduce presigned URL TTL to 5 minutes.
- Add `Content-Disposition: inline` on the R2 object (not `attachment`) and add a `response-content-disposition` parameter to the presigned URL.

---

### M-3 — `markComplete` Is Callable Client-Side Without Server Validation

**File:** [portal/[courseId]/lesson/[lessonId]/page.tsx](file:///c:/Users/nages/OneDrive/Desktop/Projects/Nagesh/vynika_portfolio/veena-portfolio-v2/app/portal/%5BcourseId%5D/lesson/%5BlessonId%5D/page.tsx#L105-L113)
**Severity:** 🟡 Medium

```typescript
const markComplete = useCallback(async () => {
    if (!studentId || completed) return;
    setCompleted(true);
    await supabase.from('lesson_progress').upsert({
        student_id: studentId,
        lesson_id: lessonId, // ❌ Student can mark ANY lessonId complete
        completed: true,
        completed_at: new Date().toISOString(),
    }, { onConflict: 'student_id,lesson_id' });
}, [studentId, lessonId, completed]);
```

A student can open DevTools and call `supabase.from('lesson_progress').upsert(...)` with any `lesson_id`, including lessons from courses they are **not enrolled in**. This falsely marks completion and pollutes progress tracking data.

**Fix:** Add an RLS policy on `lesson_progress` that validates the student is enrolled in the cohort that owns the lesson before allowing an `INSERT/UPDATE`. Or route progress updates through a server API endpoint that validates enrollment.

---

### M-4 — Webhook Notes Are Entirely Trusted From Razorpay

**File:** [webhooks/razorpay/route.ts](file:///c:/Users/nages/OneDrive/Desktop/Projects/Nagesh/vynika_portfolio/veena-portfolio-v2/app/api/webhooks/razorpay/route.ts#L163-L178)
**Severity:** 🟡 Medium

```typescript
const notes = mainEntity.notes || paymentEntity.notes || {};
const studentName = notes.studentName || notes.name || 'Student';
let studentEmail = notes.studentEmail || notes.email || paymentEntity?.email || null;
let cohortTitle = 'Cohort';
let finalCohortId = notes.cohortId || null;
```

The `notes` object in Razorpay is set by the **checkout frontend** at order creation time. While the webhook signature is verified (preventing external forgery), a user could theoretically manipulate their **browser console** to change `notes.cohortId` at the time of order creation (before Razorpay processes it), potentially enrolling themselves in a different cohort than the one they paid for.

**Current mitigation:** The cohort price is fetched from the DB server-side in `/api/checkout`, so the **amount** cannot be tampered. However, the `cohortId` in notes controls **which cohort the student is enrolled in**.

**Fix:** In the webhook, after extracting `finalCohortId` from notes, cross-reference it with the order's `amount` against the DB price for that cohort to confirm they match. If they don't match (e.g., paid ₹99 but cohortId maps to a ₹999 cohort), reject or flag the enrollment.

---

### M-5 — R2 Upload API Doesn't Restrict Content Types

**File:** [api/admin/r2-upload-url/route.ts](file:///c:/Users/nages/OneDrive/Desktop/Projects/Nagesh/vynika_portfolio/veena-portfolio-v2/app/api/admin/r2-upload-url/route.ts#L47-L51)
**Severity:** 🟡 Medium

```typescript
const { courseId, filename, contentType } = await request.json();
// ...
const uploadUrl = await getPresignedPutUrl(key, contentType); // ❌ contentType is unvalidated
```

An admin/editor can pass `contentType: 'application/javascript'` or `text/html` and upload arbitrary files to R2 under the `courses/` path. If R2 is ever misconfigured to serve files publicly (or if presigned GET URLs leak), this could allow stored XSS via a JavaScript file hosted on a CDN domain.

**Fix:** Allowlist permitted content types server-side:

```typescript
const ALLOWED_TYPES = ['video/mp4', 'video/webm', 'video/ogg', 'application/pdf'];
if (!ALLOWED_TYPES.includes(contentType)) {
    return NextResponse.json({ error: 'Invalid content type' }, { status: 400 });
}
```

---

### M-6 — No Rate Limiting on Magic Link Endpoint

**File:** [portal/login/page.tsx](file:///c:/Users/nages/OneDrive/Desktop/Projects/Nagesh/vynika_portfolio/veena-portfolio-v2/app/portal/login/page.tsx#L30-L35)
**Severity:** 🟡 Medium

The magic link form calls `supabase.auth.signInWithOtp()` directly from the client. While Supabase has built-in rate limiting (`email_sent = 2` per hour in `config.toml`), this local config may **not match the production Supabase project settings** (which are configured through the dashboard, not `config.toml`).

```
Risk: If production rate limits are higher or misconfigured:
- Email bombing: attacker can flood victim's inbox with magic link emails.
- OTP bruteforce: if token_verifications is too high, brute-forcing the 6-char OTP is feasible.
```

**Fix:**
1. Confirm production Supabase project has `email_sent ≤ 2/hour` and `token_verifications ≤ 10/5min` in the Supabase dashboard.
2. Consider adding a Cloudflare Turnstile widget to the login form to block bot-driven email flooding.

---

## 🔵 Low Severity & Informational Findings

### L-1 — `auth_user_id` Column in `students` Table Requires Guaranteed Uniqueness

**File:** [portal/[courseId]/page.tsx](file:///c:/Users/nages/OneDrive/Desktop/Projects/Nagesh/vynika_portfolio/veena-portfolio-v2/app/portal/%5BcourseId%5D/page.tsx#L44-L48)
**Severity:** 🔵 Low

Multiple queries use:
```typescript
const { data: student } = await supabase
    .from('students')
    .select('id')
    .eq('auth_user_id', user.id)
    .single(); // .single() throws if >1 row matches
```

If for any reason two `students` rows share the same `auth_user_id`, `.single()` throws and the student sees a broken portal. Verify that `auth_user_id` has a `UNIQUE` constraint in the database migrations.

---

### L-2 — Payment Amount for `pay_as_you_wish` Has No Upper Bound

**File:** [api/checkout/route.ts](file:///c:/Users/nages/OneDrive/Desktop/Projects/Nagesh/vynika_portfolio/veena-portfolio-v2/app/api/checkout/route.ts#L74-L79)
**Severity:** 🔵 Low

```typescript
const rawAmount = parseFloat(String(clientAmount || '0'));
if (isNaN(rawAmount) || rawAmount < 1) {
    return NextResponse.json({ error: 'Please enter a valid amount (minimum ₹1)' }, { status: 400 });
}
razorpayAmount = Math.round(rawAmount * 100);
```

There is no maximum amount check. A user could technically enter ₹10,00,000 by accident (or as a test), which would create a Razorpay order for that amount. While Razorpay may have its own limits, adding a server-side cap (e.g., ₹10,000) prevents accidental large orders.

---

### L-3 — `simulate_webhook.js` Left in Project Root

**File:** [simulate_webhook.js](file:///c:/Users/nages/OneDrive/Desktop/Projects/Nagesh/vynika_portfolio/veena-portfolio-v2/simulate_webhook.js)
**Severity:** 🔵 Low

This is a local testing script. While it is harmless on its own, it documents the exact webhook payload format and the fact that `SKIP_WEBHOOK_SIGNATURE=true` is used locally. It should be:
- Added to `.gitignore`, or
- Moved to a `/scripts/` or `/scratch/` directory and excluded from commits.

---

### L-4 — `supabase-admin` Client Uses `NEXT_PUBLIC` URL

**File:** [lib/supabase-admin.ts](file:///c:/Users/nages/OneDrive/Desktop/Projects/Nagesh/vynika_portfolio/veena-portfolio-v2/lib/supabase-admin.ts#L3)
**Severity:** 🔵 Informational

```typescript
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
```

Using `NEXT_PUBLIC_` for the URL is fine (it is public information), but it is worth noting that this client is initialized with the service role key (which bypasses all RLS). Ensure this module is **never imported in any `'use client'` file**, or the service role key could be accidentally bundled into the client-side JavaScript.

---

### L-5 — `check-deployment.js` Contains Hardcoded Production URL

**File:** `check-deployment.js`
**Severity:** 🔵 Informational

This dev utility script likely contains hardcoded production URLs and may be leaking deployment infrastructure details. Review before open-sourcing.

---

## ✅ Security Strengths (What Is Done Well)

| Area | Status | Detail |
|:---|:---|:---|
| Razorpay Webhook Signature | ✅ Good | HMAC-SHA256 verification implemented correctly |
| Webhook Idempotency | ✅ Good | Duplicate payment_id check prevents double-enrollment |
| Media API Server-Side Gate | ✅ Good | Enrollment verified server-side before generating R2 URL |
| Admin API Role Checks | ✅ Good | `/api/admin/r2-upload-url` and `/api/admin/cohorts/reenroll` both do server-side role verification |
| Magic Link Auth | ✅ Good | No passwords to steal; OTP via email |
| Turnstile on Checkout | ✅ Good | Bot protection on the payment initiation form |
| Separate Admin Supabase Client | ✅ Good | `supabaseAdmin` is a separate module with service role key |
| `controlsList="nodownload"` on Video | ✅ Good | Removes the native browser download button |
| `disablePictureInPicture` | ✅ Good | Prevents PiP which can make screen recording harder |
| `onContextMenu` Prevention | ✅ Good | Right-click disabled on video/PDF containers |
| Auth Redirect Allow-list | ✅ Good | Supabase config has `additional_redirect_urls` set |
| Refresh Token Rotation | ✅ Good | `enable_refresh_token_rotation = true` in config |
| Amount Fetched Server-Side | ✅ Good | Checkout API fetches price from DB, not client |
| Cohort Status Check | ✅ Good | Only `active` cohorts accept enrollments in checkout |
| Admin Metadata noindex | ✅ Good | Admin layout sets `robots: noindex, nofollow` |

---

## 📋 Prioritized Remediation Roadmap

### Sprint 1 — Critical (Do Immediately)
1. **C-1:** Add server-side auth guard to `/admin/layout.tsx` using `@supabase/ssr`
2. **C-2:** Add server-side auth guard to `/portal/layout.tsx` and add RLS on `course_lessons`
3. **C-3:** Verify RLS policies on `course_lessons`; migrate admin CRUD to server API routes
4. **C-4:** Add production guard assertion for `SKIP_WEBHOOK_SIGNATURE`

### Sprint 2 — High (This Week)
5. **H-1:** Reduce presigned URL TTL from 3600s → 300s
6. **H-4:** Sanitize `next` redirect parameter to prevent open redirect
7. **H-3:** Replace in-memory rate limiter with Supabase-backed or Upstash Redis rate limiter
8. **H-5:** Escape LIKE wildcards in student search query

### Sprint 3 — Medium (Next Two Weeks)
9. **M-1:** Add HTTP security headers to `next.config.js`
10. **M-2:** Replace PDF `<iframe>` with canvas-rendered PDF viewer
11. **M-3:** Add RLS on `lesson_progress` to enforce enrollment check
12. **M-4:** Cross-validate cohort price vs. payment amount in webhook
13. **M-5:** Whitelist content types in R2 upload URL API

### Sprint 4 — Low / Housekeeping
14. **L-1:** Confirm `UNIQUE` constraint on `students.auth_user_id`
15. **L-2:** Add max amount cap to PAYW checkout
16. **L-3:** Add `simulate_webhook.js` to `.gitignore`
