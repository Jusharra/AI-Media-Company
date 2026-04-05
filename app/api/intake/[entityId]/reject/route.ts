import { NextResponse } from 'next/server';
import { getDb } from '@signal/lib/db';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ entityId: string }> }
) {
  try {
    const { entityId } = await params;
    const body = await request.json().catch(() => ({})) as { reason?: string };
    const scoutDb = getDb('signal-scout');

    const entity = scoutDb.prepare('SELECT id FROM entities WHERE id = ?').get(entityId);
    if (!entity) {
      return NextResponse.json({ error: 'Entity not found' }, { status: 404 });
    }

    scoutDb.prepare(
      `UPDATE entities SET status = 'rejected', updated_at = CURRENT_TIMESTAMP WHERE id = ?`
    ).run(entityId);

    console.log(`[Intake] Rejected entity ${entityId}${body.reason ? `: ${body.reason}` : ''}`);
    return NextResponse.json({ success: true, entityId, status: 'rejected' });
  } catch (err) {
    console.error('Intake reject error:', err);
    return NextResponse.json({ error: 'Failed to reject entity' }, { status: 500 });
  }
}
