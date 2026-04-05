import { NextResponse } from 'next/server';
import { getDb, getLeadDb } from '@signal/lib/db';
import { processGateDecision } from '@signal/agents/lead';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ entityId: string }> }
) {
  try {
    const { entityId } = await params;
    const { reason, revision } = await request.json().catch(() => ({})) as { reason?: string; revision?: boolean };

    const leadDb = getLeadDb();
    const pipeline = leadDb.prepare(
      'SELECT task_id FROM pipeline_state WHERE entity_id = ?'
    ).get(entityId) as { task_id: string } | undefined;

    if (!pipeline) {
      return NextResponse.json({ error: 'Pipeline not found for entity' }, { status: 404 });
    }

    const decision = revision ? 'revision' : 'rejected';
    await processGateDecision(pipeline.task_id, 2, decision, reason);

    const bgDb = getDb('backgrounder');
    bgDb.prepare(
      `UPDATE outputs SET status = ? WHERE entity_id = ? AND doc_type = 'backgrounder'`
    ).run(revision ? 'revision' : 'draft', entityId);

    return NextResponse.json({ success: true, entityId, taskId: pipeline.task_id, gate: 2, decision });
  } catch (err) {
    console.error('Backgrounder reject error:', err);
    return NextResponse.json({ error: 'Failed to reject backgrounder' }, { status: 500 });
  }
}
