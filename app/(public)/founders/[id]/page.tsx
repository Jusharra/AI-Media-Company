import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

const ADMIN = process.env.ADMIN_SITE_URL || 'http://localhost:3000';

async function getFounder(id: string) {
  try {
    const res = await fetch(`${ADMIN}/api/cms/founders?status=featured`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    const all = await res.json();
    return all.find((f: any) => f.id === id) || null;
  } catch {
    return null;
  }
}

async function getFounderArticles(entityId: string) {
  try {
    const res = await fetch(`${ADMIN}/api/cms/articles?entityId=${entityId}&status=approved`, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

const INDUSTRY_LABELS: Record<string, string> = {
  healthcare: 'Healthcare', oil_gas: 'Oil & Gas', construction: 'Construction', other: 'Other',
};

export default async function FounderProfilePage({ params }: { params: { id: string } }) {
  const [founder, articles] = await Promise.all([getFounder(params.id), getFounderArticles(params.id)]);

  if (!founder) notFound();

  const featureArticle = articles.find((a: any) => a.doc_type === 'feature-article');
  const otherArticles = articles.filter((a: any) => a.doc_type !== 'feature-article');

  return (
      
      <main className="max-w-4xl mx-auto px-6 py-12">
        {/* Founder Header */}
        <div className="border-b border-stone-200 pb-8 mb-8">
          <span className="text-amber-600 font-mono text-xs uppercase tracking-wider">
            {INDUSTRY_LABELS[founder.industry] || founder.industry}
          </span>
          <h1 className="font-display text-5xl text-stone-900 mt-2 mb-1">{founder.name}</h1>
          {founder.title && <p className="text-stone-600 text-xl">{founder.title}</p>}
          <p className="text-stone-600 text-xl">{founder.company}</p>

          {founder.hook && (
            <p className="text-stone-600 text-lg mt-4 leading-relaxed max-w-2xl italic">&ldquo;{founder.hook}&rdquo;</p>
          )}

          <div className="flex gap-3 mt-6">
            {founder.website && (
              <a href={founder.website} target="_blank" rel="noopener noreferrer"
                className="text-stone-500 hover:text-stone-800 text-sm font-sans border border-stone-200 px-3 py-1 rounded transition-colors">
                Website →
              </a>
            )}
            {founder.linkedin_url && (
              <a href={founder.linkedin_url} target="_blank" rel="noopener noreferrer"
                className="text-stone-500 hover:text-stone-800 text-sm font-sans border border-stone-200 px-3 py-1 rounded transition-colors">
                LinkedIn →
              </a>
            )}
          </div>
        </div>

        {/* Feature Article */}
        {featureArticle && (
          <article className="prose-signal mb-12">
            <div dangerouslySetInnerHTML={{ __html: featureArticle.content.replace(/\n/g, '<br/>') }} />
          </article>
        )}

        {/* Other Content */}
        {otherArticles.length > 0 && (
          <div className="border-t border-stone-200 pt-8">
            <h2 className="font-display text-2xl text-stone-900 mb-4">More Coverage</h2>
            <div className="space-y-3">
              {otherArticles.map((a: any) => (
                <a key={a.id} href={`/articles/${a.id}`}
                  className="block border border-stone-200 rounded p-3 hover:border-stone-300 transition-colors">
                  <span className="text-amber-600 text-xs font-mono uppercase">{a.doc_type}</span>
                  <p className="text-stone-800 font-sans text-sm mt-1">{a.title || a.doc_type}</p>
                </a>
              ))}
            </div>
          </div>
        )}
      </main>
      
  );
}
