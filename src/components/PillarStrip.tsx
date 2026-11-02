import React from 'react';
import { Target, Skull, Swords, ArrowRight } from 'lucide-react';

interface PillarStripProps {
  activeStep: number;
  onSelectStep?: (step: number) => void;
}

export const PillarStrip: React.FC<PillarStripProps> = ({ activeStep, onSelectStep }) => {
  const pillars = [
    {
      step: 1,
      targetStep: 2,
      number: '1',
      title: 'SPOT IT',
      subtitle: 'Trap-o-Meter',
      description: 'Extracts risky clauses with exact verbatim quotes and assigns an instant 0-100 risk rating: Safe, Careful, Negotiate or Walk Away.',
      icon: Target,
      color: 'from-amber-500/20 to-orange-500/10',
      borderColor: 'border-amber-500/30',
      activeBorder: 'border-amber-500',
      textColor: 'text-amber-400',
      tag: 'Verbatim Quotes',
    },
    {
      step: 2,
      targetStep: 3,
      number: '2',
      title: 'UNDERSTAND IT',
      subtitle: 'Villain Trading Cards',
      description: 'Gamifies fine-print traps into memorable collectible personas (Deposit Dragon, Auto-Renewal Trap) so you instantly feel the real-world hit.',
      icon: Skull,
      color: 'from-red-500/20 to-rose-500/10',
      borderColor: 'border-red-500/30',
      activeBorder: 'border-red-500',
      textColor: 'text-red-400',
      tag: 'Gamified Personas',
    },
    {
      step: 3,
      targetStep: 4,
      number: '3',
      title: 'FIGHT BACK',
      subtitle: 'Counter-Offers & Ready Email',
      description: 'Generates balanced replacement sentences, fallback compromises, and a copy-paste negotiation email to push back with confidence.',
      icon: Swords,
      color: 'from-emerald-500/20 to-teal-500/10',
      borderColor: 'border-emerald-500/30',
      activeBorder: 'border-emerald-500',
      textColor: 'text-emerald-400',
      tag: 'Instant Counter-Offers',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-2">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {pillars.map((pillar) => {
          const Icon = pillar.icon;
          const isActive = 
            (pillar.number === '1' && (activeStep === 1 || activeStep === 2)) ||
            (pillar.number === '2' && activeStep === 3) ||
            (pillar.number === '3' && (activeStep === 4 || activeStep === 5));

          return (
            <div
              key={pillar.title}
              onClick={() => onSelectStep && onSelectStep(pillar.targetStep)}
              className={`relative rounded-xl p-4 bg-gradient-to-br ${pillar.color} bg-[#111A2E]/80 border ${
                isActive ? pillar.activeBorder + ' shadow-lg ring-1 ring-red-500/30' : pillar.borderColor
              } transition-all duration-200 cursor-pointer hover:border-slate-400 group overflow-hidden`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-lg bg-[#0B1220]/90 border border-slate-700/80 ${pillar.textColor}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                        PILLAR {pillar.number}
                      </span>
                      <span className={`text-xs font-black tracking-wider uppercase ${pillar.textColor}`}>
                        {pillar.title}
                      </span>
                    </div>
                    <h2 className="text-sm font-bold text-white group-hover:text-red-300 transition-colors">
                      {pillar.subtitle}
                    </h2>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800/80 border border-slate-700 text-slate-300 font-medium">
                  {pillar.tag}
                </span>
              </div>
              <p className="text-xs text-slate-300/85 mt-2.5 leading-relaxed">
                {pillar.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
