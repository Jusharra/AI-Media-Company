'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import useSWR from 'swr';
import { ContentDraftPanel } from '@/components/admin/ContentDraftPanel';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function ContentPage() {
  const [activeTab, setActiveTab] = useState<'articles' | 'media'>('articles');
  const [statusFilter, setStatusFilter] = useState('draft');

  const { data: rawArticles, mutate: mutateArticles } = useSWR(
    `/api/cms/articles?status=${statusFilter}`,
    fetcher,
    { refreshInterval: 8000 }
  );
  const articles = Array.isArray(rawArticles) ? rawArticles : [];

  const handleApprove = async (id: string) => {
    await fetch('/api/cms/articles', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: 'approved' }),
    });
    mutateArticles();
  };

  const handleReject = async (id: string) => {
    await fetch('/api/cms/articles', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: 'rejected' }),
    });
    mutateArticles();
  };

  return (
    <div className="space-y-6">
      <div>
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-heading text-4xl text-zinc-100"
        >
          CONTENT DRAFTS
        </motion.h1>
        <p className="text-zinc-500 font-mono text-sm mt-1">
          Review, approve, or reject content produced by the Journalist and Media Producer agents.
        </p>
      </div>

      {/* Tabs + Filter */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1 bg-zinc-900 border border-zinc-800 rounded-lg p-1">
          {(['articles', 'media'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded text-xs font-mono uppercase tracking-wider transition-colors ${
                activeTab === tab
                  ? 'bg-amber-500 text-zinc-950'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          {(['draft', 'approved', 'all'] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1 text-xs font-mono uppercase tracking-wider rounded border transition-colors ${
                statusFilter === s
                  ? 'border-zinc-500 text-zinc-300 bg-zinc-800'
                  : 'border-zinc-800 text-zinc-600 hover:border-zinc-700'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <ContentDraftPanel
        items={articles}
        onApprove={statusFilter === 'draft' ? handleApprove : undefined}
        onReject={statusFilter === 'draft' ? handleReject : undefined}
      />
    </div>
  );
}
