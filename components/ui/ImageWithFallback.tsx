'use client';

import { useState, useEffect } from 'react';
import Image, { ImageProps } from 'next/image';
import { CldImage } from 'next-cloudinary';
import { m } from 'framer-motion';
import { getAssetPath } from '@/lib/config';

interface ImageWithFallbackProps extends Omit<ImageProps, 'onError'> {
  fallbackSrc?: string;
  showErrorMessage?: boolean;
  retryCount?: number;
}

/**
 * Image component with fallback handling and retry logic
 * Displays a fallback image or error message when the primary image fails to load
 */
export default function ImageWithFallback({
  src,
  alt,
  fallbackSrc = '/images/placeholder.jpg',
  showErrorMessage = false,
  retryCount = 2,
  ...props
}: ImageWithFallbackProps) {
  const [imgSrc, setImgSrc] = useState(src);
  const [hasError, setHasError] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [triedFallback, setTriedFallback] = useState(false);

  // Sync state when src prop changes
  useEffect(() => {
    setImgSrc(getAssetPath(src as string));
    setHasError(false);
    setAttempts(0);
    setIsRetrying(false);
    setTriedFallback(false);
  }, [src]);

  const handleError = () => {
    if (attempts < retryCount) {
      // Retry loading the current image
      setIsRetrying(true);
      setAttempts((prev) => prev + 1);

      // Add a small delay before retrying
      setTimeout(
        () => {
          const retrySrc = `${triedFallback ? fallbackSrc : src}${(triedFallback ? fallbackSrc : src).toString().includes('?') ? '&' : '?'}retry=${attempts + 1}`;
          setImgSrc(getAssetPath(retrySrc));
          setIsRetrying(false);
        },
        1000 * (attempts + 1)
      ); // Exponential backoff
    } else if (!triedFallback) {
      // Try fallback image
      setImgSrc(getAssetPath(fallbackSrc));
      setAttempts(0);
      setTriedFallback(true);
    } else {
      // Both primary and fallback failed - stop trying
      setHasError(true);
    }
  };

  if (hasError && showErrorMessage) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg">
        <div className="text-center p-4">
          <svg
            className="w-12 h-12 text-gray-400 mx-auto mb-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <p className="text-sm text-gray-500">{alt || 'Image unavailable'}</p>
        </div>
      </div>
    );
  }

  if (hasError && !showErrorMessage) {
    // Silent failure - just show placeholder
    return <div className="w-full h-full bg-gray-200 rounded-lg" aria-label={alt} />;
  }

  const isCloudinary = typeof imgSrc === 'string' && imgSrc.includes('cloudinary.com');

  return (
    <>
      {isCloudinary ? (
        <CldImage
          {...props}
          src={imgSrc as string}
          alt={alt}
          onError={handleError}
          sizes={props.sizes || '(max-width: 768px) 100vw, 100vw'}
        />
      ) : (
        <Image {...props} src={imgSrc} alt={alt} onError={handleError} />
      )}
      {isRetrying && (
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 flex items-center justify-center bg-gray-900/50 rounded-lg"
        >
          <div className="text-white text-sm">Retrying...</div>
        </m.div>
      )}
    </>
  );
}
