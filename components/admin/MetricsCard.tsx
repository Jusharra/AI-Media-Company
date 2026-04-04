'use client';

import { motion } from 'framer-motion';

interface MetricsCardProps {
  label: string;
  value: number | string;
  sublabel?: string;
  accent?: boolean;
  index?: number;
}

export function MetricsCard({ label, value, sublabel, accent = false, index = 0 }: MetricsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`bg-zinc-900 border rounded-lg p-5 ${accent ? 'border-amber-500/50' : 'border-zinc-800'}`}
    >
      <p className="text-zinc-500 text-xs font-mono uppercase tracking-wider mb-2">{label}</p>
      <p className={`font-heading text-4xl ${accent ? 'text-amber-500' : 'text-zinc-100'}`}>{value}</p>
      {sublabel && (
        <p className="text-zinc-600 text-xs font-mono mt-1">{sublabel}</p>
      )}
    </motion.div>
  );
}
