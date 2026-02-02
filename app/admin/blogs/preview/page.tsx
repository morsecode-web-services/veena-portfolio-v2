'use client';

import React, { useEffect, useState } from 'react';
import { Blog } from '@/types/blog';
import BlogPostRenderer from '@/components/blog/BlogPostRenderer';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function BlogPreviewPage() {
    const [blog, setBlog] = useState<Blog | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const storedData = sessionStorage.getItem('blog_preview_data');
        if (!storedData) {
            router.push('/admin/blogs');
            return;
        }

        try {
            const parsedData = JSON.parse(storedData) as Blog;
            // Ensure dates are stringified correctly or mock them if missing
            const previewBlog: Blog = {
                ...parsedData,
                created_at: parsedData.created_at || new Date().toISOString(),
                updated_at: parsedData.updated_at || new Date().toISOString(),
                // Mock other required fields if they are missing from the form data
                id: parsedData.id || 'preview-id',
                author: parsedData.author || 'Author Name',
                is_published: parsedData.is_published ?? false,
                meta_title: parsedData.meta_title || parsedData.title,
                meta_description: parsedData.meta_description || parsedData.excerpt,
                keywords: parsedData.keywords || [],
            };
            setBlog(previewBlog);
        } catch (error) {
            console.error('Failed to parse preview data:', error);
            router.push('/admin/blogs');
        } finally {
            setLoading(false);
        }
    }, [router]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 text-navy-400 animate-spin" />
                    <p className="text-navy-900 font-medium">Loading Preview...</p>
                </div>
            </div>
        );
    }

    if (!blog) return null;

    return (
        <div>
            <div className="fixed top-0 left-0 right-0 z-50 bg-navy-900 text-white px-4 py-2 flex justify-between items-center shadow-md">
                <span className="font-bold text-sm tracking-widest uppercase">Preview Mode</span>
                <button
                    onClick={() => window.close()}
                    className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1 rounded transition-colors"
                >
                    Close Preview
                </button>
            </div>
            <div className="pt-10">
                <BlogPostRenderer blog={blog} previewMode={true} />
            </div>
        </div>
    );
}
