import Link from 'next/link';

interface Article {
  id: string;
  title?: string;
  entity_id: string;
  doc_type: string;
  content: string;
  published_at?: string;
  author?: string;
}

export function ArticleCard({ article }: { article: Article }) {
  const preview = article.content?.slice(0, 200).replace(/#+\s/g, '').trim();
  const date = article.published_at ? new Date(article.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '';

  return (
    <Link href={`/articles/${article.id}`} className="block group">
      <div className="bg-white border border-stone-200 rounded-lg p-5 hover:border-stone-300 hover:shadow-sm transition-all">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-amber-700 text-xs font-mono uppercase tracking-wider">
            {article.doc_type === 'feature-article' ? 'Feature' : article.doc_type === 'spotlight' ? 'Spotlight' : 'Analysis'}
          </span>
          {date && <span className="text-stone-400 text-xs">· {date}</span>}
        </div>

        <h3 className="font-display text-stone-900 text-lg group-hover:text-amber-700 transition-colors line-clamp-2">
          {article.title || `${article.doc_type === 'feature-article' ? 'Feature' : 'Spotlight'}: ${article.entity_id.slice(0, 8)}`}
        </h3>

        {preview && (
          <p className="text-stone-500 text-sm mt-2 leading-relaxed line-clamp-3">{preview}</p>
        )}

        {article.author && (
          <p className="text-stone-400 text-xs font-mono mt-4">By {article.author}</p>
        )}
      </div>
    </Link>
  );
}
