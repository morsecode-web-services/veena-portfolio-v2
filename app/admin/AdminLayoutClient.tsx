'use client';

import React, { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
    LayoutDashboard,
    Calendar,
    LogOut,
    Home,
    Menu,
    X,
    FileText,
    Users,
    Settings,
    PenTool,
    Link as LinkIcon
} from 'lucide-react';
import { useState, useEffect } from 'react';

interface AdminLayoutClientProps {
    children: ReactNode;
}

export default function AdminLayoutClient({ children }: AdminLayoutClientProps) {
    const pathname = usePathname();
    const router = useRouter();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [checkingAuth, setCheckingAuth] = useState(true);

    const [leadsCount, setLeadsCount] = useState(0);

    useEffect(() => {
        async function checkAuth() {
            const isLoginPage = pathname === '/admin/login' || pathname === '/admin/login/';
            if (isLoginPage) {
                setCheckingAuth(false);
                return;
            }

            try {
                const { data: { session }, error: sessionError } = await supabase.auth.getSession();

                if (sessionError || !session) {
                    if (sessionError) console.error('Session error:', sessionError);
                    router.push('/admin/login');
                    return;
                }

                // Verify role and get leads notification data
                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('role, last_leads_viewed_at')
                    .eq('id', session.user.id)
                    .single();

                if (profileError || !profile || (profile.role !== 'admin' && profile.role !== 'editor')) {
                    if (profileError) console.error('Profile error:', profileError);
                    await supabase.auth.signOut();
                    router.push('/admin/login');
                    return;
                }

                // Check for new leads
                if (profile.last_leads_viewed_at) {
                    const { count, error: countError } = await supabase
                        .from('leads')
                        .select('*', { count: 'exact', head: true })
                        .gt('created_at', profile.last_leads_viewed_at);

                    if (!countError && count !== null) {
                        setLeadsCount(count);
                    }
                } else {
                    // If never viewed, show all new leads (or maybe just 0 to start cleanly)
                    // For now, let's treat null as "checked everything just now" to avoid noise, 
                    // or we could show total count. Let's show 0 to be less annoying initially.
                    setLeadsCount(0);
                }

                setCheckingAuth(false);
            } catch (err) {
                console.error('Unexpected auth check error:', err);
                // Clear poisoned session data
                await supabase.auth.signOut().catch(() => { });
                router.push('/admin/login');
            }
        }

        checkAuth();
    }, [pathname, router]);

    // Don't show layout on login page
    const isLoginPage = pathname?.includes('/admin/login');
    if (isLoginPage) {
        return <>{children}</>;
    }

    if (checkingAuth) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 text-navy-900 font-serif">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy-900"></div>
                    <p className="text-sm font-bold uppercase tracking-widest">Verifying Session...</p>
                </div>
            </div>
        );
    }

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/admin/login');
    };

    const navItems = [
        { name: 'Events', href: '/admin/events', icon: Calendar },
        { name: 'Blog', href: '/admin/blogs', icon: FileText },
        { name: 'Videos', href: '/admin/videos', icon: LayoutDashboard },
        { name: 'Forms', href: '/admin/forms', icon: LayoutDashboard }, // Using LayoutDashboard for now
        { name: 'Smart Links', href: '/admin/smart-links', icon: LinkIcon },
        { name: 'Leads', href: '/admin/leads', icon: Users, badge: leadsCount },
        { name: 'Architect', href: '/admin/config', icon: PenTool },
        { name: 'Public Site', href: '/', icon: Home },
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-20 lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-navy-950 text-white transform transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:inset-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
                <div className="h-full flex flex-col">
                    <div className="p-6">
                        <h1 className="text-xl font-serif font-bold text-gold-400">Admin Portal</h1>
                        <p className="text-xs text-navy-300 mt-1 uppercase tracking-widest">Aishwarya Manikarnike</p>
                    </div>

                    <nav className="flex-1 px-4 space-y-2">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = pathname === item.href;
                            // @ts-ignore - Adding dynamic badge property
                            const badgeCount = item.badge ?? 0;

                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg transition-colors relative
                    ${isActive
                                            ? 'bg-navy-800 text-gold-400 border-l-4 border-gold-400'
                                            : 'text-navy-100 hover:bg-navy-900 hover:text-white'}
                  `}
                                    onClick={() => setIsSidebarOpen(false)}
                                >
                                    <Icon className="h-5 w-5" />
                                    <span className="font-medium text-sm">{item.name}</span>
                                    {badgeCount > 0 && (
                                        <span className="absolute right-3 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                                            {badgeCount}
                                        </span>
                                    )}
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="p-4 mt-auto">
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 w-full px-4 py-3 text-navy-200 hover:text-white hover:bg-navy-900 rounded-lg transition-colors"
                        >
                            <LogOut className="h-5 w-5" />
                            <span className="font-medium text-sm">Logout</span>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Top Header (Mobile only) */}
                <header className="bg-white border-b border-gray-200 p-4 lg:hidden flex items-center justify-between">
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="text-navy-900 p-1"
                    >
                        <Menu className="h-6 w-6" />
                    </button>
                    <span className="font-serif font-bold text-navy-900">Admin Portal</span>
                    <div className="w-6" /> {/* Placeholder for symmetry */}
                </header>

                <main className="flex-1 overflow-y-auto p-4 md:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
