'use client';

import { motion } from 'framer-motion';
import { SectorBadge } from './SectorBadge';
import type { Industry } from '@signal/lib/types';

interface Deal {
  id: string;
  name: string;
  company: string;
  industry: Industry;
  score: number;
  current_stage?: string;
  task_id?: string;
}

interface DealCardProps {
  deal: Deal;
  index?: number;
  onContact?: (deal: Deal) => void;
}

const MONETIZATION_TIERS = [
  { name: 'Starter', minScore: 50, price: '$300–$500', color: 'text-zinc-400' },
  { name: 'Growth', minScore: 70, price: '$800–$1,500', color: 'text-amber-400' },
  { name: 'Authority', minScore: 90, price: '$2,000+', color: 'text-amber-300' },
];

function getTier(score: number) {
  return [...MONETIZATION_TIERS].reverse().find(t => score >= t.minScore) || MONETIZATION_TIERS[0];
}

export function DealCard({ deal, index = 0, onContact }: DealCardProps) {
  const tier = getTier(deal.score);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-zinc-900 border border-zinc-800 hover:border-amber-500/30 rounded-lg p-4 transition-colors"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-zinc-100 font-mono text-sm font-medium">{deal.name}</h3>
          <p className="text-zinc-500 text-xs font-mono mt-0.5">{deal.company}</p>
        </div>
        <div className="text-right">
          <div className="text-amber-400 font-heading text-2xl">{deal.score}</div>
          <div className="text-zinc-700 text-xs font-mono">score</div>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <SectorBadge industry={deal.industry} size="xs" />
        <span className={`text-xs font-mono ${tier.color}`}>{tier.name}</span>
        <span className="text-zinc-600 text-xs font-mono">{tier.price}</span>
      </div>

      {deal.current_stage && (
        <p className="text-zinc-700 text-xs font-mono mb-3">Stage: {deal.current_stage}</p>
      )}

      {onContact && (
        <button
          onClick={() => onContact(deal)}
          className="w-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-xs font-mono py-1.5 rounded border border-amber-500/30 transition-colors"
        >
          Initiate Outreach →
        </button>
      )}
    </motion.div>
  );
}
