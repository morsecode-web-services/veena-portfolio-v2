'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
    Save,
    X,
    Type,
    Hash,
    Image as ImageIcon,
    Search as SeoIcon,
    ChevronDown,
    ChevronUp,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ImageUpload } from './ImageUpload';
import TipTapEditor from './TipTapEditor';
import { Blog, NewBlog } from '@/types/blog';

const blogSchema = z.object({
    title: z.string().min(3, 'Title is required'),
    slug: z.string().min(3, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric and hyphens only'),
    content: z.string().min(10, 'Content is too short'),
    excerpt: z.string().max(200, 'Excerpt must be under 200 characters').optional().or(z.literal('')),
    image_url: z.string().nullable().optional(),
    category: z.string().min(1, 'Category is required'),
    author: z.string().min(1, 'Author is required'),
    is_published: z.boolean().default(false),
    meta_title: z.string().optional().or(z.literal('')),
    meta_description: z.string().optional().or(z.literal('')),
    keywords: z.array(z.string()).default([]),
});

type BlogFormSchema = z.infer<typeof blogSchema>;

interface BlogFormProps {
    initialData?: Partial<Blog>;
    onSubmit: (data: NewBlog) => Promise<void>;
    loading?: boolean;
}

export function BlogForm({ initialData, onSubmit, loading }: BlogFormProps) {
    const router = useRouter();
    const [showSeo, setShowSeo] = useState(false);
    const [keywordInput, setKeywordInput] = useState('');

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors, isDirty },
    } = useForm<BlogFormSchema>({
        resolver: zodResolver(blogSchema) as any,
        defaultValues: {
            title: initialData?.title || '',
            slug: initialData?.slug || '',
            content: initialData?.content || '',
            excerpt: initialData?.excerpt || '',
            category: initialData?.category || 'Music',
            author: initialData?.author || 'Aishwarya Manikarnike',
            is_published: initialData?.is_published || false,
            image_url: initialData?.image_url || null,
            meta_title: initialData?.meta_title || '',
            meta_description: initialData?.meta_description || '',
            keywords: initialData?.keywords || [],
        },
    });

    // When editing an existing post, treat all fields as manually edited to prevent auto-generation
    const isEditMode = !!initialData?.id;
    const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(isEditMode);
    const [isExcerptManuallyEdited, setIsExcerptManuallyEdited] = useState(isEditMode);
    const [isMetaTitleManuallyEdited, setIsMetaTitleManuallyEdited] = useState(isEditMode);
    const [isMetaDescManuallyEdited, setIsMetaDescManuallyEdited] = useState(isEditMode);
    const [copySuccess, setCopySuccess] = useState(false);

    const content = watch('content');
    const imageUrl = watch('image_url');
    const keywords = watch('keywords');
    const title = watch('title');
    const slug = watch('slug');

    // Auto-generate slug from title
    React.useEffect(() => {
        if (!title || isSlugManuallyEdited) return;

        const generated = title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)+/g, '');

        setValue('slug', generated, { shouldValidate: true });
    }, [title, setValue, isSlugManuallyEdited]);

    // Auto-generate Excerpt and SEO from content/title
    React.useEffect(() => {
        if (!content) return;

        // Strip HTML tags for excerpt
        const plainText = content.replace(/<[^>]*>/g, '').trim();
        if (plainText.length < 5) return; // avoid tiny content updates

        if (!isExcerptManuallyEdited) {
            const generatedExcerpt = plainText.substring(0, 160) + (plainText.length > 160 ? '...' : '');
            setValue('excerpt', generatedExcerpt, { shouldDirty: true });
        }

        // Auto-fill SEO
        if (!isMetaTitleManuallyEdited && title) {
            setValue('meta_title', title, { shouldDirty: true });
        }

        if (!isMetaDescManuallyEdited) {
            const currentExcerpt = watch('excerpt');
            if (currentExcerpt) {
                setValue('meta_description', currentExcerpt, { shouldDirty: true });
            }
        }
    }, [content, title, setValue, watch, isExcerptManuallyEdited, isMetaTitleManuallyEdited, isMetaDescManuallyEdited]);

    const addKeyword = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && keywordInput.trim()) {
            e.preventDefault();
            if (!keywords.includes(keywordInput.trim())) {
                setValue('keywords', [...keywords, keywordInput.trim()], { shouldDirty: true });
            }
            setKeywordInput('');
        }
    };

    const removeKeyword = (index: number) => {
        const newKeywords = keywords.filter((_, i) => i !== index);
        setValue('keywords', newKeywords, { shouldDirty: true });
    };

    const handleFormSubmit = async (data: BlogFormSchema) => {
        await onSubmit(data as NewBlog);
    };

    return (
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8 max-w-5xl mx-auto">
            {/* Main Content Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-8 space-y-8">
                    {/* Header info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">
                                Blog Title
                            </label>
                            <input
                                {...register('title')}
                                className={`w-full px-4 py-4 bg-gray-50 border ${errors.title ? 'border-red-500' : 'border-gray-200'} rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-500 transition-all font-serif text-xl font-bold`}
                                placeholder="Enter a compelling title..."
                            />
                            {errors.title && <p className="mt-1 text-sm text-red-500">{errors.title.message}</p>}
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">
                                Category
                            </label>
                            <select
                                {...register('category')}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-500 transition-all text-sm font-bold"
                            >
                                <option value="Music">Music</option>
                                <option value="Life">Life</option>
                                <option value="Art">Art</option>
                                <option value="Process">Process</option>
                            </select>
                        </div>
                    </div>

                    {/* Editor Section */}
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">
                            Post Content
                        </label>
                        <TipTapEditor
                            content={content}
                            onChange={(val) => {
                                setValue('content', val, { shouldDirty: true, shouldValidate: true });
                            }}
                        />
                        {errors.content && <p className="mt-2 text-sm text-red-500">{errors.content.message}</p>}
                    </div>

                    {/* Excerpt */}
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">
                            Short Excerpt
                        </label>
                        <textarea
                            {...register('excerpt', {
                                onChange: () => setIsExcerptManuallyEdited(true)
                            })}
                            rows={2}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-500 transition-all text-sm resize-none"
                            placeholder="A brief summary for the blog listing page..."
                        />
                    </div>

                    {/* Slug */}
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">
                            URL Slug
                        </label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">/blog/</span>
                            <input
                                {...register('slug', {
                                    onChange: () => setIsSlugManuallyEdited(true)
                                })}
                                className={`w-full pl-16 pr-4 py-3 bg-gray-50 border ${errors.slug ? 'border-red-500' : 'border-gray-200'} rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-500 transition-all text-sm font-mono`}
                                placeholder="url-friendly-slug"
                            />
                        </div>
                        {errors.slug && <p className="mt-1 text-sm text-red-500">{errors.slug.message}</p>}
                    </div>
                </div>

                {/* Status Bar */}
                <div className="bg-gray-50/50 border-t border-gray-100 p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="is_published"
                                {...register('is_published')}
                                className="w-4 h-4 rounded border-gray-300 text-navy-900 focus:ring-navy-500 cursor-pointer"
                            />
                            <label htmlFor="is_published" className="text-xs font-black text-navy-900 cursor-pointer select-none uppercase tracking-widest">
                                Publish Post
                            </label>
                        </div>
                    </div>
                </div>
            </div>

            {/* Assets & SEO Sidebar/Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Image Section */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-6">
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b pb-4 flex items-center gap-2">
                        <ImageIcon className="h-4 w-4 text-navy-400" /> Featured Image
                    </h3>
                    <ImageUpload
                        value={imageUrl || ''}
                        onChange={(url) => setValue('image_url', url, { shouldDirty: true })}
                        bucket="blog-assets"
                    />
                </div>

                {/* SEO Section */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-6">
                    <button
                        type="button"
                        onClick={() => setShowSeo(!showSeo)}
                        className="w-full text-left"
                    >
                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b pb-4 flex items-center justify-between">
                            <span className="flex items-center gap-2">
                                <SeoIcon className="h-4 w-4 text-navy-400" /> SEO Optimization
                            </span>
                            {showSeo ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </h3>
                    </button>

                    {showSeo && (
                        <div className="space-y-6 pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">
                                    Meta Title
                                </label>
                                <input
                                    {...register('meta_title', {
                                        onChange: () => setIsMetaTitleManuallyEdited(true)
                                    })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-500"
                                    placeholder="Defaults to post title"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">
                                    Meta Description
                                </label>
                                <textarea
                                    {...register('meta_description', {
                                        onChange: () => setIsMetaDescManuallyEdited(true)
                                    })}
                                    rows={3}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-500 resize-none"
                                    placeholder="Brief description for search results..."
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">
                                    Keywords
                                </label>
                                <div className="space-y-2">
                                    <input
                                        type="text"
                                        value={keywordInput}
                                        onChange={(e) => setKeywordInput(e.target.value)}
                                        onKeyDown={addKeyword}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-500"
                                        placeholder="Type keyword and press Enter..."
                                    />
                                    <div className="flex flex-wrap gap-2">
                                        {keywords.map((kw, i) => (
                                            <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-navy-50 text-navy-700 text-[10px] font-bold uppercase rounded-md border border-navy-100">
                                                {kw}
                                                <button onClick={() => removeKeyword(i)} type="button">
                                                    <X className="h-3 w-3 hover:text-red-500" />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 sticky bottom-4 z-20">
                <button
                    type="button"
                    onClick={() => {
                        if (isDirty) {
                            if (confirm('Discard unsaved changes?')) router.back();
                        } else {
                            router.back();
                        }
                    }}
                    className="px-6 py-3 bg-white border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition-colors uppercase tracking-widest text-[10px] shadow-sm"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={loading}
                    className="px-8 py-3 bg-navy-900 text-white font-bold rounded-xl hover:bg-navy-800 transition-colors uppercase tracking-widest text-[10px] flex items-center gap-2 disabled:bg-navy-200 shadow-md hover:shadow-lg active:scale-95 transform transition-all"
                >
                    {loading ? 'Saving...' : (
                        <>
                            <Save className="h-4 w-4 text-gold-400" /> Save Blog Post
                        </>
                    )}
                </button>
            </div>
        </form>
    );
}
