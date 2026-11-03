import React from 'react';
import { AlertOctagon, AlertTriangle, AlertCircle, Info } from 'lucide-react';

export default function SeverityCards({ summary = {}, activeFilter, onSelectFilter }) {
  const cards = [
    {
      id: 'critical',
      label: 'Critical',
      count: summary.critical || 0,
      icon: AlertOctagon,
      desc: 'Blocks users entirely (e.g. unlabeled form fields, missing alt text)',
      color: 'rose',
      border: 'border-rose-300',
      activeBg: 'bg-rose-50 ring-2 ring-rose-500',
      badgeBg: 'bg-rose-600 text-white',
      textColor: 'text-rose-900',
    },
    {
      id: 'serious',
      label: 'Serious',
      count: summary.serious || 0,
      icon: AlertTriangle,
      desc: 'Major barriers (e.g. skipped heading levels like h1 to h4)',
      color: 'orange',
      border: 'border-orange-300',
      activeBg: 'bg-orange-50 ring-2 ring-orange-500',
      badgeBg: 'bg-orange-600 text-white',
      textColor: 'text-orange-900',
    },
    {
      id: 'moderate',
      label: 'Moderate',
      count: summary.moderate || 0,
      icon: AlertCircle,
      desc: 'Hurts usability (e.g. low colour contrast, missing html lang)',
      color: 'amber',
      border: 'border-amber-300',
      activeBg: 'bg-amber-50 ring-2 ring-amber-500',
      badgeBg: 'bg-amber-500 text-white',
      textColor: 'text-amber-900',
    },
    {
      id: 'minor',
      label: 'Minor',
      count: summary.minor || 0,
      icon: Info,
      desc: 'Best practices & code quality recommendations',
      color: 'blue',
      border: 'border-blue-300',
      activeBg: 'bg-blue-50 ring-2 ring-blue-500',
      badgeBg: 'bg-blue-600 text-white',
      textColor: 'text-blue-900',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((card) => {
        const Icon = card.icon;
        const isActive = activeFilter === card.id;

        return (
          <button
            key={card.id}
            type="button"
            onClick={() => onSelectFilter(isActive ? 'all' : card.id)}
            className={`p-4 rounded-xl border text-left transition-all cursor-pointer bg-white ${
              isActive ? card.activeBg : `${card.border} hover:bg-slate-50/80`
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider ${card.textColor}`}>
                <Icon className="w-4 h-4" />
                {card.label}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-black ${card.badgeBg}`}>
                {card.count}
              </span>
            </div>

            <p className="mt-2 text-xs text-slate-500 line-clamp-2 leading-relaxed">
              {card.desc}
            </p>

            <div className="mt-3 flex items-center justify-between text-[11px] font-semibold text-slate-400">
              <span>{isActive ? 'Showing filtered' : 'Click to filter'}</span>
              <span>{card.count > 0 ? `${card.count} found` : 'None'}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
