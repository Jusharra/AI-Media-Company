import Link from 'next/link';

interface Founder {
  id: string;
  name: string;
  company: string;
  title?: string;
  industry: string;
  hook?: string;
  score?: number;
}

const INDUSTRY_LABELS: Record<string, string> = {
  healthcare: 'Healthcare',
  oil_gas: 'Oil & Gas',
  construction: 'Construction',
  other: 'Other',
};

const INDUSTRY_COLORS: Record<string, string> = {
  healthcare: 'text-rose-700 bg-rose-50 border-rose-200',
  oil_gas: 'text-amber-700 bg-amber-50 border-amber-200',
  construction: 'text-orange-700 bg-orange-50 border-orange-200',
  other: 'text-stone-600 bg-stone-100 border-stone-200',
};

export function FounderCard({ founder }: { founder: Founder }) {
  const color = INDUSTRY_COLORS[founder.industry] || INDUSTRY_COLORS.other;

  return (
    <Link href={`/founders/${founder.id}`} className="block group">
      <div className="bg-white border border-stone-200 rounded-lg p-5 hover:border-stone-300 hover:shadow-sm transition-all">
        <div className="flex items-start justify-between mb-3">
          <div className="w-10 h-10 rounded-full bg-stone-200 flex items-center justify-center text-stone-600 font-display text-lg">
            {founder.name.charAt(0)}
          </div>
          <span className={`text-xs font-mono px-1.5 py-0.5 rounded border ${color}`}>
            {INDUSTRY_LABELS[founder.industry] || founder.industry}
          </span>
        </div>

        <h3 className="font-display text-stone-900 group-hover:text-amber-700 transition-colors">
          {founder.name}
        </h3>
        <p className="text-stone-600 text-sm mt-0.5">
          {founder.title ? `${founder.title}, ` : ''}{founder.company}
        </p>

        {founder.hook && (
          <p className="text-stone-500 text-sm mt-3 leading-relaxed line-clamp-2">{founder.hook}</p>
        )}

        <p className="text-amber-600 text-sm font-sans mt-4 group-hover:text-amber-700 transition-colors">
          Read profile →
        </p>
      </div>
    </Link>
  );
}
