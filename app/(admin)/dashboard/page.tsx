'use client';

import { motion } from 'framer-motion';
import useSWR from 'swr';
import { MetricsCard } from '@/components/admin/MetricsCard';
import { AgentCard } from '@/components/admin/AgentCard';
import { MessageStream } from '@/components/admin/MessageStream';
import { GateApprovalModal } from '@/components/admin/GateApprovalModal';
import { useState } from 'react';
import type { GateNumber, GateDecision, PipelineStatusResponse } from '@signal/lib/types';

const fetcher = (url: string) => fetch(url).then(r => r.json());

const AGENTS = [
  { name: 'signal-scout', displayName: 'Signal Scout', description: 'Researches and qualifies founder candidates using web intelligence and scoring criteria.' },
  { name: 'interview-engine', displayName: 'Interview Engine', description: 'Generates targeted interview questions and parses voice/transcript recordings.' },
  { name: 'backgrounder', displayName: 'Backgrounder', description: 'Synthesizes all research into a comprehensive founder intelligence brief.' },
  { name: 'journalist', displayName: 'Journalist', description: 'Writes feature articles, spotlights, and thought leadership content.' },
  { name: 'media-producer', displayName: 'Media Producer', description: 'Produces podcast scripts, YouTube content, and social media packages.' },
  { name: 'validator', displayName: 'Validator', description: 'Quality-controls all content against SIGNAL editorial standards.' },
  { name: 'distributor', displayName: 'Distributor', description: 'Publishes approved content to LinkedIn, Twitter, YouTube, and the website.' },
  { name: 'lead', displayName: 'Lead Orchestrator', description: 'Coordinates the entire pipeline and manages human gate decisions.' },
];

interface GatePending {
  taskId: string;
  gate: GateNumber;
  entityName: string;
}

export default function DashboardPage() {
  const { data: status, mutate } = useSWR<PipelineStatusResponse>('/api/signal/status', fetcher, { refreshInterval: 5000 });
  const { data: rawPipelines } = useSWR('/api/signal/status?view=active', fetcher, { refreshInterval: 5000 });
  const activePipelines: Array<{ currentStage: string }> = Array.isArray(rawPipelines) ? rawPipelines : [];
  const activeStages = new Set(activePipelines.map(p => p.currentStage));
  const [activeGate, setActiveGate] = useState<GatePending | null>(null);

  const handleDecision = async (taskId: string, gate: GateNumber, decision: GateDecision, notes?: string) => {
    await fetch('/api/signal/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskId, gate, decision, notes }),
    });
    mutate();
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-heading text-4xl text-zinc-100"
        >
          COMMAND CENTER
        </motion.h1>
        <p className="text-zinc-500 font-mono text-sm mt-1">SIGNAL Authority Engine — Real-time pipeline oversight</p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <MetricsCard label="Active Pipelines" value={status?.activePipelines ?? 0} accent index={0} />
        <MetricsCard label="Pending Gates" value={status?.pendingGates?.length ?? 0} sublabel="Awaiting your decision" index={1} />
        <MetricsCard label="High Confidence" value={status?.highConfidenceItems ?? 0} sublabel="Ready to approve" index={2} />
        <MetricsCard label="Published (7d)" value={status?.recentlyPublished ?? 0} index={3} />
      </div>

      {/* Pending Gates Alert */}
      {status?.pendingGates && status.pendingGates.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-amber-950/50 border border-amber-800 rounded-lg p-4"
        >
          <p className="text-amber-400 font-mono text-sm font-medium mb-3">
            ⚡ {status.pendingGates.length} gate{status.pendingGates.length > 1 ? 's' : ''} awaiting your decision
          </p>
          <div className="flex flex-wrap gap-2">
            {status.pendingGates.map((g) => (
              <button
                key={`${g.taskId}-${g.gate}`}
                onClick={() => setActiveGate(g)}
                className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-mono text-xs px-3 py-1.5 rounded transition-colors"
              >
                {g.entityName} — Gate {g.gate} →
              </button>
            ))}
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-3 gap-8">
        {/* Agent Grid */}
        <div className="col-span-2">
          <h2 className="text-zinc-400 font-mono text-xs uppercase tracking-wider mb-4">Agent Status</h2>
          <div className="grid grid-cols-2 gap-3">
            {AGENTS.map((agent, i) => (
              <AgentCard
                key={agent.name}
                name={agent.name}
                displayName={agent.displayName}
                description={agent.description}
                status={activeStages.has(agent.name) ? 'active' : 'idle'}
                index={i}
              />
            ))}
          </div>
        </div>

        {/* Message Stream */}
        <div>
          <h2 className="text-zinc-400 font-mono text-xs uppercase tracking-wider mb-4">Message Bus</h2>
          <MessageStream />
        </div>
      </div>

      {/* Gate Modal */}
      {activeGate && (
        <GateApprovalModal
          isOpen={!!activeGate}
          onClose={() => setActiveGate(null)}
          taskId={activeGate.taskId}
          gate={activeGate.gate}
          entityName={activeGate.entityName}
          onDecision={handleDecision}
        />
      )}
    </div>
  );
}
