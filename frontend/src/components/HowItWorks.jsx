import React from 'react';
import { 
  Cpu, 
  Layers, 
  Terminal, 
  CheckCircle2, 
  Flame, 
  Zap, 
  Globe, 
  FileCode, 
  Puzzle,
  ArrowRight,
  Compass,
  Sparkles,
  ShieldCheck,
  Code2
} from 'lucide-react';

export default function HowItWorks({ onGoToConsole }) {
  const steps = [
    {
      num: '01',
      title: 'Choose Your Input Vector',
      desc: 'Test against a live production URL, upload a local static template, or paste raw HTML fragments straight from your code editor.',
      tags: ['Live URL', 'Raw HTML', 'File Upload', 'Chrome DOM'],
      icon: Globe,
    },
    {
      num: '02',
      title: 'FastAPI Core AST & DOM Parsing',
      desc: 'The Python engine runs parallel scanners using BeautifulSoup4 for syntactic AST parsing and Playwright for computed style & live contrast evaluation.',
      tags: ['FastAPI', 'BeautifulSoup4', 'Playwright', 'lxml'],
      icon: Cpu,
    },
    {
      num: '03',
      title: 'WCAG 2.1 Rule Evaluation',
      desc: 'Modular rules inspect images for alt semantics, audit heading nesting (h1 → h2 → h3), verify form field labeling, and calculate color luminance ratios.',
      tags: ['Alt Text', 'Heading Order', 'Form Labels', 'Luminance Ratios'],
      icon: ShieldCheck,
    },
    {
      num: '04',
      title: 'Actionable Patch Generation',
      desc: 'Violations are tagged with in-page DOM selectors, weighted severity penalties, and plain-language fixes that you can copy directly into your codebase.',
      tags: ['Weighted Score', 'Letter Grade', 'Copyable Fix', 'CSV / PDF'],
      icon: Code2,
    },
  ];

  const scanners = [
    {
      title: '1. Image Semantics',
      badge: 'WCAG 1.1.1',
      desc: 'Differentiates between informational graphics requiring descriptive alt text and decorative images marked with alt="" or role="presentation".',
    },
    {
      title: '2. Heading Hierarchy',
      badge: 'WCAG 1.3.1',
      desc: 'Enforces strict sequential heading levels (no jumping from h1 directly to h3 or h4). Verifies documents begin with an h1 for proper screen reader outline generation.',
    },
    {
      title: '3. Form Control Labels',
      badge: 'WCAG 4.1.2',
      desc: 'Flags inputs lacking explicit labels. Rejects placeholders used as pseudo-labels and checks for matching for="id" associations and aria-label attributes.',
    },
    {
      title: '4. Color Contrast',
      badge: 'WCAG 1.4.3',
      desc: 'Evaluates relative luminance between foreground text and backgrounds, enforcing WCAG AA thresholds: 4.5:1 for standard text and 3.0:1 for large typography.',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      
      {/* Dark Royal Blue Hero Header matching Main Page */}
      <section className="relative overflow-hidden bg-[#070D1E] text-white pt-16 pb-20 px-4 sm:px-6 lg:px-8">
        
        {/* Ambient radial glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gradient-to-r from-blue-600/15 via-[#F28C28]/15 to-transparent blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#F28C28]/10 border border-[#F28C28]/30 mb-5">
            <Sparkles className="w-3.5 h-3.5 text-[#F28C28]" />
            <span className="text-[11px] font-bold text-[#F28C28] tracking-widest uppercase font-mono">
              System Architecture & Pipeline
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[1.15]">
            One Engine. <span className="italic" style={{ color: '#F28C28' }}>Three Front Doors.</span>
            <span className="block mt-1 sm:mt-2 text-white">Zero Guesswork.</span>
          </h1>

          <p className="mt-4 sm:mt-5 text-sm sm:text-base md:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Lantern unifies static code linting with live browser runtime auditing into a single standardized REST API.
          </p>
        </div>

        {/* Subtle fade into solid blue at bottom */}
        <div className="absolute bottom-0 inset-x-0 h-16 pointer-events-none bg-gradient-to-b from-transparent to-[#070D1E]" />
      </section>

      {/* Smooth Multi-stop Gradient Bridge from Dark Blue to Slate-50 */}
      <div 
        className="w-full h-16 sm:h-24 pointer-events-none"
        style={{
          background: 'linear-gradient(180deg, #070D1E 0%, #0C1838 20%, #172B5C 45%, #627AA8 72%, #D7E1EE 90%, #F8FAFC 100%)'
        }}
      />

      {/* Main Content Area */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 sm:-mt-10 pb-20 space-y-12 relative z-20">
        
        {/* 4 Step Architecture Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div 
                key={step.num} 
                className="bg-white/95 backdrop-blur-md p-6 rounded-2xl border border-slate-200/90 shadow-[0_10px_25px_-5px_rgba(7,13,30,0.06)] hover:shadow-xl hover:shadow-orange-500/10 hover:border-[#F28C28]/60 transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-3xl font-black font-mono tracking-tight text-[#F28C28] group-hover:scale-105 transition-transform inline-block">
                      {step.num}
                    </span>
                    <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-[#F28C28]">
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 group-hover:text-slate-950 transition-colors">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                    {step.desc}
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap gap-1.5">
                  {step.tags.map((tag) => (
                    <span 
                      key={tag} 
                      className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200/60 group-hover:border-orange-200 group-hover:bg-orange-50/60 group-hover:text-orange-950 transition-colors"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Modular Scanner Suite (Deep Navy Card) */}
        <div className="p-8 sm:p-10 rounded-3xl bg-[#0B132B] text-slate-100 shadow-2xl border border-slate-800/80 relative overflow-hidden">
          
          {/* Ambient Glow in corner */}
          <div className="absolute -top-24 -right-24 w-80 h-80 bg-[#F28C28]/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#F28C28]/20 border border-[#F28C28]/40 flex items-center justify-center text-[#F28C28]">
                  <Cpu className="w-4 h-4" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  The Modular Scanner Suite
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-1.5">
                Every scan executes parallel WCAG 2.1 compliance algorithms with zero external vendor dependencies.
              </p>
            </div>

            <span className="self-start sm:self-auto px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#F28C28]/10 text-[#F28C28] border border-[#F28C28]/30">
              4 Core Scanners
            </span>
          </div>

          <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {scanners.map((scanner) => (
              <div 
                key={scanner.title} 
                className="p-5 rounded-2xl bg-[#070D1E]/90 border border-slate-800 hover:border-[#F28C28]/60 transition-all hover:-translate-y-0.5 group"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-[#F28C28] text-sm group-hover:text-amber-400 transition-colors">
                    {scanner.title}
                  </h4>
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-800/80 px-1.5 py-0.5 rounded">
                    {scanner.badge}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed mt-2">
                  {scanner.desc}
                </p>
              </div>
            ))}
          </div>

        </div>

        {/* Bottom CTA Banner */}
        <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-r from-[#070D1E] via-[#0B132B] to-[#111F4D] border border-slate-800 shadow-xl text-white flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="text-center sm:text-left">
            <h3 className="text-xl sm:text-2xl font-bold text-white">
              Ready to test your application?
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-md">
              Run a complete diagnostic against your HTML, production URL, or uploaded markup in seconds.
            </p>
          </div>

          <button
            onClick={onGoToConsole}
            className="px-6 py-3.5 rounded-xl bg-[#F28C28] hover:bg-[#e07d1e] text-slate-950 font-black text-sm shadow-xl shadow-orange-500/25 hover:shadow-orange-500/40 hover:-translate-y-0.5 transition-all flex items-center gap-2 cursor-pointer shrink-0"
          >
            <Compass className="w-4 h-4 text-slate-950" />
            <span>Launch Scan Console</span>
            <ArrowRight className="w-4 h-4 text-slate-950 ml-1" />
          </button>
        </div>

      </div>

    </div>
  );
}
