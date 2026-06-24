# 🎓 Participation Certificate Feature

> **Delivery via Twilio WhatsApp | Generate on-demand | Supabase Storage | Dynamic Templates**

---

## Overview

When a student joins the Telegram group (`telegram_joined = true`), they are eligible for a
**Participation Certificate** — a beautifully designed PDF/PNG with their name, cohort details,
learning outcomes, and a digital signature from Aishwarya.

Instead of a hardcoded design, the admin can now **upload custom background templates** per cohort and visually configure where dynamic text fields should be placed. The admin triggers delivery manually per cohort from the admin panel.

---

## Decisions

| Decision | Choice | Reason |
|---|---|---|
| Design Config | Dynamic absolute-positioned renderer | Allows admins to use completely different backgrounds for each cohort without changing code |
| Delivery | Twilio WhatsApp (document message) | Immediate, personal, no email spam |
| Trigger | Manual admin button per cohort | Full control |
| Storage | Supabase Storage (`certificates` bucket) | Needed for Twilio's media URL; 1GB free = ~5000 certs |
| Template Storage| Supabase DB (`certificate_templates`) | Stores coordinates, font sizes, and color mappings for each field |
| Idempotency | `certificate_sent_at` column on `enrollments` | Prevents double-send |

---

## Architecture

```
Admin → Uploads Base Image to `certificate_templates` Bucket
      ↓
Admin → Drags & Drops text placeholders (Name, Date, etc.) on a Canvas
      ↓
Saves mapping (x, y, font size, color) to DB `cohort_certificate_templates` table
      ↓
Admin → "Send Certificates" (Cohort Manager)
      ↓
POST /api/admin/cohorts/[id]/send-certificates
      ↓
Query: enrollments WHERE cohort_id = :id AND telegram_joined = true
Query: cohort_certificate_templates WHERE cohort_id = :id
      ↓
For each student (Promise.allSettled):
  1. Generate PNG via Satori using the dynamic fields mapping over the background image
  2. supabase.storage.upload('certificates', '{cohort_id}/{student_id}.png', buffer)
  3. supabase.storage.getPublicUrl(...)
  4. sendTwilioWhatsAppCertificate(phone, name, cohortTitle, publicUrl)
  5. UPDATE enrollments SET certificate_sent_at = NOW(), certificate_url = publicUrl
```

---

## Configurable Certificate Templates (Database & UI)

The static flexbox layout has been replaced by a dynamic builder system. 

### Database Schema

**Table: `cohort_certificate_templates`**
- `cohort_id` (Foreign Key, unique)
- `background_url` (Text) — URL to the base image in Supabase
- `canvas_width`, `canvas_height` (Integer) — e.g. 800x1000
- `fields_config` (JSONB) — Array of field objects containing:
  - `type` ("dynamic" or "static")
  - `content` (String, used for static text like "This is to certify that...")
  - `id` ("student_name", "cohort_title", "issued_date", etc.)
  - `x`, `y` (Integer coordinates)
  - `width`, `height` (Integer bounding box)
  - `fontSize` (Integer)
  - `fontFamily` (String)
  - `color` (String hex code)
  - `textAlign` ("left", "center", "right")

### Interactive Admin UI
1. **Upload Background**: Admins upload a high-res PNG/JPG which gets stored in the `certificate_templates` bucket.
2. **Visual Canvas Editor**: A drag-and-drop interface where admins can spawn **dynamic placeholders** (Student Name, Cohort Title) AND **static text boxes** (custom fixed text). The fields can be dragged to position them perfectly over the blank spaces in the uploaded background image.
3. **Properties Panel**: Clicking a field allows the admin to tweak its font size, color, and alignment.
4. **Save**: The resulting coordinate map is saved to `fields_config`.

### Dynamic Backend Renderer
`@vercel/og` (Satori) takes the saved `fields_config` and loops over it to render `<div style={{ position: 'absolute', top: field.y, left: field.x, color: field.color, ... }}>{value}</div>` over the root background image.

---

## Twilio WhatsApp Setup Steps (One-Time)

### Step 1 — Create a Document Content Template

You need a **new** Twilio Content Template specifically for certificate delivery.

