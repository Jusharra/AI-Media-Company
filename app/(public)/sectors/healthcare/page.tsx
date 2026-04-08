import { SectorHero } from '@/components/public/SectorHero';
import { FounderCard } from '@/components/public/FounderCard';
import { ArticleCard } from '@/components/public/ArticleCard';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Healthcare — SIGNAL',
  description: 'SIGNAL covers the clinicians-turned-operators, health system executives, and digital health founders building the next infrastructure layer of healthcare.',
};

const ADMIN = process.env.ADMIN_SITE_URL || 'http://localhost:3000';

async function getSectorData() {
  const [foundersRes, articlesRes] = await Promise.all([
    fetch(`${ADMIN}/api/cms/founders?status=featured&industry=healthcare`, { next: { revalidate: 60 } }),
    fetch(`${ADMIN}/api/cms/articles?status=approved`, { next: { revalidate: 60 } }),
  ]);
  const founders = foundersRes.ok ? await foundersRes.json() : [];
  const allArticles = articlesRes.ok ? await articlesRes.json() : [];
  return { founders, articles: allArticles.slice(0, 6) };
}

export default async function HealthcareSectorPage() {
  const { founders, articles } = await getSectorData();

  return (
      
      <main className="max-w-6xl mx-auto px-6 py-12">
        <SectorHero
          name="Healthcare"
          tagline="Building the infrastructure layer between payers, providers, and patients."
          context="Healthcare is undergoing its most significant structural transformation in decades. Fee-for-service models are giving way to value-based care, AI is entering clinical workflows, and a new class of operators — many with clinical backgrounds — are building the infrastructure layer between payers, providers, and patients. Despite the scale of this transformation, most of its builders remain unknown outside specialist circles. SIGNAL finds them."
          themes={[
            'Value-based care models',
            'AI diagnostics and clinical decision support',
            'Healthcare interoperability and data standards',
            'Mental health technology and teletherapy',
            'Medical device innovation',
            'Revenue cycle management',
          ]}
          color="rose"
        />

        {founders.length > 0 && (
          <section className="mb-16">
            <h2 className="font-display text-3xl text-stone-900 mb-6">Healthcare Founders</h2>
            <div className="grid grid-cols-3 gap-6">
              {founders.map((f: any) => <FounderCard key={f.id} founder={f} />)}
            </div>
          </section>
        )}

        {articles.length > 0 && (
          <section>
            <h2 className="font-display text-3xl text-stone-900 mb-6">Healthcare Coverage</h2>
            <div className="grid grid-cols-3 gap-6">
              {articles.map((a: any) => <ArticleCard key={a.id} article={a} />)}
            </div>
          </section>
        )}

        {founders.length === 0 && articles.length === 0 && (
          <div className="text-center py-20 text-stone-400">
            <p className="font-display text-2xl mb-2">Coverage in progress.</p>
            <p className="text-sm">Our editors are profiling healthcare operators now. Check back soon.</p>
          </div>
        )}
      </main>
      
  );
}
