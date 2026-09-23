import React from 'react';

export default function RootLoading() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-3 border-slate-100 border-t-gold-500 rounded-full animate-spin" />
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
          Loading...
        </p>
      </div>
    </div>
  );
}
