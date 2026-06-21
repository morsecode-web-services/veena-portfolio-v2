-- Add unique constraint to reenrollment_logs table for conflict specification
ALTER TABLE public.reenrollment_logs 
ADD CONSTRAINT reenrollment_logs_target_cohort_email_key UNIQUE (target_cohort_id, student_email);
