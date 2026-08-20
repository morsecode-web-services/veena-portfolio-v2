'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Heart, Share2, MapPin, CheckCircle2 } from 'lucide-react';
import { HallOfFamer } from '@/types/hall-of-fame';
import { toggleHallOfFameLike } from '@/lib/hall-of-fame';
import GoogleDriveVideoEmbed from '@/components/ui/GoogleDriveVideoEmbed';

interface HallOfFameCardProps {
  performer: HallOfFamer;
  onSelect: (performer: HallOfFamer) => void;
  onShareStory?: (performer: HallOfFamer) => void;
}

export default function HallOfFameCard({ performer, onSelect, onShareStory }: HallOfFameCardProps) {
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(
    performer.mentorComment?.likesCount || Math.floor(Math.random() * 20) + 18
  );

  const mentorAvatar =
    performer.mentorComment?.authorAvatar ||
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80';
  const mentorName = performer.mentorComment?.authorName || 'Aishwarya Manikarnike';
  const mentorCommentText =
    performer.mentorComment?.commentText ||
    performer.mentorPraise ||
    `${performer.studentName} has shown wonderful proficiency!`;

  const handleLikeToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    // 1. Optimistic UI update for instantaneous user feedback
    const prevLiked = liked;
    const prevCount = likesCount;

    setLiked(!prevLiked);
    setLikesCount(prevLiked ? Math.max(0, prevCount - 1) : prevCount + 1);

    // 2. Safe Atomic DB update via Supabase RPC
    const res = await toggleHallOfFameLike(performer.id);
    if (res.success) {
      setLiked(res.liked);
      setLikesCount(res.likesCount);
    } else {
      // Rollback on failure
      setLiked(prevLiked);
      setLikesCount(prevCount);
    }
  };

  const handleShareClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onShareStory) {
      onShareStory(performer);
    } else {
      onSelect(performer);
    }
  };

  return (
    <article className="group relative bg-white rounded-2xl border border-slate-100 overflow-hidden transition-all duration-500 hover:shadow-premium-xl hover:-translate-y-2 text-left w-full flex flex-col h-full">
      {/* Top Banner / Cohort Pill */}
      <div className="absolute top-3 left-3 z-10">
        <span className="bg-navy-950/90 text-slate-100 text-[10px] font-bold px-3 py-1 rounded-full shadow-md uppercase tracking-wider border border-navy-800 backdrop-blur-sm">
          Cohort: {performer.cohort || 'Vande Mataram'}
        </span>
      </div>

      {/* Video Player Header (Matching aspect ratio of /cohorts cards) */}
      <div className="relative aspect-[16/9] overflow-hidden bg-slate-100 shrink-0">
        <GoogleDriveVideoEmbed
          videoUrl={performer.videoUrl}
          title={performer.studentName}
          thumbnailUrl={performer.customThumbnailUrl}
          autoplay={false}
        />
      </div>

      {/* Card Content Body */}
      <div className="p-4 sm:p-5 flex flex-col flex-1">
        {/* Student Name as Main Card Title */}
        <div className="flex items-center justify-between mb-1.5">
          <h3 className="text-base sm:text-lg font-serif font-bold text-navy-900 leading-snug group-hover:text-gold-600 transition-colors">
            {performer.studentName}
          </h3>

          {performer.location && (
            <span className="flex items-center gap-1 text-slate-500 text-[11px] font-medium bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
              <MapPin className="w-3 h-3 text-gold-600" />
              {performer.location}
            </span>
          )}
        </div>

        {/* Student Tagline Description */}
        {performer.studentDescription && (
          <p className="text-xs font-sans text-slate-600 leading-relaxed mb-3">
            {performer.studentDescription}
          </p>
        )}

        {/* Aishwarya's Instagram Spotlight Comment Box */}
        <div className="mt-auto pt-3 border-t border-slate-100">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="relative w-6 h-6 rounded-full overflow-hidden border border-gold-500 shrink-0">
                <Image src={mentorAvatar} alt={mentorName} fill className="object-cover" />
              </div>
              <span className="text-xs font-bold text-navy-900">{mentorName}</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-gold-600 fill-gold-100" />
            </div>
            <p className="text-xs font-serif italic text-slate-600 leading-relaxed">
              &ldquo;{mentorCommentText}&rdquo;
            </p>
          </div>

          {/* Bottom Actions Bar */}
          <div className="mt-3 flex items-center justify-between">
            <button
              onClick={handleLikeToggle}
              className={`flex items-center gap-1 text-xs font-medium transition-colors ${
                liked ? 'text-rose-600' : 'text-slate-500 hover:text-rose-600'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${liked ? 'fill-rose-600 text-rose-600' : ''}`} />
              <span>{likesCount}</span>
            </button>

            <button
              onClick={handleShareClick}
              className="px-3 py-1 rounded-xl bg-navy-900 hover:bg-gold-400 text-white hover:text-navy-950 text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
            >
              <Share2 className="w-3 h-3" /> Share Story
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
