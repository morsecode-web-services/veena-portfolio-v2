-- Migration: Create Evolution Schema & Perform Historical Backfill
-- This script creates the new normalized tables, sets up indices, triggers, RLS policies, 
-- and migrates historical checkouts/reenrollments.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. SCHEMA TABLES CREATION
-- ─────────────────────────────────────────────────────────────────────────────

-- A. Courses Table
CREATE TABLE IF NOT EXISTS public.courses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- B. Course Lessons Table
CREATE TABLE IF NOT EXISTS public.course_lessons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    video_url TEXT,
    video_duration INTEGER,
    is_free_preview BOOLEAN DEFAULT false,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- C. Link Cohorts to Courses
ALTER TABLE public.cohorts ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES public.courses(id);

-- D. Students Table
CREATE TABLE IF NOT EXISTS public.students (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- E. Enrollments Table
CREATE TABLE IF NOT EXISTS public.enrollments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    cohort_id UUID NOT NULL REFERENCES public.cohorts(id) ON DELETE RESTRICT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
    telegram_joined BOOLEAN DEFAULT false,
    telegram_username TEXT,
    telegram_invite_link TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, cohort_id)
);

-- F. Offline Classes Table
CREATE TABLE IF NOT EXISTS public.offline_classes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    fees_monthly INTEGER NOT NULL, -- in paise
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- G. Offline Enrollments Table
CREATE TABLE IF NOT EXISTS public.offline_enrollments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    offline_class_id UUID NOT NULL REFERENCES public.offline_classes(id) ON DELETE RESTRICT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'cancelled')),
    joined_date DATE NOT NULL DEFAULT CURRENT_DATE,
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, offline_class_id)
);

-- H. Payments Table
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES public.students(id) ON DELETE SET NULL,
    enrollment_id UUID REFERENCES public.enrollments(id) ON DELETE SET NULL,
    razorpay_order_id TEXT UNIQUE,
    razorpay_payment_id TEXT UNIQUE,
    razorpay_payment_link_id TEXT UNIQUE,
    razorpay_subscription_id TEXT UNIQUE,
    razorpay_customer_id TEXT,
    amount INTEGER, -- in paise
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- I. Reenrollment Invitations Table
CREATE TABLE IF NOT EXISTS public.reenrollment_invitations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    source_cohort_id UUID REFERENCES public.cohorts(id) ON DELETE SET NULL,
    target_cohort_id UUID NOT NULL REFERENCES public.cohorts(id) ON DELETE CASCADE,
    payment_link_id TEXT,
    payment_link_url TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'paid')),
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- J. Link Telegram Invite Logs to Enrollments
ALTER TABLE public.telegram_invite_logs ADD COLUMN IF NOT EXISTS enrollment_id UUID REFERENCES public.enrollments(id) ON DELETE CASCADE;


