import { SectorHero } from '@/components/public/SectorHero';
import { FounderCard } from '@/components/public/FounderCard';
import { ArticleCard } from '@/components/public/ArticleCard';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Construction — SIGNAL',
  description: 'SIGNAL covers general contractors turned tech founders, construction software entrepreneurs, and modular building companies building better ways to build.',
};

const ADMIN = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

async function getSectorData() {
  const [foundersRes, articlesRes] = await Promise.all([
    fetch(`${ADMIN}/api/cms/founders?status=featured&industry=construction`, { next: { revalidate: 60 } }),
    fetch(`${ADMIN}/api/cms/articles?status=approved`, { next: { revalidate: 60 } }),
  ]);
  const founders = foundersRes.ok ? await foundersRes.json() : [];
  const allArticles = articlesRes.ok ? await articlesRes.json() : [];
  return { founders, articles: allArticles.slice(0, 6) };
}

export default async function ConstructionSectorPage() {
  const { founders, articles } = await getSectorData();

  return (
      
      <main className="max-w-6xl mx-auto px-6 py-12">
        <SectorHero
          name="Construction"
          tagline="Building software platforms, new material supply chains, and modular building systems."
          context="Construction is the world's largest industry by employment and among its least digitized. The sector accounts for 13% of global GDP yet productivity growth has been essentially flat for decades. A new generation of operators — many with boots-on-the-ground experience — is changing that, building software platforms, new material supply chains, and modular building systems that could fundamentally reshape how the built environment gets made. SIGNAL covers the builders building better ways to build."
          themes={[
            'Modular and prefabricated construction',
            'Construction technology and BuildTech',
            'Project management and scheduling software',
            'Drone and aerial survey technology',
            'Materials innovation (mass timber, concrete alternatives)',
            'Supply chain visibility and procurement',
          ]}
          color="orange"
        />

        {founders.length > 0 && (
          <section className="mb-16">
            <h2 className="font-display text-3xl text-stone-900 mb-6">Construction Founders</h2>
            <div className="grid grid-cols-3 gap-6">
              {founders.map((f: any) => <FounderCard key={f.id} founder={f} />)}
            </div>
          </section>
        )}

        {articles.length > 0 && (
          <section>
            <h2 className="font-display text-3xl text-stone-900 mb-6">Construction Coverage</h2>
            <div className="grid grid-cols-3 gap-6">
              {articles.map((a: any) => <ArticleCard key={a.id} article={a} />)}
            </div>
          </section>
        )}

        {founders.length === 0 && articles.length === 0 && (
          <div className="text-center py-20 text-stone-400">
            <p className="font-display text-2xl mb-2">Coverage in progress.</p>
            <p className="text-sm">Our editors are profiling construction operators now. Check back soon.</p>
          </div>
        )}
      </main>
      
  );
}
