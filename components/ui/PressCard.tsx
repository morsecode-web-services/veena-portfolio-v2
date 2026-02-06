'use client';

import Image from 'next/image';
import { PressArticle } from '@/types';
import { FiExternalLink } from 'react-icons/fi';
import { getAssetPath } from '@/lib/config';
import { Card } from '@/components/system/Card';

interface PressCardProps {
  article: PressArticle;
}

export default function PressCard({ article }: PressCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <article>
      <a
        href={article.url}
        target="_blank"
        rel="noopener noreferrer"
        className="group block"
        aria-label={`Read article: ${article.title} from ${article.publication} (opens in new tab)`}
      >
        <Card variant="default" padding="none" hoverable className="overflow-hidden">
          {article.imageUrl ? (
            <div className="relative w-full h-40 overflow-hidden bg-slate-100">
              <Image
                src={getAssetPath(article.imageUrl)}
                alt={article.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
          ) : (
            <div className="w-full h-40 bg-navy-50 flex items-center justify-center">
              <svg className="w-12 h-12 text-navy-200" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
              </svg>
            </div>
          )}

          {/* Card Content */}
          <div className="p-4 sm:p-5">
          {/* Publication and Date */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gold-600 uppercase tracking-wide">
              {article.publication}
            </span>
            <span className="text-xs text-slate-500">
              {formatDate(article.date)}
            </span>
          </div>

          {/* Title */}
          <h3 className="text-lg font-serif font-semibold text-navy-900 mb-2 group-hover:text-gold-600 transition-colors duration-300 line-clamp-2 leading-snug">
            {article.title}
          </h3>

          {/* Excerpt */}
          <p className="text-charcoal-700 text-xs sm:text-sm leading-relaxed mb-3 line-clamp-3">
            {article.excerpt}
          </p>

          {/* Read More Link */}
          <div className="flex items-center text-gold-600 text-sm font-medium group-hover:text-gold-700 transition-colors duration-300">
            <span className="mr-1.5">Read Full Article</span>
            <FiExternalLink className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-300" aria-hidden="true" />
          </div>
        </div>
        </Card>
      </a>
    </article>
  );
}
