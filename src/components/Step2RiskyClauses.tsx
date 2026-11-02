import React, { useState } from 'react';
import { 
  AlertTriangle, 
  CheckCircle, 
  ChevronDown, 
  ChevronUp, 
  Filter, 
  ShieldAlert, 
  ArrowRight,
  HelpCircle,
  Flame,
  Search,
  X,
  Sparkles
} from 'lucide-react';
import { RiskyClause, Severity, ClauseCategory } from '../types';

interface Step2RiskyClausesProps {
  clauses: RiskyClause[];
  userWorry: string;
  userRole: string;
  onProceedToStep3: () => void;
  onAskClauseInChat: (quote: string) => void;
}

export const Step2RiskyClauses: React.FC<Step2RiskyClausesProps> = ({
  clauses,
  userWorry,
  userRole,
  onProceedToStep3,
  onAskClauseInChat
}) => {
  const [severityFilter, setSeverityFilter] = useState<'All' | Severity>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [expandedClauseId, setExpandedClauseId] = useState<string | null>(clauses[0]?.id || null);
  const [searchTerm, setSearchTerm] = useState('');

  // Extract unique categories
  const categories = ['All', ...Array.from(new Set(clauses.map(c => c.category)))];

  // Quick search suggestion chips
  const quickSearchChips = ['deposit', 'notice', 'auto-renew', 'cleaning', 'termination', 'rent'];

  // Dynamic filter through original clause text (exactQuote) or plain-English explanation
  const filteredClauses = clauses.filter(c => {
    const matchesSeverity = severityFilter === 'All' || c.severity === severityFilter;
    const matchesCategory = categoryFilter === 'All' || c.category === categoryFilter;
    
    const query = searchTerm.trim().toLowerCase();
    const matchesSearch = query === '' || 
      c.exactQuote.toLowerCase().includes(query) ||
      c.plainEnglish.toLowerCase().includes(query) ||
      c.worstCase.toLowerCase().includes(query) ||
      c.category.toLowerCase().includes(query);

    return matchesSeverity && matchesCategory && matchesSearch;
  });

  const getSeverityBadge = (sev: Severity) => {
    switch (sev) {
      case 'High':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-red-500/20 text-red-300 border border-red-500/40 flex items-center gap-1 shrink-0">
            <Flame className="w-3.5 h-3.5 text-red-400" /> High Risk
          </span>
        );
      case 'Medium':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1 shrink-0">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Medium Risk
          </span>
        );
      case 'Low':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1 shrink-0">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Low Risk
          </span>
        );
    }
  };

  const getCategoryColor = (cat: ClauseCategory) => {
    switch (cat) {
      case 'Auto-Renewal':
      case 'Lock-In':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      case 'Hidden Fee':
      case 'Penalty':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      case 'Deposit Trap':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'Unilateral Change':
      case 'IP Grab':
      case 'Non-Compete':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      default:
        return 'bg-slate-700/40 text-slate-300 border-slate-600/40';
    }
  };

  // Highlight matches in both original clause text and plain-English translation
  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text;
    const escaped = query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'gi');
    const parts = text.split(regex);
    return (
      <>
        {parts.map((part, i) =>
          regex.test(part) ? (
            <mark key={i} className="bg-amber-400/35 text-amber-100 px-1 py-0.5 rounded font-bold shadow-sm">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </>
    );
  };

  const isFiltered = searchTerm.trim().length > 0 || severityFilter !== 'All' || categoryFilter !== 'All';

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header with Amber Glow */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-amber-500/30 pb-4 shadow-[0_10px_25px_-15px_rgba(245,158,11,0.15)]">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm">
              STEP 2 OF 5
            </span>
            <span className="text-xs uppercase tracking-widest text-amber-400 font-semibold">
              Understand It
            </span>
          </div>
          <h2 className="text-2xl font-black text-white mt-1">
            Risky Clauses Table &amp; Verbatim Verifier
          </h2>
          <p className="text-sm text-slate-300 mt-1">
            Examining {clauses.length} clauses ranked by risk to you as a <span className="text-amber-300 font-semibold">{userRole}</span> (prioritizing &quot;<span className="text-amber-300 font-semibold">{userWorry}</span>&quot;).
          </p>
        </div>

        <button
          onClick={onProceedToStep3}
          className="px-5 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white shadow-lg shadow-red-600/20 transition-all flex items-center gap-2 shrink-0 self-start md:self-auto hover:scale-[1.02]"
        >
          <span>Step 3: Trap-o-Meter &amp; Villains</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* DEDICATED SEARCH BAR SECTION */}
      <div className="mb-6 p-4 rounded-2xl bg-[#111A2E] border border-slate-700/80 shadow-md space-y-3.5">
        <div className="relative">
          <Search className="w-5 h-5 text-amber-400 absolute left-3.5 top-3.5 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search clauses dynamically by original text, plain-English explanation, or keyword (e.g. 'deposit', '90 days', 'cleaning fee')..."
            className="w-full pl-11 pr-10 py-3 rounded-xl bg-[#090F1B] border border-slate-700 text-slate-100 placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/60 focus:border-amber-500 transition-all shadow-inner"
            aria-label="Search risky clauses"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-3 p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Clear search"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Quick Filter Chips & Dropdowns */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1 border-t border-slate-800/80 text-xs">
          
          {/* Quick Keywords */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-slate-400 font-bold uppercase tracking-wider text-[11px] flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Quick Search:
            </span>
            {quickSearchChips.map((chip) => (
              <button
                key={chip}
                onClick={() => setSearchTerm(chip)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  searchTerm.toLowerCase() === chip
                    ? 'bg-amber-500/30 text-amber-200 border border-amber-500/50'
                    : 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700/60'
                }`}
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Severity & Category Controls */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Severity Buttons */}
            <div className="flex items-center gap-1">
              <span className="text-[11px] font-bold uppercase text-slate-400 flex items-center gap-1">
                <Filter className="w-3 h-3" /> Severity:
              </span>
              {(['All', 'High', 'Medium', 'Low'] as const).map(sev => (
                <button
                  key={sev}
                  onClick={() => setSeverityFilter(sev)}
                  className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition-all ${
                    severityFilter === sev
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {sev}
                </button>
              ))}
            </div>

            {/* Category Dropdown */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold uppercase text-slate-400">Category:</span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Results Counter / Filter Indicator */}
        {isFiltered && (
          <div className="flex items-center justify-between pt-1 text-xs text-slate-400">
            <span>
              Showing <strong className="text-amber-300">{filteredClauses.length}</strong> of{' '}
              <strong className="text-slate-200">{clauses.length}</strong> clauses
              {searchTerm && (
                <span>
                  {' '}matching &quot;<strong className="text-white">{searchTerm}</strong>&quot;
                </span>
              )}
            </span>
            <button
              onClick={() => {
                setSearchTerm('');
                setSeverityFilter('All');
                setCategoryFilter('All');
              }}
              className="text-amber-400 hover:text-amber-300 hover:underline font-semibold"
            >
              Reset all filters
            </button>
          </div>
        )}
      </div>

      {/* Clauses List */}
      <div className="space-y-4">
        {filteredClauses.map((clause, index) => {
          const isExpanded = expandedClauseId === clause.id;
          return (
            <div
              key={clause.id}
              className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                clause.severity === 'High'
                  ? 'bg-[#111A2E]/90 border-red-500/40 hover:border-red-500/70 shadow-sm'
                  : clause.severity === 'Medium'
                  ? 'bg-[#111A2E]/90 border-amber-500/40 hover:border-amber-500/70 shadow-sm'
                  : 'bg-[#111A2E]/80 border-slate-700/80 hover:border-slate-600'
              }`}
            >
              {/* Card Header Row */}
              <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800/80">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="text-xs font-mono font-bold text-slate-400 px-2 py-0.5 rounded bg-slate-800">
                    #{index + 1}
                  </span>
                  {getSeverityBadge(clause.severity)}
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getCategoryColor(clause.category)}`}>
                    {clause.category}
                  </span>

                  {/* Verbatim Verification Badge */}
                  {clause.isQuoteVerified ? (
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-950/60 text-emerald-300 border border-emerald-500/30 flex items-center gap-1" title="Exact verbatim match found in your contract text">
                      <CheckCircle className="w-3 h-3 text-emerald-400" />
                      <span>Verified Verbatim Quote</span>
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-950/60 text-amber-300 border border-amber-500/30 flex items-center gap-1" title="Could not find an exact 100% character match in the original text">
                      <AlertTriangle className="w-3 h-3 text-amber-400" />
                      <span>Could not verify this quote</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 self-end md:self-auto">
                  <button
                    onClick={() => onAskClauseInChat(clause.exactQuote)}
                    className="px-3 py-1 rounded-lg text-xs font-semibold text-sky-400 hover:text-sky-300 hover:bg-sky-500/10 border border-sky-500/30 transition-colors flex items-center gap-1"
                    title="Ask AI about this specific clause"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>Ask AI</span>
                  </button>
                  <button
                    onClick={() => setExpandedClauseId(isExpanded ? null : clause.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    aria-label="Toggle details"
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Side-by-Side Content Grid */}
              <div className="p-4 sm:p-5 grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 bg-slate-950/30">
                {/* Column 1: Original Clause (With Highlights) */}
                <div className="p-3.5 rounded-xl bg-[#0B1220] border border-slate-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                      Original Clause (Exact Quote)
                    </span>
                  </div>
                  <blockquote className="text-xs sm:text-sm text-slate-200 font-mono italic leading-relaxed border-l-2 border-red-500/50 pl-3 py-1">
                    &quot;{highlightMatch(clause.exactQuote, searchTerm)}&quot;
                  </blockquote>
                </div>

                {/* Column 2: What It Really Means (With Highlights) */}
                <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-amber-300 font-bold flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                      What It Really Means (Plain English)
                    </span>
                    <span className="text-[10px] text-amber-400/80 font-semibold px-2 py-0.5 rounded bg-amber-500/10">
                      9th-Grade Reading Level
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm font-semibold text-amber-100 leading-relaxed">
                    {highlightMatch(clause.plainEnglish, searchTerm)}
                  </p>
                </div>
              </div>

              {/* Expandable Worst Case Row */}
              {isExpanded && (
                <div className="px-4 sm:px-5 py-4 bg-gradient-to-r from-red-950/40 via-amber-950/30 to-red-950/40 border-t border-red-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-start gap-2.5">
                    <Flame className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-red-300 uppercase tracking-wider font-mono">Worst-Case Consequence for {userRole}:</strong>
                      <p className="text-slate-200 mt-0.5 leading-relaxed font-medium">
                        {highlightMatch(clause.worstCase, searchTerm)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Empty Search Results */}
        {filteredClauses.length === 0 && (
          <div className="text-center py-12 p-6 rounded-2xl bg-[#111A2E] border border-slate-800 text-slate-400 space-y-3">
            <Search className="w-8 h-8 text-slate-500 mx-auto" />
            <div>
              <p className="text-sm font-bold text-slate-200">
                No clauses match &quot;{searchTerm}&quot;
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Try searching for different terms like &quot;deposit&quot;, &quot;notice&quot;, &quot;fee&quot;, or clear your filter.
              </p>
            </div>
            <button
              onClick={() => {
                setSearchTerm('');
                setSeverityFilter('All');
                setCategoryFilter('All');
              }}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition-colors"
            >
              Clear Search &amp; Show All {clauses.length} Clauses
            </button>
          </div>
        )}
      </div>

      {/* Bottom CTA to Proceed */}
      <div className="mt-8 flex justify-end">
        <button
          onClick={onProceedToStep3}
          className="px-6 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white shadow-lg shadow-red-600/20 transition-all flex items-center gap-2 hover:scale-[1.02]"
        >
          <span>Next: Step 3 - Trap-o-Meter &amp; Villains</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
