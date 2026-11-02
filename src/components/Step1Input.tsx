import React, { useState, useEffect, useRef } from 'react';
import { 
  Upload, 
  FileText, 
  Sparkles, 
  AlertCircle, 
  ShieldCheck, 
  CheckCircle2, 
  Loader2, 
  FileCode, 
  Camera, 
  Lock,
  ArrowRight
} from 'lucide-react';
import { UserRole, UserWorry, NegotiationTone, Language } from '../types';
import { SAMPLE_RENTAL_CONTRACT } from '../data/sampleContracts';
import { extractTextFromFile } from '../services/gemini';

interface Step1InputProps {
  contractText: string;
  setContractText: (text: string) => void;
  role: UserRole;
  setRole: (role: UserRole) => void;
  worry: UserWorry;
  setWorry: (worry: UserWorry) => void;
  tone: NegotiationTone;
  setTone: (tone: NegotiationTone) => void;
  language: Language;
  saveContractText: boolean;
  setSaveContractText: (save: boolean) => void;
  onAnalyze: () => void;
  isLoading: boolean;
  error?: string | null;
}

export const Step1Input: React.FC<Step1InputProps> = ({
  contractText,
  setContractText,
  role,
  setRole,
  worry,
  setWorry,
  tone,
  setTone,
  language,
  saveContractText,
  setSaveContractText,
  onAnalyze,
  isLoading,
  error
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionNotice, setExtractionNotice] = useState<string | null>(null);
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadingMessages = [
    "Hunting for hidden fees...",
    "Waking the Deposit Dragon...",
    "Unmasking the Auto-Renewal Trap...",
    "Auditing unilateral modification rights...",
    "Calculating 0-100 Trap-o-Meter risk vectors...",
    "Drafting balanced counter-offers..."
  ];

  useEffect(() => {
    if (!isLoading) return;
    const interval = setInterval(() => {
      setLoadingMsgIndex((prev) => (prev + 1) % loadingMessages.length);
    }, 2400);
    return () => clearInterval(interval);
  }, [isLoading]);

  const handleFileUpload = async (file: File) => {
    try {
      setIsExtracting(true);
      setExtractionNotice(`Extracting text from ${file.name}...`);
      const extracted = await extractTextFromFile(file);
      setUploadedFileName(file.name);
      
      // If textarea already has text, append or combine
      if (contractText.trim().length > 0) {
        setContractText(`${contractText}\n\n=== ATTACHED FILE (${file.name}) ===\n${extracted}`);
      } else {
        setContractText(extracted);
      }
      setExtractionNotice(`Successfully extracted ${extracted.length} characters from ${file.name}`);
    } catch (err: any) {
      console.error(err);
      setExtractionNotice(`Failed to parse file: ${err.message || 'Please upload a PDF, TXT, DOCX or image'}`);
    } finally {
      setIsExtracting(false);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const onDragLeave = () => {
    setDragActive(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleSampleContract = () => {
    setContractText(SAMPLE_RENTAL_CONTRACT);
    setRole('Tenant');
    setWorry('Losing my deposit');
    setUploadedFileName('Realistic_Sample_Rental_Agreement.txt');
    setExtractionNotice('Loaded sample rental agreement with 5 fine-print traps!');
  };

  const charCount = contractText.trim().length;
  const wordCount = contractText.trim() ? contractText.trim().split(/\s+/).length : 0;
  const isValid = charCount >= 40;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/30">
              STEP 1 OF 5
            </span>
            <span className="text-xs uppercase tracking-widest text-slate-400 font-semibold">
              Spot It
            </span>
          </div>
          <h2 className="text-2xl font-black text-white mt-1">
            Contract Input &amp; Threat Profiler
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Upload or paste any lease, job contract, freelance agreement, or terms of service.
          </p>
        </div>

        {/* Try Sample Contract CTA */}
        <button
          onClick={handleSampleContract}
          className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 border border-amber-500/40 text-amber-300 transition-all flex items-center gap-2 shadow-sm shrink-0 hover:scale-[1.02]"
        >
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Try a sample contract (400 words)</span>
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-950/40 border border-red-500/50 flex items-start gap-3 text-red-200 text-sm">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-300">Analysis Notice</p>
            <p className="mt-0.5 text-red-200/90">{error}</p>
          </div>
        </div>
      )}

      {/* Profiler Persona Options */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
            I Am A...
          </label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#111A2E] border border-slate-700 text-white font-medium focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
          >
            <option value="Tenant">Tenant (Rental / Lease)</option>
            <option value="Student">Student (Housing / Loan / Courses)</option>
            <option value="Job Seeker">Job Seeker (Employment / Offer)</option>
            <option value="Freelancer">Freelancer (Client / SOW)</option>
            <option value="Small Business Owner">Small Business Owner (Vendor / SaaS)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
            My Biggest Worry Is...
          </label>
          <select
            value={worry}
            onChange={(e) => setWorry(e.target.value as UserWorry)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#111A2E] border border-slate-700 text-white font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm"
          >
            <option value="Losing my deposit">Losing my deposit / upfront funds</option>
            <option value="Hidden fees">Hidden fees &amp; unexpected surcharges</option>
            <option value="Auto-renewal or lock-in">Auto-renewal or aggressive lock-in</option>
            <option value="Unfair termination">Unfair termination or penalty buyout</option>
            <option value="Non-compete or IP ownership">Non-compete or IP ownership grab</option>
            <option value="Everything">Everything / Full Risk Audit</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
            Preferred Negotiation Tone
          </label>
          <select
            value={tone}
            onChange={(e) => setTone(e.target.value as NegotiationTone)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#111A2E] border border-slate-700 text-white font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
          >
            <option value="Polite">Polite (Gentle &amp; diplomatic)</option>
            <option value="Firm">Firm (Clear, assertive &amp; professional)</option>
            <option value="Friendly">Friendly (Casual &amp; collaborative)</option>
          </select>
        </div>
      </div>

      {/* File Upload Zone */}
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all mb-6 ${
          dragActive
            ? 'border-red-500 bg-red-500/10'
            : 'border-slate-700/80 hover:border-slate-500 bg-[#111A2E]/60'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.txt,image/*"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleFileUpload(e.target.files[0]);
            }
          }}
        />

        <div className="flex flex-col items-center justify-center gap-2">
          <div className="p-3 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
            {isExtracting ? (
              <Loader2 className="w-6 h-6 animate-spin text-red-400" />
            ) : (
              <Upload className="w-6 h-6 text-red-400" />
            )}
          </div>
          <div>
            <p className="text-sm font-bold text-white">
              {isExtracting
                ? 'Parsing document via OCR...'
                : 'Click or drop PDF, TXT, DOCX, or Photo of contract'}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Supports scanned lease photos via Gemini Multimodal OCR and digital documents
            </p>
          </div>
          {uploadedFileName && (
            <div className="mt-1 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Loaded: {uploadedFileName}</span>
            </div>
          )}
          {extractionNotice && (
            <p className="text-xs text-amber-300/90 font-medium mt-1">
              {extractionNotice}
            </p>
          )}
        </div>
      </div>

      {/* Large Textarea */}
      <div className="relative mb-4">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-slate-400" />
            <span>Or Paste Contract Text</span>
          </label>
          <div className="text-xs text-slate-400 font-mono">
            {charCount} characters ({wordCount} words)
          </div>
        </div>

        <textarea
          value={contractText}
          onChange={(e) => setContractText(e.target.value)}
          placeholder="Paste the full contract, lease agreement, employment offer, or fine-print terms here...

Example:
'Unless Tenant provides written notice 90 days prior, lease automatically renews for 12 months at prevailing market rate plus 20%...'"
          rows={11}
          className="w-full px-4 py-3.5 rounded-2xl bg-[#0E1626] border border-slate-700/80 text-slate-100 placeholder-slate-500 font-mono text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 leading-relaxed transition-all shadow-inner"
        />

        {/* Privacy Note & Save Text Toggle */}
        <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>
              <strong className="text-slate-300">Privacy First:</strong> Remove ID numbers, bank details and other sensitive personal data before uploading.
            </span>
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none text-slate-300 shrink-0">
            <input
              type="checkbox"
              checked={saveContractText}
              onChange={(e) => setSaveContractText(e.target.checked)}
              className="rounded border-slate-700 text-red-500 focus:ring-red-500 bg-[#111A2E] w-4 h-4"
            />
            <span>Save contract text in my database (off by default)</span>
          </label>
        </div>
      </div>

      {/* Analyze CTA */}
      <div className="pt-4 flex flex-col items-center justify-center">
        <button
          onClick={onAnalyze}
          disabled={!isValid || isLoading || isExtracting}
          className={`w-full sm:w-auto min-w-[280px] px-8 py-4 rounded-2xl font-black text-base uppercase tracking-wider text-white shadow-xl transition-all duration-300 flex items-center justify-center gap-3 ${
            isValid && !isLoading && !isExtracting
              ? 'bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-500 hover:to-amber-500 shadow-red-600/25 hover:shadow-red-600/40 hover:scale-[1.02] cursor-pointer'
              : 'bg-slate-800 text-slate-500 border border-slate-700/60 cursor-not-allowed opacity-60'
          }`}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Analyzing Fine Print...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 text-amber-300" />
              <span>Analyze My Contract</span>
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>

        {isLoading && (
          <div className="mt-4 text-center animate-pulse">
            <p className="text-sm font-semibold text-amber-300">
              {loadingMessages[loadingMsgIndex]}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Extracting verbatim clauses, grading Trap-o-Meter risk, and awakening Villains...
            </p>
          </div>
        )}

        {!isValid && !isLoading && (
          <p className="text-xs text-slate-500 mt-2">
            Please paste contract text or click &quot;Try a sample contract&quot; to begin.
          </p>
        )}
      </div>
    </div>
  );
};
