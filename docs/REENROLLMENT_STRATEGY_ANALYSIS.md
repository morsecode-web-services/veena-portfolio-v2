# Re-Enrollment Strategy Analysis

> **Context:** ~500 students enroll per cohort. When a new monthly cohort opens, the current system
> requires every student to go back to the landing page, re-enter their details, and make a fresh
> payment. This document compares two approaches to solve this pain point.

---

## Approach A: Automated Re-Enrollment Links

**How it works:**  
When the artist opens a new cohort, the admin dashboard triggers a batch job that:
1. Queries Supabase for all enrollees from the previous cohort
2. Calls the Razorpay Payment Links API to generate a unique, customer-prefilled payment link per student
3. Sends each student a personalized email (via Resend) and optionally a WhatsApp message
4. On payment, the existing Make.com webhook fires and sends the Telegram invite — zero change to existing pipeline

**Admin effort per cohort:** 1 click ("Open cohort + notify previous students")  
**Student effort:** 1 click to open email → 1 click to pay (details pre-filled)

---

## Approach B: Razorpay Subscriptions (Auto-Renewal)

**How it works:**  
Students pay once and are enrolled in a recurring monthly Razorpay subscription. On each billing
cycle, the payment auto-charges and a webhook triggers the new Telegram invite.

**Admin effort per cohort:** Rotate the Telegram invite link in the config (already documented)  
**Student effort:** Zero after initial signup

---

## Detailed Comparison

### 1. Student Experience

| Dimension | Approach A (Auto Links) | Approach B (Subscriptions) |
|---|---|---|
| First-time signup | Same as today | Same as today |
| Re-enrollment UX | Click email → pay (2 clicks) | Fully automatic — nothing needed |
| Student control | ✅ Opt-in each month consciously | ⚠️ Must actively cancel to stop |
| Surprise charges | ✅ Never — student always initiates | ❌ Risk of unexpected charges |
| Flexibility | ✅ Can skip a month without cancelling | ❌ Must cancel + re-subscribe to pause |
| Personal feel | ✅ "You've been invited back" | ❌ Transactional / utility feel |

**Winner: Depends on artist's brand.** For a high-touch creative community, Approach A *feels* more
intentional. Approach B optimizes for automation over relationship.

---

### 2. Operations & Admin

| Dimension | Approach A (Auto Links) | Approach B (Subscriptions) |
|---|---|---|
| Monthly admin effort | 1 click to trigger batch send | Rotate Telegram invite link only |
| Failure handling | Email delivery failures are logged; retry possible | Failed charges require manual follow-up or grace period logic |
| Rolling cohort management | ✅ Each cohort is naturally isolated | ⚠️ Subscription dates stagger — students not all billed on day 1 |
| Removing a student from a cohort | ✅ Simply don't send them a link | ⚠️ Must cancel their subscription manually |
| Scholarship / partial refunds | ✅ Issue a discounted payment link | ❌ Requires subscription plan variations — complex |
| Loyalty / returning-student discounts | ✅ Generate link at a different amount | ⚠️ Requires a separate subscription plan |

**Winner: Approach A** for operational flexibility. Approach B works best when every student is
identical — same price, same schedule, no exceptions.

---

### 3. Revenue & Business Model

| Dimension | Approach A (Auto Links) | Approach B (Subscriptions) |
|---|---|---|
| Revenue predictability | ⚠️ Unknown until students pay | ✅ Predictable MRR |
| Churn visibility | ⚠️ Visible only after cohort opens | ✅ Churn is measurable continuously |
| Failed payment recovery | N/A (student simply doesn't pay) | ❌ Razorpay retries, but unrecovered = lost cohort slot |
| Price changes between cohorts | ✅ Trivial — new link, new amount | ❌ Requires migrating subscribers to a new plan |
| Early-bird / time-limited pricing | ✅ Easy — generate discounted links for 48hr window | ❌ Very difficult with subscriptions |
| Handling cohort size caps | ✅ Stop sending links once cap is hit | ❌ Subscriptions don't inherently respect caps |

**Winner: Approach A** for a growing, evolving business. Approach B suits a stable, commoditized
product (e.g., Netflix) — not a cohort with creative direction, varying prices, and curated access.

---

### 4. Technical Implementation

| Dimension | Approach A (Auto Links) | Approach B (Subscriptions) |
|---|---|---|
| New infrastructure needed | Batch job API route + email template | Razorpay subscription plan setup + new webhook handler |
| Changes to existing pipeline | None — webhook unchanged | Webhook must handle `subscription.charged` event differently |
| Complexity | Medium | High |
| Risk of regression | Low | Medium — touches payment core |
| Supabase schema changes | Add `cohort_month` field (minor) | Add `subscription_id`, `subscription_status`, billing state |
| Make.com changes | None | New scenario for subscription renewal routing |
| Time to build | ~1–2 days | ~3–5 days |

**Winner: Approach A** — significantly less risk and faster to ship.

---

### 5. Edge Cases & Risk

| Scenario | Approach A | Approach B |
|---|---|---|
| Student wants to skip July, rejoin August | ✅ Simply doesn't pay in July | ❌ Must cancel + re-subscribe — confusing |
| Artist wants to cap July at 200 students | ✅ Send only 200 links | ❌ All subscribers auto-renew regardless |
| Artist cancels a cohort | ✅ Just don't trigger the batch | ❌ Must cancel 500 subscriptions and issue refunds |
| Student's card expires | N/A — student actively pays | ❌ Silent failure; student misses cohort without warning |
| Student disputes a charge | ✅ They explicitly initiated it | ⚠️ "I forgot I was subscribed" disputes are common |
| GDPR / data deletion request | ✅ Remove from Supabase, done | ❌ Must also cancel active Razorpay subscription |

**Winner: Approach A** — far fewer failure modes, and each failure is recoverable.

---

## Summary Scorecard

| Category | Approach A (Auto Links) | Approach B (Subscriptions) |
|---|---|---|
| Student experience | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Operations flexibility | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| Revenue predictability | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Technical risk | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| Edge case resilience | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| Time to ship | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Overall** | **⭐⭐⭐⭐** | **⭐⭐⭐** |

---

## Recommendation

**Build Approach A now. Keep Approach B as a future option.**

Approach B becomes the right answer *only* when:
- Pricing is stable month-over-month
- Cohort size is uncapped or cap logic is moved outside the subscription system
- The artist is comfortable with automatic charges (brand/trust consideration)
- A formal subscription management UI exists for students (pause, cancel, update card)

Until those conditions are met, Approach A gives **80% of the automation benefit with 20% of the
complexity and risk.** It also preserves the intentional, invite-like nature of each cohort — which
is likely a feature, not a bug, for a creative community.

---

## Next Steps (if proceeding with Approach A)

- [ ] Create API route: `POST /api/cohort/notify-reenrollment`
  - Accepts `cohort_month` (e.g., `"2026-07"`) as input
  - Queries Supabase for all enrollees from `cohort_month - 1`
  - Calls Razorpay Payment Links API per student with prefilled customer data
  - Triggers Resend batch email with personalized link
- [ ] Design email template: "Your spot in the July cohort is waiting"
- [ ] Add "Notify Previous Students" button to admin cohort management UI
- [ ] Add delivery status log (sent / failed / opened) to admin dashboard
- [ ] Decide: same price, loyalty discount, or early-bird window?
