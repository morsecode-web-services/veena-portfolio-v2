import React from 'react';
import { supabase } from '@/lib/supabase';
import { Metadata, ResolvingMetadata } from 'next';
import { notFound } from 'next/navigation';
import BlogPostClient from '@/components/blog/BlogPostClient';

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

// Dynamic Metadata for SEO
export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { slug } = await params;
  const { data: blog } = await supabase.from('blogs').select('*').eq('slug', slug).single();

  if (!blog) return { title: 'Not Found' };

  const previousImages = (await parent).openGraph?.images || [];

  return {
    title: `${blog.meta_title || blog.title} | Aishwarya Manikarnike`,
    description: blog.meta_description || blog.excerpt || `Read ${blog.title} on Aishwarya's blog.`,
    keywords: blog.keywords?.join(', '),
    alternates: {
      canonical: `https://www.aishwaryamanikarnike.com/blog/${slug}`,
    },
    openGraph: {
      title: blog.title,
      description: blog.meta_description || blog.excerpt,
      images: blog.image_url ? [blog.image_url, ...previousImages] : previousImages,
      type: 'article',
      publishedTime: blog.created_at,
      authors: [blog.author],
      url: `https://www.aishwaryamanikarnike.com/blog/${slug}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: blog.title,
      description: blog.meta_description || blog.excerpt,
      images: blog.image_url ? [blog.image_url] : [],
    },
  };
}

export const dynamicParams = false;

// SSG: Pre-render all published blogs
export async function generateStaticParams() {
  try {
    const { data: blogs } = await supabase.from('blogs').select('slug').eq('is_published', true);

    const paths = (blogs || []).map((blog) => ({
      slug: blog.slug,
    }));

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

  // Fetch initial data for SSG
  const { data: blog } = await supabase.from('blogs').select('*').eq('slug', slug).single();

  if (!blog) notFound();

  // Pass initial data to client component which will refetch on mount
  return <BlogPostClient initialBlog={blog} slug={slug} />;
}
