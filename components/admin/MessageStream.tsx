'use client';

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useSWR from 'swr';

interface Message {
  id: string;
  from_agent: string;
  to_agent: string;
  message_type: string;
  payload: string;
  created_at: string;
}

const AGENT_COLORS: Record<string, string> = {
  lead: 'text-amber-400',
  'signal-scout': 'text-emerald-400',
  'interview-engine': 'text-blue-400',
  backgrounder: 'text-purple-400',
  journalist: 'text-rose-400',
  'media-producer': 'text-orange-400',
  validator: 'text-cyan-400',
  distributor: 'text-teal-400',
};

const fetcher = (url: string) => fetch(url).then(r => r.json());

export function MessageStream({ taskId }: { taskId?: string }) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const url = taskId ? `/api/signal/messages?taskId=${taskId}` : '/api/signal/messages';
  const { data: messages = [] } = useSWR<Message[]>(url, fetcher, { refreshInterval: 3000 });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-lg h-64 overflow-y-auto font-mono text-xs p-3">
      <div className="text-zinc-700 mb-2">▸ SIGNAL Message Bus {taskId ? `[${taskId.slice(0, 8)}]` : '[ALL]'}</div>

      <AnimatePresence initial={false}>
        {messages.map((msg) => {
          const fromColor = AGENT_COLORS[msg.from_agent] || 'text-zinc-400';
          const toColor = AGENT_COLORS[msg.to_agent] || 'text-zinc-400';
          const time = new Date(msg.created_at).toLocaleTimeString('en-US', { hour12: false });

          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex gap-2 mb-1 leading-relaxed"
            >
              <span className="text-zinc-700 shrink-0">{time}</span>
              <span className={`shrink-0 ${fromColor}`}>{msg.from_agent}</span>
              <span className="text-zinc-700">→</span>
              <span className={`shrink-0 ${toColor}`}>{msg.to_agent}</span>
              <span className="text-zinc-600 shrink-0">[{msg.message_type}]</span>
              <span className="text-zinc-500 truncate">
                {(() => {
                  try {
                    const p = JSON.parse(msg.payload);
                    if (p.summary) return p.summary;
                    if (p.gate !== undefined) return `Gate ${p.gate}`;
                    return JSON.stringify(p).slice(0, 60);
                  } catch {
                    return msg.payload?.slice(0, 60);
                  }
                })()}
              </span>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {messages.length === 0 && (
        <div className="text-zinc-800 text-center mt-8">No messages yet — start a pipeline to see activity</div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
