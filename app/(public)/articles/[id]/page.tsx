import { notFound } from 'next/navigation';

export const revalidate = 60;

const ADMIN = process.env.ADMIN_SITE_URL || 'http://localhost:3000';

const DOC_LABELS: Record<string, string> = {
  'feature-article': 'Feature Article',
  spotlight: 'Operator Spotlight',
  'thought-leadership': 'Analysis',
};

async function getArticle(id: string) {
  try {
    const res = await fetch(`${ADMIN}/api/cms/articles?status=approved`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    const all = await res.json();
    return all.find((a: any) => a.id === id) || null;
  } catch {
    return null;
  }
}

export default async function ArticlePage({ params }: { params: { id: string } }) {
  const article = await getArticle(params.id);
  if (!article) notFound();

  const date = article.published_at
    ? new Date(article.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : '';

  return (
      
      <main className="max-w-3xl mx-auto px-6 py-12">
        {/* Article Meta */}
        <div className="border-b border-stone-200 pb-6 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-amber-600 font-mono text-xs uppercase tracking-wider">
              {DOC_LABELS[article.doc_type] || article.doc_type}
            </span>
            {date && <span className="text-stone-400 text-xs">· {date}</span>}
          </div>
          <h1 className="font-display text-4xl text-stone-900 leading-tight mb-3">
            {article.title || article.doc_type}
          </h1>
          {article.author && (
            <p className="text-stone-500 text-sm font-sans">By {article.author}</p>
          )}
        </div>

        {/* Article Body */}
        <article className="prose-signal">
          {article.content.split('\n').map((line: string, i: number) => {
            if (line.startsWith('# ')) {
              return <h1 key={i} className="font-display text-3xl text-stone-900 mt-8 mb-4">{line.slice(2)}</h1>;
            }
            if (line.startsWith('## ')) {
              return <h2 key={i} className="font-display text-2xl text-stone-900 mt-8 mb-3">{line.slice(3)}</h2>;
            }
            if (line.startsWith('### ')) {
              return <h3 key={i} className="font-display text-xl text-stone-800 mt-6 mb-2">{line.slice(4)}</h3>;
            }
            if (line.startsWith('> ')) {
              return (
                <blockquote key={i} className="border-l-4 border-amber-600 pl-4 text-stone-600 italic my-6">
                  {line.slice(2)}
                </blockquote>
              );
            }
            if (line.trim() === '') return <div key={i} className="h-3" />;
            return <p key={i} className="font-serif text-stone-700 leading-relaxed mb-4">{line}</p>;
          })}
        </article>

        {/* Footer CTA */}
        <div className="mt-12 pt-8 border-t border-stone-200 bg-stone-50 rounded-lg p-6">
          <p className="text-stone-500 text-xs font-mono uppercase tracking-wider mb-2">
            Published by SIGNAL — The Authority Engine
          </p>
          <p className="text-stone-600 text-sm mb-4">
            SIGNAL covers operators building the next generation of healthcare, energy, and construction companies.
          </p>
          <a href="/get-featured" className="text-amber-600 hover:text-amber-700 text-sm font-sans transition-colors">
            Are you building something significant? Apply to get featured →
          </a>
        </div>
      </main>
      
  );
}
