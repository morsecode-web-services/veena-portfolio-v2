-- Drop the existing view first (required to change view options)
DROP VIEW IF EXISTS public.student_search_view;

-- Recreate the student search view with security_invoker = on
CREATE VIEW public.student_search_view 
WITH (security_invoker = on) AS
SELECT 
    fs.id,
    fs.user_name AS name,
    fs.user_email AS email,
    COALESCE(fs.form_data->>'phone', '') AS phone,
    c.title AS cohort_title,
    'enrollment'::text AS type,
    fs.payment_status AS status,
    fs.created_at,
    NULL::text AS payment_link_url
FROM 
    public.form_submissions fs
    LEFT JOIN public.cohorts c ON fs.cohort_id = c.id
UNION ALL
SELECT 
    rl.id,
    rl.student_name AS name,
    rl.student_email AS email,
    COALESCE(rl.student_phone, '') AS phone,
    c.title AS cohort_title,
    'invitation'::text AS type,
    rl.status AS status,
    rl.created_at,
    rl.payment_link_url
FROM 
    public.reenrollment_logs rl
    LEFT JOIN public.cohorts c ON rl.target_cohort_id = c.id;
