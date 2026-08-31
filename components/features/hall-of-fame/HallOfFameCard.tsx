'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Heart, Share2, MapPin, CheckCircle2, Download, Link, Loader2 } from 'lucide-react';
import { HallOfFamer } from '@/types/hall-of-fame';
import { toggleHallOfFameLike } from '@/lib/hall-of-fame';
import { generateHofStoryFile, getHofShareUrl, getHofShareText } from '@/lib/hof-share';
import GoogleDriveVideoEmbed from '@/components/ui/GoogleDriveVideoEmbed';

interface HallOfFameCardProps {
  performer: HallOfFamer;
  onSelect: (performer: HallOfFamer) => void;
  onShareStory?: (performer: HallOfFamer) => void;
  isHighlighted?: boolean;
  initialLiked?: boolean;
}

export default function HallOfFameCard({
  performer,
  onSelect,
  onShareStory,
  isHighlighted = false,
  initialLiked = false,
}: HallOfFameCardProps) {
  const [liked, setLiked] = useState(initialLiked);
  const [isLiking, setIsLiking] = useState(false);

  const initialCount = performer.likesCount ?? performer.mentorComment?.likesCount ?? 0;
  const [likesCount, setLikesCount] = useState(initialCount);

  useEffect(() => {
    setLiked(initialLiked);
  }, [initialLiked]);

  // Keep likesCount in sync if performer props update
  useEffect(() => {
    const count = performer.likesCount ?? performer.mentorComment?.likesCount;
    if (count !== undefined) {
      setLikesCount(count);
    }
  }, [performer.likesCount, performer.mentorComment?.likesCount]);

  const [isSharingMobile, setIsSharingMobile] = useState(false);
  const [isSavingImage, setIsSavingImage] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

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
    if (isLiking) return; // Prevent double-clicking race condition

    const prevLiked = liked;
    const prevCount = likesCount;
    const optimisticLiked = !prevLiked;
    const optimisticCount = optimisticLiked ? prevCount + 1 : Math.max(0, prevCount - 1);

    // Optimistic UI state
    setLiked(optimisticLiked);
    setLikesCount(optimisticCount);
    setIsLiking(true);

    try {
      const res = await toggleHallOfFameLike(performer.id, undefined, prevLiked, prevCount);
      if (res && res.success) {
        setLiked(res.liked);
        setLikesCount(res.likesCount);
      } else {
        // Revert on failure
        setLiked(prevLiked);
        setLikesCount(prevCount);
      }
    } catch (err) {
      console.warn('Like toggle error:', err);
      setLiked(prevLiked);
      setLikesCount(prevCount);
    } finally {
      setIsLiking(false);
    }
  };

  // Desktop: open full story preview modal
  const handleDesktopShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onShareStory) onShareStory(performer);
    else onSelect(performer);
  };

  // Mobile: directly trigger native share with image file attached
  const handleMobileShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSharingMobile(true);
    try {
      const file = await generateHofStoryFile(performer);
      const shareUrl = getHofShareUrl(performer);
      const caption = `Honored and excited to be featured in Aishwarya Manikarnike's Hall of Fame! 🌟 Watch my performance of ${performer.cohort || 'Vande Mataram'} here: ${shareUrl}`;

      if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: `${performer.studentName} — Hall of Fame`,
            text: caption,
          });
          return;
        } catch (err: any) {
          if (err.name === 'AbortError') return;
        }
      }
      // Fallback: open native text share
      if (navigator.share) {
        await navigator.share({
          title: `${performer.studentName} — Hall of Fame`,
          text: getHofShareText(performer),
          url: shareUrl,
        });
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') console.warn('Mobile share failed:', err);
    } finally {
      setIsSharingMobile(false);
    }
  };

  // Mobile: download story image directly
  const handleSaveImage = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSavingImage(true);
    try {
      const file = await generateHofStoryFile(performer);
      if (file) {
        const link = document.createElement('a');
        link.download = file.name;
        link.href = URL.createObjectURL(file);
        link.click();
        setTimeout(() => URL.revokeObjectURL(link.href), 5000);
      }
    } catch (err) {
      console.error('Save image failed:', err);
    } finally {
      setIsSavingImage(false);
    }
  };

  // Mobile: copy showcase link
  const handleCopyLink = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(getHofShareUrl(performer));
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      alert(getHofShareUrl(performer));
    }
  };

  return (
    <article
      className={`group relative bg-white rounded-2xl border overflow-hidden transition-all duration-500 hover:shadow-premium-xl hover:-translate-y-2 text-left w-full flex flex-col h-full ${
        isHighlighted
          ? 'border-gold-500 ring-2 ring-gold-500/80 shadow-[0_0_25px_rgba(212,160,23,0.35)] scale-102 z-10'
          : 'border-slate-100'
      }`}
    >
      {/* Video Player — fixed 16:9 container prevents layout shift on play */}
      <div className="relative shrink-0 w-full">
        <GoogleDriveVideoEmbed
          videoUrl={performer.videoUrl}
          title={performer.studentName}
          thumbnailUrl={performer.customThumbnailUrl}
          autoplay={false}
          cohort={performer.cohort || 'Vande Mataram'}
        />
      </div>

      {/* Card Content Body */}
      <div className="p-4 sm:p-5 flex flex-col flex-1">
        {/* Student Name + Location */}
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

        {/* Student Description */}
        {performer.studentDescription && (
          <p className="text-xs font-sans text-slate-600 leading-relaxed mb-3">
            {performer.studentDescription}
          </p>
        )}

        {/* Instructor Comment */}
        <div className="mt-auto pt-3 border-t border-slate-100">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="relative w-6 h-6 rounded-full overflow-hidden border border-gold-500 shrink-0">
                <Image src={mentorAvatar} alt={mentorName} fill className="object-cover" />
              </div>
              <span className="text-xs font-bold text-navy-900">{mentorName}</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-gold-600 fill-gold-100" />
            </div>
            <p className="text-xs font-sans text-slate-600 leading-relaxed">
              &ldquo;{mentorCommentText}&rdquo;
            </p>
          </div>

          {/* ── Actions Row ── */}
          <div className="mt-3 flex items-center justify-between gap-2">
            {/* Like */}
            <button
              onClick={handleLikeToggle}
              disabled={isLiking}
              aria-label={liked ? 'Unlike' : 'Like'}
              className={`flex items-center gap-1.5 text-xs font-semibold py-1 px-2 rounded-lg transition-all active:scale-95 disabled:opacity-70 ${
                liked
                  ? 'text-rose-600 bg-rose-50 border border-rose-100'
                  : 'text-slate-500 hover:text-rose-600 hover:bg-slate-50 border border-transparent'
              }`}
            >
              <Heart
                className={`w-4 h-4 transition-transform active:scale-125 ${
                  liked ? 'fill-rose-600 text-rose-600' : 'text-slate-400'
                }`}
              />
              <span>{likesCount}</span>
            </button>

            {/* Unified Action Buttons */}
            <div className="flex items-center gap-1.5">
              {/* Save Story Image */}
              <button
                onClick={handleSaveImage}
                disabled={isSavingImage}
                aria-label="Save story image"
                title="Save story card"
                className="w-8.5 h-8.5 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 hover:text-navy-900 transition-all active:scale-95 disabled:opacity-50"
              >
                {isSavingImage ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
              </button>

              {/* Copy Link */}
              <button
                onClick={handleCopyLink}
                aria-label="Copy showcase link"
                title="Copy link"
                className={`w-8.5 h-8.5 rounded-xl flex items-center justify-center transition-all active:scale-95 ${
                  linkCopied
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-navy-900'
                }`}
              >
                {linkCopied ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Link className="w-3.5 h-3.5" />
                )}
              </button>

              {/* Share Story Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const isMobileDevice =
                    typeof window !== 'undefined' &&
                    ('ontouchstart' in window || navigator.maxTouchPoints > 0);
                  if (isMobileDevice) {
                    handleMobileShare(e);
                  } else {
                    handleDesktopShare(e);
                  }
                }}
                disabled={isSharingMobile}
                aria-label="Share Story"
                title="Share Story"
                className="flex items-center gap-1 px-3 h-8.5 rounded-xl bg-navy-900 hover:bg-gold-400 text-white hover:text-navy-950 text-xs font-bold transition-all shadow-xs active:scale-95 disabled:opacity-50"
              >
                {isSharingMobile ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Share2 className="w-3 h-3" />
                )}
                <span>Share</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
