'use client';

import { ImageOff, Music, Calendar, FileText, Inbox } from 'lucide-react';

export interface EmptyStateProps {
  variant?: 'gallery' | 'music' | 'events' | 'blog' | 'default';
  title?: string;
  description?: string;
  className?: string;
}

/**
 * Empty state component with icon and message for different content types
 *
 * @param variant - Type of empty content (default: 'default')
 * @param title - Custom title (optional, defaults based on variant)
 * @param description - Custom description (optional, defaults based on variant)
 */
export function EmptyState({
  variant = 'default',
  title,
  description,
  className = '',
}: EmptyStateProps) {
  const getIcon = () => {
    switch (variant) {
      case 'gallery':
        return <ImageOff className="w-12 h-12 sm:w-16 sm:h-16 text-slate-300" />;
      case 'music':
        return <Music className="w-12 h-12 sm:w-16 sm:h-16 text-slate-300" />;
      case 'events':
        return <Calendar className="w-12 h-12 sm:w-16 sm:h-16 text-slate-300" />;
      case 'blog':
        return <FileText className="w-12 h-12 sm:w-16 sm:h-16 text-slate-300" />;
      default:
        return <Inbox className="w-12 h-12 sm:w-16 sm:h-16 text-slate-300" />;
    }
  };

  const getDefaultTitle = () => {
    switch (variant) {
      case 'gallery':
        return 'No images yet';
      case 'music':
        return 'No videos yet';
      case 'events':
        return 'No events scheduled';
      case 'blog':
        return 'No posts yet';
      default:
        return 'No content available';
    }
  };

  const getDefaultDescription = () => {
    switch (variant) {
      case 'gallery':
        return 'Gallery images will appear here once they are added.';
      case 'music':
        return 'Music videos and performances will be displayed here.';
      case 'events':
        return 'Upcoming performances and events will be listed here.';
      case 'blog':
        return 'New blog posts and articles will appear here.';
      default:
        return 'Content will be displayed here when available.';
    }
  };

  return (
    <div
      className={`flex flex-col items-center justify-center py-16 sm:py-20 md:py-24 px-4 ${className}`.trim()}
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col items-center text-center max-w-md">
        {/* Icon */}
        <div className="mb-4 sm:mb-6">{getIcon()}</div>

        {/* Title */}
        <h3 className="text-lg sm:text-xl font-serif font-semibold text-slate-600 mb-2">
          {title || getDefaultTitle()}
        </h3>

        {/* Description */}
        <p className="text-sm sm:text-base text-slate-500 leading-relaxed">
          {description || getDefaultDescription()}
        </p>
      </div>
    </div>
  );
}
