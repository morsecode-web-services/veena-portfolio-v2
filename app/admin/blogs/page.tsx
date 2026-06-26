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
  ExternalLink,
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
      setBlogs(blogs.map((b) => (b.id === id ? { ...b, is_published: !currentStatus } : b)));
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
    if (
      !confirm(
        'Are you sure you want to delete this blog post? This will also delete all associated images and cannot be undone.'
      )
    )
      return;

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
        inlineImages.forEach((url) => {
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
      const { error } = await supabase.from('blogs').delete().eq('id', id);

      if (error) throw error;
      setBlogs(blogs.filter((b) => b.id !== id));
    } catch (error) {
      console.error('Error deleting blog:', error);
      alert('Failed to delete blog.');
    }
  }

  const filteredBlogs = blogs.filter(
    (blog) =>
      blog.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      blog.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Blog Management</h1>
          <p className="text-slate-500 text-xs mt-0.5">Create and curate your stories.</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/blog"
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 text-slate-700 rounded hover:bg-slate-50 transition-colors font-semibold text-xs bg-white"
          >
            <Globe className="h-3.5 w-3.5" />
            View Blog
          </Link>
          <Link
            href="/admin/blogs/new"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded hover:bg-slate-800 transition-colors font-semibold text-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            New Post
          </Link>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded border border-slate-200 shadow-none">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Total Posts
          </p>
          <p className="text-xl font-bold text-slate-900">{blogs.length}</p>
        </div>
        <div className="bg-white p-4 rounded border border-slate-200 shadow-none">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Published
          </p>
          <p className="text-xl font-bold text-emerald-600">
            {blogs.filter((b) => b.is_published).length}
          </p>
        </div>
        <div className="bg-white p-4 rounded border border-slate-200 shadow-none">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Drafts
          </p>
          <p className="text-xl font-bold text-amber-600">
            {blogs.filter((b) => !b.is_published).length}
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-3 rounded border border-slate-200 shadow-none flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search posts by title or category..."
            className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded text-xs focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-900 bg-slate-50/50 text-slate-850"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="px-3 py-1.5 border border-slate-200 rounded text-xs flex items-center gap-1.5 text-slate-700 hover:bg-slate-50 bg-white font-semibold">
          <Filter className="h-3.5 w-3.5" />
          Filters
        </button>
      </div>

      {/* Blogs List */}
      <div className="bg-white rounded border border-slate-200 shadow-none overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading posts...</div>
        ) : filteredBlogs.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            {searchTerm ? 'No posts match your search.' : 'No blog posts yet.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-4 py-2.5">Story Details</th>
                  <th className="px-4 py-2.5">Published Date</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredBlogs.map((blog) => (
                  <tr key={blog.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {blog.image_url ? (
                          <div className="relative w-16 h-10 rounded overflow-hidden flex-shrink-0 border border-slate-200">
                            <Image
                              src={blog.image_url}
                              alt={blog.title}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-16 h-10 rounded bg-slate-50 flex items-center justify-center flex-shrink-0 border border-slate-200">
                            <FileText className="h-4 w-4 text-slate-400" />
                          </div>
                        )}
                        <div>
                          <div className="font-semibold text-slate-800 text-xs line-clamp-1">
                            {blog.title}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[9px] font-bold text-slate-600 uppercase tracking-wider bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">
                              {blog.category}
                            </span>
                            <span className="text-[10px] text-slate-400 flex items-center gap-1">
                              <User className="h-3 w-3" /> {blog.author}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        {format(new Date(blog.created_at), 'MMM dd, yyyy')}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => togglePublish(blog.id, blog.is_published)}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${
                          blog.is_published
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {blog.is_published ? (
                          <>
                            <Eye className="h-3 w-3" /> Published
                          </>
                        ) : (
                          <>
                            <EyeOff className="h-3 w-3" /> Draft
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1.5">
                        {blog.is_published && (
                          <Link
                            href={`/blog/${blog.slug}`}
                            target="_blank"
                            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-all inline-block"
                            title="View Live"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Link>
                        )}
                        <Link
                          href={`/admin/blogs/edit?id=${blog.id}`}
                          className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-all inline-block"
                          title="Edit Post"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Link>
                        <button
                          onClick={() => deleteBlog(blog.id)}
                          className="p-1 text-red-400 hover:text-red-650 hover:bg-red-50 rounded transition-all"
                          title="Delete Post"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
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
