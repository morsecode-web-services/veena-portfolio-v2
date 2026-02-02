'use client';

import React from 'react';
import { Blog } from '@/types/blog';
import Image from 'next/image';
import Link from 'next/link';
import { Calendar, User, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import ShareButtons from '@/components/blog/ShareButtons';

interface BlogPostRendererProps {
    blog: Blog;
    previewMode?: boolean;
}

export default function BlogPostRenderer({ blog, previewMode = false }: BlogPostRendererProps) {
    if (!blog) return null;

    return (
        <main className="min-h-screen bg-gradient-to-b from-cream-50 to-white">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Back Button */}
                {!previewMode && (
                    <Link
                        href="/blog"
                        className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-navy-900 transition-colors mb-8 group"
                    >
                        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                        Back to Blog
                    </Link>
                )}

                {previewMode && (
                    <div className="bg-gold-400 text-navy-900 px-4 py-2 rounded-lg font-bold text-center mb-8 uppercase tracking-widest text-sm shadow-md">
                        👁️ Preview Mode - Not Published
                    </div>
                )}

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
                                <time dateTime={blog.created_at || new Date().toISOString()}>
                                    {blog.created_at ? format(new Date(blog.created_at), 'MMMM dd, yyyy') : 'Draft Date'}
                                </time>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-gray-300">|</span>
                                <span className="font-medium">
                                    {Math.ceil(blog.content.replace(/<[^>]*>/g, ' ').split(/\s+/).filter(w => w.length > 0).length / 200)} min read
                                </span>
                            </div>
                        </div>

                        {/* Share Buttons - only show in non-preview mode or valid URL */}
                        {!previewMode && (
                            <ShareButtons
                                url={typeof window !== 'undefined' ? window.location.href : ''}
                                title={blog.title}
                            />
                        )}

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

                        {/* Footer Section - Minimal & Premium */}
                        <footer className="mt-24 mb-12">
                            <div className="flex flex-col items-center text-center space-y-8">
                                <div className="w-16 h-[1px] bg-gold-400/50"></div>

                                <blockquote className="max-w-2xl">
                                    <p className="text-2xl md:text-3xl font-serif text-navy-900 italic leading-relaxed">
                                        &ldquo;Music is the mediator between the spiritual and the sensual life.&rdquo;
                                    </p>
                                </blockquote>

                                <div className="flex flex-col items-center gap-4">
                                    <span className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Interested in collaboration?</span>
                                    <Link
                                        href="/#contact"
                                        className="group relative inline-flex items-center gap-3 px-8 py-3 bg-navy-900 text-white rounded-full transition-all hover:bg-gold-500 hover:text-navy-900"
                                    >
                                        <span className="text-xs font-black uppercase tracking-widest">Get in Touch</span>
                                    </Link>
                                </div>
                            </div>
                        </footer>
                    </div>
                </article>
            </div>
        </main>
    );
}
