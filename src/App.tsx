import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { PillarStrip } from './components/PillarStrip';
import { Stepper } from './components/Stepper';
import { Step1Input } from './components/Step1Input';
import { Step2RiskyClauses } from './components/Step2RiskyClauses';
import { Step3ScoreAndVillains } from './components/Step3ScoreAndVillains';
import { Step4CounterOffers } from './components/Step4CounterOffers';
import { Step5EmailAndSignCard } from './components/Step5EmailAndSignCard';
import { AskFinePrintChat } from './components/AskFinePrintChat';
import { CompareModal } from './components/CompareModal';
import { PastAnalysesModal } from './components/PastAnalysesModal';
import { AuthModal } from './components/AuthModal';
import { Footer } from './components/Footer';

import { 
  UserRole, 
  UserWorry, 
  NegotiationTone, 
  Language, 
  AnalysisResult, 
  ChecklistItem,
  ChatMessage
} from './types';
import { SAMPLE_RENTAL_CONTRACT } from './data/sampleContracts';
import { analyzeContract } from './services/gemini';
import { 
  auth, 
  onAuthStateChanged, 
  logoutUser, 
  saveAnalysisDocument, 
  fetchUserAnalyses, 
  deleteUserAnalysis, 
  deleteAllUserAnalyses,
  User
} from './services/firebase';

