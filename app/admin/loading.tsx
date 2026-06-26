import React from 'react';

export default function AdminLoading() {
  return (
    <div className="w-full min-h-[60vh] flex flex-col items-center justify-center text-navy-900">
      <div className="flex flex-col items-center gap-4">
        {/* Quiet luxury style gold spinner */}
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-2 border-slate-100"></div>
          <div className="absolute inset-0 rounded-full border-2 border-t-gold-500 animate-spin"></div>
        </div>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-2">
          Loading Section
        </p>
      </div>
    </div>
  );
}
