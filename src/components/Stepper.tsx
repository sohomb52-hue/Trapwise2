import React from 'react';
import { Check, FileText, AlertTriangle, Gauge, Swords, MailCheck } from 'lucide-react';

interface StepperProps {
  currentStep: number;
  unlockedSteps: number[];
  onSelectStep: (step: number) => void;
}

export const Stepper: React.FC<StepperProps> = ({
  currentStep,
  unlockedSteps,
  onSelectStep,
}) => {
  const steps = [
    {
      num: 1,
      label: 'SPOT IT',
      sublabel: 'Contract Input',
      icon: FileText,
    },
    {
      num: 2,
      label: 'UNDERSTAND IT',
      sublabel: 'Risky Clauses',
      icon: AlertTriangle,
    },
    {
      num: 3,
      label: 'SCORE IT',
      sublabel: 'Trap-o-Meter & Villains',
      icon: Gauge,
    },
    {
      num: 4,
      label: 'FIGHT BACK',
      sublabel: 'Counter-Offers',
      icon: Swords,
    },
    {
      num: 5,
      label: 'ACTION',
      sublabel: 'Email & Sign Card',
      icon: MailCheck,
    },
  ];

  return (
    <div className="sticky top-[108px] z-30 bg-[#0B1220]/95 backdrop-blur-md border-y border-[#1E293B] py-2.5 px-4 sm:px-6 shadow-md transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between overflow-x-auto no-scrollbar gap-2 sm:gap-4">
        {steps.map((s, index) => {
          const isCurrent = currentStep === s.num;
          const isUnlocked = unlockedSteps.includes(s.num);
          const isCompleted = unlockedSteps.includes(s.num) && currentStep > s.num;
          const Icon = s.icon;

          return (
            <React.Fragment key={s.num}>
              <button
                onClick={() => isUnlocked && onSelectStep(s.num)}
                disabled={!isUnlocked}
                className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl transition-all shrink-0 text-left ${
                  isCurrent
                    ? 'bg-gradient-to-r from-red-600/30 to-amber-600/20 border border-red-500/60 shadow-lg shadow-red-500/10'
                    : isUnlocked
                    ? 'bg-[#111A2E]/70 hover:bg-[#1E293B] border border-slate-700/60 cursor-pointer'
                    : 'bg-slate-900/40 border border-slate-800/60 opacity-50 cursor-not-allowed'
                }`}
                aria-label={`Step ${s.num}: ${s.label} ${s.sublabel}`}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold transition-colors ${
                    isCompleted
                      ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-300'
                      : isCurrent
                      ? 'bg-red-500 text-white shadow-sm'
                      : isUnlocked
                      ? 'bg-slate-800 border border-slate-700 text-slate-300'
                      : 'bg-slate-900 text-slate-600'
                  }`}
                >
                  {isCompleted ? <Check className="w-4 h-4 stroke-[2.5]" /> : <Icon className="w-3.5 h-3.5" />}
                </div>

                <div className="hidden sm:block">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-[10px] font-mono font-bold tracking-wider uppercase ${
                        isCurrent ? 'text-red-400' : isUnlocked ? 'text-slate-400' : 'text-slate-600'
                      }`}
                    >
                      Step {s.num}
                    </span>
                  </div>
                  <div
                    className={`text-xs font-bold leading-tight ${
                      isCurrent ? 'text-white' : isUnlocked ? 'text-slate-200' : 'text-slate-500'
                    }`}
                  >
                    {s.label}
                  </div>
                </div>
              </button>

              {index < steps.length - 1 && (
                <div
                  className={`h-0.5 flex-1 min-w-4 max-w-10 rounded transition-colors hidden md:block ${
                    unlockedSteps.includes(s.num + 1) ? 'bg-gradient-to-r from-red-500 to-amber-500' : 'bg-slate-800'
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
