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
    Link as LinkIcon,
    BarChart3
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion as m, AnimatePresence } from 'framer-motion';

interface AdminLayoutClientProps {
    children: ReactNode;
}

export default function AdminLayoutClient({ children }: AdminLayoutClientProps) {
    const pathname = usePathname();
    const router = useRouter();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [checkingAuth, setCheckingAuth] = useState(true);
    const [isCollapsed, setIsCollapsed] = useState(true);

    const [leadsCount, setLeadsCount] = useState(0);
    const [responsesCount, setResponsesCount] = useState(0);

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
                }

                // Check for unread form submissions
                const { count: unreadCount, error: unreadError } = await supabase
                    .from('form_submissions')
                    .select('*', { count: 'exact', head: true })
                    .eq('status', 'unread');

                if (!unreadError && unreadCount !== null) {
                    setResponsesCount(unreadCount);
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
        { name: 'Cohorts', href: '/admin/cohorts', icon: Users },
        { name: 'Events', href: '/admin/events', icon: Calendar },
        { name: 'Blog', href: '/admin/blogs', icon: FileText },
        { name: 'Videos', href: '/admin/videos', icon: LayoutDashboard },
        { name: 'Forms', href: '/admin/forms', icon: Settings },
        { name: 'Responses', href: '/admin/responses', icon: FileText, badge: responsesCount },
        { name: 'Smart Links', href: '/admin/smart-links', icon: LinkIcon },
        { name: 'Leads', href: '/admin/leads', icon: Users, badge: leadsCount },
        { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
        { name: 'Automations', href: '/admin/webhooks', icon: Settings },
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
            <aside 
                onMouseEnter={() => setIsCollapsed(false)}
                onMouseLeave={() => setIsCollapsed(true)}
                className={`
                    fixed inset-y-0 left-0 z-30 bg-navy-950 text-white transform transition-all duration-300 ease-in-out
                    lg:static lg:inset-0
                    ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                    ${isCollapsed ? 'lg:w-[72px]' : 'lg:w-64'}
                `}
            >
                <div className="h-full flex flex-col overflow-hidden">
                    <div className={`p-6 transition-all duration-300 ${isCollapsed ? 'px-4' : 'px-6'}`}>
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className="min-w-[40px] h-10 bg-gold-500/10 rounded-lg flex items-center justify-center border border-gold-500/20">
                                <PenTool className="h-5 w-5 text-gold-400" />
                            </div>
                            {!isCollapsed && (
                                <m.div 
                                    initial={{ opacity: 0 }} 
                                    animate={{ opacity: 1 }} 
                                    className="whitespace-nowrap"
                                >
                                    <h1 className="text-xl font-serif font-bold text-gold-400">Admin</h1>
                                    <p className="text-[10px] text-navy-300 uppercase tracking-[0.2em]">Portfolio CMS</p>
                                </m.div>
                            )}
                        </div>
                    </div>

                    <nav className="flex-1 px-3 space-y-1">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = pathname === item.href;
                            const badgeCount = item.badge ?? 0;

                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    title={isCollapsed ? item.name : ''}
                                    className={`
                                        flex items-center gap-4 px-3 py-3 rounded-xl transition-all relative group
                                        ${isActive
                                            ? 'bg-gold-500/10 text-gold-400 shadow-[inset_0_0_20px_rgba(234,179,8,0.05)]'
                                            : 'text-navy-300 hover:bg-white/5 hover:text-white'}
                                    `}
                                    onClick={() => setIsSidebarOpen(false)}
                                >
                                    <div className="min-w-[24px] flex justify-center">
                                        <Icon className={`h-5 w-5 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                                    </div>
                                    
                                    {!isCollapsed && (
                                        <m.span 
                                            initial={{ opacity: 0, x: -10 }} 
                                            animate={{ opacity: 1, x: 0 }}
                                            className="font-medium text-sm whitespace-nowrap"
                                        >
                                            {item.name}
                                        </m.span>
                                    )}

                                    {badgeCount > 0 && (
                                        <span className={`
                                            absolute bg-red-500 text-white text-[10px] font-bold rounded-full text-center
                                            ${isCollapsed 
                                                ? 'top-2 right-2 w-4 h-4 flex items-center justify-center' 
                                                : 'right-3 px-1.5 py-0.5 min-w-[18px]'}
                                        `}>
                                            {badgeCount}
                                        </span>
                                    )}

                                    {isActive && !isCollapsed && (
                                        <m.div 
                                            layoutId="active-indicator" 
                                            className="absolute left-0 w-1 h-6 bg-gold-400 rounded-r-full" 
                                        />
                                    )}
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="p-3 mt-auto border-t border-white/5">
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-4 w-full px-3 py-3 text-navy-400 hover:text-red-400 hover:bg-red-500/5 rounded-xl transition-all group"
                        >
                            <div className="min-w-[24px] flex justify-center">
                                <LogOut className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
                            </div>
                            {!isCollapsed && <span className="font-medium text-sm">Logout</span>}
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
