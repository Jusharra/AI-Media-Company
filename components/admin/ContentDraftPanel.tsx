'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

interface ContentItem {
  id: string;
  doc_type: string;
  content: string;
  word_count?: number;
  validation_score?: number;
  status: string;
  entity_id: string;
}

interface ContentDraftPanelProps {
  items: ContentItem[];
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
}

const DOC_TYPE_LABELS: Record<string, string> = {
  'feature-article': 'Feature Article',
  'spotlight': 'Operator Spotlight',
  'thought-leadership': 'Thought Leadership',
  'podcast-script': 'Podcast Script',
  'youtube-script': 'YouTube Script',
  'social-package': 'Social Package',
  'shorts-script': 'Shorts Script',
};

function ScoreBadge({ score }: { score?: number }) {
  if (!score) return null;
  const color = score >= 90 ? 'text-emerald-400 bg-emerald-950' : score >= 70 ? 'text-amber-400 bg-amber-950' : 'text-red-400 bg-red-950';
  return (
    <span className={`text-xs font-mono px-1.5 py-0.5 rounded ${color}`}>{score}/100</span>
  );
}

export function ContentDraftPanel({ items, onApprove, onReject }: ContentDraftPanelProps) {
  const [selected, setSelected] = useState<ContentItem | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (items.length === 0) {
    return (
      <div className="text-zinc-700 text-sm font-mono text-center py-12">
        No content drafts available
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.03 }}
          className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden"
        >
          <div
            className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-zinc-800/50 transition-colors"
            onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
          >
            <div className="flex items-center gap-3">
              <span className={`w-2 h-2 rounded-full ${item.status === 'approved' ? 'bg-emerald-500' : item.status === 'rejected' ? 'bg-red-500' : 'bg-amber-400'}`} />
              <span className="text-zinc-300 text-sm font-mono">{DOC_TYPE_LABELS[item.doc_type] || item.doc_type}</span>
              {item.word_count && <span className="text-zinc-600 text-xs font-mono">{item.word_count} words</span>}
            </div>
            <div className="flex items-center gap-2">
              <ScoreBadge score={item.validation_score} />
              <span className="text-zinc-600 text-xs">{expandedId === item.id ? '▲' : '▼'}</span>
            </div>
          </div>

          {expandedId === item.id && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-zinc-800"
            >
              <div className="p-4">
                <pre className="text-zinc-400 text-xs font-mono whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto">
                  {item.content?.slice(0, 2000)}{item.content?.length > 2000 ? '\n\n[... truncated]' : ''}
                </pre>
                {item.status === 'draft' && (onApprove || onReject) && (
                  <div className="flex gap-2 mt-4">
                    {onApprove && (
                      <button
                        onClick={() => onApprove(item.id)}
                        className="px-4 py-1.5 bg-emerald-900 hover:bg-emerald-800 text-emerald-400 text-xs font-mono rounded border border-emerald-800 transition-colors"
                      >
                        Mark Approved
                      </button>
                    )}
                    {onReject && (
                      <button
                        onClick={() => onReject(item.id)}
                        className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-500 text-xs font-mono rounded transition-colors"
                      >
                        Mark Rejected
                      </button>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </motion.div>
      ))}
    </div>
  );
}
