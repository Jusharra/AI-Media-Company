import { NextResponse } from 'next/server';
import { getDb, getLeadDb } from '@signal/lib/db';
import { runInterviewModeA } from '@signal/agents/interview-engine';

export async function GET() {
  try {
    const interviewDb = getDb('interview-engine');
    const leadDb = getLeadDb();

    const outputs = interviewDb.prepare(
      'SELECT * FROM outputs ORDER BY created_at DESC LIMIT 50'
    ).all() as Array<{ id: string; entity_id: string; doc_type: string; content: string; status: string; created_at: string }>;

    const pipelines = leadDb.prepare(
      'SELECT task_id, entity_id, entity_name FROM pipeline_state'
    ).all() as Array<{ task_id: string; entity_id: string; entity_name: string }>;

    const nameByEntity: Record<string, string> = {};
    const taskByEntity: Record<string, string> = {};
    for (const p of pipelines) {
      nameByEntity[p.entity_id] = p.entity_name;
      taskByEntity[p.entity_id] = p.task_id;
    }

    const merged = outputs.map(o => ({
      ...o,
      entity_name: nameByEntity[o.entity_id] ?? null,
      task_id: taskByEntity[o.entity_id] ?? null,
    }));

    return NextResponse.json(merged);
  } catch (err) {
    console.error('Interview list error:', err);
    return NextResponse.json({ error: 'Failed to fetch interviews' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { entityId, taskId } = await request.json() as { entityId: string; taskId: string };

    if (!entityId || !taskId) {
      return NextResponse.json({ error: 'entityId and taskId are required' }, { status: 400 });
    }

    const scoutDb = getDb('signal-scout');
    const entity = scoutDb.prepare('SELECT * FROM entities WHERE id = ?').get(entityId) as
      Record<string, unknown> | undefined;

    if (!entity) {
      return NextResponse.json({ error: 'Entity not found' }, { status: 404 });
    }

    const { transcriptId } = await runInterviewModeA(entityId, taskId, entity);

    const interviewDb = getDb('interview-engine');
    const output = interviewDb.prepare('SELECT content FROM outputs WHERE id = ?').get(transcriptId) as
      { content: string } | undefined;

    return NextResponse.json({
      success: true,
      transcriptId,
      questions: output ? JSON.parse(output.content) : null,
    }, { status: 201 });
  } catch (err) {
    console.error('Interview trigger error:', err);
    return NextResponse.json({ error: 'Failed to trigger interview' }, { status: 500 });
  }
}
