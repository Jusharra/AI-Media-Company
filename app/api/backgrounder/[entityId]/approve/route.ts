import { NextResponse } from 'next/server';
import { getDb, getLeadDb } from '@signal/lib/db';
import { processGateDecision } from '@signal/agents/lead';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ entityId: string }> }
) {
  try {
    const { entityId } = await params;
    const { notes } = await request.json().catch(() => ({})) as { notes?: string };

    const leadDb = getLeadDb();
    const pipeline = leadDb.prepare(
      'SELECT task_id FROM pipeline_state WHERE entity_id = ?'
    ).get(entityId) as { task_id: string } | undefined;

    if (!pipeline) {
      return NextResponse.json({ error: 'Pipeline not found for entity' }, { status: 404 });
    }

    await processGateDecision(pipeline.task_id, 2, 'approved', notes);

    const bgDb = getDb('backgrounder');
    bgDb.prepare(
      `UPDATE outputs SET status = 'approved' WHERE entity_id = ? AND doc_type = 'backgrounder'`
    ).run(entityId);

    return NextResponse.json({ success: true, entityId, taskId: pipeline.task_id, gate: 2, decision: 'approved' });
  } catch (err) {
    console.error('Backgrounder approve error:', err);
    return NextResponse.json({ error: 'Failed to approve backgrounder' }, { status: 500 });
  }
}
