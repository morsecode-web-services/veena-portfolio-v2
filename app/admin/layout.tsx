import { Metadata } from 'next';
import { ReactNode } from 'react';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase-ssr';
import AdminLayoutClient from './AdminLayoutClient';

export const metadata: Metadata = {
    robots: {
        index: false,
        follow: false,
        nocache: true,
    },
    title: 'Admin Panel',
};

interface AdminLayoutProps {
    children: ReactNode;
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
    const headersList = await headers();
    const pathname = headersList.get('x-pathname') || '';

    // Check if the current route is the login page (including with trailing slashes)
    const isLoginPage = pathname === '/admin/login' || pathname === '/admin/login/';

    if (isLoginPage) {
        return <AdminLayoutClient profile={null}>{children}</AdminLayoutClient>;
    }

    // Server-side auth gate
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        redirect('/admin/login');
    }

    // Verify user role
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, last_leads_viewed_at')
        .eq('id', user.id)
        .single();

    if (profileError || !profile || (profile.role !== 'admin' && profile.role !== 'editor')) {
        // If not authorized, redirect to login. We don't sign out here as cookie mutation isn't allowed in layout render.
        redirect('/admin/login');
    }

    return <AdminLayoutClient profile={profile}>{children}</AdminLayoutClient>;
}
