'use client';

import React from 'react';
import { VideoManager } from '@/components/admin/VideoManager';

export default function VideosAdminPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Video Management</h1>
          <p className="text-slate-500 text-xs mt-0.5">Manage performances and video content.</p>
        </div>
      </div>

      <VideoManager />
    </div>
  );
}
