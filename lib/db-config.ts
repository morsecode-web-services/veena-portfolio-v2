import { createClient } from '@supabase/supabase-js';
import { SiteConfig } from '@/types';
import { validateConfig } from './config';
import { unstable_cache } from 'next/cache';

// Use the standard supabase client for general operations
// If on the server, we might use the service role key for bypassing RLS if needed,
// but usually public SELECT is enough for loading the site.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const CONFIG_ID = '00000000-0000-0000-0000-000000000000';

/**
 * Fetches the site configuration from the Supabase site_config table.
 * Cached using Next.js unstable_cache.
 */
export const getDbConfig = unstable_cache(
  async (): Promise<SiteConfig | null> => {
    try {
      const { data, error } = await supabase
        .from('site_config')
        .select('data')
        .eq('id', CONFIG_ID)
        .single();

      if (error || !data) {
        console.error('[db-config] Error fetching configuration:', error);
        return null;
      }

      const validation = validateConfig(data.data);
      if (!validation.success) {
        console.error('[db-config] Configuration validation failed:', validation.error);
        return null;
      }

      return validation.data;
    } catch (err) {
      console.error('[db-config] Unexpected error:', err);
      return null;
    }
  },
  ['site-config'],
  {
    revalidate: 3600, // Cache for 1 hour
    tags: ['config'],
  }
);

/**
 * Saves the site configuration to the Supabase site_config table.
 * Requires an authenticated user with admin/editor role.
 */
export async function saveDbConfig(config: SiteConfig, token: string): Promise<boolean> {
  const adminSupabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  try {
    const { error } = await adminSupabase.from('site_config').upsert({
      id: CONFIG_ID,
      data: config,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      console.error('[db-config] Error saving configuration:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('[db-config] Unexpected error:', err);
    return false;
  }
}
