import React from 'react';

export default function Hero({ onSelectSample }) {
  return (
    <section className="relative overflow-hidden pt-12 pb-10 bg-gradient-to-b from-amber-50/20 via-white to-slate-50 border-b border-slate-200/60">
      {/* Background ambient lighting centered */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-72 bg-amber-100/30 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center text-center">
        
        {/* Official Brand Logo Centered */}
        <div className="flex items-center justify-center mb-5">
          <img 
            src="/lantern-logo.png" 
            alt="Lantern" 
            className="h-16 sm:h-20 w-auto object-contain drop-shadow-xs"
          />
        </div>

        {/* Exact Title: Make the Web Accessible to Everyone. */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.08] text-slate-950">
          Make the Web{' '}
          <span style={{ color: '#F28C28' }}>Accessible</span>
          <span className="block" style={{ color: '#F28C28' }}>
            to Everyone.
          </span>
        </h1>

        {/* Clean, Focused Subtitle */}
        <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl mx-auto font-normal">
          Instant WCAG 2.1 diagnostics and copy-paste code fixes for developers.
        </p>

        {/* Centered Quick Test Suite Pills */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">
            Quick Test:
          </span>
          <button
            onClick={() => onSelectSample('broken-bakery')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-300 hover:border-[#F28C28] hover:bg-amber-50 text-slate-700 hover:text-amber-900 shadow-2xs transition-all cursor-pointer"
          >
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            Broken Bakery (Baseline)
          </button>
          <button
            onClick={() => onSelectSample('greenleaf-bad')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-300 hover:border-[#F28C28] hover:bg-amber-50 text-slate-700 hover:text-amber-900 shadow-2xs transition-all cursor-pointer"
          >
            <span className="w-2 h-2 rounded-full bg-orange-500"></span>
            GreenLeaf Café (Flawed)
          </button>
          <button
            onClick={() => onSelectSample('greenleaf-good')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-300 hover:border-emerald-500 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 shadow-2xs transition-all cursor-pointer"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            GreenLeaf Café (Fixed A+)
          </button>
        </div>

      </div>
    </section>
  );
}
