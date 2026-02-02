'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Blog } from '@/types/blog';
import Image from 'next/image';
import Link from 'next/link';
import { Calendar, User, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import ShareButtons from '@/components/blog/ShareButtons';
import BlogPostRenderer from '@/components/blog/BlogPostRenderer';

interface BlogPostClientProps {
    initialBlog: Blog;
    slug: string;
}

export default function BlogPostClient({ initialBlog, slug }: BlogPostClientProps) {
    const [blog, setBlog] = useState<Blog>(initialBlog);

    // Refetch data on mount to get latest changes
    useEffect(() => {
        async function refetchBlog() {
            const { data } = await supabase
                .from('blogs')
                .select('*')
                .eq('slug', slug)
                .single();

            if (data) {
                setBlog(data);
            }
        }

        refetchBlog();
    }, [slug]);

    // JSON-LD Structured Data
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: blog.title,
        image: blog.image_url,
        datePublished: blog.created_at,
        dateModified: blog.updated_at,
        author: {
            '@type': 'Person',
            name: blog.author,
        },
        publisher: {
            '@type': 'Organization',
            name: 'Aishwarya Manikarnike',
        },
        description: blog.excerpt,
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <BlogPostRenderer blog={blog} />
        </>
    );
}
