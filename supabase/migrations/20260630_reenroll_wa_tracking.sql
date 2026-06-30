-- Migration: Add WhatsApp delivery tracking columns to reenrollment_invitations
-- Run this in Supabase SQL Editor

-- 1. Add wa_message_sid column to store Twilio message SID for webhook lookup
ALTER TABLE public.reenrollment_invitations
  ADD COLUMN IF NOT EXISTS wa_message_sid TEXT,
  ADD COLUMN IF NOT EXISTS wa_delivery_status TEXT CHECK (wa_delivery_status IN ('pending', 'delivered', 'undelivered'));

-- 2. Update the status CHECK constraint to allow 'wa_failed'
-- (Drop the old constraint and add a new one)
ALTER TABLE public.reenrollment_invitations
  DROP CONSTRAINT IF EXISTS reenrollment_invitations_status_check;

ALTER TABLE public.reenrollment_invitations
  ADD CONSTRAINT reenrollment_invitations_status_check
  CHECK (status IN ('pending', 'sent', 'failed', 'paid', 'wa_failed'));

-- 3. Index for fast webhook lookup by message SID
CREATE INDEX IF NOT EXISTS idx_reenrollment_invitations_wa_sid
  ON public.reenrollment_invitations(wa_message_sid)
  WHERE wa_message_sid IS NOT NULL;
