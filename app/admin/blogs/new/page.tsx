'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { BlogForm } from '@/components/admin/BlogForm';
import { NewBlog } from '@/types/blog';

export default function NewBlogPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (data: NewBlog) => {
        try {
            setLoading(true);
            const { error } = await supabase
                .from('blogs')
                .insert([data]);

            if (error) throw error;
            router.push('/admin/blogs');
        } catch (error) {
            console.error('Error creating blog:', error);
            alert('Failed to create blog. Please check your Supabase schema and try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-serif font-bold text-gray-900">Create New Post</h1>
                <p className="text-sm text-gray-500">Draft your next story with the Medium-style editor</p>
            </div>

            <BlogForm onSubmit={handleSubmit} loading={loading} />
        </div>
    );
}
