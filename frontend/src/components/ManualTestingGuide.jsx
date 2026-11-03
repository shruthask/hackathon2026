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
  BookOpen
} from 'lucide-react';

export default function ManualTestingGuide() {
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
      shortDesc: 'Tab through every control; focus must stay visible',
      instructions: [
        'Unplug your mouse or trackpad and use only the Tab, Shift+Tab, Enter, Space, and Arrow keys.',
        'Verify that all buttons, links, inputs, and dropdowns can be reached in a logical visual order.',
        'Ensure that a clear, visible focus outline (ring) is displayed on every focused element.',
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
        'Jump between headings (H key) to confirm the document structure is intuitive.',
        'Ensure that buttons announce their actual purpose (e.g. "Close dialogue" instead of "X" or "Button").',
      ],
      proTip: 'A screen reader user cannot see visual colors or layout spacing; information must be expressed semantically.',
    },
    {
      id: 'zoom',
      title: '3. Zoom to 200% & Reflow',
      icon: ZoomIn,
      badge: 'WCAG 1.4.4 & 1.4.10',
      shortDesc: 'Nothing should be cut off, clipped, or overlap',
      instructions: [
        'In your browser, press Cmd/Ctrl and the "+" key until zoom reaches 200% or 400%.',
        'Verify that all text content reflows into a single column without requiring horizontal scrolling.',
        'Check that floating headers, banners, or sticky action bars do not obscure main reading text.',
        'Confirm that form fields and button labels remain fully legible without truncation.',
      ],
      proTip: 'Use relative CSS units like rem and clamp() instead of fixed px heights on text containers.',
    },
    {
      id: 'altquality',
      title: '4. Alt Text Quality Audit',
      icon: ImageIcon,
      badge: 'WCAG 1.1.1',
      shortDesc: 'Present is not the same as useful',
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

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-300">
      
      {/* Title Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 rounded-3xl bg-amber-500 text-slate-950 shadow-md">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-950 text-white text-xs font-bold uppercase tracking-wider mb-2">
            <BookOpen className="w-3.5 h-3.5" />
            Slide 11 Specification
          </div>
          <h2 className="text-2xl font-black tracking-tight">
            Manual Testing Guidance & Protocol
          </h2>
          <p className="mt-1 text-sm font-medium text-slate-900 max-w-xl">
            Automated tools catch syntax and static rules, but human verification is essential for true WCAG 2.1 AA/AAA compliance.
          </p>
        </div>

        {/* Progress Tracker */}
        <div className="bg-slate-950 text-white p-4 rounded-2xl flex-shrink-0 text-center min-w-44">
          <span className="text-xs uppercase font-bold text-slate-400">Checklist Progress</span>
          <div className="text-2xl font-black text-amber-400 mt-0.5">
            {completedCount} / {steps.length}
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full mt-2 overflow-hidden">
            <div 
              className="bg-amber-400 h-full transition-all duration-300"
              style={{ width: `${(completedCount / steps.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Warning Box */}
      <div className="p-5 rounded-2xl bg-white border-2 border-amber-300 shadow-xs flex items-start gap-4">
        <div className="p-2.5 rounded-xl bg-amber-100 text-amber-800 flex-shrink-0">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-900">
            Important: Not a Compliance Claim
          </h3>
          <p className="mt-1 text-xs sm:text-sm text-slate-600 leading-relaxed">
            Automated checks find only some barriers. A clean scan does not mean a page meets WCAG. 
            This disclaimer is shown on the Lantern website, in the Chrome extension, and in every exported CSV report.
          </p>
        </div>
      </div>

      {/* Five Step Cards */}
      <div className="space-y-4">
        {steps.map((step) => {
          const Icon = step.icon;
          const isDone = completedSteps[step.id];

          return (
            <div
              key={step.id}
              className={`p-6 rounded-2xl border transition-all ${
                isDone 
                  ? 'bg-emerald-50/50 border-emerald-300 shadow-xs' 
                  : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
              }`}
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl flex-shrink-0 ${isDone ? 'bg-emerald-200 text-emerald-800' : 'bg-slate-100 text-slate-700'}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-bold text-slate-900">
                        {step.title}
                      </h4>
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-600 font-mono">
                        {step.badge}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{step.shortDesc}</p>
                  </div>
                </div>

                {/* Toggle checkbox button */}
                <button
                  type="button"
                  onClick={() => toggleStep(step.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isDone 
                      ? 'bg-emerald-600 text-white shadow-xs' 
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <CheckCircle className={`w-4 h-4 ${isDone ? 'text-white' : 'text-slate-400'}`} />
                  <span>{isDone ? 'Verified Complete' : 'Mark as Verified'}</span>
                </button>
              </div>

              {/* Instructions list */}
              <div className="mt-4">
                <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Testing Checklist:
                </h5>
                <ul className="space-y-1.5 text-xs text-slate-600 list-disc list-inside">
                  {step.instructions.map((ins, i) => (
                    <li key={i} className="leading-relaxed">
                      {ins}
                    </li>
                  ))}
                </ul>

                {/* Pro tip */}
                <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 flex items-start gap-2">
                  <strong className="text-amber-700 font-semibold flex-shrink-0">Pro Tip:</strong>
                  <span>{step.proTip}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
