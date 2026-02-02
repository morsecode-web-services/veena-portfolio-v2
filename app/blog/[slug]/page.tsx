import React from 'react';
import { supabase } from '@/lib/supabase';
import { Blog } from '@/types/blog';
import { Metadata, ResolvingMetadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Calendar, User, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { notFound } from 'next/navigation';
import ShareButtons from '@/components/blog/ShareButtons';

interface Props {
    params: Promise<{ slug: string }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

// 1. Dynamic Metadata for SEO
export async function generateMetadata(
    { params }: Props,
    parent: ResolvingMetadata
): Promise<Metadata> {
    const { slug } = await params;
    const { data: blog } = await supabase
        .from('blogs')
        .select('*')
        .eq('slug', slug)
        .single();

    if (!blog) return { title: 'Not Found' };

    const previousImages = (await parent).openGraph?.images || [];

    return {
        title: `${blog.meta_title || blog.title} | Aishwarya Manikarnike`,
        description: blog.meta_description || blog.excerpt || `Read ${blog.title} on Aishwarya's blog.`,
        keywords: blog.keywords?.join(', '),
        openGraph: {
            title: blog.title,
            description: blog.meta_description || blog.excerpt,
            images: blog.image_url ? [blog.image_url, ...previousImages] : previousImages,
            type: 'article',
            publishedTime: blog.created_at,
            authors: [blog.author],
        },
        twitter: {
            card: 'summary_large_image',
            title: blog.title,
            description: blog.meta_description || blog.excerpt,
            images: blog.image_url ? [blog.image_url] : [],
        }
    };
}

export const dynamicParams = false;

// 2. SSG: Pre-render all published blogs
export async function generateStaticParams() {
    try {
        const { data: blogs } = await supabase
            .from('blogs')
            .select('slug')
            .eq('is_published', true);

        const paths = (blogs || []).map((blog) => ({
            slug: blog.slug,
        }));

        // Keep at least one path for build stability
        if (paths.length === 0) {
            return [{ slug: 'welcome-to-blog' }];
        }
        return paths;
    } catch (e) {
        console.error('Error in generateStaticParams:', e);
        return [{ slug: 'welcome-to-blog' }];
    }
}

export default async function BlogPostPage({ params }: Props) {
    const { slug } = await params;
    const { data: blog } = await supabase
        .from('blogs')
        .select('*')
        .eq('slug', slug)
        .single();

    if (!blog) notFound();

    // 3. JSON-LD Structured Data
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
        description: blog.excerpt,
    };

    return (
        <main className="min-h-screen pt-32 pb-20 bg-white">
            {/* JSON-LD injection */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

            <div className="max-w-4xl mx-auto px-6">
                {/* Back Link */}
                <Link href="/blog" className="inline-flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-navy-900 transition-colors mb-12">
                    <ArrowLeft className="h-4 w-4" /> Back to Journal
                </Link>

                {/* Article Header */}
                <header className="space-y-8 mb-16">
                    <div className="space-y-4">
                        <span className="px-3 py-1 bg-navy-50 text-[10px] font-black text-navy-900 uppercase tracking-[0.2em] rounded-full border border-navy-100">
                            {blog.category}
                        </span>
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-navy-900 leading-[1.1]">
                            {blog.title}
                        </h1>
                    </div>

                    <div className="flex flex-wrap items-center gap-6 text-[10px] font-black text-gray-400 uppercase tracking-widest border-y border-gray-100 py-6">
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gold-500" />
                            {format(new Date(blog.created_at), 'MMMM dd, yyyy')}
                        </div>
                        <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gold-500" />
                            By {blog.author}
                        </div>
                        <div className="flex-1" />
                        <ShareButtons
                            url={`https://morsecode.in/blog/${blog.slug}`}
                            title={blog.title}
                        />
                    </div>
                </header>

                {/* Featured Image */}
                {blog.image_url && (
                    <div className="relative aspect-[21/9] rounded-3xl overflow-hidden mb-16 shadow-2xl shadow-navy-900/10 ring-1 ring-black/5">
                        <Image
                            src={blog.image_url}
                            alt={blog.title}
                            fill
                            className="object-cover"
                            priority
                        />
                    </div>
                )}

                {/* Content */}
                <article
                    className="prose prose-lg prose-navy max-w-none font-serif text-gray-800 leading-relaxed
                        prose-headings:font-serif prose-headings:font-bold prose-headings:text-navy-900
                        prose-p:mb-8
                        prose-blockquote:border-gold-400 prose-blockquote:bg-gray-50 prose-blockquote:py-2 prose-blockquote:rounded-r-xl prose-blockquote:font-normal prose-blockquote:italic
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
        </main>
    );
}
