import { NextResponse } from 'next/server';
import { startPipeline } from '@signal/agents/lead';
import type { IntakeRequest } from '@signal/lib/types';

export async function POST(request: Request) {
  try {
    const intake: IntakeRequest = await request.json();

    if (!intake.name || !intake.industry) {
      return NextResponse.json({ error: 'Name and industry are required' }, { status: 400 });
    }

    const taskId = await startPipeline(intake);
    return NextResponse.json({ taskId, status: 'pipeline_started' });
  } catch (err) {
    console.error('Pipeline start error:', err);
    return NextResponse.json({ error: 'Failed to start pipeline' }, { status: 500 });
  }
}
