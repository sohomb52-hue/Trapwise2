import React, { useState } from 'react';
import { 
  Gauge, 
  Share2, 
  Flame, 
  AlertTriangle, 
  CheckCircle, 
  Zap, 
  ArrowRight, 
  RotateCw, 
  Clock, 
  DollarSign, 
  Calendar, 
  ShieldAlert,
  Sparkles,
  Download
} from 'lucide-react';
import { VillainCardData, AutoRenewalHero, RiskVerdict } from '../types';

interface Step3ScoreAndVillainsProps {
  riskScore: number;
  verdict: RiskVerdict;
  justification: string;
  counts: { high: number; medium: number; low: number };
  villains: VillainCardData[];
  autoRenewalHero: AutoRenewalHero;
  contractTitle: string;
  onProceedToStep4: () => void;
  onGoToStep5Email: () => void;
}

export const Step3ScoreAndVillains: React.FC<Step3ScoreAndVillainsProps> = ({
  riskScore,
  verdict,
  justification,
  counts,
  villains,
  autoRenewalHero,
  contractTitle,
  onProceedToStep4,
  onGoToStep5Email,
}) => {
  // State for flipped villain cards (stores villain id that is flipped)
  const [flippedCards, setFlippedCards] = useState<Record<string, boolean>>({});
  const [isGeneratingShareCard, setIsGeneratingShareCard] = useState(false);

  const toggleFlip = (id: string) => {
    setFlippedCards(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Verdict style mapping
  const getVerdictDetails = (score: number) => {
    if (score <= 25) {
      return {
        verdict: 'SAFE',
        color: '#10B981',
        textColor: 'text-emerald-400',
        bgColor: 'bg-emerald-500/20',
        borderColor: 'border-emerald-500/40',
        glow: 'shadow-emerald-500/20',
        description: 'Standard, fair terms with minimal unusual risk exposures.',
      };
    } else if (score <= 50) {
      return {
        verdict: 'CAREFUL',
        color: '#F59E0B',
        textColor: 'text-amber-400',
        bgColor: 'bg-amber-500/20',
        borderColor: 'border-amber-500/40',
        glow: 'shadow-amber-500/20',
        description: 'Contains a few ambiguous clauses or fees you should clarify before signing.',
      };
    } else if (score <= 75) {
      return {
        verdict: 'NEGOTIATE',
        color: '#F97316',
        textColor: 'text-orange-400',
        bgColor: 'bg-orange-500/20',
        borderColor: 'border-orange-500/40',
        glow: 'shadow-orange-500/20',
        description: 'Multiple one-sided terms or penalties identified. Do not sign without counter-offering.',
      };
    } else {
      return {
        verdict: 'WALK AWAY',
        color: '#EF4444',
        textColor: 'text-red-400',
        bgColor: 'bg-red-500/20',
        borderColor: 'border-red-500/40',
        glow: 'shadow-red-500/30',
        description: 'Severe predatory clauses, total deposit forfeiture, or extreme liability shifts.',
      };
    }
  };

  const verdictMeta = getVerdictDetails(riskScore);

  // SVG Semicircle gauge calculation
  // Radius: 120, circumference of semicircle: Math.PI * 120 ≈ 376.99
  const radius = 110;
  const circumference = Math.PI * radius;
  const strokeDashoffset = circumference - (riskScore / 100) * circumference;

  // Share score image generator using HTML5 Canvas (no sensitive contract text included!)
  const handleShareScore = () => {
    setIsGeneratingShareCard(true);
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 630;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background gradient
    const bgGradient = ctx.createLinearGradient(0, 0, 1200, 630);
    bgGradient.addColorStop(0, '#0B1220');
    bgGradient.addColorStop(0.5, '#111A2E');
    bgGradient.addColorStop(1, '#0B1220');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, 1200, 630);

    // Accent border
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 12;
    ctx.strokeRect(20, 20, 1160, 590);

    // Header badge
    ctx.fillStyle = '#EF4444';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText('FIGHT MY FINE PRINT — TRAP-O-METER AUDIT', 80, 90);

    // App tagline
    ctx.fillStyle = '#94A3B8';
    ctx.font = '20px sans-serif';
    ctx.fillText('Spot the risk. Feel the trap. Counter the offer.', 80, 125);

    // Score Circle Box
    ctx.fillStyle = '#0F172A';
    ctx.beginPath();
    ctx.roundRect(80, 170, 480, 380, 24);
    ctx.fill();
    ctx.strokeStyle = verdictMeta.color;
    ctx.lineWidth = 4;
    ctx.stroke();

    // Large score number
    ctx.fillStyle = verdictMeta.color;
    ctx.font = '900 110px sans-serif';
    ctx.fillText(`${riskScore}`, 120, 310);

    ctx.fillStyle = '#94A3B8';
    ctx.font = 'bold 36px sans-serif';
    ctx.fillText('/100', 300, 310);

    // Verdict label
    ctx.fillStyle = verdictMeta.color;
    ctx.font = '900 42px sans-serif';
    ctx.fillText(verdictMeta.verdict, 120, 380);

    // Risk description
    ctx.fillStyle = '#CBD5E1';
    ctx.font = '20px sans-serif';
    ctx.fillText(verdictMeta.description, 120, 430, 400);

    // Right Column: Breakdown & Villains
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 32px sans-serif';
    ctx.fillText('Trap Breakdown:', 620, 220);

    // High risk chip
    ctx.fillStyle = '#EF4444';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText(`• ${counts.high} High-Risk Traps Detected`, 620, 280);

    // Medium risk chip
    ctx.fillStyle = '#F59E0B';
    ctx.fillText(`• ${counts.medium} Medium-Risk Ambiguities`, 620, 330);

    // Low risk chip
    ctx.fillStyle = '#10B981';
    ctx.fillText(`• ${counts.low} Standard Clauses`, 620, 380);

    // Top Villain spotlight
    if (villains[0]) {
      ctx.fillStyle = '#F8FAFC';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText(`Top Villain: ${villains[0].name}`, 620, 450);
      ctx.fillStyle = '#94A3B8';
      ctx.font = 'italic 18px sans-serif';
      ctx.fillText(`"${villains[0].attack}"`, 620, 490, 500);
    }

    // Footer note
    ctx.fillStyle = '#64748B';
    ctx.font = '16px sans-serif';
    ctx.fillText('Educational tool, not legal advice • fight-my-fine-print.app', 620, 560);

    // Download PNG
    const link = document.createElement('a');
    link.download = `Trap-o-Meter-Score-${riskScore}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    setIsGeneratingShareCard(false);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-red-500/40 pb-4 shadow-[0_10px_25px_-15px_rgba(239,68,68,0.2)]">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/40">
              STEP 3 OF 5
            </span>
            <span className="text-xs uppercase tracking-widest text-red-400 font-semibold">
              Score It
            </span>
          </div>
          <h2 className="text-2xl font-black text-white mt-1">
            Trap-o-Meter Score &amp; Collectible Villain Cards
          </h2>
          <p className="text-sm text-slate-300 mt-1">
            Gamifying contract risks into actionable ratings and memorable enemy personas.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleShareScore}
            disabled={isGeneratingShareCard}
            className="px-4 py-2.5 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-600 transition-all flex items-center gap-2 shadow-sm"
            title="Download a clean score graphic to share"
          >
            <Download className="w-4 h-4 text-sky-400" />
            <span>Share My Score Card</span>
          </button>
          <button
            onClick={onProceedToStep4}
            className="px-5 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white shadow-lg shadow-red-600/20 transition-all flex items-center gap-2 shrink-0 hover:scale-[1.02]"
          >
            <span>Next: Step 4 - Counter Offers</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Trap-o-Meter Gauge & Score Card */}
      <div className="mb-8 p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#111A2E] via-[#0E1626] to-[#0B1220] border border-slate-700/80 shadow-2xl relative overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Animated Gauge Visual */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center text-center">
            <div className="relative w-64 h-36 flex items-end justify-center">
              <svg className="w-64 h-36 overflow-visible" viewBox="0 0 260 140">
                {/* Gauge Background Arc */}
                <path
                  d="M 20 130 A 110 110 0 0 1 240 130"
                  fill="none"
                  stroke="#1E293B"
                  strokeWidth="20"
                  strokeLinecap="round"
                />
                {/* Active Colored Arc */}
                <path
                  d="M 20 130 A 110 110 0 0 1 240 130"
                  fill="none"
                  stroke={verdictMeta.color}
                  strokeWidth="20"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-1000 ease-out"
                />
              </svg>

              {/* Center Score Numbers */}
              <div className="absolute bottom-0 text-center flex flex-col items-center">
                <span className="text-5xl font-black tracking-tight text-white font-mono">
                  {riskScore}
                </span>
                <span className="text-xs uppercase tracking-wider text-slate-400 font-bold -mt-1">
                  Trap-o-Meter
                </span>
              </div>
            </div>

            {/* Verdict Badge */}
            <div className="mt-4 flex flex-col items-center">
              <div
                className={`px-4 py-1.5 rounded-full text-base font-black tracking-wider border shadow-lg ${verdictMeta.bgColor} ${verdictMeta.textColor} ${verdictMeta.borderColor}`}
              >
                {riskScore}/100 — {verdictMeta.verdict}
              </div>
              <span className="text-xs text-slate-400 mt-2 font-medium">
                Color-blind safe score scale: Safe (0-25) | Careful (26-50) | Negotiate (51-75) | Walk Away (76-100)
              </span>
            </div>
          </div>

          {/* Score Rationale & Clause Severity Counts */}
          <div className="lg:col-span-7 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-mono font-bold uppercase text-red-400">
                  Risk Assessment Summary
                </span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                {verdictMeta.description}
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed bg-[#0B1220]/80 p-4 rounded-xl border border-slate-800">
                {justification}
              </p>
            </div>

            {/* Counts Breakdown Chips */}
            <div className="grid grid-cols-3 gap-3 mt-5">
              <div className="p-3 rounded-xl bg-red-950/30 border border-red-500/40 text-center">
                <div className="text-2xl font-black text-red-400">{counts.high}</div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-red-300 mt-0.5">
                  High Risk Traps
                </div>
              </div>
              <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/40 text-center">
                <div className="text-2xl font-black text-amber-400">{counts.medium}</div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-amber-300 mt-0.5">
                  Medium Risk
                </div>
              </div>
              <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/40 text-center">
                <div className="text-2xl font-black text-emerald-400">{counts.low}</div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-300 mt-0.5">
                  Low / Standard
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Auto-Renewal Trap Hero Card (The WOW Moment) */}
      <div className="mb-10 relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-950/50 via-slate-900 to-red-950/40 border-2 border-purple-500/50 shadow-2xl p-6 sm:p-8">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Clock className="w-64 h-64 text-purple-400" />
        </div>

        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2.5">
              <span className="p-2.5 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-300 font-bold">
                <Zap className="w-5 h-5 text-purple-400" />
              </span>
              <div>
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-purple-400">
                  Featured Trap Spotlight
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-white">
                  {autoRenewalHero.title || 'Auto-Renewal Lock-In Trap'}
                </h3>
              </div>
            </div>

            <button
              onClick={onGoToStep5Email}
              className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/30 transition-all flex items-center gap-2 shrink-0 self-start sm:self-auto"
            >
              <span>Generate My Email →</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {/* Fine Print Line */}
            <div className="p-4 rounded-xl bg-slate-950/70 border border-purple-500/30">
              <span className="text-xs font-mono text-purple-300 font-bold flex items-center gap-1.5 mb-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-purple-400" />
                Exact Fine-Print Line
              </span>
              <p className="text-xs sm:text-sm font-mono italic text-slate-200">
                &quot;{autoRenewalHero.finePrintLine}&quot;
              </p>
            </div>

            {/* Financial Trap & Deadline */}
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-500/30 flex items-start gap-2.5">
                <DollarSign className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs font-bold text-red-300 uppercase tracking-wider">
                    Hidden Financial Trap:
                  </span>
                  <p className="text-xs text-red-100 font-medium mt-0.5">
                    {autoRenewalHero.financialTrap}
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/30 flex items-start gap-2.5">
                <Calendar className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                    Notice Deadline to Act:
                  </span>
                  <p className="text-xs text-amber-100 font-medium mt-0.5">
                    {autoRenewalHero.deadline}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Replacement Sentence */}
          <div className="mt-4 p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30">
            <span className="text-xs font-mono text-emerald-400 font-bold flex items-center gap-1.5 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              Recommended Neutralizing Replacement
            </span>
            <p className="text-xs sm:text-sm font-medium text-emerald-200">
              &quot;{autoRenewalHero.replacementSentence}&quot;
            </p>
          </div>
        </div>
      </div>

      {/* Collectible Villain Cards Section */}
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-xl font-black text-white flex items-center gap-2">
            <Flame className="w-5 h-5 text-red-500" />
            <span>Collectible Villain Cards</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Click any card to flip and discover the negotiation counter-move that defeats it!
          </p>
        </div>
        <span className="text-xs text-slate-400 font-mono">
          Showing {villains.length} Villain Personas
        </span>
      </div>

      {/* Grid of 3D Flip Trading Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {villains.map((villain) => {
          const isFlipped = !!flippedCards[villain.id];

          return (
            <div
              key={villain.id}
              onClick={() => toggleFlip(villain.id)}
              className="perspective-1000 h-[430px] cursor-pointer group"
            >
              <div
                className={`relative w-full h-full duration-500 transform-style-3d transition-transform holographic-card rounded-2xl ${
                  isFlipped ? 'rotate-y-180' : ''
                }`}
              >
                {/* FRONT OF TRADING CARD */}
                <div className="absolute inset-0 backface-hidden w-full h-full rounded-2xl bg-gradient-to-b from-[#162036] via-[#111A2E] to-[#0B1220] border-2 border-red-500/40 p-5 flex flex-col justify-between shadow-xl group-hover:border-red-400 transition-colors">
                  <div>
                    {/* Top Header of Card */}
                    <div className="flex items-center justify-between pb-3 border-b border-slate-700/80">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{villain.emoji}</span>
                        <div>
                          <h4 className="text-sm font-black text-white leading-tight">
                            {villain.name}
                          </h4>
                          <span className="text-[10px] text-red-400 font-mono font-bold tracking-wider uppercase">
                            {villain.archetype}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-bold">
                        Lv.{villain.dangerLevel}
                      </span>
                    </div>

                    {/* Villain Portrait Area */}
                    <div className="my-3 h-32 rounded-xl bg-gradient-to-br from-red-950/60 to-slate-900 border border-slate-700 flex flex-col items-center justify-center relative overflow-hidden">
                      <div className="text-5xl filter drop-shadow-[0_5px_15px_rgba(239,68,68,0.4)]">
                        {villain.emoji}
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 mt-2 font-bold uppercase tracking-wider">
                        {villain.category || 'Contract Predator'}
                      </span>
                    </div>

                    {/* Attack Description */}
                    <div className="space-y-2">
                      <div className="p-2.5 rounded-lg bg-red-950/30 border border-red-500/20">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-red-400 block">
                          Attack Vector:
                        </span>
                        <p className="text-xs text-red-200 mt-0.5 leading-snug font-medium">
                          {villain.attack}
                        </p>
                      </div>

                      {/* Exact Clause Snippet */}
                      <div className="p-2 rounded-lg bg-[#080D17] border border-slate-800">
                        <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-slate-400 block">
                          Clause Snippet:
                        </span>
                        <p className="text-[11px] font-mono text-slate-300 line-clamp-2 italic">
                          &quot;{villain.exactClause}&quot;
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer: Danger Skulls & Flip Prompt */}
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] font-mono text-slate-400 mr-1">Threat:</span>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span
                          key={i}
                          className={`text-xs ${i < villain.dangerLevel ? 'text-red-400' : 'text-slate-700'}`}
                        >
                          💀
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-1 text-[11px] font-bold text-amber-400 group-hover:underline">
                      <RotateCw className="w-3 h-3" />
                      <span>Click to Flip</span>
                    </div>
                  </div>
                </div>

                {/* BACK OF TRADING CARD (Weakness / Counter-Move) */}
                <div className="absolute inset-0 backface-hidden rotate-y-180 w-full h-full rounded-2xl bg-gradient-to-b from-[#0E1E2E] via-[#0D1826] to-[#0A101A] border-2 border-emerald-500/50 p-5 flex flex-col justify-between shadow-2xl text-left">
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-emerald-500/30">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">🛡️</span>
                        <div>
                          <h4 className="text-sm font-black text-emerald-300">
                            Counter-Move Blueprint
                          </h4>
                          <span className="text-[10px] text-slate-400 font-mono">
                            Neutralizing {villain.name}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">
                        Defeated
                      </span>
                    </div>

                    <div className="my-4 p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40">
                      <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5 mb-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                        Weakness &amp; Counter-Move:
                      </span>
                      <p className="text-xs sm:text-sm text-emerald-100 font-medium leading-relaxed">
                        {villain.weakness}
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 space-y-1">
                      <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-bold block">
                        Negotiation Tactic:
                      </span>
                      <p className="text-xs leading-relaxed">
                        Request mutual notification terms or tie penalties to demonstrable out-of-pocket costs rather than automatic forfeitures.
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                    <span className="text-[11px] font-mono">Card #{villain.id}</span>
                    <span className="flex items-center gap-1 text-[11px] font-bold text-slate-300 hover:text-white">
                      <RotateCw className="w-3 h-3" />
                      <span>Flip Back</span>
                    </span>
                  </div>
                </div>

              </div>
            </div>
          );
        })}
      </div>

      {villains.length === 0 && (
        <div className="text-center py-12 p-6 rounded-2xl bg-[#111A2E] border border-slate-800 text-slate-400">
          <p className="text-sm font-semibold">No high-risk villains found in this contract!</p>
          <p className="text-xs mt-1">This agreement appears relatively standard or clean.</p>
        </div>
      )}

      {/* Bottom CTA to Step 4 */}
      <div className="mt-10 flex justify-end">
        <button
          onClick={onProceedToStep4}
          className="px-6 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white shadow-lg shadow-red-600/20 transition-all flex items-center gap-2 hover:scale-[1.02]"
        >
          <span>Next: Step 4 - Counter Offers</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
