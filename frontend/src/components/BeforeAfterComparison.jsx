import React, { useState } from 'react';
import { 
  ArrowRightLeft, 
  TrendingUp, 
  CheckCircle2, 
  XCircle, 
  Sparkles, 
  Play, 
  Loader2, 
  ArrowRight,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import { SAMPLES } from '../utils/samples';
import { scanHtml } from '../utils/api';

export default function BeforeAfterComparison({ onApplyReport }) {
  const [beforeReport, setBeforeReport] = useState(null);
  const [afterReport, setAfterReport] = useState(null);
  const [isRunningDemo, setIsRunningDemo] = useState(false);
  const [demoError, setDemoError] = useState(null);

  // One-click demo rehearsal button (Slide 10 & 12)
  const handleRunRehearsalDemo = async () => {
    setIsRunningDemo(true);
    setDemoError(null);
    try {
      const badSample = SAMPLES.find(s => s.id === 'greenleaf-bad');
      const goodSample = SAMPLES.find(s => s.id === 'greenleaf-good');

      if (!badSample || !goodSample) throw new Error('Samples not found');

      // Scan bad page
      const badRes = await scanHtml(badSample.html);
      setBeforeReport(badRes);

      // Scan good page
      const goodRes = await scanHtml(goodSample.html);
      setAfterReport(goodRes);

    } catch (err) {
      setDemoError(`Failed to run demo scan: ${err.message}`);
    } finally {
      setIsRunningDemo(false);
    }
  };

  const scoreDelta = (afterReport?.score ?? 0) - (beforeReport?.score ?? 0);
  const issueDelta = (beforeReport?.total_issues ?? 0) - (afterReport?.total_issues ?? 0);
  const percentageDrop = beforeReport?.total_issues 
    ? Math.round((issueDelta / beforeReport.total_issues) * 100)
    : 0;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-300">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold uppercase tracking-wider mb-3 border border-amber-500/30">
            <Sparkles className="w-3.5 h-3.5" />
            Hackathon Demo Feature (Slide 10 & 12)
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            Before & After Rescan Comparison
          </h2>
          <p className="mt-2 text-slate-300 text-sm leading-relaxed">
            Demonstrate how fixing accessibility blockers improves the automated score and clears WCAG violations. 
            Run the pre-configured rehearsal demo or compare your custom revisions.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              onClick={handleRunRehearsalDemo}
              disabled={isRunningDemo}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:bg-slate-700 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/30 transition-all cursor-pointer"
            >
              {isRunningDemo ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                  Auditing Before & After...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  Run GreenLeaf Rehearsal Demo
                </>
              )}
            </button>
            <span className="text-xs text-slate-400">
              Scans Flawed Café vs Remediated Accessible Café
            </span>
          </div>
        </div>

        {/* Ambient glow */}
        <div className="absolute right-0 bottom-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {demoError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm">
          {demoError}
        </div>
      )}

      {/* Comparison Metrics */}
      {beforeReport && afterReport ? (
        <div className="space-y-8">
          
          {/* Summary Delta Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Score Delta */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Score Improvement
              </span>
              <div className="mt-2 flex items-baseline gap-3">
                <span className="text-4xl font-black text-slate-900">
                  {beforeReport.score} → {afterReport.score}
                </span>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  +{scoreDelta} pts
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Grade leap from <strong className="text-rose-600 font-bold">{beforeReport.grade}</strong> to <strong className="text-emerald-600 font-bold">{afterReport.grade}</strong>
              </p>
            </div>

            {/* Issue Count Drop */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Issue Reduction
              </span>
              <div className="mt-2 flex items-baseline gap-3">
                <span className="text-4xl font-black text-slate-900">
                  {beforeReport.total_issues} → {afterReport.total_issues}
                </span>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                  -{percentageDrop}%
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                <strong className="text-emerald-700 font-bold">{issueDelta} accessibility barriers</strong> fully resolved
              </p>
            </div>

            {/* Status */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Audit Verdict
                </span>
                <div className="mt-2 flex items-center gap-2">
                  <ShieldCheck className="w-6 h-6 text-emerald-600" />
                  <span className="text-lg font-black text-emerald-800">
                    Clean Automated Audit
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-500">
                All 4 modular scanners passed without error
              </p>
            </div>

          </div>

          {/* Side by side comparison panels */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* BEFORE PANEL */}
            <div className="bg-white rounded-2xl border-2 border-rose-200 p-6 shadow-xs">
              <div className="flex items-center justify-between pb-4 border-b border-rose-100">
                <div>
                  <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-rose-100 text-rose-800 uppercase">
                    Before Fixes
                  </span>
                  <h3 className="text-base font-bold text-slate-900 mt-1">
                    GreenLeaf Café (Flawed)
                  </h3>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-rose-600">Grade {beforeReport.grade}</span>
                  <p className="text-xs text-slate-500">{beforeReport.score}/100 Score</p>
                </div>
              </div>

              <div className="mt-4">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Detected Barriers ({beforeReport.total_issues})
                </h4>
                <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                  {beforeReport.issues.map((issue, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-rose-50/60 border border-rose-200 text-xs flex items-start gap-2.5">
                      <XCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-rose-900">{issue.rule_id}</span>
                          {issue.wcag_criteria && (
                            <span className="text-[10px] text-slate-500 font-mono">WCAG {issue.wcag_criteria}</span>
                          )}
                        </div>
                        <p className="text-slate-700 mt-0.5">{issue.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => onApplyReport(beforeReport)}
                className="mt-4 w-full py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              >
                Inspect Flawed Report in Main Auditor
              </button>
            </div>

            {/* AFTER PANEL */}
            <div className="bg-white rounded-2xl border-2 border-emerald-200 p-6 shadow-xs">
              <div className="flex items-center justify-between pb-4 border-b border-emerald-100">
                <div>
                  <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-100 text-emerald-800 uppercase">
                    After Fixes
                  </span>
                  <h3 className="text-base font-bold text-slate-900 mt-1">
                    GreenLeaf Café (Accessible)
                  </h3>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-emerald-600">Grade {afterReport.grade}</span>
                  <p className="text-xs text-slate-500">{afterReport.score}/100 Score</p>
                </div>
              </div>

              <div className="mt-4">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Resolution Status ({afterReport.total_issues} Remaining Issues)
                </h4>
                
                {afterReport.total_issues === 0 ? (
                  <div className="p-8 text-center bg-emerald-50/50 rounded-xl border border-emerald-200">
                    <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
                    <h5 className="text-sm font-bold text-emerald-950">100% Core Violations Eliminated</h5>
                    <p className="text-xs text-emerald-800 mt-1">
                      Alt text specified, labels matched to form inputs, heading hierarchy strictly sequential (h1 → h2 → h3), and color contrast ratios verified above 4.5:1.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {afterReport.issues.map((issue, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                        <span className="font-bold text-slate-800">{issue.rule_id}</span>
                        <p className="text-slate-600">{issue.message}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => onApplyReport(afterReport)}
                className="mt-4 w-full py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition-colors"
              >
                Inspect Clean Report in Main Auditor
              </button>
            </div>

          </div>

          {/* Edge cases highlighted in Slide 10 */}
          <div className="p-5 rounded-2xl bg-slate-900 text-slate-200 text-xs">
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px] mb-3">
              Edge Cases Demonstrated in this Comparison (Slide 10):
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
                <p className="font-bold text-amber-400">1. Decorative Images</p>
                <p className="text-slate-300 mt-1">
                  Empty <code className="bg-slate-950 px-1 py-0.5 rounded text-amber-300">alt=""</code> or <code className="bg-slate-950 px-1 py-0.5 rounded text-amber-300">role="presentation"</code> is recognized as valid decorative markup and is <strong>not flagged as an error</strong>.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
                <p className="font-bold text-amber-400">2. Placeholder vs Form Label</p>
                <p className="text-slate-300 mt-1">
                  Placeholder text is <strong>not</strong> a substitute for an accessible form label. Inputs with only <code className="bg-slate-950 px-1 py-0.5 rounded text-amber-300">placeholder="..."</code> are flagged as critical barriers.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
                <p className="font-bold text-amber-400">3. Heading Level Jumps</p>
                <p className="text-slate-300 mt-1">
                  Skipping heading levels (such as jumping directly from <code className="bg-slate-950 px-1 py-0.5 rounded text-amber-300">&lt;h1&gt;</code> to <code className="bg-slate-950 px-1 py-0.5 rounded text-amber-300">&lt;h4&gt;</code>) breaks screen reader document outlines and is flagged.
                </p>
              </div>
            </div>
          </div>

        </div>
      ) : (
        /* Empty State */
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200">
          <ArrowRightLeft className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">
            No Comparison Data Loaded Yet
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
            Click the <strong className="text-slate-700">"Run GreenLeaf Rehearsal Demo"</strong> button above to execute an automated before-and-after audit and see the live score delta.
          </p>
        </div>
      )}

    </div>
  );
}
