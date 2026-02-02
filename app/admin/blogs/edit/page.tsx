'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { BlogForm } from '@/components/admin/BlogForm';
import { Blog, NewBlog } from '@/types/blog';
import { Loader2 } from 'lucide-react';

import { getErrorMessage } from '@/utils/error-handling';
import { ToastContainer, useToast } from '@/components/ui/Toast';

function EditBlogContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const id = searchParams.get('id');
    const [blog, setBlog] = useState<Blog | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const { toasts, addToast, removeToast } = useToast();

    useEffect(() => {
        async function fetchBlog() {
            try {
                setLoading(true);
                const { data, error } = await supabase
                    .from('blogs')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (error) throw error;
                setBlog(data);
            } catch (error) {
                console.error('Error fetching blog:', error);
                // We typically don't show toast here as we redirect, but we could if we stay
                router.push('/admin/blogs');
            } finally {
                setLoading(false);
            }
        }

        if (id) fetchBlog();
    }, [id, router]);

    const handleSubmit = async (data: NewBlog) => {
        try {
            setSaving(true);
            const { error } = await supabase
                .from('blogs')
                .update(data)
                .eq('id', id);

            if (error) throw error;

            addToast('Blog post updated successfully!', 'success');
            // Small delay
            setTimeout(() => {
                router.push('/admin/blogs');
            }, 1000);
        } catch (error) {
            console.error('Error updating blog:', error);
            const message = getErrorMessage(error);
            addToast(message, 'error');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <Loader2 className="h-8 w-8 text-navy-400 animate-spin" />
                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Loading Post...</p>
            </div>
        );
    }

    if (!blog) return null;

    return (
        <div className="space-y-6">
            <ToastContainer toasts={toasts} removeToast={removeToast} />
            <div>
                <h1 className="text-2xl font-serif font-bold text-gray-900">Edit Post</h1>
                <p className="text-sm text-gray-500">Refining: {blog.title}</p>
            </div>

            <BlogForm initialData={blog} onSubmit={handleSubmit} loading={saving} />
        </div>
    );
}

export default function EditBlogPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <EditBlogContent />
        </Suspense>
    );
}
