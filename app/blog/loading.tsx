import React from 'react';

export default function BlogLoading() {
  return (
    <main className="min-h-screen pt-32 pb-20 bg-white animate-pulse">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="max-w-3xl mb-16 space-y-3">
          <div className="h-3 w-28 bg-slate-200 rounded" />
          <div className="h-10 w-96 max-w-full bg-slate-200 rounded-lg" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-4">
              <div className="aspect-[16/10] w-full bg-slate-100 rounded-2xl" />
              <div className="h-4 w-1/3 bg-slate-200 rounded" />
              <div className="h-6 w-5/6 bg-slate-200 rounded" />
              <div className="h-4 w-full bg-slate-100 rounded" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
