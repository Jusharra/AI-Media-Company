import { NextResponse } from 'next/server';
import { getDb, getLeadDb } from '@signal/lib/db';

const CONTENT_AGENTS = ['journalist', 'media-producer'] as const;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ entityId: string }> }
) {
  try {
    const { entityId } = await params;
    const leadDb = getLeadDb();

    const pipeline = leadDb.prepare(
      'SELECT task_id, entity_name, current_stage, gate_status FROM pipeline_state WHERE entity_id = ?'
    ).get(entityId) as { task_id: string; entity_name: string; current_stage: string; gate_status: string } | undefined;

    const allOutputs: Array<Record<string, unknown>> = [];
    for (const agent of CONTENT_AGENTS) {
      try {
        const db = getDb(agent);
        const outputs = db.prepare(
          `SELECT id, doc_type, validation_score, confidence_tier, version, status, created_at FROM outputs WHERE entity_id = ? ORDER BY created_at DESC`
        ).all(entityId) as Array<Record<string, unknown>>;

        for (const o of outputs) {
          allOutputs.push({ ...o, agent });
        }
      } catch { /* agent DB may not exist */ }
    }

    return NextResponse.json({
      entityId,
      entityName: pipeline?.entity_name ?? null,
      taskId: pipeline?.task_id ?? null,
      currentStage: pipeline?.current_stage ?? null,
      gateStatus: pipeline ? (() => { try { return JSON.parse(pipeline.gate_status); } catch { return {}; } })() : {},
      outputs: allOutputs,
    });
  } catch (err) {
    console.error('Content GET error:', err);
    return NextResponse.json({ error: 'Failed to fetch content' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ entityId: string }> }
) {
  try {
    const { entityId } = await params;
    const { taskId, notes } = await request.json() as { taskId: string; notes?: string };

    if (!taskId) {
      return NextResponse.json({ error: 'taskId is required' }, { status: 400 });
    }

    const leadDb = getLeadDb();
    const pipeline = leadDb.prepare(
      'SELECT task_id FROM pipeline_state WHERE entity_id = ?'
    ).get(entityId) as { task_id: string } | undefined;

    if (!pipeline) {
      return NextResponse.json({ error: 'Pipeline not found for entity' }, { status: 404 });
    }

    // Advance pipeline to journalist stage (content generation)
    leadDb.prepare(
      `UPDATE pipeline_state SET current_stage = 'journalist', updated_at = CURRENT_TIMESTAMP WHERE entity_id = ?`
    ).run(entityId);

    console.log(`[Content] Triggered content generation for entity ${entityId}${notes ? `: ${notes}` : ''}`);
    return NextResponse.json({ success: true, entityId, taskId: pipeline.task_id }, { status: 201 });
  } catch (err) {
    console.error('Content POST error:', err);
    return NextResponse.json({ error: 'Failed to trigger content generation' }, { status: 500 });
  }
}
