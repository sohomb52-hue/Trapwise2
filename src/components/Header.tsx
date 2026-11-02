import React from 'react';
import { Shield, Sparkles, Scale, FileText, User as UserIcon, LogOut, Moon, Sun, Globe, History, GitCompare } from 'lucide-react';
import { Language } from '../types';

interface HeaderProps {
  user: any;
  isDemoMode: boolean;
  onOpenAuth: () => void;
  onSignOut: () => void;
  onOpenPastAnalyses: () => void;
  onOpenCompare: () => void;
  currentLanguage: Language;
  onSelectLanguage: (lang: Language) => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  analysesCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  isDemoMode,
  onOpenAuth,
  onSignOut,
  onOpenPastAnalyses,
  onOpenCompare,
  currentLanguage,
  onSelectLanguage,
  darkMode,
  onToggleDarkMode,
  analysesCount
}) => {
  return (
    <header className="border-b border-[#1E293B] bg-[#0B1220]/95 backdrop-blur-md sticky top-0 z-40 transition-colors">
      {/* Persistent Disclaimer Bar */}
      <div className="bg-gradient-to-r from-amber-950/60 via-red-950/40 to-amber-950/60 border-b border-amber-500/20 px-4 py-1 text-xs text-center text-amber-200/90 font-medium flex items-center justify-center gap-2">
        <Scale className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        <span>Educational tool, not legal advice. Always consult local tenant unions, student legal aid, or an attorney for formal disputes.</span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          {/* Logo & Title & Judge Summary */}
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-red-600 via-rose-600 to-amber-600 shadow-lg shadow-red-500/20 text-white shrink-0 mt-0.5">
              <Shield className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white uppercase">
                  Fight My Fine Print
                </h1>
                <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 border border-red-500/40 text-red-300 font-bold tracking-wide">
                  AI Prototype
                </span>
                {isDemoMode && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-semibold flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Judge Demo Mode
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm font-semibold text-red-400 tracking-wide mt-0.5">
                Spot the risk. Feel the trap. Counter the offer.
              </p>
              <p className="text-xs text-slate-400 max-w-2xl mt-1 leading-relaxed">
                <span className="text-slate-300 font-medium">Judge&apos;s 10-Second Summary:</span> An AI app that converts long, confusing contracts into plain-English warnings, memorable Villain Cards, a 0-100 risk score, and instant ready-to-send negotiation counter-offers.
              </p>
            </div>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap justify-end shrink-0">
            {/* Compare Tool */}
            <button
              onClick={onOpenCompare}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#111A2E] hover:bg-[#1E293B] border border-slate-700/80 text-slate-200 transition-all flex items-center gap-1.5 shadow-sm hover:border-slate-500"
              title="Compare two contract versions"
            >
              <GitCompare className="w-3.5 h-3.5 text-sky-400" />
              <span>Compare Contracts</span>
            </button>

            {/* Past Analyses */}
            {(user || isDemoMode) && (
              <button
                onClick={onOpenPastAnalyses}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#111A2E] hover:bg-[#1E293B] border border-slate-700/80 text-slate-200 transition-all flex items-center gap-1.5 shadow-sm hover:border-slate-500"
                title="View saved analyses"
              >
                <History className="w-3.5 h-3.5 text-amber-400" />
                <span>My Past Analyses</span>
                {analysesCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                    {analysesCount}
                  </span>
                )}
              </button>
            )}

            {/* Multi-language Selector */}
            <div className="relative flex items-center">
              <Globe className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
              <select
                value={currentLanguage}
                onChange={(e) => onSelectLanguage(e.target.value as Language)}
                aria-label="Select interface language"
                className="pl-7 pr-3 py-1.5 rounded-lg text-xs font-medium bg-[#111A2E] border border-slate-700/80 text-slate-200 hover:border-slate-500 focus:outline-none focus:ring-1 focus:ring-red-500 cursor-pointer"
              >
                <option value="English">English</option>
                <option value="Spanish">Español</option>
                <option value="Hindi">हिंदी (Hindi)</option>
                <option value="Bengali">বাংলা (Bengali)</option>
                <option value="French">Français</option>
              </select>
            </div>

            {/* Dark / Light Mode Toggle */}
            <button
              onClick={onToggleDarkMode}
              className="p-1.5 rounded-lg bg-[#111A2E] border border-slate-700 text-slate-300 hover:text-white hover:border-slate-500 transition-colors"
              title={darkMode ? "Switch to light mode" : "Switch to dark command center"}
              aria-label="Toggle theme mode"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-sky-400" />}
            </button>

            {/* User Profile / Auth State */}
            {user ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
                <div className="flex items-center gap-2">
                  {user.photoURL ? (
                    <img 
                      src={user.photoURL} 
                      alt={user.displayName || 'User'} 
                      className="w-7 h-7 rounded-full border border-slate-600 object-cover" 
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-red-600 to-amber-600 text-white flex items-center justify-center text-xs font-bold">
                      {(user.displayName || user.email || 'U')[0].toUpperCase()}
                    </div>
                  )}
                  <span className="text-xs font-medium text-slate-200 hidden lg:inline max-w-[110px] truncate">
                    {user.displayName || user.email?.split('@')[0]}
                  </span>
                </div>
                <button
                  onClick={onSignOut}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  title="Sign Out"
                  aria-label="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : isDemoMode ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
                <button
                  onClick={onOpenAuth}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-sm transition-all"
                >
                  Sign In / Save
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-red-600 hover:bg-red-500 text-white shadow-sm transition-all"
              >
                Sign In
              </button>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};
