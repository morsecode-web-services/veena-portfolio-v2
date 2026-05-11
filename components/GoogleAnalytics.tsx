'use client';

import Script from 'next/script';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

// Track page views
export function usePageTracking() {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    useEffect(() => {
        if (!GA_MEASUREMENT_ID) return;

        const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '');

        // Send pageview with custom parameters
        if (typeof window !== 'undefined' && window.gtag) {
            window.gtag('config', GA_MEASUREMENT_ID, {
                page_path: url,
            });
        }
    }, [pathname, searchParams]);
}

// Track custom events
export const trackEvent = (eventName: string, eventParams?: Record<string, any>) => {
    if (!GA_MEASUREMENT_ID) {
        console.log('GA not configured:', eventName, eventParams);
        return;
    }

    if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', eventName, eventParams);
    }
};

// Specific event trackers
export const analytics = {
    // Video interactions
    videoPlay: (videoTitle: string, videoUrl: string, category: string) => {
        trackEvent('video_play', {
            // GA4 recommended parameters
            video_title: videoTitle,           // Primary identifier
            video_provider: 'youtube',         // Always YouTube for this site
            video_url: videoUrl,
            content_type: category,            // GA4 recommended for content classification
            // Legacy parameters for compatibility
            event_category: 'Video',
            event_label: videoTitle,
        });
    },

    videoPause: (videoTitle: string, videoUrl: string) => {
        trackEvent('video_pause', {
            event_category: 'Video',
            event_label: videoTitle,
            video_url: videoUrl,
        });
    },

    videoComplete: (videoTitle: string, videoUrl: string) => {
        trackEvent('video_complete', {
            event_category: 'Video',
            event_label: videoTitle,
            video_url: videoUrl,
        });
    },

    // External link clicks
    externalLinkClick: (linkText: string, linkUrl: string, linkType: string) => {
        trackEvent('external_link_click', {
            event_category: 'Outbound Link',
            event_label: linkText,
            link_url: linkUrl,
            link_type: linkType,
        });
    },

    // Social media links
    socialMediaClick: (platform: string, location: string, deviceType?: string, linkType?: string) => {
        trackEvent('social_click', {
            // GA4 recommended parameters
            social_network: platform,          // GA4 recommended: instagram, youtube, linkedin, etc.
            link_domain: platform,             // Helps identify the platform in reports
            link_location: location,           // Where the link was clicked: 'header', 'footer', etc.
            device_type: deviceType,           // Device type: 'ios', 'android', 'desktop'
            link_type: linkType,               // Link type: 'app_scheme', 'intent', 'https'
            // Legacy parameters for compatibility
            event_category: 'Social Media',
            event_label: platform,
        });
    },

    // PDF downloads
    pdfDownload: (fileName: string, fileSize?: number) => {
        trackEvent('file_download', {
            // GA4 recommended parameters
            file_name: fileName,               // GA4 recommended
            file_extension: 'pdf',
            link_text: 'Download Portfolio PDF', // What the user clicked
            // Optional parameters
            ...(fileSize ? { file_size: fileSize } : {}),
            // Legacy parameters
            event_category: 'Download',
            event_label: fileName,
        });
    },

    // Contact form
    contactFormSubmit: (success: boolean, errorMessage?: string, inquiryType?: string) => {
        trackEvent('contact_form_submit', {
            event_category: 'Form',
            event_label: success ? 'Success' : 'Error',
            form_type: 'contact',
            inquiry_type: inquiryType,
            success,
            error_message: errorMessage,
        });
    },

    contactFormStart: () => {
        trackEvent('contact_form_start', {
            event_category: 'Form',
            event_label: 'Contact Form Started',
        });
    },

    // Navigation
    navigationClick: (sectionName: string) => {
        trackEvent('navigation_click', {
            event_category: 'Navigation',
            event_label: sectionName,
        });
    },

    // Image gallery interactions
    galleryImageView: (imageId: string, imageCaption: string) => {
        trackEvent('gallery_image_view', {
            event_category: 'Gallery',
            event_label: imageCaption,
            image_id: imageId,
        });
    },

    // Scroll depth (useful for long pages)
    scrollDepth: (percentage: number, page: string) => {
        trackEvent('scroll_depth', {
            event_category: 'Engagement',
            event_label: page,
            scroll_percentage: percentage,
        });
    },

    // Ecommerce Funnel
    purchase: (amount: number, currency: string = 'INR', items: any[]) => {
        trackEvent('purchase', {
            value: amount,
            currency: currency,
            transaction_id: `txn_${Date.now()}`, // Fallback if no specific ID
            items: items.map(item => ({
                item_id: item.id,
                item_name: item.name,
                item_category: item.category || 'cohort',
                price: item.price,
                quantity: 1
            }))
        });
    },

    // Carousel interactions
    carouselSwipe: (direction: 'left' | 'right', currentSlide: number, carouselName: string) => {
        trackEvent('carousel_swipe', {
            event_category: 'Engagement',
            event_label: carouselName,
            swipe_direction: direction,
            slide_number: currentSlide,
        });
    },
};

export default function GoogleAnalytics() {
    if (!GA_MEASUREMENT_ID) {
        return null;
    }

    return (
        <>
            <Script
                strategy="lazyOnload"
                src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
            />
            <Script
                id="google-analytics"
                strategy="lazyOnload"
                dangerouslySetInnerHTML={{
                    __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}', {
              page_path: window.location.pathname,
              send_page_view: true
            });
          `,
                }}
            />
        </>
    );
}

// Type declaration for window.gtag
declare global {
    interface Window {
        gtag: (...args: any[]) => void;
        dataLayer: any[];
    }
}