export default function App() {
  // Authentication & Demo Mode State
  const [user, setUser] = useState<User | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // App Theme & Language
  const [darkMode, setDarkMode] = useState(true);
  const [language, setLanguage] = useState<Language>('English');

  // Input State
  const [contractText, setContractText] = useState('');
  const [role, setRole] = useState<UserRole>('Tenant');
  const [worry, setWorry] = useState<UserWorry>('Losing my deposit');
  const [tone, setTone] = useState<NegotiationTone>('Firm');
  const [saveContractText, setSaveContractText] = useState(false);

  // Stepper State (Steps 1 to 5)
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [unlockedSteps, setUnlockedSteps] = useState<number[]>([1]);

  // Active Analysis Data
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [emailText, setEmailText] = useState('');
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [isPastAnalysesOpen, setIsPastAnalysesOpen] = useState(false);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [pastAnalyses, setPastAnalyses] = useState<AnalysisResult[]>([]);

  // Chat helper
  const [chatPrefilledClause, setChatPrefilledClause] = useState<string | null>(null);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setIsAuthChecking(false);
      if (currentUser) {
        setIsDemoMode(false);
        try {
          const userRecords = await fetchUserAnalyses(currentUser.uid);
          setPastAnalyses(userRecords);
        } catch (err) {
          console.error("Could not fetch user analyses:", err);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // Sync theme
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      document.body.style.backgroundColor = '#0B1220';
    } else {
      document.documentElement.classList.remove('dark');
      document.body.style.backgroundColor = '#0F172A';
    }
  }, [darkMode]);

  // Main Contract Analysis Call
  const handleAnalyzeContract = async () => {
    if (!contractText || contractText.trim().length < 30) {
      setError('Please provide at least 30 characters of contract text or select the sample agreement.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await analyzeContract(contractText, role, worry, tone, language);
      
      // Attach local text metadata
      result.contractText = contractText;
      result.savedContractText = saveContractText;
      
      setAnalysis(result);
      setEmailText(result.negotiationEmail);
      setChecklist(result.checklist);

      // Unlock all 5 steps
      setUnlockedSteps([1, 2, 3, 4, 5]);
      setCurrentStep(2); // Advance to Risky Clauses Table

      // Persist to Firestore if authenticated
      if (user) {
        try {
          await saveAnalysisDocument(user.uid, result, saveContractText);
          const updated = await fetchUserAnalyses(user.uid);
          setPastAnalyses(updated);
        } catch (dbErr) {
          console.error("Could not save to Firestore:", dbErr);
        }
      }

      window.scrollTo({ top: 150, behavior: 'smooth' });
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Contract analysis failed. Please verify the document text.');
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle counter-offer selection for email
  const handleToggleOfferSelection = (id: string) => {
    if (!analysis) return;
    const updatedOffers = analysis.counterOffers.map(o =>
      o.id === id ? { ...o, selectedForEmail: !o.selectedForEmail } : o
    );
    setAnalysis({ ...analysis, counterOffers: updatedOffers });
  };

  // Delete an analysis
  const handleDeleteAnalysis = async (id: string) => {
    if (!user) return;
    await deleteUserAnalysis(user.uid, id);
    const updated = await fetchUserAnalyses(user.uid);
    setPastAnalyses(updated);
  };

  // Delete all data
  const handleDeleteAllData = async () => {
    if (!user) return;
    await deleteAllUserAnalyses(user.uid);
    setPastAnalyses([]);
  };

  // Load sample contract helper
  const handleLoadSampleContract = () => {
    setContractText(SAMPLE_RENTAL_CONTRACT);
    setRole('Tenant');
    setWorry('Losing my deposit');
  };

  // Re-open saved analysis
  const handleSelectPastAnalysis = (saved: AnalysisResult) => {
    setAnalysis(saved);
    if (saved.contractText) {
      setContractText(saved.contractText);
    }
    setRole(saved.role);
    setWorry(saved.worry);
    setTone(saved.tone);
    setLanguage(saved.language || 'English');
    setEmailText(saved.negotiationEmail);
    setChecklist(saved.checklist || []);
    setChatMessages(saved.chatMessages || []);
    setUnlockedSteps([1, 2, 3, 4, 5]);
    setCurrentStep(3); // Jump to Score & Villains
    window.scrollTo({ top: 150, behavior: 'smooth' });
  };

  // Sign out
  const handleSignOut = async () => {
    await logoutUser();
    setUser(null);
    setIsDemoMode(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0B1220] text-slate-100 antialiased selection:bg-red-500 selection:text-white">
      {/* Top Header */}
      <Header
        user={user}
        isDemoMode={isDemoMode}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onSignOut={handleSignOut}
        onOpenPastAnalyses={() => setIsPastAnalysesOpen(true)}
        onOpenCompare={() => setIsCompareOpen(true)}
        currentLanguage={language}
        onSelectLanguage={setLanguage}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        analysesCount={pastAnalyses.length}
      />

      {/* 3-Pillar Visual Strip */}
      <PillarStrip
        activeStep={currentStep}
        onSelectStep={(targetStep) => {
          if (unlockedSteps.includes(targetStep)) {
            setCurrentStep(targetStep);
            window.scrollTo({ top: 150, behavior: 'smooth' });
          }
        }}
      />

      {/* Sticky 5-Step Stepper */}
      <Stepper
        currentStep={currentStep}
        unlockedSteps={unlockedSteps}
        onSelectStep={(step) => {
          setCurrentStep(step);
          window.scrollTo({ top: 150, behavior: 'smooth' });
        }}
      />

      {/* Main Multi-Step Content Area */}
      <main className="flex-1 pb-16">
        {currentStep === 1 && (
          <Step1Input
            contractText={contractText}
            setContractText={setContractText}
            role={role}
            setRole={setRole}
            worry={worry}
            setWorry={setWorry}
            tone={tone}
            setTone={setTone}
            language={language}
            saveContractText={saveContractText}
            setSaveContractText={setSaveContractText}
            onAnalyze={handleAnalyzeContract}
            isLoading={isLoading}
            error={error}
          />
        )}

        {currentStep === 2 && analysis && (
          <Step2RiskyClauses
            clauses={analysis.clauses}
            userWorry={analysis.worry}
            userRole={analysis.role}
            onProceedToStep3={() => {
              setCurrentStep(3);
              window.scrollTo({ top: 150, behavior: 'smooth' });
            }}
            onAskClauseInChat={(quote) => setChatPrefilledClause(quote)}
          />
        )}

        {currentStep === 3 && analysis && (
          <Step3ScoreAndVillains
            riskScore={analysis.riskScore}
            verdict={analysis.verdict}
            justification={analysis.justification}
            counts={analysis.counts}
            villains={analysis.villains}
            autoRenewalHero={analysis.autoRenewalHero}
            contractTitle={analysis.contractTitle}
            onProceedToStep4={() => {
              setCurrentStep(4);
              window.scrollTo({ top: 150, behavior: 'smooth' });
            }}
            onGoToStep5Email={() => {
              setCurrentStep(5);
              window.scrollTo({ top: 150, behavior: 'smooth' });
            }}
          />
        )}

        {currentStep === 4 && analysis && (
          <Step4CounterOffers
            counterOffers={analysis.counterOffers}
            onToggleOfferSelection={handleToggleOfferSelection}
            onProceedToStep5={() => {
              setCurrentStep(5);
              window.scrollTo({ top: 150, behavior: 'smooth' });
            }}
          />
        )}

        {currentStep === 5 && analysis && (
          <Step5EmailAndSignCard
            emailText={emailText}
            setEmailText={setEmailText}
            tone={tone}
            setTone={setTone}
            language={language}
            clauses={analysis.clauses}
            counterOffers={analysis.counterOffers}
            userRole={analysis.role}
            riskScore={analysis.riskScore}
            verdict={analysis.verdict}
            deadline={analysis.autoRenewalHero?.deadline || ''}
            checklist={checklist}
            setChecklist={setChecklist}
          />
        )}
      </main>

      {/* Floating / Docked "Ask the Fine Print" AI Chat Assistant */}
      <AskFinePrintChat
        contractText={contractText}
        clauses={analysis?.clauses || []}
        analysisSummary={analysis?.justification || ''}
        language={language}
        prefilledQuestion={chatPrefilledClause}
        onClearPrefilledQuestion={() => setChatPrefilledClause(null)}
        messages={chatMessages}
        onUpdateMessages={(msgs) => {
          setChatMessages(msgs);
          if (analysis) {
            setAnalysis({ ...analysis, chatMessages: msgs });
          }
        }}
        onLoadSampleContract={handleLoadSampleContract}
      />

      {/* Compare Contracts Modal */}
      <CompareModal
        isOpen={isCompareOpen}
        onClose={() => setIsCompareOpen(false)}
        role={role}
        worry={worry}
        language={language}
      />

      {/* Past Analyses Modal */}
      <PastAnalysesModal
        isOpen={isPastAnalysesOpen}
        onClose={() => setIsPastAnalysesOpen(false)}
        analyses={pastAnalyses}
        onSelectAnalysis={handleSelectPastAnalysis}
        onDeleteAnalysis={handleDeleteAnalysis}
        onDeleteAllData={handleDeleteAllData}
      />

      {/* Firebase Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onEnterDemoMode={() => setIsDemoMode(true)}
        onSuccessAuth={() => setIsDemoMode(false)}
      />

      {/* Footer */}
      <Footer
        onOpenDeleteDataModal={user ? () => setIsPastAnalysesOpen(true) : undefined}
      />
    </div>
  );
}
