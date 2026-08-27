'use client';

import React, { useEffect, useState } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { X, Share2, Check, Download, MessageCircle, Sparkles, Loader2 } from 'lucide-react';
import { HallOfFamer } from '@/types/hall-of-fame';
import { generateHofStoryFile, getHofShareUrl, getHofShareText } from '@/lib/hof-share';

interface StoryShareModalProps {
  performer: HallOfFamer | null;
  onClose: () => void;
}

export default function StoryShareModal({ performer, onClose }: StoryShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

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

  const shareUrl = getHofShareUrl(performer);
  const shareText = getHofShareText(performer);
  const whatsappShareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;

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
            title: `${performer.studentName} � Hall of Fame`,
            text: `Celebrating ${performer.studentName}'s performance! ${shareUrl}`,
          });
          return;
        } catch (shareErr: any) {
          if (shareErr.name === 'AbortError') return;
        }
      }
      if (file) {
        const link = document.createElement('a');
        link.download = file.name;
        link.href = URL.createObjectURL(file);
        link.click();
      }
      window.open(whatsappShareUrl, '_blank');
    } catch (err: any) {
      if (err.name !== 'AbortError') window.open(whatsappShareUrl, '_blank');
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
          title: `${performer.studentName} � Hall of Fame`,
          text: `Celebrating ${performer.studentName}'s performance! ${shareUrl}`,
        });
      } else if (navigator.share) {
        await navigator.share({
          title: `${performer.studentName} � Hall of Fame`,
          text: shareText,
          url: shareUrl,
        });
      } else {
        await handleCopyLink();
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') await handleCopyLink();
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

  // Shared action buttons � identical on both mobile and desktop
  const ActionButtons = () => (
    <div className="space-y-2.5">
      <button
        onClick={handleShareWhatsAppImage}
        disabled={isGeneratingImage}
        className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2.5 shadow-md active:scale-95 transition-all disabled:opacity-60"
      >
        {isGeneratingImage ? (
          <Loader2 className="w-4 h-4 animate-spin text-white" />
        ) : (
          <MessageCircle className="w-4 h-4 fill-white text-emerald-600" />
        )}
        <span>Share to WhatsApp</span>
      </button>

      <button
        onClick={handleNativeShareImage}
        disabled={isGeneratingImage}
        className="w-full py-3.5 px-4 rounded-2xl bg-navy-950 hover:bg-black text-white font-bold text-xs flex items-center justify-center gap-2.5 shadow-md active:scale-95 transition-all disabled:opacity-60"
      >
        {isGeneratingImage ? (
          <Loader2 className="w-4 h-4 animate-spin text-white" />
        ) : (
          <Share2 className="w-4 h-4 text-white" />
        )}
        <span>Share to Other Apps</span>
      </button>

      <button
        onClick={handleDownloadStoryImage}
        disabled={isGeneratingImage}
        className="w-full py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs flex items-center justify-center gap-2 transition-all active:scale-95"
      >
        <Download className="w-4 h-4 text-slate-600" />
        <span>Save Story Image</span>
      </button>

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
  );

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

        {/* 1. MOBILE: Bottom Action Sheet */}
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
          <div className="pt-2">
            <ActionButtons />
          </div>
          <button
            onClick={onClose}
            className="w-full py-3 text-center text-xs font-bold text-slate-400 hover:text-slate-700 transition-colors"
          >
            Cancel
          </button>
        </m.div>

        {/* 2. DESKTOP: Centered modal � mirrors mobile action set */}
        <m.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="hidden sm:block relative w-full max-w-md bg-white rounded-3xl shadow-2xl z-10 overflow-hidden border border-slate-200 my-auto"
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50">
            <div>
              <h3 className="text-base font-bold text-navy-950">Share Showcase Story</h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Celebrating {performer.studentName}&apos;s performance
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-navy-900 hover:bg-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-5 space-y-2.5">
            <ActionButtons />
            <button
              onClick={onClose}
              className="w-full py-3 text-center text-xs font-bold text-slate-400 hover:text-slate-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </m.div>
      </div>
    </AnimatePresence>
  );
}
