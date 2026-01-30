'use client';

import React, { useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { ImageIcon, X, Upload, Loader2 } from 'lucide-react';
import Image from 'next/image';

interface ImageUploadProps {
    value?: string;
    onChange: (url: string) => void;
    bucket?: string;
}

export function ImageUpload({ value, onChange, bucket = 'events' }: ImageUploadProps) {
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true);

            if (!event.target.files || event.target.files.length === 0) {
                return;
            }

            const file = event.target.files[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from(bucket)
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from(bucket)
                .getPublicUrl(filePath);

            onChange(publicUrl);
        } catch (error) {
            console.error('Error uploading image:', error);
            alert('Error uploading image!');
        } finally {
            setUploading(false);
        }
    };

    const removeImage = () => {
        onChange('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="space-y-4 w-full">
            <div className="flex items-center gap-4">
                <div
                    onClick={() => !uploading && fileInputRef.current?.click()}
                    className={`
                        relative group cursor-pointer
                        w-40 h-40 rounded-2xl border-2 border-dashed
                        flex flex-col items-center justify-center gap-2
                        transition-all duration-300
                        ${value
                            ? 'border-transparent bg-gray-50'
                            : 'border-gray-200 hover:border-navy-400 hover:bg-navy-50/50'}
                    `}
                >
                    {value ? (
                        <>
                            <Image
                                src={value}
                                alt="Uploaded"
                                fill
                                className="object-cover rounded-2xl"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center">
                                <Upload className="text-white h-8 w-8" />
                            </div>
                        </>
                    ) : (
                        <>
                            {uploading ? (
                                <Loader2 className="h-8 w-8 text-navy-400 animate-spin" />
                            ) : (
                                <ImageIcon className="h-8 w-8 text-gray-400" />
                            )}
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                                {uploading ? 'Uploading...' : 'Upload Image'}
                            </p>
                        </>
                    )}
                </div>

                {value && (
                    <button
                        type="button"
                        onClick={removeImage}
                        className="flex items-center gap-2 text-red-500 hover:text-red-600 transition-colors text-xs font-bold uppercase tracking-widest"
                    >
                        <X className="h-4 w-4" /> Remove
                    </button>
                )}
            </div>

            <input
                type="file"
                ref={fileInputRef}
                onChange={handleUpload}
                accept="image/*"
                className="hidden"
                disabled={uploading}
            />

            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-medium">
                Recommendation: Square or 16:9 ratio, max 2MB
            </p>
        </div>
    );
}
