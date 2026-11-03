import React from 'react';

export default function ScoreGauge({ score = 100, grade = 'A' }) {
  // Determine color palette based on grade and score
  const getGradeTheme = (g) => {
    switch (g) {
      case 'A':
        return {
          stroke: '#10B981', // emerald-500
          bgLight: 'bg-emerald-50',
          textColor: 'text-emerald-700',
          borderColor: 'border-emerald-200',
          label: 'Passable – Minimal Barriers',
          description: 'Meets automated core rules. Manual verification still required.',
        };
      case 'B':
        return {
          stroke: '#3B82F6', // blue-500
          bgLight: 'bg-blue-50',
          textColor: 'text-blue-700',
          borderColor: 'border-blue-200',
          label: 'Good – Minor Accessibility Flaws',
          description: 'A few non-critical issues detected. Good overall structure.',
        };
      case 'C':
        return {
          stroke: '#F59E0B', // amber-500
          bgLight: 'bg-amber-50',
          textColor: 'text-amber-700',
          borderColor: 'border-amber-200',
          label: 'Fair – Multiple Moderate Barriers',
          description: 'Users with assistive technologies may encounter friction.',
        };
      case 'D':
        return {
          stroke: '#EA580C', // orange-600
          bgLight: 'bg-orange-50',
          textColor: 'text-orange-700',
          borderColor: 'border-orange-200',
          label: 'Poor – Serious Usability Issues',
          description: 'Significant accessibility hurdles found on page elements.',
        };
      case 'F':
      default:
        return {
          stroke: '#EF4444', // red-500
          bgLight: 'bg-rose-50',
          textColor: 'text-rose-700',
          borderColor: 'border-rose-200',
          label: 'Critical – Severe Barriers',
          description: 'Blocks screen readers or keyboard navigation entirely.',
        };
    }
  };

  const theme = getGradeTheme(grade);

  // SVG Circular calculation
  const radius = 48;
  const circumference = 2 * Math.PI * radius;
  const safeScore = Math.max(0, Math.min(100, score));
  const strokeDashoffset = circumference - (safeScore / 100) * circumference;

  return (
    <div className={`p-6 rounded-2xl border ${theme.borderColor} ${theme.bgLight} flex flex-col sm:flex-row items-center gap-6 shadow-xs`}>
      
      {/* Circular Gauge */}
      <div className="relative w-32 h-32 flex-shrink-0 flex items-center justify-center">
        <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 120 120">
          {/* Background circle track */}
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="transparent"
            stroke="#E2E8F0"
            strokeWidth="10"
          />
          {/* Progress circle */}
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="transparent"
            stroke={theme.stroke}
            strokeWidth="10"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Center Score & Grade */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-3xl font-black text-slate-900 leading-none">
            {safeScore}
          </span>
          <span className="text-[10px] uppercase font-bold text-slate-400 mt-1">
            out of 100
          </span>
        </div>
      </div>

      {/* Grade and Summary info */}
      <div className="flex-1 text-center sm:text-left">
        <div className="flex items-center justify-center sm:justify-start gap-3">
          <span className={`px-3 py-1 rounded-xl text-xl font-black tracking-tight text-white shadow-sm`} style={{ backgroundColor: theme.stroke }}>
            Grade {grade}
          </span>
          <h2 className="text-lg font-bold text-slate-900">
            {theme.label}
          </h2>
        </div>

        <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
          {theme.description}
        </p>

        <div className="mt-3 flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs font-medium text-slate-500">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-slate-200">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: theme.stroke }}></span>
            Automated Rule Engine Score
          </span>
          <span className="text-slate-400">•</span>
          <span>Deductions weighted by severity</span>
        </div>
      </div>

    </div>
  );
}
