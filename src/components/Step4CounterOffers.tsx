import React, { useState } from 'react';
import { 
  Swords, 
  Copy, 
  Check, 
  ArrowRight, 
  CheckSquare, 
  Square, 
  ShieldCheck, 
  Sparkles,
  HelpCircle,
  MailCheck
} from 'lucide-react';
import { CounterOffer } from '../types';

interface Step4CounterOffersProps {
  counterOffers: CounterOffer[];
  onToggleOfferSelection: (id: string) => void;
  onProceedToStep5: () => void;
}

export const Step4CounterOffers: React.FC<Step4CounterOffersProps> = ({
  counterOffers,
  onToggleOfferSelection,
  onProceedToStep5,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const selectedCount = counterOffers.filter(o => o.selectedForEmail).length;

  const getPriorityBadge = (priority: CounterOffer['priority']) => {
    switch (priority) {
      case 'Must-Have':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-red-500/20 text-red-300 border border-red-500/40">
            Must-Have
          </span>
        );
      case 'Nice-to-Have':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40">
            Nice-to-Have
          </span>
        );
      case 'Can-Concede':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
            Can-Concede
          </span>
        );
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-amber-500/40 pb-4 shadow-[0_10px_25px_-15px_rgba(245,158,11,0.2)]">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
              STEP 4 OF 5
            </span>
            <span className="text-xs uppercase tracking-widest text-amber-400 font-semibold">
              Fight Back
            </span>
          </div>
          <h2 className="text-2xl font-black text-white mt-1">
            Balanced Counter-Offers &amp; Negotiation Moves
          </h2>
          <p className="text-sm text-slate-300 mt-1">
            Reasonable, balanced replacement text that counterparts actually agree to. Check the ones you want in your email.
          </p>
        </div>

        <button
          onClick={onProceedToStep5}
          className="px-5 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white shadow-lg shadow-red-600/20 transition-all flex items-center gap-2 shrink-0 self-start md:self-auto hover:scale-[1.02]"
        >
          <MailCheck className="w-4 h-4" />
          <span>Step 5: Generate Email ({selectedCount} Selected)</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Strategy Guidance Box */}
      <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-amber-950/30 via-slate-900 to-amber-950/30 border border-amber-500/30 flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs sm:text-sm text-slate-300">
          <strong className="text-amber-200">Negotiation Rule of Thumb:</strong> Counter-offers are calibrated to be fair and balanced, never hostile. All &quot;Must-Have&quot; and &quot;Nice-to-Have&quot; amendments are pre-selected to be compiled into your ready-to-send email in Step 5.
        </div>
      </div>

      {/* Counter Offers Grid */}
      <div className="space-y-5">
        {counterOffers.map((offer, index) => {
          const isSelected = offer.selectedForEmail;
          const isCopied = copiedId === offer.id;

          return (
            <div
              key={offer.id}
              className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                isSelected
                  ? 'bg-[#111A2E] border-amber-500/50 shadow-md ring-1 ring-amber-500/20'
                  : 'bg-[#111A2E]/60 border-slate-700/60 opacity-80 hover:opacity-100'
              }`}
            >
              {/* Card Header */}
              <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  {/* Selection Checkbox */}
                  <button
                    onClick={() => onToggleOfferSelection(offer.id)}
                    className="p-1 rounded-lg text-slate-300 hover:text-white transition-colors"
                    aria-label={isSelected ? 'Remove from email' : 'Include in email'}
                  >
                    {isSelected ? (
                      <CheckSquare className="w-5 h-5 text-amber-400" />
                    ) : (
                      <Square className="w-5 h-5 text-slate-500" />
                    )}
                  </button>

                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono font-bold text-slate-400">
                      Counter #{index + 1}
                    </span>
                    {getPriorityBadge(offer.priority)}
                  </div>
                </div>

                <div className="text-xs text-slate-400">
                  {isSelected ? (
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Included in Negotiation Email
                    </span>
                  ) : (
                    <span className="text-slate-500">Excluded from email</span>
                  )}
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4 sm:p-5 space-y-4">
                {/* Target Clause Quote */}
                <div className="p-3 rounded-xl bg-[#090F1B] border border-slate-800">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block mb-1">
                    Target Clause to Replace:
                  </span>
                  <p className="text-xs font-mono italic text-slate-300">
                    &quot;{offer.clauseQuote}&quot;
                  </p>
                </div>

                {/* Primary Suggested Replacement (The Solution) */}
                <div className="p-4 rounded-xl bg-emerald-950/25 border border-emerald-500/40 relative">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-bold flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      Suggested Replacement Sentence (Propose This First)
                    </span>
                    <button
                      onClick={() => copyToClipboard(offer.suggestedReplacement, offer.id)}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-900/40 hover:bg-emerald-800/40 text-emerald-200 border border-emerald-500/30 transition-all flex items-center gap-1"
                      title="Copy replacement text"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 text-emerald-300" />
                          <span>Copy Sentence</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-xs sm:text-sm font-semibold text-emerald-100 leading-relaxed font-sans">
                    &quot;{offer.suggestedReplacement}&quot;
                  </p>
                </div>

                {/* Fallback Compromise & Why They Agree */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/30">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-amber-300 font-bold block mb-1">
                      Fallback Compromise (If they refuse):
                    </span>
                    <p className="text-xs text-amber-100 font-medium">
                      {offer.fallbackCompromise}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-sky-950/20 border border-sky-500/30">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-sky-300 font-bold block mb-1">
                      Why They Will Likely Agree:
                    </span>
                    <p className="text-xs text-sky-100 font-medium">
                      {offer.whyTheyLikelyAgree}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Action */}
      <div className="mt-8 flex justify-end">
        <button
          onClick={onProceedToStep5}
          className="px-6 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white shadow-lg shadow-red-600/20 transition-all flex items-center gap-2 hover:scale-[1.02]"
        >
          <span>Next: Step 5 - Negotiation Email &amp; Before-I-Sign Card</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
