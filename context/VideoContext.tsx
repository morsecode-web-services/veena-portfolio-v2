'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

interface VideoContextType {
  activeVideoId: string | null;
  setActiveVideo: (id: string | null) => void;
  expandedVideo: { url: string; title: string } | null;
  openVideo: (url: string, title: string) => void;
  closeVideo: () => void;
}

const VideoContext = createContext<VideoContextType | undefined>(undefined);

export function VideoProvider({ children }: { children: React.ReactNode }) {
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const [expandedVideo, setExpandedVideo] = useState<{ url: string; title: string } | null>(null);

  const setActiveVideo = useCallback((id: string | null) => {
    setActiveVideoId(id);
  }, []);

  const openVideo = useCallback(
    (url: string, title: string) => {
      setExpandedVideo({ url, title });
      setActiveVideo(null); // Stop any other playing videos
    },
    [setActiveVideo]
  );

  const closeVideo = useCallback(() => {
    setExpandedVideo(null);
  }, []);

  return (
    <VideoContext.Provider
      value={{
        activeVideoId,
        setActiveVideo,
        expandedVideo,
        openVideo,
        closeVideo,
      }}
    >
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
