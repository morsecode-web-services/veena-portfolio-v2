'use client';

import React from 'react';
import { ImageManager } from '@/components/admin/ImageManager';

export default function ImagesAdminPage() {
    return (
        <div className="space-y-6">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-navy-900">Gallery</h1>
                    <p className="text-gray-500 mt-1 uppercase tracking-widest text-[10px] font-black">
                        Manage performance gallery images
                    </p>
                </div>
            </header>

            <ImageManager />
        </div>
    );
}
