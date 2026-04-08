import { ArticleCard } from '@/components/public/ArticleCard';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Articles' };

async function getArticles() {
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

export default async function ArticlesPage() {
  const articles = await getArticles();

  return (
      
      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="mb-10">
          <p className="text-amber-600 font-mono text-sm uppercase tracking-wider mb-2">Editorial</p>
          <h1 className="font-display text-5xl text-stone-900">SIGNAL Coverage</h1>
          <p className="text-stone-600 mt-2">In-depth profiles, spotlights, and analysis on the operators building the future of industry.</p>
        </div>

        {articles.length === 0 ? (
          <div className="text-center py-20 text-stone-400">
            <p className="font-display text-2xl mb-2">Articles coming soon.</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-6">
            {articles.map((a: any) => <ArticleCard key={a.id} article={a} />)}
          </div>
        )}
      </main>
      
  );
}