-- ─────────────────────────────────────────────────────────────────────────────
-- 2. QUERY PERFORMANCE INDEXES
-- ─────────────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_students_email ON public.students(email);
CREATE INDEX IF NOT EXISTS idx_students_auth_user_id ON public.students(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_student_id ON public.enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_cohort_id ON public.enrollments(cohort_id);
CREATE INDEX IF NOT EXISTS idx_offline_enrollments_student_id ON public.offline_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_offline_enrollments_class_id ON public.offline_enrollments(offline_class_id);
CREATE INDEX IF NOT EXISTS idx_payments_student_id ON public.payments(student_id);
CREATE INDEX IF NOT EXISTS idx_payments_enrollment_id ON public.payments(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON public.payments(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_id ON public.payments(razorpay_payment_id);
CREATE INDEX IF NOT EXISTS idx_reenrollment_invitations_student_id ON public.reenrollment_invitations(student_id);
CREATE INDEX IF NOT EXISTS idx_reenrollment_invitations_target ON public.reenrollment_invitations(target_cohort_id);
CREATE INDEX IF NOT EXISTS idx_telegram_invite_logs_enrollment_id ON public.telegram_invite_logs(enrollment_id);


-- ─────────────────────────────────────────────────────────────────────────────
-- 3. TIMESTAMP TRIGGERS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TRIGGER update_students_updated_at 
    BEFORE UPDATE ON public.students 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_enrollments_updated_at 
    BEFORE UPDATE ON public.enrollments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_offline_enrollments_updated_at 
    BEFORE UPDATE ON public.offline_enrollments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at 
    BEFORE UPDATE ON public.payments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reenrollment_invitations_updated_at 
    BEFORE UPDATE ON public.reenrollment_invitations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ─────────────────────────────────────────────────────────────────────────────
-- 4. VIDEO LOCK SECURITY FUNCTION
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION verify_lesson_access(p_user_id UUID, p_lesson_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Allow admins and editors bypass
    IF EXISTS (SELECT 1 FROM profiles WHERE id = p_user_id AND (role = 'admin' OR role = 'editor')) THEN
        RETURN true;
    END IF;

    -- Allow access if lesson is a free preview
    IF EXISTS (SELECT 1 FROM course_lessons WHERE id = p_lesson_id AND is_free_preview = true) THEN
        RETURN true;
    END IF;

    -- Allow access if student is actively enrolled in the cohort running this course
    RETURN EXISTS (
        SELECT 1 
        FROM public.course_lessons cl
        JOIN public.courses co ON cl.course_id = co.id
        JOIN public.cohorts c ON c.course_id = co.id
        JOIN public.enrollments e ON e.cohort_id = c.id
        JOIN public.students s ON e.student_id = s.id
        WHERE cl.id = p_lesson_id
          AND s.auth_user_id = p_user_id
          AND e.status = 'active'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ─────────────────────────────────────────────────────────────────────────────
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ─────────────────────────────────────────────────────────────────────────────

-- Students
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Students can read their own profile" ON public.students;
CREATE POLICY "Students can read their own profile" ON public.students
    FOR SELECT TO authenticated USING (auth.uid() = auth_user_id);

DROP POLICY IF EXISTS "Admins/editors can manage all student profiles" ON public.students;
CREATE POLICY "Admins/editors can manage all student profiles" ON public.students
    FOR ALL TO authenticated USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role = 'admin' OR role = 'editor'))
    );

-- Enrollments
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Students can view their own enrollments" ON public.enrollments;
CREATE POLICY "Students can view their own enrollments" ON public.enrollments
    FOR SELECT TO authenticated USING (
        student_id IN (SELECT id FROM public.students WHERE auth_user_id = auth.uid())
    );

DROP POLICY IF EXISTS "Admins/editors can manage all enrollments" ON public.enrollments;
CREATE POLICY "Admins/editors can manage all enrollments" ON public.enrollments
    FOR ALL TO authenticated USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role = 'admin' OR role = 'editor'))
    );

-- Payments
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Students can view their own payments" ON public.payments;
CREATE POLICY "Students can view their own payments" ON public.payments
    FOR SELECT TO authenticated USING (
        student_id IN (SELECT id FROM public.students WHERE auth_user_id = auth.uid())
    );

DROP POLICY IF EXISTS "Admins/editors can manage all payments" ON public.payments;
CREATE POLICY "Admins/editors can manage all payments" ON public.payments
    FOR ALL TO authenticated USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role = 'admin' OR role = 'editor'))
    );

-- Reenrollment Invitations
ALTER TABLE public.reenrollment_invitations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Students can view their own invitations" ON public.reenrollment_invitations;
CREATE POLICY "Students can view their own invitations" ON public.reenrollment_invitations
    FOR SELECT TO authenticated USING (
        student_id IN (SELECT id FROM public.students WHERE auth_user_id = auth.uid())
    );

DROP POLICY IF EXISTS "Admins/editors can manage invitations" ON public.reenrollment_invitations;
CREATE POLICY "Admins/editors can manage invitations" ON public.reenrollment_invitations
    FOR ALL TO authenticated USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role = 'admin' OR role = 'editor'))
    );

-- Courses & Lessons
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_lessons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to published courses" ON public.courses;
CREATE POLICY "Allow public read access to published courses" ON public.courses
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow select for verified lesson access" ON public.course_lessons;
CREATE POLICY "Allow select for verified lesson access" ON public.course_lessons
    FOR SELECT TO authenticated USING (
        is_free_preview = true OR verify_lesson_access(auth.uid(), id)
    );

