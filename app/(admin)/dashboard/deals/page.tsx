'use client';

import { motion } from 'framer-motion';
import useSWR from 'swr';
import { DealCard } from '@/components/admin/DealCard';
import { MetricsCard } from '@/components/admin/MetricsCard';
import type { Industry } from '@signal/lib/types';

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface Deal {
  id: string;
  name: string;
  company: string;
  industry: Industry;
  score: number;
  current_stage?: string;
  task_id?: string;
}

const TIERS = [
  { name: 'Authority', min: 90, price: '$2,000+', color: 'text-amber-300' },
  { name: 'Growth', min: 70, price: '$800–$1,500', color: 'text-amber-400' },
  { name: 'Starter', min: 50, price: '$300–$500', color: 'text-zinc-400' },
];

export default function DealsPage() {
  const { data: raw } = useSWR('/api/signal/status?view=deals', fetcher, { refreshInterval: 15000 });
  const deals: Deal[] = Array.isArray(raw) ? raw : [];

  const authorityCount = deals.filter(d => d.score >= 90).length;
  const growthCount = deals.filter(d => d.score >= 70 && d.score < 90).length;
  const starterCount = deals.filter(d => d.score < 70).length;

  const handleContact = (deal: Deal) => {
    // In production: open CRM, trigger email sequence, etc.
    alert(`Initiating outreach for ${deal.name} at ${deal.company}. Recommended tier: ${deal.score >= 90 ? 'Authority' : deal.score >= 70 ? 'Growth' : 'Starter'}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-heading text-4xl text-zinc-100"
        >
          DEAL QUEUE
        </motion.h1>
        <p className="text-zinc-500 font-mono text-sm mt-1">
          Founders flagged for monetization outreach. Ranked by SIGNAL score.
        </p>
      </div>

      {/* Tier Summary */}
      <div className="grid grid-cols-3 gap-4">
        <MetricsCard label="Authority Tier" value={authorityCount} sublabel="$2,000+ package" accent index={0} />
        <MetricsCard label="Growth Tier" value={growthCount} sublabel="$800–$1,500 package" index={1} />
        <MetricsCard label="Starter Tier" value={starterCount} sublabel="$300–$500 package" index={2} />
      </div>

      {/* Tier breakdown */}
      {deals.length === 0 ? (
        <div className="text-zinc-700 text-sm font-mono text-center py-16 border border-zinc-800 rounded-lg">
          No deals in queue yet. Approve Gate 4 on a completed pipeline to flag founders for monetization.
        </div>
      ) : (
        <div className="space-y-8">
          {TIERS.map(tier => {
            const tierDeals = deals.filter(d =>
              tier.min === 90 ? d.score >= 90 :
              tier.min === 70 ? d.score >= 70 && d.score < 90 :
              d.score < 70
            );

            if (tierDeals.length === 0) return null;

            return (
              <div key={tier.name}>
                <div className="flex items-center gap-3 mb-4">
                  <h2 className={`font-heading text-2xl ${tier.color}`}>{tier.name.toUpperCase()}</h2>
                  <span className="text-zinc-600 font-mono text-sm">{tier.price}</span>
                  <span className="text-zinc-700 font-mono text-xs">— {tierDeals.length} prospect{tierDeals.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  {tierDeals.map((deal, i) => (
                    <DealCard key={deal.id} deal={deal} index={i} onContact={handleContact} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Monetization Packages Reference */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
        <h2 className="text-zinc-300 font-mono text-sm uppercase tracking-wider mb-4">SIGNAL Packages</h2>
        <div className="grid grid-cols-3 gap-6">
          {[
            {
              name: 'Starter', price: '$300–$500',
              includes: ['Feature article', 'Social distribution (LinkedIn + X)', 'SIGNAL website publication'],
              for: 'Emerging founder, early-stage company'
            },
            {
              name: 'Growth', price: '$800–$1,500',
              includes: ['Feature article', 'Podcast episode script', 'Full social distribution', 'YouTube script', 'Website spotlight'],
              for: 'Mid-stage founder, Series A–B company'
            },
            {
              name: 'Authority', price: '$2,000+',
              includes: ['Feature article + spotlight + thought leadership', 'Full podcast production', 'YouTube video', 'Full social package', 'Priority placement', 'Distribution report'],
              for: 'Established operator, authority investment'
            }
          ].map(pkg => (
            <div key={pkg.name} className="space-y-2">
              <div className="flex items-baseline gap-2">
                <h3 className="text-amber-400 font-heading text-lg">{pkg.name.toUpperCase()}</h3>
                <span className="text-zinc-500 font-mono text-sm">{pkg.price}</span>
              </div>
              <ul className="space-y-1">
                {pkg.includes.map(item => (
                  <li key={item} className="text-zinc-500 text-xs font-mono flex gap-1.5">
                    <span className="text-amber-500">·</span>{item}
                  </li>
                ))}
              </ul>
              <p className="text-zinc-700 text-xs italic">{pkg.for}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
