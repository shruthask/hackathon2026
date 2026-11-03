import React from 'react';
import { 
  Cpu, 
  Globe, 
  ShieldCheck, 
  Code2,
  ArrowRight,
  Compass,
  Sparkles
} from 'lucide-react';

export default function HowItWorks({ onGoToConsole }) {
  const steps = [
    {
      num: '01',
      title: 'Input Vector',
      desc: 'Test against a live production URL, upload static markup, or paste HTML fragments.',
      icon: Globe,
    },
    {
      num: '02',
      title: 'AST & DOM Parsing',
      desc: 'Parallel Python engine parses syntax trees and evaluates computed styles.',
      icon: Cpu,
    },
    {
      num: '03',
      title: 'WCAG 2.1 Rules',
      desc: 'Audits heading hierarchy, image semantics, form labels, and color contrast.',
      icon: ShieldCheck,
    },
    {
      num: '04',
      title: 'Instant Fixes',
      desc: 'Receive weighted severity scores and copy-paste remediation code patches.',
      icon: Code2,
    },
  ];

  const scanners = [
    {
      title: '1. Image Semantics',
      badge: 'WCAG 1.1.1',
      desc: 'Validates descriptive alt text and distinguishes decorative graphics.',
    },
    {
      title: '2. Heading Hierarchy',
      badge: 'WCAG 1.3.1',
      desc: 'Enforces sequential h1–h6 nesting for screen reader navigation.',
    },
    {
      title: '3. Form Control Labels',
      badge: 'WCAG 4.1.2',
      desc: 'Verifies explicit labels, aria-labels, and rejects empty placeholders.',
    },
    {
      title: '4. Color Contrast',
      badge: 'WCAG 1.4.3',
      desc: 'Calculates AA luminance ratios: 4.5:1 body text and 3.0:1 UI elements.',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      
      {/* Dark Royal Blue Hero Header */}
      <section className="relative overflow-hidden bg-[#070D1E] text-white pt-14 pb-16 px-4 sm:px-6 lg:px-8">
        
        {/* Ambient radial glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[250px] bg-gradient-to-r from-blue-600/15 via-[#F28C28]/15 to-transparent blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F28C28]/10 border border-[#F28C28]/30 mb-4">
            <Sparkles className="w-3.5 h-3.5 text-[#F28C28]" />
            <span className="text-[10px] font-bold text-[#F28C28] tracking-widest uppercase font-mono">
              System Architecture
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-[1.18]">
            One Engine. <span className="italic" style={{ color: '#F28C28' }}>Three Front Doors.</span>
            <span className="block mt-1 text-white">Zero Guesswork.</span>
          </h1>

          <p className="mt-3 text-xs sm:text-sm md:text-base text-slate-300 max-w-xl mx-auto leading-relaxed">
            Lantern unifies static code linting with live browser auditing into a single standardized pipeline.
          </p>
        </div>

        {/* Subtle fade into solid blue at bottom */}
        <div className="absolute bottom-0 inset-x-0 h-12 pointer-events-none bg-gradient-to-b from-transparent to-[#070D1E]" />
      </section>

      {/* Smooth Multi-stop Gradient Bridge from Dark Blue to Slate-50 */}
      <div 
        className="w-full h-14 sm:h-20 pointer-events-none"
        style={{
          background: 'linear-gradient(180deg, #070D1E 0%, #0C1838 20%, #172B5C 45%, #627AA8 72%, #D7E1EE 90%, #F8FAFC 100%)'
        }}
      />

      {/* Main Content Area */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 sm:-mt-8 pb-16 space-y-8 relative z-20">
        
        {/* 4 Step Architecture Cards (Streamlined & Minimal) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div 
                key={step.num} 
                className="bg-white/95 backdrop-blur-md p-5 rounded-2xl border border-slate-200/90 shadow-[0_10px_25px_-5px_rgba(7,13,30,0.05)] hover:shadow-lg hover:border-[#F28C28]/60 transition-all duration-200 hover:-translate-y-0.5 group"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-2xl font-black font-mono text-[#F28C28]">
                    {step.num}
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-[#F28C28]">
                    <Icon className="w-4 h-4" />
                  </div>
                </div>

                <h3 className="text-sm font-bold text-slate-900 group-hover:text-slate-950">
                  {step.title}
                </h3>
                <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                  {step.desc}
                </p>
              </div>
            );
          })}
        </div>

        {/* Compact Scanner Suite (Deep Navy Card) */}
        <div className="p-6 sm:p-7 rounded-2xl bg-[#0B132B] text-slate-100 shadow-xl border border-slate-800/80 relative overflow-hidden">
          
          {/* Ambient Glow */}
          <div className="absolute -top-20 -right-20 w-60 h-60 bg-[#F28C28]/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex items-center justify-between mb-5 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#F28C28]/20 border border-[#F28C28]/40 flex items-center justify-center text-[#F28C28]">
                <Cpu className="w-3.5 h-3.5" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                The Modular Scanner Suite
              </h3>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#F28C28]/10 text-[#F28C28] border border-[#F28C28]/30">
              4 Scanners
            </span>
          </div>

          <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {scanners.map((scanner) => (
              <div 
                key={scanner.title} 
                className="p-3.5 rounded-xl bg-[#070D1E]/90 border border-slate-800/90 hover:border-[#F28C28]/50 transition-all"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <h4 className="font-bold text-[#F28C28] text-xs">
                    {scanner.title}
                  </h4>
                  <span className="text-[9px] font-mono text-slate-400 bg-slate-800/80 px-1 py-0.5 rounded">
                    {scanner.badge}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {scanner.desc}
                </p>
              </div>
            ))}
          </div>

        </div>

        {/* Minimal Bottom Action Banner */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-[#070D1E] via-[#0B132B] to-[#111F4D] border border-slate-800 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-white">
              Ready to test your application?
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              Run an instant diagnostic on your HTML, URL, or code snippet.
            </p>
          </div>

          <button
            onClick={onGoToConsole}
            className="px-5 py-2.5 rounded-xl bg-[#F28C28] hover:bg-[#e07d1e] text-slate-950 font-bold text-xs shadow-lg shadow-orange-500/20 hover:-translate-y-0.5 transition-all flex items-center gap-2 cursor-pointer shrink-0"
          >
            <Compass className="w-3.5 h-3.5 text-slate-950" />
            <span>Launch Audit Console</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-950" />
          </button>
        </div>

      </div>

    </div>
  );
}
