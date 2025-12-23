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
          <div className="relative w-full h-48 overflow-hidden bg-gray-100">
            <Image
              src={article.imageUrl}
              alt={article.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </div>
        )}

        {/* Card Content */}
        <div className="p-6">
          {/* Publication and Date */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-gold-600 uppercase tracking-wide">
              {article.publication}
            </span>
            <span className="text-sm text-gray-500">
              {formatDate(article.date)}
            </span>
          </div>

          {/* Title */}
          <h3 className="text-xl font-serif font-semibold text-navy-900 mb-3 group-hover:text-gold-600 transition-colors duration-300 line-clamp-2">
            {article.title}
          </h3>

          {/* Excerpt */}
          <p className="text-gray-700 leading-relaxed mb-4 line-clamp-3">
            {article.excerpt}
          </p>

          {/* Read More Link */}
          <div className="flex items-center text-gold-600 font-medium group-hover:text-gold-700 transition-colors duration-300">
            <span className="mr-2">Read Full Article</span>
            <FiExternalLink className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" aria-hidden="true" />
          </div>
        </div>
      </a>
    </article>
  );
}
