import { NextResponse } from 'next/server';
import { getDb } from '@signal/lib/db';

export async function GET() {
  try {
    const db = getDb('signal-scout');
    const entities = db.prepare(`
      SELECT e.*, ps.current_stage, ps.task_id, ps.gate_status
      FROM entities e
      LEFT JOIN pipeline_state ps ON ps.entity_id = e.id
      ORDER BY e.created_at DESC
      LIMIT 100
    `).all();

    return NextResponse.json(entities);
  } catch (err) {
    console.error('Intake list error:', err);
    return NextResponse.json({ error: 'Failed to fetch intake list' }, { status: 500 });
  }
}
