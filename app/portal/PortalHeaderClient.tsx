'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface PortalHeaderClientProps {
    siteLive: string;
}

export default function PortalHeaderClient({ siteLive }: PortalHeaderClientProps) {
    const router = useRouter();
    const isLive = siteLive === 'true';

    return (
        <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <a 
                        href={!isLive ? undefined : "/portal"} 
                        className={`flex items-center gap-2 group ${!isLive ? 'pointer-events-none cursor-default opacity-80' : ''}`}
                    >
                        <div className="w-7 h-7 rounded-lg bg-navy-900 flex items-center justify-center">
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                <path d="M7 1L9.5 5.5H12L8.5 8.5L10 13L7 10.5L4 13L5.5 8.5L2 5.5H4.5L7 1Z" fill="white" />
                            </svg>
                        </div>
                        <span className="text-sm font-bold text-slate-900">Student Portal</span>
                    </a>
                </div>
                <button
                    onClick={async () => {
                        if (!isLive) return;
                        await supabase.auth.signOut();
                        router.replace('/portal/login');
                    }}
                    disabled={!isLive}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Sign Out
                </button>
            </div>
        </header>
    );
}
