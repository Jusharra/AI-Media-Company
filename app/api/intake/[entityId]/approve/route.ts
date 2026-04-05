import { NextResponse } from 'next/server';
import { getDb } from '@signal/lib/db';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ entityId: string }> }
) {
  try {
    const { entityId } = await params;
    const body = await request.json().catch(() => ({})) as { notes?: string };
    const scoutDb = getDb('signal-scout');

    const entity = scoutDb.prepare('SELECT id FROM entities WHERE id = ?').get(entityId);
    if (!entity) {
      return NextResponse.json({ error: 'Entity not found' }, { status: 404 });
    }

    scoutDb.prepare(
      `UPDATE entities SET status = 'approved', updated_at = CURRENT_TIMESTAMP WHERE id = ?`
    ).run(entityId);

    console.log(`[Intake] Approved entity ${entityId}${body.notes ? `: ${body.notes}` : ''}`);
    return NextResponse.json({ success: true, entityId, status: 'approved' });
  } catch (err) {
    console.error('Intake approve error:', err);
    return NextResponse.json({ error: 'Failed to approve entity' }, { status: 500 });
  }
}
