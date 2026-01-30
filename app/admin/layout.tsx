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
    X
} from 'lucide-react';
import { useState, useEffect } from 'react';

interface AdminLayoutProps {
    children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
    const pathname = usePathname();
    const router = useRouter();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [checkingAuth, setCheckingAuth] = useState(true);

    useEffect(() => {
        async function checkAuth() {
            const isLoginPage = pathname === '/admin/login' || pathname === '/admin/login/';
            if (isLoginPage) {
                setCheckingAuth(false);
                return;
            }

            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                router.push('/admin/login');
                return;
            }

            // Verify role
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', session.user.id)
                .single();

            if (!profile || (profile.role !== 'admin' && profile.role !== 'editor')) {
                await supabase.auth.signOut();
                router.push('/admin/login');
                return;
            }

            setCheckingAuth(false);
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
        { name: 'Dashboard', href: '/admin/events', icon: LayoutDashboard },
        { name: 'Schedule', href: '/admin/events', icon: Calendar },
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
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                    ${isActive
                                            ? 'bg-navy-800 text-gold-400 border-l-4 border-gold-400'
                                            : 'text-navy-100 hover:bg-navy-900 hover:text-white'}
                  `}
                                    onClick={() => setIsSidebarOpen(false)}
                                >
                                    <Icon className="h-5 w-5" />
                                    <span className="font-medium text-sm">{item.name}</span>
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
