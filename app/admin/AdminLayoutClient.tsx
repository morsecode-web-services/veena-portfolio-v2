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
    BarChart3,
    Search,
    BookOpen
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion as m, AnimatePresence } from 'framer-motion';

interface AdminLayoutClientProps {
    children: ReactNode;
    profile: {
        role: string;
        last_leads_viewed_at: string | null;
    } | null;
}

export default function AdminLayoutClient({ children, profile }: AdminLayoutClientProps) {
    const pathname = usePathname();
    const router = useRouter();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(true);

    const [leadsCount, setLeadsCount] = useState(0);
    const [responsesCount, setResponsesCount] = useState(0);

    useEffect(() => {
        if (!profile) return;

        async function fetchCounts(lastLeadsViewedAt: string | null) {
            try {
                // Check for new leads in form_submissions
                if (lastLeadsViewedAt) {
                    const { count, error: countError } = await supabase
                        .from('form_submissions')
                        .select('*', { count: 'exact', head: true })
                        .in('form_slug', ['classes', 'performance', 'collaboration'])
                        .gt('created_at', lastLeadsViewedAt);

                    if (!countError && count !== null) {
                        setLeadsCount(count);
                    }
                }

                // Check for unread general/non-lead form submissions
                const { count: unreadCount, error: unreadError } = await supabase
                    .from('form_submissions')
                    .select('*', { count: 'exact', head: true })
                    .eq('status', 'unread')
                    .not('form_slug', 'in', '("classes","performance","collaboration")');

                if (!unreadError && unreadCount !== null) {
                    setResponsesCount(unreadCount);
                }
            } catch (err) {
                console.error('Error fetching badge counts:', err);
            }
        }

        fetchCounts(profile.last_leads_viewed_at);
    }, [pathname, profile]);

    // Don't show layout on login page
    const isLoginPage = pathname?.includes('/admin/login');
    if (isLoginPage) {
        return <>{children}</>;
    }

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/admin/login');
    };

    const navItems = [
        { name: 'Cohorts', href: '/admin/cohorts', icon: Users },
        { name: 'Courses', href: '/admin/courses', icon: BookOpen },
        { name: 'Students', href: '/admin/students', icon: Search },
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
        <div className="min-h-screen bg-slate-50 flex">
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
                    fixed inset-y-0 left-0 z-30 bg-slate-900 text-slate-100 border-r border-slate-850 transform transition-all duration-300 ease-in-out
                    lg:static lg:inset-0
                    ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                    ${isCollapsed ? 'lg:w-[72px]' : 'lg:w-64'}
                `}
            >
                <div className="h-full flex flex-col overflow-hidden">
                    <div className={`p-6 transition-all duration-300 ${isCollapsed ? 'px-4' : 'px-6'}`}>
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className="min-w-[40px] h-10 bg-slate-800 rounded flex items-center justify-center border border-slate-700">
                                <PenTool className="h-5 w-5 text-slate-200" />
                            </div>
                            {!isCollapsed && (
                                <m.div 
                                    initial={{ opacity: 0 }} 
                                    animate={{ opacity: 1 }} 
                                    className="whitespace-nowrap"
                                >
                                    <h1 className="text-sm font-bold text-slate-200 tracking-wider">ADMIN</h1>
                                    <p className="text-[10px] text-slate-500 uppercase tracking-widest">Portfolio CMS</p>
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
                                        flex items-center gap-4 px-3 py-2 rounded transition-all relative group
                                        ${isActive
                                            ? 'bg-slate-850 text-white font-medium'
                                            : 'text-slate-400 hover:bg-slate-850 hover:text-white'}
                                    `}
                                    onClick={() => setIsSidebarOpen(false)}
                                >
                                    <div className="min-w-[24px] flex justify-center">
                                        <Icon className={`h-4 w-4 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                                    </div>
                                    
                                    {!isCollapsed && (
                                        <m.span 
                                            initial={{ opacity: 0, x: -10 }} 
                                            animate={{ opacity: 1, x: 0 }}
                                            className="font-medium text-xs whitespace-nowrap"
                                        >
                                            {item.name}
                                        </m.span>
                                    )}

                                    {badgeCount > 0 && (
                                        <span className={`
                                            absolute text-[9px] font-bold rounded text-center
                                            ${isCollapsed 
                                                ? 'top-2 right-2 w-4 h-4 bg-slate-800 text-slate-200 border border-slate-700 flex items-center justify-center' 
                                                : 'right-3 px-1.5 py-0.5 bg-slate-800 text-slate-350 border border-slate-700'}
                                        `}>
                                            {badgeCount}
                                        </span>
                                    )}

                                    {isActive && !isCollapsed && (
                                        <m.div 
                                            layoutId="active-indicator" 
                                            className="absolute left-0 w-1 h-6 bg-slate-400 rounded-r-full" 
                                        />
                                    )}
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="p-3 mt-auto border-t border-slate-800/50">
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-4 w-full px-3 py-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-all group"
                        >
                            <div className="min-w-[24px] flex justify-center">
                                <LogOut className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                            </div>
                            {!isCollapsed && <span className="font-medium text-xs">Logout</span>}
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Top Header (Mobile only) */}
                <header className="bg-white border-b border-slate-200 p-4 lg:hidden flex items-center justify-between">
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="text-slate-900 p-1"
                    >
                        <Menu className="h-6 w-6" />
                    </button>
                    <span className="font-sans font-bold text-slate-900">Admin Portal</span>
                    <div className="w-6" /> {/* Placeholder for symmetry */}
                </header>

                <main className="flex-1 overflow-y-auto p-4 md:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
