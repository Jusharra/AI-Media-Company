import { NextResponse } from 'next/server';
import { getDb } from '@signal/lib/db';

const SECTORS = [
  { id: 'healthcare', label: 'Healthcare', slug: 'healthcare', description: 'Medical technology, healthcare services, and life sciences.' },
  { id: 'oil_gas', label: 'Oil & Gas', slug: 'oil-gas', description: 'Energy exploration, production, and distribution.' },
  { id: 'construction', label: 'Construction', slug: 'construction', description: 'Commercial and residential construction, infrastructure.' },
  { id: 'other', label: 'Other', slug: 'other', description: 'Industries across all other sectors.' },
] as const;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    const withStats = searchParams.get('stats') === 'true';

    if (slug) {
      const sector = SECTORS.find(s => s.slug === slug || s.id === slug);
      if (!sector) {
        return NextResponse.json({ error: 'Sector not found' }, { status: 404 });
      }

      if (withStats) {
        const scoutDb = getDb('signal-scout');
        const count = (scoutDb.prepare(
          `SELECT COUNT(*) as cnt FROM entities WHERE industry = ? AND status = 'featured'`
        ).get(sector.id) as { cnt: number }).cnt;

        return NextResponse.json({ ...sector, featuredCount: count });
      }

      return NextResponse.json(sector);
    }

    if (withStats) {
      const scoutDb = getDb('signal-scout');
      const statsRows = scoutDb.prepare(
        `SELECT industry, COUNT(*) as cnt FROM entities WHERE status IN ('approved','featured') GROUP BY industry`
      ).all() as Array<{ industry: string; cnt: number }>;

      const statsByIndustry: Record<string, number> = {};
      for (const row of statsRows) statsByIndustry[row.industry] = row.cnt;

      return NextResponse.json(
        SECTORS.map(s => ({ ...s, count: statsByIndustry[s.id] ?? 0 }))
      );
    }

    return NextResponse.json(SECTORS);
  } catch (err) {
    console.error('Sectors error:', err);
    return NextResponse.json({ error: 'Failed to fetch sectors' }, { status: 500 });
  }
}
