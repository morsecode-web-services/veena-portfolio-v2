'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Blog } from '@/types/blog';
import {
    Plus,
    Search,
    Edit,
    Trash2,
    Eye,
    EyeOff,
    Filter,
    Globe,
    FileText,
    Calendar,
    User,
    ChevronRight,
    ExternalLink
} from 'lucide-react';
import Image from 'next/image';
import { format } from 'date-fns';

export default function BlogsPage() {
    const [blogs, setBlogs] = useState<Blog[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchBlogs();
    }, []);

    async function fetchBlogs() {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('blogs')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setBlogs(data || []);
        } catch (error) {
            console.error('Error fetching blogs:', error);
        } finally {
            setLoading(false);
        }
    }

    async function togglePublish(id: string, currentStatus: boolean) {
        try {
            const { error } = await supabase
                .from('blogs')
                .update({ is_published: !currentStatus })
                .eq('id', id);

            if (error) throw error;
            setBlogs(blogs.map(b => b.id === id ? { ...b, is_published: !currentStatus } : b));
        } catch (error) {
            console.error('Error toggling publish status:', error);
        }
    }

    // Helper function to extract image URLs from HTML content
    function extractImageUrls(html: string): string[] {
        const imgRegex = /<img[^>]+src="([^">]+)"/g;
        const urls: string[] = [];
        let match;

        while ((match = imgRegex.exec(html)) !== null) {
            urls.push(match[1]);
        }

        return urls;
    }

    // Helper function to convert public URL to storage path
    function getStoragePath(publicUrl: string): string {
        // Extract path from Supabase public URL
        // Example: https://xxx.supabase.co/storage/v1/object/public/blog-assets/inline-images/abc.jpg
        // Returns: inline-images/abc.jpg
        const match = publicUrl.match(/\/blog-assets\/(.+)$/);
        return match ? match[1] : '';
    }

    async function deleteBlog(id: string) {
        if (!confirm('Are you sure you want to delete this blog post? This will also delete all associated images and cannot be undone.')) return;

        try {
            // 1. Fetch the blog to get image URLs
            const { data: blog, error: fetchError } = await supabase
                .from('blogs')
                .select('content, image_url')
                .eq('id', id)
                .single();

            if (fetchError) throw fetchError;

            if (blog) {
                // 2. Extract inline image URLs from content
                const inlineImages = extractImageUrls(blog.content || '');

                // 3. Collect all images to delete
                const imagesToDelete: string[] = [];

                // Add featured image
                if (blog.image_url) {
                    const featuredPath = getStoragePath(blog.image_url);
                    if (featuredPath) imagesToDelete.push(featuredPath);
                }

                // Add inline images
                inlineImages.forEach(url => {
                    const path = getStoragePath(url);
                    if (path) imagesToDelete.push(path);
                });

                // 4. Delete all images from storage
                if (imagesToDelete.length > 0) {
                    const { error: storageError } = await supabase.storage
                        .from('blog-assets')
                        .remove(imagesToDelete);

                    if (storageError) {
                        console.warn('Some images could not be deleted from storage:', storageError);
                        // Continue with blog deletion even if storage cleanup fails
                    }
                }
            }

            // 5. Delete the blog post from database
            const { error } = await supabase
                .from('blogs')
                .delete()
                .eq('id', id);

            if (error) throw error;
            setBlogs(blogs.filter(b => b.id !== id));
        } catch (error) {
            console.error('Error deleting blog:', error);
            alert('Failed to delete blog.');
        }
    }

    const filteredBlogs = blogs.filter(blog =>
        blog.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        blog.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-serif font-bold text-gray-900">Blog Management</h1>
                    <p className="text-sm text-gray-500">Create and curate your stories</p>
                </div>
                <div className="flex gap-3">
                    <Link
                        href="/blog"
                        target="_blank"
                        className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors font-bold text-sm"
                    >
                        <Globe className="h-4 w-4" />
                        View Blog
                    </Link>
                    <Link
                        href="/admin/blogs/new"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-navy-900 text-white rounded-lg hover:bg-navy-800 transition-colors font-bold text-sm"
                    >
                        <Plus className="h-4 w-4" />
                        New Post
                    </Link>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Posts</p>
                    <p className="text-2xl font-serif font-bold text-navy-900">{blogs.length}</p>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Published</p>
                    <p className="text-2xl font-serif font-bold text-green-600">{blogs.filter(b => b.is_published).length}</p>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Drafts</p>
                    <p className="text-2xl font-serif font-bold text-orange-500">{blogs.filter(b => !b.is_published).length}</p>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search posts by title or category..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button className="px-4 py-2 border border-gray-200 rounded-lg text-sm flex items-center gap-2 text-gray-600 hover:bg-gray-50">
                    <Filter className="h-4 w-4" />
                    Filters
                </button>
            </div>

            {/* Blogs List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center text-gray-500">Loading posts...</div>
                ) : filteredBlogs.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                        {searchTerm ? 'No posts match your search.' : 'No blog posts yet.'}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-100">
                                    <th className="px-6 py-5 text-[10px] font-black text-navy-900/40 uppercase tracking-[0.2em]">Story Details</th>
                                    <th className="px-6 py-5 text-[10px] font-black text-navy-900/40 uppercase tracking-[0.2em]">Published Date</th>
                                    <th className="px-6 py-5 text-[10px] font-black text-navy-900/40 uppercase tracking-[0.2em]">Status</th>
                                    <th className="px-6 py-5 text-right"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredBlogs.map((blog) => (
                                    <tr key={blog.id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                {blog.image_url ? (
                                                    <div className="relative w-16 h-10 rounded-md overflow-hidden flex-shrink-0 border border-gray-100">
                                                        <Image
                                                            src={blog.image_url}
                                                            alt={blog.title}
                                                            fill
                                                            className="object-cover"
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="w-16 h-10 rounded-md bg-gray-100 flex items-center justify-center flex-shrink-0 border border-gray-100">
                                                        <FileText className="h-5 w-5 text-gray-300" />
                                                    </div>
                                                )}
                                                <div>
                                                    <div className="font-bold text-navy-900 group-hover:text-navy-600 transition-colors font-serif line-clamp-1">
                                                        {blog.title}
                                                    </div>
                                                    <div className="flex items-center gap-3 mt-1">
                                                        <span className="text-[10px] font-black text-navy-400 uppercase tracking-widest bg-navy-50 px-1.5 py-0.5 rounded">
                                                            {blog.category}
                                                        </span>
                                                        <span className="text-[10px] text-gray-400 flex items-center gap-1">
                                                            <User className="h-3 w-3" /> {blog.author}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-4 w-4 text-gray-400" />
                                                {format(new Date(blog.created_at), 'MMM dd, yyyy')}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => togglePublish(blog.id, blog.is_published)}
                                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${blog.is_published
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-orange-100 text-orange-700'
                                                    }`}
                                            >
                                                {blog.is_published ? (
                                                    <><Eye className="h-3 w-3" /> Published</>
                                                ) : (
                                                    <><EyeOff className="h-3 w-3" /> Draft</>
                                                )}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                {blog.is_published && (
                                                    <Link
                                                        href={`/blog/${blog.slug}`}
                                                        target="_blank"
                                                        className="p-2 text-gray-400 hover:text-navy-600 transition-colors"
                                                        title="View Live"
                                                    >
                                                        <ExternalLink className="h-4 w-4" />
                                                    </Link>
                                                )}
                                                <Link
                                                    href={`/admin/blogs/edit?id=${blog.id}`}
                                                    className="p-2 text-gray-400 hover:text-navy-600 transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Link>
                                                <button
                                                    onClick={() => deleteBlog(blog.id)}
                                                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
