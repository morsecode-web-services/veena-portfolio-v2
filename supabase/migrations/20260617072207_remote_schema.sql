


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."user_role" AS ENUM (
    'admin',
    'editor',
    'viewer'
);


ALTER TYPE "public"."user_role" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.profiles (id, role)
  VALUES (new.id, 'viewer');
  RETURN new;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_blog_likes"("blog_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  UPDATE blogs
  SET likes = likes + 1
  WHERE id = blog_id;
END;
$$;


ALTER FUNCTION "public"."increment_blog_likes"("blog_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_blog_views"("blog_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  UPDATE blogs
  SET views = COALESCE(views, 0) + 1
  WHERE id = blog_id;
END;
$$;


ALTER FUNCTION "public"."increment_blog_views"("blog_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_click_count"("row_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  UPDATE smart_links
  SET clicks = clicks + 1
  WHERE id = row_id;
END;
$$;


ALTER FUNCTION "public"."increment_click_count"("row_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."verify_lesson_access"("p_user_id" "uuid", "p_lesson_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."verify_lesson_access"("p_user_id" "uuid", "p_lesson_id" "uuid") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."backup_blogs" (
    "id" "uuid",
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone,
    "title" "text",
    "slug" "text",
    "content" "text",
    "excerpt" "text",
    "image_url" "text",
    "category" "text",
    "author" "text",
    "is_published" boolean,
    "meta_title" "text",
    "meta_description" "text",
    "keywords" "text"[],
    "likes" bigint,
    "views" bigint
);


ALTER TABLE "public"."backup_blogs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."backup_cohorts" (
    "id" "uuid",
    "title" "text",
    "description" "text",
    "month_name" "text",
    "price" integer,
    "razorpay_plan_id" "text",
    "status" "text",
    "telegram_chat_id" "text",
    "order_index" integer,
    "is_highlighted" boolean,
    "image_url" "text",
    "created_at" timestamp with time zone,
    "learning_outcomes" "text"[],
    "curriculum_highlights" "text"[],
    "original_price" integer,
    "success_message" "text",
    "pricing_type" "text"
);


ALTER TABLE "public"."backup_cohorts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."backup_events" (
    "id" "uuid",
    "created_at" timestamp with time zone,
    "title" "text",
    "date" "date",
    "time" time without time zone,
    "venue" "text",
    "city" "text",
    "description" "text",
    "booking_url" "text",
    "map_url" "text",
    "is_published" boolean,
    "category" "text",
    "image_url" "text"
);


ALTER TABLE "public"."backup_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."backup_form_configs" (
    "id" "uuid",
    "form_slug" "text",
    "title" "text",
    "description" "text",
    "fields" "jsonb",
    "is_active" boolean,
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone,
    "email_notifications_enabled" boolean,
    "auto_reply_subject" "text",
    "auto_reply_message" "text",
    "success_message" "text",
    "requires_payment" boolean,
    "razorpay_plan_id" "text",
    "payment_type" character varying(50),
    "razorpay_amount" integer,
    "telegram_chat_id" "text"
);


ALTER TABLE "public"."backup_form_configs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."backup_form_submissions" (
    "id" "uuid",
    "created_at" timestamp with time zone,
    "form_slug" "text",
    "form_data" "jsonb",
    "user_name" "text",
    "user_email" "text",
    "status" "text",
    "is_verified" boolean,
    "payment_status" "text",
    "razorpay_subscription_id" "text",
    "razorpay_customer_id" "text",
    "razorpay_order_id" "text",
    "razorpay_payment_id" "text",
    "cohort_id" "uuid",
    "razorpay_payment_link_id" "text",
    "telegram_invite_link" "text",
    "telegram_joined" boolean,
    "telegram_username" "text",
    "razorpay_amount" integer
);


ALTER TABLE "public"."backup_form_submissions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."backup_leads" (
    "id" "uuid",
    "name" "text",
    "email" "text",
    "phone" "text",
    "inquiry_type" "text",
    "message" "text",
    "status" "text",
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone,
    "form_slug" "text",
    "form_data" "jsonb",
    "cohort_id" "uuid",
    "is_verified" boolean
);


ALTER TABLE "public"."backup_leads" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."backup_profiles" (
    "id" "uuid",
    "role" "public"."user_role",
    "full_name" "text",
    "updated_at" timestamp with time zone,
    "last_leads_viewed_at" timestamp with time zone
);


ALTER TABLE "public"."backup_profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."backup_reenrollment_logs" (
    "id" "uuid",
    "source_cohort_id" "uuid",
    "target_cohort_id" "uuid",
    "student_name" "text",
    "student_email" "text",
    "student_phone" "text",
    "payment_link_id" "text",
    "payment_link_url" "text",
    "status" "text",
    "error_message" "text",
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone
);


ALTER TABLE "public"."backup_reenrollment_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."backup_site_config" (
    "id" "uuid",
    "data" "jsonb",
    "updated_at" timestamp with time zone,
    "updated_by" "uuid"
);


