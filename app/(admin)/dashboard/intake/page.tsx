'use client';

import { motion } from 'framer-motion';
import { IntakeForm } from '@/components/admin/IntakeForm';
import { useRouter } from 'next/navigation';

export default function IntakePage() {
  const router = useRouter();

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-heading text-4xl text-zinc-100"
        >
          NEW INTAKE
        </motion.h1>
        <p className="text-zinc-500 font-mono text-sm mt-1">
          Submit a founder for the SIGNAL pipeline. Signal Scout will research and qualify automatically.
        </p>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
        <IntakeForm onSuccess={(taskId) => {
          setTimeout(() => router.push('/dashboard/pipeline'), 1500);
        }} />
      </div>

      {/* Process explainer */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
        <h2 className="text-zinc-300 font-mono text-sm uppercase tracking-wider mb-4">Pipeline Process</h2>
        <div className="space-y-3">
          {[
            { gate: 1, label: 'Signal Scout researches the founder', sub: 'Web intelligence, scoring, narrative angle' },
            { gate: null, label: 'You review at Gate 1', sub: 'Approve to begin interview process' },
            { gate: 2, label: 'Interview Engine collects founder story', sub: 'Question set or transcript parsing' },
            { gate: null, label: 'Backgrounder synthesizes intelligence', sub: '30+ point founder brief' },
            { gate: null, label: 'You review at Gate 2', sub: 'Approve to trigger content production' },
            { gate: 3, label: 'Journalist + Media Producer generate all content', sub: 'Article, podcast, YouTube, social in parallel' },
            { gate: null, label: 'Validator quality-controls everything', sub: 'Scoring against SIGNAL editorial standards' },
            { gate: null, label: 'You review at Gate 3 and publish', sub: 'One click to distribute everywhere' },
          ].map((step, i) => (
            <div key={i} className="flex gap-3">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-mono flex-shrink-0 mt-0.5 ${step.gate ? 'bg-amber-500/20 text-amber-400' : 'bg-zinc-800 text-zinc-600'}`}>
                {step.gate ? step.gate : '·'}
              </div>
              <div>
                <p className="text-zinc-300 text-sm font-mono">{step.label}</p>
                <p className="text-zinc-600 text-xs">{step.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
