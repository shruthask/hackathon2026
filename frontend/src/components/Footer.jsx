import React from 'react';
import { Sparkles, Heart } from 'lucide-react';
import lanternLogo from '../assets/lantern-logo.png';

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-slate-200 bg-white py-12 text-slate-500 text-xs no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 pb-8 border-b border-slate-100">
          
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-3">
              <img 
                src={lanternLogo} 
                alt="Lantern Logo" 
                className="h-8 w-auto object-contain"
              />
            </div>
            <p className="text-slate-600 max-w-sm leading-relaxed">
              Automated accessibility scanning engine and developer remediation dashboard. 
              Designed to make the web accessible, inclusive, and friction-free for every user.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
              Team Members
            </h4>
            <ul className="space-y-1.5 text-slate-600 font-medium">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#F28C28]" />
                <span className="font-semibold text-slate-800">Rishik</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#F28C28]" />
                <span className="font-semibold text-slate-800">Sindhu</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#F28C28]" />
                <span className="font-semibold text-slate-800">Samved</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#F28C28]" />
                <span className="font-semibold text-slate-800">Sinchana</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#F28C28]" />
                <span className="font-semibold text-slate-800">Shrutha</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
              Standards & Coverage
            </h4>
            <ul className="space-y-1.5 text-slate-600">
              <li>WCAG 2.1 Level A & AA</li>
              <li>1.1.1 Non-text Content (Alt Text)</li>
              <li>1.3.1 Info & Relationships (Headings)</li>
              <li>4.1.2 Name, Role, Value (Form Labels)</li>
              <li>1.4.3 Contrast (Minimum 4.5:1)</li>
            </ul>
          </div>

        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400">
          <p>© 2026 Lantern • Built by Rishik, Sindhu, Samved, Sinchana & Shrutha</p>
          <p className="flex items-center gap-1">
            Built with <span>FastAPI, React & Tailwind CSS</span>
          </p>
        </div>

      </div>
    </footer>
  );
}
