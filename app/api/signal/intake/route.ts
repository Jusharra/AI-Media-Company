import { NextResponse } from 'next/server';
import { getDb, getLeadDb } from '@signal/lib/db';

export async function GET() {
  try {
    const scoutDb = getDb('signal-scout');
    const leadDb = getLeadDb();

    const entities = scoutDb.prepare('SELECT * FROM entities ORDER BY created_at DESC LIMIT 100').all() as Array<Record<string, unknown>>;
    const pipelineRows = leadDb.prepare('SELECT task_id, entity_id, current_stage, gate_status FROM pipeline_state').all() as Array<{ task_id: string; entity_id: string; current_stage: string; gate_status: string }>;

    // Index pipeline state by entity_id for fast lookup
    const pipelineByEntity: Record<string, { task_id: string; current_stage: string; gate_status: string }> = {};
    for (const row of pipelineRows) {
      pipelineByEntity[row.entity_id] = { task_id: row.task_id, current_stage: row.current_stage, gate_status: row.gate_status };
    }

    const merged = entities.map(e => ({
      ...e,
      task_id: pipelineByEntity[e.id as string]?.task_id ?? null,
      current_stage: pipelineByEntity[e.id as string]?.current_stage ?? null,
      gate_status: pipelineByEntity[e.id as string]?.gate_status ?? null,
    }));

    return NextResponse.json(merged);
  } catch (err) {
    console.error('Intake list error:', err);
    return NextResponse.json({ error: 'Failed to fetch intake list' }, { status: 500 });
  }
}
