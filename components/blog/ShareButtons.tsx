'use client';

import React from 'react';
import { Twitter, Linkedin, Facebook, Link as LinkIcon, Share2 } from 'lucide-react';

interface ShareButtonsProps {
    url: string;
    title: string;
}

export default function ShareButtons({ url, title }: ShareButtonsProps) {
    const [copied, setCopied] = React.useState(false);
    const encodedUrl = encodeURIComponent(url);
    const encodedTitle = encodeURIComponent(title);

    const shareOnTwitter = () => {
        window.open(`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`, '_blank', 'width=600,height=400');
    };

    const shareOnLinkedIn = () => {
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`, '_blank', 'width=600,height=400');
    };

    const shareOnFacebook = () => {
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`, '_blank', 'width=600,height=400');
    };

    const handleNativeShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: title,
                    url: url,
                });
            } catch (err) {
                console.error('Error sharing:', err);
            }
        } else {
            // Fallback: Copy to clipboard
            try {
                await navigator.clipboard.writeText(url);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            } catch (err) {
                console.error('Error copying to clipboard:', err);
            }
        }
    };

    const iconClass = "h-4 w-4 hover:text-navy-900 cursor-pointer transition-colors";

    return (
        <div className="flex items-center gap-4 relative">
            <span className="text-gray-300">Share:</span>
            <button onClick={shareOnTwitter} title="Share on Twitter" type="button" className="p-1">
                <Twitter className={iconClass} />
            </button>
            <button onClick={shareOnLinkedIn} title="Share on LinkedIn" type="button" className="p-1">
                <Linkedin className={iconClass} />
            </button>
            <button onClick={shareOnFacebook} title="Share on Facebook" type="button" className="p-1">
                <Facebook className={iconClass} />
            </button>
            <button onClick={handleNativeShare} title="Share Link" type="button" className="p-1 relative">
                <Share2 className={iconClass} />
                {copied && (
                    <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-navy-900 text-white text-[8px] font-bold px-2 py-1 rounded animate-in fade-in slide-in-from-bottom-1 uppercase tracking-tighter shadow-lg">
                        Copied!
                    </span>
                )}
            </button>
        </div>
    );
}