DROP POLICY IF EXISTS "Admins/editors can manage courses" ON public.courses;
CREATE POLICY "Admins/editors can manage courses" ON public.courses
    FOR ALL TO authenticated USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role = 'admin' OR role = 'editor'))
    );

DROP POLICY IF EXISTS "Admins/editors can manage lessons" ON public.course_lessons;
CREATE POLICY "Admins/editors can manage lessons" ON public.course_lessons
    FOR ALL TO authenticated USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role = 'admin' OR role = 'editor'))
    );

-- Offline System
ALTER TABLE public.offline_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offline_enrollments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students can view their own offline enrollments" ON public.offline_enrollments;
CREATE POLICY "Students can view their own offline enrollments" ON public.offline_enrollments
    FOR SELECT TO authenticated USING (
        student_id IN (SELECT id FROM public.students WHERE auth_user_id = auth.uid())
    );

DROP POLICY IF EXISTS "Students can view offline classes they are enrolled in" ON public.offline_classes;
CREATE POLICY "Students can view offline classes they are enrolled in" ON public.offline_classes
    FOR SELECT TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.offline_enrollments oe
            JOIN public.students s ON oe.student_id = s.id
            WHERE oe.offline_class_id = offline_classes.id
              AND s.auth_user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Admins/editors can manage offline classes" ON public.offline_classes;
CREATE POLICY "Admins/editors can manage offline classes" ON public.offline_classes
    FOR ALL TO authenticated USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role = 'admin' OR role = 'editor'))
    );

DROP POLICY IF EXISTS "Admins/editors can manage offline enrollments" ON public.offline_enrollments;
CREATE POLICY "Admins/editors can manage offline enrollments" ON public.offline_enrollments
    FOR ALL TO authenticated USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role = 'admin' OR role = 'editor'))
    );


-- ─────────────────────────────────────────────────────────────────────────────
-- 6. HISTORICAL DATA BACKFILL & LINKING
-- ─────────────────────────────────────────────────────────────────────────────

-- A. Create initial courses template from distinct cohort records
-- Add unique constraint on title first so ON CONFLICT can deduplicate safely on re-runs
CREATE UNIQUE INDEX IF NOT EXISTS idx_courses_title_unique ON public.courses(title);

INSERT INTO public.courses (title, description, image_url)
SELECT DISTINCT ON (title) title, description, image_url
FROM public.cohorts
ON CONFLICT (title) DO NOTHING;

-- Link cohorts to the newly created courses template
UPDATE public.cohorts c
SET course_id = co.id
FROM public.courses co
WHERE c.title = co.title AND c.course_id IS NULL;

-- B. Backfill unique students from form_submissions (mapped by email)
INSERT INTO public.students (name, email, phone, created_at, updated_at)
SELECT DISTINCT ON (user_email)
    COALESCE(user_name, 'Anonymous') AS name,
    user_email AS email,
    COALESCE(form_data->>'phone', '') AS phone,
    created_at,
    NOW() AS updated_at  -- form_submissions has no updated_at column
FROM public.form_submissions
WHERE user_email IS NOT NULL AND cohort_id IS NOT NULL
ORDER BY user_email, created_at DESC
ON CONFLICT (email) DO UPDATE SET
    phone = CASE WHEN COALESCE(EXCLUDED.phone, '') <> '' THEN EXCLUDED.phone ELSE students.phone END,
    updated_at = NOW();

-- C. Backfill unique students from reenrollment_logs
INSERT INTO public.students (name, email, phone, created_at, updated_at)
SELECT DISTINCT ON (student_email)
    student_name AS name,
    student_email AS email,
    student_phone AS phone,
    created_at,
    NOW() AS updated_at  -- reenrollment_logs has no updated_at column
FROM public.reenrollment_logs
WHERE student_email IS NOT NULL
ORDER BY student_email, created_at DESC
ON CONFLICT (email) DO NOTHING;

-- D. Backfill enrollments linking students to cohorts
INSERT INTO public.enrollments (student_id, cohort_id, status, telegram_joined, telegram_username, telegram_invite_link, created_at, updated_at)
SELECT DISTINCT ON (s.id, fs.cohort_id)
    s.id AS student_id,
    fs.cohort_id,
    CASE WHEN fs.payment_status = 'paid' THEN 'active'::text ELSE 'cancelled'::text END AS status,
    COALESCE(fs.telegram_joined, false) AS telegram_joined,
    fs.telegram_username,
    fs.telegram_invite_link,
    fs.created_at,
    NOW() AS updated_at  -- form_submissions has no updated_at column
