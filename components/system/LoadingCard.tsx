'use client';

export interface LoadingCardProps {
  variant?: 'video' | 'event' | 'gallery' | 'blog' | 'default';
  count?: number;
}

/**
 * Skeleton loading card component for different content types
 *
 * @param variant - Type of content being loaded (default: 'default')
 * @param count - Number of loading cards to display (default: 1)
 */
export function LoadingCard({ variant = 'default', count = 1 }: LoadingCardProps) {
  const cards = Array.from({ length: count }, (_, i) => i);

  const renderSkeleton = () => {
    switch (variant) {
      case 'video':
        return (
          <div className="bg-white rounded-xl shadow-premium overflow-hidden animate-pulse">
            {/* Video thumbnail skeleton */}
            <div className="aspect-video bg-slate-200" />
            {/* Title skeleton */}
            <div className="p-5">
              <div className="h-4 bg-slate-200 rounded w-3/4 mx-auto" />
            </div>
          </div>
        );

      case 'event':
        return (
          <div className="bg-white rounded-2xl shadow-premium border border-navy-50 overflow-hidden animate-pulse">
            {/* Event image skeleton */}
            <div className="h-56 bg-slate-200" />
            {/* Content skeleton */}
            <div className="p-6 space-y-4">
              {/* Category */}
              <div className="h-3 bg-slate-200 rounded w-20" />
              {/* Title */}
              <div className="h-6 bg-slate-200 rounded w-full" />
              {/* Details */}
              <div className="space-y-2">
                <div className="h-4 bg-slate-200 rounded w-2/3" />
                <div className="h-4 bg-slate-200 rounded w-1/2" />
              </div>
            </div>
          </div>
        );

      case 'gallery':
        return (
          <div className="aspect-[3/2] bg-slate-200 rounded-lg animate-pulse shadow-md" />
        );

      case 'blog':
        return (
          <div className="bg-white rounded-2xl shadow-premium overflow-hidden animate-pulse">
            {/* Blog cover skeleton */}
            <div className="aspect-[16/10] bg-slate-200" />
            {/* Content skeleton */}
            <div className="p-6 space-y-4">
              {/* Meta */}
              <div className="flex gap-4">
                <div className="h-3 bg-slate-200 rounded w-24" />
                <div className="h-3 bg-slate-200 rounded w-20" />
              </div>
              {/* Title */}
              <div className="space-y-2">
                <div className="h-6 bg-slate-200 rounded w-full" />
                <div className="h-6 bg-slate-200 rounded w-4/5" />
              </div>
              {/* Excerpt */}
              <div className="space-y-2">
                <div className="h-4 bg-slate-200 rounded w-full" />
                <div className="h-4 bg-slate-200 rounded w-full" />
                <div className="h-4 bg-slate-200 rounded w-3/4" />
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="bg-white rounded-xl shadow-premium p-6 animate-pulse">
            <div className="space-y-3">
              <div className="h-4 bg-slate-200 rounded w-3/4" />
              <div className="h-4 bg-slate-200 rounded w-full" />
              <div className="h-4 bg-slate-200 rounded w-5/6" />
            </div>
          </div>
        );
    }
  };

  if (count === 1) {
    return (
      <div role="status" aria-label="Loading content">
        {renderSkeleton()}
        <span className="sr-only">Loading content...</span>
      </div>
    );
  }

  return (
    <>
      {cards.map((i) => (
        <div key={i} role="status" aria-label="Loading content">
          {renderSkeleton()}
          {i === 0 && <span className="sr-only">Loading content...</span>}
        </div>
      ))}
    </>
  );
}