ALTER TABLE "public"."backup_site_config" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."backup_smart_links" (
    "id" "uuid",
    "slug" "text",
    "target_url" "text",
    "platform" "text",
    "clicks" integer,
    "created_at" timestamp with time zone,
    "title" "text",
    "show_in_bio" boolean,
    "order_index" integer
);


ALTER TABLE "public"."backup_smart_links" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."backup_telegram_invite_logs" (
    "id" "uuid",
    "submission_id" "uuid",
    "action" "text",
    "invite_link" "text",
    "telegram_username" "text",
    "created_by" "text",
    "payload" "jsonb",
    "created_at" timestamp with time zone
);


ALTER TABLE "public"."backup_telegram_invite_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."backup_videos" (
    "id" "uuid",
    "title" "text",
    "url" "text",
    "thumbnail_url" "text",
    "category_id" "text",
    "subcategory_id" "text",
    "is_featured" boolean,
    "order_index" integer,
    "created_at" timestamp with time zone
);


ALTER TABLE "public"."backup_videos" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."backup_webhook_logs" (
    "id" "uuid",
    "event_id" "text",
    "event_type" "text",
    "payload" "jsonb",
    "status" "text",
    "error_message" "text",
    "notification_status" "jsonb",
    "student_email" "text",
    "student_name" "text",
    "created_at" timestamp with time zone
);


ALTER TABLE "public"."backup_webhook_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."blogs" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "title" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "content" "text" NOT NULL,
    "excerpt" "text",
    "image_url" "text",
    "category" "text" DEFAULT 'Music'::"text",
    "author" "text" DEFAULT 'Aishwarya Manikarnike'::"text",
    "is_published" boolean DEFAULT false,
    "meta_title" "text",
    "meta_description" "text",
    "keywords" "text"[] DEFAULT '{}'::"text"[],
    "likes" bigint DEFAULT 0,
    "views" bigint DEFAULT 0
);


ALTER TABLE "public"."blogs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."cohorts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "month_name" "text" NOT NULL,
    "price" integer NOT NULL,
    "razorpay_plan_id" "text",
    "status" "text" DEFAULT 'coming_soon'::"text",
    "telegram_chat_id" "text",
    "order_index" integer DEFAULT 0,
    "is_highlighted" boolean DEFAULT false,
    "image_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "learning_outcomes" "text"[] DEFAULT '{}'::"text"[],
    "curriculum_highlights" "text"[] DEFAULT '{}'::"text"[],
    "original_price" integer,
    "success_message" "text",
    "pricing_type" "text" DEFAULT 'fixed'::"text",
    "course_id" "uuid",
    CONSTRAINT "cohorts_pricing_type_check" CHECK (("pricing_type" = ANY (ARRAY['fixed'::"text", 'pay_as_you_wish'::"text"])))
);


ALTER TABLE "public"."cohorts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."course_lessons" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "course_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "video_url" "text",
    "video_duration" integer,
    "is_free_preview" boolean DEFAULT false,
    "order_index" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."course_lessons" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."courses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "image_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."courses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."enrollments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "student_id" "uuid" NOT NULL,
    "cohort_id" "uuid" NOT NULL,
    "status" "text" DEFAULT 'active'::"text",
    "telegram_joined" boolean DEFAULT false,
    "telegram_username" "text",
    "telegram_invite_link" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "telegram_display_name" "text",
    CONSTRAINT "enrollments_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'completed'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."enrollments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "title" "text" NOT NULL,
    "date" "date" NOT NULL,
    "time" time without time zone,
    "venue" "text" NOT NULL,
    "city" "text" NOT NULL,
    "description" "text",
    "booking_url" "text",
    "map_url" "text",
    "is_published" boolean DEFAULT true,
    "category" "text" DEFAULT 'Performance'::"text",
    "image_url" "text"
);


ALTER TABLE "public"."events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."form_configs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "form_slug" "text" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "fields" "jsonb" NOT NULL,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "email_notifications_enabled" boolean DEFAULT true,
    "auto_reply_subject" "text",
    "auto_reply_message" "text",
    "success_message" "text",
    "requires_payment" boolean DEFAULT false,
    "razorpay_plan_id" "text",
    "payment_type" character varying(50) DEFAULT 'subscription'::character varying,
    "razorpay_amount" integer,
    "telegram_chat_id" "text"
);


ALTER TABLE "public"."form_configs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."form_submissions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "form_slug" "text" NOT NULL,
    "form_data" "jsonb" NOT NULL,
    "user_name" "text",
    "user_email" "text",
    "status" "text" DEFAULT 'unread'::"text",
    "is_verified" boolean DEFAULT false,
    "payment_status" "text" DEFAULT 'none'::"text",
    "razorpay_subscription_id" "text",
    "razorpay_customer_id" "text",
    "razorpay_order_id" "text",
    "razorpay_payment_id" "text",
    "cohort_id" "uuid",
    "razorpay_payment_link_id" "text",
    "telegram_invite_link" "text",
    "telegram_joined" boolean DEFAULT false,
    "telegram_username" "text",
    "razorpay_amount" integer,
    "telegram_display_name" "text"
);


