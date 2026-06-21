import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Creates a Supabase client for use in Server Components and Layouts.
 * Reads the auth session from Next.js request cookies (set by createBrowserClient
 * in the browser), enabling server-side session verification without a network
 * round-trip to the Supabase auth server on every call.
 *
 * Usage: const supabase = await createSupabaseServerClient();
 *
 * IMPORTANT: Only use this in server-side code (layouts, server components, API routes).
 * Never import this in 'use client' files.
 */
export async function createSupabaseServerClient() {
    const cookieStore = await cookies();

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        );
                    } catch {
                        // setAll() is called from a Server Component where
                        // cookies cannot be mutated. Safe to ignore —
                        // session refresh is handled by the auth callback.
                    }
                },
            },
        }
    );
}
