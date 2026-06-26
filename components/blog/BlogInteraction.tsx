'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { m, AnimatePresence } from 'framer-motion';
import { Heart } from 'lucide-react';
import { trackEvent } from '@/components/GoogleAnalytics';

interface BlogInteractionProps {
  blogId: string;
  initialLikes: number;
}

export default function BlogInteraction({ blogId, initialLikes }: BlogInteractionProps) {
  const [likes, setLikes] = useState(initialLikes);
  const [hasLiked, setHasLiked] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // Check local storage on mount
  useEffect(() => {
    const likedBlogs = JSON.parse(localStorage.getItem('liked_blogs') || '[]');
    if (likedBlogs.includes(blogId)) {
      setHasLiked(true);
    }
  }, [blogId]);

  const handleLike = async () => {
    if (hasLiked) return;

    // Custom Event Tracking
    trackEvent('blog_like', {
      event_category: 'Engagement',
      event_label: blogId,
      blog_id: blogId,
    });

    // Optimistic update
    setLikes((prev) => prev + 1);
    setHasLiked(true);
    setShowConfetti(true);

    // Save to local storage
    const likedBlogs = JSON.parse(localStorage.getItem('liked_blogs') || '[]');
    localStorage.setItem('liked_blogs', JSON.stringify([...likedBlogs, blogId]));

    // Call RPC function
    const { error } = await supabase.rpc('increment_blog_likes', { blog_id: blogId });

    if (error) {
      console.error('Error incrementing likes:', error);
      // Revert on error
      setLikes((prev) => prev - 1);
      setHasLiked(false);
    }

    // Hide confetti after animation
    setTimeout(() => setShowConfetti(false), 2000);
  };

  return (
    <AnimatePresence>
      <m.div
        className="fixed bottom-8 right-8 z-50 pointer-events-none"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className="pointer-events-auto relative">
          <m.button
            onClick={handleLike}
            disabled={hasLiked}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            className={`
                            group flex items-center gap-2.5 px-5 py-3 rounded-full transition-all duration-300
                            shadow-2xl hover:shadow-3xl backdrop-blur-md border 
                            ${
                              hasLiked
                                ? 'bg-navy-900/95 text-gold-400 border-navy-800'
                                : 'bg-white/90 text-navy-900 border-gray-100 hover:border-gold-200'
                            }
                        `}
          >
            <Heart
              className={`w-5 h-5 transition-colors duration-300 ${hasLiked ? 'fill-gold-400 text-gold-400' : 'text-gray-400 group-hover:text-gold-500'}`}
              strokeWidth={2}
            />

            <span
              className={`text-sm font-bold tabular-nums ${hasLiked ? 'text-gold-400' : 'text-navy-900'}`}
            >
              {likes}
            </span>

            {/* Confetti Particles Effect */}
            <AnimatePresence>
              {showConfetti && (
                <div className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-full pointer-events-none">
                  {[...Array(12)].map((_, i) => (
                    <m.div
                      key={i}
                      initial={{ opacity: 1, scale: 0, x: 0, y: 0 }}
                      animate={{
                        opacity: 0,
                        scale: 1,
                        x: (Math.random() - 0.5) * 100,
                        y: -Math.random() * 100 - 20,
                        rotate: Math.random() * 360,
                      }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className="absolute w-1.5 h-1.5 rounded-full"
                      style={{
                        backgroundColor: ['#fbbf24', '#f59e0b', '#d97706', '#FF6B6B'][i % 4],
                        left: 0,
                        top: 0,
                      }}
                    />
                  ))}
                </div>
              )}
            </AnimatePresence>
          </m.button>
        </div>
      </m.div>
    </AnimatePresence>
  );
}
