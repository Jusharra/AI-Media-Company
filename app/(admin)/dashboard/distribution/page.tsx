'use client';

import { motion } from 'framer-motion';
import useSWR from 'swr';
import { MetricsCard } from '@/components/admin/MetricsCard';

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface DistributionLog {
  id: string;
  entity_id: string;
  task_id: string;
  platform: string;
  status: string;
  post_url?: string;
  error_message?: string;
  created_at: string;
}

const PLATFORM_STYLES: Record<string, { icon: string; color: string }> = {
  linkedin: { icon: 'in', color: 'text-blue-400 bg-blue-950 border-blue-900' },
  twitter: { icon: 'X', color: 'text-zinc-300 bg-zinc-800 border-zinc-700' },
  youtube: { icon: '▶', color: 'text-red-400 bg-red-950 border-red-900' },
  website: { icon: '🌐', color: 'text-emerald-400 bg-emerald-950 border-emerald-900' },
};

export default function DistributionPage() {
  const { data: logs = [] } = useSWR<DistributionLog[]>('/api/signal/status?view=distribution', fetcher, { refreshInterval: 10000 });

  const successCount = logs.filter(l => l.status === 'published').length;
  const failedCount = logs.filter(l => l.status === 'failed').length;
  const platformCounts = logs.reduce((acc, l) => ({ ...acc, [l.platform]: (acc[l.platform] || 0) + 1 }), {} as Record<string, number>);

  return (
    <div className="space-y-6">
      <div>
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-heading text-4xl text-zinc-100"
        >
          DISTRIBUTION
        </motion.h1>
        <p className="text-zinc-500 font-mono text-sm mt-1">
          Track published content across all platforms.
        </p>
      </div>

      {/* Platform Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <MetricsCard label="Total Published" value={successCount} accent index={0} />
        <MetricsCard label="LinkedIn Posts" value={platformCounts.linkedin || 0} index={1} />
        <MetricsCard label="Twitter/X Threads" value={platformCounts.twitter || 0} index={2} />
        <MetricsCard label="YouTube Videos" value={platformCounts.youtube || 0} index={3} />
      </div>

      {/* Log Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-zinc-800">
          <h2 className="text-zinc-300 font-mono text-sm uppercase tracking-wider">Distribution Log</h2>
        </div>

        {logs.length === 0 ? (
          <div className="text-zinc-700 text-sm font-mono text-center py-16">
            No distributions yet. Content will appear here after Gate 3 approval.
          </div>
        ) : (
          <div className="divide-y divide-zinc-800">
            {logs.map((log, i) => {
              const platform = PLATFORM_STYLES[log.platform] || { icon: '?', color: 'text-zinc-400 bg-zinc-800 border-zinc-700' };
              return (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                  className="flex items-center gap-4 px-4 py-3"
                >
                  <span className={`text-xs font-mono px-1.5 py-0.5 rounded border ${platform.color}`}>
                    {platform.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-zinc-300 text-sm font-mono truncate">{log.entity_id.slice(0, 12)}</p>
                    <p className="text-zinc-600 text-xs font-mono">{new Date(log.created_at).toLocaleString()}</p>
                  </div>
                  <span className={`text-xs font-mono ${log.status === 'published' ? 'text-emerald-400' : log.status === 'failed' ? 'text-red-400' : 'text-zinc-500'}`}>
                    {log.status.toUpperCase()}
                  </span>
                  {log.post_url && (
                    <a
                      href={log.post_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-zinc-600 hover:text-zinc-300 text-xs font-mono transition-colors"
                    >
                      View →
                    </a>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
