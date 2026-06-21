import React from 'react';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase-ssr';
import PortalHeaderClient from './PortalHeaderClient';

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
    const headersList = await headers();
    const pathname = headersList.get('x-pathname') || '';

    const isLoginPage = pathname === '/portal/login' || pathname === '/portal/login/';

    if (isLoginPage) {
        return <>{children}</>;
    }

    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        redirect('/portal/login');
    }

    const siteLive = process.env.NEXT_PUBLIC_SITE_LIVE || 'true';

    return (
        <div className="min-h-screen bg-slate-50">
            <PortalHeaderClient siteLive={siteLive} />
            <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
                {children}
            </main>
        </div>
    );
}
