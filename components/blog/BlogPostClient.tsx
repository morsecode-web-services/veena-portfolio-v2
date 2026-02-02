'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Blog } from '@/types/blog';
import BlogPostRenderer from '@/components/blog/BlogPostRenderer';
import BlogInteraction from '@/components/blog/BlogInteraction';
import { trackEvent } from '@/components/GoogleAnalytics';

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

    // Track view_item event
    useEffect(() => {
        trackEvent('view_item', {
            event_category: 'Blog',
            event_label: blog.title,
            items: [{
                item_id: blog.id,
                item_name: blog.title,
                item_category: blog.category,
                item_category2: 'Blog',
                author: blog.author
            }]
        });
    }, [blog.id, blog.title, blog.category, blog.author]);

    // Increment views on mount
    useEffect(() => {
        const viewedBlogs = JSON.parse(sessionStorage.getItem('viewed_blogs') || '[]');

        if (!viewedBlogs.includes(blog.id)) {
            const incrementView = async () => {
                await supabase.rpc('increment_blog_views', { blog_id: blog.id });
                sessionStorage.setItem('viewed_blogs', JSON.stringify([...viewedBlogs, blog.id]));
            };
            incrementView();
        }
    }, [blog.id]);

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
        <div className="bg-white">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <BlogPostRenderer blog={blog} />
            <BlogInteraction blogId={blog.id} initialLikes={blog.likes || 0} />
        </div>
    );
}
