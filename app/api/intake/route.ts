import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getDb, getLeadDb } from '@signal/lib/db';
import { startPipeline } from '@signal/agents/lead';
import type { IntakeRequest } from '@signal/lib/types';

export async function GET() {
  try {
    const scoutDb = getDb('signal-scout');
    const leadDb = getLeadDb();

    const entities = scoutDb.prepare(
      'SELECT * FROM entities ORDER BY created_at DESC LIMIT 100'
    ).all() as Array<Record<string, unknown>>;

    const pipelineRows = leadDb.prepare(
      'SELECT task_id, entity_id, current_stage, gate_status FROM pipeline_state'
    ).all() as Array<{ task_id: string; entity_id: string; current_stage: string; gate_status: string }>;

    const pipelineByEntity: Record<string, { task_id: string; current_stage: string; gate_status: string }> = {};
    for (const row of pipelineRows) {
      pipelineByEntity[row.entity_id] = {
        task_id: row.task_id,
        current_stage: row.current_stage,
        gate_status: row.gate_status,
      };
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

export async function POST(request: Request) {
  try {
    const intake: IntakeRequest = await request.json();

    if (!intake.name || !intake.industry) {
      return NextResponse.json({ error: 'name and industry are required' }, { status: 400 });
    }

    const taskId = await startPipeline(intake);
    return NextResponse.json({ taskId, status: 'pipeline_started' }, { status: 201 });
  } catch (err) {
    console.error('Intake create error:', err);
    return NextResponse.json({ error: 'Failed to create intake' }, { status: 500 });
  }
}
