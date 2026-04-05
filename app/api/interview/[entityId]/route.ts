import { NextResponse } from 'next/server';
import { getDb, getLeadDb } from '@signal/lib/db';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ entityId: string }> }
) {
  try {
    const { entityId } = await params;
    const interviewDb = getDb('interview-engine');
    const leadDb = getLeadDb();

    const pipeline = leadDb.prepare(
      'SELECT task_id, entity_name, current_stage FROM pipeline_state WHERE entity_id = ?'
    ).get(entityId) as { task_id: string; entity_name: string; current_stage: string } | undefined;

    const outputs = interviewDb.prepare(
      'SELECT * FROM outputs WHERE entity_id = ? ORDER BY created_at DESC'
    ).all(entityId) as Array<{ id: string; doc_type: string; content: string; status: string; created_at: string }>;

    return NextResponse.json({
      entityId,
      entityName: pipeline?.entity_name ?? null,
      taskId: pipeline?.task_id ?? null,
      currentStage: pipeline?.current_stage ?? null,
      outputs: outputs.map(o => ({
        ...o,
        content: (() => { try { return JSON.parse(o.content); } catch { return o.content; } })(),
      })),
    });
  } catch (err) {
    console.error('Interview GET error:', err);
    return NextResponse.json({ error: 'Failed to fetch interview' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ entityId: string }> }
) {
  try {
    const { entityId } = await params;
    const { outputId, status } = await request.json() as { outputId: string; status: string };

    if (!outputId || !status) {
      return NextResponse.json({ error: 'outputId and status are required' }, { status: 400 });
    }

    const validStatuses = ['draft', 'revision', 'approved', 'published'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: `status must be one of: ${validStatuses.join(', ')}` }, { status: 400 });
    }

    const interviewDb = getDb('interview-engine');
    const output = interviewDb.prepare('SELECT id FROM outputs WHERE id = ? AND entity_id = ?').get(outputId, entityId);
    if (!output) {
      return NextResponse.json({ error: 'Output not found' }, { status: 404 });
    }

    interviewDb.prepare('UPDATE outputs SET status = ? WHERE id = ?').run(status, outputId);
    return NextResponse.json({ success: true, outputId, status });
  } catch (err) {
    console.error('Interview PATCH error:', err);
    return NextResponse.json({ error: 'Failed to update interview' }, { status: 500 });
  }
}
