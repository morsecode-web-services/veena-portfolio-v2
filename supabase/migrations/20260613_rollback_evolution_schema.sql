-- Migration: Rollback Evolution Schema & Restore Data
-- Run this script in your Supabase SQL editor or via CLI to revert all database modifications 
-- and restore tables from their backup snapshots.

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. REBUILD ORIGINAL VIEW
-- ─────────────────────────────────────────────────────────────────────────────
DROP VIEW IF EXISTS public.student_search_view;

CREATE OR REPLACE VIEW public.student_search_view 
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
    fs.telegram_invite_link AS payment_link_url,
    fs.telegram_joined,
    fs.telegram_username,
    fs.razorpay_amount AS amount
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
    rl.payment_link_url,
    false AS telegram_joined,
    NULL::text AS telegram_username,
    NULL::integer AS amount
FROM 
    public.reenrollment_logs rl
    LEFT JOIN public.cohorts c ON rl.target_cohort_id = c.id;


-- ─────────────────────────────────────────────────────────────────────────────
-- 2. RESTORE DATA FROM SNAPSHOT BACKUPS
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
BEGIN
    -- Restore public.leads if snapshot exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'backup_leads') 
       AND EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'leads') THEN
        TRUNCATE TABLE public.leads RESTART IDENTITY CASCADE;
        INSERT INTO public.leads SELECT * FROM public.backup_leads;
        RAISE NOTICE 'Restored public.leads from backup snapshot.';
    END IF;

    -- Restore public.form_submissions if snapshot exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'backup_form_submissions') 
       AND EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'form_submissions') THEN
        TRUNCATE TABLE public.form_submissions RESTART IDENTITY CASCADE;
        INSERT INTO public.form_submissions SELECT * FROM public.backup_form_submissions;
        RAISE NOTICE 'Restored public.form_submissions from backup snapshot.';
    END IF;

    -- Restore public.reenrollment_logs if snapshot exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'backup_reenrollment_logs') 
       AND EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'reenrollment_logs') THEN
        TRUNCATE TABLE public.reenrollment_logs RESTART IDENTITY CASCADE;
        INSERT INTO public.reenrollment_logs SELECT * FROM public.backup_reenrollment_logs;
        RAISE NOTICE 'Restored public.reenrollment_logs from backup snapshot.';
    END IF;

    -- Restore public.telegram_invite_logs if snapshot exists
    -- NOTE: Use explicit column list — the backup was taken before the evolution migration added
    -- the 'enrollment_id' column, so SELECT * would cause a column count mismatch error.
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'backup_telegram_invite_logs') 
       AND EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'telegram_invite_logs') THEN
        TRUNCATE TABLE public.telegram_invite_logs RESTART IDENTITY CASCADE;
        INSERT INTO public.telegram_invite_logs (id, submission_id, action, invite_link, telegram_username, created_by, payload, created_at)
        SELECT id, submission_id, action, invite_link, telegram_username, created_by, payload, created_at
        FROM public.backup_telegram_invite_logs;
        RAISE NOTICE 'Restored public.telegram_invite_logs from backup snapshot.';
    END IF;
END $$;


-- ─────────────────────────────────────────────────────────────────────────────
-- 3. DROP NEW TABLES (CASCADE DROPS CONSTRAINTS, POLICIES, AND TRIGGERS)
-- ─────────────────────────────────────────────────────────────────────────────
DROP TABLE IF EXISTS public.reenrollment_invitations CASCADE;
DROP TABLE IF EXISTS public.payments CASCADE;
DROP TABLE IF EXISTS public.offline_enrollments CASCADE;
DROP TABLE IF EXISTS public.offline_classes CASCADE;
DROP TABLE IF EXISTS public.enrollments CASCADE;
DROP TABLE IF EXISTS public.students CASCADE;
DROP TABLE IF EXISTS public.course_lessons CASCADE;
DROP TABLE IF EXISTS public.courses CASCADE;


-- ─────────────────────────────────────────────────────────────────────────────
-- 4. CLEAN UP ADDED COLUMNS AND FUNCTIONS
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.cohorts DROP COLUMN IF EXISTS course_id CASCADE;
ALTER TABLE public.telegram_invite_logs DROP COLUMN IF EXISTS enrollment_id CASCADE;

DROP FUNCTION IF EXISTS verify_lesson_access(UUID, UUID) CASCADE;

COMMIT;
