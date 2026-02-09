'use client';

import { LazyMotion, domAnimation } from 'framer-motion';
import { VideoProvider } from '@/context/VideoContext';
import { ToastProvider } from '@/context/ToastContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <ErrorBoundary>
            <VideoProvider>
                <ToastProvider>
                    <LazyMotion features={domAnimation}>
                        {children}
                    </LazyMotion>
                </ToastProvider>
            </VideoProvider>
        </ErrorBoundary>
    );
}
