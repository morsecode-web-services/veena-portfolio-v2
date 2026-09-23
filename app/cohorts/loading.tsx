import React from 'react';

export default function CohortsLoading() {
  return (
    <main className="min-h-screen bg-slate-50 pt-24 pb-20 animate-pulse">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Skeleton */}
        <div className="text-center mb-8 flex flex-col items-center">
          <div className="h-8 w-64 bg-slate-200 rounded-lg mb-4" />
          <div className="h-4 w-full max-w-xl bg-slate-200 rounded mb-2" />
          <div className="h-4 w-full max-w-md bg-slate-200 rounded" />
        </div>

        {/* Cohort Cards Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mt-10">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col space-y-4"
            >
              <div className="h-48 w-full bg-slate-100 rounded-xl" />
              <div className="h-6 w-3/4 bg-slate-200 rounded" />
              <div className="space-y-2 py-2">
                <div className="h-4 w-full bg-slate-100 rounded" />
                <div className="h-4 w-5/6 bg-slate-100 rounded" />
              </div>
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="h-8 w-24 bg-slate-200 rounded-lg" />
                <div className="h-10 w-32 bg-slate-200 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
