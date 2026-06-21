-- Migration: Add telegram_display_name to track display names independently from unique usernames

-- 1. Add to form_submissions
ALTER TABLE public.form_submissions ADD COLUMN IF NOT EXISTS telegram_display_name TEXT;

-- 2. Add to enrollments
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS telegram_display_name TEXT;

-- 3. Update the view
DROP VIEW IF EXISTS public.student_search_view;

CREATE OR REPLACE VIEW public.student_search_view 
WITH (security_invoker = on) AS
SELECT 
    e.id,
    s.id AS student_id,
    s.name,
    s.email,
    COALESCE(s.phone, '') AS phone,
    c.title AS cohort_title,
    'enrollment'::text AS type,
    CASE WHEN e.status = 'active' THEN 'paid'::text ELSE 'pending'::text END AS status,
    e.created_at,
    e.telegram_invite_link AS payment_link_url,
    e.telegram_joined,
    e.telegram_username,
    e.telegram_display_name,
    (SELECT p.amount FROM public.payments p WHERE p.enrollment_id = e.id AND p.status = 'paid' LIMIT 1) AS amount
FROM 
    public.enrollments e
    JOIN public.students s ON e.student_id = s.id
    JOIN public.cohorts c ON e.cohort_id = c.id
UNION ALL
SELECT 
    ri.id,
    s.id AS student_id,
    s.name,
    s.email,
    COALESCE(s.phone, '') AS phone,
    c.title AS cohort_title,
    'invitation'::text AS type,
    ri.status AS status,
    ri.created_at,
    ri.payment_link_url,
    false AS telegram_joined,
    NULL::text AS telegram_username,
    NULL::text AS telegram_display_name,
    NULL::integer AS amount
FROM 
    public.reenrollment_invitations ri
    JOIN public.students s ON ri.student_id = s.id
    JOIN public.cohorts c ON ri.target_cohort_id = c.id;
