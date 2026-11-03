import React from 'react';
import { 
  ShieldCheck, 
  AlertOctagon, 
  AlertTriangle, 
  AlertCircle, 
  Info,
  Check,
  ExternalLink,
  Code2
} from 'lucide-react';

export default function Guidelines() {
  const tiers = [
    {
      name: 'Critical Severity',
      badge: '-12 pts',
      bg: 'bg-rose-50 border-rose-200 text-rose-900',
      badgeBg: 'bg-rose-600 text-white',
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
      bg: 'bg-orange-50 border-orange-200 text-orange-900',
      badgeBg: 'bg-orange-600 text-white',
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
      bg: 'bg-amber-50 border-amber-200 text-amber-900',
      badgeBg: 'bg-amber-500 text-white',
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
      bg: 'bg-blue-50 border-blue-200 text-blue-900',
      badgeBg: 'bg-blue-600 text-white',
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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto">
        <span className="text-xs font-bold text-amber-600 uppercase tracking-widest font-mono">
          WCAG 2.1 Rule Specifications
        </span>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-2">
          Compliance Standards & Severity Tiers
        </h2>
        <p className="mt-3 text-slate-600 text-sm sm:text-base leading-relaxed">
          How Lantern calculates health scores, assigns grades, and maps violations to international WCAG standards.
        </p>
      </div>

      {/* Severity Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {tiers.map((tier) => {
          const Icon = tier.icon;
          return (
            <div key={tier.name} className={`p-6 rounded-2xl border ${tier.bg} shadow-xs`}>
              <div className="flex items-center justify-between mb-3">
                <span className="flex items-center gap-2 font-bold text-base">
                  <Icon className="w-5 h-5" />
                  {tier.name}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-black ${tier.badgeBg}`}>
                  {tier.badge}
                </span>
              </div>

              <p className="text-xs font-medium opacity-90 leading-relaxed mb-4">
                {tier.definition}
              </p>

              <div className="pt-3 border-t border-black/10">
                <span className="text-[11px] font-bold uppercase tracking-wider block mb-2 opacity-75">
                  Typical Findings:
                </span>
                <ul className="space-y-1.5 text-xs">
                  {tier.examples.map((ex, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-current mt-1.5 flex-shrink-0" />
                      <span>{ex}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>

      {/* Contrast Rules Callout */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-3">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
          Color Contrast Ratios (WCAG 1.4.3 Level AA)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-600">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="font-bold text-slate-900 text-sm block mb-1">Standard Body Text</span>
            <p className="leading-relaxed">Requires a minimum contrast ratio of <strong className="text-amber-700">4.5:1</strong> against adjacent background pixels.</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="font-bold text-slate-900 text-sm block mb-1">Large Text & Headers</span>
            <p className="leading-relaxed">Text at or above 18pt (24px) or bold 14pt (18.66px) requires a minimum ratio of <strong className="text-amber-700">3.0:1</strong>.</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="font-bold text-slate-900 text-sm block mb-1">UI Components & Icons</span>
            <p className="leading-relaxed">Visual boundary indicators and essential graphical elements require at least <strong className="text-amber-700">3.0:1</strong> (WCAG 1.4.11).</p>
          </div>
        </div>
      </div>

    </div>
  );
}
