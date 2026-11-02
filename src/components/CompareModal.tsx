import React, { useState } from 'react';
import { 
  GitCompare, 
  X, 
  Loader2, 
  Sparkles, 
  ArrowRight, 
  TrendingDown, 
  TrendingUp, 
  ShieldCheck, 
  AlertTriangle,
  FileText
} from 'lucide-react';
import { ComparisonResult, UserRole, UserWorry, Language } from '../types';
import { SAMPLE_RENTAL_CONTRACT, SAMPLE_REVISED_CONTRACT } from '../data/sampleContracts';
import { compareContracts } from '../services/gemini';

interface CompareModalProps {
  isOpen: boolean;
  onClose: () => void;
  role: UserRole;
  worry: UserWorry;
  language: Language;
}

export const CompareModal: React.FC<CompareModalProps> = ({
  isOpen,
  onClose,
  role,
  worry,
  language,
}) => {
  const [originalText, setOriginalText] = useState('');
  const [revisedText, setRevisedText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLoadSamples = () => {
    setOriginalText(SAMPLE_RENTAL_CONTRACT);
    setRevisedText(SAMPLE_REVISED_CONTRACT);
  };

  const handleRunComparison = async () => {
    if (!originalText.trim() || !revisedText.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await compareContracts(originalText, revisedText, role, worry, language);
      setResult(data);
    } catch (err: any) {
      setError(err?.message || 'Comparison failed. Please verify both contracts.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl my-8 rounded-3xl bg-[#0E1626] border border-slate-700 shadow-2xl p-6 sm:p-8 text-left">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
              <GitCompare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white">
                Contract Revision Comparison Mode
              </h3>
              <p className="text-xs text-slate-400">
                Compare original draft vs proposed counter-draft to verify if risk decreased.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleLoadSamples}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 transition-colors flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Load Sample Comparison</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              aria-label="Close comparison"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {error && (
          <div className="my-4 p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-xs text-red-200">
            {error}
          </div>
        )}

        {/* Inputs (Side by Side) */}
        {!result && (
          <div className="mt-5 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-300 mb-1 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-red-400" />
                  Original Contract (Version A)
                </label>
                <textarea
                  value={originalText}
                  onChange={(e) => setOriginalText(e.target.value)}
                  placeholder="Paste the original contract draft here..."
                  rows={9}
                  className="w-full p-3 rounded-xl bg-[#080D17] border border-slate-700 text-slate-100 text-xs font-mono focus:ring-1 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-300 mb-1 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-emerald-400" />
                  Revised / Counter Contract (Version B)
                </label>
                <textarea
                  value={revisedText}
                  onChange={(e) => setRevisedText(e.target.value)}
                  placeholder="Paste the updated or revised draft here..."
                  rows={9}
                  className="w-full p-3 rounded-xl bg-[#080D17] border border-slate-700 text-slate-100 text-xs font-mono focus:ring-1 focus:ring-sky-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleRunComparison}
                disabled={!originalText.trim() || !revisedText.trim() || isLoading}
                className="px-6 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white transition-all shadow-lg shadow-sky-600/25 flex items-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Analyzing Differences...</span>
                  </>
                ) : (
                  <>
                    <GitCompare className="w-4 h-4" />
                    <span>Run AI Comparison Audit</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Comparison Result View */}
        {result && (
          <div className="mt-6 space-y-6">
            {/* Score Delta Banner */}
            <div
              className={`p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                result.isNewRiskier
                  ? 'bg-red-950/30 border-red-500/50 text-red-200'
                  : 'bg-emerald-950/30 border-emerald-500/50 text-emerald-200'
              }`}
            >
              <div>
                <div className="flex items-center gap-2">
                  {result.isNewRiskier ? (
                    <TrendingUp className="w-6 h-6 text-red-400" />
                  ) : (
                    <TrendingDown className="w-6 h-6 text-emerald-400" />
                  )}
                  <span className="text-lg font-black uppercase tracking-wide">
                    {result.isNewRiskier
                      ? 'WARNING: The revised version is MORE risky!'
                      : 'SUCCESS: The revised version is SAFER!'}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1">{result.summary}</p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="text-center p-2 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="text-xs text-slate-400">Original</div>
                  <div className="text-xl font-black text-red-400">{result.originalScore}/100</div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500" />
                <div className="text-center p-2 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="text-xs text-slate-400">Revised</div>
                  <div className={`text-xl font-black ${result.isNewRiskier ? 'text-red-400' : 'text-emerald-400'}`}>
                    {result.newScore}/100
                  </div>
                </div>
              </div>
            </div>

            {/* Key Takeaways */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <h4 className="text-xs font-mono font-bold uppercase text-slate-300 mb-2">
                Key Shifts Between Versions:
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-300 list-disc list-inside">
                {result.keyTakeaways?.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>

            {/* Diff Clauses List */}
            <div className="space-y-3">
              <h4 className="text-xs font-mono font-bold uppercase text-slate-300">
                Clause-by-Clause Impact:
              </h4>
              {result.diffs?.map((diff, i) => (
                <div
                  key={i}
                  className="p-3.5 rounded-xl bg-[#111A2E] border border-slate-700/80 text-xs space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-white uppercase tracking-wider">
                      {diff.category}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        diff.riskImpact === 'improved'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : diff.riskImpact === 'worsened'
                          ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                          : 'bg-slate-700 text-slate-300'
                      }`}
                    >
                      {diff.riskImpact} ({diff.status})
                    </span>
                  </div>

                  <p className="text-slate-300">{diff.notes}</p>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setResult(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white"
              >
                Compare Different Versions
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
