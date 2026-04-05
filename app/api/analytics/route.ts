import { NextResponse } from 'next/server';
import { getDb, getLeadDb } from '@signal/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const view = searchParams.get('view') ?? 'overview';

    const leadDb = getLeadDb();
    const scoutDb = getDb('signal-scout');
    const distributorDb = getDb('distributor');

    if (view === 'overview') {
      const totalEntities = (scoutDb.prepare('SELECT COUNT(*) as cnt FROM entities').get() as { cnt: number }).cnt;
      const approvedEntities = (scoutDb.prepare(`SELECT COUNT(*) as cnt FROM entities WHERE status = 'approved'`).get() as { cnt: number }).cnt;
      const rejectedEntities = (scoutDb.prepare(`SELECT COUNT(*) as cnt FROM entities WHERE status = 'rejected'`).get() as { cnt: number }).cnt;
      const activePipelines = (leadDb.prepare('SELECT COUNT(*) as cnt FROM pipeline_state').get() as { cnt: number }).cnt;

      let totalDistributions = 0;
      let publishedDistributions = 0;
      try {
        totalDistributions = (distributorDb.prepare('SELECT COUNT(*) as cnt FROM distribution_logs').get() as { cnt: number }).cnt;
        publishedDistributions = (distributorDb.prepare(`SELECT COUNT(*) as cnt FROM distribution_logs WHERE status = 'published'`).get() as { cnt: number }).cnt;
      } catch { /* distributor may not have data */ }

      const byIndustry = scoutDb.prepare(
        'SELECT industry, COUNT(*) as cnt FROM entities GROUP BY industry'
      ).all() as Array<{ industry: string; cnt: number }>;

      const byStatus = scoutDb.prepare(
        'SELECT status, COUNT(*) as cnt FROM entities GROUP BY status'
      ).all() as Array<{ status: string; cnt: number }>;

      const recentPipelines = leadDb.prepare(
        'SELECT task_id, entity_name, current_stage, created_at FROM pipeline_state ORDER BY created_at DESC LIMIT 10'
      ).all() as Array<Record<string, unknown>>;

      return NextResponse.json({
        totals: {
          entities: totalEntities,
          approved: approvedEntities,
          rejected: rejectedEntities,
          activePipelines,
          distributions: totalDistributions,
          published: publishedDistributions,
        },
        byIndustry,
        byStatus,
        recentPipelines,
      });
    }

    if (view === 'distribution') {
      try {
        const byPlatform = distributorDb.prepare(
          `SELECT platform, COUNT(*) as cnt, COUNT(CASE WHEN status = 'published' THEN 1 END) as published
           FROM distribution_logs GROUP BY platform`
        ).all() as Array<{ platform: string; cnt: number; published: number }>;

        const recent = distributorDb.prepare(
          'SELECT * FROM distribution_logs ORDER BY created_at DESC LIMIT 20'
        ).all() as Array<Record<string, unknown>>;

        return NextResponse.json({ byPlatform, recent });
      } catch {
        return NextResponse.json({ byPlatform: [], recent: [] });
      }
    }

    if (view === 'pipeline') {
      const stages = leadDb.prepare(
        'SELECT current_stage, COUNT(*) as cnt FROM pipeline_state GROUP BY current_stage'
      ).all() as Array<{ current_stage: string; cnt: number }>;

      const gateDecisions = leadDb.prepare(
        'SELECT gate_number, decision, COUNT(*) as cnt FROM gate_decisions GROUP BY gate_number, decision'
      ).all() as Array<{ gate_number: number; decision: string; cnt: number }>;

      return NextResponse.json({ stages, gateDecisions });
    }

    return NextResponse.json({ error: 'Unknown view. Use: overview, distribution, pipeline' }, { status: 400 });
  } catch (err) {
    console.error('Analytics error:', err);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
