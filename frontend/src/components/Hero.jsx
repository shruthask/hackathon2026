import React from 'react';
import { Compass, Download } from 'lucide-react';
import FluidMatrixBackground from './FluidMatrixBackground';

export default function Hero({ onStartAudit }) {
  return (
    <section className="relative overflow-hidden pt-12 pb-16 bg-[#070D1E] text-white">
      
      {/* Fluid Dynamic Matrix Wave Background from Reference Image */}
      <FluidMatrixBackground />

      {/* Content Container */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center text-center">
        
        {/* Brand Logo Centered */}
        <div className="flex items-center justify-center mb-5">
          <img 
            src="/lantern-logo.png" 
            alt="Lantern" 
            className="h-24 sm:h-32 md:h-36 w-auto object-contain drop-shadow-2xl"
          />
        </div>

        {/* Scaled-down Title matching logo font:
            "Illuminate the " (white) + "Web." (italic orange)
            "Debug " (white) + "Accessibility." (italic orange) */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-[1.18] font-sans">
          <span className="text-white">Illuminate the </span>
          <span className="italic" style={{ color: '#F28C28' }}>Web.</span>
          <span className="block mt-1 sm:mt-1.5">
            <span className="text-white">Debug </span>
            <span className="italic" style={{ color: '#F28C28' }}>Accessibility.</span>
          </span>
        </h1>

        {/* Minimal Subtitle */}
        <p className="mt-3.5 text-xs sm:text-sm md:text-base text-slate-300 leading-relaxed max-w-md mx-auto font-normal">
          Instant WCAG 2.1 diagnostics and copy-paste code fixes for developers.
        </p>

        {/* Two Action Boxes (Start Audit & Download Extension) */}
        <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3.5 w-full max-w-md">
          
          {/* Box 1: Start Audit */}
          <button
            onClick={onStartAudit}
            className="w-full sm:w-1/2 p-3.5 rounded-xl bg-[#F28C28] hover:bg-[#e07d1e] text-slate-950 font-black text-xs sm:text-sm shadow-xl shadow-orange-500/20 hover:shadow-orange-500/30 transition-all flex items-center justify-center gap-2.5 cursor-pointer group"
          >
            <Compass className="w-4 h-4 text-slate-950 group-hover:rotate-45 transition-transform" />
            <div className="text-left">
              <span className="block leading-none font-black">Start Audit</span>
              <span className="block text-[10px] font-medium text-slate-900/80 mt-1">Scan URL or HTML</span>
            </div>
          </button>

          {/* Box 2: Download Extension */}
          <a
            href="/lantern-extension.zip"
            download="lantern-extension.zip"
            className="w-full sm:w-1/2 p-3.5 rounded-xl bg-slate-900/80 hover:bg-slate-800/90 text-white border border-slate-700/80 hover:border-[#F28C28] shadow-xl backdrop-blur-md transition-all flex items-center justify-center gap-2.5 cursor-pointer group"
          >
            <Download className="w-4 h-4 text-[#F28C28] group-hover:translate-y-0.5 transition-transform" />
            <div className="text-left">
              <span className="block leading-none font-black text-white">Download Extension</span>
              <span className="block text-[10px] font-medium text-slate-400 mt-1">Chrome Manifest V3</span>
            </div>
          </a>

        </div>

      </div>

      {/* Subtle bottom fade into page */}
      <div className="absolute bottom-0 inset-x-0 h-10 bg-gradient-to-t from-slate-50 to-transparent pointer-events-none" />
    </section>
  );
}
