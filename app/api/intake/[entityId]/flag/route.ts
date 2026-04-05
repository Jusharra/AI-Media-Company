import { NextResponse } from 'next/server';
import { getDb } from '@signal/lib/db';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ entityId: string }> }
) {
  try {
    const { entityId } = await params;
    const body = await request.json().catch(() => ({})) as { monetization?: boolean; notes?: string };
    const scoutDb = getDb('signal-scout');

    const entity = scoutDb.prepare('SELECT id, monetization_flag FROM entities WHERE id = ?').get(entityId) as
      { id: string; monetization_flag: number } | undefined;

    if (!entity) {
      return NextResponse.json({ error: 'Entity not found' }, { status: 404 });
    }

    const flagValue = body.monetization !== undefined ? (body.monetization ? 1 : 0) : (entity.monetization_flag ? 0 : 1);

    scoutDb.prepare(
      'UPDATE entities SET monetization_flag = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).run(flagValue, entityId);

    return NextResponse.json({ success: true, entityId, monetization_flag: flagValue });
  } catch (err) {
    console.error('Intake flag error:', err);
    return NextResponse.json({ error: 'Failed to flag entity' }, { status: 500 });
  }
}
