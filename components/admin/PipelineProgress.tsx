'use client';

import { motion } from 'framer-motion';

const STAGES = [
  { key: 'signal-scout', label: 'Scout', gate: 1 },
  { key: 'interview-engine', label: 'Interview', gate: null },
  { key: 'backgrounder', label: 'Backgrounder', gate: 2 },
  { key: 'journalist', label: 'Content', gate: 3 },
  { key: 'distributor', label: 'Distribute', gate: null },
  { key: 'complete', label: 'Published', gate: 4 },
];

interface PipelineProgressProps {
  currentStage: string;
  gateStatus: Record<string, string | null>;
  entityName: string;
}

export function PipelineProgress({ currentStage, gateStatus, entityName }: PipelineProgressProps) {
  const currentIndex = STAGES.findIndex(s => s.key === currentStage);

  return (
    <div className="w-full">
      <p className="text-zinc-400 text-xs font-mono mb-3 truncate">{entityName}</p>
      <div className="relative flex items-center gap-0">
        {STAGES.map((stage, i) => {
          const isComplete = i < currentIndex || currentStage === 'complete';
          const isCurrent = stage.key === currentStage;
          const gateDecision = stage.gate ? gateStatus[stage.gate] : null;
          const gateApproved = gateDecision === 'approved';
          const gatePending = stage.gate && !gateDecision && isCurrent;

          return (
            <div key={stage.key} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center">
                <motion.div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono border transition-colors
                    ${isComplete || isCurrent
                      ? isCurrent
                        ? 'bg-amber-500 border-amber-500 text-zinc-950 font-bold'
                        : 'bg-zinc-700 border-zinc-600 text-zinc-300'
                      : 'bg-zinc-900 border-zinc-700 text-zinc-600'
                    }
                    ${gatePending ? 'ring-2 ring-amber-500 ring-offset-1 ring-offset-zinc-900' : ''}
                  `}
                  animate={isCurrent ? { scale: [1, 1.05, 1] } : {}}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  {isComplete && !isCurrent ? '✓' : i + 1}
                </motion.div>
                <span className={`text-xs font-mono mt-1 whitespace-nowrap ${isCurrent ? 'text-amber-400' : isComplete ? 'text-zinc-400' : 'text-zinc-700'}`}>
                  {stage.label}
                </span>
                {gateApproved && (
                  <span className="text-emerald-500 text-xs">Gate {stage.gate} ✓</span>
                )}
                {gatePending && (
                  <span className="text-amber-400 text-xs animate-pulse">Gate {stage.gate}?</span>
                )}
              </div>
              {i < STAGES.length - 1 && (
                <div className={`flex-1 h-px mx-1 ${isComplete ? 'bg-zinc-600' : 'bg-zinc-800'}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
