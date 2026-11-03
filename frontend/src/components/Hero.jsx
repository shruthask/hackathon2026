import React from 'react';
import { Compass, Download } from 'lucide-react';
import AxialBeam from './AxialBeam';

export default function Hero({ onStartAudit }) {
  return (
    <section className="relative overflow-hidden bg-[#070D1E] text-white">
      {/* React Bits Pro Axial Beam: Soft volumetric rays rising from beyond the frame */}
      <AxialBeam
        className="w-full min-h-[580px] sm:min-h-[620px] flex items-center justify-center pt-14 pb-20"
        backgroundColor="#070D1E"
        colors={['#0A1B54', '#1E40AF', '#F28C28', '#FFE7D1']}
        originX={0.5}
        originY={-0.65}
        angle={0}
        tilt={22}
        spread={38}
        rays={11}
        rayWidth={1.2}
        reach={1.25}
        swing={0.9}
        flicker={0.55}
        haze={1.1}
        intensity={1.2}
        speed={0.85}
        interactive={true}
        cursorBoost={1.3}
        cursorWidth={6}
        grain={0.03}
      >
        {/* Content Container */}
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center text-center">
          
          {/* Brand Logo Centered */}
          <div className="flex items-center justify-center mb-5">
            <img 
              src="./lantern-logo.png" 
              alt="Lantern" 
              className="h-24 sm:h-32 md:h-36 w-auto object-contain drop-shadow-[0_20px_35px_rgba(242,140,40,0.25)] hover:scale-105 transition-transform duration-300"
            />
          </div>

          {/* Minimal Two-line Title matching logo font:
              "Illuminate the " (white) + "Web." (italic orange)
              "Debug " (white) + "Accessibility." (italic orange) */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-[1.18] font-sans">
            <span className="text-white drop-shadow-md">Illuminate the </span>
            <span className="italic drop-shadow-md" style={{ color: '#F28C28' }}>Web.</span>
            <span className="block mt-1 sm:mt-1.5">
              <span className="text-white drop-shadow-md">Debug </span>
              <span className="italic drop-shadow-md" style={{ color: '#F28C28' }}>Accessibility.</span>
            </span>
          </h1>

          {/* Minimal Subtitle */}
          <p className="mt-3.5 text-xs sm:text-sm md:text-base text-slate-200/90 leading-relaxed max-w-md mx-auto font-normal drop-shadow">
            Instant WCAG 2.1 diagnostics and copy-paste code fixes for developers.
          </p>

          {/* Two Action Boxes (Start Audit & Download Extension) */}
          <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3.5 w-full max-w-md">
            
            {/* Box 1: Start Audit */}
            <button
              onClick={onStartAudit}
              className="w-full sm:w-1/2 p-3.5 rounded-xl bg-[#F28C28] hover:bg-[#e07d1e] text-slate-950 font-black text-xs sm:text-sm shadow-xl shadow-orange-500/25 hover:shadow-orange-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2.5 cursor-pointer group"
            >
              <Compass className="w-4 h-4 text-slate-950 group-hover:rotate-45 transition-transform" />
              <div className="text-left">
                <span className="block leading-none font-black">Start Audit</span>
                <span className="block text-[10px] font-semibold text-slate-900/80 mt-1">Scan URL or HTML</span>
              </div>
            </button>

            {/* Box 2: Download Extension */}
            <a
              href="./lantern-extension.zip"
              download="lantern-extension.zip"
              className="w-full sm:w-1/2 p-3.5 rounded-xl bg-slate-900/80 hover:bg-slate-800/95 text-white border border-slate-700/80 hover:border-[#F28C28] shadow-xl shadow-black/40 hover:-translate-y-0.5 active:translate-y-0 backdrop-blur-md transition-all flex items-center justify-center gap-2.5 cursor-pointer group"
            >
              <Download className="w-4 h-4 text-[#F28C28] group-hover:translate-y-0.5 transition-transform" />
              <div className="text-left">
                <span className="block leading-none font-black text-white">Download Extension</span>
                <span className="block text-[10px] font-medium text-slate-400 mt-1">Chrome Manifest V3</span>
              </div>
            </a>

          </div>

        </div>
      </AxialBeam>

      {/* Subtle bottom fade into page */}
      <div className="absolute bottom-0 inset-x-0 h-10 bg-gradient-to-t from-slate-50 to-transparent pointer-events-none z-20" />
    </section>
  );
}
