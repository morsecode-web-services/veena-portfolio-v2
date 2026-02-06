import React from 'react';
import Link from 'next/link';
import ImageWithFallback from '@/components/ui/ImageWithFallback';
import { supabase } from '@/lib/supabase';
import { Blog } from '@/types/blog';
import { Calendar, User, ArrowRight, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { Metadata } from 'next';
import { loadConfig } from '@/lib/config';

export const metadata: Metadata = {
    title: 'Blog | Aishwarya Manikarnike',
    description: 'Insights and stories from the world of Indian Classical Music, Veena, and Art.',
    alternates: {
        canonical: 'https://www.aishwaryamanikarnike.com/blog',
    },
    openGraph: {
        title: 'Blog | Aishwarya Manikarnike',
        description: 'Insights and stories from the world of Indian Classical Music, Veena, and Art.',
        type: 'website',
        url: 'https://www.aishwaryamanikarnike.com/blog',
    }
};

async function getBlogs() {
    const { data, error } = await supabase
        .from('blogs')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching blogs:', error);
        return [];
    }
    return data as Blog[];
}

export default async function BlogListingPage() {
    const blogs = await getBlogs();
    const config = await loadConfig();

    return (
        <main className="min-h-screen pt-32 pb-20 bg-white">
            <div className="max-w-7xl mx-auto px-6 lg:px-8">
                {/* Header */}
                <div className="max-w-3xl mb-16">
                    <h2 className="text-[10px] font-black text-navy-400 uppercase tracking-[0.3em] mb-4">
                        {config.blog?.subtitle || 'Journal & Musings'}
                    </h2>
                    <h1 className="text-4xl md:text-5xl font-serif font-bold text-navy-900 leading-tight">
                        {config.blog?.title || 'Deep Dives into the Ocean of Swaras'}
                    </h1>
                </div>

                {/* Grid */}
                {blogs.length === 0 ? (
                    <div className="py-20 text-center">
                        <p className="text-gray-500 font-serif italic text-lg text-balance">The quill is resting. New stories are on their way...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                        {blogs.map((blog) => (
                            <article key={blog.id} className="group cursor-pointer">
                                <Link href={`/blog/${blog.slug}`} className="block">
                                    <div className="relative aspect-[16/10] rounded-2xl overflow-hidden mb-6 bg-gray-100 border border-gray-100 shadow-sm group-hover:shadow-md transition-shadow">
                                        {blog.image_url ? (
                                            <ImageWithFallback
                                                src={blog.image_url}
                                                alt={blog.title}
                                                fill
                                                className="object-cover group-hover:scale-105 transition-transform duration-700"
                                            />
                                        ) : (
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">No Preview</span>
                                            </div>
                                        )}
                                        <div className="absolute top-4 left-4">
                                            <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-[10px] font-black text-navy-900 uppercase tracking-widest rounded-full border border-white/20 shadow-sm">
                                                {blog.category}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-center gap-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                            <div className="flex items-center gap-1.5">
                                                <Calendar className="h-3 w-3" />
                                                {format(new Date(blog.created_at), 'MMMM dd, yyyy')}
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <User className="h-3 w-3" />
                                                By {blog.author}
                                            </div>
                                        </div>

                                        <h3 className="text-2xl font-serif font-bold text-navy-900 group-hover:text-gold-600 transition-colors leading-snug">
                                            {blog.title}
                                        </h3>

                                        <p className="text-gray-500 text-sm line-clamp-3 leading-relaxed">
                                            {blog.excerpt || 'Read more about this fascinating journey into music and art...'}
                                        </p>

                                        <div className="pt-2 flex items-center gap-2 text-[10px] font-black text-navy-900 uppercase tracking-[0.2em] group-hover:gap-4 transition-all">
                                            Read Full Story <ArrowRight className="h-3 w-3 text-gold-500" />
                                        </div>
                                    </div>
                                </Link>
                            </article>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}
