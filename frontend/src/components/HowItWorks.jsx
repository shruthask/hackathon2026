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
  ArrowRight
} from 'lucide-react';

export default function HowItWorks({ onGoToConsole }) {
  const steps = [
    {
      num: '01',
      title: 'Choose Your Input Vector',
      desc: 'Test against a live production URL, upload a local static template, or paste raw HTML fragments straight from your code editor.',
      tags: ['Live URL', 'Raw HTML', 'File Upload', 'Chrome DOM'],
    },
    {
      num: '02',
      title: 'FastAPI Core AST & DOM Parsing',
      desc: 'The Python engine runs parallel scanners using BeautifulSoup4 for syntactic AST parsing and Playwright for computed style & live contrast evaluation.',
      tags: ['FastAPI', 'BeautifulSoup4', 'Playwright', 'lxml'],
    },
    {
      num: '03',
      title: 'WCAG 2.1 Rule Evaluation',
      desc: 'Modular rules inspect images for alt semantics, audit heading nesting (h1 → h2 → h3), verify form field labeling, and calculate color luminance ratios.',
      tags: ['Alt Text', 'Heading Order', 'Form Labels', 'Luminance Ratios'],
    },
    {
      num: '04',
      title: 'Actionable Patch Generation',
      desc: 'Violations are tagged with in-page DOM selectors, weighted severity penalties, and plain-language fixes that you can copy directly into your codebase.',
      tags: ['Weighted Score', 'Letter Grade', 'Copyable Fix', 'CSV / PDF'],
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12 animate-in fade-in duration-300">
      
      {/* Top Banner */}
      <div className="text-center max-w-3xl mx-auto">
        <span className="text-xs font-bold text-amber-600 uppercase tracking-widest font-mono">
          System Architecture & Pipeline
        </span>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-2">
          One engine. Three front doors. Zero guesswork.
        </h2>
        <p className="mt-3 text-slate-600 text-sm sm:text-base leading-relaxed">
          Lantern unifies static code linting with live browser runtime auditing into a single standardized REST API.
        </p>
      </div>

      {/* 4 Step Architecture Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {steps.map((step) => (
          <div key={step.num} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between hover:border-amber-400 transition-colors">
            <div>
              <span className="text-3xl font-black text-amber-500 font-mono">
                {step.num}
              </span>
              <h3 className="text-base font-bold text-slate-900 mt-2">
                {step.title}
              </h3>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                {step.desc}
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap gap-1.5">
              {step.tags.map((tag) => (
                <span key={tag} className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Engine & Front Doors Breakdown */}
      <div className="p-8 rounded-3xl bg-slate-900 text-slate-100 shadow-xl">
        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
          <Cpu className="w-5 h-5 text-amber-400" />
          The Modular Scanner Suite
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-4 rounded-xl bg-slate-800/70 border border-slate-700">
            <h4 className="font-bold text-amber-400 text-sm">1. Image Semantics</h4>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Differentiates between informational graphics requiring descriptive alt text and decorative images marked with <code className="bg-slate-950 px-1 py-0.5 rounded text-amber-300 font-mono text-[11px]">alt=""</code> or <code className="bg-slate-950 px-1 py-0.5 rounded text-amber-300 font-mono text-[11px]">role="presentation"</code>.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-800/70 border border-slate-700">
            <h4 className="font-bold text-amber-400 text-sm">2. Heading Hierarchy</h4>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Enforces strict sequential heading levels (no jumping from h1 to h3 or h4). Verifies documents begin with an h1 for proper screen reader outline generation.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-800/70 border border-slate-700">
            <h4 className="font-bold text-amber-400 text-sm">3. Form Control Labels</h4>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Flags inputs lacking explicit labels. Rejects placeholders used as pseudo-labels and checks for matching <code className="bg-slate-950 px-1 py-0.5 rounded text-amber-300 font-mono text-[11px]">for="id"</code> associations.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-800/70 border border-slate-700">
            <h4 className="font-bold text-amber-400 text-sm">4. Color Contrast</h4>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Evaluates relative luminance between foreground text and backgrounds, enforcing WCAG AA thresholds: 4.5:1 for standard text and 3.0:1 for large typography.
            </p>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-xs text-slate-400 font-mono">
            FastAPI Backend • Beautiful Soup 4 • Playwright Engine
          </span>
          <button
            onClick={onGoToConsole}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-colors cursor-pointer"
          >
            Launch Scan Console
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

    </div>
  );
}
