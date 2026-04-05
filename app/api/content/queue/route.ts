import { NextResponse } from 'next/server';
import { getDb, getLeadDb } from '@signal/lib/db';

export async function GET() {
  try {
    const journalistDb = getDb('journalist');
    const leadDb = getLeadDb();

    // Content awaiting gate 3 approval (validator approved, awaiting human gate)
    const outputs = journalistDb.prepare(
      `SELECT id, entity_id, doc_type, validation_score, confidence_tier, version, status, created_at
       FROM outputs
       WHERE status IN ('draft', 'revision')
       ORDER BY created_at DESC LIMIT 50`
    ).all() as Array<{ id: string; entity_id: string; doc_type: string; validation_score: number | null; confidence_tier: string | null; version: number; status: string; created_at: string }>;

    const pipelines = leadDb.prepare(
      'SELECT task_id, entity_id, entity_name, current_stage, gate_status FROM pipeline_state'
    ).all() as Array<{ task_id: string; entity_id: string; entity_name: string; current_stage: string; gate_status: string }>;

    const pipelineByEntity: Record<string, typeof pipelines[0]> = {};
    for (const p of pipelines) pipelineByEntity[p.entity_id] = p;

    const queue = outputs.map(o => ({
      ...o,
      entity_name: pipelineByEntity[o.entity_id]?.entity_name ?? null,
      task_id: pipelineByEntity[o.entity_id]?.task_id ?? null,
      current_stage: pipelineByEntity[o.entity_id]?.current_stage ?? null,
    })).filter(o => o.task_id !== null);

    return NextResponse.json(queue);
  } catch (err) {
    console.error('Content queue error:', err);
    return NextResponse.json({ error: 'Failed to fetch content queue' }, { status: 500 });
  }
}
