-- Add last_leads_viewed_at column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS last_leads_viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create a function to safely update the timestamp if needed (optional, but good for RPC calls)
-- For now, we will just update it directly via the client as the admin has permissions.
