import { NextResponse } from 'next/server';
import { getDb, getLeadDb } from '@signal/lib/db';
import { processGateDecision } from '@signal/agents/lead';

export async function POST(request: Request) {
  try {
    const { entityIds, notes } = await request.json() as { entityIds: string[]; notes?: string };

    if (!entityIds || !Array.isArray(entityIds) || entityIds.length === 0) {
      return NextResponse.json({ error: 'entityIds array is required' }, { status: 400 });
    }

    const leadDb = getLeadDb();
    const journalistDb = getDb('journalist');
    const results: Array<{ entityId: string; taskId: string; success: boolean; error?: string }> = [];

    for (const entityId of entityIds) {
      try {
        const pipeline = leadDb.prepare(
          'SELECT task_id FROM pipeline_state WHERE entity_id = ?'
        ).get(entityId) as { task_id: string } | undefined;

        if (!pipeline) {
          results.push({ entityId, taskId: '', success: false, error: 'Pipeline not found' });
          continue;
        }

        await processGateDecision(pipeline.task_id, 3, 'approved', notes);
        journalistDb.prepare(
          `UPDATE outputs SET status = 'approved' WHERE entity_id = ?`
        ).run(entityId);

        results.push({ entityId, taskId: pipeline.task_id, success: true });
      } catch (err) {
        results.push({ entityId, taskId: '', success: false, error: String(err) });
      }
    }

    return NextResponse.json({ results });
  } catch (err) {
    console.error('Approve-all error:', err);
    return NextResponse.json({ error: 'Failed to approve content' }, { status: 500 });
  }
}
