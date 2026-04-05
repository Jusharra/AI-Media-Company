import { NextResponse } from 'next/server';
import { getLeadDb, getDb } from '@signal/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');

    const leadDb = getLeadDb();

    // Deals are gate 4 approved pipelines
    const gateDecisions = leadDb.prepare(`
      SELECT gd.task_id, gd.decision, gd.notes, gd.created_at, gd.decided_by,
             ps.entity_id, ps.entity_name, ps.distribution_urls, ps.monetization_flag
      FROM gate_decisions gd
      JOIN pipeline_state ps ON ps.task_id = gd.task_id
      WHERE gd.gate_number = 4 AND gd.decision = 'approved'
      ${taskId ? 'AND gd.task_id = ?' : ''}
      ORDER BY gd.created_at DESC
      LIMIT 50
    `);

    const rows = (taskId ? gateDecisions.all(taskId) : gateDecisions.all()) as Array<{
      task_id: string; decision: string; notes: string | null; created_at: string;
      decided_by: string; entity_id: string; entity_name: string;
      distribution_urls: string; monetization_flag: number;
    }>;

    const scoutDb = getDb('signal-scout');
    const deals = rows.map(row => {
      const entity = scoutDb.prepare('SELECT score, company, industry FROM entities WHERE id = ?').get(row.entity_id) as
        { score: number; company: string | null; industry: string } | undefined;

      let distributionUrls: Record<string, string> = {};
      try { distributionUrls = JSON.parse(row.distribution_urls); } catch { /* ignore */ }

      return {
        taskId: row.task_id,
        entityId: row.entity_id,
        entityName: row.entity_name,
        company: entity?.company ?? null,
        industry: entity?.industry ?? null,
        score: entity?.score ?? 0,
        monetizationFlag: row.monetization_flag === 1,
        distributionUrls,
        approvedAt: row.created_at,
        notes: row.notes,
      };
    });

    return NextResponse.json(deals);
  } catch (err) {
    console.error('Deals error:', err);
    return NextResponse.json({ error: 'Failed to fetch deals' }, { status: 500 });
  }
}
