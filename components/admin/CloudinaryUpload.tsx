'use client';

import React, { useState, useRef } from 'react';
import { X, Upload, Loader2, Image as LucideImage } from 'lucide-react';
import Image from 'next/image';

interface CloudinaryUploadProps {
    value?: string;
    onChange: (url: string) => void;
    folder?: string;
    label?: string;
}

/**
 * CloudinaryUpload Component
 * Uses unsigned uploads with the 'portfolio_uploads' preset
 * to save images directly to Cloudinary and return the secure URL.
 */
export function CloudinaryUpload({ 
    value, 
    onChange, 
    folder = 'portfolio-v2', 
    label = 'Upload Image' 
}: CloudinaryUploadProps) {
    const [status, setStatus] = useState<'idle' | 'uploading'>('idle');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            if (!event.target.files || event.target.files.length === 0) return;
            
            if (!cloudName || !uploadPreset) {
                console.error('Cloudinary Environment Variables Missing:', { cloudName, uploadPreset });
                alert('Cloudinary is not fully configured in environment variables. Please check NEXT_PUBLIC_CLOUDINARY_CLOUD and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET.');
                return;
            }

            const file = event.target.files[0];
            
            // Limit file size (Cloudinary free tier limit is roughly 10MB per image, we'll suggest 4MB)
            if (file.size > 4 * 1024 * 1024) {
                alert('File is too large. Please keep images under 4MB.');
                return;
            }

            setStatus('uploading');

            const formData = new FormData();
            formData.append('file', file);
            formData.append('upload_preset', uploadPreset);
            formData.append('folder', folder);

            const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
                method: 'POST',
                body: formData
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error?.message || 'Upload failed');
            }

            const data = await res.json();
            
            // data.secure_url is the full HTTPS URL
            onChange(data.secure_url);
        } catch (error: any) {
            console.error('Error uploading to Cloudinary:', error);
            alert(`Upload failed: ${error.message}`);
        } finally {
            setStatus('idle');
        }
    };

    return (
        <div className="space-y-4 w-full">
            <div className="flex items-center gap-4">
                <div
                    onClick={() => status === 'idle' && fileInputRef.current?.click()}
                    className={`
                        relative group cursor-pointer
                        w-48 h-32 rounded-xl border-2 border-dashed
                        flex flex-col items-center justify-center gap-2
                        transition-all duration-300 overflow-hidden
                        ${value
                            ? 'border-transparent bg-slate-50'
                            : 'border-slate-200 hover:border-gold-400 hover:bg-gold-50/50'}
                    `}
                >
                    {value ? (
                        <>
                            <Image
                                src={value}
                                alt="Preview"
                                fill
                                className="object-cover transition-transform group-hover:scale-105"
                                // Loader handles optimization automatically
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Upload className="text-white h-6 w-6" />
                            </div>
                        </>
                    ) : (
                        <>
                            {status === 'uploading' ? (
                                <Loader2 className="h-6 w-6 text-gold-500 animate-spin" />
                            ) : (
                                <LucideImage className="h-6 w-6 text-slate-300" />
                            )}
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center px-4">
                                {status === 'uploading' ? 'Uploading...' : label}
                            </p>
                        </>
                    )}
                </div>

                {value && (
                    <button
                        type="button"
                        onClick={() => onChange('')}
                        className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-red-500 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1.5"
                    >
                        <X className="h-3.5 w-3.5" /> Remove
                    </button>
                )}
            </div>

            <input
                type="file"
                ref={fileInputRef}
                onChange={handleUpload}
                accept="image/*"
                className="hidden"
                disabled={status !== 'idle'}
            />
        </div>
    );
}
