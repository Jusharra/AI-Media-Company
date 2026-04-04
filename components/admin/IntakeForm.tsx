'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { SectorBadge } from './SectorBadge';
import type { Industry } from '@signal/lib/types';

interface IntakeFormProps {
  onSuccess?: (taskId: string) => void;
}

const INDUSTRIES: { value: Industry; label: string }[] = [
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'oil_gas', label: 'Oil & Gas / Energy' },
  { value: 'construction', label: 'Construction' },
  { value: 'other', label: 'Other' },
];

export function IntakeForm({ onSuccess }: IntakeFormProps) {
  const [form, setForm] = useState({
    name: '',
    company: '',
    title: '',
    industry: 'healthcare' as Industry,
    website: '',
    linkedinUrl: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await fetch('/api/signal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, source: 'manual' }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to start pipeline');
        return;
      }

      setSuccess(`Pipeline started. Task ID: ${data.taskId.slice(0, 8).toUpperCase()}`);
      setForm({ name: '', company: '', title: '', industry: 'healthcare', website: '', linkedinUrl: '', notes: '' });
      onSuccess?.(data.taskId);
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-950 border border-red-800 text-red-400 rounded px-3 py-2 text-sm font-mono">{error}</div>
      )}
      {success && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-emerald-950 border border-emerald-800 text-emerald-400 rounded px-3 py-2 text-sm font-mono"
        >
          ✓ {success}
        </motion.div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-zinc-400 text-xs font-mono uppercase tracking-wider block mb-1">Full Name *</label>
          <input
            type="text"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            required
            className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 rounded px-3 py-2 text-sm font-mono focus:outline-none focus:border-amber-500 transition-colors"
          />
        </div>
        <div>
          <label className="text-zinc-400 text-xs font-mono uppercase tracking-wider block mb-1">Company *</label>
          <input
            type="text"
            value={form.company}
            onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
            required
            className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 rounded px-3 py-2 text-sm font-mono focus:outline-none focus:border-amber-500 transition-colors"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-zinc-400 text-xs font-mono uppercase tracking-wider block mb-1">Title</label>
          <input
            type="text"
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 rounded px-3 py-2 text-sm font-mono focus:outline-none focus:border-amber-500 transition-colors"
          />
        </div>
        <div>
          <label className="text-zinc-400 text-xs font-mono uppercase tracking-wider block mb-1">Industry *</label>
          <select
            value={form.industry}
            onChange={e => setForm(f => ({ ...f, industry: e.target.value as Industry }))}
            className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 rounded px-3 py-2 text-sm font-mono focus:outline-none focus:border-amber-500 transition-colors"
          >
            {INDUSTRIES.map(ind => (
              <option key={ind.value} value={ind.value}>{ind.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-zinc-500 text-xs font-mono">Selected:</span>
        <SectorBadge industry={form.industry} size="xs" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-zinc-400 text-xs font-mono uppercase tracking-wider block mb-1">Website</label>
          <input
            type="url"
            value={form.website}
            onChange={e => setForm(f => ({ ...f, website: e.target.value }))}
            placeholder="https://"
            className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 rounded px-3 py-2 text-sm font-mono focus:outline-none focus:border-amber-500 transition-colors"
          />
        </div>
        <div>
          <label className="text-zinc-400 text-xs font-mono uppercase tracking-wider block mb-1">LinkedIn URL</label>
          <input
            type="url"
            value={form.linkedinUrl}
            onChange={e => setForm(f => ({ ...f, linkedinUrl: e.target.value }))}
            placeholder="https://linkedin.com/in/"
            className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 rounded px-3 py-2 text-sm font-mono focus:outline-none focus:border-amber-500 transition-colors"
          />
        </div>
      </div>

      <div>
        <label className="text-zinc-400 text-xs font-mono uppercase tracking-wider block mb-1">Notes / Context</label>
        <textarea
          value={form.notes}
          onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
          rows={3}
          placeholder="Why is this founder worth covering? Any specific angles or context..."
          className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 rounded px-3 py-2 text-sm font-mono resize-none focus:outline-none focus:border-amber-500 transition-colors"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-heading text-xl py-3 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'LAUNCHING PIPELINE...' : 'LAUNCH PIPELINE'}
      </button>
    </form>
  );
}
