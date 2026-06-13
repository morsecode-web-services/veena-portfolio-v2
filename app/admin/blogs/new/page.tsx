'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { BlogForm } from '@/components/admin/BlogForm';
import { NewBlog } from '@/types/blog';

import { getErrorMessage } from '@/utils/error-handling';
import { ToastContainer, useToast } from '@/components/ui/Toast';

export default function NewBlogPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const { toasts, addToast, removeToast } = useToast();

    const handleSubmit = async (data: NewBlog) => {
        try {
            setLoading(true);
            const { error } = await supabase
                .from('blogs')
                .insert([data]);

            if (error) throw error;

            addToast('Blog post created successfully!', 'success');
            // Small delay to let user see the success message
            setTimeout(() => {
                router.push('/admin/blogs');
            }, 1000);
        } catch (error) {
            console.error('Error creating blog:', error);
            const message = getErrorMessage(error);
            addToast(message, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <ToastContainer toasts={toasts} removeToast={removeToast} />
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-4">
                <div>
                    <h1 className="text-xl font-bold text-slate-900">Create New Post</h1>
                    <p className="text-slate-500 text-xs mt-0.5">Draft your next story.</p>
                </div>
            </div>

            <BlogForm onSubmit={handleSubmit} loading={loading} />
        </div>
    );
}
