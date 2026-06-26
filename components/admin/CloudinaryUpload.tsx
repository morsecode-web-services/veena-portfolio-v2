'use client';

import React from 'react';
import { X, Upload, Image as LucideImage } from 'lucide-react';
import Image from 'next/image';
import { CldUploadWidget } from 'next-cloudinary';

interface CloudinaryUploadProps {
  value?: string;
  onChange: (url: string) => void;
  folder?: string;
  label?: string;
}

/**
 * CloudinaryUpload Component
 * Uses the official Cloudinary Upload Widget for a premium admin experience.
 */
export function CloudinaryUpload({
  value,
  onChange,
  folder = 'portfolio-v2',
  label = 'Upload Image',
}: CloudinaryUploadProps) {
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'portfolio_uploads';

  return (
    <div className="space-y-4 w-full">
      <div className="flex items-center gap-4">
        <CldUploadWidget
          uploadPreset={uploadPreset}
          options={{
            folder,
            maxFiles: 1,
            clientAllowedFormats: ['image'],
            sources: ['local', 'url', 'camera', 'google_drive', 'instagram'],
          }}
          onSuccess={(result) => {
            if (result.info && typeof result.info === 'object' && 'secure_url' in result.info) {
              onChange(result.info.secure_url as string);
            }
          }}
        >
          {({ open }) => {
            return (
              <div
                onClick={(e) => {
                  e.preventDefault();
                  open();
                }}
                className={`
                                    relative group cursor-pointer
                                    w-48 h-32 rounded-xl border-2 border-dashed
                                    flex flex-col items-center justify-center gap-2
                                    transition-all duration-300 overflow-hidden
                                    ${
                                      value
                                        ? 'border-transparent bg-slate-50'
                                        : 'border-slate-200 hover:border-gold-400 hover:bg-gold-50/50'
                                    }
                                `}
              >
                {value ? (
                  <>
                    <Image
                      src={value}
                      alt="Preview"
                      fill
                      className="object-cover transition-transform group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Upload className="text-white h-6 w-6" />
                    </div>
                  </>
                ) : (
                  <>
                    <LucideImage className="h-6 w-6 text-slate-300" />
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center px-4">
                      {label}
                    </p>
                  </>
                )}
              </div>
            );
          }}
        </CldUploadWidget>

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
    </div>
  );
}
