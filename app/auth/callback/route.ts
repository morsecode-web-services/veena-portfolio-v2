import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-ssr';

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');
    const next = searchParams.get('next') || '/portal';

    if (code) {
        const supabase = await createSupabaseServerClient();
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        
        if (!error) {
            return NextResponse.redirect(`${origin}${next}`);
        } else {
            console.error('[Auth Callback] Code exchange failed:', error);
            return NextResponse.redirect(
                `${origin}/portal/login?error=auth_failed&msg=${encodeURIComponent(error.message)}`
            );
        }
    }

    // No code present
    return NextResponse.redirect(
        `${origin}/portal/login?error=auth_failed&msg=No+authentication+code+present+in+callback`
    );
}