ALTER TABLE "public"."form_submissions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."leads" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text",
    "email" "text",
    "phone" "text",
    "inquiry_type" "text",
    "message" "text",
    "status" "text" DEFAULT 'new'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "form_slug" "text",
    "form_data" "jsonb" DEFAULT '{}'::"jsonb",
    "cohort_id" "uuid",
    "is_verified" boolean DEFAULT false,
    CONSTRAINT "leads_status_check" CHECK (("status" = ANY (ARRAY['new'::"text", 'contacted'::"text", 'converted'::"text", 'archived'::"text"])))
);


ALTER TABLE "public"."leads" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."offline_classes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "fees_monthly" integer NOT NULL,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."offline_classes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."offline_enrollments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "student_id" "uuid" NOT NULL,
    "offline_class_id" "uuid" NOT NULL,
    "status" "text" DEFAULT 'active'::"text",
    "joined_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "remarks" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "offline_enrollments_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'paused'::"text", 'completed'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."offline_enrollments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "student_id" "uuid",
    "enrollment_id" "uuid",
    "razorpay_order_id" "text",
    "razorpay_payment_id" "text",
    "razorpay_payment_link_id" "text",
    "razorpay_subscription_id" "text",
    "razorpay_customer_id" "text",
    "amount" integer,
    "status" "text" DEFAULT 'pending'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "payments_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'paid'::"text", 'failed'::"text", 'refunded'::"text"])))
);


ALTER TABLE "public"."payments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "role" "public"."user_role" DEFAULT 'viewer'::"public"."user_role" NOT NULL,
    "full_name" "text",
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "last_leads_viewed_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."reenrollment_invitations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "student_id" "uuid" NOT NULL,
    "source_cohort_id" "uuid",
    "target_cohort_id" "uuid" NOT NULL,
    "payment_link_id" "text",
    "payment_link_url" "text",
    "status" "text" DEFAULT 'pending'::"text",
    "error_message" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "reenrollment_invitations_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'sent'::"text", 'failed'::"text", 'paid'::"text"])))
);


ALTER TABLE "public"."reenrollment_invitations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."reenrollment_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "source_cohort_id" "uuid",
    "target_cohort_id" "uuid",
    "student_name" "text" NOT NULL,
    "student_email" "text" NOT NULL,
    "student_phone" "text",
    "payment_link_id" "text",
    "payment_link_url" "text",
    "status" "text" DEFAULT 'pending'::"text",
    "error_message" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."reenrollment_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."site_config" (
    "id" "uuid" DEFAULT '00000000-0000-0000-0000-000000000000'::"uuid" NOT NULL,
    "data" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "updated_by" "uuid"
);


ALTER TABLE "public"."site_config" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."smart_links" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "slug" "text" NOT NULL,
    "target_url" "text" NOT NULL,
    "platform" "text" NOT NULL,
    "clicks" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "title" "text",
    "show_in_bio" boolean DEFAULT false,
    "order_index" integer DEFAULT 0
);


ALTER TABLE "public"."smart_links" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."students" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "auth_user_id" "uuid",
    "name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "phone" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."students" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."student_search_view" WITH ("security_invoker"='on') AS
 SELECT "e"."id",
    "s"."id" AS "student_id",
    "s"."name",
    "s"."email",
    COALESCE("s"."phone", ''::"text") AS "phone",
    "c"."title" AS "cohort_title",
    'enrollment'::"text" AS "type",
        CASE
            WHEN ("e"."status" = 'active'::"text") THEN 'paid'::"text"
            ELSE 'pending'::"text"
        END AS "status",
    "e"."created_at",
    "e"."telegram_invite_link" AS "payment_link_url",
    "e"."telegram_joined",
    "e"."telegram_username",
    "e"."telegram_display_name",
    ( SELECT "p"."amount"
           FROM "public"."payments" "p"
          WHERE (("p"."enrollment_id" = "e"."id") AND ("p"."status" = 'paid'::"text"))
         LIMIT 1) AS "amount"
   FROM (("public"."enrollments" "e"
     JOIN "public"."students" "s" ON (("e"."student_id" = "s"."id")))
     JOIN "public"."cohorts" "c" ON (("e"."cohort_id" = "c"."id")))
UNION ALL
 SELECT "ri"."id",
    "s"."id" AS "student_id",
    "s"."name",
    "s"."email",
    COALESCE("s"."phone", ''::"text") AS "phone",
    "c"."title" AS "cohort_title",
    'invitation'::"text" AS "type",
    "ri"."status",
    "ri"."created_at",
    "ri"."payment_link_url",
    false AS "telegram_joined",
    NULL::"text" AS "telegram_username",
    NULL::"text" AS "telegram_display_name",
    NULL::integer AS "amount"
   FROM (("public"."reenrollment_invitations" "ri"
     JOIN "public"."students" "s" ON (("ri"."student_id" = "s"."id")))
     JOIN "public"."cohorts" "c" ON (("ri"."target_cohort_id" = "c"."id")));


