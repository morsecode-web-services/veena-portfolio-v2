'use client';

import React, { useEffect, useState } from 'react';
import BlogPostRenderer from '@/components/blog/BlogPostRenderer';
import { Blog } from '@/types/blog';
import { Loader2 } from 'lucide-react';

export default function AdminPreviewPage() {
    const [blogData, setBlogData] = useState<Blog | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        try {
            const storedData = sessionStorage.getItem('blog_preview_data');
            if (storedData) {
                const parsed = JSON.parse(storedData);
                setBlogData(parsed as Blog);
            }
        } catch (error) {
            console.error('Failed to load preview data:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50">
                <Loader2 className="h-8 w-8 animate-spin text-navy-200" />
            </div>
        );
    }

    if (!blogData) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50 flex-col gap-4">
                <p className="text-gray-500 font-serif">No preview data found.</p>
                <div className="text-sm text-gray-400">Try closing this tab and clicking &ldquo;Preview&rdquo; again from the editor.</div>
            </div>
        );
    }

    return (
        <BlogPostRenderer blog={blogData} previewMode={true} />
    );
}
