
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Podcast — The SIGNAL Sessions' };

const ADMIN = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

async function getPodcastEpisodes() {
  try {
    const res = await fetch(`${ADMIN}/api/cms/articles?status=approved`, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    const all = await res.json();
    return all.filter((a: any) => a.doc_type === 'podcast-script');
  } catch {
    return [];
  }
}

export default async function PodcastPage() {
  const episodes = await getPodcastEpisodes();

  return (
      
      <main className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-12 border-b border-stone-200 pb-10">
          <p className="text-amber-600 font-mono text-sm uppercase tracking-wider mb-3">Audio</p>
          <h1 className="font-display text-5xl text-stone-900 mb-4">The SIGNAL Sessions</h1>
          <p className="text-stone-600 text-lg max-w-2xl leading-relaxed">
            Long-form conversations with the operators building the next generation of healthcare, energy, and construction companies. Unfiltered. Substantive. No fluff.
          </p>

          <div className="flex gap-4 mt-6">
            {['Spotify', 'Apple Podcasts', 'YouTube'].map(platform => (
              <span key={platform} className="border border-stone-200 text-stone-500 text-sm font-sans px-3 py-1.5 rounded">
                {platform}
              </span>
            ))}
          </div>
        </div>

        {/* Episodes */}
        {episodes.length === 0 ? (
          <div className="text-center py-20">
            <p className="font-display text-2xl text-stone-400 mb-2">Episodes coming soon.</p>
            <p className="text-stone-400 text-sm">
              Our first episodes are in production. Subscribe to be notified.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {episodes.map((ep: any, i: number) => (
              <div key={ep.id} className="bg-white border border-stone-200 rounded-lg p-6 hover:border-stone-300 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center shrink-0">
                    <span className="text-amber-700 font-display text-lg">▶</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-amber-600 font-mono text-xs">EP {episodes.length - i}</span>
                      {ep.published_at && (
                        <span className="text-stone-400 text-xs">
                          · {new Date(ep.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </span>
                      )}
                    </div>
                    <h3 className="font-display text-stone-900 text-lg mb-1">
                      {ep.title || `The SIGNAL Sessions: Episode ${episodes.length - i}`}
                    </h3>
                    <p className="text-stone-500 text-sm leading-relaxed line-clamp-2">
                      {ep.content?.slice(0, 180).replace(/#+\s/g, '').trim()}
                    </p>
                    <a href={`/articles/${ep.id}`} className="text-amber-600 hover:text-amber-700 text-sm font-sans mt-3 inline-block transition-colors">
                      Read transcript →
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      
  );
}