ALTER VIEW "public"."student_search_view" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."telegram_invite_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "submission_id" "uuid" NOT NULL,
    "action" "text" NOT NULL,
    "invite_link" "text",
    "telegram_username" "text",
    "created_by" "text" DEFAULT 'system'::"text",
    "payload" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "enrollment_id" "uuid"
);


ALTER TABLE "public"."telegram_invite_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."videos" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "url" "text" NOT NULL,
    "thumbnail_url" "text",
    "category_id" "text" DEFAULT 'general'::"text",
    "subcategory_id" "text",
    "is_featured" boolean DEFAULT false,
    "order_index" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."videos" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."webhook_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "text",
    "event_type" "text" NOT NULL,
    "payload" "jsonb",
    "status" "text" DEFAULT 'success'::"text",
    "error_message" "text",
    "notification_status" "jsonb" DEFAULT '{"email": {"status": "pending"}, "telegram": {"status": "pending"}, "whatsapp": {"status": "pending"}}'::"jsonb",
    "student_email" "text",
    "student_name" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."webhook_logs" OWNER TO "postgres";


ALTER TABLE ONLY "public"."blogs"
    ADD CONSTRAINT "blogs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."blogs"
    ADD CONSTRAINT "blogs_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."cohorts"
    ADD CONSTRAINT "cohorts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."course_lessons"
    ADD CONSTRAINT "course_lessons_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."courses"
    ADD CONSTRAINT "courses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."enrollments"
    ADD CONSTRAINT "enrollments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."enrollments"
    ADD CONSTRAINT "enrollments_student_id_cohort_id_key" UNIQUE ("student_id", "cohort_id");



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."form_configs"
    ADD CONSTRAINT "form_configs_form_slug_key" UNIQUE ("form_slug");



ALTER TABLE ONLY "public"."form_configs"
    ADD CONSTRAINT "form_configs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."form_submissions"
    ADD CONSTRAINT "form_submissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."leads"
    ADD CONSTRAINT "leads_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."offline_classes"
    ADD CONSTRAINT "offline_classes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."offline_enrollments"
    ADD CONSTRAINT "offline_enrollments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."offline_enrollments"
    ADD CONSTRAINT "offline_enrollments_student_id_offline_class_id_key" UNIQUE ("student_id", "offline_class_id");



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_razorpay_order_id_key" UNIQUE ("razorpay_order_id");



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_razorpay_payment_id_key" UNIQUE ("razorpay_payment_id");



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_razorpay_payment_link_id_key" UNIQUE ("razorpay_payment_link_id");



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_razorpay_subscription_id_key" UNIQUE ("razorpay_subscription_id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."reenrollment_invitations"
    ADD CONSTRAINT "reenrollment_invitations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."reenrollment_logs"
    ADD CONSTRAINT "reenrollment_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."reenrollment_logs"
    ADD CONSTRAINT "reenrollment_logs_target_cohort_email_key" UNIQUE ("target_cohort_id", "student_email");



ALTER TABLE ONLY "public"."site_config"
    ADD CONSTRAINT "site_config_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."smart_links"
    ADD CONSTRAINT "smart_links_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."smart_links"
    ADD CONSTRAINT "smart_links_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."students"
    ADD CONSTRAINT "students_auth_user_id_key" UNIQUE ("auth_user_id");



ALTER TABLE ONLY "public"."students"
    ADD CONSTRAINT "students_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."students"
    ADD CONSTRAINT "students_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."telegram_invite_logs"
    ADD CONSTRAINT "telegram_invite_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."videos"
    ADD CONSTRAINT "videos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."webhook_logs"
    ADD CONSTRAINT "webhook_logs_pkey" PRIMARY KEY ("id");



CREATE UNIQUE INDEX "idx_courses_title_unique" ON "public"."courses" USING "btree" ("title");



CREATE INDEX "idx_enrollments_cohort_id" ON "public"."enrollments" USING "btree" ("cohort_id");



CREATE INDEX "idx_enrollments_student_id" ON "public"."enrollments" USING "btree" ("student_id");



CREATE INDEX "idx_form_submissions_cohort_id" ON "public"."form_submissions" USING "btree" ("cohort_id");



CREATE INDEX "idx_form_submissions_email" ON "public"."form_submissions" USING "btree" ("user_email");



CREATE INDEX "idx_form_submissions_payment_id" ON "public"."form_submissions" USING "btree" ("razorpay_payment_id");



CREATE INDEX "idx_leads_created_at" ON "public"."leads" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_leads_form_data" ON "public"."leads" USING "gin" ("form_data");



CREATE INDEX "idx_leads_form_slug" ON "public"."leads" USING "btree" ("form_slug");



CREATE INDEX "idx_leads_status" ON "public"."leads" USING "btree" ("status");



CREATE INDEX "idx_offline_enrollments_class_id" ON "public"."offline_enrollments" USING "btree" ("offline_class_id");



CREATE INDEX "idx_offline_enrollments_student_id" ON "public"."offline_enrollments" USING "btree" ("student_id");



