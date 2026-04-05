import { NextResponse } from 'next/server';
import { getDb } from '@signal/lib/db';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ entityId: string }> }
) {
  try {
    const { entityId } = await params;
    const interviewDb = getDb('interview-engine');

    const transcript = interviewDb.prepare(
      `SELECT * FROM outputs WHERE entity_id = ? AND doc_type = 'transcript' ORDER BY created_at DESC LIMIT 1`
    ).get(entityId) as { id: string; content: string; status: string; created_at: string } | undefined;

    if (!transcript) {
      return NextResponse.json({ error: 'No transcript found' }, { status: 404 });
    }

    return NextResponse.json({
      ...transcript,
      content: (() => { try { return JSON.parse(transcript.content); } catch { return transcript.content; } })(),
    });
  } catch (err) {
    console.error('Transcript GET error:', err);
    return NextResponse.json({ error: 'Failed to fetch transcript' }, { status: 500 });
  }
}
