import React, { useState } from 'react';
import { 
  Mail, 
  Copy, 
  Check, 
  Download, 
  ExternalLink, 
  Printer, 
  CheckCircle2, 
  ShieldAlert, 
  Sparkles, 
  Calendar, 
  FileText, 
  RefreshCw,
  Loader2
} from 'lucide-react';
import { NegotiationTone, CounterOffer, RiskyClause, ChecklistItem, RiskVerdict, Language } from '../types';
import { regenerateNegotiationEmail } from '../services/gemini';

interface Step5EmailAndSignCardProps {
  emailText: string;
  setEmailText: (text: string) => void;
  tone: NegotiationTone;
  setTone: (tone: NegotiationTone) => void;
  language: Language;
  clauses: RiskyClause[];
  counterOffers: CounterOffer[];
  userRole: string;
  riskScore: number;
  verdict: RiskVerdict;
  deadline: string;
  checklist: ChecklistItem[];
  setChecklist: React.Dispatch<React.SetStateAction<ChecklistItem[]>>;
}

export const Step5EmailAndSignCard: React.FC<Step5EmailAndSignCardProps> = ({
  emailText,
  setEmailText,
  tone,
  setTone,
  language,
  clauses,
  counterOffers,
  userRole,
  riskScore,
  verdict,
  deadline,
  checklist,
  setChecklist,
}) => {
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  // Copy email to clipboard
  const handleCopyEmail = () => {
    navigator.clipboard.writeText(emailText);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2500);
  };

  // Open in default email app (mailto:)
  const handleOpenMailto = () => {
    const lines = emailText.split('\n');
    let subject = 'Proposed Amendments to Agreement';
    let body = emailText;

    if (lines[0]?.toLowerCase().startsWith('subject:')) {
      subject = lines[0].replace(/^subject:\s*/i, '');
      body = lines.slice(1).join('\n').trim();
    }

    const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;
  };

  // Download email as .txt
  const handleDownloadTxt = () => {
    const blob = new Blob([emailText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Negotiation_Counter_Offer_${tone}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Switch tone & regenerate email
  const handleToneChange = async (newTone: NegotiationTone) => {
    setTone(newTone);
    setIsRegenerating(true);
    try {
      const selectedOffers = counterOffers.filter(o => o.selectedForEmail);
      const generated = await regenerateNegotiationEmail(
        clauses,
        selectedOffers.length > 0 ? selectedOffers : counterOffers.slice(0, 3),
        userRole as any,
        newTone,
        language
      );
      if (generated) {
        setEmailText(generated);
      }
    } catch (err) {
      console.error('Failed to regenerate email:', err);
    } finally {
      setIsRegenerating(false);
    }
  };

  // Toggle checklist items
  const toggleChecklistItem = (id: string) => {
    setChecklist(prev =>
      prev.map(item => (item.id === id ? { ...item, done: !item.done } : item))
    );
  };

  // Native Print / Save to PDF
  const handlePrint = () => {
    window.print();
  };

  // Top 3 traps
  const topTraps = clauses.slice(0, 3);
  // Top 3 counter offers
  const topMustHaves = counterOffers.filter(o => o.priority === 'Must-Have').slice(0, 3);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-10">
      {/* Step Header */}
      <div className="border-b border-red-500/40 pb-4 shadow-[0_10px_25px_-15px_rgba(239,68,68,0.2)]">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/40">
            STEP 5 OF 5
          </span>
          <span className="text-xs uppercase tracking-widest text-red-400 font-semibold">
            Fight Back
          </span>
        </div>
        <h2 className="text-2xl font-black text-white mt-1">
          Negotiation Email &amp; Before-I-Sign Decision Card
        </h2>
        <p className="text-sm text-slate-300 mt-1">
          Copy your tailored counter-offer email and run through your final pre-signing defense checklist.
        </p>
      </div>

      {/* SECTION A: READY-TO-SEND NEGOTIATION EMAIL */}
      <div className="bg-[#111A2E] border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">
                Ready-to-Send Negotiation Email
              </h3>
              <p className="text-xs text-slate-400">
                Polite, assertive, and formatted with exact replacement sentences.
              </p>
            </div>
          </div>

          {/* Tone Switcher */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase text-slate-400">Tone:</span>
            <div className="flex items-center bg-slate-900 rounded-xl p-1 border border-slate-700">
              {(['Polite', 'Firm', 'Friendly'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => handleToneChange(t)}
                  disabled={isRegenerating}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    tone === t
                      ? 'bg-red-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className="flex items-center gap-2 flex-wrap justify-between my-4">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyEmail}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-500 text-white transition-all flex items-center gap-1.5 shadow-sm"
            >
              {copiedEmail ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copiedEmail ? 'Copied to Clipboard!' : 'Copy Email'}</span>
            </button>

            <button
              onClick={handleOpenMailto}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all flex items-center gap-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5 text-sky-400" />
              <span>Open in Email App</span>
            </button>

            <button
              onClick={handleDownloadTxt}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Download .txt</span>
            </button>
          </div>

          {isRegenerating && (
            <div className="flex items-center gap-1.5 text-xs text-amber-400 font-medium">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Regenerating email with {tone} tone...</span>
            </div>
          )}
        </div>

        {/* Editable Email Textarea */}
        <textarea
          value={emailText}
          onChange={(e) => setEmailText(e.target.value)}
          rows={14}
          className="w-full p-4 rounded-2xl bg-[#090F1B] border border-slate-700/80 text-slate-100 font-sans text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-red-500 leading-relaxed shadow-inner"
        />

        <p className="text-[11px] text-slate-400 mt-2 font-mono">
          Tip: Replace bracketed tokens like [Your Name], [Landlord/Employer Name], and [Date] before sending.
        </p>
      </div>

      {/* SECTION B: BEFORE I SIGN SUMMARY CARD (PRINTABLE) */}
      <div className="print-card bg-gradient-to-br from-[#111A2E] via-[#0E1626] to-[#0B1220] border-2 border-amber-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                1-SCREEN RECAP
              </span>
              <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                Defense Snapshot
              </span>
            </div>
            <h3 className="text-2xl font-black text-white mt-1">
              &quot;Before I Sign&quot; Summary Card
            </h3>
            <p className="text-xs text-slate-300">
              Printable decision briefing before you put pen to paper.
            </p>
          </div>

          <button
            onClick={handlePrint}
            className="no-print px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white transition-all flex items-center gap-2 shadow-lg shadow-amber-600/20 shrink-0 self-start sm:self-auto hover:scale-[1.02]"
          >
            <Printer className="w-4 h-4" />
            <span>Download as PDF / Print</span>
          </button>
        </div>

        {/* Score & Verdict Banner */}
        <div className="p-4 rounded-2xl bg-[#090F1B] border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-mono uppercase text-slate-400 font-bold">
              Contract Trap-o-Meter
            </span>
            <div className="text-3xl font-black text-white font-mono mt-0.5">
              {riskScore}/100 — <span className="text-amber-400">{verdict}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-300">
            <Calendar className="w-4 h-4 text-red-400" />
            <span>
              <strong>Action Deadline:</strong> {deadline || 'Prior to signing / 30 days notice'}
            </span>
          </div>
        </div>

        {/* 2-Column Summary: Top 3 Traps vs Top 3 Must-Haves */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Top 3 Traps */}
          <div className="p-4 rounded-2xl bg-red-950/20 border border-red-500/30">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-red-400 flex items-center gap-1.5 mb-3">
              <ShieldAlert className="w-4 h-4 text-red-400" />
              Top 3 Traps to Beware Of:
            </h4>
            <ul className="space-y-2.5">
              {topTraps.map((trap, idx) => (
                <li key={trap.id} className="text-xs text-slate-200">
                  <span className="font-bold text-red-300">#{idx + 1} {trap.category}:</span> {trap.plainEnglish}
                </li>
              ))}
            </ul>
          </div>

          {/* Top 3 Must-Have Changes */}
          <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5 mb-3">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              3 Must-Have Changes to Demand:
            </h4>
            <ul className="space-y-2.5">
              {topMustHaves.map((offer, idx) => (
                <li key={offer.id} className="text-xs text-slate-200">
                  <span className="font-bold text-emerald-300">#{idx + 1}:</span> &quot;{offer.suggestedReplacement}&quot;
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Interactive 5-Item Checklist */}
        <div className="p-5 rounded-2xl bg-[#090F1B] border border-slate-800">
          <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2 mb-3">
            <CheckCircle2 className="w-4 h-4 text-amber-400" />
            5-Item Pre-Signing Defense Checklist (Click to Mark Done)
          </h4>
          <div className="space-y-2.5">
            {checklist.map((item) => (
              <label
                key={item.id}
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer select-none transition-all ${
                  item.done
                    ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-200'
                    : 'bg-[#111A2E]/60 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <input
                  type="checkbox"
                  checked={item.done}
                  onChange={() => toggleChecklistItem(item.id)}
                  className="mt-0.5 rounded border-slate-700 text-emerald-500 focus:ring-emerald-500 bg-slate-900 w-4 h-4"
                />
                <span className={`text-xs sm:text-sm font-medium ${item.done ? 'line-through text-emerald-400/80' : ''}`}>
                  {item.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="text-center text-[11px] text-slate-500 print-only">
          Generated with Fight My Fine Print • Educational tool, not legal advice • fight-my-fine-print.app
        </div>
      </div>
    </div>
  );
};
