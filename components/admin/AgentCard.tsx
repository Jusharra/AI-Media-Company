'use client';

import { motion } from 'framer-motion';

type AgentStatus = 'idle' | 'active' | 'waiting' | 'error';

interface AgentCardProps {
  name: string;
  displayName: string;
  description: string;
  status: AgentStatus;
  currentTask?: string;
  outputCount?: number;
  index?: number;
}

const STATUS_CONFIG: Record<AgentStatus, { dot: string; label: string; text: string }> = {
  idle: { dot: 'bg-zinc-600', label: 'IDLE', text: 'text-zinc-500' },
  active: { dot: 'bg-amber-400 animate-pulse', label: 'ACTIVE', text: 'text-amber-400' },
  waiting: { dot: 'bg-blue-400', label: 'WAITING', text: 'text-blue-400' },
  error: { dot: 'bg-red-500', label: 'ERROR', text: 'text-red-400' },
};

export function AgentCard({ name, displayName, description, status, currentTask, outputCount = 0, index = 0 }: AgentCardProps) {
  const statusConfig = STATUS_CONFIG[status];

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 hover:border-zinc-700 transition-colors"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-zinc-100 font-mono text-sm font-medium">{displayName}</h3>
          <p className="text-zinc-600 text-xs font-mono mt-0.5">{name}</p>
        </div>
        <div className="flex items-center gap-1.5">
          <div className={`w-2 h-2 rounded-full ${statusConfig.dot}`} />
          <span className={`text-xs font-mono ${statusConfig.text}`}>{statusConfig.label}</span>
        </div>
      </div>

      <p className="text-zinc-500 text-xs mb-3 leading-relaxed">{description}</p>

      {currentTask && (
        <div className="bg-zinc-800 rounded px-2 py-1.5 mb-2">
          <p className="text-zinc-400 text-xs font-mono truncate">{currentTask}</p>
        </div>
      )}

      <div className="flex items-center justify-between">
        <span className="text-zinc-700 text-xs font-mono">{outputCount} outputs</span>
      </div>
    </motion.div>
  );
}
