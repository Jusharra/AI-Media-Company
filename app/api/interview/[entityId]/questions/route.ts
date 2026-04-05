import { NextResponse } from 'next/server';
import { getDb } from '@signal/lib/db';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ entityId: string }> }
) {
  try {
    const { entityId } = await params;
    const interviewDb = getDb('interview-engine');

    const output = interviewDb.prepare(
      `SELECT * FROM outputs WHERE entity_id = ? AND doc_type = 'interview_questions' ORDER BY created_at DESC LIMIT 1`
    ).get(entityId) as { id: string; content: string; status: string; created_at: string } | undefined;

    if (!output) {
      return NextResponse.json({ error: 'No questions found' }, { status: 404 });
    }

    let questions: unknown;
    try {
      questions = JSON.parse(output.content);
    } catch {
      questions = output.content;
    }

    return NextResponse.json({ id: output.id, questions, status: output.status, created_at: output.created_at });
  } catch (err) {
    console.error('Questions GET error:', err);
    return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });
  }
}
