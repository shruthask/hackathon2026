import React, { useState } from 'react';
import { 
  Check, 
  Copy, 
  Code, 
  Wrench, 
  AlertTriangle, 
  Image as ImageIcon, 
  Heading, 
  FormInput, 
  Eye, 
  Layers,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export default function IssueCard({ issue, index }) {
  const [copiedFix, setCopiedFix] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  // Category Icon helper
  const getCategoryIcon = (category) => {
    switch (category?.toLowerCase()) {
      case 'images':
        return <ImageIcon className="w-3.5 h-3.5 text-blue-500" />;
      case 'headings':
        return <Heading className="w-3.5 h-3.5 text-purple-500" />;
      case 'forms':
        return <FormInput className="w-3.5 h-3.5 text-emerald-500" />;
      case 'contrast':
        return <Eye className="w-3.5 h-3.5 text-amber-500" />;
      default:
        return <Layers className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  // Severity styling helper matching Slide 7 & 8
  const getSeverityBadge = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
        return {
          bg: 'bg-rose-100 text-rose-800 border-rose-200',
          dot: 'bg-rose-500',
          label: 'Critical',
        };
      case 'serious':
        return {
          bg: 'bg-orange-100 text-orange-800 border-orange-200',
          dot: 'bg-orange-500',
          label: 'Serious',
        };
      case 'moderate':
        return {
          bg: 'bg-amber-100 text-amber-800 border-amber-200',
          dot: 'bg-amber-500',
          label: 'Moderate',
        };
      case 'minor':
      default:
        return {
          bg: 'bg-blue-100 text-blue-800 border-blue-200',
          dot: 'bg-blue-500',
          label: 'Minor',
        };
    }
  };

  const sev = getSeverityBadge(issue.severity);

  const handleCopyFix = () => {
    if (!issue.how_to_fix) return;
    navigator.clipboard.writeText(issue.how_to_fix);
    setCopiedFix(true);
    setTimeout(() => setCopiedFix(false), 2000);
  };

  const handleCopySnippet = () => {
    if (!issue.element) return;
    navigator.clipboard.writeText(issue.element);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  return (
    <article className="bg-white rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all overflow-hidden card-print">
      
      {/* Header bar */}
      <div className="p-4 sm:px-5 sm:py-3.5 bg-slate-50/70 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
        
        <div className="flex flex-wrap items-center gap-2">
          {/* Index indicator */}
          <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-[11px] font-bold flex items-center justify-center">
            {index + 1}
          </span>

          {/* Severity Badge */}
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${sev.bg}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${sev.dot}`}></span>
            {sev.label}
          </span>

          {/* Category Pill */}
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-white border border-slate-200 text-slate-700">
            {getCategoryIcon(issue.category)}
            <span className="capitalize">{issue.category || 'General'}</span>
          </span>

          {/* Rule ID */}
          <span className="font-mono text-xs font-medium text-slate-500">
            {issue.rule_id}
          </span>
        </div>

        {/* WCAG Criterion tag & collapse toggle */}
        <div className="flex items-center gap-2">
          {issue.wcag_criteria && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-50 border border-indigo-200 text-indigo-700">
              WCAG {issue.wcag_criteria}
            </span>
          )}

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors no-print"
            aria-label={isExpanded ? "Collapse issue details" : "Expand issue details"}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

      </div>

      {/* Main Issue Content */}
      <div className="p-4 sm:p-5">
        
        {/* Issue Message */}
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-bold text-slate-900 leading-snug">
              {issue.message}
            </h3>
            {issue.selector && (
              <p className="mt-1 text-xs text-slate-500 font-mono flex items-center gap-1.5">
                <span className="text-slate-400">Selector:</span>
                <code className="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded text-[11px] select-all">
                  {issue.selector}
                </code>
              </p>
            )}
          </div>
        </div>

        {/* Collapsible Details */}
        {isExpanded && (
          <div className="mt-4 space-y-3.5">
            
            {/* Offending Code Snippet */}
            {issue.element && (
              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-1.5">
                  <span className="flex items-center gap-1">
                    <Code className="w-3.5 h-3.5 text-slate-400" />
                    Offending HTML Snippet:
                  </span>
                  <button
                    type="button"
                    onClick={handleCopySnippet}
                    className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-800 no-print"
                  >
                    {copiedSnippet ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedSnippet ? 'Copied' : 'Copy HTML'}</span>
                  </button>
                </div>
                <div className="p-3 bg-slate-900 rounded-lg text-slate-200 font-mono text-xs overflow-x-auto border border-slate-800">
                  <code>{issue.element}</code>
                </div>
              </div>
            )}

            {/* Plain-Language Fix Guidance */}
            {issue.how_to_fix && (
              <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                    <Wrench className="w-3.5 h-3.5 text-emerald-700" />
                    How to Fix (Plain Language):
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyFix}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold bg-emerald-100 hover:bg-emerald-200 text-emerald-900 transition-colors no-print cursor-pointer"
                  >
                    {copiedFix ? <Check className="w-3 h-3 text-emerald-700" /> : <Copy className="w-3 h-3 text-emerald-700" />}
                    <span>{copiedFix ? 'Copied!' : 'Copy Fix'}</span>
                  </button>
                </div>
                <p className="text-xs sm:text-sm text-emerald-950 leading-relaxed font-sans mt-1">
                  {issue.how_to_fix}
                </p>
              </div>
            )}

          </div>
        )}

      </div>

    </article>
  );
}
