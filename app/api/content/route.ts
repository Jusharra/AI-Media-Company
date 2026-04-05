import { NextResponse } from 'next/server';
import { getDb, getLeadDb } from '@signal/lib/db';

const CONTENT_AGENTS = ['journalist', 'media-producer'] as const;

export async function GET() {
  try {
    const leadDb = getLeadDb();
    const pipelines = leadDb.prepare(
      'SELECT task_id, entity_id, entity_name, current_stage FROM pipeline_state'
    ).all() as Array<{ task_id: string; entity_id: string; entity_name: string; current_stage: string }>;

    const nameByEntity: Record<string, string> = {};
    const taskByEntity: Record<string, string> = {};
    for (const p of pipelines) {
      nameByEntity[p.entity_id] = p.entity_name;
      taskByEntity[p.entity_id] = p.task_id;
    }

    const allOutputs: Array<Record<string, unknown>> = [];
    for (const agent of CONTENT_AGENTS) {
      try {
        const db = getDb(agent);
        const outputs = db.prepare(
          `SELECT id, entity_id, doc_type, validation_score, confidence_tier, version, status, created_at FROM outputs ORDER BY created_at DESC LIMIT 100`
        ).all() as Array<{ id: string; entity_id: string; doc_type: string; validation_score: number | null; confidence_tier: string | null; version: number; status: string; created_at: string }>;

        for (const o of outputs) {
          allOutputs.push({
            ...o,
            agent,
            entity_name: nameByEntity[o.entity_id] ?? null,
            task_id: taskByEntity[o.entity_id] ?? null,
          });
        }
      } catch { /* agent DB may not exist */ }
    }

    allOutputs.sort((a, b) => new Date(b.created_at as string).getTime() - new Date(a.created_at as string).getTime());
    return NextResponse.json(allOutputs);
  } catch (err) {
    console.error('Content list error:', err);
    return NextResponse.json({ error: 'Failed to fetch content' }, { status: 500 });
  }
}
