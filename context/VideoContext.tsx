'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

interface VideoContextType {
    activeVideoId: string | null;
    setActiveVideo: (id: string | null) => void;
}

const VideoContext = createContext<VideoContextType | undefined>(undefined);

export function VideoProvider({ children }: { children: React.ReactNode }) {
    const [activeVideoId, setActiveVideoId] = useState<string | null>(null);

    const setActiveVideo = useCallback((id: string | null) => {
        setActiveVideoId(id);
    }, []);

    return (
        <VideoContext.Provider value={{ activeVideoId, setActiveVideo }}>
            {children}
        </VideoContext.Provider>
    );
}

export function useVideo() {
    const context = useContext(VideoContext);
    if (context === undefined) {
        throw new Error('useVideo must be used within a VideoProvider');
    }
    return context;
}
