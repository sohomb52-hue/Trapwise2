import React, { useState } from 'react';
import { 
  History, 
  X, 
  Trash2, 
  FolderOpen, 
  AlertTriangle, 
  Calendar, 
  ShieldCheck, 
  Loader2 
} from 'lucide-react';
import { AnalysisResult } from '../types';

interface PastAnalysesModalProps {
  isOpen: boolean;
  onClose: () => void;
  analyses: AnalysisResult[];
  onSelectAnalysis: (analysis: AnalysisResult) => void;
  onDeleteAnalysis: (id: string) => Promise<void>;
  onDeleteAllData: () => Promise<void>;
}

export const PastAnalysesModal: React.FC<PastAnalysesModalProps> = ({
  isOpen,
  onClose,
  analyses,
  onSelectAnalysis,
  onDeleteAnalysis,
  onDeleteAllData,
}) => {
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDeleteOne = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingId(id);
    try {
      await onDeleteAnalysis(id);
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteAll = async () => {
    setIsDeleting(true);
    try {
      await onDeleteAllData();
      setConfirmDeleteAll(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl my-8 rounded-3xl bg-[#0E1626] border border-slate-700 shadow-2xl p-6 sm:p-8 text-left">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white">
                My Past Analyses
              </h3>
              <p className="text-xs text-slate-400">
                Saved risk reports securely stored in your personal cloud repository.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            aria-label="Close past analyses"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Delete All Data Confirmation Area */}
        {confirmDeleteAll ? (
          <div className="my-4 p-4 rounded-2xl bg-red-950/40 border border-red-500/50 space-y-3">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-red-300">
                  Are you absolutely sure you want to delete all saved analyses?
                </h4>
                <p className="text-xs text-red-200/90 mt-1">
                  This action cannot be undone. All your saved contract analyses and cached findings will be wiped permanently.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setConfirmDeleteAll(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAll}
                disabled={isDeleting}
                className="px-4 py-1.5 rounded-lg text-xs font-bold bg-red-600 hover:bg-red-500 text-white flex items-center gap-1.5 shadow-sm"
              >
                {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>Yes, Delete Everything</span>
              </button>
            </div>
          </div>
        ) : (
          analyses.length > 0 && (
            <div className="my-4 flex justify-between items-center text-xs">
              <span className="text-slate-400">{analyses.length} saved reports</span>
              <button
                onClick={() => setConfirmDeleteAll(true)}
                className="text-red-400 hover:text-red-300 hover:underline flex items-center gap-1 font-semibold"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete all my data</span>
              </button>
            </div>
          )
        )}

        {/* List of Analyses */}
        <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
          {analyses.map((analysis) => {
            const isTargetDeleting = deletingId === analysis.id;
            return (
              <div
                key={analysis.id}
                onClick={() => {
                  onSelectAnalysis(analysis);
                  onClose();
                }}
                className="p-4 rounded-2xl bg-[#111A2E] border border-slate-700/80 hover:border-slate-500 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-sm font-bold text-white group-hover:text-red-300 transition-colors">
                      {analysis.contractTitle}
                    </h4>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {analysis.role}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        analysis.riskScore > 50
                          ? 'bg-red-500/20 text-red-300'
                          : 'bg-emerald-500/20 text-emerald-300'
                      }`}
                    >
                      Score: {analysis.riskScore}/100 ({analysis.verdict})
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-1">
                    {analysis.justification}
                  </p>

                  <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                    <Calendar className="w-3 h-3" />
                    <span>{new Date(analysis.createdAt).toLocaleDateString()}</span>
                    <span>• {analysis.clauses?.length || 0} clauses</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectAnalysis(analysis);
                      onClose();
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-600/20 text-red-300 border border-red-500/30 hover:bg-red-600/30 transition-colors flex items-center gap-1"
                  >
                    <FolderOpen className="w-3.5 h-3.5" />
                    <span>Reopen</span>
                  </button>

                  <button
                    onClick={(e) => handleDeleteOne(analysis.id, e)}
                    disabled={isTargetDeleting}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    title="Delete this analysis"
                  >
                    {isTargetDeleting ? (
                      <Loader2 className="w-4 h-4 animate-spin text-red-400" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            );
          })}

          {analyses.length === 0 && (
            <div className="text-center py-12 p-6 rounded-2xl bg-[#090F1B] border border-slate-800 text-slate-400">
              <History className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-300">No saved analyses found</p>
              <p className="text-xs text-slate-500 mt-1">
                When you analyze a contract while signed in, it will be automatically saved here.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
