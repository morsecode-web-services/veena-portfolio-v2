'use client';

import Image from 'next/image';
import { PressArticle } from '@/types';
import { FiExternalLink } from 'react-icons/fi';

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
        className="group block bg-white rounded-lg overflow-hidden shadow-elegant hover:shadow-elegant-lg transition-all duration-300 transform hover:-translate-y-1"
        aria-label={`Read article: ${article.title} from ${article.publication} (opens in new tab)`}
      >
        {/* Optional Image */}
        {article.imageUrl && (
          <div className="relative w-full h-40 overflow-hidden bg-gray-100">
            <Image
              src={article.imageUrl}
              alt={article.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </div>
        )}

        {/* Card Content */}
        <div className="p-4 sm:p-5">
          {/* Publication and Date */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] sm:text-xs font-semibold text-gold-600 uppercase tracking-wide">
              {article.publication}
            </span>
            <span className="text-[10px] sm:text-xs text-gray-500">
              {formatDate(article.date)}
            </span>
          </div>

          {/* Title */}
          <h3 className="text-lg font-serif font-semibold text-navy-900 mb-2 group-hover:text-gold-600 transition-colors duration-300 line-clamp-2 leading-snug">
            {article.title}
          </h3>

          {/* Excerpt */}
          <p className="text-gray-700 text-xs sm:text-sm leading-relaxed mb-3 line-clamp-3">
            {article.excerpt}
          </p>

          {/* Read More Link */}
          <div className="flex items-center text-gold-600 text-sm font-medium group-hover:text-gold-700 transition-colors duration-300">
            <span className="mr-1.5">Read Full Article</span>
            <FiExternalLink className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-300" aria-hidden="true" />
          </div>
        </div>
      </a>
    </article>
  );
}
