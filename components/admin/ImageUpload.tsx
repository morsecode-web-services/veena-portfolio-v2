'use client';

import { getErrorMessage } from '@/utils/error-handling';
import React, { useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { ImageIcon, X, Upload, Loader2 } from 'lucide-react';
import Image from 'next/image';
import imageCompression from 'browser-image-compression';

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  bucket?: string;
}

export function ImageUpload({ value, onChange, bucket = 'events' }: ImageUploadProps) {
  const [status, setStatus] = useState<'idle' | 'compressing' | 'uploading'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!event.target.files || event.target.files.length === 0) {
        return;
      }

      const file = event.target.files[0];
      setStatus('compressing');

      // Compress image client-side to save bandwidth
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      };

      let uploadFile = file;
      try {
        uploadFile = await imageCompression(file, options);
      } catch (error) {
        console.error('Compression failed, using original file:', error);
      }

      setStatus('uploading');

      // 1. Try server-side admin upload route (with Bearer token)
      try {
        const formData = new FormData();
        formData.append('file', uploadFile);
        formData.append('bucket', bucket);

        const headers: Record<string, string> = {};
        try {
          const {
            data: { session },
          } = await supabase.auth.getSession();
          if (session?.access_token) {
            headers['Authorization'] = `Bearer ${session.access_token}`;
          }
        } catch {}

        const res = await fetch('/api/admin/upload', {
          method: 'POST',
          headers,
          body: formData,
        });

        if (res.ok) {
          const json = await res.json();
          if (json.success && json.publicUrl) {
            onChange(json.publicUrl);
            return;
          }
        }
      } catch (apiErr) {
        console.warn('Server upload fallback to client Supabase upload:', apiErr);
      }

      // 2. Client-side Supabase Storage fallback
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, uploadFile);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from(bucket).getPublicUrl(filePath);

      onChange(publicUrl);
    } catch (error) {
      console.error('Error uploading image:', error);
      alert(getErrorMessage(error));
    } finally {
      setStatus('idle');
    }
  };

  const removeImage = async () => {
    if (!value) return;

    try {
      // Extract storage path from public URL
      const match = value.match(/\/([^\/]+\/[^\/]+)$/);
      const filePath = match ? match[1] : value.split('/').pop();

      if (filePath) {
        // Delete from storage
        const { error } = await supabase.storage.from(bucket).remove([filePath]);

        if (error) {
          console.warn('Could not delete image from storage:', error);
        }
      }
    } catch (error) {
      console.error('Error removing image:', error);
    }

    // Clear the form value
    onChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4 w-full">
      <div className="flex items-center gap-4">
        <div
          onClick={() => status === 'idle' && fileInputRef.current?.click()}
          className={`
                        relative group cursor-pointer
                        w-40 h-40 rounded-2xl border-2 border-dashed
                        flex flex-col items-center justify-center gap-2
                        transition-all duration-300
                        ${
                          value
                            ? 'border-transparent bg-gray-50'
                            : 'border-gray-200 hover:border-navy-400 hover:bg-navy-50/50'
                        }
                    `}
        >
          {value ? (
            <>
              <Image src={value} alt="Uploaded" fill className="object-cover rounded-2xl" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center">
                <Upload className="text-white h-8 w-8" />
              </div>
            </>
          ) : (
            <>
              <div className="p-3 rounded-full bg-gray-50 group-hover:bg-white text-gray-400 group-hover:text-navy-600 transition-colors shadow-xs">
                <ImageIcon className="h-6 w-6" />
              </div>
              <div className="text-center">
                <p className="text-xs font-semibold text-gray-700">Click to upload</p>
                <p className="text-[10px] text-gray-400 mt-0.5">PNG, JPG up to 5MB</p>
              </div>
            </>
          )}

          {status !== 'idle' && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-xs rounded-2xl flex flex-col items-center justify-center gap-2 z-10">
              <Loader2 className="h-6 w-6 animate-spin text-navy-600" />
              <p className="text-[11px] font-medium text-gray-600 capitalize">
                {status === 'compressing' ? 'Optimizing...' : 'Uploading...'}
              </p>
            </div>
          )}
        </div>

        {value && (
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={removeImage}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
            >
              <X className="h-3.5 w-3.5" />
              Remove Image
            </button>
            <p className="text-[11px] text-gray-400 max-w-[200px] truncate">{value}</p>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleUpload}
        className="hidden"
      />
    </div>
  );
}
