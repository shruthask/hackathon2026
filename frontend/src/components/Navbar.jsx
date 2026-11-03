import React from 'react';
import { Compass } from 'lucide-react';
import lanternLogo from '../assets/lantern-logo.png';

export default function Navbar({ 
  activeView, 
  setActiveView,
  onStartAudit 
}) {
  const navItems = [
    { id: 'console', label: 'Scan Console' },
    { id: 'how-it-works', label: 'How It Works' },
    { id: 'guidelines', label: 'Guidelines' },
    { id: 'manual-testing', label: 'Manual Testing' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#0B132B]/95 backdrop-blur-md border-b border-slate-800/80 shadow-md transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative flex items-center justify-between h-18">
          
          {/* Logo with Orange wordmark */}
          <div 
            className="flex items-center gap-3 cursor-pointer group" 
            onClick={() => setActiveView('console')}
          >
            <img 
              src={lanternLogo} 
              alt="Lantern" 
              className="h-10 sm:h-11 w-auto object-contain transition-transform group-hover:scale-105"
            />
          </div>

          {/* Navigation Links - Centered in the middle */}
          <nav className="hidden md:flex items-center gap-6 lg:gap-8 absolute left-1/2 -translate-x-1/2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`text-sm font-semibold transition-colors cursor-pointer py-1 ${
                  activeView === item.id
                    ? 'text-[#F28C28] font-bold border-b-2 border-[#F28C28]'
                    : 'text-slate-300 hover:text-[#F28C28]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Right Action Bar */}
          <div className="flex items-center gap-3">
            {/* Start Audit Button */}
            <button
              onClick={onStartAudit}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#F28C28] hover:bg-[#e07d1e] text-slate-950 font-black text-xs shadow-md transition-all cursor-pointer"
            >
              <Compass className="w-3.5 h-3.5 text-slate-950" />
              <span>Start Audit</span>
            </button>
          </div>

        </div>

        {/* Mobile Navigation bar */}
        <div className="md:hidden flex items-center justify-around py-2.5 border-t border-slate-800 text-xs overflow-x-auto gap-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`px-2.5 py-1 rounded-lg font-semibold whitespace-nowrap transition-colors ${
                activeView === item.id
                  ? 'bg-amber-500/20 text-[#F28C28] font-bold'
                  : 'text-slate-300 hover:text-[#F28C28]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

      </div>
    </header>
  );
}
