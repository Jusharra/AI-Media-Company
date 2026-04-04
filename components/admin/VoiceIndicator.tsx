'use client';

import { motion } from 'framer-motion';

interface VoiceIndicatorProps {
  active?: boolean;
  label?: string;
}

export function VoiceIndicator({ active = false, label = 'SIGNAL Assistant' }: VoiceIndicatorProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="relative w-6 h-6 flex items-center justify-center">
        {active ? (
          <>
            <motion.div
              className="absolute inset-0 rounded-full bg-amber-500/20"
              animate={{ scale: [1, 1.8, 1], opacity: [0.6, 0, 0.6] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            />
            <div className="w-3 h-3 rounded-full bg-amber-500" />
          </>
        ) : (
          <div className="w-3 h-3 rounded-full bg-zinc-700" />
        )}
      </div>
      <span className={`text-xs font-mono ${active ? 'text-amber-400' : 'text-zinc-600'}`}>
        {label}
      </span>
      <span className={`text-xs font-mono ${active ? 'text-amber-500 animate-pulse' : 'text-zinc-700'}`}>
        {active ? '● LIVE' : '○ STANDBY'}
      </span>
    </div>
  );
}
