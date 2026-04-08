'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import useSWR from 'swr';
import { PipelineProgress } from '@/components/admin/PipelineProgress';
import { GateApprovalModal } from '@/components/admin/GateApprovalModal';
import { MessageStream } from '@/components/admin/MessageStream';
import { InterviewPanel } from '@/components/admin/InterviewPanel';
import type { PipelineState, GateNumber, GateDecision } from '@signal/lib/types';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function PipelinePage() {
  const { data: rawPipelines, mutate } = useSWR('/api/signal/status?view=all', fetcher, { refreshInterval: 5000 });
  const allPipelines: PipelineState[] = Array.isArray(rawPipelines) ? rawPipelines : [];
  const pipelines = allPipelines.filter(p => !['rejected', 'complete'].includes(p.currentStage));
  const archivedPipelines = allPipelines.filter(p => ['rejected', 'complete'].includes(p.currentStage));
  const [selected, setSelected] = useState<PipelineState | null>(null);
  const [gateModal, setGateModal] = useState<{ taskId: string; gate: GateNumber; entityName: string } | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(true);

  const handleDecision = async (taskId: string, gate: GateNumber, decision: GateDecision, notes?: string) => {
    await fetch('/api/signal/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskId, gate, decision, notes }),
    });
    mutate();
  };

  const handleAction = async (taskId: string, action: 'stop' | 'restart') => {
    setActionLoading(`${taskId}-${action}`);
    await fetch('/api/signal/pipeline', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskId, action }),
    });
    if (selected?.taskId === taskId) setSelected(null);
    mutate();
    setActionLoading(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-heading text-4xl text-zinc-100"
        >
          PIPELINE
        </motion.h1>
        <p className="text-zinc-500 font-mono text-sm mt-1">
          {pipelines.length} active · {archivedPipelines.length} archived
        </p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Pipeline List */}
        <div className="col-span-2 space-y-3">
          {pipelines.length === 0 && archivedPipelines.length === 0 && (
            <div className="text-zinc-700 text-sm font-mono text-center py-16 border border-zinc-800 rounded-lg">
              No pipelines yet. Start one from the Intake tab.
            </div>
          )}

          {pipelines.map((p, i) => {
            const gateStatus = p.gateStatus || {};
            const hasPendingGate = p.currentStage === 'signal-scout' && !gateStatus[1]
              || p.currentStage === 'backgrounder' && !gateStatus[2]
              || p.currentStage === 'journalist' && !gateStatus[3];

            return (
              <motion.div
                key={p.taskId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`bg-zinc-900 border rounded-lg p-4 cursor-pointer transition-colors ${
                  selected?.taskId === p.taskId ? 'border-amber-500/50' : 'border-zinc-800 hover:border-zinc-700'
                }`}
                onClick={() => setSelected(p)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-zinc-100 font-mono font-medium">{p.entityName}</h3>
                    <p className="text-zinc-600 text-xs font-mono mt-0.5">ID: {p.taskId.slice(0, 8)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {hasPendingGate && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const gate = p.currentStage === 'signal-scout' ? 1
                            : p.currentStage === 'backgrounder' ? 2 : 3;
                          setGateModal({ taskId: p.taskId, gate: gate as GateNumber, entityName: p.entityName });
                        }}
                        className="bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-mono px-2 py-1 rounded transition-colors"
                      >
                        Review Gate →
                      </button>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); handleAction(p.taskId, 'restart'); }}
                      disabled={actionLoading === `${p.taskId}-restart`}
                      className="border border-zinc-700 hover:border-zinc-500 text-zinc-400 hover:text-zinc-200 text-xs font-mono px-2 py-1 rounded transition-colors disabled:opacity-40"
                    >
                      {actionLoading === `${p.taskId}-restart` ? '↺ ...' : '↺ Restart'}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleAction(p.taskId, 'stop'); }}
                      disabled={actionLoading === `${p.taskId}-stop`}
                      className="border border-red-900 hover:border-red-700 text-red-600 hover:text-red-400 text-xs font-mono px-2 py-1 rounded transition-colors disabled:opacity-40"
                    >
                      {actionLoading === `${p.taskId}-stop` ? '■ ...' : '■ Stop'}
                    </button>
                  </div>
                </div>

                <PipelineProgress
                  currentStage={p.currentStage}
                  gateStatus={gateStatus as Record<string, string | null>}
                  entityName=""
                />

                <div className="flex items-center gap-2 mt-3">
                  <span className="text-zinc-700 text-xs font-mono">
                    Started {new Date(p.createdAt).toLocaleDateString()}
                  </span>
                  {p.monetizationFlag && (
                    <span className="text-amber-400 text-xs font-mono">💰 Monetization flagged</span>
                  )}
                </div>
              </motion.div>
            );
          })}

          {/* Archived Pipelines */}
          {archivedPipelines.length > 0 && (
            <div className="mt-6">
              <button
                onClick={() => setShowArchived(v => !v)}
                className="text-zinc-600 hover:text-zinc-400 font-mono text-xs uppercase tracking-wider flex items-center gap-2 mb-3"
              >
                {showArchived ? '▾' : '▸'} Archived ({archivedPipelines.length})
              </button>
              {showArchived && archivedPipelines.map((p, i) => (
                <motion.div
                  key={p.taskId}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className={`bg-zinc-950 border rounded-lg p-4 cursor-pointer transition-colors mb-3 ${
                    selected?.taskId === p.taskId ? 'border-zinc-600' : 'border-zinc-900 hover:border-zinc-800'
                  }`}
                  onClick={() => setSelected(p)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-zinc-500 font-mono font-medium text-sm">{p.entityName}</h3>
                      <p className="text-zinc-700 text-xs font-mono mt-0.5">ID: {p.taskId.slice(0, 8)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-mono px-2 py-0.5 rounded border ${
                        p.currentStage === 'complete'
                          ? 'border-green-900 text-green-600'
                          : 'border-zinc-800 text-zinc-600'
                      }`}>
                        {p.currentStage.toUpperCase()}
                      </span>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleAction(p.taskId, 'restart'); }}
                        disabled={actionLoading === `${p.taskId}-restart`}
                        className="border border-zinc-800 hover:border-zinc-600 text-zinc-600 hover:text-zinc-300 text-xs font-mono px-2 py-1 rounded transition-colors disabled:opacity-40"
                      >
                        {actionLoading === `${p.taskId}-restart` ? '↺ ...' : '↺ Restart'}
                      </button>
                    </div>
                  </div>
                  <p className="text-zinc-700 text-xs font-mono mt-2">
                    {new Date(p.createdAt).toLocaleDateString()} · Gate {Object.keys(p.gateStatus).length} of 4 completed
                  </p>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Detail Panel */}
        <div>
          {selected ? (
            <div className="space-y-4">
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
                <h2 className="text-zinc-300 font-mono text-sm uppercase tracking-wider mb-3">Pipeline Detail</h2>
                <dl className="space-y-2 text-xs font-mono">
                  <div className="flex justify-between">
                    <dt className="text-zinc-600">Entity</dt>
                    <dd className="text-zinc-300">{selected.entityName}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-zinc-600">Stage</dt>
                    <dd className="text-amber-400">{selected.currentStage}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-zinc-600">Task ID</dt>
                    <dd className="text-zinc-500">{selected.taskId.slice(0, 12)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-zinc-600">Created</dt>
                    <dd className="text-zinc-500">{new Date(selected.createdAt).toLocaleString()}</dd>
                  </div>
                </dl>
              </div>

              {selected.currentStage === 'interview-engine' && (
                <InterviewPanel
                  taskId={selected.taskId}
                  onComplete={() => { setSelected(null); mutate(); }}
                />
              )}

              <div>
                <h2 className="text-zinc-400 font-mono text-xs uppercase tracking-wider mb-2">Message Trace</h2>
                <MessageStream taskId={selected.taskId} />
              </div>
            </div>
          ) : (
            <div className="text-zinc-700 text-sm font-mono text-center py-12 border border-zinc-800 rounded-lg">
              Select a pipeline to view details
            </div>
          )}
        </div>
      </div>

      {gateModal && (
        <GateApprovalModal
          isOpen={!!gateModal}
          onClose={() => setGateModal(null)}
          taskId={gateModal.taskId}
          gate={gateModal.gate}
          entityName={gateModal.entityName}
          onDecision={handleDecision}
        />
      )}
    </div>
  );
}