1. Go to **[Twilio Console → Content Editor](https://console.twilio.com/us1/develop/sms/content-editor)**
2. Click **Create new content**
3. Set **Friendly Name**: `certificate_delivery`
4. Set **Language**: English (en)
5. Under **Content Type**, choose **Media**
6. Set the body text:
   ```
   🎓 Congratulations, {{1}}!

   Here is your Certificate of Participation for the *{{2}}* cohort.

   We're so proud of your commitment to this learning journey. Keep this certificate as a testament to your dedication.

   — Aishwarya Manikarnike
   ```
7. **Variables**:
   - `{{1}}` = Student name
   - `{{2}}` = Cohort title

8. Click **Save & Submit for WhatsApp Approval**
9. Wait for Meta approval (usually **24–72 hours**)
10. Once approved, copy the **Content SID** (format: `HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`)

### Step 2 — Add Environment Variable

Add to `.env.local` and **Vercel/Netlify production env vars**:

```bash
TWILIO_WHATSAPP_CERTIFICATE_CONTENT_SID=HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Step 3 — Create Supabase Storage Buckets

Run this in Supabase SQL Editor:

```sql
-- For generating student certificates
INSERT INTO storage.buckets (id, name, public) VALUES ('certificates', 'certificates', true) ON CONFLICT DO NOTHING;

-- For admins to upload base template backgrounds
INSERT INTO storage.buckets (id, name, public) VALUES ('certificate_templates', 'certificate_templates', true) ON CONFLICT DO NOTHING;
```

---

## Files to Create / Modify

### [NEW] `supabase/migrations/20260624_add_certificate_templates.sql`
```sql
CREATE TABLE public.cohort_certificate_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cohort_id UUID REFERENCES public.cohorts(id) ON DELETE CASCADE UNIQUE,
  background_url TEXT NOT NULL,
  canvas_width INTEGER DEFAULT 800,
  canvas_height INTEGER DEFAULT 1000,
  fields_config JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### [MODIFY] `lib/certificates/ParticipationCertificateImage.tsx`
Rewrite the component to accept the dynamic `fields_config` mapping instead of the hardcoded layout. It will map over the coordinates and use `position: 'absolute'` to render the strings on top of the `background_url`.

### [NEW] `app/admin/cohorts/[id]/template-builder/page.tsx`
An interactive drag-and-drop admin UI for visual template configuration.

### [MODIFY] `app/api/admin/cohorts/[id]/send-certificates/route.ts`
Fetch the `cohort_certificate_templates` mapping alongside the cohort data, and feed it into the certificate renderer.

---

## Admin UI — Certificates Panel (Cohort Manager)

```
┌──────────────────────────────────────────────────────┐
│  🎓  Participation Certificates                       │
│                                                       │
│  [ Configure Template Layout ]                        │
│                                                       │
│  ✅  12  joined Telegram                              │
│  📤   8  certificates sent                            │
│  ⏳   4  ready to send                                │
│                                                       │
│  [ Preview 4 Students ]   [ Send Certificates → ]    │
│                                                       │
│  Last sent: 21 Jun 2026, 3:45 PM                     │
└──────────────────────────────────────────────────────┘
```

**Send Flow with Exclusion:**
When the admin clicks **[ Send Certificates → ]**, a modal should appear listing the eligible students (e.g., the 4 students who joined Telegram but haven't received certificates yet). 
- All students in the list are checked by default.
- The admin can uncheck specific students they wish to exclude from this batch send.
- Clicking "Confirm & Send" triggers the API route, passing an array of the explicitly selected `student_ids`.

---

## Implementation Order

```
[ ] 1. DB Migration: Create `cohort_certificate_templates` table and `certificate_templates` storage bucket.
[ ] 2. Build: Admin UI for uploading template backgrounds and the drag-and-drop coordinate builder.
[ ] 3. Build: Refactor `ParticipationCertificateImage.tsx` to loop through `fields_config` with absolute positioning.
[ ] 4. Build: Refactor `/preview-certificate` endpoint to read the template configuration from the database.
[ ] 5. Test locally: Configure a template, drag the Student Name box, and preview the generated PNG.
[ ] 6. Build: Update the Twilio WhatsApp bulk delivery route to utilize the new dynamic templates.
[ ] 7. Test end-to-end: Send a certificate to your own WhatsApp number.
```

---

## Cost at Scale (1000 students)

| Component | Usage | Cost |
|---|---|---|
| PDF/PNG generation | ~130ms CPU per cert | ₹0 (serverless runtime - Fluid Compute Active CPU) |
| Supabase Storage | 1000 × 40KB = 40MB | ₹0 (within 1GB free tier) |
| Supabase egress | Twilio fetches each image once | ₹0 (within 2GB/month free) |
| Twilio WhatsApp | 1000 messages | ~$0.005/msg × 1000 = **~$5 / ₹420** |
| **Total** | | **~₹420 one-time per 1000 certs** |

---

## Resend / Edge Cases

| Scenario | How it's handled |
|---|---|
| Student needs cert resent | "Send Certificate" button in Students page → bypasses `certificate_sent_at` guard |
| Cohort has no template configured | The "Send Certificates" action is disabled or throws a validation error |
| Twilio fails for one student | `Promise.allSettled` — others still get sent, errors reported in response |
| PNG generation fails | Error reported per student, DB not updated (no partial state) |
