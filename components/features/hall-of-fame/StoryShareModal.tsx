'use client';

import React, { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { m, AnimatePresence } from 'framer-motion';
import { X, Share2, Check, Download, MessageCircle, Sparkles, MapPin, Loader2 } from 'lucide-react';
import { HallOfFamer } from '@/types/hall-of-fame';
import {
  generateHofStoryFile,
  getHofShareUrl,
  getHofShareText,
  getHofThumbnail,
} from '@/lib/hof-share';
import { extractGoogleDriveId, extractYoutubeId } from '@/lib/utils';

interface StoryShareModalProps {
  performer: HallOfFamer | null;
  onClose: () => void;
}

export default function StoryShareModal({ performer, onClose }: StoryShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (performer) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [performer, onClose]);

  if (!performer) return null;

  const driveId = extractGoogleDriveId(performer.videoUrl);
  const youtubeId = extractYoutubeId(performer.videoUrl);
  const thumbnailUrl = getHofThumbnail(performer);
  const shareUrl = getHofShareUrl(performer);
  const shareText = getHofShareText(performer);

  const mentorCommentText =
    performer.mentorComment?.commentText ||
    performer.mentorPraise ||
    `${performer.studentName} has shown wonderful proficiency!`;
  const mentorAuthorName = performer.mentorComment?.authorName || 'Aishwarya Manikarnike';
  const mentorAuthorAvatar =
    performer.mentorComment?.authorAvatar ||
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80';

  const whatsappShareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;

  // Delegate to shared utility — no duplication
  const generateStoryFile = () => generateHofStoryFile(performer);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      alert(`Share link: ${shareUrl}`);
    }
  };

  const handleShareWhatsAppImage = async () => {
    setIsGeneratingImage(true);
    try {
      const file = await generateStoryFile();
      if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: `${performer.studentName} — Hall of Fame`,
            text: `Celebrating ${performer.studentName}'s performance! ${shareUrl}`,
          });
          return;
        } catch (shareErr: any) {
          if (shareErr.name === 'AbortError') return;
        }
      }

      // Fallback: download story image to gallery/downloads and open WhatsApp
      if (file) {
        const link = document.createElement('a');
        link.download = file.name;
        link.href = URL.createObjectURL(file);
        link.click();
      }
      window.open(whatsappShareUrl, '_blank');
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        window.open(whatsappShareUrl, '_blank');
      }
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleNativeShareImage = async () => {
    setIsGeneratingImage(true);
    try {
      const file = await generateStoryFile();
      if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `${performer.studentName} — Hall of Fame`,
          text: `Celebrating ${performer.studentName}'s performance! ${shareUrl}`,
        });
      } else if (navigator.share) {
        await navigator.share({
          title: `${performer.studentName} — Hall of Fame`,
          text: shareText,
          url: shareUrl,
        });
      } else {
        await handleCopyLink();
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        await handleCopyLink();
      }
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleDownloadStoryImage = async () => {
    setIsGeneratingImage(true);
    try {
      const file = await generateStoryFile();
      if (file) {
        const link = document.createElement('a');
        link.download = file.name;
        link.href = URL.createObjectURL(file);
        link.click();
      }
    } catch (err) {
      console.error('Failed to download story image:', err);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-navy-950/80 backdrop-blur-md"
          onClick={onClose}
        />

        {/* 1. MOBILE VIEW: Bottom Action Sheet */}
        <m.div
          initial={{ opacity: 0, y: '100%' }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: '100%' }}
          transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
          className="sm:hidden relative w-full bg-white rounded-t-3xl shadow-2xl z-10 overflow-hidden border-t border-slate-200 p-5 space-y-4"
        >
          <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mb-1" />

          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-navy-950">Share Showcase Story</h3>
              <p className="text-xs text-slate-500 font-medium">
                Celebrating {performer.studentName}&apos;s performance
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 rounded-full bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-2.5 pt-2">
            {/* WhatsApp Direct Share Button */}
            <button
              onClick={handleShareWhatsAppImage}
              disabled={isGeneratingImage}
              className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2.5 shadow-md active:scale-98 transition-all disabled:opacity-60"
            >
              {isGeneratingImage ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <MessageCircle className="w-4 h-4 fill-white text-emerald-600" />
              )}
              <span>Share to WhatsApp</span>
            </button>

            {/* Native Options / Other Apps Button */}
            <button
              onClick={handleNativeShareImage}
              disabled={isGeneratingImage}
              className="w-full py-3.5 px-4 rounded-2xl bg-navy-950 hover:bg-black text-white font-bold text-xs flex items-center justify-center gap-2.5 shadow-md active:scale-98 transition-all disabled:opacity-60"
            >
              {isGeneratingImage ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <Share2 className="w-4 h-4 text-white" />
              )}
              <span>Share to Other Apps</span>
            </button>

            {/* Save Image to Phone Gallery */}
            <button
              onClick={handleDownloadStoryImage}
              disabled={isGeneratingImage}
              className="w-full py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs flex items-center justify-center gap-2 transition-all active:scale-98"
            >
              <Download className="w-4 h-4 text-slate-600" />
              <span>Save Story Image</span>
            </button>

            {/* Copy Story Link */}
            <button
              onClick={handleCopyLink}
              className="w-full py-3 px-4 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs flex items-center justify-center gap-2 transition-all border border-slate-200"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Link Copied!</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Copy Showcase Link</span>
                </>
              )}
            </button>
          </div>

          <button
            onClick={onClose}
            className="w-full py-3 text-center text-xs font-bold text-slate-400 hover:text-slate-700 transition-colors pt-1"
          >
            Cancel
          </button>
        </m.div>

        {/* 2. DESKTOP VIEW: Full Story Preview Window */}
        <m.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="hidden sm:block relative w-full max-w-md bg-white rounded-3xl shadow-2xl z-10 overflow-hidden border border-slate-200 my-auto"
        >
          {/* Top Bar */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
              <Sparkles className="w-4 h-4 text-amber-500" /> Story Share Card
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-navy-900 hover:bg-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* White Pinteresty Celebratory Story Card Preview */}
          <div className="p-4 sm:p-6 bg-slate-100 text-slate-800 flex flex-col items-center">
            <div
              ref={cardRef}
              className="w-full bg-[#faf9f6] text-navy-950 rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-xl relative flex flex-col justify-between min-h-[500px] overflow-hidden"
            >
              {/* Decorative Background Elements */}
              <div className="absolute -top-16 -right-16 w-44 h-44 rounded-full bg-amber-500/10 blur-2xl pointer-events-none" />
              <div className="absolute -bottom-16 -left-16 w-44 h-44 rounded-full bg-rose-500/10 blur-2xl pointer-events-none" />

              <div className="relative z-10">
                {/* Cohort Badge Header */}
                <div className="flex items-center justify-between mb-4">
                  <span className="bg-navy-950 text-slate-100 text-[10px] font-bold px-3.5 py-1 rounded-full shadow-sm uppercase tracking-widest border border-navy-800">
                    Cohort: {performer.cohort || 'Vande Mataram'}
                  </span>
                  <span className="text-[10px] font-serif font-semibold text-slate-400 uppercase tracking-wider">
                    Hall of Fame Spotlight
                  </span>
                </div>

                {/* Video Snapshot Frame */}
                <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden mb-4 border border-slate-200 shadow-md group bg-slate-950">
                  <Image
                    src={thumbnailUrl}
                    alt={performer.studentName}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-navy-950/20 group-hover:bg-transparent transition-colors duration-300" />

                  {/* Aesthetic Play Button */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-12 h-12 rounded-full bg-navy-950/80 text-white backdrop-blur-md border border-white/30 flex items-center justify-center shadow-xl">
                      <div className="w-0 h-0 border-y-[7px] border-y-transparent border-l-[12px] border-l-white ml-1" />
                    </div>
                  </div>
                </div>

                {/* Student Name Title & Location */}
                <div className="mb-2">
                  <h3 className="text-2xl font-serif font-bold text-navy-950 leading-tight">
                    {performer.studentName}
                  </h3>
                  {performer.location && (
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 font-sans font-medium">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" /> {performer.location}
                    </p>
                  )}
                </div>

                {/* Student Tagline Description */}
                {performer.studentDescription && (
                  <div className="p-3 bg-white/80 rounded-xl border border-slate-200/80 shadow-xs mb-4">
                    <p className="text-xs font-sans text-slate-700 leading-relaxed line-clamp-3">
                      {performer.studentDescription}
                    </p>
                  </div>
                )}
              </div>

              {/* White Pinterest-Style Instructor Feedback Box */}
              <div className="relative z-10 p-4 rounded-2xl bg-white text-navy-950 border border-slate-200/90 shadow-md mt-2">
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="relative w-8 h-8 rounded-full overflow-hidden border border-navy-950 shrink-0 shadow-xs">
                    <Image
                      src={mentorAuthorAvatar}
                      alt={mentorAuthorName}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-navy-950">{mentorAuthorName}</span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] bg-navy-950 text-slate-100 font-bold uppercase tracking-wider">
                      ✓ Instructor
                    </span>
                  </div>
                </div>
                <p className="text-xs font-serif italic text-slate-800 leading-relaxed">
                  &ldquo;{mentorCommentText}&rdquo;
                </p>
              </div>

              {/* Story Footer Branding */}
              <div className="relative z-10 mt-4 pt-2 text-center text-[10px] uppercase font-serif font-bold tracking-widest text-slate-400 border-t border-slate-200/80">
                Aishwarya Manikarnike Veena Academy
              </div>
            </div>
          </div>

          {/* Action Buttons Section */}
          <div className="p-5 bg-white space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {/* WhatsApp Image Share Button */}
              <button
                onClick={handleShareWhatsAppImage}
                disabled={isGeneratingImage}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 disabled:opacity-50"
              >
                {isGeneratingImage ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <MessageCircle className="w-4 h-4 text-white" />
                )}
                <span>Share WhatsApp</span>
              </button>

              {/* Download Story Graphic */}
              <button
                onClick={handleDownloadStoryImage}
                disabled={isGeneratingImage}
                className="w-full py-2.5 px-4 rounded-xl bg-navy-950 hover:bg-black text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 disabled:opacity-50"
              >
                {isGeneratingImage ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 text-white" />
                )}
                <span>Save PNG Story</span>
              </button>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={handleCopyLink}
                className="flex-1 py-2 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs flex items-center justify-center gap-1.5 transition-colors border border-slate-200"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" /> Link Copied!
                  </>
                ) : (
                  'Copy Story Link'
                )}
              </button>

              <button
                onClick={handleNativeShareImage}
                disabled={isGeneratingImage}
                className="py-2 px-4 rounded-lg bg-navy-950 hover:bg-black text-white font-medium text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs disabled:opacity-50"
              >
                <Share2 className="w-3.5 h-3.5" /> Share...
              </button>
            </div>
          </div>
        </m.div>
      </div>
    </AnimatePresence>
  );
}
