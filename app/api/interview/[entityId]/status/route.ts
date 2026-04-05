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
      'SELECT task_id, current_stage, gate_status FROM pipeline_state WHERE entity_id = ?'
    ).get(entityId) as { task_id: string; current_stage: string; gate_status: string } | undefined;

    const outputCount = (interviewDb.prepare(
      'SELECT COUNT(*) as cnt FROM outputs WHERE entity_id = ?'
    ).get(entityId) as { cnt: number }).cnt;

    const latestOutput = interviewDb.prepare(
      'SELECT doc_type, status, created_at FROM outputs WHERE entity_id = ? ORDER BY created_at DESC LIMIT 1'
    ).get(entityId) as { doc_type: string; status: string; created_at: string } | undefined;

    return NextResponse.json({
      entityId,
      taskId: pipeline?.task_id ?? null,
      currentStage: pipeline?.current_stage ?? null,
      gateStatus: pipeline ? (() => { try { return JSON.parse(pipeline.gate_status); } catch { return {}; } })() : {},
      outputCount,
      latestOutput: latestOutput ?? null,
    });
  } catch (err) {
    console.error('Interview status error:', err);
    return NextResponse.json({ error: 'Failed to fetch interview status' }, { status: 500 });
  }
}
