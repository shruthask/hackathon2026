import React from 'react';
import { Compass, Download, ArrowRight } from 'lucide-react';
import AxialBeam from './AxialBeam';
import lanternLogo from '../assets/lantern-logo.png';

export default function Hero({ onStartAudit }) {
  return (
    <section className="relative overflow-hidden bg-[#070D1E] text-white min-h-[calc(100vh-4.5rem)] flex flex-col justify-center">
      {/* React Bits Pro Axial Beam: Soft volumetric rays rising from beyond the frame to fill the full viewport */}
      <AxialBeam
        className="w-full min-h-[calc(100vh-4.5rem)] flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-12"
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
        {/* Centered Content Container */}
        <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center justify-center text-center my-auto">
          
          {/* Brand Logo Centered */}
          <div className="flex items-center justify-center mb-6">
            <img 
              src={lanternLogo} 
              alt="Lantern" 
              className="h-28 sm:h-36 md:h-44 w-auto object-contain drop-shadow-[0_20px_45px_rgba(242,140,40,0.3)] hover:scale-105 transition-transform duration-300"
            />
          </div>

          {/* Minimal Two-line Title matching logo font:
              "Illuminate the " (white) + "Web." (italic orange)
              "Debug " (white) + "Accessibility." (italic orange) */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[1.15] font-sans">
            <span className="text-white drop-shadow-md">Illuminate the </span>
            <span className="italic drop-shadow-md" style={{ color: '#F28C28' }}>Web.</span>
            <span className="block mt-1.5 sm:mt-2.5">
              <span className="text-white drop-shadow-md">Debug </span>
              <span className="italic drop-shadow-md" style={{ color: '#F28C28' }}>Accessibility.</span>
            </span>
          </h1>

          {/* Minimal Subtitle */}
          <p className="mt-4 sm:mt-5 text-sm sm:text-base md:text-lg text-slate-200/90 leading-relaxed max-w-lg mx-auto font-normal drop-shadow">
            Instant WCAG 2.1 diagnostics and copy-paste code fixes for developers.
          </p>

          {/* Two Action Boxes (Start Audit & Download Extension) - Symmetrical & Clean */}
          <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-xl px-2">
            
            {/* Box 1: Start Audit */}
            <button
              onClick={onStartAudit}
              className="w-full sm:w-[250px] h-[72px] px-4 rounded-2xl bg-gradient-to-r from-[#F28C28] to-[#EA580C] hover:from-[#e57d19] hover:to-[#d94e08] text-slate-950 shadow-xl shadow-orange-500/20 hover:shadow-orange-500/35 hover:-translate-y-0.5 active:translate-y-0 border border-white/25 transition-all duration-200 flex items-center gap-3.5 cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-xl bg-slate-950/10 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Compass className="w-5 h-5 text-slate-950 group-hover:rotate-45 transition-transform duration-300" />
              </div>
              <div className="text-left flex-1 min-w-0">
                <span className="block text-sm font-bold tracking-tight text-slate-950 whitespace-nowrap">Start Audit</span>
                <span className="block text-[11px] font-semibold text-slate-900/75 mt-0.5 whitespace-nowrap">Scan URL or HTML</span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-950/60 group-hover:translate-x-1 group-hover:text-slate-950 transition-all shrink-0" />
            </button>

            {/* Box 2: Download Extension */}
            <a
              href="./lantern-extension.zip"
              download="lantern-extension.zip"
              className="w-full sm:w-[250px] h-[72px] px-4 rounded-2xl bg-[#0B132B]/80 hover:bg-[#0E1938] text-white border border-slate-700/70 hover:border-[#F28C28]/80 shadow-xl shadow-black/30 hover:shadow-orange-500/10 hover:-translate-y-0.5 active:translate-y-0 backdrop-blur-xl transition-all duration-200 flex items-center gap-3.5 cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:border-[#F28C28]/40 transition-all">
                <Download className="w-5 h-5 text-[#F28C28] group-hover:translate-y-0.5 transition-transform" />
              </div>
              <div className="text-left flex-1 min-w-0">
                <span className="block text-sm font-bold tracking-tight text-white whitespace-nowrap">Download Extension</span>
                <span className="block text-[11px] font-medium text-slate-400 mt-0.5 whitespace-nowrap">Chrome Manifest V3</span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:translate-x-1 group-hover:text-[#F28C28] transition-all shrink-0" />
            </a>

          </div>

        </div>
      </AxialBeam>

      {/* Subtle fade of the beam canvas into solid deep blue at bottom */}
      <div className="absolute bottom-0 inset-x-0 h-28 sm:h-36 pointer-events-none z-10 bg-gradient-to-b from-transparent to-[#070D1E]" />
    </section>
  );
}