CREATE INDEX "idx_payments_enrollment_id" ON "public"."payments" USING "btree" ("enrollment_id");



CREATE INDEX "idx_payments_order_id" ON "public"."payments" USING "btree" ("razorpay_order_id");



CREATE INDEX "idx_payments_payment_id" ON "public"."payments" USING "btree" ("razorpay_payment_id");



CREATE INDEX "idx_payments_student_id" ON "public"."payments" USING "btree" ("student_id");



CREATE INDEX "idx_reenrollment_email" ON "public"."reenrollment_logs" USING "btree" ("student_email");



CREATE INDEX "idx_reenrollment_invitations_student_id" ON "public"."reenrollment_invitations" USING "btree" ("student_id");



CREATE INDEX "idx_reenrollment_invitations_target" ON "public"."reenrollment_invitations" USING "btree" ("target_cohort_id");



CREATE INDEX "idx_reenrollment_target_cohort" ON "public"."reenrollment_logs" USING "btree" ("target_cohort_id");



CREATE INDEX "idx_students_auth_user_id" ON "public"."students" USING "btree" ("auth_user_id");



CREATE INDEX "idx_students_email" ON "public"."students" USING "btree" ("email");



CREATE INDEX "idx_telegram_invite_logs_enrollment_id" ON "public"."telegram_invite_logs" USING "btree" ("enrollment_id");



CREATE INDEX "idx_telegram_invite_logs_link" ON "public"."telegram_invite_logs" USING "btree" ("invite_link");



CREATE INDEX "idx_telegram_invite_logs_sub_id" ON "public"."telegram_invite_logs" USING "btree" ("submission_id");



CREATE INDEX "idx_webhook_logs_created_at" ON "public"."webhook_logs" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_webhook_logs_student_email" ON "public"."webhook_logs" USING "btree" ("student_email");



CREATE OR REPLACE TRIGGER "update_enrollments_updated_at" BEFORE UPDATE ON "public"."enrollments" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_leads_updated_at" BEFORE UPDATE ON "public"."leads" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_offline_enrollments_updated_at" BEFORE UPDATE ON "public"."offline_enrollments" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_payments_updated_at" BEFORE UPDATE ON "public"."payments" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_reenrollment_invitations_updated_at" BEFORE UPDATE ON "public"."reenrollment_invitations" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_students_updated_at" BEFORE UPDATE ON "public"."students" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."cohorts"
    ADD CONSTRAINT "cohorts_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id");



ALTER TABLE ONLY "public"."course_lessons"
    ADD CONSTRAINT "course_lessons_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."enrollments"
    ADD CONSTRAINT "enrollments_cohort_id_fkey" FOREIGN KEY ("cohort_id") REFERENCES "public"."cohorts"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."enrollments"
    ADD CONSTRAINT "enrollments_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."form_submissions"
    ADD CONSTRAINT "form_submissions_cohort_id_fkey" FOREIGN KEY ("cohort_id") REFERENCES "public"."cohorts"("id");



ALTER TABLE ONLY "public"."leads"
    ADD CONSTRAINT "leads_cohort_id_fkey" FOREIGN KEY ("cohort_id") REFERENCES "public"."cohorts"("id");



ALTER TABLE ONLY "public"."offline_enrollments"
    ADD CONSTRAINT "offline_enrollments_offline_class_id_fkey" FOREIGN KEY ("offline_class_id") REFERENCES "public"."offline_classes"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."offline_enrollments"
    ADD CONSTRAINT "offline_enrollments_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_enrollment_id_fkey" FOREIGN KEY ("enrollment_id") REFERENCES "public"."enrollments"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reenrollment_invitations"
    ADD CONSTRAINT "reenrollment_invitations_source_cohort_id_fkey" FOREIGN KEY ("source_cohort_id") REFERENCES "public"."cohorts"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."reenrollment_invitations"
    ADD CONSTRAINT "reenrollment_invitations_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reenrollment_invitations"
    ADD CONSTRAINT "reenrollment_invitations_target_cohort_id_fkey" FOREIGN KEY ("target_cohort_id") REFERENCES "public"."cohorts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reenrollment_logs"
    ADD CONSTRAINT "reenrollment_logs_source_cohort_id_fkey" FOREIGN KEY ("source_cohort_id") REFERENCES "public"."cohorts"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."reenrollment_logs"
    ADD CONSTRAINT "reenrollment_logs_target_cohort_id_fkey" FOREIGN KEY ("target_cohort_id") REFERENCES "public"."cohorts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."site_config"
    ADD CONSTRAINT "site_config_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."students"
    ADD CONSTRAINT "students_auth_user_id_fkey" FOREIGN KEY ("auth_user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."telegram_invite_logs"
    ADD CONSTRAINT "telegram_invite_logs_enrollment_id_fkey" FOREIGN KEY ("enrollment_id") REFERENCES "public"."enrollments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."telegram_invite_logs"
    ADD CONSTRAINT "telegram_invite_logs_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "public"."form_submissions"("id") ON DELETE CASCADE;



CREATE POLICY "Admin can manage all blogs" ON "public"."blogs" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Admins can view responses" ON "public"."form_submissions" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND (("profiles"."role" = 'admin'::"public"."user_role") OR ("profiles"."role" = 'editor'::"public"."user_role"))))));



CREATE POLICY "Admins/Editors can do everything" ON "public"."events" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"public"."user_role", 'editor'::"public"."user_role"]))))));



