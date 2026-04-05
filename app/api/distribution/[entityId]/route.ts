import { NextResponse } from 'next/server';
import { getDb, getLeadDb } from '@signal/lib/db';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ entityId: string }> }
) {
  try {
    const { entityId } = await params;
    const leadDb = getLeadDb();

    const pipeline = leadDb.prepare(
      'SELECT task_id, entity_name, distribution_urls FROM pipeline_state WHERE entity_id = ?'
    ).get(entityId) as { task_id: string; entity_name: string; distribution_urls: string } | undefined;

    if (!pipeline) {
      return NextResponse.json({ error: 'Pipeline not found for entity' }, { status: 404 });
    }

    const distributorDb = getDb('distributor');
    const logs = distributorDb.prepare(
      'SELECT * FROM distribution_logs WHERE task_id = ? ORDER BY created_at DESC'
    ).all(pipeline.task_id) as Array<{
      id: string; content_id: string; platform: string;
      post_url: string | null; status: string;
      performance_metrics: string | null; published_at: string | null; created_at: string;
    }>;

    let distributionUrls: Record<string, string> = {};
    try { distributionUrls = JSON.parse(pipeline.distribution_urls); } catch { /* ignore */ }

    return NextResponse.json({
      entityId,
      entityName: pipeline.entity_name,
      taskId: pipeline.task_id,
      distributionUrls,
      logs: logs.map(l => ({
        ...l,
        performance_metrics: l.performance_metrics
          ? (() => { try { return JSON.parse(l.performance_metrics!); } catch { return l.performance_metrics; } })()
          : null,
      })),
    });
  } catch (err) {
    console.error('Distribution entity GET error:', err);
    return NextResponse.json({ error: 'Failed to fetch distribution data' }, { status: 500 });
  }
}