FROM public.form_submissions fs
JOIN public.students s ON fs.user_email = s.email
WHERE fs.cohort_id IS NOT NULL
ORDER BY s.id, fs.cohort_id, fs.created_at DESC
ON CONFLICT (student_id, cohort_id) DO UPDATE SET
    status = EXCLUDED.status,
    telegram_joined = EXCLUDED.telegram_joined,
    telegram_username = EXCLUDED.telegram_username,
    telegram_invite_link = EXCLUDED.telegram_invite_link;

-- E. Backfill payments linking transactions to student and enrollment
INSERT INTO public.payments (
    student_id, 
    enrollment_id, 
    razorpay_order_id, 
    razorpay_payment_id, 
    razorpay_payment_link_id, 
    razorpay_subscription_id, 
    razorpay_customer_id, 
    amount, 
    status, 
    created_at,
    updated_at
)
SELECT 
    s.id AS student_id,
    e.id AS enrollment_id,
    fs.razorpay_order_id,
    fs.razorpay_payment_id,
    fs.razorpay_payment_link_id,
    fs.razorpay_subscription_id,
    fs.razorpay_customer_id,
    fs.razorpay_amount AS amount,
    CASE WHEN fs.payment_status = 'paid' THEN 'paid'::text ELSE 'pending'::text END AS status,
    fs.created_at,
    NOW() AS updated_at  -- form_submissions has no updated_at column
FROM public.form_submissions fs
JOIN public.students s ON fs.user_email = s.email
LEFT JOIN public.enrollments e ON e.student_id = s.id AND e.cohort_id = fs.cohort_id
WHERE fs.cohort_id IS NOT NULL AND (
    fs.razorpay_order_id IS NOT NULL 
    OR fs.razorpay_payment_id IS NOT NULL 
    OR fs.razorpay_payment_link_id IS NOT NULL 
    OR fs.razorpay_subscription_id IS NOT NULL
)
ON CONFLICT (razorpay_payment_id) DO NOTHING;

-- F. Backfill reenrollment invitations
INSERT INTO public.reenrollment_invitations (student_id, source_cohort_id, target_cohort_id, payment_link_id, payment_link_url, status, error_message, created_at, updated_at)
SELECT
    s.id AS student_id,
    rl.source_cohort_id,
    rl.target_cohort_id,
    rl.payment_link_id,
    rl.payment_link_url,
    rl.status,
    rl.error_message,
    rl.created_at,
    NOW() AS updated_at  -- reenrollment_logs has no updated_at column
FROM public.reenrollment_logs rl
JOIN public.students s ON rl.student_email = s.email;

-- G. Migrate telegram_invite_logs references
UPDATE public.telegram_invite_logs til
SET enrollment_id = e.id
FROM public.form_submissions fs
JOIN public.students s ON fs.user_email = s.email
JOIN public.enrollments e ON e.student_id = s.id AND e.cohort_id = fs.cohort_id
WHERE til.submission_id = fs.id AND til.enrollment_id IS NULL;


-- ─────────────────────────────────────────────────────────────────────────────
-- 7. REBUILD VIEW
-- ─────────────────────────────────────────────────────────────────────────────
DROP VIEW IF EXISTS public.student_search_view;

CREATE OR REPLACE VIEW public.student_search_view 
WITH (security_invoker = on) AS
SELECT 
    e.id,
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
    (SELECT p.amount FROM public.payments p WHERE p.enrollment_id = e.id AND p.status = 'paid' LIMIT 1) AS amount
FROM 
    public.enrollments e
    JOIN public.students s ON e.student_id = s.id
    JOIN public.cohorts c ON e.cohort_id = c.id
UNION ALL
SELECT 
    ri.id,
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
    NULL::integer AS amount
FROM 
    public.reenrollment_invitations ri
    JOIN public.students s ON ri.student_id = s.id
    JOIN public.cohorts c ON ri.target_cohort_id = c.id;
