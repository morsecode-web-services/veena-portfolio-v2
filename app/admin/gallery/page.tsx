'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/context/ToastContext';
import { Button } from '@/components/system/Button';
import { EmptyState } from '@/components/system/EmptyState';
import { Loader2, Plus, Trash2, Edit2, Check, X, Upload } from 'lucide-react';

interface GalleryImage {
    id: string;
    src: string;
    alt: string;
    caption?: string;
    width: number;
    height: number;
    created_at?: string;
}

export default function GalleryAdminPage() {
    const [images, setImages] = useState<GalleryImage[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const { addToast } = useToast();
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<{ alt: string; caption: string }>({ alt: '', caption: '' });

    useEffect(() => {
        fetchImages();
    }, []);

    const fetchImages = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('gallery_images')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setImages(data || []);
        } catch (error) {
            console.error('Error fetching gallery images:', error);
            // Don't show error toast on initial load as table might not exist yet
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        try {
            const file = e.target.files?.[0];
            if (!file) return;

            setUploading(true);
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
            const filePath = `gallery/${fileName}`;

            // 1. Upload to Storage
            const { error: uploadError } = await supabase.storage
                .from('images')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // 2. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('images')
                .getPublicUrl(filePath);

            // 3. Get Dimensions (optional, can be done with an image object)
            const img = new window.Image();
            img.src = publicUrl;
            await new Promise((resolve) => {
                img.onload = resolve;
            });

            // 4. Insert into DB
            const { data: newImage, error: dbError } = await supabase
                .from('gallery_images')
                .insert([
                    {
                        src: publicUrl,
                        alt: file.name.split('.')[0], // Default alt text
                        width: img.width,
                        height: img.height,
                        caption: '',
                    },
                ])
                .select()
                .single();

            if (dbError) throw dbError;

            setImages([newImage, ...images]);
            addToast('Image uploaded successfully', 'success');
        } catch (error: any) {
            console.error('Upload error:', error);
            addToast(error.message || 'Failed to upload image', 'error');
        } finally {
            setUploading(false);
            // Reset input
            e.target.value = '';
        }
    };

    const handleDelete = async (id: string, src: string) => {
        if (!confirm('Are you sure you want to delete this image?')) return;

        try {
            // 1. Delete from DB
            const { error: dbError } = await supabase
                .from('gallery_images')
                .delete()
                .eq('id', id);

            if (dbError) throw dbError;

            // 2. Delete from Storage (extract path from URL)
            // Assuming URL format: .../storage/v1/object/public/images/gallery/filename.jpg
            const path = src.split('/images/')[1];
            if (path) {
                const { error: storageError } = await supabase.storage
                    .from('images')
                    .remove([path]);

                if (storageError) console.warn('Storage delete warning:', storageError);
            }

            setImages(images.filter((img) => img.id !== id));
            addToast('Image deleted successfully', 'success');
        } catch (error: any) {
            console.error('Delete error:', error);
            addToast('Failed to delete image', 'error');
        }
    };

    const startEdit = (image: GalleryImage) => {
        setEditingId(image.id);
        setEditForm({ alt: image.alt, caption: image.caption || '' });
    };

    const saveEdit = async () => {
        if (!editingId) return;

        try {
            const { error } = await supabase
                .from('gallery_images')
                .update({
                    alt: editForm.alt,
                    caption: editForm.caption,
                })
                .eq('id', editingId);

            if (error) throw error;

            setImages(images.map((img) =>
                img.id === editingId
                    ? { ...img, alt: editForm.alt, caption: editForm.caption }
                    : img
            ));

            setEditingId(null);
            addToast('Image details updated', 'success');
        } catch (error: any) {
            console.error('Update error:', error);
            addToast('Failed to update details', 'error');
        }
    };

    const fileInputRef = React.useRef<HTMLInputElement>(null);

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-navy-900">Gallery Management</h1>
                    <p className="text-slate-600 mt-1">Manage your portfolio images dynamically</p>
                </div>

                <div className="relative">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleUpload}
                        className="hidden"
                        id="gallery-upload"
                        disabled={uploading}
                    />
                    <Button
                        variant="primary"
                        disabled={uploading}
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-2"
                    >
                        {uploading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Upload className="w-4 h-4" />
                        )}
                        {uploading ? 'Uploading...' : 'Upload Image'}
                    </Button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-navy-500" />
                </div>
            ) : images.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
                    <div className="max-w-md mx-auto">
                        <h3 className="text-lg font-medium text-navy-900 mb-2">No dynamic images yet</h3>
                        <p className="text-slate-500 mb-6">
                            Gallery is currently using static configuration from site-config.json.
                            Upload images here to start using the dynamic gallery system.
                        </p>
                        <p className="text-xs text-slate-400 bg-white p-3 rounded border border-slate-200 inline-block text-left">
                            <strong>Required Supabase Setup:</strong><br />
                            Table: <code>gallery_images</code> (src, alt, caption, width, height)<br />
                            Bucket: <code>images</code> (public)
                        </p>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {images.map((image) => (
                        <div key={image.id} className="bg-white rounded-lg shadow-sm overflow-hidden border border-slate-100 group">
                            <div className="relative aspect-[4/3] bg-slate-100">
                                <Image
                                    src={image.src}
                                    alt={image.alt}
                                    fill
                                    className="object-cover"
                                />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                    <button
                                        onClick={() => startEdit(image)}
                                        className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-sm transition-colors"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(image.id, image.src)}
                                        className="p-2 bg-red-500/80 hover:bg-red-500 text-white rounded-full backdrop-blur-sm transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="p-4">
                                {editingId === image.id ? (
                                    <div className="space-y-3">
                                        <div>
                                            <label className="text-xs font-medium text-slate-500 block mb-1">Caption</label>
                                            <input
                                                type="text"
                                                value={editForm.caption}
                                                onChange={(e) => setEditForm(prev => ({ ...prev, caption: e.target.value }))}
                                                className="w-full text-sm border-slate-200 rounded px-2 py-1 focus:ring-2 focus:ring-navy-500"
                                                placeholder="Image caption"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium text-slate-500 block mb-1">Alt Text</label>
                                            <input
                                                type="text"
                                                value={editForm.alt}
                                                onChange={(e) => setEditForm(prev => ({ ...prev, alt: e.target.value }))}
                                                className="w-full text-sm border-slate-200 rounded px-2 py-1 focus:ring-2 focus:ring-navy-500"
                                                placeholder="Alt text"
                                            />
                                        </div>
                                        <div className="flex justify-end gap-2 pt-1">
                                            <button
                                                onClick={() => setEditingId(null)}
                                                className="p-1 text-slate-400 hover:text-slate-600"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={saveEdit}
                                                className="p-1 text-green-600 hover:text-green-700"
                                            >
                                                <Check className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        <p className="text-sm font-medium text-navy-900 line-clamp-1">
                                            {image.caption || <span className="text-slate-400 italic">No caption</span>}
                                        </p>
                                        <p className="text-xs text-slate-500 mt-1 line-clamp-1">{image.alt}</p>
                                        <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                                            <span>{image.width} × {image.height}</span>
                                            <span>{new Date(image.created_at || Date.now()).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
