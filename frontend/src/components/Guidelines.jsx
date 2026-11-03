import React from 'react';
import { 
  ShieldCheck, 
  AlertOctagon, 
  AlertTriangle, 
  AlertCircle, 
  Info,
  Check,
  ExternalLink,
  Code2,
  Sparkles,
  Compass,
  ArrowRight
} from 'lucide-react';

export default function Guidelines({ onGoToConsole }) {
  const tiers = [
    {
      name: 'Critical Severity',
      badge: '-12 pts',
      border: 'border-rose-200/80 hover:border-rose-400',
      badgeBg: 'bg-rose-500/10 text-rose-600 border border-rose-500/20',
      iconBg: 'bg-rose-50 text-rose-600 border border-rose-100',
      bulletColor: 'text-rose-500',
      icon: AlertOctagon,
      definition: 'Directly blocks users with assistive technologies from perceiving content or completing core actions.',
      examples: [
        'Image missing alt attribute entirely (WCAG 1.1.1)',
        'Form input with no associated label or aria-label (WCAG 4.1.2)',
        'Keyboard trap where users cannot escape interactive elements (WCAG 2.1.2)',
      ],
    },
    {
      name: 'Serious Severity',
      badge: '-6 pts',
      border: 'border-orange-200/80 hover:border-[#F28C28]',
      badgeBg: 'bg-orange-500/10 text-[#F28C28] border border-orange-500/20',
      iconBg: 'bg-orange-50 text-[#F28C28] border border-orange-100',
      bulletColor: 'text-[#F28C28]',
      icon: AlertTriangle,
      definition: 'Creates substantial friction and disrupts screen reader page navigation and document outlines.',
      examples: [
        'Skipped heading levels, e.g. jumping from h1 directly to h4 (WCAG 1.3.1)',
        'Page missing initial top-level h1 heading (WCAG 1.3.1)',
        'Buttons or links with zero discernible accessible text (WCAG 2.4.4)',
      ],
    },
    {
      name: 'Moderate Severity',
      badge: '-3 pts',
      border: 'border-amber-200/80 hover:border-amber-400',
      badgeBg: 'bg-amber-500/10 text-amber-600 border border-amber-500/20',
      iconBg: 'bg-amber-50 text-amber-600 border border-amber-100',
      bulletColor: 'text-amber-500',
      icon: AlertCircle,
      definition: 'Impairs readability or usability for users with low vision, cognitive differences, or situational impairments.',
      examples: [
        'Text contrast ratio below 4.5:1 on standard elements (WCAG 1.4.3)',
        'Missing lang attribute on <html> element (WCAG 3.1.1)',
        'Generic link text like "click here" or "learn more" without context (WCAG 2.4.4)',
      ],
    },
    {
      name: 'Minor Severity',
      badge: '-1 pt',
      border: 'border-blue-200/80 hover:border-blue-400',
      badgeBg: 'bg-blue-500/10 text-blue-600 border border-blue-500/20',
      iconBg: 'bg-blue-50 text-blue-600 border border-blue-100',
      bulletColor: 'text-blue-500',
      icon: Info,
      definition: 'Deviations from modern HTML best practices and non-blocking accessibility polish.',
      examples: [
        'Non-semantic wrapper divs where landmark elements (<header>, <main>) are preferred',
        'Duplicate element IDs that do not interfere with active form labels',
        'Redundant title attributes matching link text',
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      
      {/* Dark Royal Blue Hero Header */}
      <section className="relative overflow-hidden bg-[#070D1E] text-white pt-16 pb-20 px-4 sm:px-6 lg:px-8">
        
        {/* Ambient radial glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gradient-to-r from-blue-600/15 via-[#F28C28]/15 to-transparent blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#F28C28]/10 border border-[#F28C28]/30 mb-5">
            <Sparkles className="w-3.5 h-3.5 text-[#F28C28]" />
            <span className="text-[11px] font-bold text-[#F28C28] tracking-widest uppercase font-mono">
              WCAG 2.1 Rule Specifications
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[1.15]">
            Compliance Standards & <span className="italic" style={{ color: '#F28C28' }}>Severity Tiers.</span>
          </h1>

          <p className="mt-4 sm:mt-5 text-sm sm:text-base md:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            How Lantern calculates health scores, assigns letter grades, and maps violations to international WCAG standards.
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
        
        {/* Severity Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tiers.map((tier) => {
            const Icon = tier.icon;
            return (
              <div 
                key={tier.name} 
                className={`bg-white/95 backdrop-blur-md p-6 sm:p-7 rounded-2xl border ${tier.border} shadow-[0_10px_25px_-5px_rgba(7,13,30,0.06)] hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between group`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl ${tier.iconBg} flex items-center justify-center shrink-0`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <h3 className="font-bold text-lg text-slate-900 group-hover:text-slate-950 transition-colors">
                        {tier.name}
                      </h3>
                    </div>

                    <span className={`px-3 py-1 rounded-full text-xs font-mono font-black ${tier.badgeBg}`}>
                      {tier.badge}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal mb-5">
                    {tier.definition}
                  </p>

                  <div className="pt-4 border-t border-slate-100">
                    <span className="block text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-2.5">
                      Typical Violations:
                    </span>
                    <ul className="space-y-2">
                      {tier.examples.map((ex) => (
                        <li key={ex} className="text-xs text-slate-700 flex items-start gap-2 leading-snug">
                          <span className={`mt-0.5 text-base leading-none font-black ${tier.bulletColor}`}>•</span>
                          <span>{ex}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Color Contrast Standard Guide (Deep Navy Card) */}
        <div className="p-8 sm:p-10 rounded-3xl bg-[#0B132B] text-slate-100 shadow-2xl border border-slate-800/80 relative overflow-hidden">
          
          {/* Ambient Glow in corner */}
          <div className="absolute -top-24 -right-24 w-80 h-80 bg-[#F28C28]/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#F28C28]/20 border border-[#F28C28]/40 flex items-center justify-center text-[#F28C28]">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  Color Contrast Thresholds (WCAG 1.4.3 Level AA)
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-1.5">
                Lantern accurately computes relative luminance against background canvas pixels.
              </p>
            </div>

            <span className="self-start sm:self-auto px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#F28C28]/10 text-[#F28C28] border border-[#F28C28]/30">
              Level AA Standard
            </span>
          </div>

          <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-5">
            
            <div className="p-5 rounded-2xl bg-[#070D1E]/90 border border-slate-800 hover:border-[#F28C28]/50 transition-all">
              <span className="text-3xl font-black font-mono text-[#F28C28] block mb-1">
                4.5:1
              </span>
              <h4 className="font-bold text-white text-sm mb-1.5">Standard Body Text</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Applies to body paragraphs, form inputs, list items, and typography under 18pt (24px) or bold 14pt (18.66px).
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#070D1E]/90 border border-slate-800 hover:border-[#F28C28]/50 transition-all">
              <span className="text-3xl font-black font-mono text-[#F28C28] block mb-1">
                3.0:1
              </span>
              <h4 className="font-bold text-white text-sm mb-1.5">Large Text & Headers</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Text at or above 18pt (24px) or bold 14pt (18.66px). Requires a minimum contrast ratio of 3.0:1.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#070D1E]/90 border border-slate-800 hover:border-[#F28C28]/50 transition-all">
              <span className="text-3xl font-black font-mono text-[#F28C28] block mb-1">
                3.0:1
              </span>
              <h4 className="font-bold text-white text-sm mb-1.5">UI Components & Icons</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Visual boundary indicators, interactive button borders, and essential graphical elements (WCAG 1.4.11).
              </p>
            </div>

          </div>
        </div>

        {/* Bottom CTA Banner */}
        <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-r from-[#070D1E] via-[#0B132B] to-[#111F4D] border border-slate-800 shadow-xl text-white flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="text-center sm:text-left">
            <h3 className="text-xl sm:text-2xl font-bold text-white">
              Want to see where your website stands?
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-md">
              Run an automated scan and get instant severity-ranked WCAG 2.1 diagnostics.
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
