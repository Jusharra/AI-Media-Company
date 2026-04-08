import { SectorHero } from '@/components/public/SectorHero';
import { FounderCard } from '@/components/public/FounderCard';
import { ArticleCard } from '@/components/public/ArticleCard';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Oil & Gas / Energy — SIGNAL',
  description: 'SIGNAL covers independent operators, E&P founders, and energy transition executives navigating the dual forces reshaping the energy industry.',
};

const ADMIN = process.env.ADMIN_SITE_URL || 'http://localhost:3000';

async function getSectorData() {
  const [foundersRes, articlesRes] = await Promise.all([
    fetch(`${ADMIN}/api/cms/founders?status=featured&industry=oil_gas`, { next: { revalidate: 60 } }),
    fetch(`${ADMIN}/api/cms/articles?status=approved`, { next: { revalidate: 60 } }),
  ]);
  const founders = foundersRes.ok ? await foundersRes.json() : [];
  const allArticles = articlesRes.ok ? await articlesRes.json() : [];
  return { founders, articles: allArticles.slice(0, 6) };
}

export default async function OilGasSectorPage() {
  const { founders, articles } = await getSectorData();

  return (
      
      <main className="max-w-6xl mx-auto px-6 py-12">
        <SectorHero
          name="Oil & Gas / Energy"
          tagline="Operators navigating the dual forces reshaping the energy industry."
          context="The energy industry is being reshaped by the dual forces of the energy transition and a resurgent commodity market. Operators who built careers on conventional production are now navigating carbon accounting, ESG investor pressure, and the race to decarbonize. At the same time, a new generation of energy entrepreneurs is building the infrastructure — carbon pipelines, hydrogen facilities, digital monitoring platforms — that the transition requires. SIGNAL covers both."
          themes={[
            'Energy transition and decarbonization strategies',
            'LNG infrastructure and export facilities',
            'Carbon capture, utilization, and storage (CCUS)',
            'Digital oilfield and IoT sensor networks',
            'Permian Basin and shale optimization',
            'Pipeline integrity and leak detection',
          ]}
          color="amber"
        />

        {founders.length > 0 && (
          <section className="mb-16">
            <h2 className="font-display text-3xl text-stone-900 mb-6">Energy Founders</h2>
            <div className="grid grid-cols-3 gap-6">
              {founders.map((f: any) => <FounderCard key={f.id} founder={f} />)}
            </div>
          </section>
        )}

        {articles.length > 0 && (
          <section>
            <h2 className="font-display text-3xl text-stone-900 mb-6">Energy Coverage</h2>
            <div className="grid grid-cols-3 gap-6">
              {articles.map((a: any) => <ArticleCard key={a.id} article={a} />)}
            </div>
          </section>
        )}

        {founders.length === 0 && articles.length === 0 && (
          <div className="text-center py-20 text-stone-400">
            <p className="font-display text-2xl mb-2">Coverage in progress.</p>
            <p className="text-sm">Our editors are profiling energy operators now. Check back soon.</p>
          </div>
        )}
      </main>
      
  );
}
