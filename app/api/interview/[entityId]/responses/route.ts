import { NextResponse } from 'next/server';
import { getDb } from '@signal/lib/db';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ entityId: string }> }
) {
  try {
    const { entityId } = await params;
    const interviewDb = getDb('interview-engine');

    const outputs = interviewDb.prepare(
      `SELECT * FROM outputs WHERE entity_id = ? AND doc_type IN ('interview_responses','parsed_transcript') ORDER BY created_at DESC`
    ).all(entityId) as Array<{ id: string; doc_type: string; content: string; status: string; created_at: string }>;

    return NextResponse.json(
      outputs.map(o => ({
        ...o,
        content: (() => { try { return JSON.parse(o.content); } catch { return o.content; } })(),
      }))
    );
  } catch (err) {
    console.error('Responses GET error:', err);
    return NextResponse.json({ error: 'Failed to fetch responses' }, { status: 500 });
  }
}
