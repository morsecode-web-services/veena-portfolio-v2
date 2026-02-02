'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Blog } from '@/types/blog';
import Image from 'next/image';
import Link from 'next/link';
import { Calendar, User, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import ShareButtons from '@/components/blog/ShareButtons';

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
        <main className="min-h-screen bg-gradient-to-b from-cream-50 to-white">
            {/* JSON-LD Script */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Back Button */}
                <Link
                    href="/blog"
                    className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-navy-900 transition-colors mb-8 group"
                >
                    <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                    Back to Blog
                </Link>

                {/* Article Header */}
                <article className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                    {/* Featured Image */}
                    {blog.image_url && (
                        <div className="relative w-full h-[400px] bg-gray-100">
                            <Image
                                src={blog.image_url}
                                alt={blog.title}
                                fill
                                className="object-cover"
                                priority
                            />
                        </div>
                    )}

                    <div className="p-8 md:p-12 space-y-8">
                        {/* Category Badge */}
                        <div className="flex items-center gap-3">
                            <span className="inline-block px-3 py-1 bg-navy-50 text-navy-700 text-xs font-black uppercase tracking-widest rounded-full">
                                {blog.category}
                            </span>
                        </div>

                        {/* Title */}
                        <h1 className="text-4xl md:text-5xl font-serif font-bold text-navy-900 leading-tight">
                            {blog.title}
                        </h1>

                        {/* Meta Info */}
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 border-b border-gray-100 pb-6">
                            <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-gray-400" />
                                <span className="font-medium">{blog.author}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-gray-400" />
                                <time dateTime={blog.created_at}>
                                    {format(new Date(blog.created_at), 'MMMM dd, yyyy')}
                                </time>
                            </div>
                        </div>

                        {/* Share Buttons */}
                        <ShareButtons
                            url={typeof window !== 'undefined' ? window.location.href : ''}
                            title={blog.title}
                        />

                        {/* Content */}
                        <div
                            className="
                                prose prose-lg max-w-none
                                prose-headings:font-serif prose-headings:font-bold prose-headings:text-navy-900
                                prose-h1:text-4xl prose-h1:mt-12 prose-h1:mb-6
                                prose-h2:text-3xl prose-h2:mt-10 prose-h2:mb-4
                                prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-6
                                prose-ul:my-6 prose-ol:my-6
                                prose-li:text-gray-700 prose-li:my-2
                                prose-blockquote:border-l-4 prose-blockquote:border-gold-400 prose-blockquote:pl-6 prose-blockquote:italic prose-blockquote:text-gray-600
                                prose-strong:text-navy-900 prose-strong:font-bold
                                prose-img:rounded-2xl prose-img:shadow-lg
                                prose-a:text-gold-600 prose-a:no-underline hover:prose-a:underline
                            "
                            dangerouslySetInnerHTML={{ __html: blog.content }}
                        />

                        {/* Footer Section */}
                        <footer className="mt-20 pt-12 border-t border-gray-100">
                            <div className="bg-gradient-to-br from-navy-900 via-navy-950 to-navy-900 rounded-3xl p-10 md:p-16 text-center space-y-8 shadow-2xl border border-navy-800/50 relative overflow-hidden">
                                {/* Decorative gradient overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-gold-900/10 to-transparent pointer-events-none" />

                                <div className="relative z-10 space-y-8">
                                    <h4 className="text-3xl md:text-4xl font-serif font-bold text-gold-400 italic leading-tight">&ldquo;Music is the mediator between the spiritual and the sensual life.&rdquo;</h4>
                                    <p className="text-navy-100 text-base md:text-lg max-w-md mx-auto leading-relaxed">Explore more about the rich traditions of Indian Classical Music</p>
                                    <div className="pt-6">
                                        <Link
                                            href="/#contact"
                                            className="inline-block px-10 py-4 text-navy-900 font-black uppercase tracking-widest text-xs rounded-full hover:brightness-110 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 transform"
                                            style={{
                                                background: 'linear-gradient(to right, #D4AF37, #B8860B)'
                                            }}
                                        >
                                            Get in Touch
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </footer>
                    </div>
                </article>
            </div>
        </main>
    );
}
