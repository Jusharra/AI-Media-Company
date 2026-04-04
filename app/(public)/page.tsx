import Link from 'next/link';
import { FounderCard } from '@/components/public/FounderCard';
import { ArticleCard } from '@/components/public/ArticleCard';

// ISR — revalidate every 60 seconds
export const revalidate = 60;

async function getFeaturedFounders() {
  try {
    const res = await fetch(`${process.env.ADMIN_SITE_URL || 'http://localhost:3000'}/api/cms/founders?status=featured`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

async function getRecentArticles() {
  try {
    const res = await fetch(`${process.env.ADMIN_SITE_URL || 'http://localhost:3000'}/api/cms/articles?status=approved`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const [founders, articles] = await Promise.all([getFeaturedFounders(), getRecentArticles()]);

  return (
    <main>
        {/* Hero */}
        <section className="max-w-6xl mx-auto px-6 pt-20 pb-16">
          <div className="max-w-3xl">
            <p className="text-amber-600 font-mono text-sm uppercase tracking-wider mb-4">The Authority Engine</p>
            <h1 className="font-display text-6xl text-stone-900 leading-tight mb-6">
              The operators building tomorrow's industries—uncovered.
            </h1>
            <p className="text-stone-600 text-xl leading-relaxed mb-8 max-w-2xl">
              SIGNAL covers the founders, operators, and innovators building the next generation of healthcare, energy, and construction companies. Before the mainstream catches on.
            </p>
            <div className="flex gap-4">
              <Link href="/founders" className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded font-sans text-sm transition-colors">
                Browse Founders
              </Link>
              <Link href="/get-featured" className="border border-stone-300 hover:border-stone-400 text-stone-700 px-6 py-3 rounded font-sans text-sm transition-colors">
                Get Featured
              </Link>
            </div>
          </div>
        </section>

        {/* Sector Bars */}
        <section className="border-y border-stone-200 bg-stone-100">
          <div className="max-w-6xl mx-auto px-6 py-6 grid grid-cols-3 divide-x divide-stone-200">
            {[
              { href: '/sectors/healthcare', label: 'Healthcare', sub: 'Clinicians building the infrastructure of care' },
              { href: '/sectors/oil-gas', label: 'Oil & Gas / Energy', sub: 'Operators navigating the energy transition' },
              { href: '/sectors/construction', label: 'Construction', sub: 'Builders building better ways to build' },
            ].map(s => (
              <Link key={s.href} href={s.href} className="px-6 first:pl-0 last:pr-0 group">
                <p className="text-amber-700 font-mono text-xs uppercase tracking-wider mb-1 group-hover:text-amber-600 transition-colors">{s.label}</p>
                <p className="text-stone-600 text-sm">{s.sub}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* Featured Founders */}
        {founders.length > 0 && (
          <section className="max-w-6xl mx-auto px-6 py-16">
            <div className="flex items-baseline justify-between mb-8">
              <h2 className="font-display text-3xl text-stone-900">Featured Founders</h2>
              <Link href="/founders" className="text-amber-600 hover:text-amber-700 text-sm font-sans transition-colors">All founders →</Link>
            </div>
            <div className="grid grid-cols-3 gap-6">
              {founders.slice(0, 6).map((f: any) => (
                <FounderCard key={f.id} founder={f} />
              ))}
            </div>
          </section>
        )}

        {/* Recent Articles */}
        {articles.length > 0 && (
          <section className="max-w-6xl mx-auto px-6 py-16 border-t border-stone-200">
            <div className="flex items-baseline justify-between mb-8">
              <h2 className="font-display text-3xl text-stone-900">Latest Coverage</h2>
              <Link href="/articles" className="text-amber-600 hover:text-amber-700 text-sm font-sans transition-colors">All articles →</Link>
            </div>
            <div className="grid grid-cols-3 gap-6">
              {articles.slice(0, 6).map((a: any) => (
                <ArticleCard key={a.id} article={a} />
              ))}
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="bg-stone-900 py-20 mt-16">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <p className="text-amber-400 font-mono text-sm uppercase tracking-wider mb-4">Are you building something significant?</p>
            <h2 className="font-display text-4xl text-white mb-4">Your story deserves to be told.</h2>
            <p className="text-stone-400 text-lg mb-8">
              SIGNAL features operators with real credentials, measurable impact, and a story worth telling. If that's you, let's talk.
            </p>
            <Link href="/get-featured" className="bg-amber-500 hover:bg-amber-400 text-stone-950 px-8 py-3 rounded font-sans text-sm transition-colors">
              Apply to Get Featured
            </Link>
          </div>
        </section>
    </main>
  );
}
