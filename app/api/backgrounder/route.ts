import { NextResponse } from 'next/server';
import { getDb, getLeadDb } from '@signal/lib/db';

export async function GET() {
  try {
    const bgDb = getDb('backgrounder');
    const leadDb = getLeadDb();

    const outputs = bgDb.prepare(
      `SELECT * FROM outputs WHERE doc_type = 'backgrounder' ORDER BY created_at DESC LIMIT 50`
    ).all() as Array<{ id: string; entity_id: string; content: string; validation_score: number | null; status: string; created_at: string }>;

    const pipelines = leadDb.prepare(
      'SELECT task_id, entity_id, entity_name FROM pipeline_state'
    ).all() as Array<{ task_id: string; entity_id: string; entity_name: string }>;

    const nameByEntity: Record<string, string> = {};
    const taskByEntity: Record<string, string> = {};
    for (const p of pipelines) {
      nameByEntity[p.entity_id] = p.entity_name;
      taskByEntity[p.entity_id] = p.task_id;
    }

    return NextResponse.json(
      outputs.map(o => ({
        ...o,
        entity_name: nameByEntity[o.entity_id] ?? null,
        task_id: taskByEntity[o.entity_id] ?? null,
        content: (() => { try { return JSON.parse(o.content); } catch { return o.content; } })(),
      }))
    );
  } catch (err) {
    console.error('Backgrounder list error:', err);
    return NextResponse.json({ error: 'Failed to fetch backgrounders' }, { status: 500 });
  }
}
