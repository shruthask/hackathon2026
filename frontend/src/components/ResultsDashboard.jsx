import React, { useState, useMemo } from 'react';
import { 
  Download, 
  Printer, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertCircle, 
  Share2, 
  Sparkles, 
  ArrowRightLeft,
  Info
} from 'lucide-react';
import ScoreGauge from './ScoreGauge';
import SeverityCards from './SeverityCards';
import IssueCard from './IssueCard';
import { downloadCsvReport } from '../utils/api';

export default function ResultsDashboard({ 
  report, 
  onRescan, 
  onOpenCompareWithCurrent 
}) {
  const [severityFilter, setSeverityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);

  // Filter issues based on severity, category, and search query
  const filteredIssues = useMemo(() => {
    if (!report?.issues) return [];

    return report.issues.filter(issue => {
      // Severity check
      if (severityFilter !== 'all' && issue.severity !== severityFilter) {
        return false;
      }

      // Category check
      if (categoryFilter !== 'all') {
        const cat = (issue.category || 'general').toLowerCase();
        if (cat !== categoryFilter.toLowerCase()) return false;
      }

      // Search query check
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesMsg = issue.message?.toLowerCase().includes(query);
        const matchesRule = issue.rule_id?.toLowerCase().includes(query);
        const matchesWcag = issue.wcag_criteria?.toLowerCase().includes(query);
        const matchesElem = issue.element?.toLowerCase().includes(query);
        const matchesFix = issue.how_to_fix?.toLowerCase().includes(query);
        if (!matchesMsg && !matchesRule && !matchesWcag && !matchesElem && !matchesFix) {
          return false;
        }
      }

      return true;
    });
  }, [report, severityFilter, categoryFilter, searchQuery]);

  // Categories present in the report
  const categories = useMemo(() => {
    const set = new Set();
    report?.issues?.forEach(i => {
      if (i.category) set.add(i.category.toLowerCase());
    });
    return Array.from(set);
  }, [report]);

  const handleExportCsv = async () => {
    setIsExporting(true);
    await downloadCsvReport(report);
    setIsExporting(false);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(report, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  if (!report) return null;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Top Meta & Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
        <div>
          <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">
            Audit Results Overview
          </span>
          <h2 className="text-xl font-black text-slate-900 mt-0.5">
            {report.page_title || report.url || (report.source === 'file' ? 'Uploaded HTML Document' : 'HTML Code Audit')}
          </h2>
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
            <span>Source: <strong className="font-mono text-slate-700 capitalize">{report.source}</strong></span>
            {report.hostname && (
              <>
                <span>•</span>
                <span>Host: <strong className="font-mono text-slate-700">{report.hostname}</strong></span>
              </>
            )}
            <span>•</span>
            <span>Total Findings: <strong className="text-slate-900 font-bold">{report.total_issues}</strong></span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto no-print">
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={isExporting}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white border border-slate-300 hover:border-slate-400 text-slate-700 shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white border border-slate-300 hover:border-slate-400 text-slate-700 shadow-xs transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>PDF Report</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenCompareWithCurrent(report)}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-50 border border-amber-300 hover:bg-amber-100 text-amber-900 shadow-xs transition-colors cursor-pointer"
          >
            <ArrowRightLeft className="w-3.5 h-3.5 text-amber-600" />
            <span>Compare Before / After</span>
          </button>

          <button
            type="button"
            onClick={handleCopyJson}
            className="hidden lg:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>{copiedJson ? 'Copied JSON!' : 'Copy JSON'}</span>
          </button>
        </div>
      </div>

      {/* Score Gauge */}
      <ScoreGauge score={report.score} grade={report.grade} />

      {/* Severity Breakdown Cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Violations Grouped by Severity
          </h3>
          {severityFilter !== 'all' && (
            <button
              onClick={() => setSeverityFilter('all')}
              className="text-xs font-semibold text-amber-600 hover:underline"
            >
              Reset filter (Show All)
            </button>
          )}
        </div>
        <SeverityCards 
          summary={report.summary} 
          activeFilter={severityFilter} 
          onSelectFilter={setSeverityFilter} 
        />
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-3 no-print">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter findings by keyword, WCAG rule, selector, or message..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-amber-500"
            />
          </div>

          {/* Category Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            <button
              onClick={() => setCategoryFilter('all')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
                categoryFilter === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Categories ({report.issues?.length || 0})
            </button>
            {['images', 'headings', 'forms', 'contrast'].map(cat => {
              const count = report.issues?.filter(i => (i.category || 'general').toLowerCase() === cat).length || 0;
              return (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap capitalize transition-colors ${
                    categoryFilter === cat
                      ? 'bg-amber-600 text-white font-bold'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat} ({count})
                </button>
              );
            })}
          </div>

        </div>

        {/* Results summary pill */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
          <span>
            Showing <strong className="text-slate-800">{filteredIssues.length}</strong> of{' '}
            <strong className="text-slate-800">{report.issues?.length || 0}</strong> findings
          </span>
          {(severityFilter !== 'all' || categoryFilter !== 'all' || searchQuery) && (
            <button
              onClick={() => {
                setSeverityFilter('all');
                setCategoryFilter('all');
                setSearchQuery('');
              }}
              className="text-amber-600 hover:underline font-semibold"
            >
              Clear all filters
            </button>
          )}
        </div>
      </div>

      {/* Issues List */}
      <div className="space-y-4">
        {filteredIssues.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
            {report.issues?.length === 0 ? (
              <div className="max-w-md mx-auto">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  Zero Automated Violations Detected!
                </h3>
                <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                  Congratulations! This page passed all automated scanner rules for images, heading order, 
                  form inputs, and color contrast.
                </p>
                <div className="mt-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs">
                  Remember to conduct manual keyboard and screen reader checks before declaring full compliance.
                </div>
              </div>
            ) : (
              <div className="max-w-md mx-auto">
                <AlertCircle className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                <h3 className="text-sm font-bold text-slate-800">No findings matched your active filters</h3>
                <p className="text-xs text-slate-500 mt-1">Try resetting severity or clearing the search query.</p>
                <button
                  type="button"
                  onClick={() => { setSeverityFilter('all'); setCategoryFilter('all'); setSearchQuery(''); }}
                  className="mt-3 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700"
                >
                  Reset Filters
                </button>
              </div>
            )}
          </div>
        ) : (
          filteredIssues.map((issue, idx) => (
            <IssueCard key={`${issue.rule_id}-${idx}`} issue={issue} index={idx} />
          ))
        )}
      </div>

      {/* Disclaimer Section from Slide 11 & Report payload */}
      <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-amber-900 text-xs flex items-start gap-3">
        <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <strong className="font-bold">Official Auditor Notice:</strong>
          <p className="mt-0.5 leading-relaxed text-amber-800">
            {report.disclaimer}
          </p>
        </div>
      </div>

    </div>
  );
}