CREATE POLICY "Admins/editors can manage all enrollments" ON "public"."enrollments" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND (("profiles"."role" = 'admin'::"public"."user_role") OR ("profiles"."role" = 'editor'::"public"."user_role"))))));



CREATE POLICY "Admins/editors can manage all payments" ON "public"."payments" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND (("profiles"."role" = 'admin'::"public"."user_role") OR ("profiles"."role" = 'editor'::"public"."user_role"))))));



CREATE POLICY "Admins/editors can manage all student profiles" ON "public"."students" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND (("profiles"."role" = 'admin'::"public"."user_role") OR ("profiles"."role" = 'editor'::"public"."user_role"))))));



CREATE POLICY "Admins/editors can manage courses" ON "public"."courses" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND (("profiles"."role" = 'admin'::"public"."user_role") OR ("profiles"."role" = 'editor'::"public"."user_role"))))));



CREATE POLICY "Admins/editors can manage invitations" ON "public"."reenrollment_invitations" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND (("profiles"."role" = 'admin'::"public"."user_role") OR ("profiles"."role" = 'editor'::"public"."user_role"))))));



CREATE POLICY "Admins/editors can manage lessons" ON "public"."course_lessons" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND (("profiles"."role" = 'admin'::"public"."user_role") OR ("profiles"."role" = 'editor'::"public"."user_role"))))));



CREATE POLICY "Admins/editors can manage offline classes" ON "public"."offline_classes" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND (("profiles"."role" = 'admin'::"public"."user_role") OR ("profiles"."role" = 'editor'::"public"."user_role"))))));



CREATE POLICY "Admins/editors can manage offline enrollments" ON "public"."offline_enrollments" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND (("profiles"."role" = 'admin'::"public"."user_role") OR ("profiles"."role" = 'editor'::"public"."user_role"))))));



CREATE POLICY "Allow all inserts" ON "public"."leads" FOR INSERT WITH CHECK (true);



CREATE POLICY "Allow authenticated admins to manage site_config" ON "public"."site_config" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND (("profiles"."role" = 'admin'::"public"."user_role") OR ("profiles"."role" = 'editor'::"public"."user_role")))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND (("profiles"."role" = 'admin'::"public"."user_role") OR ("profiles"."role" = 'editor'::"public"."user_role"))))));



CREATE POLICY "Allow authenticated select" ON "public"."leads" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow authenticated update" ON "public"."leads" FOR UPDATE TO "authenticated" USING (true);



CREATE POLICY "Allow authenticated users to manage cohorts" ON "public"."cohorts" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Allow authenticated users to manage reenrollment_logs" ON "public"."reenrollment_logs" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Allow authenticated users to manage smart_links" ON "public"."smart_links" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Allow authenticated users to manage telegram_invite_logs" ON "public"."telegram_invite_logs" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Allow authenticated users to manage videos" ON "public"."videos" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Allow authenticated users to manage webhook logs" ON "public"."webhook_logs" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Allow public lead creation" ON "public"."leads" FOR INSERT WITH CHECK (true);



CREATE POLICY "Allow public read access" ON "public"."videos" FOR SELECT USING (true);



CREATE POLICY "Allow public read access on cohorts" ON "public"."cohorts" FOR SELECT USING (true);



CREATE POLICY "Allow public read access on site_config" ON "public"."site_config" FOR SELECT USING (true);



CREATE POLICY "Allow public read access on smart_links" ON "public"."smart_links" FOR SELECT USING (true);



CREATE POLICY "Allow public read access to active form configs" ON "public"."form_configs" FOR SELECT USING (("is_active" = true));



CREATE POLICY "Allow public read access to published courses" ON "public"."courses" FOR SELECT USING (true);



CREATE POLICY "Allow public read access to published events" ON "public"."events" FOR SELECT USING (("is_published" = true));



CREATE POLICY "Allow public submissions" ON "public"."form_submissions" FOR INSERT WITH CHECK (true);



CREATE POLICY "Allow select for verified lesson access" ON "public"."course_lessons" FOR SELECT TO "authenticated" USING ((("is_free_preview" = true) OR "public"."verify_lesson_access"("auth"."uid"(), "id")));



CREATE POLICY "Authenticated users can manage form configs" ON "public"."form_configs" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Public can view published blogs" ON "public"."blogs" FOR SELECT USING (("is_published" = true));



CREATE POLICY "Public profiles are viewable by everyone" ON "public"."profiles" FOR SELECT USING (true);



CREATE POLICY "Published events are viewable by everyone" ON "public"."events" FOR SELECT USING (("is_published" = true));



CREATE POLICY "Service role full access" ON "public"."form_submissions" USING (true);



