-- Migration: Add order_index column to hall_of_fame table for custom entry reordering
-- Date: 2026-08-31

ALTER TABLE public.hall_of_fame 
ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;

-- Create index for high performance ordered queries
CREATE INDEX IF NOT EXISTS idx_hall_of_fame_order_index ON public.hall_of_fame(order_index ASC, created_at DESC);
