import { NextResponse } from 'next/server';
import { getDb, getLeadDb } from '@signal/lib/db';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ entityId: string }> }
) {
  try {
    const { entityId } = await params;
    const scoutDb = getDb('signal-scout');
    const leadDb = getLeadDb();

    const entity = scoutDb.prepare('SELECT * FROM entities WHERE id = ?').get(entityId) as
      Record<string, unknown> | undefined;

    if (!entity) {
      return NextResponse.json({ error: 'Entity not found' }, { status: 404 });
    }

    const pipeline = leadDb.prepare(
      'SELECT task_id, current_stage, gate_status, created_at, updated_at FROM pipeline_state WHERE entity_id = ?'
    ).get(entityId) as Record<string, unknown> | undefined;

    return NextResponse.json({ ...entity, pipeline: pipeline ?? null });
  } catch (err) {
    console.error('Intake GET error:', err);
    return NextResponse.json({ error: 'Failed to fetch entity' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ entityId: string }> }
) {
  try {
    const { entityId } = await params;
    const body = await request.json() as Record<string, unknown>;
    const scoutDb = getDb('signal-scout');

    const entity = scoutDb.prepare('SELECT id FROM entities WHERE id = ?').get(entityId);
    if (!entity) {
      return NextResponse.json({ error: 'Entity not found' }, { status: 404 });
    }

    const allowed = ['name', 'company', 'industry', 'source', 'status', 'score', 'monetization_flag'];
    const updates = Object.entries(body).filter(([k]) => allowed.includes(k));
    if (updates.length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const setClauses = updates.map(([k]) => `${k} = ?`).join(', ');
    const values = updates.map(([, v]) => v);
    scoutDb.prepare(
      `UPDATE entities SET ${setClauses}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
    ).run(...values, entityId);

    const updated = scoutDb.prepare('SELECT * FROM entities WHERE id = ?').get(entityId);
    return NextResponse.json(updated);
  } catch (err) {
    console.error('Intake PATCH error:', err);
    return NextResponse.json({ error: 'Failed to update entity' }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ entityId: string }> }
) {
  try {
    const { entityId } = await params;
    const scoutDb = getDb('signal-scout');
    const leadDb = getLeadDb();

    const entity = scoutDb.prepare('SELECT id FROM entities WHERE id = ?').get(entityId);
    if (!entity) {
      return NextResponse.json({ error: 'Entity not found' }, { status: 404 });
    }

    scoutDb.prepare('DELETE FROM entities WHERE id = ?').run(entityId);
    leadDb.prepare('DELETE FROM pipeline_state WHERE entity_id = ?').run(entityId);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Intake DELETE error:', err);
    return NextResponse.json({ error: 'Failed to delete entity' }, { status: 500 });
  }
}
