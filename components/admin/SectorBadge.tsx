import type { Industry } from '@signal/lib/types';

const BADGE_STYLES: Record<Industry, { bg: string; text: string; label: string }> = {
  healthcare: { bg: 'bg-rose-950 border-rose-800', text: 'text-rose-400', label: 'Healthcare' },
  oil_gas: { bg: 'bg-amber-950 border-amber-800', text: 'text-amber-400', label: 'Oil & Gas' },
  construction: { bg: 'bg-orange-950 border-orange-800', text: 'text-orange-400', label: 'Construction' },
  other: { bg: 'bg-zinc-800 border-zinc-700', text: 'text-zinc-400', label: 'Other' },
};

export function SectorBadge({ industry, size = 'sm' }: { industry: Industry; size?: 'xs' | 'sm' | 'md' }) {
  const style = BADGE_STYLES[industry] || BADGE_STYLES.other;
  const sizeClass = size === 'xs' ? 'text-xs px-1.5 py-0.5' : size === 'md' ? 'text-sm px-3 py-1' : 'text-xs px-2 py-0.5';

  return (
    <span className={`inline-flex items-center border rounded font-mono uppercase tracking-wider ${style.bg} ${style.text} ${sizeClass}`}>
      {style.label}
    </span>
  );
}
