'use client';

import React from 'react';
import { VideoManager } from '@/components/admin/VideoManager';
import { Video } from 'lucide-react';

export default function VideosAdminPage() {
    return (
        <div className="space-y-6">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-navy-900">Management</h1>
                    <p className="text-gray-500 mt-1 uppercase tracking-widest text-[10px] font-black">
                        Manage performances and video content
                    </p>
                </div>
            </header>

            <VideoManager />
        </div>
    );
}
