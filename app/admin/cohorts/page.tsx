'use client';

import React from 'react';
import { CohortManager } from '@/components/admin/CohortManager';
import { Users } from 'lucide-react';

export default function CohortsAdminPage() {
    return (
        <div className="space-y-6">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-navy-900">Cohort Management</h1>
                    <p className="text-gray-500 mt-1 uppercase tracking-widest text-[10px] font-black">
                        Manage monthly cohorts, pricing, and enrollments
                    </p>
                </div>
            </header>

            <CohortManager />
        </div>
    );
}
