'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { GateNumber, GateDecision } from '@signal/lib/types';

interface GateApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskId: string;
  gate: GateNumber;
  entityName: string;
  onDecision: (taskId: string, gate: GateNumber, decision: GateDecision, notes?: string) => Promise<void>;
}

const GATE_DESCRIPTIONS: Record<GateNumber, { title: string; description: string; approveLabel: string }> = {
  1: {
    title: 'Gate 1 — Feature Selection',
    description: 'Signal Scout has completed research. Review the entity profile and decide if this founder meets SIGNAL\'s coverage standards.',
    approveLabel: 'Approve → Begin Interview',
  },
  2: {
    title: 'Gate 2 — Backgrounder Approval',
    description: 'The Backgrounder synthesis is ready. Review the founder intelligence brief before authorizing content production.',
    approveLabel: 'Approve → Generate Content',
  },
  3: {
    title: 'Gate 3 — Publishing Gate',
    description: 'Content has been produced and validated. Review drafts before authorizing distribution to all platforms.',
    approveLabel: 'Approve → Publish Content',
  },
  4: {
    title: 'Gate 4 — Monetization Flag',
    description: 'This founder has been featured. Flag them for monetization outreach to offer premium SIGNAL packages.',
    approveLabel: 'Flag for Monetization',
  },
};

export function GateApprovalModal({ isOpen, onClose, taskId, gate, entityName, onDecision }: GateApprovalModalProps) {
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const gateInfo = GATE_DESCRIPTIONS[gate];

  const handleDecision = async (decision: GateDecision) => {
    setLoading(true);
    try {
      await onDecision(taskId, gate, decision, notes || undefined);
      onClose();
      setNotes('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="bg-zinc-900 border border-zinc-700 rounded-lg p-6 w-full max-w-md mx-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="mb-5">
              <span className="text-amber-500 text-xs font-mono uppercase tracking-wider">Human Review Required</span>
              <h2 className="text-zinc-100 font-heading text-2xl mt-1">{gateInfo.title}</h2>
              <p className="text-zinc-400 text-sm mt-1 font-mono">{entityName}</p>
            </div>

            <p className="text-zinc-400 text-sm mb-5 leading-relaxed">{gateInfo.description}</p>

            <div className="mb-5">
              <label className="text-zinc-500 text-xs font-mono uppercase tracking-wider block mb-1.5">
                Notes (optional)
              </label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={3}
                placeholder="Add decision notes or revision instructions..."
                className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 rounded px-3 py-2 text-sm font-mono resize-none focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => handleDecision('approved')}
                disabled={loading}
                className="flex-1 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-heading text-sm py-2.5 rounded transition-colors disabled:opacity-50"
              >
                {loading ? '...' : gateInfo.approveLabel}
              </button>
              <button
                onClick={() => handleDecision('revision')}
                disabled={loading}
                className="px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-mono py-2.5 rounded transition-colors disabled:opacity-50"
              >
                Revise
              </button>
              <button
                onClick={() => handleDecision('rejected')}
                disabled={loading}
                className="px-4 bg-red-950 hover:bg-red-900 text-red-400 text-sm font-mono py-2.5 rounded border border-red-900 transition-colors disabled:opacity-50"
              >
                Reject
              </button>
            </div>

            <button
              onClick={onClose}
              className="w-full text-zinc-600 text-xs font-mono mt-3 hover:text-zinc-400 transition-colors"
            >
              Cancel
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
