import React from 'react';

export default function HallOfFameLoading() {
  return (
    <main className="min-h-screen bg-slate-50 pt-24 pb-20 animate-pulse">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Title & Description Skeleton */}
        <div className="flex flex-col items-center justify-center text-center mb-6">
          <div className="h-3 w-32 bg-slate-200 rounded mb-2" />
          <div className="h-8 w-72 bg-slate-200 rounded-lg mb-3" />
          <div className="h-4 w-full max-w-xl bg-slate-200 rounded" />
        </div>

        {/* Search Bar Skeleton */}
        <div className="mb-10 flex justify-center">
          <div className="w-full max-w-sm h-10 bg-slate-200 rounded-xl" />
        </div>

        {/* Cards Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col space-y-4"
            >
              <div className="aspect-video w-full bg-slate-100 rounded-xl" />
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-200" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-4 w-1/2 bg-slate-200 rounded" />
                  <div className="h-3 w-1/3 bg-slate-100 rounded" />
                </div>
              </div>
              <div className="h-12 w-full bg-slate-50 rounded-xl p-3" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
