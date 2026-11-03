import React, { useState } from 'react';
import { 
  Keyboard, 
  Volume2, 
  ZoomIn, 
  Image as ImageIcon, 
  Users, 
  AlertTriangle, 
  CheckCircle, 
  ExternalLink,
  BookOpen,
  Sparkles,
  CheckCircle2,
  Compass,
  ArrowRight,
  ShieldCheck,
  Check
} from 'lucide-react';

export default function ManualTestingGuide({ onGoToConsole }) {
  const [completedSteps, setCompletedSteps] = useState({});

  const toggleStep = (stepId) => {
    setCompletedSteps(prev => ({
      ...prev,
      [stepId]: !prev[stepId],
    }));
  };

  const steps = [
    {
      id: 'keyboard',
      title: '1. Keyboard Only Navigation',
      icon: Keyboard,
      badge: 'WCAG 2.1.1 & 2.4.7',
      shortDesc: 'Tab through every control; focus must stay clearly visible',
      instructions: [
        'Unplug your mouse or trackpad and navigate using only Tab, Shift+Tab, Enter, Space, and Arrow keys.',
        'Verify that all buttons, links, inputs, and dropdowns can be reached in a logical visual order.',
        'Ensure that a clear, visible focus outline (ring) is displayed on every focused interactive element.',
        'Test that modal dialogs trap focus inside and can be closed with the Escape key without losing focus.',
      ],
      proTip: 'Look out for CSS rules like outline: none without an accompanying custom :focus-visible style.',
    },
    {
      id: 'screenreader',
      title: '2. Screen Reader Testing',
      icon: Volume2,
      badge: 'WCAG 1.3.1 & 4.1.2',
      shortDesc: 'Try NVDA (Windows), VoiceOver (macOS / iOS), or TalkBack (Android)',
      instructions: [
        'Turn on VoiceOver (Cmd + F5 on macOS) or launch NVDA / JAWS on Windows.',
        'Navigate by landmarks (header, nav, main, footer) to see if page regions make sense.',
        'Jump between headings (H key) to confirm the document outline is clear and sequential.',
        'Ensure that buttons announce their actual purpose (e.g. "Close dialog" instead of "X" or "Button").',
      ],
      proTip: 'A screen reader user cannot see visual colors or layout spacing; all hierarchy must be expressed semantically.',
    },
    {
      id: 'zoom',
      title: '3. Zoom to 200% & Reflow',
      icon: ZoomIn,
      badge: 'WCAG 1.4.4 & 1.4.10',
      shortDesc: 'Nothing should be cut off, clipped, or cause two-dimensional scrolling',
      instructions: [
        'In your browser, press Cmd/Ctrl and the "+" key until viewport zoom reaches 200% and 400%.',
        'Verify that all text content reflows into a single column without requiring horizontal scrolling.',
        'Check that sticky headers, banners, or floating action bars do not obscure reading content.',
        'Confirm that form fields and button labels remain fully legible without truncation.',
      ],
      proTip: 'Use relative CSS units like rem and clamp() instead of fixed px heights on text containers.',
    },
    {
      id: 'altquality',
      title: '4. Alt Text Quality Audit',
      icon: ImageIcon,
      badge: 'WCAG 1.1.1',
      shortDesc: 'Present is not the same as useful: test semantic meaning',
      instructions: [
        'Automated scanners check whether the alt attribute is present, but cannot evaluate semantic quality.',
        'Flag placeholder alt texts like "image", "photo", "IMG_4021.jpg", or brand logos labeled as "logo".',
        'Informational images must communicate the equivalent information conveyed to sighted users.',
        'Purely decorative graphics, divider lines, and background flourishes must use alt="" or role="presentation".',
      ],
      proTip: 'Ask yourself: If this image disappeared, what exact sentence would replace it without loss of context?',
    },
    {
      id: 'realusers',
      title: '5. Real User Testing',
      icon: Users,
      badge: 'User Validation',
      shortDesc: 'Test with disabled users and assistive technology power-users',
      instructions: [
        'No automated checklist replaces testing with people who navigate the web using assistive technologies daily.',
        'Include participants with low vision, motor impairments, color blindness, and neurodiverse users.',
        'Observe where users encounter navigation traps or confusion rather than prompting them.',
        'Incorporate feedback directly into recurring design sprints and component libraries.',
      ],
      proTip: 'Accessibility is an ongoing journey of usability and inclusivity, not a one-time compliance checkbox.',
    },
  ];

  const completedCount = Object.values(completedSteps).filter(Boolean).length;
  const progressPercent = Math.round((completedCount / steps.length) * 100);

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
              Human Verification Protocol
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[1.15]">
            Manual Testing Guidance & <span className="italic" style={{ color: '#F28C28' }}>Protocol.</span>
          </h1>

          <p className="mt-4 sm:mt-5 text-sm sm:text-base md:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Automated tools catch syntax and static rules, but human verification is essential for true WCAG 2.1 AA/AAA compliance.
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
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 sm:-mt-10 pb-20 space-y-8 relative z-20">
        
        {/* Verification Progress Tracker (Deep Navy Card) */}
        <div className="p-6 sm:p-8 rounded-3xl bg-[#0B132B] text-slate-100 shadow-2xl border border-slate-800/80 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
          
          {/* Ambient Glow */}
          <div className="absolute -top-24 -right-24 w-72 h-72 bg-[#F28C28]/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10">
            <span className="text-xs font-mono font-bold tracking-widest uppercase text-[#F28C28] block mb-1">
              Checklist Status
            </span>
            <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {completedCount === steps.length ? 'All Manual Protocols Completed!' : `${completedCount} of ${steps.length} Protocols Verified`}
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Follow each protocol to audit screen reader behavior, keyboard traps, and responsive reflow.
            </p>
          </div>

          <div className="relative z-10 flex flex-col items-center sm:items-end w-full md:w-auto shrink-0">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl sm:text-3xl font-black font-mono text-white">
                {progressPercent}%
              </span>
              <span className="text-xs font-mono text-slate-400">
                ({completedCount}/{steps.length})
              </span>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full sm:w-48 h-2.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
              <div 
                className="h-full bg-gradient-to-r from-[#F28C28] to-emerald-400 transition-all duration-500 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

        </div>

        {/* Disclaimer Notice Card */}
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-3.5 text-amber-950">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm leading-relaxed">
            <span className="font-bold text-amber-900 block mb-0.5">Important Compliance Note:</span>
            Automated checkers identify roughly 30–50% of WCAG failure modes. A clean automated scan is necessary but not sufficient for full legal accessibility compliance.
          </div>
        </div>

        {/* 5 Testing Protocol Cards */}
        <div className="space-y-6">
          {steps.map((step) => {
            const Icon = step.icon;
            const isDone = !!completedSteps[step.id];

            return (
              <div 
                key={step.id} 
                className={`bg-white/95 backdrop-blur-md rounded-2xl border transition-all duration-300 p-6 sm:p-8 shadow-[0_10px_25px_-5px_rgba(7,13,30,0.06)] hover:shadow-xl ${
                  isDone 
                    ? 'border-emerald-300/80 bg-emerald-50/15' 
                    : 'border-slate-200/90 hover:border-[#F28C28]/60'
                }`}
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
                  <div className="flex items-center gap-3.5">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                      isDone 
                        ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-600' 
                        : 'bg-orange-500/10 border border-orange-500/20 text-[#F28C28]'
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h3 className="font-bold text-lg text-slate-900">
                          {step.title}
                        </h3>
                        <span className="px-2.5 py-0.5 rounded-md text-[11px] font-mono font-bold bg-slate-100 text-slate-600 border border-slate-200">
                          {step.badge}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        {step.shortDesc}
                      </p>
                    </div>
                  </div>

                  {/* Toggle Verification Button */}
                  <button
                    onClick={() => toggleStep(step.id)}
                    className={`self-start sm:self-auto px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                      isDone
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20'
                        : 'bg-slate-100 hover:bg-orange-50 text-slate-700 hover:text-[#F28C28] border border-slate-200 hover:border-[#F28C28]'
                    }`}
                  >
                    {isDone ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Verified</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
                        <span>Mark as Verified</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Instructions List */}
                <div className="py-5">
                  <span className="block text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-3">
                    Step-by-Step Testing Procedure:
                  </span>
                  <ul className="space-y-2.5">
                    {step.instructions.map((inst, idx) => (
                      <li key={idx} className="text-xs sm:text-sm text-slate-700 flex items-start gap-2.5 leading-relaxed">
                        <span className="mt-1 w-1.5 h-1.5 rounded-full bg-[#F28C28] shrink-0" />
                        <span>{inst}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Pro Tip Box */}
                <div className="p-3.5 sm:p-4 rounded-xl bg-slate-900 text-slate-200 border border-slate-800 flex items-center gap-3 text-xs leading-relaxed">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-[#F28C28] text-slate-950 shrink-0">
                    PRO TIP
                  </span>
                  <span>{step.proTip}</span>
                </div>

              </div>
            );
          })}
        </div>

        {/* Bottom CTA Banner */}
        <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-r from-[#070D1E] via-[#0B132B] to-[#111F4D] border border-slate-800 shadow-xl text-white flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="text-center sm:text-left">
            <h3 className="text-xl sm:text-2xl font-bold text-white">
              Ready to run an automated check?
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-md">
              Start with Lantern's automated scanner to fix syntax issues, then use this checklist for final polish.
            </p>
          </div>

          <button
            onClick={onGoToConsole}
            className="px-6 py-3.5 rounded-xl bg-[#F28C28] hover:bg-[#e07d1e] text-slate-950 font-black text-sm shadow-xl shadow-orange-500/25 hover:shadow-orange-500/40 hover:-translate-y-0.5 transition-all flex items-center gap-2 cursor-pointer shrink-0"
          >
            <Compass className="w-4 h-4 text-slate-950" />
            <span>Go to Scan Console</span>
            <ArrowRight className="w-4 h-4 text-slate-950 ml-1" />
          </button>
        </div>

      </div>

    </div>
  );
}
