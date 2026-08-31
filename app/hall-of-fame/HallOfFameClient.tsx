'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import HallOfFameCard from '@/components/features/hall-of-fame/HallOfFameCard';
import StoryShareModal from '@/components/features/hall-of-fame/StoryShareModal';
import { HallOfFamer } from '@/types/hall-of-fame';
import { SiteConfig } from '@/types';
import { getHallOfFamers, getVisitorLikedIds } from '@/lib/hall-of-fame';
import { Search, Award, RefreshCw } from 'lucide-react';

interface HallOfFameClientProps {
  config: SiteConfig;
}

function HallOfFameContent({ config }: { config: SiteConfig }) {
  const searchParams = useSearchParams();
  const entryIdFromUrl = searchParams.get('entry');

  const [performers, setPerformers] = useState<HallOfFamer[]>([]);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSharePerformer, setSelectedSharePerformer] = useState<HallOfFamer | null>(null);

  const rawTitle = config?.hallOfFame?.title || 'Cohort: Vande Mataram';
  const formattedTitle = rawTitle.replace(/^["']|["']$/g, '').trim();
  const description =
    config?.hallOfFame?.description ||
    'These students showed exceptional display of talent across our Veena learning challenges.';
  const subtitle = config?.hallOfFame?.subtitle;

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [data, userLikedList] = await Promise.all([getHallOfFamers(), getVisitorLikedIds()]);
        setPerformers(data);
        setLikedIds(new Set(userLikedList));
      } catch (err) {
        console.warn('Error loading Hall of Fame data:', err);
      } finally {
        setLoading(false);
      }

      // Auto-scroll to the target card if entry query param matches
      if (entryIdFromUrl) {
        setTimeout(() => {
          const el = document.getElementById(`performer-${entryIdFromUrl}`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 300);
      }
    }
    loadData();
  }, [entryIdFromUrl]);

  const filteredPerformers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return performers;

    return performers.filter(
      (item) =>
        item.studentName.toLowerCase().includes(q) ||
        (item.studentDescription && item.studentDescription.toLowerCase().includes(q)) ||
        (item.location && item.location.toLowerCase().includes(q)) ||
        (item.cohort && item.cohort.toLowerCase().includes(q))
    );
  }, [performers, searchQuery]);

  return (
    <main className="min-h-screen bg-slate-50 pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header — Config-driven Title & Subtitle/Description (Strictly Centered) */}
        <div className="w-full flex flex-col items-center justify-center text-center mb-6">
          {subtitle && (
            <p className="w-full text-center text-[11px] font-bold tracking-widest text-gold-600 uppercase mb-1">
              {subtitle}
            </p>
          )}
          <h1 className="w-full text-center text-2xl md:text-3xl font-serif font-medium text-navy-900 tracking-tight mb-2">
            {formattedTitle}
          </h1>
          <p className="text-sm text-slate-600 max-w-2xl mx-auto text-center leading-relaxed">
            {description}
          </p>
        </div>

        {/* Search Student Input Bar (Centered, No Divider Line) */}
        <div className="mb-10 flex justify-center">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search student..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-white border border-slate-200 text-navy-900 placeholder-slate-400 text-xs font-medium focus:outline-none focus:border-gold-600 shadow-xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-navy-900 font-medium"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Performance Grid — Displaying entries in admin-configured custom order */}
        <section className="min-h-[400px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-gold-600">
              <RefreshCw className="w-8 h-8 animate-spin mb-3" />
              <p className="text-sm font-sans font-medium text-slate-600">
                Loading Wall of Honor...
              </p>
            </div>
          ) : filteredPerformers.length === 0 ? (
            <div className="text-center py-16 p-8 rounded-xl bg-white border border-slate-200 shadow-xs max-w-md mx-auto">
              <Award className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <h3 className="text-base font-serif font-semibold text-navy-900 mb-1">
                No students found
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                No performances match &ldquo;{searchQuery}&rdquo;.
              </p>
              <button
                onClick={() => setSearchQuery('')}
                className="px-4 py-1.5 rounded-full bg-gold-600 hover:bg-gold-700 text-white text-xs font-bold transition-all shadow-xs"
              >
                Clear Search
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {filteredPerformers.map((performer) => (
                <div key={performer.id} id={`performer-${performer.id}`} className="scroll-mt-32">
                  <HallOfFameCard
                    performer={performer}
                    initialLiked={likedIds.has(performer.id)}
                    onSelect={(item) => setSelectedSharePerformer(item)}
                    onShareStory={(item) => setSelectedSharePerformer(item)}
                    isHighlighted={performer.id === entryIdFromUrl}
                  />
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Story Share Modal */}
        <StoryShareModal
          performer={selectedSharePerformer}
          onClose={() => setSelectedSharePerformer(null)}
        />
      </div>
    </main>
  );
}

export default function HallOfFameClient({ config }: HallOfFameClientProps) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-gold-500 selection:text-white">
      <Suspense
        fallback={<div className="pt-32 text-center text-slate-500 text-sm">Loading...</div>}
      >
        <HallOfFameContent config={config} />
      </Suspense>
    </div>
  );
}
