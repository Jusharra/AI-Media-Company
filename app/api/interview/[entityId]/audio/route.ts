import { NextResponse } from 'next/server';
import { getDb } from '@signal/lib/db';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ entityId: string }> }
) {
  try {
    const { entityId } = await params;
    const interviewDb = getDb('interview-engine');

    // Audio recordings are stored as outputs with doc_type 'audio_recording'
    const audio = interviewDb.prepare(
      `SELECT * FROM outputs WHERE entity_id = ? AND doc_type = 'audio_recording' ORDER BY created_at DESC`
    ).all(entityId) as Array<{ id: string; content: string; status: string; created_at: string }>;

    if (audio.length === 0) {
      return NextResponse.json({ error: 'No audio recordings found' }, { status: 404 });
    }

    return NextResponse.json(
      audio.map(a => ({
        ...a,
        content: (() => { try { return JSON.parse(a.content); } catch { return a.content; } })(),
      }))
    );
  } catch (err) {
    console.error('Audio GET error:', err);
    return NextResponse.json({ error: 'Failed to fetch audio' }, { status: 500 });
  }
}
