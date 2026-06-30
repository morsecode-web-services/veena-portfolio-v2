-- Migration: Add WhatsApp and Email delivery tracking columns to reenrollment_invitations
-- Run this in Supabase SQL Editor

-- 1. Add WhatsApp tracking columns
ALTER TABLE public.reenrollment_invitations
  ADD COLUMN IF NOT EXISTS wa_message_sid TEXT,
  ADD COLUMN IF NOT EXISTS wa_delivery_status TEXT CHECK (wa_delivery_status IN ('pending', 'delivered', 'undelivered'));

-- 2. Add Email tracking columns
ALTER TABLE public.reenrollment_invitations
  ADD COLUMN IF NOT EXISTS email_message_id TEXT,
  ADD COLUMN IF NOT EXISTS email_delivery_status TEXT CHECK (email_delivery_status IN ('pending', 'delivered', 'bounced', 'complained'));

-- 3. Update the status CHECK constraint to allow 'wa_failed' and 'email_failed'
ALTER TABLE public.reenrollment_invitations
  DROP CONSTRAINT IF EXISTS reenrollment_invitations_status_check;

ALTER TABLE public.reenrollment_invitations
  ADD CONSTRAINT reenrollment_invitations_status_check
  CHECK (status IN ('pending', 'sent', 'failed', 'paid', 'wa_failed', 'email_failed'));

-- 4. Index for fast webhook lookup by WhatsApp message SID
CREATE INDEX IF NOT EXISTS idx_reenrollment_invitations_wa_sid
  ON public.reenrollment_invitations(wa_message_sid)
  WHERE wa_message_sid IS NOT NULL;

-- 5. Index for fast webhook lookup by Email message ID
CREATE INDEX IF NOT EXISTS idx_reenrollment_invitations_email_id
  ON public.reenrollment_invitations(email_message_id)
  WHERE email_message_id IS NOT NULL;
