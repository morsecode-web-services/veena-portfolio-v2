'use client';

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Save,
  X,
  Image as ImageIcon,
  Search as SeoIcon,
  ChevronDown,
  ChevronUp,
  Eye,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ImageUpload } from './ImageUpload';
import TipTapEditor from './TipTapEditor';
import { Blog, NewBlog } from '@/types/blog';

const blogSchema = z.object({
  title: z.string().min(3, 'Title is required'),
  slug: z
    .string()
    .min(3, 'Slug is required')
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric and hyphens only'),
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
  const [showSeo, setShowSeo] = React.useState(true);
  const [keywordInput, setKeywordInput] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    getValues,
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

  // Watch form values
  const content = watch('content');
  const imageUrl = watch('image_url');
  const keywords = watch('keywords');
  const title = watch('title');
  const slug = watch('slug');

  // Word count and reading time utilities
  const getWordCount = (html: string): number => {
    if (!html) return 0;
    const text = html
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return text.split(' ').filter((word) => word.length > 0).length;
  };

  const getReadingTime = (wordCount: number): number => {
    return Math.ceil(wordCount / 200); // 200 words per minute average
  };

  const wordCount = getWordCount(content);
  const readingTime = getReadingTime(wordCount);

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
  }, [
    content,
    title,
    setValue,
    watch,
    isExcerptManuallyEdited,
    isMetaTitleManuallyEdited,
    isMetaDescManuallyEdited,
  ]);

  // Warn before leaving with unsaved changes
  React.useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

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

  // Auto-save logic
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Load draft on mount
  useEffect(() => {
    if (!initialData) {
      // Only for new posts for now to avoid conflicts
      const savedDraft = localStorage.getItem('blog_draft_new');
      if (savedDraft) {
        try {
          const parsed = JSON.parse(savedDraft);
          const shouldRestore = window.confirm(
            'Found an unsaved draft. Do you want to restore it?'
          );
          if (shouldRestore) {
            Object.keys(parsed).forEach((key) => {
              setValue(key as any, parsed[key], { shouldDirty: true });
            });
            // addToast('Draft restored!', 'info'); // Removed as addToast is not available
          } else {
            localStorage.removeItem('blog_draft_new');
          }
        } catch (e) {
          console.error('Failed to parse draft', e);
        }
      }
    }
  }, [initialData, setValue]); // addToast is stable from hook usage in parent, but passing it down might be needed?
  // Wait, addToast is not available here unless I pass it or use context.
  // I will use alert for restore confirmation (window.confirm) and just console log for save success,
  // or rely on the "Last saved" text. I don't have addToast prop here.
  // I can add `addToast` to props? Or just skip toast for auto-save actions to avoid spam.

  // Save draft periodically
  useEffect(() => {
    const timer = setInterval(() => {
      if (isDirty) {
        const formData = getValues();
        // Only save if we have at least a title or content
        if (formData.title || formData.content) {
          localStorage.setItem('blog_draft_new', JSON.stringify(formData));
          setLastSaved(new Date());
        }
      }
    }, 30000); // 30 seconds

    return () => clearInterval(timer);
  }, [isDirty, getValues]);

  // Clear draft on successful submit
  const handleFormSubmit = async (data: BlogFormSchema) => {
    await onSubmit(data as NewBlog);
    localStorage.removeItem('blog_draft_new');
  };

  const handlePreview = () => {
    const formData = watch();
    // Construct a partial Blog object for preview
    const previewData = {
      ...initialData, // Keep existing ID, dates, etc if editing
      ...formData,
      created_at: initialData?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      author: formData.author || 'You',
    };

    sessionStorage.setItem('blog_preview_data', JSON.stringify(previewData));
    window.open('/admin/blogs/preview', '_blank');
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6 max-w-5xl mx-auto">
      {/* Main Content Card */}
      <div className="bg-white rounded border border-slate-200 shadow-none overflow-hidden">
        <div className="p-5 space-y-6">
          {/* Header info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Blog Title
              </label>
              <input
                {...register('title')}
                className={`w-full px-3 py-2 bg-slate-50 border ${errors.title ? 'border-red-500' : 'border-slate-200'} rounded focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-900 transition-all font-sans text-sm font-semibold text-slate-800`}
                placeholder="Enter a compelling title..."
              />
              {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title.message}</p>}
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Category
              </label>
              <select
                {...register('category')}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-900 transition-all text-xs font-semibold text-slate-805"
              >
                <option value="Music">Music</option>
                <option value="Life">Life</option>
                <option value="Art">Art</option>
                <option value="Process">Process</option>
              </select>
            </div>
          </div>

          <div className="space-y-2 border-t border-slate-100 pt-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Status</span>
              <span
                className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded border ${
                  watch('is_published')
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}
              >
                {watch('is_published') ? 'Published' : 'Draft'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Visibility</span>
              <span className="text-xs text-slate-800 font-semibold">Public</span>
            </div>
            {lastSaved && (
              <div className="flex items-center justify-between pt-1 border-t border-dashed border-slate-100">
                <span className="text-[10px] font-medium text-slate-400">Auto-saved</span>
                <span className="text-[10px] text-slate-850 font-medium">
                  {format(lastSaved, 'h:mm a')}
                </span>
              </div>
            )}
          </div>

          {/* Editor Section */}
          <div className="border-t border-slate-100 pt-4">
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Post Content
              </label>
              {wordCount > 0 && (
                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <span>📝 {wordCount.toLocaleString()} words</span>
                  <span className="text-slate-300">·</span>
                  <span>⏱️ {readingTime} min read</span>
                </div>
              )}
            </div>
            <TipTapEditor
              content={content}
              onChange={(val) => {
                setValue('content', val, { shouldDirty: true, shouldValidate: true });
              }}
            />
            {errors.content && (
              <p className="mt-2 text-xs text-red-500">{errors.content.message}</p>
            )}
          </div>

          {/* Excerpt */}
          <div className="border-t border-slate-100 pt-4">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Short Excerpt
            </label>
            <textarea
              {...register('excerpt', {
                onChange: () => setIsExcerptManuallyEdited(true),
              })}
              rows={2}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-900 transition-all text-xs text-slate-800 resize-none"
              placeholder="A brief summary for the blog listing page..."
            />
          </div>

          {/* Slug */}
          <div className="border-t border-slate-100 pt-4">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              URL Slug
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-mono">
                /blog/
              </span>
              <input
                {...register('slug', {
                  onChange: () => setIsSlugManuallyEdited(true),
                })}
                className={`w-full pl-12 pr-3 py-2 bg-slate-50 border ${errors.slug ? 'border-red-500' : 'border-slate-200'} rounded focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-900 transition-all text-xs font-mono text-slate-850`}
                placeholder="url-friendly-slug"
              />
            </div>
            {errors.slug && <p className="mt-1 text-xs text-red-500">{errors.slug.message}</p>}
          </div>
        </div>

        {/* Status Bar */}
        <div className="bg-slate-50 border-t border-slate-200 p-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_published"
                {...register('is_published')}
                className="w-4 h-4 rounded border-slate-350 text-slate-900 focus:ring-slate-900 cursor-pointer"
              />
              <label
                htmlFor="is_published"
                className="text-xs font-bold text-slate-700 cursor-pointer select-none uppercase tracking-wider"
              >
                Publish Post
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Assets & SEO Sidebar/Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Image Section */}
        <div className="bg-white rounded border border-slate-200 p-5 space-y-4 shadow-none">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200 pb-2.5 flex items-center gap-1.5">
            <ImageIcon className="h-3.5 w-3.5 text-slate-400" /> Featured Image
          </h3>
          <ImageUpload
            value={imageUrl || ''}
            onChange={(url) => setValue('image_url', url, { shouldDirty: true })}
            bucket="blog-assets"
          />
        </div>

        {/* SEO Section */}
        <div className="bg-white rounded border border-slate-200 p-5 space-y-4 shadow-none">
          <button
            type="button"
            onClick={() => setShowSeo(!showSeo)}
            className="w-full text-left focus:outline-none"
          >
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200 pb-2.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <SeoIcon className="h-3.5 w-3.5 text-slate-400" /> SEO Optimization
              </span>
              {showSeo ? (
                <ChevronUp className="h-3.5 w-3.5 text-slate-400" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
              )}
            </h3>
          </button>

          {showSeo && (
            <div className="space-y-4 pt-1">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Meta Title
                </label>
                <input
                  {...register('meta_title', {
                    onChange: () => setIsMetaTitleManuallyEdited(true),
                  })}
                  className="w-full px-3 py-2 border border-slate-200 rounded text-xs focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-900 transition-all bg-slate-50/50 text-slate-800"
                  placeholder="Defaults to post title"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Meta Description
                </label>
                <textarea
                  {...register('meta_description', {
                    onChange: () => setIsMetaDescManuallyEdited(true),
                  })}
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-200 rounded text-xs focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-900 resize-none transition-all bg-slate-50/50 text-slate-800"
                  placeholder="Brief description for search results..."
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Keywords
                </label>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    onKeyDown={addKeyword}
                    className="w-full px-3 py-2 border border-slate-200 rounded text-xs focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-900 transition-all bg-slate-50/50 text-slate-800"
                    placeholder="Type keyword and press Enter..."
                  />
                  <div className="flex flex-wrap gap-1.5">
                    {keywords.map((kw, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-700 text-[9px] font-bold uppercase rounded border border-slate-200"
                      >
                        {kw}
                        <button
                          onClick={() => removeKeyword(i)}
                          type="button"
                          className="focus:outline-none"
                        >
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
      <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200 bg-slate-50/80 backdrop-blur-sm sticky bottom-0 z-20 pb-2">
        <button
          type="button"
          onClick={() => {
            if (isDirty) {
              if (confirm('Discard unsaved changes?')) router.back();
            } else {
              router.back();
            }
          }}
          className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 font-semibold rounded hover:bg-slate-50 transition-colors uppercase tracking-wider text-[10px] shadow-none cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handlePreview}
          className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 font-semibold rounded hover:bg-slate-50 transition-colors uppercase tracking-wider text-[10px] shadow-none flex items-center gap-1.5 cursor-pointer"
        >
          <Eye className="h-3.5 w-3.5" /> Preview
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-1.5 bg-slate-900 text-white font-semibold rounded hover:bg-slate-800 transition-colors uppercase tracking-wider text-[10px] flex items-center gap-1.5 disabled:bg-slate-200 cursor-pointer"
        >
          {loading ? (
            'Saving...'
          ) : (
            <>
              <Save className="h-3.5 w-3.5" /> Save Blog Post
            </>
          )}
        </button>
      </div>
    </form>
  );
}
