import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error('Supabase Admin credentials missing. Check your environment variables.');
}

/**
 * Supabase client with Service Role Key
 * Use this ONLY in server-side routes (API routes, Webhooks)
 * to bypass RLS and perform administrative tasks.
 */
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);
