import { FounderCard } from '@/components/public/FounderCard';

export const revalidate = 60;
export const metadata = { title: 'Founder Directory' };

async function getFounders(industry?: string) {
  try {
    const params = new URLSearchParams({ status: 'featured' });
    if (industry) params.set('industry', industry);
    const res = await fetch(`${process.env.ADMIN_SITE_URL || 'http://localhost:3000'}/api/cms/founders?${params}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export default async function FoundersPage({ searchParams }: { searchParams: { industry?: string } }) {
  const founders = await getFounders(searchParams.industry);

  const FILTERS = [
    { value: '', label: 'All Sectors' },
    { value: 'healthcare', label: 'Healthcare' },
    { value: 'oil_gas', label: 'Oil & Gas / Energy' },
    { value: 'construction', label: 'Construction' },
  ];

  return (
      
      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="mb-10">
          <p className="text-amber-600 font-mono text-sm uppercase tracking-wider mb-2">Founder Directory</p>
          <h1 className="font-display text-5xl text-stone-900">The operators SIGNAL covers.</h1>
        </div>

        {/* Filter */}
        <div className="flex gap-2 mb-8">
          {FILTERS.map(f => (
            <a
              key={f.value}
              href={f.value ? `?industry=${f.value}` : '/founders'}
              className={`px-4 py-1.5 rounded border text-sm font-sans transition-colors ${
                (searchParams.industry || '') === f.value
                  ? 'border-amber-600 text-amber-700 bg-amber-50'
                  : 'border-stone-200 text-stone-600 hover:border-stone-300'
              }`}
            >
              {f.label}
            </a>
          ))}
        </div>

        {founders.length === 0 ? (
          <div className="text-center py-20 text-stone-400">
            <p className="font-display text-2xl mb-2">No founders yet.</p>
            <p className="text-sm">Check back soon — our editors are working on new profiles.</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-6">
            {founders.map((f: any) => <FounderCard key={f.id} founder={f} />)}
          </div>
        )}
      </main>
      
  );
}
