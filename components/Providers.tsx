'use client';

import { LazyMotion, domAnimation } from 'framer-motion';
import { VideoProvider } from '@/context/VideoContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <ErrorBoundary>
            <VideoProvider>
                <LazyMotion features={domAnimation}>
                    {children}
                </LazyMotion>
            </VideoProvider>
        </ErrorBoundary>
    );
}
