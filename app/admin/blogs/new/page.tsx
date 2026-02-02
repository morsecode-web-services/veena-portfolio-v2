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
            <div>
                <h1 className="text-2xl font-serif font-bold text-gray-900">Create New Post</h1>
                <p className="text-sm text-gray-500">Draft your next story with the Medium-style editor</p>
            </div>

            <BlogForm onSubmit={handleSubmit} loading={loading} />
        </div>
    );
}