CREATE POLICY "Students can read their own profile" ON "public"."students" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "auth_user_id"));



CREATE POLICY "Students can view offline classes they are enrolled in" ON "public"."offline_classes" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."offline_enrollments" "oe"
     JOIN "public"."students" "s" ON (("oe"."student_id" = "s"."id")))
  WHERE (("oe"."offline_class_id" = "offline_classes"."id") AND ("s"."auth_user_id" = "auth"."uid"())))));



CREATE POLICY "Students can view their own enrollments" ON "public"."enrollments" FOR SELECT TO "authenticated" USING (("student_id" IN ( SELECT "students"."id"
   FROM "public"."students"
  WHERE ("students"."auth_user_id" = "auth"."uid"()))));



CREATE POLICY "Students can view their own invitations" ON "public"."reenrollment_invitations" FOR SELECT TO "authenticated" USING (("student_id" IN ( SELECT "students"."id"
   FROM "public"."students"
  WHERE ("students"."auth_user_id" = "auth"."uid"()))));



CREATE POLICY "Students can view their own offline enrollments" ON "public"."offline_enrollments" FOR SELECT TO "authenticated" USING (("student_id" IN ( SELECT "students"."id"
   FROM "public"."students"
  WHERE ("students"."auth_user_id" = "auth"."uid"()))));



CREATE POLICY "Students can view their own payments" ON "public"."payments" FOR SELECT TO "authenticated" USING (("student_id" IN ( SELECT "students"."id"
   FROM "public"."students"
  WHERE ("students"."auth_user_id" = "auth"."uid"()))));



CREATE POLICY "Temp migration access" ON "public"."site_config" TO "anon" USING (true) WITH CHECK (true);



CREATE POLICY "Users can update own profile" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



ALTER TABLE "public"."blogs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."cohorts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."course_lessons" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."courses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."enrollments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."form_configs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."form_submissions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."leads" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."offline_classes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."offline_enrollments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."reenrollment_invitations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."reenrollment_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."site_config" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."smart_links" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."students" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."telegram_invite_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."videos" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."webhook_logs" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";






















































































































































GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_blog_likes"("blog_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."increment_blog_likes"("blog_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_blog_likes"("blog_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_blog_views"("blog_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."increment_blog_views"("blog_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_blog_views"("blog_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_click_count"("row_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."increment_click_count"("row_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_click_count"("row_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."verify_lesson_access"("p_user_id" "uuid", "p_lesson_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."verify_lesson_access"("p_user_id" "uuid", "p_lesson_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."verify_lesson_access"("p_user_id" "uuid", "p_lesson_id" "uuid") TO "service_role";


















GRANT ALL ON TABLE "public"."backup_blogs" TO "anon";
GRANT ALL ON TABLE "public"."backup_blogs" TO "authenticated";
GRANT ALL ON TABLE "public"."backup_blogs" TO "service_role";



GRANT ALL ON TABLE "public"."backup_cohorts" TO "anon";
GRANT ALL ON TABLE "public"."backup_cohorts" TO "authenticated";
GRANT ALL ON TABLE "public"."backup_cohorts" TO "service_role";



GRANT ALL ON TABLE "public"."backup_events" TO "anon";
GRANT ALL ON TABLE "public"."backup_events" TO "authenticated";
GRANT ALL ON TABLE "public"."backup_events" TO "service_role";



GRANT ALL ON TABLE "public"."backup_form_configs" TO "anon";
GRANT ALL ON TABLE "public"."backup_form_configs" TO "authenticated";
GRANT ALL ON TABLE "public"."backup_form_configs" TO "service_role";



GRANT ALL ON TABLE "public"."backup_form_submissions" TO "anon";
GRANT ALL ON TABLE "public"."backup_form_submissions" TO "authenticated";
GRANT ALL ON TABLE "public"."backup_form_submissions" TO "service_role";



GRANT ALL ON TABLE "public"."backup_leads" TO "anon";
GRANT ALL ON TABLE "public"."backup_leads" TO "authenticated";
GRANT ALL ON TABLE "public"."backup_leads" TO "service_role";



GRANT ALL ON TABLE "public"."backup_profiles" TO "anon";
GRANT ALL ON TABLE "public"."backup_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."backup_profiles" TO "service_role";



GRANT ALL ON TABLE "public"."backup_reenrollment_logs" TO "anon";
GRANT ALL ON TABLE "public"."backup_reenrollment_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."backup_reenrollment_logs" TO "service_role";



GRANT ALL ON TABLE "public"."backup_site_config" TO "anon";
GRANT ALL ON TABLE "public"."backup_site_config" TO "authenticated";
GRANT ALL ON TABLE "public"."backup_site_config" TO "service_role";



GRANT ALL ON TABLE "public"."backup_smart_links" TO "anon";
GRANT ALL ON TABLE "public"."backup_smart_links" TO "authenticated";
GRANT ALL ON TABLE "public"."backup_smart_links" TO "service_role";



GRANT ALL ON TABLE "public"."backup_telegram_invite_logs" TO "anon";
GRANT ALL ON TABLE "public"."backup_telegram_invite_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."backup_telegram_invite_logs" TO "service_role";



GRANT ALL ON TABLE "public"."backup_videos" TO "anon";
GRANT ALL ON TABLE "public"."backup_videos" TO "authenticated";
GRANT ALL ON TABLE "public"."backup_videos" TO "service_role";



GRANT ALL ON TABLE "public"."backup_webhook_logs" TO "anon";
GRANT ALL ON TABLE "public"."backup_webhook_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."backup_webhook_logs" TO "service_role";



GRANT ALL ON TABLE "public"."blogs" TO "anon";
GRANT ALL ON TABLE "public"."blogs" TO "authenticated";
GRANT ALL ON TABLE "public"."blogs" TO "service_role";



GRANT ALL ON TABLE "public"."cohorts" TO "anon";
GRANT ALL ON TABLE "public"."cohorts" TO "authenticated";
GRANT ALL ON TABLE "public"."cohorts" TO "service_role";



GRANT ALL ON TABLE "public"."course_lessons" TO "anon";
GRANT ALL ON TABLE "public"."course_lessons" TO "authenticated";
GRANT ALL ON TABLE "public"."course_lessons" TO "service_role";



GRANT ALL ON TABLE "public"."courses" TO "anon";
GRANT ALL ON TABLE "public"."courses" TO "authenticated";
GRANT ALL ON TABLE "public"."courses" TO "service_role";



GRANT ALL ON TABLE "public"."enrollments" TO "anon";
GRANT ALL ON TABLE "public"."enrollments" TO "authenticated";
GRANT ALL ON TABLE "public"."enrollments" TO "service_role";



GRANT ALL ON TABLE "public"."events" TO "anon";
GRANT ALL ON TABLE "public"."events" TO "authenticated";
GRANT ALL ON TABLE "public"."events" TO "service_role";



GRANT ALL ON TABLE "public"."form_configs" TO "anon";
GRANT ALL ON TABLE "public"."form_configs" TO "authenticated";
GRANT ALL ON TABLE "public"."form_configs" TO "service_role";



GRANT ALL ON TABLE "public"."form_submissions" TO "anon";
GRANT ALL ON TABLE "public"."form_submissions" TO "authenticated";
GRANT ALL ON TABLE "public"."form_submissions" TO "service_role";



GRANT ALL ON TABLE "public"."leads" TO "anon";
GRANT ALL ON TABLE "public"."leads" TO "authenticated";
GRANT ALL ON TABLE "public"."leads" TO "service_role";



GRANT ALL ON TABLE "public"."offline_classes" TO "anon";
GRANT ALL ON TABLE "public"."offline_classes" TO "authenticated";
GRANT ALL ON TABLE "public"."offline_classes" TO "service_role";



GRANT ALL ON TABLE "public"."offline_enrollments" TO "anon";
GRANT ALL ON TABLE "public"."offline_enrollments" TO "authenticated";
GRANT ALL ON TABLE "public"."offline_enrollments" TO "service_role";



GRANT ALL ON TABLE "public"."payments" TO "anon";
GRANT ALL ON TABLE "public"."payments" TO "authenticated";
GRANT ALL ON TABLE "public"."payments" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."reenrollment_invitations" TO "anon";
GRANT ALL ON TABLE "public"."reenrollment_invitations" TO "authenticated";
GRANT ALL ON TABLE "public"."reenrollment_invitations" TO "service_role";



GRANT ALL ON TABLE "public"."reenrollment_logs" TO "anon";
GRANT ALL ON TABLE "public"."reenrollment_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."reenrollment_logs" TO "service_role";



GRANT ALL ON TABLE "public"."site_config" TO "anon";
GRANT ALL ON TABLE "public"."site_config" TO "authenticated";
GRANT ALL ON TABLE "public"."site_config" TO "service_role";



GRANT ALL ON TABLE "public"."smart_links" TO "anon";
GRANT ALL ON TABLE "public"."smart_links" TO "authenticated";
GRANT ALL ON TABLE "public"."smart_links" TO "service_role";



GRANT ALL ON TABLE "public"."students" TO "anon";
GRANT ALL ON TABLE "public"."students" TO "authenticated";
GRANT ALL ON TABLE "public"."students" TO "service_role";



GRANT ALL ON TABLE "public"."student_search_view" TO "anon";
GRANT ALL ON TABLE "public"."student_search_view" TO "authenticated";
GRANT ALL ON TABLE "public"."student_search_view" TO "service_role";



GRANT ALL ON TABLE "public"."telegram_invite_logs" TO "anon";
GRANT ALL ON TABLE "public"."telegram_invite_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."telegram_invite_logs" TO "service_role";



GRANT ALL ON TABLE "public"."videos" TO "anon";
GRANT ALL ON TABLE "public"."videos" TO "authenticated";
GRANT ALL ON TABLE "public"."videos" TO "service_role";



GRANT ALL ON TABLE "public"."webhook_logs" TO "anon";
GRANT ALL ON TABLE "public"."webhook_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."webhook_logs" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































